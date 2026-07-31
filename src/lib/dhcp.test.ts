import { describe,expect,it } from 'vitest'
import { calculateDhcp,mergeRanges } from './dhcp'
describe('DHCP pool calculation',()=>{
  it('merges overlapping and adjacent exclusions',()=>{expect(mergeRanges([{start:10,end:20},{start:15,end:30},{start:31,end:33}])).toEqual([{start:10,end:33}])})
  it('counts gateway, overlapping exclusions, duplicate reservations once',()=>{const result=calculateDhcp({network:'192.168.1.0/24',gateway:'192.168.1.1',start:'192.168.1.1',end:'192.168.1.20',exclusions:[{start:'192.168.1.5',end:'192.168.1.10'},{start:'192.168.1.8',end:'192.168.1.12'}],reservations:['192.168.1.15','192.168.1.15']});expect(result.poolAddresses).toBe(20);expect(result.unavailableInPool).toBe(10);expect(result.assignableLeases).toBe(10)})
  it('handles /31 and /32 explicitly',()=>{expect(calculateDhcp({network:'192.0.2.0/31',exclusions:[],reservations:[]}).assignableLeases).toBe(0);expect(calculateDhcp({network:'192.0.2.1/32',exclusions:[],reservations:[]}).warnings[0]).toMatch(/no traditional/)})
})

