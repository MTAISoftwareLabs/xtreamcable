import express from 'express'
import session from 'express-session'
import pg from 'pg'
import { createServer as createViteServer } from 'vite'

const { Pool } = pg
const app = express()
const port = 5000
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

app.set('trust proxy', 1)
app.use(express.json({ limit: '1mb' }))
app.use(session({
  secret: process.env.SESSION_SECRET || 'local-development-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 12 },
}))

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ message: 'Your operator session has expired.' })
  next()
}

function text(value, fallback = '') {
  return String(value ?? fallback).trim()
}

function positiveInt(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback
}

function dateOrNull(value) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : value
}

async function logActivity(client, eventType, message, entityType = null, entityId = null) {
  await client.query(
    'INSERT INTO activity_logs (event_type, message, entity_type, entity_id) VALUES ($1, $2, $3, $4)',
    [eventType, message, entityType, entityId],
  )
}

async function withTransaction(work) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await work(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

await pool.query('ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS reseller_id INTEGER REFERENCES resellers(id) ON DELETE SET NULL')

app.get('/api/session', (req, res) => {
  res.json({ authenticated: Boolean(req.session.user), user: req.session.user || null })
})

app.post('/api/login', asyncRoute(async (req, res) => {
  const username = text(req.body?.username).toLowerCase()
  const password = String(req.body?.password || '')
  if (username !== 'operator' || password !== 'xtream2026') {
    return res.status(401).json({ message: 'That operator ID or password is not recognized.' })
  }
  req.session.user = { name: 'Operator', role: 'Master access' }
  return res.json({ authenticated: true, user: req.session.user })
}))

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ authenticated: false }))
})

app.get('/api/health', requireAuth, asyncRoute(async (req, res) => {
  const result = await pool.query('SELECT NOW() AS checked_at')
  res.json({ status: 'operational', checkedAt: result.rows[0].checked_at })
}))

app.get('/api/bootstrap', requireAuth, asyncRoute(async (req, res) => {
  const [settings, users, groups, packages, resellers, content, servers, sources, categories, epg, transactions, activity, integrations, invoices, supportRequests] = await Promise.all([
    pool.query('SELECT id, console_name AS "consoleName", timezone, operational_alerts AS "operationalAlerts", session_timeout_minutes AS "sessionTimeoutMinutes", email_notifications AS "emailNotifications", incident_alerts AS "incidentAlerts" FROM console_settings WHERE id = 1'),
    pool.query(`SELECT s.id, s.name, s.username, s.email, s.status, s.expires_at AS "expiresAt", s.package_id AS "packageId", s.group_id AS "groupId", s.reseller_id AS "resellerId", s.created_at AS "createdAt",
      p.name AS "packageName", g.name AS "groupName"
      FROM subscribers s LEFT JOIN packages p ON p.id = s.package_id LEFT JOIN user_groups g ON g.id = s.group_id
      ORDER BY s.created_at DESC`),
    pool.query(`SELECT g.id, g.name, g.description, COUNT(s.id)::int AS "memberCount", g.created_at AS "createdAt"
      FROM user_groups g LEFT JOIN subscribers s ON s.group_id = g.id GROUP BY g.id ORDER BY g.created_at DESC`),
    pool.query(`SELECT id, name, description, duration_days AS "durationDays", price, status, created_at AS "createdAt"
      FROM packages ORDER BY created_at DESC`),
    pool.query(`SELECT r.id, r.name, r.email, r.capacity, r.credits, r.status, r.created_at AS "createdAt",
      COUNT(s.id)::int AS "userCount"
      FROM resellers r LEFT JOIN subscribers s ON s.reseller_id = r.id
      GROUP BY r.id ORDER BY r.created_at DESC`),
    pool.query(`SELECT id, name, content_type AS "contentType", category, country, source, status, created_at AS "createdAt"
      FROM content_items ORDER BY created_at DESC`),
    pool.query(`SELECT id, name, host, status, capacity, created_at AS "createdAt"
      FROM servers ORDER BY created_at DESC`),
    pool.query(`SELECT id, name, url, status, created_at AS "createdAt"
      FROM stream_sources ORDER BY created_at DESC`),
    pool.query(`SELECT id, name, description, content_count AS "contentCount", created_at AS "createdAt"
      FROM content_categories ORDER BY created_at DESC`),
    pool.query(`SELECT id, channel_name AS "channelName", program_name AS "programName", starts_at AS "startsAt", ends_at AS "endsAt", status, created_at AS "createdAt"
      FROM epg_schedules ORDER BY starts_at ASC`),
    pool.query(`SELECT t.id, t.reseller_id AS "resellerId", r.name AS "resellerName", t.amount, t.direction, t.description, t.created_at AS "createdAt"
      FROM credit_transactions t LEFT JOIN resellers r ON r.id = t.reseller_id ORDER BY t.created_at DESC LIMIT 100`),
    pool.query(`SELECT id, event_type AS "eventType", message, entity_type AS "entityType", entity_id AS "entityId", created_at AS "createdAt"
      FROM activity_logs ORDER BY created_at DESC LIMIT 50`),
    pool.query(`SELECT id, slug, name, description, status, updated_at AS "updatedAt"
      FROM console_integrations ORDER BY id ASC`),
    pool.query(`SELECT id, invoice_number AS "invoiceNumber", period_label AS "periodLabel", amount, status, issued_at AS "issuedAt"
      FROM billing_invoices ORDER BY issued_at DESC`),
    pool.query(`SELECT id, subject, message, status, created_at AS "createdAt"
      FROM support_requests ORDER BY created_at DESC LIMIT 10`),
  ])
  const [summary, balance, activityTrend] = await Promise.all([
    pool.query(`SELECT
      (SELECT COUNT(*)::int FROM subscribers WHERE status = 'active') AS "activeSubscribers",
      (SELECT COUNT(*)::int FROM content_items WHERE content_type = 'live_tv' AND status = 'active') AS "liveChannels",
      (SELECT COUNT(*)::int FROM resellers WHERE status = 'active') AS "resellerAccounts",
      (SELECT COUNT(*)::int FROM servers WHERE status = 'operational') AS "operationalServers",
      (SELECT COUNT(*)::int FROM servers) AS "totalServers",
      (SELECT COUNT(*)::int FROM stream_sources WHERE status = 'active') AS "activeSources"`),
    pool.query(`SELECT COALESCE(SUM(CASE WHEN direction = 'issued' THEN amount ELSE 0 END), 0)::int -
      COALESCE(SUM(CASE WHEN direction IN ('transferred','used') THEN amount ELSE 0 END), 0)::int AS balance
      FROM credit_transactions`),
    pool.query(`SELECT TO_CHAR(day, 'YYYY-MM-DD') AS date, COUNT(activity_logs.id)::int AS total,
      COUNT(activity_logs.id) FILTER (WHERE entity_type IN ('source', 'server') OR event_type ILIKE '%stream%')::int AS "streamEvents"
      FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') AS day
      LEFT JOIN activity_logs ON activity_logs.created_at::date = day::date
      GROUP BY day ORDER BY day ASC`),
  ])
  res.json({
    settings: settings.rows[0] || { id: 1, consoleName: 'XTREAM CABLE', timezone: 'Asia/Karachi', operationalAlerts: true, sessionTimeoutMinutes: 720, emailNotifications: true, incidentAlerts: true },
    users: users.rows, groups: groups.rows, packages: packages.rows, resellers: resellers.rows,
    content: content.rows, servers: servers.rows, sources: sources.rows, categories: categories.rows, epg: epg.rows, transactions: transactions.rows,
    activity: activity.rows, integrations: integrations.rows, invoices: invoices.rows, supportRequests: supportRequests.rows,
    activityTrend: activityTrend.rows,
    summary: {
      ...summary.rows[0],
      healthPercent: summary.rows[0].totalServers ? Math.round((summary.rows[0].operationalServers / summary.rows[0].totalServers) * 100) : 0,
      availableCredits: balance.rows[0].balance,
    },
  })
}))

