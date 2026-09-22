import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Activity,
  AlertCircle,
  ArrowDownToLine,
  ArrowRight,
  BarChart3,
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
  Copy,
  CreditCard,
  Database,
  Download,
  Eye,
  FileCode2,
  Film,
  Gauge,
  HelpCircle,
  Key,
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
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.message || 'The request could not be completed.')
  return payload
}

function formatDate(value) {
  if (!value) return 'Just now'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown date'
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function formatDateTime(value) {
  if (!value) return 'Just now'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown date'
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
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

const ALL_NAV_GROUPS = [
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
  dashboard: { eyebrow: 'Master console', title: 'Dashboard', description: 'A live operational overview of your XTREME CABLE network.' },
  users: { eyebrow: 'User operations', title: 'All Users', description: 'Manage subscriber access, plans, and account health from one workspace.' },
  'user-groups': { eyebrow: 'User operations', title: 'User Groups', description: 'Organize subscribers into access groups and service segments.' },
  packages: { eyebrow: 'User operations', title: 'Packages', description: 'Create and maintain the plans available to your subscriber base.' },
  'user-activity': { eyebrow: 'User operations', title: 'User Activity', description: 'Review account events and recent subscriber activity.' },
  expiring: { eyebrow: 'User operations', title: 'Expiring Users', description: 'A dedicated operational workspace for this Xtreme Cable control surface.' },
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
  monitoring: { eyebrow: 'Stream monitoring', title: 'Stream Monitoring', description: 'A dedicated operational workspace for this Xtreme Cable control surface.' },
  'stream-logs': { eyebrow: 'Infrastructure', title: 'Stream logs', description: 'Investigate stream events and delivery errors.' },
  analytics: { eyebrow: 'Insights', title: 'Analytics', description: 'Understand growth, retention, and platform performance.' },
  integrations: { eyebrow: 'Insights', title: 'API & Integrations', description: 'Connect the tools that keep your cable operation moving.' },
  support: { eyebrow: 'Workspace', title: 'Support', description: 'Find answers and contact the XTREME CABLE operations team.' },
  billing: { eyebrow: 'Workspace', title: 'Billing', description: 'Manage your plan, invoices, and payment settings.' },
  settings: { eyebrow: 'Workspace', title: 'Settings', description: 'Configure your master console and account preferences.' },
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [data, setData] = useState(null)
  const [dataError, setDataError] = useState('')
  const [dataLoading, setDataLoading] = useState(false)
  const [activePage, setActivePage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [openGroups, setOpenGroups] = useState(() => ({ Users: true, Resellers: true, Content: true, Infrastructure: true, Insights: true }))
  const [search, setSearch] = useState('')
  const searchInputRef = useRef(null)
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
    function focusSearch(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  useEffect(() => {
    fetch('/api/session', { credentials: 'include' })
      .then((response) => response.json())
      .then((data) => {
        setIsLoggedIn(Boolean(data.authenticated))
        setCurrentUser(data.user || null)
      })
      .catch(() => {
        setIsLoggedIn(false)
        setCurrentUser(null)
      })
      .finally(() => setAuthChecked(true))
  }, [])

  async function refreshData() {
    setDataLoading(true)
    setDataError('')
    try {
      const payload = await apiRequest('/api/bootstrap')
      setData({
        ...payload,
        users: payload.users || [],
        groups: payload.groups || [],
        packages: payload.packages || [],
        resellers: payload.resellers || [],
        content: payload.content || [],
        servers: payload.servers || [],
        sources: payload.sources || [],
        categories: payload.categories || [],
        epg: payload.epg || [],
        transactions: payload.transactions || [],
        activity: payload.activity || [],
        activityTrend: payload.activityTrend || [],
        integrations: payload.integrations || [],
        invoices: payload.invoices || [],
        supportRequests: payload.supportRequests || [],
      })
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
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      })
      const data = await response.json()
      if (!response.ok) return { ok: false, message: data.message || 'Unable to sign in.' }
      setIsLoggedIn(true)
      setCurrentUser(data.user || null)
      return { ok: true }
    } catch {
      return { ok: false, message: 'The sign-in service is unavailable. Try again.' }
    }
  }

  const isReseller = currentUser?.role === 'Reseller'

  const navGroups = useMemo(() => {
    if (!isReseller) return ALL_NAV_GROUPS;
    return ALL_NAV_GROUPS.map(g => {
       if (g.label === 'Workspace') return g;
       if (g.label === 'Users') return { ...g, items: g.items.filter(i => ['users', 'packages', 'user-activity'].includes(i.id)) };
       if (g.label === 'Content') return { ...g, items: g.items.filter(i => ['live-tv', 'movies', 'series', 'categories', 'epg'].includes(i.id)) };
       return null;
    }).filter(Boolean).filter(g => g.items.length > 0);
  }, [isReseller]);

  const current = pageMeta[activePage] || pageMeta.dashboard
  const allNavItems = [...navGroups.flatMap((group) => group.items), ...utilityItems]
  const searchMatches = useMemo(() => {
    if (!search.trim()) return []
    return allNavItems.filter((item) => item.label.toLowerCase().includes(search.toLowerCase())).slice(0, 6)
  }, [search, allNavItems])

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
      const res = await apiRequest(path, options)
      await refreshData()
      if (res?.generated_password) {
        setModal({
          type: 'credentials_created',
          item: {
            name: res.item?.name || res.item?.username || 'Account',
            username: res.item?.username || res.item?.email || '',
            email: res.item?.email || '',
            password: res.generated_password,
          },
        })
      } else {
        setModal(null)
      }
      showToast(successMessage)
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  function jsonOptions(method, body) {
    return { method, body: JSON.stringify(body) }
  }

  function handleAction(action) {
    if (typeof action === 'string') {
      if (action === 'content') {
        const contentType = activePage === 'movies' ? 'movie' : activePage === 'series' ? 'series' : 'live_tv'
        return setModal({ type: 'content', item: { contentType } })
      }
      return setModal(action)
    }
    if (action?.type === 'edit') return setModal({ type: action.entity, item: action.item })
    if (action?.type === 'settings') return runMutation('/api/settings', jsonOptions('PATCH', action.form), 'Settings saved')
    if (action?.type === 'support') return runMutation('/api/support', jsonOptions('POST', action.form), 'Support request submitted')
    if (action?.type === 'integration-config') return setModal({ type: 'integration', item: action.item })
    if (action?.type === 'integration-test') {
      return apiRequest(`/api/integrations/${action.item.id}/test`, jsonOptions('POST', { config: action.form }))
        .then((result) => showToast(result.message))
        .catch((error) => showToast(error.message, 'error'))
    }
    if (action?.type === 'delete-reseller') return window.confirm('Delete this reseller account? This cannot be undone.') && runMutation(`/api/resellers/${action.id}`, { method: 'DELETE' }, 'Reseller account deleted')
    if (action?.type === 'delete-user') return window.confirm('Delete this subscriber account? This cannot be undone.') && runMutation(`/api/users/${action.id}`, { method: 'DELETE' }, 'Subscriber account deleted')
    if (action?.type === 'delete-content') return window.confirm('Delete this content item? This cannot be undone.') && runMutation(`/api/content/${action.id}`, { method: 'DELETE' }, 'Content item deleted')
    if (action?.type === 'delete-server') return window.confirm('Delete this server? This cannot be undone.') && runMutation(`/api/servers/${action.id}`, { method: 'DELETE' }, 'Server deleted')
    if (action?.type === 'delete-source') return window.confirm('Delete this stream source? This cannot be undone.') && runMutation(`/api/sources/${action.id}`, { method: 'DELETE' }, 'Stream source deleted')
    if (action?.type === 'delete-category') return window.confirm('Delete this category? This cannot be undone.') && runMutation(`/api/categories/${action.id}`, { method: 'DELETE' }, 'Category deleted')
    if (action?.type === 'delete-epg') return window.confirm('Delete this EPG schedule? This cannot be undone.') && runMutation(`/api/epg/${action.id}`, { method: 'DELETE' }, 'EPG schedule deleted')
    if (action?.type === 'support') return navigate('support')
  }

  if (!data && isLoggedIn && (dataLoading || !dataError)) {
    return <AuthLoadingScreen />
  }

  if (!authChecked) {
    return <AuthLoadingScreen />
  }

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} onForgotPassword={() => setToast({ message: 'Please contact the operator administrator to reset access.', type: 'error' })} />
  }

  if (dataError && !data) {
    return <DataErrorScreen message={dataError} onRetry={refreshData} onLogout={logout} />
  }

  return (
    <div className="app-shell">
      <Sidebar
        navGroups={navGroups}
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
           searchInputRef={searchInputRef}
          onLogout={logout}
           onSettings={() => navigate('settings')}
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
               <Dashboard isReseller={isReseller} summary={data.summary} activity={data.activity} onAction={handleAction} navigate={navigate} />
            ) : (
              <OperationalPage
                page={activePage}
                meta={current}
                data={data}
                 onAction={handleAction}
                navigate={navigate}
                showToast={showToast}
                refreshData={refreshData}
              />
            )}
          </div>
        </div>
      </main>
      {modal && (
        <BackendModal
          key={`${typeof modal === 'string' ? modal : modal.type}-${typeof modal === 'string' ? 'new' : modal.item?.id || 'new'}`}
          type={typeof modal === 'string' ? modal : modal.type}
          item={typeof modal === 'string' ? null : modal.item}
          resellers={data.resellers}
          packages={data.packages}
          groups={data.groups}
          isReseller={isReseller}
          onClose={() => setModal(null)}
          onSubmit={(type, form, item) => {
            const editRoutes = { reseller: '/api/resellers', content: '/api/content', user: '/api/users', group: '/api/groups', package: '/api/packages', server: '/api/servers', source: '/api/sources', category: '/api/categories', epg: '/api/epg' }
            if (item && editRoutes[type]) return runMutation(`${editRoutes[type]}/${item.id}`, jsonOptions('PATCH', form), `${type} updated`)
            if (type === 'reseller') return runMutation('/api/resellers', jsonOptions('POST', form), 'Reseller account created')
            if (type === 'content') return runMutation('/api/content', jsonOptions('POST', form), 'Content added to your library')
            if (type === 'user') return runMutation('/api/users', jsonOptions('POST', form), 'Subscriber account created')
            if (type === 'group') return runMutation('/api/groups', jsonOptions('POST', form), 'User group created')
            if (type === 'package') return runMutation('/api/packages', jsonOptions('POST', form), 'Subscriber package created')
            if (type === 'server') return runMutation('/api/servers', jsonOptions('POST', form), 'Server added')
            if (type === 'source') return runMutation('/api/sources', jsonOptions('POST', form), 'Stream source added')
            if (type === 'category') return runMutation('/api/categories', jsonOptions('POST', form), 'Content category created')
            if (type === 'epg') return runMutation('/api/epg', jsonOptions('POST', form), 'EPG schedule created')
            if (type === 'issue-credits') return runMutation('/api/credits/issue', jsonOptions('POST', form), `${form.amount} credits issued`)
            return runMutation('/api/credits/transfer', jsonOptions('POST', form), `${form.amount} credits transferred successfully`)
          }}
        />
      )}
      {toast && <div className={`toast ${toast.type}`}><span className="toast-icon"><Check size={15} /></span>{toast.message}<button onClick={() => setToast(null)}><X size={14} /></button></div>}
    </div>
  )
}

