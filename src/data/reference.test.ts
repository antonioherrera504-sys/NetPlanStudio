import { describe,expect,it } from 'vitest'
import { searchReferences } from './reference'
describe('reference search',()=>{
  it('searches names, categories, and exact ports',()=>{expect(searchReferences('BGP')[0]?.number).toBe('179');expect(searchReferences('443').some((entry)=>entry.name==='HTTPS')).toBe(true);expect(searchReferences('routing').length).toBeGreaterThan(1)})
  it('matches a number inside a bundled range',()=>{expect(searchReferences('68').some((entry)=>entry.name==='DHCPv4')).toBe(true)})
  it('filters by kind',()=>{expect(searchReferences('53',['UDP']).length).toBe(0);expect(searchReferences('53',['TCP/UDP']).length).toBe(1)})
})

