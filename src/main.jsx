import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Activity,
  AlertCircle,
  ArrowDownToLine,
  ArrowRight,
  Bell,
  Box,
  Boxes,
  Cable,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  CircleUserRound,
  Clapperboard,
  CreditCard,
  Database,
  Download,
  Eye,
  FileCode2,
  Film,
  Gauge,
  HelpCircle,
  LayoutDashboard,
  ListFilter,
  LogOut,
  Menu,
  MoreHorizontal,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Signal,
  SlidersHorizontal,
  Sparkles,
  Tv,
  Upload,
  UserRound,
  Users,
  UserRoundCog,
  WalletCards,
  X,
  Zap,
} from 'lucide-react'
import './styles.css'

const accent = '#28d8f2'
const logoPath = '/attached_assets/logo_1788516695953.png'

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.message || 'The request could not be completed.')
  return payload
}

function formatDate(value) {
  if (!value) return 'Just now'
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function downloadCsv(filename, rows) {
  if (!rows.length) return
  const keys = Object.keys(rows[0])
  const csv = [keys.join(','), ...rows.map((row) => keys.map((key) => `"${String(row[key] ?? '').replaceAll('"', '""')}"`).join(','))].join('\n')
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

const navGroups = [
  { label: 'Workspace', items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    label: 'Users',
    items: [
      { id: 'users', label: 'All Users', icon: Users },
      { id: 'user-groups', label: 'User Groups', icon: UserRoundCog },
      { id: 'packages', label: 'Packages', icon: Package },
      { id: 'user-activity', label: 'User Activity', icon: Activity },
      { id: 'expiring', label: 'Expiring Users', icon: CalendarDays },
    ],
  },
  {
    label: 'Resellers',
    items: [
      { id: 'resellers', label: 'Reseller Accounts', icon: UserRound },
      { id: 'credits', label: 'Credits', icon: WalletCards },
      { id: 'transactions', label: 'Transactions', icon: ArrowDownToLine },
      { id: 'commissions', label: 'Commissions', icon: Boxes },
      { id: 'reseller-activity', label: 'Reseller Activity', icon: Activity },
    ],
  },
  {
    label: 'Content',
    items: [
      { id: 'live-tv', label: 'Live TV', icon: Tv },
      { id: 'movies', label: 'Movies / VOD', icon: Film },
      { id: 'series', label: 'TV Series', icon: Clapperboard },
      { id: 'categories', label: 'Categories', icon: Box },
      { id: 'epg', label: 'EPG', icon: CalendarDays },
    ],
  },
  {
    label: 'Infrastructure',
    items: [
      { id: 'servers', label: 'Servers', icon: Server },
      { id: 'streams', label: 'Streams', icon: Radio },
      { id: 'stream-sources', label: 'Stream Sources', icon: Signal },
      { id: 'monitoring', label: 'Stream Monitoring', icon: Activity },
      { id: 'stream-logs', label: 'Stream Logs', icon: FileCode2 },
    ],
  },
  {
    label: 'Insights',
    items: [
      { id: 'analytics', label: 'Analytics', icon: Gauge },
      { id: 'integrations', label: 'API & Integrations', icon: FileCode2 },
    ],
  },
]

const utilityItems = [
  { id: 'support', label: 'Support', icon: HelpCircle },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const pageMeta = {
  dashboard: { eyebrow: 'Master console', title: 'Dashboard', description: 'A live operational overview of your XTREAM CABLE network.' },
  users: { eyebrow: 'User operations', title: 'All Users', description: 'Manage subscriber access, plans, and account health from one workspace.' },
  'user-groups': { eyebrow: 'User operations', title: 'User Groups', description: 'Organize subscribers into access groups and service segments.' },
  packages: { eyebrow: 'User operations', title: 'Packages', description: 'Create and maintain the plans available to your subscriber base.' },
  'user-activity': { eyebrow: 'User operations', title: 'User Activity', description: 'Review account events and recent subscriber activity.' },
  expiring: { eyebrow: 'User operations', title: 'Expiring Users', description: 'A dedicated operational workspace for this Xtream Cable control surface.' },
  resellers: { eyebrow: 'Channel operations', title: 'Reseller accounts', description: 'Manage partner accounts, allocated credits, commissions, and user capacity.' },
  credits: { eyebrow: 'Channel operations', title: 'Credits', description: 'Track issued, used, and available reseller credit in one auditable ledger.' },
  transactions: { eyebrow: 'Channel operations', title: 'Transactions', description: 'Review all credit movements across your partner network.' },
  commissions: { eyebrow: 'Channel operations', title: 'Commissions', description: 'Monitor partner earnings and payout status.' },
  'reseller-activity': { eyebrow: 'Channel operations', title: 'Reseller activity', description: 'Follow the latest activity from your reseller channel.' },
  'live-tv': { eyebrow: 'Content library', title: 'Live TV', description: 'Organize channels, categories, logos, countries, and EPG associations.' },
  movies: { eyebrow: 'Content library', title: 'Movies / VOD', description: 'Manage your on-demand library and playback metadata.' },
  series: { eyebrow: 'Content library', title: 'TV Series', description: 'Manage series, seasons, episodes, and artwork.' },
  categories: { eyebrow: 'Content library', title: 'Categories', description: 'Keep your content catalog organized for fast discovery.' },
  epg: { eyebrow: 'Content library', title: 'EPG', description: 'Connect program guides to channels and keep schedules current.' },
  servers: { eyebrow: 'Infrastructure', title: 'Servers', description: 'Monitor origins, capacity, and the health of your streaming fleet.' },
  streams: { eyebrow: 'Infrastructure', title: 'Streams', description: 'Inspect active streams and playback capacity.' },
  'stream-sources': { eyebrow: 'Infrastructure', title: 'Stream sources', description: 'Configure and manage upstream stream sources.' },
  monitoring: { eyebrow: 'Stream monitoring', title: 'Stream Monitoring', description: 'A dedicated operational workspace for this Xtream Cable control surface.' },
  'stream-logs': { eyebrow: 'Infrastructure', title: 'Stream logs', description: 'Investigate stream events and delivery errors.' },
  analytics: { eyebrow: 'Insights', title: 'Analytics', description: 'Understand growth, retention, and platform performance.' },
  integrations: { eyebrow: 'Insights', title: 'API & Integrations', description: 'Connect the tools that keep your cable operation moving.' },
  support: { eyebrow: 'Workspace', title: 'Support', description: 'Find answers and contact the XTREAM CABLE operations team.' },
  billing: { eyebrow: 'Workspace', title: 'Billing', description: 'Manage your plan, invoices, and payment settings.' },
  settings: { eyebrow: 'Workspace', title: 'Settings', description: 'Configure your master console and account preferences.' },
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [data, setData] = useState(null)
  const [dataError, setDataError] = useState('')
  const [dataLoading, setDataLoading] = useState(false)
  const [activePage, setActivePage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [openGroups, setOpenGroups] = useState(() => ({ Users: true, Resellers: true, Content: true, Infrastructure: true, Insights: true }))
  const [search, setSearch] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState(null)
  useEffect(() => {
    if (!toast) return undefined
    const timeout = setTimeout(() => setToast(null), 3600)
    return () => clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    fetch('/api/session', { credentials: 'include' })
      .then((response) => response.json())
      .then((data) => setIsLoggedIn(Boolean(data.authenticated)))
      .catch(() => setIsLoggedIn(false))
      .finally(() => setAuthChecked(true))
  }, [])

  async function refreshData() {
    setDataLoading(true)
    setDataError('')
    try {
      setData(await apiRequest('/api/bootstrap'))
    } catch (error) {
      setDataError(error.message)
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    if (isLoggedIn) refreshData()
  }, [isLoggedIn])

  async function handleLogin(username, password) {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      })
      const data = await response.json()
      if (!response.ok) return { ok: false, message: data.message || 'Unable to sign in.' }
      setIsLoggedIn(true)
      return { ok: true }
    } catch {
      return { ok: false, message: 'The sign-in service is unavailable. Try again.' }
    }
  }

  const current = pageMeta[activePage] || pageMeta.dashboard
  const allNavItems = [...navGroups.flatMap((group) => group.items), ...utilityItems]
  const searchMatches = useMemo(() => {
    if (!search.trim()) return []
    return allNavItems.filter((item) => item.label.toLowerCase().includes(search.toLowerCase())).slice(0, 6)
  }, [search])

  function navigate(id) {
    setActivePage(id)
    setSidebarOpen(false)
    setSearch('')
    setNotificationsOpen(false)
    setProfileOpen(false)
  }

  async function logout() {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
    setIsLoggedIn(false)
  }

  function showToast(message, type = 'success') {
    setToast({ message, type })
  }

  async function runMutation(path, options, successMessage) {
    try {
      await apiRequest(path, options)
      await refreshData()
      setModal(null)
      showToast(successMessage)
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  function jsonOptions(method, body) {
    return { method, body: JSON.stringify(body) }
  }

  if (!data && isLoggedIn && (dataLoading || !dataError)) {
    return <AuthLoadingScreen />
  }

  if (!authChecked) {
    return <AuthLoadingScreen />
  }

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />
  }

  if (dataError && !data) {
    return <DataErrorScreen message={dataError} onRetry={refreshData} onLogout={logout} />
  }

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        openGroups={openGroups}
        setOpenGroups={setOpenGroups}
        navigate={navigate}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={sidebarOpen}
        closeMobile={() => setSidebarOpen(false)}
        onLogout={logout}
      />
      <main className={`main-shell ${sidebarCollapsed ? 'main-shell-collapsed' : ''}`}>
        <Topbar
          current={current}
          search={search}
          setSearch={setSearch}
          searchMatches={searchMatches}
          navigate={navigate}
          notificationsOpen={notificationsOpen}
          setNotificationsOpen={setNotificationsOpen}
          profileOpen={profileOpen}
          setProfileOpen={setProfileOpen}
          onLogout={logout}
          onMenu={() => setSidebarOpen(true)}
        />
        <div className="page-scroll">
          <div className="page-content">
            {searchMatches.length > 0 && (
              <div className="global-search-results">
                <span className="search-results-label">Jump to</span>
                {searchMatches.map((item) => (
                  <button key={item.id} onClick={() => navigate(item.id)}><item.icon size={15} />{item.label}<ArrowRight size={13} /></button>
                ))}
              </div>
            )}
            {activePage === 'dashboard' ? (
              <Dashboard
                summary={data.summary}
                activity={data.activity}
                onAction={(action) => {
                  if (typeof action === 'string') setModal(action)
                  if (action?.type === 'settings') runMutation('/api/settings', jsonOptions('PATCH', action.form), 'Settings saved')
                  if (action?.type === 'support') runMutation('/api/support', jsonOptions('POST', action.form), 'Support request submitted')
                  if (action?.type === 'delete-reseller') runMutation(`/api/resellers/${action.id}`, { method: 'DELETE' }, 'Reseller account deleted')
                  if (action?.type === 'delete-user') runMutation(`/api/users/${action.id}`, { method: 'DELETE' }, 'Subscriber account deleted')
                  if (action?.type === 'delete-content') runMutation(`/api/content/${action.id}`, { method: 'DELETE' }, 'Content item deleted')
                  if (action?.type === 'delete-server') runMutation(`/api/servers/${action.id}`, { method: 'DELETE' }, 'Server deleted')
                  if (action?.type === 'delete-source') runMutation(`/api/sources/${action.id}`, { method: 'DELETE' }, 'Stream source deleted')
                  if (action?.type === 'delete-category') runMutation(`/api/categories/${action.id}`, { method: 'DELETE' }, 'Category deleted')
                  if (action?.type === 'delete-epg') runMutation(`/api/epg/${action.id}`, { method: 'DELETE' }, 'EPG schedule deleted')
                }}
                navigate={navigate}
              />
            ) : (
              <OperationalPage
                page={activePage}
                meta={current}
                data={data}
                onAction={(action) => {
                  if (typeof action === 'string') setModal(action)
                  if (action?.type === 'settings') runMutation('/api/settings', jsonOptions('PATCH', action.form), 'Settings saved')
                  if (action?.type === 'support') runMutation('/api/support', jsonOptions('POST', action.form), 'Support request submitted')
                  if (action?.type === 'delete-reseller') runMutation(`/api/resellers/${action.id}`, { method: 'DELETE' }, 'Reseller account deleted')
                  if (action?.type === 'delete-user') runMutation(`/api/users/${action.id}`, { method: 'DELETE' }, 'Subscriber account deleted')
                  if (action?.type === 'delete-content') runMutation(`/api/content/${action.id}`, { method: 'DELETE' }, 'Content item deleted')
                  if (action?.type === 'delete-server') runMutation(`/api/servers/${action.id}`, { method: 'DELETE' }, 'Server deleted')
                  if (action?.type === 'delete-source') runMutation(`/api/sources/${action.id}`, { method: 'DELETE' }, 'Stream source deleted')
                  if (action?.type === 'delete-category') runMutation(`/api/categories/${action.id}`, { method: 'DELETE' }, 'Category deleted')
                  if (action?.type === 'delete-epg') runMutation(`/api/epg/${action.id}`, { method: 'DELETE' }, 'EPG schedule deleted')
                }}
                navigate={navigate}
                showToast={showToast}
              />
            )}
          </div>
        </div>
      </main>
      {modal && (
        <BackendModal
          type={modal}
          resellers={data.resellers}
          packages={data.packages}
          groups={data.groups}
          onClose={() => setModal(null)}
          onSubmit={(type, form) => {
            if (type === 'reseller') return runMutation('/api/resellers', jsonOptions('POST', form), 'Reseller account created')
            if (type === 'content') return runMutation('/api/content', jsonOptions('POST', form), 'Content added to your library')
            if (type === 'user') return runMutation('/api/users', jsonOptions('POST', form), 'Subscriber account created')
            if (type === 'group') return runMutation('/api/groups', jsonOptions('POST', form), 'User group created')
            if (type === 'package') return runMutation('/api/packages', jsonOptions('POST', form), 'Subscriber package created')
            if (type === 'server') return runMutation('/api/servers', jsonOptions('POST', form), 'Server added')
            if (type === 'source') return runMutation('/api/sources', jsonOptions('POST', form), 'Stream source added')
            if (type === 'category') return runMutation('/api/categories', jsonOptions('POST', form), 'Content category created')
            if (type === 'epg') return runMutation('/api/epg', jsonOptions('POST', form), 'EPG schedule created')
            return runMutation('/api/credits/transfer', jsonOptions('POST', form), `${form.amount} credits transferred successfully`)
          }}
        />
      )}
      {toast && <div className={`toast ${toast.type}`}><span className="toast-icon"><Check size={15} /></span>{toast.message}<button onClick={() => setToast(null)}><X size={14} /></button></div>}
    </div>
  )
}

function AuthLoadingScreen() {
  return <div className="auth-loading"><div className="logo-surface loading-logo-surface"><img src={logoPath} alt="XTREAM CABLE" /></div><span>Securing operator session…</span></div>
}

function DataErrorScreen({ message, onRetry, onLogout }) {
  return <div className="auth-loading"><div className="logo-surface loading-logo-surface"><img src={logoPath} alt="XTREAM CABLE" /></div><AlertCircle size={18} color="#ff99a8" /><strong>Console data unavailable</strong><span>{message}</span><div className="data-error-actions"><button className="primary-button" onClick={onRetry}><RefreshCw size={14} />Try again</button><button className="outline-button" onClick={onLogout}>Sign out</button></div></div>
}

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    const result = await onLogin(username, password)
    if (!result.ok) setError(result.message)
  }

  return (
    <div className="login-screen">
      <div className="login-glow login-glow-one" />
      <div className="login-glow login-glow-two" />
      <div className="login-grid" />
      <div className="login-brand">
        <div className="logo-surface login-logo-surface"><img src={logoPath} alt="XTREAM CABLE" /></div>
        <small>MASTER CONSOLE</small>
      </div>
      <div className="login-card">
        <div className="login-card-top"><span className="status-dot" />SECURE OPERATOR ACCESS</div>
        <h1>Welcome back<span>.</span></h1>
        <p className="login-intro">Sign in to manage your streaming network.</p>
        <form onSubmit={submit}>
          <label>Operator ID<input autoFocus value={username} onChange={(event) => { setUsername(event.target.value); setError('') }} placeholder="Enter your operator ID" autoComplete="username" /></label>
          <label>Password<div className="password-wrap"><input value={password} onChange={(event) => { setPassword(event.target.value); setError('') }} type={showPassword ? 'text' : 'password'} placeholder="Enter your password" autoComplete="current-password" /><button type="button" onClick={() => setShowPassword((value) => !value)}><Eye size={16} /></button></div></label>
          {error && <div className="login-error"><AlertCircle size={15} />{error}</div>}
          <div className="login-options"><label className="check-label"><input type="checkbox" defaultChecked /> <span>Remember this device</span></label><button type="button" className="text-button">Forgot password?</button></div>
          <button className="primary-button login-button" type="submit">Sign in to console <ArrowRight size={16} /></button>
        </form>
        <div className="demo-access"><span>Demo access</span><strong>operator</strong><i>/</i><strong>xtream2026</strong></div>
      </div>
      <div className="login-footer"><span><ShieldCheck size={14} />Encrypted operator session</span><span>© 2026 XTREAM CABLE</span></div>
    </div>
  )
}