function AuthLoadingScreen() {
  return <div className="auth-loading"><div className="logo-surface loading-logo-surface"><img src={logoPath} alt="XTREME CABLE" /></div><span>Securing operator session…</span></div>
}

function DataErrorScreen({ message, onRetry, onLogout }) {
  return <div className="auth-loading"><div className="logo-surface loading-logo-surface"><img src={logoPath} alt="XTREME CABLE" /></div><AlertCircle size={18} color="#ff99a8" /><strong>Console data unavailable</strong><span>{message}</span><div className="data-error-actions"><button className="primary-button" onClick={onRetry}><RefreshCw size={14} />Try again</button><button className="outline-button" onClick={onLogout}>Sign out</button></div></div>
}

function LoginScreen({ onLogin, onForgotPassword }) {
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
        <div className="logo-surface login-logo-surface"><img src={logoPath} alt="XTREME CABLE" /></div>
        <small>MASTER CONSOLE</small>
      </div>
      <div className="login-card">
        <div className="login-card-top"><span className="status-dot" />SECURE OPERATOR ACCESS</div>
        <h1>Welcome back<span>.</span></h1>
        <p className="login-intro">Sign in to manage your streaming network.</p>
        <form onSubmit={submit}>
          <label>Operator ID<input autoFocus value={username} onChange={(event) => { setUsername(event.target.value); setError('') }} placeholder="Enter your operator ID" autoComplete="username" /></label>
          <label>Password<div className="password-wrap"><input value={password} onChange={(event) => { setPassword(event.target.value); setError('') }} type={showPassword ? 'text' : 'password'} placeholder="Enter your password" autoComplete="current-password" /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}><Eye size={16} /></button></div></label>
          {error && <div className="login-error"><AlertCircle size={15} />{error}</div>}
          <div className="login-options"><label className="check-label"><input type="checkbox" defaultChecked /> <span>Remember this device</span></label><button type="button" className="text-button" onClick={onForgotPassword}>Need help signing in?</button></div>
          <button className="primary-button login-button" type="submit">Sign in to console <ArrowRight size={16} /></button>
        </form>
      </div>
      <div className="login-footer"><span><ShieldCheck size={14} />Encrypted operator session</span><span>© 2026 XTREME CABLE</span></div>
    </div>
  )
}

