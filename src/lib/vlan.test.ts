import { describe,expect,it } from 'vitest'
import { validateVlans } from './vlan'
import type { Vlan } from '../types'
const vlan=(id:string,vlanId:number,subnet:string,gateway:string):Vlan=>({id,vlanId,name:id,description:'',subnet,gateway,dhcpEnabled:false,site:'',notes:'',createdAt:'2026-01-01',updatedAt:'2026-01-01'})
describe('VLAN validation',()=>{
  it('detects invalid and duplicate IDs',()=>{const issues=validateVlans([vlan('a',10,'10.0.0.0/24','10.0.0.1'),vlan('b',10,'10.0.2.0/24','10.0.2.1'),vlan('c',4095,'10.0.3.0/24','10.0.3.1')]);expect(issues.some((issue)=>issue.message.includes('duplicated'))).toBe(true);expect(issues.some((issue)=>issue.message.includes('1 through 4094'))).toBe(true)})
  it('detects overlap and out-of-subnet gateway',()=>{const issues=validateVlans([vlan('a',10,'10.0.0.0/24','10.0.0.1'),vlan('b',20,'10.0.0.128/25','10.0.1.1')]);expect(issues.some((issue)=>issue.message.includes('overlaps'))).toBe(true);expect(issues.some((issue)=>issue.message.includes('outside'))).toBe(true)})
})