function Sidebar({ activePage, openGroups, setOpenGroups, navigate, collapsed, setCollapsed, mobileOpen, closeMobile, onLogout }) {
  function renderGroup(group) {
    const open = openGroups[group.label]
    return (
      <div className="nav-group" key={group.label}>
        <button className="nav-group-title" onClick={() => setOpenGroups((groups) => ({ ...groups, [group.label]: !open }))}>
          <span>{group.label}</span><ChevronDown size={13} className={open ? '' : 'rotate-closed'} />
        </button>
        {open && <div className="nav-items">{group.items.map((item) => <NavItem key={item.id} item={item} active={activePage === item.id} collapsed={collapsed} onClick={() => navigate(item.id)} />)}</div>}
      </div>
    )
  }
  return (
    <>
      {mobileOpen && <button className="mobile-overlay" aria-label="Close navigation" onClick={closeMobile} />}
      <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
        <div className="sidebar-header">
          <button className="brand-lockup" onClick={() => navigate('dashboard')} aria-label="Go to dashboard">
            <div className="logo-surface sidebar-logo-surface"><img src={logoPath} alt="XTREAM CABLE" /></div>
            {!collapsed && <span className="sidebar-console-label">MASTER<br />CONSOLE</span>}
          </button>
          <button className="collapse-button" onClick={() => setCollapsed((value) => !value)}>{collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}</button>
        </div>
        <div className="sidebar-nav">
          {navGroups.map(renderGroup)}
          <div className="sidebar-divider" />
          <div className="nav-group utility-group">{utilityItems.map((item) => <NavItem key={item.id} item={item} active={activePage === item.id} collapsed={collapsed} onClick={() => navigate(item.id)} />)}</div>
        </div>
        <div className="sidebar-bottom">
          {!collapsed && <div className="operator-card"><div className="avatar">OP</div><div><strong>Operator</strong><small>Master access</small></div><button onClick={onLogout} aria-label="Sign out"><LogOut size={15} /></button></div>}
          {collapsed && <button className="collapsed-avatar" onClick={onLogout}>OP</button>}
          {!collapsed && <div className="sidebar-version"><span className="online-dot" />System operational <span>v1.0.0</span></div>}
        </div>
      </aside>
    </>
  )
}

