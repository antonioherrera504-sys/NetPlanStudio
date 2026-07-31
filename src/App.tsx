import { lazy, Suspense, type ReactNode } from 'react'
import { AppShell } from './components/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { SubnetPage } from './pages/SubnetPage'
import { VlanPage } from './pages/VlanPage'
import { DhcpPage } from './pages/DhcpPage'
import { BandwidthPage } from './pages/BandwidthPage'
import { ConverterPage } from './pages/ConverterPage'
import { ReferencePage } from './pages/ReferencePage'
import { SettingsPage } from './pages/SettingsPage'
import { usePath } from './router'
const DiagramPage = lazy(() => import('./pages/DiagramPage'))

export default function App() {
  const path = usePath()
  const pages: Record<string, ReactNode> = { '/': <DashboardPage />, '/subnet': <SubnetPage />, '/vlans': <VlanPage />, '/dhcp': <DhcpPage />, '/bandwidth': <BandwidthPage />, '/converter': <ConverterPage />, '/reference': <ReferencePage />, '/diagram': <DiagramPage />, '/settings': <SettingsPage /> }
  return <AppShell><Suspense fallback={<div className="page-state"><span className="spinner" />Loading tool…</div>}>{pages[path] ?? <DashboardPage />}</Suspense></AppShell>
}
