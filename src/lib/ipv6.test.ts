import { describe,expect,it } from 'vitest'
import { classifyIPv6, compressIPv6, expandIPv6, ipv4Mapped, parseIPv6 } from './ipv6'

describe('IPv6 parsing and formatting',()=>{
  it('preserves zero and maximum exact values',()=>{expect(parseIPv6('::')).toBe(0n);expect(expandIPv6((1n<<128n)-1n)).toBe('ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff')})
  it('expands and compresses RFC-style values',()=>{const value=parseIPv6('2001:db8::ff00:42:8329');expect(expandIPv6(value)).toBe('2001:0db8:0000:0000:0000:ff00:0042:8329');expect(compressIPv6(value)).toBe('2001:db8::ff00:42:8329');expect(classifyIPv6(value).classification).toBe('documentation')})
  it('handles IPv4-mapped notation',()=>{const value=parseIPv6('::ffff:192.0.2.128');expect(ipv4Mapped(value)).toBe('::ffff:192.0.2.128')})
  it('rejects malformed values',()=>{expect(()=>parseIPv6('2001:::1')).toThrow();expect(()=>parseIPv6('1:2:3')).toThrow()})
})