function NavItem({ item, active, collapsed, onClick }) {
  const Icon = item.icon
  return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick} title={collapsed ? item.label : undefined}><Icon size={16} strokeWidth={1.8} /><span>{item.label}</span>{active && <i className="active-pip" />}</button>
}

function Topbar({ current, search, setSearch, searchMatches, navigate, notificationsOpen, setNotificationsOpen, profileOpen, setProfileOpen, onLogout, onMenu }) {
  return (
    <header className="topbar">
      <div className="mobile-header"><button onClick={onMenu}><Menu size={21} /></button><div className="logo-surface mobile-logo-surface"><img src={logoPath} alt="XTREAM CABLE" /></div></div>
      <div className="breadcrumbs"><span>MASTER CONSOLE</span><ChevronRight size={12} /><strong>{current.eyebrow.toUpperCase()}</strong><b>{current.title}</b></div>
      <div className="topbar-actions">
        <div className={`command-search ${searchMatches.length ? 'has-results' : ''}`}><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search command" /><kbd>⌘ K</kbd>{search && <button onClick={() => setSearch('')}><X size={13} /></button>}</div>
        <div className="topbar-divider" />
        <div className="popover-wrap"><button className="icon-button notification-button" onClick={() => { setNotificationsOpen((value) => !value); setProfileOpen(false) }}><Bell size={17} /><i /></button>{notificationsOpen && <div className="popover notification-popover"><div className="popover-heading"><div><strong>Notifications</strong><small>System updates</small></div><span className="new-label">2 new</span></div><div className="notification-row"><span className="notification-icon cyan"><Activity size={15} /></span><div><strong>Stream monitoring is ready</strong><small>Configure your first source to begin</small></div></div><div className="notification-row"><span className="notification-icon purple"><Sparkles size={15} /></span><div><strong>Welcome to your console</strong><small>Your workspace has been provisioned</small></div></div></div>}</div>
        <div className="popover-wrap"><button className="profile-button" onClick={() => { setProfileOpen((value) => !value); setNotificationsOpen(false) }}><span className="avatar small">OP</span><ChevronDown size={13} /></button>{profileOpen && <div className="popover profile-popover"><div className="profile-summary"><span className="avatar">OP</span><div><strong>Operator</strong><small>Master access</small></div></div><button><Settings size={14} /> Account settings</button><button onClick={onLogout}><LogOut size={14} /> Sign out</button></div>}</div>
      </div>
    </header>
  )
}

