import { useEffect, useState, type ReactNode } from 'react'
import { Activity, Calculator, Cable, Database, Gauge, GitBranch, House, Menu, MoonStar, Network, PanelLeftClose, Settings, Sun, TableProperties, WifiOff, X, type LucideIcon } from 'lucide-react'
import { useAppData } from '../state/DataContext'
import { Link, usePath } from '../router'

const nav: Array<{ to: string; label: string; icon: LucideIcon }> = [
  { to: '/', label: 'Dashboard', icon: House }, { to: '/subnet', label: 'Subnet Calculator', icon: Calculator },
  { to: '/vlans', label: 'VLAN Planner', icon: TableProperties }, { to: '/dhcp', label: 'DHCP Pool', icon: Database },
  { to: '/bandwidth', label: 'Bandwidth', icon: Gauge }, { to: '/converter', label: 'IP Converter', icon: Activity },
  { to: '/reference', label: 'Port Reference', icon: Cable }, { to: '/diagram', label: 'Diagram Scratchpad', icon: GitBranch },
  { to: '/settings', label: 'Data & Settings', icon: Settings }
]

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)
  const path = usePath()
  const { data, saveState, setTheme } = useAppData()
  const page = nav.find((item) => item.to === path)?.label ?? 'NetPlan Studio'
  useEffect(() => { const update = () => setOnline(navigator.onLine); addEventListener('online', update); addEventListener('offline', update); return () => { removeEventListener('online', update); removeEventListener('offline', update) } }, [])
  return <div className="app-shell">
    <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Primary navigation">
      <div className="brand"><span className="brand-mark"><Network size={21} /></span><span><strong>NetPlan</strong><small>Studio</small></span><button className="icon-button mobile-only" onClick={() => setOpen(false)} aria-label="Close navigation"><X /></button></div>
      <nav>{nav.map(({ to, label, icon: Icon }) => <Link key={to} to={to} className={path === to ? 'active' : ''} onClick={() => setOpen(false)}><Icon size={18} /><span>{label}</span></Link>)}</nav>
      <div className="sidebar-note"><span className="status-dot" />Local workspace<small>No telemetry · No cloud sync</small></div>
    </aside>
    {open && <button className="scrim" aria-label="Close navigation" onClick={() => setOpen(false)} />}
    <div className="main-area">
      <header className="topbar">
        <div className="topbar-title"><button className="icon-button menu-button" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu /></button><div><span className="eyebrow">Network engineering utility</span><strong>{page}</strong></div></div>
        <div className="topbar-actions">
          <span className={`offline-badge ${online ? '' : 'is-offline'}`} title={online ? 'App data remains local; connection currently available' : 'Offline mode active'}>{online ? <PanelLeftClose size={14} /> : <WifiOff size={14} />}{online ? 'Local only' : 'Offline'}</span>
          <span className={`save-state ${saveState}`}>{saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Save error' : 'Saved locally'}</span>
          <label className="theme-control"><span className="sr-only">Theme</span>{data.preferences.theme === 'dark' ? <MoonStar size={16} /> : <Sun size={16} />}<select value={data.preferences.theme} onChange={(event) => setTheme(event.target.value as any)}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
        </div>
      </header>
      <main id="main-content" className="content">{children}</main>
      <footer><span>Verify all generated plans before applying them to production infrastructure.</span><span>All calculations and storage remain on this device.</span></footer>
    </div>
  </div>
}
