import { Link } from '../router'
import { Activity, Calculator, Cable, Database, Gauge, GitBranch, TableProperties, type LucideIcon } from 'lucide-react'
import { useAppData } from '../state/DataContext'

const tools: Array<{ to: string; name: string; description: string; detail: string; icon: LucideIcon }> = [
  { to: '/subnet', name: 'Subnet Calculator', description: 'Inspect IPv4 boundaries, masks, host ranges, and classifications.', detail: 'CIDR · Masks · Binary', icon: Calculator },
  { to: '/vlans', name: 'VLAN Planner', description: 'Build validated, searchable VLAN plans with local autosave.', detail: 'Plans · CSV · JSON', icon: TableProperties },
  { to: '/dhcp', name: 'DHCP Pool Calculator', description: 'Model exclusions, reservations, leases, and address utilization.', detail: 'Ranges · Capacity · Handoff', icon: Database },
  { to: '/bandwidth', name: 'Bandwidth Calculator', description: 'Calculate transfer time, throughput, capacity, and packet rates.', detail: '5 modes · SI · IEC', icon: Gauge },
  { to: '/converter', name: 'IP Address Converter', description: 'Convert and classify IPv4 and IPv6 representations safely.', detail: 'BigInt · Hex · Binary', icon: Activity },
  { to: '/reference', name: 'Port & Protocol Reference', description: 'Search the bundled service, protocol, EtherType, and ICMP catalog.', detail: 'Local dataset · Favorites', icon: Cable },
  { to: '/diagram', name: 'Diagram Scratchpad', description: 'Sketch devices and links, then save or export the topology.', detail: 'SVG · Undo · Local', icon: GitBranch }
]

export function DashboardPage() {
  const { data } = useAppData()
  const vlanCount = data.plans.reduce((total, plan) => total + plan.vlans.length, 0)
  return <>
    <section className="dashboard-hero">
      <span className="eyebrow">Offline-first network workspace</span>
      <h1>Plan clearly. Calculate confidently.</h1>
      <p>Seven focused utilities for addressing, capacity, protocol lookup, and topology sketching—without sending operational data anywhere.</p>
      <div className="hero-badges"><span>No accounts</span><span>No API calls</span><span>Versioned local storage</span><span>Installable PWA</span></div>
    </section>
    <section className="metrics" aria-label="Workspace summary">
      <div className="metric"><span>Tools available</span><strong>7</strong><small>Fully local</small></div>
      <div className="metric"><span>Saved VLAN plans</span><strong>{data.plans.length}</strong><small>{vlanCount} VLAN entries</small></div>
      <div className="metric"><span>Saved diagrams</span><strong>{data.diagrams.length}</strong><small>On this device</small></div>
      <div className="metric"><span>Reference favorites</span><strong>{data.preferences.favoriteReferences.length}</strong><small>Bundled dataset</small></div>
    </section>
    <div className="section-heading"><div><h2>Engineering utilities</h2><p>Open a tool to begin. Inputs and calculations stay in this browser.</p></div></div>
    <section className="tool-grid">{tools.map(({ to, name, description, detail, icon: Icon }) => <Link className="tool-card" to={to} key={to}><span className="tool-icon"><Icon size={20} /></span><h2>{name}</h2><p>{description}</p><small>{detail} →</small></Link>)}</section>
  </>
}