app.get('/api/activity', requireAuth, asyncRoute(async (req, res) => {
  const scope = ['user', 'reseller', 'stream', 'all'].includes(req.query.scope) ? req.query.scope : 'all'
  const query = text(req.query.q).slice(0, 120)
  const eventType = text(req.query.eventType).slice(0, 120)
  const from = dateOrNull(req.query.from)
  const to = dateOrNull(req.query.to)
  const pageSize = Math.min(50, Math.max(5, positiveInt(req.query.pageSize, 10)))
  const page = Math.max(1, positiveInt(req.query.page, 1))
  const params = []
  const conditions = []
  function add(value) {
    params.push(value)
    return `$${params.length}`
  }
  if (scope === 'user') conditions.push(`(entity_type = 'user' OR event_type LIKE 'user.%')`)
  if (scope === 'reseller') conditions.push(`(entity_type IN ('reseller', 'credits') OR event_type LIKE 'reseller.%' OR event_type LIKE 'credits.%')`)
  if (scope === 'stream') conditions.push(`(entity_type IN ('source', 'server') OR event_type ILIKE '%stream%' OR event_type ILIKE '%source%' OR event_type ILIKE '%server%')`)
  if (query) {
    const value = `%${query}%`
    const placeholder = add(value)
    conditions.push(`(message ILIKE ${placeholder} OR event_type ILIKE ${placeholder} OR COALESCE(entity_type, '') ILIKE ${placeholder})`)
  }
  if (eventType) conditions.push(`event_type = ${add(eventType)}`)
  if (from) conditions.push(`created_at >= ${add(from)}`)
  if (to) conditions.push(`created_at < ${add(new Date(new Date(to).getTime() + 24 * 60 * 60 * 1000).toISOString())}`)
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM activity_logs ${where}`, params)
  const total = countResult.rows[0].total
  const offset = (page - 1) * pageSize
  const itemsResult = await pool.query(`SELECT id, event_type AS "eventType", message, entity_type AS "entityType", entity_id AS "entityId", created_at AS "createdAt"
    FROM activity_logs ${where} ORDER BY created_at DESC, id DESC LIMIT ${pageSize} OFFSET ${offset}`, params)
  res.json({ items: itemsResult.rows, total, page, pageSize, hasMore: offset + itemsResult.rows.length < total })
}))

app.get('/api/users', requireAuth, asyncRoute(async (req, res) => {
  const q = text(req.query.q)
  const result = await pool.query(`SELECT s.id, s.name, s.username, s.email, s.status, s.expires_at AS "expiresAt", s.reseller_id AS "resellerId",
    p.name AS "packageName", g.name AS "groupName", s.created_at AS "createdAt"
    FROM subscribers s LEFT JOIN packages p ON p.id = s.package_id LEFT JOIN user_groups g ON g.id = s.group_id
    WHERE ($1 = '' OR s.name ILIKE '%' || $1 || '%' OR s.username ILIKE '%' || $1 || '%' OR s.email ILIKE '%' || $1 || '%')
    ORDER BY s.created_at DESC`, [q])
  res.json({ items: result.rows })
}))

app.post('/api/users', requireAuth, asyncRoute(async (req, res) => {
  const name = text(req.body?.name)
  const username = text(req.body?.username).toLowerCase()
  const email = text(req.body?.email)
  if (!name || !username) return res.status(400).json({ message: 'Name and username are required.' })
  const result = await withTransaction(async (client) => {
    const inserted = await client.query(`INSERT INTO subscribers (name, username, email, status, expires_at, package_id, group_id, reseller_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name, username, email, status, expires_at AS "expiresAt", reseller_id AS "resellerId", created_at AS "createdAt"`,
    [name, username, email, ['active', 'paused', 'expired'].includes(req.body?.status) ? req.body.status : 'active', dateOrNull(req.body?.expiresAt), positiveInt(req.body?.packageId) || null, positiveInt(req.body?.groupId) || null, positiveInt(req.body?.resellerId) || null])
    await logActivity(client, 'user.created', `Subscriber ${name} was created.`, 'user', inserted.rows[0].id)
    return inserted.rows[0]
  })
  res.status(201).json({ item: result })
}))

app.patch('/api/users/:id', requireAuth, asyncRoute(async (req, res) => {
  const id = positiveInt(req.params.id)
  const username = text(req.body?.username).toLowerCase()
  const result = await pool.query(`UPDATE subscribers SET name = COALESCE(NULLIF($1,''), name),
    username = COALESCE(NULLIF($2,''), username), email = COALESCE($3, email), status = COALESCE($4, status), expires_at = COALESCE($5, expires_at),
    package_id = COALESCE($6, package_id), group_id = COALESCE($7, group_id), reseller_id = COALESCE($8, reseller_id)
    WHERE id = $9 RETURNING id, name, username, email, status, expires_at AS "expiresAt", reseller_id AS "resellerId"`,
  [text(req.body?.name), username, req.body?.email == null ? null : text(req.body.email), ['active', 'paused', 'expired'].includes(req.body?.status) ? req.body.status : null, dateOrNull(req.body?.expiresAt), positiveInt(req.body?.packageId) || null, positiveInt(req.body?.groupId) || null, positiveInt(req.body?.resellerId) || null, id])
  if (!result.rowCount) return res.status(404).json({ message: 'Subscriber not found.' })
  await pool.query('INSERT INTO activity_logs (event_type, message, entity_type, entity_id) VALUES ($1, $2, $3, $4)', ['user.updated', `Subscriber ${result.rows[0].name} was updated.`, 'user', id])
  res.json({ item: result.rows[0] })
}))

app.delete('/api/users/:id', requireAuth, asyncRoute(async (req, res) => {
  const result = await pool.query('DELETE FROM subscribers WHERE id = $1 RETURNING name', [positiveInt(req.params.id)])
  if (!result.rowCount) return res.status(404).json({ message: 'Subscriber not found.' })
  await pool.query('INSERT INTO activity_logs (event_type, message, entity_type, entity_id) VALUES ($1, $2, $3, $4)', ['user.deleted', `Subscriber ${result.rows[0].name} was removed.`, 'user', positiveInt(req.params.id)])
  res.status(204).end()
}))

app.get('/api/groups', requireAuth, asyncRoute(async (req, res) => {
  const result = await pool.query(`SELECT g.id, g.name, g.description, COUNT(s.id)::int AS "memberCount", g.created_at AS "createdAt"
    FROM user_groups g LEFT JOIN subscribers s ON s.group_id = g.id GROUP BY g.id ORDER BY g.created_at DESC`)
  res.json({ items: result.rows })
}))

app.post('/api/groups', requireAuth, asyncRoute(async (req, res) => {
  const name = text(req.body?.name)
  if (!name) return res.status(400).json({ message: 'Group name is required.' })
  const result = await withTransaction(async (client) => {
    const inserted = await client.query(`INSERT INTO user_groups (name, description) VALUES ($1, $2)
      RETURNING id, name, description, member_count AS "memberCount", created_at AS "createdAt"`, [name, text(req.body?.description)])
    await logActivity(client, 'group.created', `User group ${name} was created.`, 'group', inserted.rows[0].id)
    return inserted.rows[0]
  })
  res.status(201).json({ item: result })
}))

app.patch('/api/groups/:id', requireAuth, asyncRoute(async (req, res) => {
  const id = positiveInt(req.params.id)
  const name = text(req.body?.name)
  if (!name) return res.status(400).json({ message: 'Group name is required.' })
  const result = await pool.query(`UPDATE user_groups SET name = $1, description = $2 WHERE id = $3
    RETURNING id, name, description, created_at AS "createdAt"`, [name, text(req.body?.description), id])
  if (!result.rowCount) return res.status(404).json({ message: 'User group not found.' })
  await pool.query('INSERT INTO activity_logs (event_type, message, entity_type, entity_id) VALUES ($1, $2, $3, $4)', ['group.updated', `User group ${name} was updated.`, 'group', id])
  res.json({ item: result.rows[0] })
}))

app.delete('/api/groups/:id', requireAuth, asyncRoute(async (req, res) => {
  const id = positiveInt(req.params.id)
  const result = await pool.query('DELETE FROM user_groups WHERE id = $1 RETURNING name', [id])
  if (!result.rowCount) return res.status(404).json({ message: 'User group not found.' })
  await pool.query('INSERT INTO activity_logs (event_type, message, entity_type, entity_id) VALUES ($1, $2, $3, $4)', ['group.deleted', `User group ${result.rows[0].name} was removed.`, 'group', id])
  res.status(204).end()
}))

app.get('/api/packages', requireAuth, asyncRoute(async (req, res) => {
  const result = await pool.query(`SELECT id, name, description, duration_days AS "durationDays", price, status, created_at AS "createdAt"
    FROM packages ORDER BY created_at DESC`)
  res.json({ items: result.rows })
}))

app.post('/api/packages', requireAuth, asyncRoute(async (req, res) => {
  const name = text(req.body?.name)
  const durationDays = positiveInt(req.body?.durationDays, 30)
  const price = Number(req.body?.price || 0)
  if (!name || durationDays < 1 || !Number.isFinite(price) || price < 0) return res.status(400).json({ message: 'Name, duration, and a valid price are required.' })
  const result = await withTransaction(async (client) => {
    const inserted = await client.query(`INSERT INTO packages (name, description, duration_days, price) VALUES ($1, $2, $3, $4)
      RETURNING id, name, description, duration_days AS "durationDays", price, status, created_at AS "createdAt"`, [name, text(req.body?.description), durationDays, price])
    await logActivity(client, 'package.created', `Package ${name} was created.`, 'package', inserted.rows[0].id)
    return inserted.rows[0]
  })
  res.status(201).json({ item: result })
}))

app.patch('/api/packages/:id', requireAuth, asyncRoute(async (req, res) => {
  const id = positiveInt(req.params.id)
  const name = text(req.body?.name)
  const durationDays = positiveInt(req.body?.durationDays, 30)
  const price = Number(req.body?.price || 0)
  if (!name || durationDays < 1 || !Number.isFinite(price) || price < 0) return res.status(400).json({ message: 'Name, duration, and a valid price are required.' })
  const result = await pool.query(`UPDATE packages SET name = $1, description = $2, duration_days = $3, price = $4
    WHERE id = $5 RETURNING id, name, description, duration_days AS "durationDays", price, status, created_at AS "createdAt"`,
  [name, text(req.body?.description), durationDays, price, id])
  if (!result.rowCount) return res.status(404).json({ message: 'Package not found.' })
  await pool.query('INSERT INTO activity_logs (event_type, message, entity_type, entity_id) VALUES ($1, $2, $3, $4)', ['package.updated', `Package ${name} was updated.`, 'package', id])
  res.json({ item: result.rows[0] })
}))

app.delete('/api/packages/:id', requireAuth, asyncRoute(async (req, res) => {
  const id = positiveInt(req.params.id)
  const result = await pool.query('DELETE FROM packages WHERE id = $1 RETURNING name', [id])
  if (!result.rowCount) return res.status(404).json({ message: 'Package not found.' })
  await pool.query('INSERT INTO activity_logs (event_type, message, entity_type, entity_id) VALUES ($1, $2, $3, $4)', ['package.deleted', `Package ${result.rows[0].name} was removed.`, 'package', id])
  res.status(204).end()
}))

app.get('/api/servers', requireAuth, asyncRoute(async (req, res) => {
  const result = await pool.query(`SELECT id, name, host, status, capacity, created_at AS "createdAt"
    FROM servers ORDER BY created_at DESC`)
  res.json({ items: result.rows })
}))

app.post('/api/servers', requireAuth, asyncRoute(async (req, res) => {
  const name = text(req.body?.name)
  const host = text(req.body?.host)
  const capacity = positiveInt(req.body?.capacity, 100)
  if (!name || !host || capacity > 100) return res.status(400).json({ message: 'Server name, host, and a valid capacity are required.' })
  const result = await withTransaction(async (client) => {
    const inserted = await client.query(`INSERT INTO servers (name, host, capacity) VALUES ($1, $2, $3)
      RETURNING id, name, host, status, capacity, created_at AS "createdAt"`, [name, host, capacity])
    await logActivity(client, 'server.created', `Server ${name} was added.`, 'server', inserted.rows[0].id)
    return inserted.rows[0]
  })
  res.status(201).json({ item: result })
}))

app.patch('/api/servers/:id', requireAuth, asyncRoute(async (req, res) => {
  const id = positiveInt(req.params.id)
  const name = text(req.body?.name)
  const host = text(req.body?.host)
  const capacity = positiveInt(req.body?.capacity, 100)
  if (!name || !host || capacity > 100) return res.status(400).json({ message: 'Server name, host, and a valid capacity are required.' })
  const result = await pool.query(`UPDATE servers SET name = $1, host = $2, capacity = $3 WHERE id = $4
    RETURNING id, name, host, status, capacity, created_at AS "createdAt"`, [name, host, capacity, id])
  if (!result.rowCount) return res.status(404).json({ message: 'Server not found.' })
  await pool.query('INSERT INTO activity_logs (event_type, message, entity_type, entity_id) VALUES ($1, $2, $3, $4)', ['server.updated', `Server ${name} was updated.`, 'server', id])
  res.json({ item: result.rows[0] })
}))

app.delete('/api/servers/:id', requireAuth, asyncRoute(async (req, res) => {
  const id = positiveInt(req.params.id)
  const result = await pool.query('DELETE FROM servers WHERE id = $1 RETURNING name', [id])
  if (!result.rowCount) return res.status(404).json({ message: 'Server not found.' })
  await pool.query('INSERT INTO activity_logs (event_type, message, entity_type, entity_id) VALUES ($1, $2, $3, $4)', ['server.deleted', `Server ${result.rows[0].name} was removed.`, 'server', id])
  res.status(204).end()
}))

app.get('/api/sources', requireAuth, asyncRoute(async (req, res) => {
  const result = await pool.query(`SELECT id, name, url, status, created_at AS "createdAt"
    FROM stream_sources ORDER BY created_at DESC`)
  res.json({ items: result.rows })
}))

app.post('/api/sources', requireAuth, asyncRoute(async (req, res) => {
  const name = text(req.body?.name)
  const url = text(req.body?.url)
  if (!name || !url) return res.status(400).json({ message: 'Source name and URL are required.' })
  const result = await withTransaction(async (client) => {
    const inserted = await client.query(`INSERT INTO stream_sources (name, url) VALUES ($1, $2)
      RETURNING id, name, url, status, created_at AS "createdAt"`, [name, url])
    await logActivity(client, 'source.created', `Stream source ${name} was added.`, 'source', inserted.rows[0].id)
    return inserted.rows[0]
  })
  res.status(201).json({ item: result })
}))

app.patch('/api/sources/:id', requireAuth, asyncRoute(async (req, res) => {
  const id = positiveInt(req.params.id)
  const name = text(req.body?.name)
  const url = text(req.body?.url)
  if (!name || !url) return res.status(400).json({ message: 'Source name and URL are required.' })
  const result = await pool.query(`UPDATE stream_sources SET name = $1, url = $2 WHERE id = $3
    RETURNING id, name, url, status, created_at AS "createdAt"`, [name, url, id])
  if (!result.rowCount) return res.status(404).json({ message: 'Stream source not found.' })
  await pool.query('INSERT INTO activity_logs (event_type, message, entity_type, entity_id) VALUES ($1, $2, $3, $4)', ['source.updated', `Stream source ${name} was updated.`, 'source', id])
  res.json({ item: result.rows[0] })
}))

app.delete('/api/sources/:id', requireAuth, asyncRoute(async (req, res) => {
  const id = positiveInt(req.params.id)
  const result = await pool.query('DELETE FROM stream_sources WHERE id = $1 RETURNING name', [id])
  if (!result.rowCount) return res.status(404).json({ message: 'Stream source not found.' })
  await pool.query('INSERT INTO activity_logs (event_type, message, entity_type, entity_id) VALUES ($1, $2, $3, $4)', ['source.deleted', `Stream source ${result.rows[0].name} was removed.`, 'source', id])
  res.status(204).end()
}))

app.get('/api/categories', requireAuth, asyncRoute(async (req, res) => {
  const result = await pool.query(`SELECT id, name, description, content_count AS "contentCount", created_at AS "createdAt"
    FROM content_categories ORDER BY created_at DESC`)
  res.json({ items: result.rows })
}))

app.post('/api/categories', requireAuth, asyncRoute(async (req, res) => {
  const name = text(req.body?.name)
  if (!name) return res.status(400).json({ message: 'Category name is required.' })
  const result = await withTransaction(async (client) => {
    const inserted = await client.query(`INSERT INTO content_categories (name, description) VALUES ($1, $2)
      RETURNING id, name, description, content_count AS "contentCount", created_at AS "createdAt"`, [name, text(req.body?.description)])
    await logActivity(client, 'category.created', `Category ${name} was created.`, 'category', inserted.rows[0].id)
    return inserted.rows[0]
  })
  res.status(201).json({ item: result })
}))

app.patch('/api/categories/:id', requireAuth, asyncRoute(async (req, res) => {
  const id = positiveInt(req.params.id)
  const name = text(req.body?.name)
  if (!name) return res.status(400).json({ message: 'Category name is required.' })
  const result = await pool.query(`UPDATE content_categories SET name = $1, description = $2 WHERE id = $3
    RETURNING id, name, description, content_count AS "contentCount", created_at AS "createdAt"`, [name, text(req.body?.description), id])
  if (!result.rowCount) return res.status(404).json({ message: 'Category not found.' })
  await pool.query('INSERT INTO activity_logs (event_type, message, entity_type, entity_id) VALUES ($1, $2, $3, $4)', ['category.updated', `Category ${name} was updated.`, 'category', id])
  res.json({ item: result.rows[0] })
}))

app.delete('/api/categories/:id', requireAuth, asyncRoute(async (req, res) => {
  const id = positiveInt(req.params.id)
  const result = await pool.query('DELETE FROM content_categories WHERE id = $1 RETURNING name', [id])
  if (!result.rowCount) return res.status(404).json({ message: 'Category not found.' })
  await pool.query('INSERT INTO activity_logs (event_type, message, entity_type, entity_id) VALUES ($1, $2, $3, $4)', ['category.deleted', `Category ${result.rows[0].name} was removed.`, 'category', id])
  res.status(204).end()
}))

app.get('/api/epg', requireAuth, asyncRoute(async (req, res) => {
  const result = await pool.query(`SELECT id, channel_name AS "channelName", program_name AS "programName", starts_at AS "startsAt", ends_at AS "endsAt", status, created_at AS "createdAt"
    FROM epg_schedules ORDER BY starts_at ASC`)
  res.json({ items: result.rows })
}))

app.post('/api/epg', requireAuth, asyncRoute(async (req, res) => {
  const channelName = text(req.body?.channelName)
  const programName = text(req.body?.programName)
  const startsAt = dateOrNull(req.body?.startsAt)
  const endsAt = dateOrNull(req.body?.endsAt)
  if (!channelName || !programName || !startsAt || !endsAt || new Date(endsAt) <= new Date(startsAt)) return res.status(400).json({ message: 'Channel, program, and a valid time range are required.' })
  const result = await withTransaction(async (client) => {
    const inserted = await client.query(`INSERT INTO epg_schedules (channel_name, program_name, starts_at, ends_at)
      VALUES ($1, $2, $3, $4) RETURNING id, channel_name AS "channelName", program_name AS "programName", starts_at AS "startsAt", ends_at AS "endsAt", status, created_at AS "createdAt"`, [channelName, programName, startsAt, endsAt])
    await logActivity(client, 'epg.created', `EPG schedule ${programName} was added.`, 'epg', inserted.rows[0].id)
    return inserted.rows[0]
  })
  res.status(201).json({ item: result })
}))

app.patch('/api/epg/:id', requireAuth, asyncRoute(async (req, res) => {
  const id = positiveInt(req.params.id)
  const channelName = text(req.body?.channelName)
  const programName = text(req.body?.programName)
  const startsAt = dateOrNull(req.body?.startsAt)
  const endsAt = dateOrNull(req.body?.endsAt)
  if (!channelName || !programName || !startsAt || !endsAt || new Date(endsAt) <= new Date(startsAt)) return res.status(400).json({ message: 'Channel, program, and a valid time range are required.' })
  const result = await pool.query(`UPDATE epg_schedules SET channel_name = $1, program_name = $2, starts_at = $3, ends_at = $4
    WHERE id = $5 RETURNING id, channel_name AS "channelName", program_name AS "programName", starts_at AS "startsAt", ends_at AS "endsAt", status, created_at AS "createdAt"`,
  [channelName, programName, startsAt, endsAt, id])
  if (!result.rowCount) return res.status(404).json({ message: 'EPG schedule not found.' })
  await pool.query('INSERT INTO activity_logs (event_type, message, entity_type, entity_id) VALUES ($1, $2, $3, $4)', ['epg.updated', `EPG schedule ${programName} was updated.`, 'epg', id])
  res.json({ item: result.rows[0] })
}))

app.delete('/api/epg/:id', requireAuth, asyncRoute(async (req, res) => {
  const id = positiveInt(req.params.id)
  const result = await pool.query('DELETE FROM epg_schedules WHERE id = $1 RETURNING program_name', [id])
  if (!result.rowCount) return res.status(404).json({ message: 'EPG schedule not found.' })
  await pool.query('INSERT INTO activity_logs (event_type, message, entity_type, entity_id) VALUES ($1, $2, $3, $4)', ['epg.deleted', `EPG schedule ${result.rows[0].program_name} was removed.`, 'epg', id])
  res.status(204).end()
}))

app.get('/api/resellers', requireAuth, asyncRoute(async (req, res) => {
  const q = text(req.query.q)
  const result = await pool.query(`SELECT id, name, email, capacity, credits, status, created_at AS "createdAt" FROM resellers
    WHERE ($1 = '' OR name ILIKE '%' || $1 || '%' OR email ILIKE '%' || $1 || '%') ORDER BY created_at DESC`, [q])
  res.json({ items: result.rows })
}))

app.post('/api/resellers', requireAuth, asyncRoute(async (req, res) => {
  const name = text(req.body?.name)
  const email = text(req.body?.email)
  const capacity = positiveInt(req.body?.capacity, 100)
  const credits = positiveInt(req.body?.credits)
  if (!name || !email || capacity < 1) return res.status(400).json({ message: 'Name, email, and a valid capacity are required.' })
  const result = await withTransaction(async (client) => {
    const inserted = await client.query(`INSERT INTO resellers (name, email, capacity, credits) VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, capacity, credits, status, created_at AS "createdAt"`, [name, email, capacity, credits])
    if (credits > 0) await client.query(`INSERT INTO credit_transactions (reseller_id, amount, direction, description) VALUES ($1, $2, 'issued', $3)`, [inserted.rows[0].id, credits, `Initial allocation for ${name}`])
    await logActivity(client, 'reseller.created', `Reseller ${name} was created.`, 'reseller', inserted.rows[0].id)
    return inserted.rows[0]
  })
  res.status(201).json({ item: result })
}))

app.patch('/api/resellers/:id', requireAuth, asyncRoute(async (req, res) => {
  const result = await pool.query(`UPDATE resellers SET name = COALESCE(NULLIF($1,''), name), email = COALESCE(NULLIF($2,''), email),
    capacity = COALESCE($3, capacity), status = COALESCE($4, status) WHERE id = $5
    RETURNING id, name, email, capacity, credits, status, created_at AS "createdAt"`,
  [text(req.body?.name), text(req.body?.email), positiveInt(req.body?.capacity) || null, ['active', 'suspended'].includes(req.body?.status) ? req.body.status : null, positiveInt(req.params.id)])
  if (!result.rowCount) return res.status(404).json({ message: 'Reseller not found.' })
  await pool.query('INSERT INTO activity_logs (event_type, message, entity_type, entity_id) VALUES ($1, $2, $3, $4)', ['reseller.updated', `Reseller ${result.rows[0].name} was updated.`, 'reseller', positiveInt(req.params.id)])
  res.json({ item: result.rows[0] })
}))

app.delete('/api/resellers/:id', requireAuth, asyncRoute(async (req, res) => {
  const id = positiveInt(req.params.id)
  const result = await pool.query('DELETE FROM resellers WHERE id = $1 RETURNING name', [id])
  if (!result.rowCount) return res.status(404).json({ message: 'Reseller not found.' })
  await pool.query('INSERT INTO activity_logs (event_type, message, entity_type, entity_id) VALUES ($1, $2, $3, $4)', ['reseller.deleted', `Reseller ${result.rows[0].name} was removed.`, 'reseller', id])
  res.status(204).end()
}))

app.get('/api/content', requireAuth, asyncRoute(async (req, res) => {
  const q = text(req.query.q)
  const type = ['live_tv', 'movie', 'series'].includes(req.query.type) ? req.query.type : null
  const result = await pool.query(`SELECT id, name, content_type AS "contentType", category, country, source, status, created_at AS "createdAt"
    FROM content_items WHERE ($1 = '' OR name ILIKE '%' || $1 || '%' OR category ILIKE '%' || $1 || '%')
    AND ($2::text IS NULL OR content_type = $2) ORDER BY created_at DESC`, [q, type])
  res.json({ items: result.rows })
}))

app.post('/api/content', requireAuth, asyncRoute(async (req, res) => {
  const name = text(req.body?.name)
  const contentType = ['live_tv', 'movie', 'series'].includes(req.body?.contentType) ? req.body.contentType : 'live_tv'
  if (!name) return res.status(400).json({ message: 'Content name is required.' })
  const result = await withTransaction(async (client) => {
    const inserted = await client.query(`INSERT INTO content_items (name, content_type, category, country, source)
      VALUES ($1, $2, $3, $4, $5) RETURNING id, name, content_type AS "contentType", category, country, source, status, created_at AS "createdAt"`,
    [name, contentType, text(req.body?.category, 'Entertainment'), text(req.body?.country, 'International'), text(req.body?.source, 'Primary origin')])
    await logActivity(client, 'content.created', `${name} was added to the content library.`, 'content', inserted.rows[0].id)
    return inserted.rows[0]
  })
  res.status(201).json({ item: result })
}))

app.patch('/api/content/:id', requireAuth, asyncRoute(async (req, res) => {
  const contentType = ['live_tv', 'movie', 'series'].includes(req.body?.contentType) ? req.body.contentType : null
  const result = await pool.query(`UPDATE content_items SET name = COALESCE(NULLIF($1,''), name),
    content_type = COALESCE($2, content_type), category = COALESCE(NULLIF($3,''), category), country = COALESCE(NULLIF($4,''), country),
    source = COALESCE(NULLIF($5,''), source), status = COALESCE($6, status) WHERE id = $7
    RETURNING id, name, content_type AS "contentType", category, country, source, status`,
  [text(req.body?.name), contentType, text(req.body?.category), text(req.body?.country), text(req.body?.source), ['active', 'disabled'].includes(req.body?.status) ? req.body.status : null, positiveInt(req.params.id)])
  if (!result.rowCount) return res.status(404).json({ message: 'Content item not found.' })
  await pool.query('INSERT INTO activity_logs (event_type, message, entity_type, entity_id) VALUES ($1, $2, $3, $4)', ['content.updated', `Content ${result.rows[0].name} was updated.`, 'content', positiveInt(req.params.id)])
  res.json({ item: result.rows[0] })
}))

app.delete('/api/content/:id', requireAuth, asyncRoute(async (req, res) => {
  const id = positiveInt(req.params.id)
  const result = await pool.query('DELETE FROM content_items WHERE id = $1 RETURNING name', [id])
  if (!result.rowCount) return res.status(404).json({ message: 'Content item not found.' })
  await pool.query('INSERT INTO activity_logs (event_type, message, entity_type, entity_id) VALUES ($1, $2, $3, $4)', ['content.deleted', `${result.rows[0].name} was removed from the library.`, 'content', id])
  res.status(204).end()
}))

app.get('/api/credits', requireAuth, asyncRoute(async (req, res) => {
  const [transactions, balance] = await Promise.all([
    pool.query(`SELECT t.id, t.reseller_id AS "resellerId", r.name AS "resellerName", t.amount, t.direction, t.description, t.created_at AS "createdAt"
      FROM credit_transactions t LEFT JOIN resellers r ON r.id = t.reseller_id ORDER BY t.created_at DESC LIMIT 100`),
    pool.query(`SELECT COALESCE(SUM(CASE WHEN direction = 'issued' THEN amount ELSE 0 END), 0)::int -
      COALESCE(SUM(CASE WHEN direction IN ('transferred','used') THEN amount ELSE 0 END), 0)::int AS balance FROM credit_transactions`),
  ])
  res.json({ balance: balance.rows[0].balance, transactions: transactions.rows })
}))

app.post('/api/credits/issue', requireAuth, asyncRoute(async (req, res) => {
  const amount = positiveInt(req.body?.amount)
  if (amount < 1) return res.status(400).json({ message: 'Enter a valid amount to issue.' })
  const result = await withTransaction(async (client) => {
    const inserted = await client.query(`INSERT INTO credit_transactions (reseller_id, amount, direction, description)
      VALUES (NULL, $1, 'issued', $2) RETURNING id, amount, direction, description, created_at AS "createdAt"`,
    [amount, 'Master balance issue'])
    await logActivity(client, 'credits.issued', `${amount} credits were issued to the master balance.`, 'credits', inserted.rows[0].id)
    return inserted.rows[0]
  })
  res.status(201).json({ item: result })
}))

app.post('/api/credits/transfer', requireAuth, asyncRoute(async (req, res) => {
  const resellerId = positiveInt(req.body?.resellerId)
  const amount = positiveInt(req.body?.amount)
  if (!resellerId || amount < 1) return res.status(400).json({ message: 'Choose a reseller and enter a valid amount.' })
  const result = await withTransaction(async (client) => {
    const balance = await client.query(`SELECT COALESCE(SUM(CASE WHEN direction = 'issued' THEN amount ELSE 0 END), 0)::int -
      COALESCE(SUM(CASE WHEN direction IN ('transferred','used') THEN amount ELSE 0 END), 0)::int AS balance FROM credit_transactions`)
    if (Number(balance.rows[0].balance) < amount) {
      const error = new Error('The master balance does not have enough credits for this transfer.')
      error.status = 400
      throw error
    }
    const reseller = await client.query('SELECT id, name FROM resellers WHERE id = $1 FOR UPDATE', [resellerId])
    if (!reseller.rowCount) {
      const error = new Error('Reseller not found.')
      error.status = 404
      throw error
    }
    await client.query('UPDATE resellers SET credits = credits + $1 WHERE id = $2', [amount, resellerId])
    const inserted = await client.query(`INSERT INTO credit_transactions (reseller_id, amount, direction, description)
      VALUES ($1, $2, 'transferred', $3) RETURNING id, amount, direction, description, created_at AS "createdAt"`,
    [resellerId, amount, `Transfer to ${reseller.rows[0].name}`])
    await logActivity(client, 'credits.transferred', `${amount} credits transferred to ${reseller.rows[0].name}.`, 'reseller', resellerId)
    return inserted.rows[0]
  })
  res.status(201).json({ item: result })
}))

app.get('/api/settings', requireAuth, asyncRoute(async (req, res) => {
  const result = await pool.query('SELECT id, console_name AS "consoleName", timezone, operational_alerts AS "operationalAlerts", session_timeout_minutes AS "sessionTimeoutMinutes", email_notifications AS "emailNotifications", incident_alerts AS "incidentAlerts" FROM console_settings WHERE id = 1')
  res.json({ settings: result.rows[0] })
}))

app.get('/api/integrations', requireAuth, asyncRoute(async (req, res) => {
  const result = await pool.query(`SELECT id, slug, name, description, status, updated_at AS "updatedAt"
    FROM console_integrations ORDER BY id ASC`)
  res.json({ items: result.rows })
}))

app.patch('/api/integrations/:id', requireAuth, asyncRoute(async (req, res) => {
  const id = positiveInt(req.params.id)
  const status = ['available', 'configured', 'disabled'].includes(req.body?.status) ? req.body.status : null
  if (!status) return res.status(400).json({ message: 'A valid integration status is required.' })
  const result = await pool.query(`UPDATE console_integrations SET status = $1, updated_at = NOW()
    WHERE id = $2 RETURNING id, slug, name, description, status, updated_at AS "updatedAt"`, [status, id])
  if (!result.rowCount) return res.status(404).json({ message: 'Integration not found.' })
  await pool.query('INSERT INTO activity_logs (event_type, message, entity_type, entity_id) VALUES ($1, $2, $3, $4)', ['integration.updated', `Integration ${result.rows[0].name} is now ${status}.`, 'integration', id])
  res.json({ item: result.rows[0] })
}))

app.get('/api/billing/invoices', requireAuth, asyncRoute(async (req, res) => {
  const result = await pool.query(`SELECT id, invoice_number AS "invoiceNumber", period_label AS "periodLabel", amount, status, issued_at AS "issuedAt"
    FROM billing_invoices ORDER BY issued_at DESC`)
  res.json({ items: result.rows })
}))

app.patch('/api/settings', requireAuth, asyncRoute(async (req, res) => {
  const consoleName = text(req.body?.consoleName, 'XTREAM CABLE').slice(0, 80)
  const timezone = text(req.body?.timezone, 'Asia/Karachi')
  const sessionTimeoutMinutes = [30, 60, 240, 720].includes(Number(req.body?.sessionTimeoutMinutes)) ? Number(req.body.sessionTimeoutMinutes) : 720
  const result = await pool.query(`UPDATE console_settings SET console_name = $1, timezone = $2,
    operational_alerts = $3, session_timeout_minutes = $4, email_notifications = $5, incident_alerts = $6, updated_at = NOW() WHERE id = 1
    RETURNING id, console_name AS "consoleName", timezone, operational_alerts AS "operationalAlerts", session_timeout_minutes AS "sessionTimeoutMinutes", email_notifications AS "emailNotifications", incident_alerts AS "incidentAlerts"`,
  [consoleName, timezone, req.body?.operationalAlerts !== false, sessionTimeoutMinutes, req.body?.emailNotifications !== false, req.body?.incidentAlerts !== false])
  req.session.cookie.maxAge = sessionTimeoutMinutes * 60 * 1000
  res.json({ settings: result.rows[0] })
}))

app.post('/api/support', requireAuth, asyncRoute(async (req, res) => {
  const subject = text(req.body?.subject)
  const message = text(req.body?.message)
  if (!subject || !message) return res.status(400).json({ message: 'Subject and message are required.' })
  const result = await pool.query(`INSERT INTO support_requests (subject, message) VALUES ($1, $2)
    RETURNING id, subject, message, status, created_at AS "createdAt"`, [subject, message])
  await pool.query('INSERT INTO activity_logs (event_type, message) VALUES ($1, $2)', ['support.created', `Support request "${subject}" was submitted.`])
  res.status(201).json({ item: result.rows[0] })
}))

app.use((error, req, res, next) => {
  console.error(error)
  if (res.headersSent) return next(error)
  const status = error.code === '23505' ? 409 : error.status || 500
  const message = error.code === '23505' ? 'That record already exists.' : status === 500 ? 'The server could not complete that request.' : error.message
  res.status(status).json({ message })
})

const vite = await createViteServer({ server: { middlewareMode: true, host: true } })
app.use(vite.middlewares)

app.listen(port, '0.0.0.0', () => {
  console.log(`XTREAM CABLE console listening on port ${port}`)
})