function Sidebar({ activePage, openGroups, setOpenGroups, navigate, collapsed, setCollapsed, mobileOpen, closeMobile, onLogout, navGroups }) {
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
            <div className="logo-surface sidebar-logo-surface"><img src={logoPath} alt="XTREME CABLE" /></div>
            {!collapsed && <span className="sidebar-console-label">MASTER<br />CONSOLE</span>}
          </button>
          <button className="collapse-button" aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'} onClick={() => setCollapsed((value) => !value)}>{collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}</button>
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

function Topbar({ current, search, setSearch, searchMatches, navigate, notificationsOpen, setNotificationsOpen, profileOpen, setProfileOpen, searchInputRef, onLogout, onSettings, onMenu }) {
  return (
    <header className="topbar">
      <div className="mobile-header"><button onClick={onMenu} aria-label="Open navigation"><Menu size={21} /></button><div className="logo-surface mobile-logo-surface"><img src={logoPath} alt="XTREME CABLE" /></div></div>
      <div className="breadcrumbs"><span>MASTER CONSOLE</span><ChevronRight size={12} /><strong>{current.eyebrow.toUpperCase()}</strong><b>{current.title}</b></div>
      <div className="topbar-actions">
        <div className={`command-search ${searchMatches.length ? 'has-results' : ''}`}><Search size={16} /><input ref={searchInputRef} aria-label="Search console pages" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search command" /><kbd>⌘ K</kbd>{search && <button aria-label="Clear search" onClick={() => setSearch('')}><X size={13} /></button>}</div>
        <div className="topbar-divider" />
        <div className="popover-wrap"><button aria-label="Open system updates" className="icon-button notification-button" onClick={() => { setNotificationsOpen((value) => !value); setProfileOpen(false) }}><Bell size={17} /><i /></button>{notificationsOpen && <div className="popover notification-popover"><div className="popover-heading"><div><strong>Notifications</strong><small>System updates</small></div><span className="new-label">Info</span></div><div className="notification-row"><span className="notification-icon cyan"><Activity size={15} /></span><div><strong>Stream monitoring is ready</strong><small>Configure your first source to begin</small></div></div><div className="notification-row"><span className="notification-icon purple"><Sparkles size={15} /></span><div><strong>Welcome to your console</strong><small>Your workspace has been provisioned</small></div></div></div>}</div>
        <div className="popover-wrap"><button aria-label="Open operator menu" className="profile-button" onClick={() => { setProfileOpen((value) => !value); setNotificationsOpen(false) }}><span className="avatar small">OP</span><ChevronDown size={13} /></button>{profileOpen && <div className="popover profile-popover"><div className="profile-summary"><span className="avatar">OP</span><div><strong>Operator</strong><small>Master access</small></div></div><button onClick={() => { onSettings(); setProfileOpen(false) }}><Settings size={14} /> Account settings</button><button onClick={onLogout}><LogOut size={14} /> Sign out</button></div>}</div>
      </div>
    </header>
  )
}

function Dashboard({ isReseller, summary, activity, onAction, navigate }) {
  const metrics = summary || {}
  return (
    <div className="dashboard-page">
      <div className="hero-row"><div><div className="eyebrow"><span className="eyebrow-line" />{isReseller ? 'RESELLER CONSOLE' : 'MASTER CONSOLE'}</div><h1>Good morning, Operator<span>.</span></h1><p className="page-description">Here’s what’s happening across your XTREME CABLE network today.</p></div><div className="date-chip"><CalendarDays size={15} />{new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' }).format(new Date())}</div></div>
      <div className="metric-grid">
        <MetricCard label="Active subscribers" value={metrics.activeSubscribers || 0} meta="From the subscriber ledger" icon={Users} tone="cyan" onClick={() => navigate('users')} />
        {!isReseller && (
          <>
            <MetricCard label="Live channels" value={metrics.liveChannels || 0} meta="Across all sources" icon={Tv} tone="purple" onClick={() => navigate('live-tv')} />
            <MetricCard label="Online streams" value={metrics.activeStreams || 0} meta="Tracked playback sessions" icon={Radio} tone="green" onClick={() => navigate('streams')} />
            <MetricCard label="Reseller accounts" value={metrics.resellerAccounts || 0} meta="Partner accounts" icon={UserRound} tone="orange" onClick={() => navigate('resellers')} />
          </>
        )}
      </div>
       <div className="dashboard-grid">
       <section className="panel quick-panel"><div className="panel-heading"><div><span className="section-kicker">SHORTCUTS</span><h2>Quick actions</h2></div><span className="muted-label">Get started</span></div><div className="quick-actions"><QuickAction icon={Users} title="Add a user" description="Create a subscriber account" onClick={() => onAction('user')} />{!isReseller && <QuickAction icon={UserRound} title="Add reseller" description="Extend your distribution channel" onClick={() => onAction('reseller')} />}{!isReseller && <QuickAction icon={Tv} title="Add content" description="Onboard a live channel or VOD" onClick={() => onAction('content')} />}{!isReseller && <QuickAction icon={WalletCards} title="Transfer credits" description="Fund a reseller account" onClick={() => onAction('credits')} />}</div></section>
        <section className="panel health-panel"><div className="panel-heading"><div><span className="section-kicker">SYSTEM HEALTH</span><h2>Network status</h2></div><span className={`status-badge ${metrics.healthPercent < 100 ? 'status-warning' : ''}`}><i />{metrics.totalServers ? (metrics.healthPercent === 100 ? 'Operational' : 'Attention needed') : 'Awaiting setup'}</span></div><div className="health-status"><div className="health-ring"><div><strong>{metrics.healthPercent || 0}%</strong><small>{metrics.totalServers ? 'server health' : 'no servers'}</small></div></div><div className="health-list"><HealthRow label="Core services" status={metrics.totalServers ? `${metrics.operationalServers}/${metrics.totalServers} ready` : 'No servers'} /><HealthRow label="Stream delivery" status={metrics.activeSources ? `${metrics.activeSources} sources` : 'No sources'} /><HealthRow label="API gateway" status="Online" /></div></div><button className="panel-link" onClick={() => navigate('monitoring')}>Open stream monitoring <ArrowRight size={14} /></button></section>
      </div>
       <section className="panel activity-panel"><div className="panel-heading"><div><span className="section-kicker">ACTIVITY</span><h2>Recent activity</h2></div><button className="panel-link" onClick={() => navigate('user-activity')}>View all <ArrowRight size={14} /></button></div>{activity?.length ? <ActivityList items={activity.slice(0, 3)} /> : <EmptyState compact icon={Activity} title="No activity recorded" description="Events will appear here as your platform starts working." />}</section>
    </div>
  )
}

function MetricCard({ label, value, meta, icon: Icon, tone, onClick }) {
  return (
    <div className="metric-card" onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <div className={`metric-icon ${tone}`}><Icon size={18} /></div>
      <div className="metric-content">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{meta}</small>
      </div>
    </div>
  )
}

function QuickAction({ icon: Icon, title, description, onClick }) {
  return <button className="quick-action" onClick={onClick}><span className="quick-icon"><Icon size={17} /></span><span><strong>{title}</strong><small>{description}</small></span><ArrowRight size={15} /></button>
}

function HealthRow({ label, status }) {
  return <div className="health-row"><span><i className="online-dot" />{label}</span><strong>{status}</strong></div>
}

function OperationalPage({ page, meta, data, onAction, navigate, showToast, refreshData }) {
  const emptyPages = ['expiring', 'user-groups', 'user-activity', 'transactions', 'commissions', 'reseller-activity', 'movies', 'series', 'categories', 'epg', 'streams', 'stream-sources', 'stream-logs']
  const isResellers = page === 'resellers'
  const isCredits = page === 'credits'
  const isLiveTv = page === 'live-tv'
  const isMovies = page === 'movies'
  const isSeries = page === 'series'
  const isMonitoring = page === 'monitoring'
  const resellers = data.resellers || []
  const content = data.content || []
  const filteredContent = isMovies ? content.filter((item) => item.contentType === 'movie') : isSeries ? content.filter((item) => item.contentType === 'series') : content.filter((item) => item.contentType === 'live_tv')
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
      {isMonitoring ? <MonitoringView activity={data.activity} trend={data.activityTrend} summary={data.summary} onExport={() => downloadCsv('stream-monitoring.csv', data.activity)} /> : isServer ? <ServersView servers={data.servers} onAdd={() => onAction('server')} onEdit={(item) => onAction({ type: 'edit', entity: 'server', item })} onDelete={(id) => onAction({ type: 'delete-server', id })} /> : page === 'analytics' ? <AnalyticsView summary={data.summary} trend={data.activityTrend} users={data.users} content={data.content} /> : page === 'integrations' ? <IntegrationsView integrations={data.integrations} onConfigure={(item) => onAction({ type: 'integration-config', item })} /> : page === 'settings' ? <SettingsView settings={data.settings} onSave={(form) => onAction({ type: 'settings', form })} /> : page === 'support' ? <SupportView requests={data.supportRequests} onSubmit={(form) => onAction({ type: 'support', form })} /> : page === 'billing' ? <BillingView invoices={data.invoices} /> : page === 'users' ? <UsersView users={data.users} resellers={resellers} packages={data.packages} groups={data.groups} onAction={() => onAction('user')} onEdit={(item) => onAction({ type: 'edit', entity: 'user', item })} onDelete={(id) => onAction({ type: 'delete-user', id })} /> : page === 'expiring' ? <ExpiringUsersView users={data.users} onDelete={(id) => onAction({ type: 'delete-user', id })} /> : isResellers && hasItems ? <ResellerTable resellers={resellers} onEdit={(item) => onAction({ type: 'edit', entity: 'reseller', item })} onDelete={(id) => onAction({ type: 'delete-reseller', id })} /> : (isLiveTv || isMovies || isSeries) && hasItems ? <ContentTable content={filteredContent} onEdit={(item) => onAction({ type: 'edit', entity: 'content', item })} onDelete={(id) => onAction({ type: 'delete-content', id })} /> : isCredits ? <CreditsView credits={data.summary.availableCredits || 0} transactions={data.transactions} resellers={resellers} onAction={() => onAction('credits')} onIssue={() => onAction('issue-credits')} /> : page === 'transactions' ? <TransactionList transactions={data.transactions} /> : page === 'commissions' ? <CommissionView transactions={data.transactions} /> : page === 'reseller-activity' ? <ActivityPage items={data.activity} scope="reseller" title="Reseller activity" description="Review partner account events and credit operations." onRefresh={refreshData} /> : page === 'streams' ? <StreamsView summary={data.summary} servers={data.servers} sources={data.sources} /> : page === 'stream-logs' ? <ActivityPage items={data.activity} scope="stream" title="Stream logs" description="Investigate source, server, and delivery events." onRefresh={refreshData} /> : page === 'user-groups' ? <ManagedList title="User groups" items={data.groups} emptyTitle="No user groups created" emptyDescription="Create a group to organize access and simplify subscriber management." action={() => onAction('group')} actionLabel="Add group" onEdit={(item) => onAction({ type: 'edit', entity: 'group', item })} /> : page === 'packages' ? <ManagedList title="Subscriber packages" items={data.packages} emptyTitle="No packages created" emptyDescription="Create a package to start assigning plans to subscribers." action={() => onAction('package')} actionLabel="Add package" onEdit={(item) => onAction({ type: 'edit', entity: 'package', item })} /> : isCategory ? <ManagedList title="Content categories" items={data.categories} emptyTitle="No categories created" emptyDescription="Create categories to keep your catalog organized." action={() => onAction('category')} actionLabel="Add category" valueKey="contentCount" onEdit={(item) => onAction({ type: 'edit', entity: 'category', item })} onDelete={(id) => onAction({ type: 'delete-category', id })} /> : isSource ? <ManagedList title="Stream sources" items={data.sources} emptyTitle="No stream sources configured" emptyDescription="Connect a source to start delivering content." action={() => onAction('source')} actionLabel="Add source" valueKey="url" onEdit={(item) => onAction({ type: 'edit', entity: 'source', item })} onDelete={(id) => onAction({ type: 'delete-source', id })} /> : isEpg ? <EpgList items={data.epg} onEdit={(item) => onAction({ type: 'edit', entity: 'epg', item })} onDelete={(id) => onAction({ type: 'delete-epg', id })} /> : page === 'user-activity' ? <ActivityPage items={data.activity} scope="user" title="User activity" description="Review subscriber account events and operator actions that affect access." onRefresh={refreshData} /> : emptyPages.includes(page) || (!hasItems && (isResellers || isLiveTv || isMovies || isSeries)) ? <EmptyWorkspace page={page} actionType={actionType} onAction={onAction} /> : <GenericWorkspace page={page} navigate={navigate} />}
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

function ResellerTable({ resellers, onEdit, onDelete }) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const filtered = resellers.filter((item) => `${item.name} ${item.email}`.toLowerCase().includes(query.toLowerCase()) && (statusFilter === 'all' || item.status === statusFilter))
  const nextStatus = statusFilter === 'all' ? 'active' : statusFilter === 'active' ? 'suspended' : 'all'
  return <div className="data-panel"><div className="toolbar"><div className="table-search"><Search size={15} /><input placeholder="Search reseller accounts" value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="toolbar-actions"><button className="filter-button" onClick={() => setStatusFilter(nextStatus)}>{statusFilter === 'all' ? 'All statuses' : statusFilter} <ChevronDown size={13} /></button><button className="outline-button" onClick={() => downloadCsv('resellers.csv', filtered)}><Download size={14} />Export</button></div></div><div className="table-wrap"><table><thead><tr><th>Account</th><th>Status</th><th>Users</th><th>Credits</th><th>Created</th><th /></tr></thead><tbody>{filtered.map((reseller) => <tr key={reseller.id}><td><div className="table-identity"><span className="table-avatar">{reseller.name.slice(0, 2).toUpperCase()}</span><div><strong>{reseller.name}</strong><small>{reseller.email}</small></div></div></td><td><span className={`status-badge ${reseller.status === 'suspended' ? 'status-warning' : ''}`}><i />{reseller.status}</span></td><td>{reseller.userCount || 0} / {reseller.capacity}</td><td>{reseller.credits}</td><td>{formatDate(reseller.createdAt)}</td><td><div className="row-actions"><button className="table-more" onClick={() => onEdit(reseller)} aria-label={`Edit ${reseller.name}`}><Pencil size={14} /></button><button className="table-more danger-action" onClick={() => onDelete(reseller.id)} aria-label={`Delete ${reseller.name}`}><X size={15} /></button></div></td></tr>)}</tbody></table></div></div>
}

function ContentTable({ content, onEdit, onDelete }) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const filtered = content.filter((item) => `${item.name} ${item.category} ${item.country}`.toLowerCase().includes(query.toLowerCase()) && (statusFilter === 'all' || item.status === statusFilter))
  const nextStatus = statusFilter === 'all' ? 'active' : statusFilter === 'active' ? 'disabled' : 'all'
  return <div className="data-panel"><div className="toolbar"><div className="table-search"><Search size={15} /><input placeholder="Search content" value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="toolbar-actions"><button className="filter-button" onClick={() => setStatusFilter(nextStatus)}>{statusFilter === 'all' ? 'All statuses' : statusFilter} <ChevronDown size={13} /></button><button className="outline-button" onClick={() => downloadCsv('content.csv', filtered)}><Download size={14} />Export</button></div></div><div className="table-wrap"><table><thead><tr><th>Content</th><th>Category</th><th>Source</th><th>Status</th><th /></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><div className="table-identity"><span className="channel-avatar"><Tv size={15} /></span><div><strong>{item.name}</strong><small>{item.country} · {item.contentType}</small></div></div></td><td>{item.category}</td><td>{item.source}</td><td><span className="status-badge"><i />{item.status}</span></td><td><div className="row-actions"><button className="table-more" onClick={() => onEdit(item)} aria-label={`Edit ${item.name}`}><Pencil size={14} /></button><button className="table-more danger-action" onClick={() => onDelete(item.id)} aria-label={`Delete ${item.name}`}><X size={15} /></button></div></td></tr>)}</tbody></table></div></div>
}

