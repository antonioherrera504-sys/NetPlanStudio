import { formatIPv4, parseIPv4 } from './ipv4'

export class IPv6InputError extends Error {}
const MAX128 = (1n << 128n) - 1n

export const parseIPv6 = (raw: string): bigint => {
  let input = raw.trim().toLowerCase()
  const zoneIndex = input.indexOf('%')
  if (zoneIndex >= 0) input = input.slice(0, zoneIndex)
  if (!input || (input.match(/::/g)?.length ?? 0) > 1) throw new IPv6InputError('IPv6 must contain hexadecimal groups and at most one “::”.')
  if (input.includes('.')) {
    const lastColon = input.lastIndexOf(':')
    if (lastColon < 0) throw new IPv6InputError('Embedded IPv4 requires an IPv6 prefix.')
    const ipv4 = parseIPv4(input.slice(lastColon + 1))
    input = `${input.slice(0, lastColon)}:${((ipv4 >>> 16) & 0xffff).toString(16)}:${(ipv4 & 0xffff).toString(16)}`
  }
  const halves = input.split('::')
  const left = halves[0] ? halves[0].split(':') : []
  const right = halves[1] ? halves[1].split(':') : []
  const omitted = 8 - left.length - right.length
  if ((halves.length === 1 && omitted !== 0) || (halves.length === 2 && omitted < 1)) throw new IPv6InputError('IPv6 must expand to exactly eight groups.')
  const groups = [...left, ...Array(Math.max(0, omitted)).fill('0'), ...right]
  if (groups.length !== 8 || groups.some((group) => !/^[0-9a-f]{1,4}$/.test(group))) throw new IPv6InputError('Each IPv6 group must contain one to four hexadecimal digits.')
  return groups.reduce((value, group) => (value << 16n) | BigInt(`0x${group}`), 0n)
}

export const expandIPv6 = (value: bigint) => {
  if (value < 0n || value > MAX128) throw new IPv6InputError('IPv6 value is outside the unsigned 128-bit range.')
  return Array.from({ length: 8 }, (_, index) => Number((value >> BigInt((7 - index) * 16)) & 0xffffn).toString(16).padStart(4, '0')).join(':')
}

export const compressIPv6 = (value: bigint) => {
  const groups = expandIPv6(value).split(':').map((group) => group.replace(/^0+/, '') || '0')
  let bestStart = -1, bestLength = 0, start = -1
  for (let i = 0; i <= groups.length; i += 1) {
    if (i < groups.length && groups[i] === '0') { if (start < 0) start = i }
    else if (start >= 0) { const length = i - start; if (length > bestLength && length >= 2) { bestStart = start; bestLength = length }; start = -1 }
  }
  if (bestStart < 0) return groups.join(':')
  const before = groups.slice(0, bestStart).join(':')
  const after = groups.slice(bestStart + bestLength).join(':')
  return `${before}::${after}`
}

export const ipv4Mapped = (value: bigint): string | null => {
  if ((value >> 32n) !== 0xffffn) return null
  return `::ffff:${formatIPv4(Number(value & 0xffffffffn))}`
}

export const classifyIPv6 = (value: bigint) => {
  if (value === 0n) return { classification: 'unspecified', scope: 'none' }
  if (value === 1n) return { classification: 'loopback', scope: 'host' }
  if ((value >> 120n) === 0xffn) {
    const scopeCode = Number((value >> 112n) & 0xfn)
    const scopes: Record<number, string> = { 1: 'interface-local', 2: 'link-local', 5: 'site-local', 8: 'organization-local', 14: 'global' }
    return { classification: 'multicast', scope: scopes[scopeCode] ?? `scope ${scopeCode}` }
  }
  if ((value >> 118n) === 0x3fan) return { classification: 'link-local', scope: 'link' }
  if ((value >> 121n) === 0x7en) return { classification: 'unique-local', scope: 'private' }
  if ((value >> 96n) === 0x20010db8n) return { classification: 'documentation', scope: 'global' }
  if (ipv4Mapped(value)) return { classification: 'IPv4-mapped', scope: 'mapped IPv4' }
  return { classification: 'unicast', scope: 'global' }
}