function Dashboard({ summary, activity, onAction, navigate }) {
  const metrics = summary || {}
  return (
    <div className="dashboard-page">
      <div className="hero-row"><div><div className="eyebrow"><span className="eyebrow-line" />MASTER CONSOLE</div><h1>Good morning, Operator<span>.</span></h1><p className="page-description">Here’s what’s happening across your XTREAM CABLE network today.</p></div><div className="date-chip"><CalendarDays size={15} />Friday, Sep 04, 2026</div></div>
      <div className="metric-grid">
        <MetricCard label="Active subscribers" value={metrics.activeSubscribers || 0} meta="From the subscriber ledger" icon={Users} tone="cyan" />
        <MetricCard label="Live channels" value={metrics.liveChannels || 0} meta="Across all sources" icon={Tv} tone="purple" />
        <MetricCard label="Online streams" value="0" meta="No active sessions" icon={Radio} tone="green" />
        <MetricCard label="Reseller accounts" value={metrics.resellerAccounts || 0} meta="Partner accounts" icon={UserRound} tone="orange" />
      </div>
      <div className="dashboard-grid">
        <section className="panel quick-panel"><div className="panel-heading"><div><span className="section-kicker">SHORTCUTS</span><h2>Quick actions</h2></div><span className="muted-label">Get started</span></div><div className="quick-actions"><QuickAction icon={Users} title="Add a user" description="Create a subscriber account" onClick={() => navigate('users')} /><QuickAction icon={UserRound} title="Add reseller" description="Extend your distribution channel" onClick={() => onAction('reseller')} /><QuickAction icon={Tv} title="Add content" description="Onboard a live channel or VOD" onClick={() => onAction('content')} /><QuickAction icon={WalletCards} title="Transfer credits" description="Fund a reseller account" onClick={() => onAction('credits')} /></div></section>
        <section className="panel health-panel"><div className="panel-heading"><div><span className="section-kicker">SYSTEM HEALTH</span><h2>Network status</h2></div><span className="status-badge"><i />Operational</span></div><div className="health-status"><div className="health-ring"><div><strong>100%</strong><small>healthy</small></div></div><div className="health-list"><HealthRow label="Core services" status="Operational" /><HealthRow label="Stream delivery" status="Ready" /><HealthRow label="API gateway" status="Online" /></div></div><button className="panel-link" onClick={() => navigate('monitoring')}>Open stream monitoring <ArrowRight size={14} /></button></section>
      </div>
       <section className="panel activity-panel"><div className="panel-heading"><div><span className="section-kicker">ACTIVITY</span><h2>Recent activity</h2></div><button className="panel-link" onClick={() => navigate('user-activity')}>View all <ArrowRight size={14} /></button></div>{activity?.length ? <ActivityList items={activity.slice(0, 3)} /> : <EmptyState compact icon={Activity} title="No activity recorded" description="Events will appear here as your platform starts working." />}</section>
    </div>
  )
}

function MetricCard({ label, value, meta, icon: Icon, tone }) {
  return <div className="metric-card"><div className={`metric-icon ${tone}`}><Icon size={18} /></div><div className="metric-content"><span>{label}</span><strong>{value}</strong><small>{meta}</small></div><MoreHorizontal size={16} className="metric-more" /></div>
}

function QuickAction({ icon: Icon, title, description, onClick }) {
  return <button className="quick-action" onClick={onClick}><span className="quick-icon"><Icon size={17} /></span><span><strong>{title}</strong><small>{description}</small></span><ArrowRight size={15} /></button>
}

function HealthRow({ label, status }) {
  return <div className="health-row"><span><i className="online-dot" />{label}</span><strong>{status}</strong></div>
}

function OperationalPage({ page, meta, data, onAction, navigate, showToast }) {
  const emptyPages = ['expiring', 'user-groups', 'user-activity', 'transactions', 'commissions', 'reseller-activity', 'movies', 'series', 'categories', 'epg', 'streams', 'stream-sources', 'stream-logs']
  const isResellers = page === 'resellers'
  const isCredits = page === 'credits'
  const isLiveTv = page === 'live-tv'
  const isMovies = page === 'movies'
  const isSeries = page === 'series'
  const isMonitoring = page === 'monitoring'
  const filteredContent = isMovies ? data.content.filter((item) => item.contentType === 'movie') : isSeries ? data.content.filter((item) => item.contentType === 'series') : data.content.filter((item) => item.contentType === 'live_tv')
  const resellers = data.resellers || []
  const content = data.content || []
  const isCategory = page === 'categories'
  const isEpg = page === 'epg'
  const isServer = page === 'servers'
  const isSource = page === 'stream-sources'
  const hasItems = isResellers ? resellers.length > 0 : (isLiveTv || isMovies || isSeries) ? filteredContent.length > 0 : false
  const actionType = isResellers ? 'reseller' : isCredits ? 'credits' : (isLiveTv || isMovies || isSeries) ? 'content' : null
  const resolvedActionType = isResellers ? 'reseller' : isCredits ? 'credits' : (isLiveTv || isMovies || isSeries) ? 'content' : page === 'users' ? 'user' : page === 'user-groups' ? 'group' : page === 'packages' ? 'package' : isCategory ? 'category' : isEpg ? 'epg' : isServer ? 'server' : isSource ? 'source' : null
  const actionLabel = isResellers ? 'Add reseller' : isCredits ? 'Transfer credits' : isLiveTv ? 'Add content' : isMovies ? 'Add movie' : isSeries ? 'Add series' : page === 'users' ? 'Add user' : page === 'user-groups' ? 'Add group' : page === 'packages' ? 'Add package' : isCategory ? 'Add category' : isEpg ? 'Add schedule' : isServer ? 'Add server' : isSource ? 'Add source' : null

  return (
    <div className="operational-page">
      <div className="page-heading-row"><div><div className="eyebrow"><span className="eyebrow-line" />{meta.eyebrow.toUpperCase()}</div><h1>{meta.title}</h1><p className="page-description">{meta.description}</p></div>{actionLabel && <button className="primary-button" onClick={() => onAction(resolvedActionType)}><Plus size={16} />{actionLabel}</button>}</div>
      {isMonitoring ? <MonitoringView onExport={() => showToast('Monitoring report exported')} /> : isServer ? <ServersView servers={data.servers} onAdd={() => onAction('server')} onDelete={(id) => onAction({ type: 'delete-server', id })} /> : page === 'analytics' ? <AnalyticsView summary={data.summary} /> : page === 'integrations' ? <IntegrationsView showToast={showToast} /> : page === 'settings' ? <SettingsView settings={data.settings} onSave={(form) => onAction({ type: 'settings', form })} /> : page === 'support' ? <SupportView onSubmit={(form) => onAction({ type: 'support', form })} /> : page === 'billing' ? <BillingView /> : page === 'users' ? <UsersView users={data.users} packages={data.packages} groups={data.groups} onAction={() => onAction('user')} onDelete={(id) => onAction({ type: 'delete-user', id })} /> : isResellers && hasItems ? <ResellerTable resellers={resellers} onDelete={(id) => onAction({ type: 'delete-reseller', id })} /> : (isLiveTv || isMovies || isSeries) && hasItems ? <ContentTable content={filteredContent} onDelete={(id) => onAction({ type: 'delete-content', id })} /> : isCredits ? <CreditsView credits={data.summary.availableCredits || 0} transactions={data.transactions} resellers={resellers} onAction={() => onAction('credits')} /> : page === 'user-groups' ? <ManagedList title="User groups" items={data.groups} emptyTitle="No user groups created" emptyDescription="Create a group to organize access and simplify subscriber management." action={() => onAction('group')} actionLabel="Add group" /> : page === 'packages' ? <ManagedList title="Subscriber packages" items={data.packages} emptyTitle="No packages created" emptyDescription="Create a package to start assigning plans to subscribers." action={() => onAction('package')} actionLabel="Add package" /> : isCategory ? <ManagedList title="Content categories" items={data.categories} emptyTitle="No categories created" emptyDescription="Create categories to keep your catalog organized." action={() => onAction('category')} actionLabel="Add category" valueKey="contentCount" onDelete={(id) => onAction({ type: 'delete-category', id })} /> : isSource ? <ManagedList title="Stream sources" items={data.sources} emptyTitle="No stream sources configured" emptyDescription="Connect a source to start delivering content." action={() => onAction('source')} actionLabel="Add source" valueKey="url" onDelete={(id) => onAction({ type: 'delete-source', id })} /> : isEpg ? <EpgList items={data.epg} onDelete={(id) => onAction({ type: 'delete-epg', id })} /> : page === 'user-activity' ? <ActivityPage items={data.activity} /> : emptyPages.includes(page) || (!hasItems && (isResellers || isLiveTv || isMovies || isSeries)) ? <EmptyWorkspace page={page} actionType={actionType} onAction={onAction} /> : <GenericWorkspace page={page} navigate={navigate} />}
    </div>
  )
}