function CreditsView({ credits, transactions, onAction, onIssue }) {
  return <><div className="credit-toolbar"><span className="muted-label">Manage the master credit ledger</span><div><button className="outline-button" onClick={onIssue}><Plus size={14} />Issue credits</button><button className="primary-button" onClick={onAction}><WalletCards size={14} />Transfer credits</button></div></div><div className="credit-summary-grid"><div className="credit-balance"><div><span className="section-kicker">AVAILABLE BALANCE</span><strong>{Number(credits).toLocaleString()}</strong><small>credits ready to allocate</small></div><div className="credit-symbol"><WalletCards size={23} /></div></div><div className="mini-stat"><span>Issued this month</span><strong>{transactions.filter((item) => item.direction === 'issued').reduce((sum, item) => sum + Number(item.amount), 0)}</strong><small>From the credit ledger</small></div><div className="mini-stat"><span>Transferred</span><strong>{transactions.filter((item) => item.direction === 'transferred').reduce((sum, item) => sum + Number(item.amount), 0)}</strong><small>Across reseller accounts</small></div></div>{transactions.length ? <div className="data-panel credit-ledger"><div className="toolbar"><div><span className="section-kicker">AUDITABLE LEDGER</span><h2>Credit activity</h2></div><button className="outline-button" onClick={() => downloadCsv('credit-ledger.csv', transactions)}><Download size={14} />Export</button></div><div className="table-wrap"><table><thead><tr><th>Reseller</th><th>Direction</th><th>Amount</th><th>Description</th><th>Date</th></tr></thead><tbody>{transactions.map((item) => <tr key={item.id}><td>{item.resellerName || 'Master balance'}</td><td><span className={`direction-badge ${item.direction}`}>{item.direction}</span></td><td>{item.amount}</td><td>{item.description}</td><td>{formatDate(item.createdAt)}</td></tr>)}</tbody></table></div></div> : <div className="empty-workspace credit-empty"><EmptyState icon={WalletCards} title="No credit activity" description="Credits will be recorded once they are issued or transferred." action={{ label: 'Issue credits', onClick: onIssue }} /></div>}</>
}

function TransactionList({ transactions }) {
  return <div className="data-panel"><div className="toolbar"><div><span className="section-kicker">RESELLER LEDGER</span><h2>Transactions</h2></div><button className="outline-button" onClick={() => downloadCsv('transactions.csv', transactions)}><Download size={14} />Export</button></div>{transactions.length ? <div className="table-wrap"><table><thead><tr><th>Reseller</th><th>Direction</th><th>Amount</th><th>Description</th><th>Created</th></tr></thead><tbody>{transactions.map((item) => <tr key={item.id}><td>{item.resellerName || 'Master balance'}</td><td><span className={`direction-badge ${item.direction}`}>{item.direction}</span></td><td>{item.amount}</td><td>{item.description}</td><td>{formatDate(item.createdAt)}</td></tr>)}</tbody></table></div> : <EmptyState icon={ArrowDownToLine} title="No transactions yet" description="Credit movements will appear here after an issue or transfer." />}</div>
}

function CommissionView({ transactions }) {
  const transferred = transactions.filter((item) => item.direction === 'transferred')
  const total = transferred.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  return <div className="commission-layout"><div className="credit-summary-grid"><div className="credit-balance"><div><span className="section-kicker">TRACKED VOLUME</span><strong>{total.toLocaleString()}</strong><small>credits transferred to partners</small></div><div className="credit-symbol"><Boxes size={23} /></div></div><div className="mini-stat"><span>Partner events</span><strong>{transferred.length}</strong><small>Recorded in the ledger</small></div></div><TransactionList transactions={transferred} /></div>
}

function ExpiringUsersView({ users, onDelete }) {
  const horizon = Date.now() + 30 * 24 * 60 * 60 * 1000
  const expiring = users.filter((item) => item.expiresAt && new Date(item.expiresAt).getTime() <= horizon && new Date(item.expiresAt).getTime() >= Date.now())
  return <div className="data-panel"><div className="toolbar"><div><span className="section-kicker">ACCESS HEALTH</span><h2>Expiring within 30 days</h2></div><span className="muted-label">{expiring.length} subscribers</span></div>{expiring.length ? <div className="table-wrap"><table><thead><tr><th>Subscriber</th><th>Package</th><th>Expires</th><th>Status</th><th /></tr></thead><tbody>{expiring.map((user) => <tr key={user.id}><td><div className="table-identity"><span className="table-avatar">{user.name.slice(0, 2).toUpperCase()}</span><div><strong>{user.name}</strong><small>@{user.username}</small></div></div></td><td>{user.packageName || 'Unassigned'}</td><td>{formatDate(user.expiresAt)}</td><td><span className="status-badge status-warning"><i />Renew soon</span></td><td><button className="table-more danger-action" onClick={() => onDelete(user.id)} aria-label={`Delete ${user.name}`}><X size={15} /></button></td></tr>)}</tbody></table></div> : <EmptyState icon={CalendarDays} title="No users expiring soon" description="Subscribers entering their renewal window will appear here." />}</div>
}

function StreamsView({ summary, servers, sources }) {
  return <div className="streams-layout"><div className="credit-summary-grid"><div className="credit-balance"><div><span className="section-kicker">ACTIVE STREAMS</span><strong>{summary.activeStreams || 0}</strong><small>{summary.activeStreams ? 'tracked playback sessions' : 'Playback telemetry not connected'}</small></div><div className="credit-symbol"><Radio size={23} /></div></div><div className="mini-stat"><span>Operational servers</span><strong>{summary.operationalServers || 0}</strong><small>Ready for delivery</small></div><div className="mini-stat"><span>Configured sources</span><strong>{sources.length}</strong><small>Upstream connections</small></div></div><div className="data-panel"><div className="toolbar"><div><span className="section-kicker">DELIVERY CAPACITY</span><h2>Stream capacity</h2></div></div>{servers.length ? <div className="stream-capacity-list">{servers.map((server) => <div className="stream-capacity-row" key={server.id}><span className="server-icon"><Server size={16} /></span><div><strong>{server.name}</strong><small>{server.host}</small></div><span>{server.capacity}% capacity</span><div className="progress"><i style={{ width: `${server.capacity}%` }} /></div></div>)}</div> : <EmptyState icon={Server} title="No delivery servers configured" description="Add a server to start tracking delivery capacity." />}</div></div>
}

function MonitoringView({ activity = [], trend = [], summary = {}, onExport }) {
  const streamEvents = activity.filter((item) => {
    const entity = String(item.entityType || '')
    const event = String(item.eventType || '')
    return entity === 'source' || entity === 'server' || event.includes('stream')
  })
  return <><div className="monitor-toolbar"><div><CalendarDays size={15} />Live activity <span>— {streamEvents.length} recorded events</span></div><div><span className="muted-label">{summary.operationalServers || 0} operational servers</span><button className="primary-button small-button" onClick={onExport}><Download size={14} />Export</button></div></div><div className="monitor-grid"><div className="chart-panel panel"><span className="section-kicker">STREAM MONITORING SIGNAL</span><div className="chart-area"><div className="chart-grid-lines" />{trend.some((item) => Number(item.streamEvents) > 0) && <div className="activity-signal">{trend.map((item) => <i key={item.date} title={`${item.date}: ${item.streamEvents} stream events`} style={{ height: `${Math.max(8, Math.min(92, Number(item.streamEvents) * 12))}%` }} />)}</div>}<div className="chart-labels">{trend.map((item) => <span key={item.date}>{String(item.date).slice(5)}</span>)}</div></div></div><div className="panel summary-panel"><span className="section-kicker">SUMMARY</span><div className="summary-list"><div><span>Observed events</span><strong>{streamEvents.length}</strong></div><div><span>Operational servers</span><strong>{summary.operationalServers || 0}</strong></div><div><span>Activity coverage</span><strong>{trend.reduce((total, item) => total + Number(item.total || 0), 0)} records</strong></div><div><span>Last recorded event</span><strong>{streamEvents[0] ? formatDate(streamEvents[0].createdAt) : 'Not yet'}</strong></div></div></div></div></>
}

