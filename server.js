import express from 'express'
import session from 'express-session'
import { createServer as createViteServer } from 'vite'

const app = express()
const port = 5000

app.use(express.json())
app.use(session({
  secret: process.env.SESSION_SECRET || 'local-development-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 12,
  },
}))

app.get('/api/session', (req, res) => {
  res.json({ authenticated: Boolean(req.session.user), user: req.session.user || null })
})

app.post('/api/login', (req, res) => {
  const username = String(req.body?.username || '').trim().toLowerCase()
  const password = String(req.body?.password || '')

  if (username !== 'operator' || password !== 'xtream2026') {
    return res.status(401).json({ message: 'That operator ID or password is not recognized.' })
  }

  req.session.user = { name: 'Operator', role: 'Master access' }
  return res.json({ authenticated: true, user: req.session.user })
})

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ authenticated: false }))
})

const vite = await createViteServer({
  server: { middlewareMode: true, host: true },
})
app.use(vite.middlewares)

app.listen(port, '0.0.0.0', () => {
  console.log(`XTREAM CABLE console listening on port ${port}`)
})