function EmptyWorkspace({ page, actionType, onAction }) {
  const config = {
    expiring: ['No expiring users yet', 'Your platform is ready to get started. Data will appear when activity begins.', CalendarDays],
    'user-groups': ['No user groups created', 'Create a group to organize access and simplify subscriber management.', UserRoundCog],
    'user-activity': ['No user activity yet', 'Account events will appear here as your platform starts working.', Activity],
    transactions: ['No transactions yet', 'Credit movements will be recorded once activity begins.', ArrowDownToLine],
    commissions: ['No commission activity', 'Partner earnings will appear once reseller sales are recorded.', WalletCards],
    'reseller-activity': ['No reseller activity yet', 'Partner account events will appear here.', Activity],
    'live-tv': ['No live channels added', 'Add your first channel when content onboarding begins.', Tv],
    movies: ['No movies added', 'Add your first VOD title to build your library.', Film],
    series: ['No TV series added', 'Your series library will appear here once content is onboarded.', Clapperboard],
    categories: ['No categories created', 'Create categories to keep your catalog organized.', Boxes],
    epg: ['No EPG schedules connected', 'Connect a program guide to populate your channel schedules.', CalendarDays],
    streams: ['No active streams', 'Active playback sessions will appear here in real time.', Radio],
    'stream-sources': ['No stream sources configured', 'Connect a source to start delivering content.', Signal],
    'stream-logs': ['No stream logs yet', 'Stream events will be recorded once delivery begins.', FileCode2],
  }[page] || ['Nothing here yet', 'Data will appear here as activity begins.', Box]
  return <div className="empty-workspace"><EmptyState icon={config[2]} title={config[0]} description={config[1]} action={actionType ? { label: page === 'credits' ? 'Transfer credits' : page === 'resellers' ? 'Add reseller' : 'Add content', onClick: () => onAction(actionType) } : undefined} /></div>
}

function EmptyState({ icon: Icon, title, description, action, compact = false }) {
  return <div className={`empty-state ${compact ? 'empty-compact' : ''}`}><div className="empty-illustration"><Icon size={25} /><span /></div><h3>{title}</h3><p>{description}</p>{action && <button className="secondary-cyan-button" onClick={action.onClick}><Plus size={15} />{action.label}</button>}</div>
}

function ResellerTable({ resellers, onDelete }) {
  const [query, setQuery] = useState('')
  const filtered = resellers.filter((item) => `${item.name} ${item.email}`.toLowerCase().includes(query.toLowerCase()))
  return <div className="data-panel"><div className="toolbar"><div className="table-search"><Search size={15} /><input placeholder="Search reseller accounts" value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="toolbar-actions"><button className="filter-button">All statuses <ChevronDown size={13} /></button><button className="outline-button" onClick={() => downloadCsv('resellers.csv', filtered)}><Download size={14} />Export</button></div></div><div className="table-wrap"><table><thead><tr><th>Account</th><th>Status</th><th>Users</th><th>Credits</th><th>Created</th><th /></tr></thead><tbody>{filtered.map((reseller) => <tr key={reseller.id}><td><div className="table-identity"><span className="table-avatar">{reseller.name.slice(0, 2).toUpperCase()}</span><div><strong>{reseller.name}</strong><small>{reseller.email}</small></div></div></td><td><span className={`status-badge ${reseller.status === 'suspended' ? 'status-warning' : ''}`}><i />{reseller.status}</span></td><td>0 / {reseller.capacity}</td><td>{reseller.credits}</td><td>{formatDate(reseller.createdAt)}</td><td><button className="table-more danger-action" onClick={() => onDelete(reseller.id)} aria-label={`Delete ${reseller.name}`}><X size={15} /></button></td></tr>)}</tbody></table></div></div>
}

function ContentTable({ content, onDelete }) {
  const [query, setQuery] = useState('')
  const filtered = content.filter((item) => `${item.name} ${item.category} ${item.country}`.toLowerCase().includes(query.toLowerCase()))
  return <div className="data-panel"><div className="toolbar"><div className="table-search"><Search size={15} /><input placeholder="Search content" value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="toolbar-actions"><button className="filter-button">All statuses <ChevronDown size={13} /></button><button className="outline-button" onClick={() => downloadCsv('content.csv', filtered)}><Download size={14} />Export</button></div></div><div className="table-wrap"><table><thead><tr><th>Content</th><th>Category</th><th>Source</th><th>Status</th><th /></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><div className="table-identity"><span className="channel-avatar"><Tv size={15} /></span><div><strong>{item.name}</strong><small>{item.country} · {item.contentType}</small></div></div></td><td>{item.category}</td><td>{item.source}</td><td><span className="status-badge"><i />{item.status}</span></td><td><button className="table-more danger-action" onClick={() => onDelete(item.id)} aria-label={`Delete ${item.name}`}><X size={15} /></button></td></tr>)}</tbody></table></div></div>
}