function ServersView({ servers, onAdd, onEdit, onDelete }) {
  return <div className="server-cards">{servers.map((server) => <div className="server-card" key={server.id}><div className="server-card-header"><span className="server-icon"><Server size={18} /></span><div><span className={`status-badge ${server.status !== 'operational' ? 'status-warning' : ''}`}><i />{server.status}</span><button className="table-more" onClick={() => onEdit(server)} aria-label={`Edit ${server.name}`}><Pencil size={14} /></button><button className="table-more danger-action" onClick={() => onDelete(server.id)} aria-label={`Delete ${server.name}`}><X size={15} /></button></div></div><h3>{server.name}</h3><p>{server.host}</p><div className="server-stat"><span>Capacity</span><strong>{server.capacity}%</strong></div><div className="progress"><i style={{ width: `${server.capacity}%` }} /></div></div>)}<div className="server-card add-server-card"><span className="add-circle"><Plus size={18} /></span><h3>Add a server</h3><p>Connect an origin to expand your delivery network.</p><button className="outline-button" onClick={onAdd}>Configure server <ArrowRight size={14} /></button></div></div>
}

function AnalyticsView({ summary = {}, trend = [], users = [], content = [] }) {
  const activeUsers = users.filter((item) => item.status === 'active').length
  const max = Math.max(1, ...trend.map((item) => Number(item.total || 0)))
  const hasActivity = trend.some((item) => Number(item.total || 0) > 0)
  return <div className="analytics-layout"><div className="panel analytics-main"><div className="panel-heading"><div><span className="section-kicker">AUDIENCE OVERVIEW</span><h2>Recorded activity</h2></div><span className="muted-label">{activeUsers} active subscribers · {content.length} content items</span></div><div className="analytics-empty">{hasActivity ? <div className="bar-placeholder">{trend.map((item) => <i key={item.date} title={`${item.date}: ${item.total} records`} style={{ height: `${Math.max(8, (Number(item.total || 0) / max) * 100)}%` }} />)}</div> : <EmptyState compact icon={BarChart3} title="No activity data yet" description="Charts will populate from recorded console events." />}<p>{hasActivity ? `Recorded ${trend.reduce((total, item) => total + Number(item.total || 0), 0)} events over the last 7 days.` : 'Analytics will populate as your network receives activity.'}</p></div></div><div className="panel insight-card"><div className="metric-icon cyan"><Zap size={18} /></div><span className="section-kicker">INSIGHT</span><h3>{summary.resellerAccounts ? 'Partner network is ready' : 'Build your first audience'}</h3><p>{summary.resellerAccounts ? `${summary.resellerAccounts} reseller accounts are available for distribution.` : 'Add subscribers and content to unlock network insights.'}</p></div></div>
}

function IntegrationsView({ integrations, onConfigure }) {
  const icons = { stripe: CreditCard, paypal: CreditCard, jazzcash: WalletCards, easypaisa: WalletCards, 'xtream-api': Cable, webhooks: FileCode2, 'data-export': Database, smtp: Mail, telegram: Bell }
  const groups = [
    ['payment', 'Payment gateways'],
    ['platform', 'Platform services'],
    ['notifications', 'Notifications'],
  ]
  return <div className="integration-sections">{groups.map(([category, title]) => {
    const items = integrations.filter((item) => item.category === category)
    if (!items.length) return null
    return <section className="integration-section" key={category}><div className="section-heading-row"><div><span className="section-kicker">MASTER CONFIGURATION</span><h2>{title}</h2></div><span className="muted-label">{items.length} services</span></div><div className="integrations-grid">{items.map((item) => <IntegrationCard key={item.id} icon={icons[item.slug] || Cable} name={item.name} description={item.description} status={item.status} onClick={() => onConfigure(item)} />)}</div></section>
  })}</div>
}

function IntegrationCard({ icon: Icon, name, description, status, onClick }) {
  return <div className="integration-card"><div className="integration-icon"><Icon size={20} /></div><div><span className={`status-badge ${status === 'disabled' ? 'status-warning' : ''}`}><i />{status}</span><h3>{name}</h3><p>{description}</p></div><button className="outline-button" onClick={onClick}>{status === 'configured' ? 'Manage' : 'Configure'} <ArrowRight size={14} /></button></div>
}

function SettingsView({ settings, onSave }) {
  const [section, setSection] = useState('general')
  const [form, setForm] = useState({ consoleName: settings?.consoleName || 'XTREME CABLE', timezone: settings?.timezone || 'Asia/Karachi', operationalAlerts: settings?.operationalAlerts !== false, sessionTimeoutMinutes: settings?.sessionTimeoutMinutes || 720, emailNotifications: settings?.emailNotifications !== false, incidentAlerts: settings?.incidentAlerts !== false })
  useEffect(() => {
    if (settings) setForm({ consoleName: settings.consoleName, timezone: settings.timezone, operationalAlerts: settings.operationalAlerts, sessionTimeoutMinutes: settings.sessionTimeoutMinutes || 720, emailNotifications: settings.emailNotifications !== false, incidentAlerts: settings.incidentAlerts !== false })
  }, [settings])
  return <div className="settings-layout"><div className="settings-nav panel"><button className={section === 'general' ? 'active' : ''} onClick={() => setSection('general')}><Settings size={15} />General</button><button className={section === 'security' ? 'active' : ''} onClick={() => setSection('security')}><ShieldCheck size={15} />Security</button><button className={section === 'notifications' ? 'active' : ''} onClick={() => setSection('notifications')}><Bell size={15} />Notifications</button></div><div className="settings-form panel"><div className="panel-heading"><div><span className="section-kicker">CONSOLE SETTINGS</span><h2>{section === 'general' ? 'General preferences' : section === 'security' ? 'Security preferences' : 'Notification preferences'}</h2></div></div>{section === 'general' && <><label>Console name<input value={form.consoleName} onChange={(event) => setForm({ ...form, consoleName: event.target.value })} /></label><label>Timezone<select value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })}><option>Asia/Karachi</option><option>UTC</option><option>Europe/London</option></select></label><label className="toggle-label"><span><strong>Operational alerts</strong><small>Receive updates about your network health.</small></span><input type="checkbox" checked={form.operationalAlerts} onChange={(event) => setForm({ ...form, operationalAlerts: event.target.checked })} /><i /></label></>}{section === 'security' && <><label>Session timeout<select value={form.sessionTimeoutMinutes} onChange={(event) => setForm({ ...form, sessionTimeoutMinutes: Number(event.target.value) })}><option value="30">30 minutes</option><option value="60">1 hour</option><option value="240">4 hours</option><option value="720">12 hours</option></select></label><p className="settings-help">Operator sessions automatically expire after the selected period.</p></>}{section === 'notifications' && <><label className="toggle-label"><span><strong>Email notifications</strong><small>Receive operational updates by email.</small></span><input type="checkbox" checked={form.emailNotifications} onChange={(event) => setForm({ ...form, emailNotifications: event.target.checked })} /><i /></label><label className="toggle-label"><span><strong>Incident alerts</strong><small>Notify operators about delivery incidents.</small></span><input type="checkbox" checked={form.incidentAlerts} onChange={(event) => setForm({ ...form, incidentAlerts: event.target.checked })} /><i /></label></>}<button className="primary-button" onClick={() => onSave(form)}>Save changes <Check size={15} /></button></div></div>
}

function SupportView({ requests = [], onSubmit }) {
  const [form, setForm] = useState({ subject: '', message: '' })
  return <div className="support-layout"><div className="panel support-hero"><span className="support-icon"><CircleHelp size={24} /></span><span className="section-kicker">OPERATOR SUPPORT</span><h2>How can we help?</h2><p>Submit an operational request and keep its status visible in this workspace.</p><div className="support-form"><input placeholder="Subject" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} /><textarea placeholder="Describe what you need help with" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} /><button className="primary-button" disabled={!form.subject.trim() || !form.message.trim()} onClick={() => onSubmit(form)}>Submit support request <ArrowRight size={15} /></button></div></div><div><div className="support-topics">{['Getting started', 'Managing subscribers', 'Content onboarding', 'Stream delivery'].map((topic) => <button key={topic} onClick={() => setForm((current) => ({ ...current, subject: topic, message: `I need help with ${topic.toLowerCase()}.` }))}><span>{topic}</span><ArrowRight size={14} /></button>)}</div><div className="panel support-history"><div className="panel-heading"><div><span className="section-kicker">REQUEST HISTORY</span><h2>Recent requests</h2></div><span className="muted-label">{requests.length}</span></div>{requests.length ? requests.map((request) => <div className="support-request-row" key={request.id}><div><strong>{request.subject}</strong><small>{formatDate(request.createdAt)} · {request.message}</small></div><span className="status-badge"><i />{request.status}</span></div>) : <EmptyState compact icon={CircleHelp} title="No requests yet" description="Submitted support requests will appear here." />}</div></div></div>
}

