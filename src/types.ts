export type ThemeMode = 'light' | 'dark' | 'system'

export interface DhcpRange { start: string; end: string }

export interface Vlan {
  id: string
  vlanId: number
  name: string
  description: string
  subnet: string
  gateway: string
  dhcpEnabled: boolean
  dhcpRange?: DhcpRange
  site: string
  notes: string
  color?: string
  createdAt: string
  updatedAt: string
}

export interface VlanPlan {
  id: string
  name: string
  vlans: Vlan[]
  createdAt: string
  updatedAt: string
}

export type DeviceType = 'router' | 'l2-switch' | 'l3-switch' | 'firewall' | 'server' | 'access-point' | 'cloud' | 'endpoint' | 'device' | 'annotation' | 'group'

export interface DiagramNode {
  id: string
  type: DeviceType
  x: number
  y: number
  name: string
  managementIp?: string
  vendorModel?: string
  location?: string
  notes?: string
  color?: string
  vlanId?: string
  width?: number
  height?: number
}

export interface DiagramLink {
  id: string
  source: string
  target: string
  sourceLabel?: string
  targetLabel?: string
  speed?: string
  vlanLabel?: string
  color?: string
  lineStyle?: 'solid' | 'dashed' | 'dotted'
  notes?: string
  vlanId?: string
}

export interface Diagram {
  id: string
  name: string
  nodes: DiagramNode[]
  links: DiagramLink[]
  grid: boolean
  snap: boolean
  createdAt: string
  updatedAt: string
}

export interface Preferences {
  theme: ThemeMode
  favoriteReferences: string[]
  activePlanId?: string
  activeDiagramId?: string
}

export interface AppData {
  schemaVersion: 1
  plans: VlanPlan[]
  diagrams: Diagram[]
  preferences: Preferences
}

export const nowIso = () => new Date().toISOString()
export const uid = (prefix: string) => `${prefix}-${crypto.randomUUID()}`

