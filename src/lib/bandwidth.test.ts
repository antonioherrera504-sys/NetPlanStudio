import { describe,expect,it } from 'vitest'
import { fromBits,packetsPerSecond,requiredBitsPerSecond,toBits,transferSeconds,utilization } from './bandwidth'
describe('bandwidth conversion and formulas',()=>{
  it('distinguishes decimal and binary byte units',()=>{expect(toBits(1,'MB')).toBe(8_000_000);expect(toBits(1,'MiB')).toBe(8_388_608);expect(fromBits(8_000_000,'MB')).toBe(1)})
  it('calculates transfer time and required rate',()=>{expect(transferSeconds(1,'GB',1,'Gb',0)).toBe(8);expect(requiredBitsPerSecond(1,'GB',8,'seconds',0)).toBe(1e9)})
  it('calculates utilization and pps',()=>{expect(utilization(500,'Mb',1,'Gb')).toBe(50);expect(packetsPerSecond(1,'Gb',1000,0)).toBe(125000)})
  it('rejects zero and impossible overhead',()=>{expect(()=>toBits(0,'MB')).toThrow();expect(()=>transferSeconds(1,'GB',1,'Gb',100)).toThrow()})
})