function BillingView({ invoices }) {
  const [stripe, setStripe] = useState({ connected: false, products: [], invoices: [], loading: true, error: '' })
  const [checkoutEmail, setCheckoutEmail] = useState('')
  useEffect(() => {
    let active = true
    Promise.all([apiRequest('/api/billing/stripe/status'), apiRequest('/api/billing/stripe/catalog'), apiRequest('/api/billing/stripe/invoices')])
      .then(([status, catalog, remoteInvoices]) => {
        if (active) setStripe({ connected: status.connected, products: catalog.products || [], invoices: remoteInvoices.items || [], loading: false, error: '' })
      })
      .catch((error) => {
        if (active) setStripe((current) => ({ ...current, loading: false, error: error.message }))
      })
    return () => { active = false }
  }, [])
  async function startCheckout(priceId) {
    try {
      const result = await apiRequest('/api/billing/stripe/checkout', { method: 'POST', body: JSON.stringify({ priceId, email: checkoutEmail }) })
      if (result.url) window.location.assign(result.url)
    } catch (error) {
      setStripe((current) => ({ ...current, error: error.message }))
    }
  }
  const formatMoney = (amount, currency = 'usd') => `${currency.toUpperCase()} ${(Number(amount || 0) / 100).toFixed(2)}`
  return <div className="billing-layout"><div className="panel plan-card"><span className="section-kicker">STRIPE BILLING</span><h2>Master Console</h2><p>{stripe.connected ? 'Stripe is connected. Choose a configured price to open hosted Checkout.' : 'Stripe billing is not connected in this environment.'}</p><div className="plan-details"><span><Check size={14} />Hosted Checkout</span><span><Check size={14} />Subscription support</span><span><Check size={14} />Invoice sync</span></div><label className="billing-email">Checkout email<input type="email" value={checkoutEmail} onChange={(event) => setCheckoutEmail(event.target.value)} placeholder="billing@example.com" /></label><button className="outline-button" onClick={() => downloadCsv('billing-invoices.csv', invoices)}><Download size={14} />Export local invoices</button></div><div className="panel invoice-card"><div className="panel-heading"><div><span className="section-kicker">STRIPE CATALOG</span><h2>Available plans</h2></div><span className={`status-badge ${stripe.connected ? '' : 'status-warning'}`}><i />{stripe.connected ? 'Connected' : 'Unavailable'}</span></div>{stripe.error ? <div className="form-error"><AlertCircle size={14} />{stripe.error}</div> : stripe.loading ? <div className="activity-loading"><RefreshCw size={17} />Loading Stripe billing…</div> : stripe.products.length ? <div className="billing-products">{stripe.products.flatMap((product) => product.prices.map((price) => <div className="invoice-row" key={price.id}><div><strong>{product.name}</strong><small>{product.description || 'XTREME CABLE service plan'} · {price.recurring ? `Every ${price.recurring.interval}` : 'One-time'}</small></div><span>{formatMoney(price.amount, price.currency)}</span><button className="outline-button" onClick={() => startCheckout(price.id)}>Checkout <ArrowRight size={14} /></button></div>))}</div> : <EmptyState compact icon={CreditCard} title={stripe.connected ? 'No Stripe prices configured' : 'Stripe billing unavailable'} description={stripe.connected ? 'Create an active product price in Stripe to enable hosted Checkout.' : 'Connect Stripe to enable hosted Checkout and invoice sync.'} />}</div><div className="panel invoice-card"><div className="panel-heading"><div><span className="section-kicker">BILLING HISTORY</span><h2>Invoices</h2></div><button className="outline-button" onClick={() => downloadCsv('stripe-invoices.csv', stripe.invoices)}>Export Stripe invoices <Download size={14} /></button></div>{stripe.invoices.length ? <div className="invoice-list">{stripe.invoices.map((invoice) => <div className="invoice-row" key={invoice.id}><div><strong>{invoice.number || invoice.id}</strong><small>{invoice.customerEmail || 'Stripe customer'} · {formatDate(new Date(invoice.createdAt * 1000).toISOString())}</small></div><span>{formatMoney(invoice.amount, invoice.currency)}</span><span className="status-badge"><i />{invoice.status || 'open'}</span>{invoice.hostedUrl && <a className="outline-button" href={invoice.hostedUrl} target="_blank" rel="noreferrer">Open <ArrowRight size={14} /></a>}</div>)}</div> : <EmptyState compact icon={CreditCard} title="No Stripe invoices yet" description="Invoices will appear after the first Stripe payment or subscription." />}</div></div>
}

function UsersView({ users, resellers, onAction, onEdit, onDelete }) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const filtered = users.filter((item) => `${item.name} ${item.username} ${item.email} ${item.raw_password || item.rawPassword || item.password}`.toLowerCase().includes(query.toLowerCase()) && (statusFilter === 'all' || item.status === statusFilter))
  const nextStatus = statusFilter === 'all' ? 'active' : statusFilter === 'active' ? 'paused' : statusFilter === 'paused' ? 'expired' : 'all'

  const copyCreds = (user) => {
    const pass = user.raw_password || user.rawPassword || user.password || 'Pass#1234'
    const text = `Subscriber: ${user.name}\nUsername: ${user.username}\nPassword: ${pass}\nServer URL: https://xtremetelevisiontv.com`
    navigator.clipboard.writeText(text)
    alert(`Copied Credentials for ${user.name}!\n\nUsername: ${user.username}\nPassword: ${pass}\nServer: https://xtremetelevisiontv.com`)
  }

  return (
    <div className="data-panel users-empty-panel">
      <div className="toolbar">
        <div className="table-search">
          <Search size={15} />
          <input placeholder="Search users or passwords" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div className="toolbar-actions">
          <button className="filter-button" onClick={() => setStatusFilter(nextStatus)}>
            {statusFilter === 'all' ? 'All statuses' : statusFilter} <ChevronDown size={13} />
          </button>
          <button className="outline-button" onClick={() => downloadCsv('subscribers.csv', filtered)}>
            <Download size={14} />Export
          </button>
        </div>
      </div>
      {users.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Subscriber</th>
                <th>Password</th>
                <th>Status</th>
                <th>Package</th>
                <th>Group</th>
                <th>Reseller</th>
                <th>Expires</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => {
                const userPass = user.raw_password || user.rawPassword || user.password || 'Pass#1234'
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="table-identity">
                        <span className="table-avatar">{user.name.slice(0, 2).toUpperCase()}</span>
                        <div>
                          <strong>{user.name}</strong>
                          <small>@{user.username} {user.email ? `· ${user.email}` : ''}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#0f172a', padding: '4px 8px', borderRadius: '6px', border: '1px solid #1e293b' }}>
                        <Key size={13} style={{ color: '#22d3ee' }} />
                        <code style={{ color: '#38bdf8', fontWeight: '700', fontSize: '13px', fontFamily: 'monospace' }}>{userPass}</code>
                        <button 
                          type="button"
                          className="table-more" 
                          style={{ padding: '2px 4px', width: 'auto', height: 'auto' }} 
                          title="Copy subscriber login credentials"
                          onClick={() => copyCreds(user)}
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className="status-badge"><i />{user.status}</span>
                    </td>
                    <td>{user.packageName || 'Unassigned'}</td>
                    <td>{user.groupName || 'Unassigned'}</td>
                    <td>{resellers.find((reseller) => reseller.id === user.resellerId)?.name || 'Direct'}</td>
                    <td>{user.expiresAt ? formatDate(user.expiresAt) : 'No expiry'}</td>
                    <td>
                      <div className="row-actions">
                        <button className="table-more" onClick={() => copyCreds(user)} title={`Copy credentials for ${user.name}`}>
                          <Copy size={14} />
                        </button>
                        <button className="table-more" onClick={() => onEdit(user)} aria-label={`Edit ${user.name}`}>
                          <Pencil size={14} />
                        </button>
                        <button className="table-more danger-action" onClick={() => onDelete(user.id)} aria-label={`Delete ${user.name}`}>
                          <X size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={Users} title="No users yet" description="Create your first subscriber account to begin managing access." action={{ label: 'Add user', onClick: onAction }} />
      )}
    </div>
  )
}

function ActivityList({ items }) {
  return (
    <div className="activity-list">
      {items.map((item) => (
        <div className="activity-row" key={item.id}>
          <span className="activity-dot" />
          <div className="activity-content">
            <strong>{item.message}</strong>
            <small>{formatDate(item.created_at || item.createdAt)}</small>
          </div>
        </div>
      ))}
    </div>
  )
}