function CreditsView({ credits, transactions, onAction }) {
  return <><div className="credit-summary-grid"><div className="credit-balance"><div><span className="section-kicker">AVAILABLE BALANCE</span><strong>{Number(credits).toLocaleString()}</strong><small>credits ready to allocate</small></div><div className="credit-symbol"><WalletCards size={23} /></div></div><div className="mini-stat"><span>Issued this month</span><strong>{transactions.filter((item) => item.direction === 'issued').reduce((sum, item) => sum + Number(item.amount), 0)}</strong><small>From the credit ledger</small></div><div className="mini-stat"><span>Transferred</span><strong>{transactions.filter((item) => item.direction === 'transferred').reduce((sum, item) => sum + Number(item.amount), 0)}</strong><small>Across reseller accounts</small></div></div>{transactions.length ? <div className="data-panel credit-ledger"><div className="toolbar"><div><span className="section-kicker">AUDITABLE LEDGER</span><h2>Credit activity</h2></div><button className="outline-button" onClick={() => downloadCsv('credit-ledger.csv', transactions)}><Download size={14} />Export</button></div><div className="table-wrap"><table><thead><tr><th>Reseller</th><th>Direction</th><th>Amount</th><th>Description</th><th>Date</th></tr></thead><tbody>{transactions.map((item) => <tr key={item.id}><td>{item.resellerName || 'Master balance'}</td><td><span className={`direction-badge ${item.direction}`}>{item.direction}</span></td><td>{item.amount}</td><td>{item.description}</td><td>{formatDate(item.createdAt)}</td></tr>)}</tbody></table></div></div> : <div className="empty-workspace credit-empty"><EmptyState icon={WalletCards} title="No credit activity" description="Credits will be recorded once they are issued or transferred." action={{ label: 'Transfer credits', onClick: onAction }} /></div>}</>
}

function MonitoringView({ onExport }) {
  return <><div className="monitor-toolbar"><div><CalendarDays size={15} />All time <span>— no activity recorded</span></div><div><button className="outline-button"><SlidersHorizontal size={14} />Date range</button><button className="primary-button small-button" onClick={onExport}><Download size={14} />Export</button></div></div><div className="monitor-grid"><div className="chart-panel panel"><span className="section-kicker">STREAM MONITORING SIGNAL</span><div className="chart-area"><div className="chart-grid-lines" /><div className="chart-labels">{['01','02','03','04','05','06','07','08','09','10','11','12'].map((label) => <span key={label}>{label}</span>)}</div></div></div><div className="panel summary-panel"><span className="section-kicker">SUMMARY</span><div className="summary-list"><div><span>Observed events</span><strong>0</strong></div><div><span>Reportable periods</span><strong>0</strong></div><div><span>Data completeness</span><strong>0%</strong></div><div><span>Last refresh</span><strong>Not yet</strong></div></div></div></div></>
}

function ServersView({ servers, onAdd, onDelete }) {
  return <div className="server-cards">{servers.map((server) => <div className="server-card" key={server.id}><div className="server-card-header"><span className="server-icon"><Server size={18} /></span><div><span className={`status-badge ${server.status !== 'operational' ? 'status-warning' : ''}`}><i />{server.status}</span><button className="table-more danger-action" onClick={() => onDelete(server.id)} aria-label={`Delete ${server.name}`}><X size={15} /></button></div></div><h3>{server.name}</h3><p>{server.host}</p><div className="server-stat"><span>Capacity</span><strong>{server.capacity}%</strong></div><div className="progress"><i style={{ width: `${server.capacity}%` }} /></div></div>)}<div className="server-card add-server-card"><span className="add-circle"><Plus size={18} /></span><h3>Add a server</h3><p>Connect an origin to expand your delivery network.</p><button className="outline-button" onClick={onAdd}>Configure server <ArrowRight size={14} /></button></div></div>
}

function AnalyticsView() {
  return <div className="analytics-layout"><div className="panel analytics-main"><div className="panel-heading"><div><span className="section-kicker">AUDIENCE OVERVIEW</span><h2>Subscriber growth</h2></div><button className="filter-button">Last 30 days <ChevronDown size={13} /></button></div><div className="analytics-empty"><div className="bar-placeholder"><i /><i /><i /><i /><i /><i /><i /></div><p>Analytics will populate as your network receives traffic.</p></div></div><div className="panel insight-card"><div className="metric-icon cyan"><Zap size={18} /></div><span className="section-kicker">INSIGHT</span><h3>Build your first audience</h3><p>Add subscribers and content to unlock network insights.</p></div></div>
}

function IntegrationsView({ showToast }) {
  return <div className="integrations-grid"><IntegrationCard icon={Cable} name="XTREAM API" description="Connect your panel to external applications." status="Ready to configure" onClick={() => showToast('XTREAM API setup opened')} /><IntegrationCard icon={FileCode2} name="Webhooks" description="Send platform events to your own systems." status="Not configured" onClick={() => showToast('Webhook configuration opened')} /><IntegrationCard icon={Database} name="Data export" description="Move your operational data securely." status="Available" onClick={() => showToast('Export center opened')} /></div>
}

function IntegrationCard({ icon: Icon, name, description, status, onClick }) {
  return <div className="integration-card"><div className="integration-icon"><Icon size={20} /></div><div><span className="section-kicker">{status}</span><h3>{name}</h3><p>{description}</p></div><button className="outline-button" onClick={onClick}>Configure <ArrowRight size={14} /></button></div>
}

function SettingsView({ settings, onSave }) {
  const [form, setForm] = useState({ consoleName: settings?.consoleName || 'XTREAM CABLE', timezone: settings?.timezone || 'Asia/Karachi', operationalAlerts: settings?.operationalAlerts !== false })
  useEffect(() => {
    if (settings) setForm({ consoleName: settings.consoleName, timezone: settings.timezone, operationalAlerts: settings.operationalAlerts })
  }, [settings])
  return <div className="settings-layout"><div className="settings-nav panel"><button className="active"><Settings size={15} />General</button><button><ShieldCheck size={15} />Security</button><button><Bell size={15} />Notifications</button></div><div className="settings-form panel"><div className="panel-heading"><div><span className="section-kicker">CONSOLE SETTINGS</span><h2>General preferences</h2></div></div><label>Console name<input value={form.consoleName} onChange={(event) => setForm({ ...form, consoleName: event.target.value })} /></label><label>Timezone<select value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })}><option>Asia/Karachi</option><option>UTC</option><option>Europe/London</option></select></label><label className="toggle-label"><span><strong>Operational alerts</strong><small>Receive updates about your network health.</small></span><input type="checkbox" checked={form.operationalAlerts} onChange={(event) => setForm({ ...form, operationalAlerts: event.target.checked })} /><i /></label><button className="primary-button" onClick={() => onSave(form)}>Save changes <Check size={15} /></button></div></div>
}

function SupportView({ onSubmit }) {
  const [form, setForm] = useState({ subject: '', message: '' })
  return <div className="support-layout"><div className="panel support-hero"><span className="support-icon"><CircleHelp size={24} /></span><span className="section-kicker">OPERATOR SUPPORT</span><h2>How can we help?</h2><p>Browse the operational guide or reach out to the XTREAM CABLE team.</p><div className="support-form"><input placeholder="Subject" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} /><textarea placeholder="Describe what you need help with" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} /><button className="primary-button" onClick={() => onSubmit(form)}>Submit support request <ArrowRight size={15} /></button></div></div><div className="support-topics">{['Getting started', 'Managing subscribers', 'Content onboarding', 'Stream delivery'].map((topic) => <button key={topic}><span>{topic}</span><ArrowRight size={14} /></button>)}</div></div>
}

