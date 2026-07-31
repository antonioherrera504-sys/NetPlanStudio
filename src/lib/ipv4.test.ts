import { describe, expect, it } from 'vitest'
import { calculateSubnet, maskToPrefix, parseIPv4, prefixToMask } from './ipv4'

describe('IPv4 subnet calculations', () => {
  it('calculates a normal /24 and mask/wildcard values', () => {
    const result = calculateSubnet('192.168.1.42','24')
    expect(result.network).toBe('192.168.1.0'); expect(result.broadcast).toBe('192.168.1.255')
    expect(result.traditionalUsable).toBe(254); expect(result.wildcard).toBe('0.0.0.255')
  })
  it('handles /0, /31, and /32 boundaries', () => {
    expect(calculateSubnet('203.0.113.9','0').totalAddresses).toBe(2 ** 32)
    const p31=calculateSubnet('192.0.2.4','31'); expect(p31.firstUsable).toBe('192.0.2.4'); expect(p31.lastUsable).toBe('192.0.2.5'); expect(p31.traditionalUsable).toBe(0)
    const p32=calculateSubnet('255.255.255.255','32'); expect(p32.totalAddresses).toBe(1); expect(p32.network).toBe('255.255.255.255')
  })
  it('converts masks and rejects invalid input', () => {
    expect(prefixToMask(23)).toBe('255.255.254.0'); expect(maskToPrefix('255.255.255.252')).toBe(30)
    expect(()=>maskToPrefix('255.0.255.0')).toThrow(/contiguous/); expect(()=>parseIPv4('01.2.3.4')).toThrow(/Leading zeroes/); expect(()=>parseIPv4('256.1.1.1')).toThrow(/outside/)
  })
})

