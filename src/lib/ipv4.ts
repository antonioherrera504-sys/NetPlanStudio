export class NetworkInputError extends Error {}

export const parseIPv4 = (value: string): number => {
  const input = value.trim()
  const parts = input.split('.')
  if (parts.length !== 4) throw new NetworkInputError('Enter exactly four decimal octets separated by dots.')
  const octets = parts.map((part) => {
    if (!/^\d{1,3}$/.test(part)) throw new NetworkInputError(`“${part || '(empty)'}” is not a decimal octet.`)
    if (part.length > 1 && part.startsWith('0')) throw new NetworkInputError('Leading zeroes are ambiguous and are not accepted.')
    const octet = Number(part)
    if (octet > 255) throw new NetworkInputError(`Octet ${octet} is outside 0–255.`)
    return octet
  })
  return (((octets[0]! << 24) | (octets[1]! << 16) | (octets[2]! << 8) | octets[3]!) >>> 0)
}

export const formatIPv4 = (value: number): string =>
  [value >>> 24, (value >>> 16) & 255, (value >>> 8) & 255, value & 255].join('.')

export const prefixToMaskInt = (prefix: number): number => {
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) throw new NetworkInputError('Prefix length must be an integer from 0 through 32.')
  return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
}

export const prefixToMask = (prefix: number) => formatIPv4(prefixToMaskInt(prefix))

export const maskToPrefix = (mask: string): number => {
  const value = parseIPv4(mask)
  let seenZero = false
  let prefix = 0
  for (let bit = 31; bit >= 0; bit -= 1) {
    const set = ((value >>> bit) & 1) === 1
    if (!set) seenZero = true
    else if (seenZero) throw new NetworkInputError('Subnet mask bits must be contiguous.')
    else prefix += 1
  }
  return prefix
}

export const parsePrefixOrMask = (value: string): number => {
  const trimmed = value.trim().replace(/^\//, '')
  return trimmed.includes('.') ? maskToPrefix(trimmed) : (() => {
    if (!/^\d{1,2}$/.test(trimmed)) throw new NetworkInputError('Enter a CIDR prefix (for example /24) or a dotted subnet mask.')
    return prefixToMaskInt(Number(trimmed)) >= 0 ? Number(trimmed) : 0
  })()
}

export interface ParsedCidr { address: number; prefix: number; network: number; broadcast: number }

export const parseCidr = (value: string): ParsedCidr => {
  const [ip, prefixText, ...rest] = value.trim().split('/')
  if (!ip || prefixText === undefined || rest.length) throw new NetworkInputError('Use CIDR notation such as 192.0.2.0/24.')
  const address = parseIPv4(ip)
  const prefix = parsePrefixOrMask(prefixText)
  const mask = prefixToMaskInt(prefix)
  const network = (address & mask) >>> 0
  const broadcast = (network | (~mask >>> 0)) >>> 0
  return { address, prefix, network, broadcast }
}

export const ipv4InCidr = (ip: string, cidr: string) => {
  const parsed = parseCidr(cidr)
  const value = parseIPv4(ip)
  return value >= parsed.network && value <= parsed.broadcast
}

export const cidrsOverlap = (a: string, b: string) => {
  const left = parseCidr(a)
  const right = parseCidr(b)
  return left.network <= right.broadcast && right.network <= left.broadcast
}

export type IPv4Classification = 'private' | 'public' | 'loopback' | 'link-local' | 'multicast' | 'documentation' | 'reserved' | 'unspecified' | 'limited broadcast'

export const classifyIPv4 = (value: number): IPv4Classification => {
  const within = (cidr: string) => {
    const { network, broadcast } = parseCidr(cidr)
    return value >= network && value <= broadcast
  }
  if (value === 0) return 'unspecified'
  if (value === 0xffffffff) return 'limited broadcast'
  if (within('10.0.0.0/8') || within('172.16.0.0/12') || within('192.168.0.0/16')) return 'private'
  if (within('127.0.0.0/8')) return 'loopback'
  if (within('169.254.0.0/16')) return 'link-local'
  if (within('224.0.0.0/4')) return 'multicast'
  if (within('192.0.2.0/24') || within('198.51.100.0/24') || within('203.0.113.0/24')) return 'documentation'
  if (within('0.0.0.0/8') || within('100.64.0.0/10') || within('192.0.0.0/24') || within('198.18.0.0/15') || within('240.0.0.0/4')) return 'reserved'
  return 'public'
}

export const addressClass = (value: number): string => {
  const first = value >>> 24
  if (first <= 127) return 'Class A (historical)'
  if (first <= 191) return 'Class B (historical)'
  if (first <= 223) return 'Class C (historical)'
  if (first <= 239) return 'Class D (multicast)'
  return 'Class E (reserved)'
}

export interface SubnetResult {
  normalizedIp: string; prefix: number; mask: string; wildcard: string; network: string; broadcast: string
  firstUsable: string; lastUsable: string; totalAddresses: number; traditionalUsable: number
  addressClass: string; classification: IPv4Classification; addressBinary: string; maskBinary: string; note: string
}

export const calculateSubnet = (ip: string, prefixOrMask: string): SubnetResult => {
  const address = parseIPv4(ip)
  const prefix = parsePrefixOrMask(prefixOrMask)
  const maskInt = prefixToMaskInt(prefix)
  const network = (address & maskInt) >>> 0
  const broadcast = (network | (~maskInt >>> 0)) >>> 0
  const totalAddresses = 2 ** (32 - prefix)
  const is31 = prefix === 31
  const is32 = prefix === 32
  const first = is32 ? network : is31 ? network : network + 1
  const last = is32 ? network : is31 ? broadcast : broadcast - 1
  return {
    normalizedIp: formatIPv4(address), prefix, mask: formatIPv4(maskInt), wildcard: formatIPv4(~maskInt >>> 0),
    network: formatIPv4(network), broadcast: formatIPv4(broadcast), firstUsable: formatIPv4(first), lastUsable: formatIPv4(last),
    totalAddresses, traditionalUsable: prefix <= 30 ? totalAddresses - 2 : 0,
    addressClass: addressClass(address), classification: classifyIPv4(address),
    addressBinary: address.toString(2).padStart(32, '0').match(/.{8}/g)!.join('.'),
    maskBinary: maskInt.toString(2).padStart(32, '0').match(/.{8}/g)!.join('.'),
    note: is31 ? 'A /31 has two point-to-point endpoint addresses under RFC 3021; neither is a traditional host address.' : is32 ? 'A /32 identifies one host route. It has no separate network, broadcast, or traditional host range.' : 'Network and broadcast addresses are excluded from the traditional usable-host count.'
  }
}

