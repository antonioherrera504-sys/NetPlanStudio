import type { Vlan } from '../types'
import { cidrsOverlap, ipv4InCidr, parseCidr, parseIPv4 } from './ipv4'

export interface VlanIssue { vlanId?: string; field: string; message: string }

export const validateVlans = (vlans: Vlan[]): VlanIssue[] => {
  const issues: VlanIssue[] = []
  const ids = new Map<number, string[]>()
  for (const vlan of vlans) {
    if (!Number.isInteger(vlan.vlanId) || vlan.vlanId < 1 || vlan.vlanId > 4094) issues.push({ vlanId: vlan.id, field: 'vlanId', message: 'VLAN ID must be from 1 through 4094.' })
    ids.set(vlan.vlanId, [...(ids.get(vlan.vlanId) ?? []), vlan.id])
    try {
      const cidr = parseCidr(vlan.subnet)
      if (vlan.gateway && !ipv4InCidr(vlan.gateway, vlan.subnet)) issues.push({ vlanId: vlan.id, field: 'gateway', message: 'Gateway is outside the VLAN subnet.' })
      if (vlan.gateway) {
        const gw = parseIPv4(vlan.gateway)
        if (gw === cidr.network || gw === cidr.broadcast) issues.push({ vlanId: vlan.id, field: 'gateway', message: 'Gateway cannot be the network or broadcast address.' })
      }
      if (vlan.dhcpEnabled && vlan.dhcpRange) {
        const start = parseIPv4(vlan.dhcpRange.start), end = parseIPv4(vlan.dhcpRange.end)
        if (start > end) issues.push({ vlanId: vlan.id, field: 'dhcpRange', message: 'DHCP range start must not exceed its end.' })
        if (!ipv4InCidr(vlan.dhcpRange.start, vlan.subnet) || !ipv4InCidr(vlan.dhcpRange.end, vlan.subnet)) issues.push({ vlanId: vlan.id, field: 'dhcpRange', message: 'DHCP range must stay inside the VLAN subnet.' })
      }
    } catch (error) { issues.push({ vlanId: vlan.id, field: 'subnet', message: error instanceof Error ? error.message : 'Invalid subnet.' }) }
  }
  for (const [id, matches] of ids) if (matches.length > 1) matches.forEach((vlanId) => issues.push({ vlanId, field: 'vlanId', message: `VLAN ID ${id} is duplicated.` }))
  for (let i = 0; i < vlans.length; i += 1) for (let j = i + 1; j < vlans.length; j += 1) {
    try { if (cidrsOverlap(vlans[i]!.subnet, vlans[j]!.subnet)) { issues.push({ vlanId: vlans[i]!.id, field: 'subnet', message: `Subnet overlaps VLAN ${vlans[j]!.vlanId}.` }); issues.push({ vlanId: vlans[j]!.id, field: 'subnet', message: `Subnet overlaps VLAN ${vlans[i]!.vlanId}.` }) } } catch { /* individual errors are already reported */ }
  }
  return issues
}

