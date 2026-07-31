import { formatIPv4, parseCidr, parseIPv4 } from './ipv4'
import type { DhcpRange } from '../types'

export interface DhcpInput {
  network: string; gateway?: string; start?: string; end?: string; poolSize?: number
  exclusions: DhcpRange[]; reservations: string[]; leaseHours?: number
}
export interface DhcpResult {
  network: string; broadcast: string; proposedStart: string; proposedEnd: string; totalAddresses: number
  poolAddresses: number; unavailableInPool: number; assignableLeases: number; utilizationPercent: number
  mergedExclusions: DhcpRange[]; turnoverPerDay?: number; warnings: string[]
}

export const mergeRanges = (ranges: Array<{ start: number; end: number }>) => {
  const sorted = [...ranges].sort((a, b) => a.start - b.start)
  const merged: Array<{ start: number; end: number }> = []
  for (const range of sorted) {
    const last = merged.at(-1)
    if (last && range.start <= last.end + 1) last.end = Math.max(last.end, range.end)
    else merged.push({ ...range })
  }
  return merged
}

export const calculateDhcp = (input: DhcpInput): DhcpResult => {
  const cidr = parseCidr(input.network)
  const warnings: string[] = []
  const totalAddresses = 2 ** (32 - cidr.prefix)
  if (cidr.prefix >= 31) warnings.push(`/${cidr.prefix} networks have no traditional DHCP host pool.`)
  const usableStart = cidr.network + 1
  const usableEnd = cidr.broadcast - 1
  let start = input.start ? parseIPv4(input.start) : usableStart
  let end = input.end ? parseIPv4(input.end) : input.poolSize ? start + input.poolSize - 1 : usableEnd
  if (cidr.prefix >= 31) { start = cidr.network; end = cidr.network - 1 }
  if (start < usableStart || end > usableEnd || start > end) warnings.push('Pool must be ordered and remain between the first and last traditional host addresses.')
  const poolStart = Math.max(start, usableStart), poolEnd = Math.min(end, usableEnd)
  const exclusions: Array<{ start: number; end: number }> = []
  for (const range of input.exclusions) {
    try {
      const rangeStart = parseIPv4(range.start), rangeEnd = parseIPv4(range.end)
      if (rangeStart > rangeEnd) warnings.push(`Exclusion ${range.start}–${range.end} is reversed.`)
      else if (rangeEnd < cidr.network || rangeStart > cidr.broadcast) warnings.push(`Exclusion ${range.start}–${range.end} is outside the subnet.`)
      else exclusions.push({ start: Math.max(rangeStart, cidr.network), end: Math.min(rangeEnd, cidr.broadcast) })
    } catch (error) { warnings.push(error instanceof Error ? error.message : 'Invalid exclusion.') }
  }
  const merged = mergeRanges(exclusions)
  const unavailablePoints = new Set<number>()
  if (poolEnd >= poolStart) {
    if (input.gateway) {
      try { const gateway = parseIPv4(input.gateway); if (gateway >= poolStart && gateway <= poolEnd) unavailablePoints.add(gateway); if (gateway < cidr.network || gateway > cidr.broadcast) warnings.push('Gateway is outside the subnet.') } catch (error) { warnings.push(error instanceof Error ? error.message : 'Invalid gateway.') }
    }
    for (const reservation of input.reservations) {
      try { const value = parseIPv4(reservation); if (value >= poolStart && value <= poolEnd) unavailablePoints.add(value); else warnings.push(`Reservation ${reservation} is outside the proposed pool.`) } catch (error) { warnings.push(error instanceof Error ? error.message : 'Invalid reservation.') }
    }
  }
  const poolAddresses = Math.max(0, poolEnd - poolStart + 1)
  const exclusionsInPool = merged.map((range) => ({ start: Math.max(range.start, poolStart), end: Math.min(range.end, poolEnd) })).filter((range) => range.end >= range.start)
  const excludedCount = exclusionsInPool.reduce((total, range) => total + range.end - range.start + 1, 0)
  const pointCount = [...unavailablePoints].filter((value) => !exclusionsInPool.some((range) => value >= range.start && value <= range.end)).length
  const unavailableInPool = excludedCount + pointCount
  const assignableLeases = Math.max(0, poolAddresses - unavailableInPool)
  return {
    network: formatIPv4(cidr.network), broadcast: formatIPv4(cidr.broadcast), proposedStart: poolAddresses ? formatIPv4(poolStart) : 'None', proposedEnd: poolAddresses ? formatIPv4(poolEnd) : 'None',
    totalAddresses, poolAddresses, unavailableInPool, assignableLeases,
    utilizationPercent: poolAddresses ? (assignableLeases / poolAddresses) * 100 : 0,
    mergedExclusions: merged.map((range) => ({ start: formatIPv4(range.start), end: formatIPv4(range.end) })),
    turnoverPerDay: input.leaseHours && input.leaseHours > 0 ? assignableLeases * (24 / input.leaseHours) : undefined,
    warnings: [...new Set(warnings)]
  }
}