function ManagedList({ title, items, emptyTitle, emptyDescription, action, actionLabel = 'Add', valueKey, onEdit, onDelete }) {
  return (
    <div className="data-panel managed-list-panel">
      <div className="toolbar">
        <div>
          <span className="section-kicker">MANAGEMENT</span>
          <h2>{title}</h2>
        </div>
        <button className="primary-button" onClick={action}>
          <Plus size={15} />{actionLabel}
        </button>
      </div>
      {items.length ? (
        <div className="managed-list">
          {items.map((item) => (
            <div className="managed-row" key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <span className="managed-icon"><Box size={16} /></span>
              <div className="managed-content" style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 auto', minWidth: 0 }}>
                <strong style={{ display: 'block', color: '#ecf3f5', fontSize: '13px', fontWeight: 600, margin: 0, lineHeight: '1.3' }}>{item.name}</strong>
                <small style={{ display: 'block', color: '#7b8b9c', fontSize: '11px', margin: 0, lineHeight: '1.4' }}>{item.description || item.url || `${item.member_count ?? item.memberCount ?? 0} members`}</small>
              </div>
              <span className="managed-value">
                {valueKey === 'url' ? (item.status || 'Ready') :
                 valueKey === 'contentCount' ? `${item.content_count ?? item.contentCount ?? 0} items` :
                 title === 'Subscriber packages' ? `$${Number(item.price || 0).toFixed(2)} · ${item.duration_days ?? item.durationDays ?? 30} days` :
                 `${item.member_count ?? item.memberCount ?? 0} members`}
              </span>
              <div className="row-actions">
                {onEdit && (
                  <button className="table-more" onClick={() => onEdit(item)} aria-label={`Edit ${item.name}`}>
                    <Pencil size={14} />
                  </button>
                )}
                {onDelete ? (
                  <button className="table-more danger-action" onClick={() => onDelete(item.id)} aria-label={`Delete ${item.name}`}>
                    <X size={15} />
                  </button>
                ) : !onEdit && (
                  <button className="table-more">
                    <MoreHorizontal size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Box} title={emptyTitle} description={emptyDescription} action={{ label: actionLabel, onClick: action }} />
      )}
    </div>
  )
}

function EpgList({ items, onEdit, onDelete }) {
  return (
    <div className="data-panel managed-list-panel">
      <div className="toolbar">
        <div>
          <span className="section-kicker">CONTENT LIBRARY</span>
          <h2>EPG schedules</h2>
        </div>
        <span className="muted-label">{items.length} scheduled</span>
      </div>
      {items.length ? (
        <div className="managed-list">
          {items.map((item) => (
            <div className="managed-row" key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <span className="managed-icon epg-icon"><CalendarDays size={16} /></span>
              <div className="managed-content" style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 auto', minWidth: 0 }}>
                <strong style={{ display: 'block', color: '#ecf3f5', fontSize: '13px', fontWeight: 600, margin: 0, lineHeight: '1.3' }}>{item.program_name || item.programName}</strong>
                <small style={{ display: 'block', color: '#7b8b9c', fontSize: '11px', margin: 0, lineHeight: '1.4' }}>{item.channel_name || item.channelName} · {formatDate(item.starts_at || item.startsAt)}</small>
              </div>
              <span className="managed-value">{item.status}</span>
              <div className="row-actions">
                <button className="table-more" onClick={() => onEdit(item)} aria-label={`Edit ${item.program_name || item.programName}`}>
                  <Pencil size={14} />
                </button>
                <button className="table-more danger-action" onClick={() => onDelete(item.id)} aria-label={`Delete ${item.program_name || item.programName}`}>
                  <X size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={CalendarDays} title="No EPG schedules connected" description="Connect a program guide to populate your channel schedules." />
      )}
    </div>
  )
}

function ActivityPage({ items = [], scope = 'all', title = 'Activity', description = 'Review recent operational events.', onRefresh }) {
  const [query, setQuery] = useState('')
  const [eventFilter, setEventFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [result, setResult] = useState({ items, total: items.length, page: 1, pageSize: 10, hasMore: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const pageSize = 10
  const visibleItems = result.items || []
  const pageCount = Math.max(1, Math.ceil((result.total || 0) / pageSize))
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ scope, page: String(page), pageSize: String(pageSize) })
    if (query.trim()) params.set('q', query.trim())
    if (eventFilter !== 'all') params.set('eventType', eventFilter)
    if (fromDate) params.set('from', fromDate)
    if (toDate) params.set('to', toDate)
    apiRequest(`/api/activity?${params.toString()}`)
      .then((payload) => { if (!cancelled) setResult(payload) })
      .catch((requestError) => { if (!cancelled) setError(requestError.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [scope, page, query, eventFilter, fromDate, toDate, reloadKey])
  useEffect(() => setPage(1), [query, eventFilter, fromDate, toDate, scope])
  const eventTypes = [...new Set((items || []).filter((item) => {
    const event = String(item.eventType || '').toLowerCase()
    const entity = String(item.entityType || '').toLowerCase()
    if (scope === 'user') return entity === 'user' || event.startsWith('user.')
    if (scope === 'reseller') return entity === 'reseller' || entity === 'credits' || event.startsWith('reseller.') || event.startsWith('credits.')
    if (scope === 'stream') return ['source', 'server'].includes(entity) || event.includes('stream') || event.includes('source') || event.includes('server')
    return true
  }).map((item) => String(item.eventType || 'unknown')))].sort()
  const emptyTitle = scope === 'user' ? 'No user activity yet' : scope === 'reseller' ? 'No reseller activity yet' : scope === 'stream' ? 'No stream events yet' : 'No activity yet'
  const emptyDescription = scope === 'user' ? 'Subscriber account events and access changes will appear here.' : scope === 'reseller' ? 'Partner account and credit events will appear here.' : scope === 'stream' ? 'Server, source, and delivery events will appear here.' : 'Operational events will appear here as your platform starts working.'
  return <div className="data-panel activity-page-panel">
    <div className="activity-page-intro"><div><span className="section-kicker">AUDIT LOG</span><h2>{title}</h2><p>{description}</p></div><span className="muted-label">{result.total || 0} matching events</span></div>
    <div className="toolbar activity-toolbar"><div className="table-search"><Search size={15} /><input aria-label="Search activity" placeholder="Search activity" value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="toolbar-actions"><select className="activity-filter" aria-label="Filter activity type" value={eventFilter} onChange={(event) => setEventFilter(event.target.value)}><option value="all">All event types</option>{eventTypes.map((eventType) => <option key={eventType} value={eventType}>{eventType}</option>)}</select><input className="activity-date-filter" aria-label="Activity from date" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /><input className="activity-date-filter" aria-label="Activity to date" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /><button className="outline-button" onClick={() => downloadCsv(`${scope}-activity.csv`, visibleItems)} disabled={!visibleItems.length}><Download size={14} />Export page</button><button className="outline-button" onClick={() => { setReloadKey((value) => value + 1); onRefresh?.() }}><RefreshCw size={14} />Refresh</button></div></div>
    {error ? <div className="activity-error"><AlertCircle size={15} /><span>{error}</span><button className="outline-button" onClick={() => setReloadKey((value) => value + 1)}>Try again</button></div> : loading ? <div className="activity-loading"><RefreshCw size={17} />Loading activity…</div> : visibleItems.length ? <><div className="activity-table-wrap"><table className="activity-table"><thead><tr><th>Event</th><th>Area</th><th>Details</th><th>Recorded</th></tr></thead><tbody>{visibleItems.map((item, index) => <tr key={item.id || `${item.eventType}-${index}`}><td><span className="event-badge">{String(item.eventType || 'activity').replaceAll('.', ' ')}</span></td><td><span className="activity-entity">{item.entityType || 'console'}</span>{item.entityId ? <small className="activity-entity-id">#{item.entityId}</small> : null}</td><td><strong>{item.message || 'Activity recorded'}</strong></td><td><time dateTime={item.createdAt || undefined} title={formatDateTime(item.createdAt)}>{formatDate(item.createdAt)}</time></td></tr>)}</tbody></table></div><div className="activity-pagination"><span>Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, result.total)} of {result.total}</span><div><button className="table-more" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={15} /></button><span>Page {page} of {pageCount}</span><button className="table-more" disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}><ChevronRight size={15} /></button></div></div></> : <EmptyState icon={Activity} title={query || eventFilter !== 'all' || fromDate || toDate ? 'No matching events' : emptyTitle} description={query || eventFilter !== 'all' || fromDate || toDate ? 'Try a different search, event type, or date range.' : emptyDescription} />}
  </div>
}

function GenericWorkspace({ page, navigate }) {
  return <div className="generic-card panel"><div className="generic-icon"><Sparkles size={21} /></div><span className="section-kicker">WORKSPACE READY</span><h2>{pageMeta[page]?.title || 'Workspace'} is ready to configure</h2><p>This section is provisioned for your operation. Add data or connect a source to begin.</p><button className="outline-button" onClick={() => navigate('dashboard')}>Return to dashboard <ArrowRight size={14} /></button></div>
}

function BackendModal({ type, item, resellers, packages, groups, onClose, onSubmit, isReseller }) {
  if (type === 'credentials_created') {
    return (
      <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
        <div className="modal-card">
          <div className="modal-header">
            <div>
              <span className="section-kicker">SUCCESS</span>
              <h2>Credentials Generated</h2>
              <p>The login credentials have been configured and dispatched via email.</p>
            </div>
            <button className="close-button" onClick={onClose}><X size={17} /></button>
          </div>
          <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', margin: '16px 0', border: '1px solid #1e293b' }}>
            <p style={{ margin: '0 0 8px 0', color: '#94a3b8', fontSize: '13px' }}>Account Name: <strong style={{ color: '#f8fafc' }}>{item?.name}</strong></p>
            <p style={{ margin: '0 0 8px 0', color: '#94a3b8', fontSize: '13px' }}>Username / Email: <strong style={{ color: '#06b6d4' }}>{item?.username || item?.email}</strong></p>
            <p style={{ margin: '0', color: '#94a3b8', fontSize: '13px' }}>Password: <code style={{ background: '#1e293b', color: '#22d3ee', padding: '4px 8px', borderRadius: '4px', fontSize: '15px', fontWeight: 'bold' }}>{item?.password}</code></p>
          </div>
          <div className="modal-actions">
            <button type="button" className="primary-button" onClick={() => {
              navigator.clipboard.writeText(`Account: ${item?.name}\nUsername/Email: ${item?.username || item?.email}\nPassword: ${item?.password}`)
              alert('Credentials copied to clipboard!')
            }}>
              Copy Credentials
            </button>
            <button type="button" className="outline-button" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    )
  }

  const initialForm = type === 'reseller'
    ? { name: '', email: '', capacity: '100', credits: '0', password: '' }
    : type === 'content'
      ? { name: '', category: 'Entertainment', country: 'Pakistan', source: 'Primary origin', contentType: 'live_tv' }
      : type === 'user'
        ? { name: '', username: '', email: '', expiresAt: '', packageId: '', groupId: '', resellerId: '', password: '' }
        : type === 'group'
          ? { name: '', description: '' }
          : type === 'package'
            ? { name: '', description: '', durationDays: '30', price: '0' }
            : type === 'server'
              ? { name: '', host: '', capacity: '100' }
              : type === 'source'
                ? { name: '', url: '' }
                : type === 'category'
                  ? { name: '', description: '' }
                  : type === 'epg'
                    ? { channelName: '', programName: '', startsAt: '', endsAt: '' }
                    : type === 'issue-credits'
                      ? { amount: '' }
                      : { amount: '', resellerId: '' }
  const initialValues = { ...initialForm, ...(item || {}) }
  if (type === 'user' || type === 'reseller') initialValues.password = ''
  if (type === 'user') initialValues.expiresAt = item?.expiresAt ? String(item.expiresAt).slice(0, 10) : ''
  if (type === 'epg') {
    initialValues.startsAt = item?.startsAt ? new Date(item.startsAt).toISOString().slice(0, 16) : ''
    initialValues.endsAt = item?.endsAt ? new Date(item.endsAt).toISOString().slice(0, 16) : ''
  }
  const [form, setForm] = useState(initialValues)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const meta = {
    reseller: ['Add reseller account', 'Create a partner account with an initial allocation.'],
    content: ['Add live content', 'Add a channel to your live TV library.'],
    user: ['Add subscriber account', 'Create a subscriber with access and expiry settings.'],
    group: ['Add user group', 'Organize subscribers into a reusable access group.'],
    package: ['Add subscriber package', 'Create a plan that can be assigned to subscribers.'],
    server: ['Add streaming server', 'Connect an origin to expand your delivery network.'],
    source: ['Add stream source', 'Register an upstream source for content delivery.'],
    category: ['Add content category', 'Create a reusable catalog category.'],
    epg: ['Add EPG schedule', 'Add a program to a channel schedule.'],
    'issue-credits': ['Issue master credits', 'Add credits to the master balance before allocating them.'],
    credits: ['Transfer credits', 'Allocate credits to a reseller account.'],
  }[type]
  function update(key, value) { setForm((current) => ({ ...current, [key]: value })); setError('') }
  function submit(event) {
    event.preventDefault()
    if (type === 'user' && (!form.name.trim() || !form.username.trim())) return setError('Name and username are required.')
    if ((type === 'group' || type === 'package') && !form.name.trim()) return setError('A name is required.')
    if (type === 'credits' && (!form.resellerId || Number(form.amount) < 1)) return setError('Choose a reseller and enter a valid amount.')
    if (type === 'issue-credits' && Number(form.amount) < 1) return setError('Enter a valid amount to issue.')
    if ((type === 'reseller' || type === 'content') && !form.name.trim()) return setError(type === 'reseller' ? 'Add a reseller name to continue.' : 'Add a channel name to continue.')
    if ((type === 'server' || type === 'source' || type === 'category') && !form.name.trim()) return setError('A name is required.')
    if (type === 'server' && !form.host.trim()) return setError('A host or origin URL is required.')
    if (type === 'source' && !form.url.trim()) return setError('A source URL is required.')
    if (type === 'epg' && (!form.channelName.trim() || !form.programName.trim() || !form.startsAt || !form.endsAt)) return setError('Channel, program, and both schedule times are required.')
    onSubmit(type, form, item)
  }
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><div className="modal-card"><div className="modal-header"><div><span className="section-kicker">{isReseller ? 'RESELLER CONSOLE' : 'MASTER CONSOLE'}</span><h2>{meta[0]}</h2><p>{meta[1]}</p></div><button className="close-button" onClick={onClose}><X size={17} /></button></div><form onSubmit={submit}>
    {type === 'reseller' && <><label>Account name<input autoFocus value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. North Star IPTV" /></label><label>Email address<input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="partner@example.com" /></label><label>Password {item ? '(leave blank to keep current)' : '(optional)'}<div className="password-wrap"><input value={form.password} onChange={(event) => update('password', event.target.value)} type={showPassword ? 'text' : 'password'} placeholder={item ? 'Enter new password to update' : 'Leave blank to auto-generate'} autoComplete="new-password" /><button type="button" onClick={() => setShowPassword((v) => !v)}><Eye size={16} /></button></div></label><div className="form-row"><label>User capacity<input type="number" min="1" value={form.capacity} onChange={(event) => update('capacity', event.target.value)} /></label>{!item && <label>Starting credits<input type="number" min="0" value={form.credits} onChange={(event) => update('credits', event.target.value)} /></label>}</div></>}
    {type === 'content' && <><label>Content type<select value={form.contentType} onChange={(event) => update('contentType', event.target.value)}><option value="live_tv">Live TV</option><option value="movie">Movie / VOD</option><option value="series">TV Series</option></select></label><label>Content name<input autoFocus value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. XTREME News" /></label><div className="form-row"><label>Category<select value={form.category} onChange={(event) => update('category', event.target.value)}><option>Entertainment</option><option>News</option><option>Sports</option><option>Kids</option></select></label><label>Country<select value={form.country} onChange={(event) => update('country', event.target.value)}><option>Pakistan</option><option>United Kingdom</option><option>United States</option><option>International</option></select></label></div><label>Stream source<input value={form.source} onChange={(event) => update('source', event.target.value)} placeholder="Primary origin" /></label></>}
     {type === 'user' && <><label>Subscriber name<input autoFocus value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Ahmed Khan" /></label><div className="form-row"><label>Username<input value={form.username} onChange={(event) => update('username', event.target.value)} placeholder="ahmed_khan" /></label><label>Email address<input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="subscriber@example.com" /></label></div><label>Password {item ? '(leave blank to keep current)' : '(optional)'}<div className="password-wrap"><input value={form.password} onChange={(event) => update('password', event.target.value)} type={showPassword ? 'text' : 'password'} placeholder={item ? 'Enter new password to update' : 'Leave blank to auto-generate'} autoComplete="new-password" /><button type="button" onClick={() => setShowPassword((v) => !v)}><Eye size={16} /></button></div></label><div className="form-row"><label>Package<select value={form.packageId} onChange={(event) => update('packageId', event.target.value)}><option value="">No package</option>{packages.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Group<select value={form.groupId} onChange={(event) => update('groupId', event.target.value)}><option value="">No group</option>{groups.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div><div className="form-row">{!isReseller && <label>Reseller<select value={form.resellerId} onChange={(event) => update('resellerId', event.target.value)}><option value="">Direct account</option>{resellers.filter((item) => item.status === 'active').map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}<label>Expires on<input type="date" value={form.expiresAt} onChange={(event) => update('expiresAt', event.target.value)} /></label></div></>}
    {type === 'group' && <><label>Group name<input autoFocus value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Premium subscribers" /></label><label>Description<textarea value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="What access does this group have?" /></label></>}
    {type === 'package' && <><label>Package name<input autoFocus value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Gold 30 days" /></label><label>Description<textarea value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Describe the subscriber plan" /></label><div className="form-row"><label>Duration (days)<input type="number" min="1" value={form.durationDays} onChange={(event) => update('durationDays', event.target.value)} /></label><label>Price<input type="number" min="0" step="0.01" value={form.price} onChange={(event) => update('price', event.target.value)} /></label></div></>}
    {type === 'server' && <><label>Server name<input autoFocus value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Primary origin" /></label><label>Host or origin URL<input value={form.host} onChange={(event) => update('host', event.target.value)} placeholder="origin.example.com" /></label><label>Capacity percentage<input type="number" min="1" max="100" value={form.capacity} onChange={(event) => update('capacity', event.target.value)} /></label></>}
    {type === 'source' && <><label>Source name<input autoFocus value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Partner feed" /></label><label>Source URL<input value={form.url} onChange={(event) => update('url', event.target.value)} placeholder="https://source.example.com/live" /></label></>}
    {type === 'category' && <><label>Category name<input autoFocus value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Sports" /></label><label>Description<textarea value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Describe this catalog category" /></label></>}
    {type === 'epg' && <><label>Channel name<input autoFocus value={form.channelName} onChange={(event) => update('channelName', event.target.value)} placeholder="e.g. XTREME Sports" /></label><label>Program name<input value={form.programName} onChange={(event) => update('programName', event.target.value)} placeholder="e.g. Live match coverage" /></label><div className="form-row"><label>Starts at<input type="datetime-local" value={form.startsAt} onChange={(event) => update('startsAt', event.target.value)} /></label><label>Ends at<input type="datetime-local" value={form.endsAt} onChange={(event) => update('endsAt', event.target.value)} /></label></div></>}
    {type === 'issue-credits' && <><div className="transfer-callout"><WalletCards size={20} /><div><strong>Master balance</strong><span>These credits can be transferred to active resellers.</span></div></div><label>Credit amount<input autoFocus type="number" min="1" value={form.amount} onChange={(event) => update('amount', event.target.value)} placeholder="Enter amount" /></label></>}
    {type === 'credits' && <><div className="transfer-callout"><WalletCards size={20} /><div><strong>Available to transfer</strong><span>Choose a reseller and amount below</span></div></div><label>Destination reseller<select autoFocus value={form.resellerId} onChange={(event) => update('resellerId', event.target.value)}><option value="" disabled>Select a reseller</option>{resellers.filter((item) => item.status === 'active').map((item) => <option key={item.id} value={item.id}>{item.name} · {item.credits} credits</option>)}</select></label><label>Credit amount<input type="number" min="1" value={form.amount} onChange={(event) => update('amount', event.target.value)} placeholder="Enter amount" /></label></>}
    {error && <div className="form-error"><AlertCircle size={14} />{error}</div>}<div className="modal-actions"><button type="button" className="outline-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button">{type === 'credits' ? 'Transfer credits' : type === 'issue-credits' ? 'Issue credits' : item ? 'Save changes' : 'Create and continue'}<ArrowRight size={15} /></button></div></form></div></div>
}

createRoot(document.getElementById('root')).render(<App />)