function BillingView() {
  return <div className="billing-layout"><div className="panel plan-card"><span className="section-kicker">CURRENT PLAN</span><h2>Master Console</h2><p>Your operational workspace is ready for configuration.</p><div className="plan-details"><span><Check size={14} />Unlimited operations</span><span><Check size={14} />Stream monitoring</span><span><Check size={14} />Reseller management</span></div><button className="outline-button">View plan details <ArrowRight size={14} /></button></div><div className="panel invoice-card"><div className="panel-heading"><div><span className="section-kicker">BILLING HISTORY</span><h2>Invoices</h2></div></div><EmptyState compact icon={CreditCard} title="No invoices yet" description="Your billing history will appear here." /></div></div>
}

function UsersView({ users, onAction, onDelete }) {
  const [query, setQuery] = useState('')
  const filtered = users.filter((item) => `${item.name} ${item.username} ${item.email}`.toLowerCase().includes(query.toLowerCase()))
  return <div className="data-panel users-empty-panel"><div className="toolbar"><div className="table-search"><Search size={15} /><input placeholder="Search users" value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="toolbar-actions"><button className="filter-button">All statuses <ChevronDown size={13} /></button><button className="outline-button" onClick={() => downloadCsv('subscribers.csv', filtered)}><Download size={14} />Export</button></div></div>{users.length ? <div className="table-wrap"><table><thead><tr><th>Subscriber</th><th>Status</th><th>Package</th><th>Group</th><th>Expires</th><th /></tr></thead><tbody>{filtered.map((user) => <tr key={user.id}><td><div className="table-identity"><span className="table-avatar">{user.name.slice(0, 2).toUpperCase()}</span><div><strong>{user.name}</strong><small>@{user.username} · {user.email || 'No email'}</small></div></div></td><td><span className="status-badge"><i />{user.status}</span></td><td>{user.packageName || 'Unassigned'}</td><td>{user.groupName || 'Unassigned'}</td><td>{user.expiresAt ? formatDate(user.expiresAt) : 'No expiry'}</td><td><button className="table-more danger-action" onClick={() => onDelete(user.id)} aria-label={`Delete ${user.name}`}><X size={15} /></button></td></tr>)}</tbody></table></div> : <EmptyState icon={Users} title="No users yet" description="Create your first subscriber account to begin managing access." action={{ label: 'Add user', onClick: onAction }} />}</div>
}

function ActivityList({ items }) {
  return <div className="activity-list">{items.map((item) => <div className="activity-row" key={item.id}><span className="activity-dot" /><div><strong>{item.message}</strong><small>{formatDate(item.createdAt)}</small></div></div>)}</div>
}

function ManagedList({ title, items, emptyTitle, emptyDescription, action, actionLabel = 'Add', valueKey, onDelete }) {
  return <div className="data-panel managed-list-panel"><div className="toolbar"><div><span className="section-kicker">MANAGEMENT</span><h2>{title}</h2></div><button className="primary-button" onClick={action}><Plus size={15} />{actionLabel}</button></div>{items.length ? <div className="managed-list">{items.map((item) => <div className="managed-row" key={item.id}><span className="managed-icon"><Box size={16} /></span><div><strong>{item.name}</strong><small>{item.description || item.url || `${item.memberCount || 0} members`}</small></div><span className="managed-value">{valueKey === 'url' ? 'Ready' : valueKey === 'contentCount' ? `${item.contentCount || 0} items` : title === 'Subscriber packages' ? `$${Number(item.price || 0).toFixed(2)} · ${item.durationDays} days` : `${item.memberCount || 0} members`}</span>{onDelete ? <button className="table-more danger-action" onClick={() => onDelete(item.id)} aria-label={`Delete ${item.name}`}><X size={15} /></button> : <button className="table-more"><MoreHorizontal size={16} /></button>}</div>)}</div> : <EmptyState icon={Box} title={emptyTitle} description={emptyDescription} action={{ label: actionLabel, onClick: action }} />}</div>
}

function EpgList({ items, onDelete }) {
  return <div className="data-panel managed-list-panel"><div className="toolbar"><div><span className="section-kicker">CONTENT LIBRARY</span><h2>EPG schedules</h2></div><span className="muted-label">{items.length} scheduled</span></div>{items.length ? <div className="managed-list">{items.map((item) => <div className="managed-row" key={item.id}><span className="managed-icon epg-icon"><CalendarDays size={16} /></span><div><strong>{item.programName}</strong><small>{item.channelName} · {formatDate(item.startsAt)}</small></div><span className="managed-value">{item.status}</span><button className="table-more danger-action" onClick={() => onDelete(item.id)} aria-label={`Delete ${item.programName}`}><X size={15} /></button></div>)}</div> : <EmptyState icon={CalendarDays} title="No EPG schedules connected" description="Connect a program guide to populate your channel schedules." />}</div>
}

function ActivityPage({ items }) {
  return <div className="data-panel activity-page-panel"><div className="toolbar"><div><span className="section-kicker">AUDIT LOG</span><h2>User and console activity</h2></div><span className="muted-label">{items.length} events</span></div>{items.length ? <ActivityList items={items} /> : <EmptyState icon={Activity} title="No user activity yet" description="Account events will appear here as your platform starts working." />}</div>
}

function GenericWorkspace({ page, navigate }) {
  return <div className="generic-card panel"><div className="generic-icon"><Sparkles size={21} /></div><span className="section-kicker">WORKSPACE READY</span><h2>{pageMeta[page]?.title || 'Workspace'} is ready to configure</h2><p>This section is provisioned for your operation. Add data or connect a source to begin.</p><button className="outline-button" onClick={() => navigate('dashboard')}>Return to dashboard <ArrowRight size={14} /></button></div>
}

function BackendModal({ type, resellers, packages, groups, onClose, onSubmit }) {
  const initialForm = type === 'reseller'
    ? { name: '', email: '', capacity: '100', credits: '0' }
    : type === 'content'
      ? { name: '', category: 'Entertainment', country: 'Pakistan', source: 'Primary origin', contentType: 'live_tv' }
      : type === 'user'
        ? { name: '', username: '', email: '', expiresAt: '', packageId: '', groupId: '' }
        : type === 'group'
          ? { name: '', description: '' }
          : type === 'package'
            ? { name: '', description: '', durationDays: '30', price: '0' }
            : { amount: '', resellerId: '' }
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const meta = {
    reseller: ['Add reseller account', 'Create a partner account with an initial allocation.'],
    content: ['Add live content', 'Add a channel to your live TV library.'],
    user: ['Add subscriber account', 'Create a subscriber with access and expiry settings.'],
    group: ['Add user group', 'Organize subscribers into a reusable access group.'],
    package: ['Add subscriber package', 'Create a plan that can be assigned to subscribers.'],
    credits: ['Transfer credits', 'Allocate credits to a reseller account.'],
  }[type]
  function update(key, value) { setForm((current) => ({ ...current, [key]: value })); setError('') }
  function submit(event) {
    event.preventDefault()
    if (type === 'user' && (!form.name.trim() || !form.username.trim())) return setError('Name and username are required.')
    if ((type === 'group' || type === 'package') && !form.name.trim()) return setError('A name is required.')
    if (type === 'credits' && (!form.resellerId || Number(form.amount) < 1)) return setError('Choose a reseller and enter a valid amount.')
    if ((type === 'reseller' || type === 'content') && !form.name.trim()) return setError(type === 'reseller' ? 'Add a reseller name to continue.' : 'Add a channel name to continue.')
    onSubmit(type, form)
  }
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><div className="modal-card"><div className="modal-header"><div><span className="section-kicker">MASTER CONSOLE</span><h2>{meta[0]}</h2><p>{meta[1]}</p></div><button className="close-button" onClick={onClose}><X size={17} /></button></div><form onSubmit={submit}>
    {type === 'reseller' && <><label>Account name<input autoFocus value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. North Star IPTV" /></label><label>Email address<input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="partner@example.com" /></label><div className="form-row"><label>User capacity<input type="number" min="1" value={form.capacity} onChange={(event) => update('capacity', event.target.value)} /></label><label>Starting credits<input type="number" min="0" value={form.credits} onChange={(event) => update('credits', event.target.value)} /></label></div></>}
    {type === 'content' && <><label>Content type<select value={form.contentType} onChange={(event) => update('contentType', event.target.value)}><option value="live_tv">Live TV</option><option value="movie">Movie / VOD</option><option value="series">TV Series</option></select></label><label>Content name<input autoFocus value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. XTREAM News" /></label><div className="form-row"><label>Category<select value={form.category} onChange={(event) => update('category', event.target.value)}><option>Entertainment</option><option>News</option><option>Sports</option><option>Kids</option></select></label><label>Country<select value={form.country} onChange={(event) => update('country', event.target.value)}><option>Pakistan</option><option>United Kingdom</option><option>United States</option><option>International</option></select></label></div><label>Stream source<input value={form.source} onChange={(event) => update('source', event.target.value)} placeholder="Primary origin" /></label></>}
    {type === 'user' && <><label>Subscriber name<input autoFocus value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Ahmed Khan" /></label><div className="form-row"><label>Username<input value={form.username} onChange={(event) => update('username', event.target.value)} placeholder="ahmed_khan" /></label><label>Email address<input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="subscriber@example.com" /></label></div><div className="form-row"><label>Package<select value={form.packageId} onChange={(event) => update('packageId', event.target.value)}><option value="">No package</option>{packages.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Group<select value={form.groupId} onChange={(event) => update('groupId', event.target.value)}><option value="">No group</option>{groups.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div><label>Expires on<input type="date" value={form.expiresAt} onChange={(event) => update('expiresAt', event.target.value)} /></label></>}
    {type === 'group' && <><label>Group name<input autoFocus value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Premium subscribers" /></label><label>Description<textarea value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="What access does this group have?" /></label></>}
    {type === 'package' && <><label>Package name<input autoFocus value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Gold 30 days" /></label><label>Description<textarea value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Describe the subscriber plan" /></label><div className="form-row"><label>Duration (days)<input type="number" min="1" value={form.durationDays} onChange={(event) => update('durationDays', event.target.value)} /></label><label>Price<input type="number" min="0" step="0.01" value={form.price} onChange={(event) => update('price', event.target.value)} /></label></div></>}
    {type === 'credits' && <><div className="transfer-callout"><WalletCards size={20} /><div><strong>Available to transfer</strong><span>Choose a reseller and amount below</span></div></div><label>Destination reseller<select autoFocus value={form.resellerId} onChange={(event) => update('resellerId', event.target.value)}><option value="" disabled>Select a reseller</option>{resellers.filter((item) => item.status === 'active').map((item) => <option key={item.id} value={item.id}>{item.name} · {item.credits} credits</option>)}</select></label><label>Credit amount<input type="number" min="1" value={form.amount} onChange={(event) => update('amount', event.target.value)} placeholder="Enter amount" /></label></>}
    {error && <div className="form-error"><AlertCircle size={14} />{error}</div>}<div className="modal-actions"><button type="button" className="outline-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button">{type === 'credits' ? 'Transfer credits' : 'Create and continue'}<ArrowRight size={15} /></button></div></form></div></div>
}

function Modal({ type, onClose, onAddReseller, onAddContent, onTransfer }) {
  const [form, setForm] = useState(type === 'reseller' ? { name: '', email: '', capacity: '100', credits: '0' } : type === 'content' ? { name: '', category: 'Entertainment', country: 'Pakistan', source: 'Primary origin' } : { amount: '' })
  const [error, setError] = useState('')
  const title = type === 'reseller' ? 'Add reseller account' : type === 'content' ? 'Add live content' : 'Transfer credits'
  const description = type === 'reseller' ? 'Create a partner account with an initial allocation.' : type === 'content' ? 'Add a channel to your live TV library.' : 'Allocate credits to your reseller network.'
  function update(key, value) { setForm((current) => ({ ...current, [key]: value })); setError('') }
  function submit(event) {
    event.preventDefault()
    if (type === 'reseller') {
      if (!form.name.trim() || !form.email.trim()) return setError('Add a reseller name and email to continue.')
      onAddReseller(form)
    } else if (type === 'content') {
      if (!form.name.trim()) return setError('Add a channel name to continue.')
      onAddContent(form)
    } else {
      if (!form.amount || Number(form.amount) <= 0) return setError('Enter a credit amount greater than zero.')
      onTransfer(form.amount)
    }
  }
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><div className="modal-card"><div className="modal-header"><div><span className="section-kicker">MASTER CONSOLE</span><h2>{title}</h2><p>{description}</p></div><button className="close-button" onClick={onClose}><X size={17} /></button></div><form onSubmit={submit}>{type === 'reseller' && <><label>Account name<input autoFocus value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. North Star IPTV" /></label><label>Email address<input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="partner@example.com" /></label><div className="form-row"><label>User capacity<input type="number" min="1" value={form.capacity} onChange={(event) => update('capacity', event.target.value)} /></label><label>Starting credits<input type="number" min="0" value={form.credits} onChange={(event) => update('credits', event.target.value)} /></label></div></>}{type === 'content' && <><label>Channel name<input autoFocus value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. XTREAM News" /></label><div className="form-row"><label>Category<select value={form.category} onChange={(event) => update('category', event.target.value)}><option>Entertainment</option><option>News</option><option>Sports</option><option>Kids</option></select></label><label>Country<select value={form.country} onChange={(event) => update('country', event.target.value)}><option>Pakistan</option><option>United Kingdom</option><option>United States</option><option>International</option></select></label></div><label>Stream source<input value={form.source} onChange={(event) => update('source', event.target.value)} placeholder="Primary origin" /></label></>}{type === 'credits' && <><div className="transfer-callout"><WalletCards size={20} /><div><strong>Available to transfer</strong><span>0 credits in master balance</span></div></div><label>Credit amount<input autoFocus type="number" min="1" value={form.amount} onChange={(event) => update('amount', event.target.value)} placeholder="Enter amount" /></label><label>Destination reseller<select defaultValue=""><option value="" disabled>Select a reseller</option><option>New reseller account</option></select></label></>}{error && <div className="form-error"><AlertCircle size={14} />{error}</div>}<div className="modal-actions"><button type="button" className="outline-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button">{type === 'credits' ? 'Transfer credits' : 'Create and continue'}<ArrowRight size={15} /></button></div></form></div></div>
}

createRoot(document.getElementById('root')).render(<App />)