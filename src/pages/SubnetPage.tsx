import { useMemo, useState } from 'react'
import { ArrowRight, Plus } from 'lucide-react'
import { useNavigate, useSearchParams } from '../router'
import { calculateSubnet, prefixToMask, type SubnetResult } from '../lib/ipv4'
import { nowIso, uid, type Vlan } from '../types'
import { useAppData } from '../state/DataContext'
import { Field, PageIntro, ResultRow, ValidBadge } from '../components/UI'

export function SubnetPage() {
  const params = useSearchParams()
  const [ip, setIp] = useState(params.get('ip') ?? '192.168.10.42')
  const [prefix, setPrefix] = useState(params.get('prefix') ?? '24')
  const [mask, setMask] = useState('255.255.255.0')
  const [mode, setMode] = useState<'cidr' | 'mask'>('cidr')
  const { data, setData, notify } = useAppData()
  const navigate = useNavigate()
  const calculation = useMemo<{ result: SubnetResult | null; error: string }>(() => {
    try { return { result: calculateSubnet(ip, mode === 'cidr' ? prefix : mask), error: '' } }
    catch (cause) { return { result: null, error: cause instanceof Error ? cause.message : 'Invalid IPv4 input.' } }
  }, [ip, prefix, mask, mode])
  const result = calculation.result
  const error = calculation.error
  const changePrefix = (value: string) => { setPrefix(value); try { setMask(calculateSubnet(ip, value).mask) } catch { /* result area provides validation */ } }
  const changeMask = (value: string) => { setMask(value); try { setPrefix(String(calculateSubnet(ip, value).prefix)) } catch { /* result area provides validation */ } }
  const addToVlan = () => {
    if (!result) return
    const timestamp = nowIso()
    const vlan: Vlan = { id: uid('vlan'), vlanId: 1, name: `Subnet ${result.network}/${result.prefix}`, description: 'Created from Subnet Calculator', subnet: `${result.network}/${result.prefix}`, gateway: result.traditionalUsable ? result.firstUsable : '', dhcpEnabled: false, site: '', notes: '', createdAt: timestamp, updatedAt: timestamp }
    let planId = data.preferences.activePlanId
    if (!planId || !data.plans.some((plan) => plan.id === planId)) planId = data.plans[0]?.id
    if (!planId) {
      planId = uid('plan')
      setData((current) => ({ ...current, plans: [{ id: planId!, name: 'Default plan', vlans: [vlan], createdAt: timestamp, updatedAt: timestamp }], preferences: { ...current.preferences, activePlanId: planId } }))
    } else setData((current) => ({ ...current, plans: current.plans.map((plan) => plan.id === planId ? { ...plan, vlans: [...plan.vlans, vlan], updatedAt: timestamp } : plan) }))
    notify('Subnet added to VLAN Planner'); navigate('/vlans')
  }
  return <>
    <PageIntro eyebrow="Addressing" title="Subnet Calculator" description="Inspect an IPv4 network’s exact boundaries, masks, host capacity, historical class, and binary form." actions={result && <button className="primary" onClick={addToVlan}><Plus size={16} />Add to VLAN plan</button>} />
    <div className="grid two">
      <section className="panel"><div className="panel-header"><div><h2>Network input</h2><p>CIDR and dotted-mask values stay synchronized.</p></div>{result && <ValidBadge>Valid IPv4</ValidBadge>}</div><div className="panel-body stack">
        <Field label="IPv4 address" error={error && error.toLowerCase().includes('octet') ? error : undefined}><input className="mono" value={ip} onChange={(event) => setIp(event.target.value)} spellCheck={false} inputMode="decimal" aria-describedby="subnet-error" /></Field>
        <div className="segmented" aria-label="Prefix input mode"><button className={mode === 'cidr' ? 'active' : ''} onClick={() => setMode('cidr')}>CIDR prefix</button><button className={mode === 'mask' ? 'active' : ''} onClick={() => setMode('mask')}>Subnet mask</button></div>
        {mode === 'cidr' ? <Field label="CIDR prefix" hint={result ? `Equivalent mask: ${result.mask}` : 'Integer from 0 through 32'}><div className="input-row"><input className="mono" value={prefix} onChange={(event) => changePrefix(event.target.value)} inputMode="numeric" /><select aria-label="Common CIDR presets" value="" onChange={(event) => { if (event.target.value) changePrefix(event.target.value) }}><option value="">Common prefix…</option>{[8,16,20,22,23,24,25,26,27,28,29,30,31,32].map((value) => <option value={value} key={value}>/{value} · {prefixToMask(value)}</option>)}</select></div></Field> : <Field label="Subnet mask" hint={result ? `Equivalent prefix: /${result.prefix}` : 'Mask bits must be contiguous'}><input className="mono" value={mask} onChange={(event) => changeMask(event.target.value)} inputMode="decimal" /></Field>}
        {error && <p id="subnet-error" className="error-text" role="alert">{error}</p>}
        <div className="notice">IPv4 class is shown for historical context. Modern routing and allocation use classless CIDR.</div>
      </div></section>
      <section className="panel"><div className="panel-header"><div><h2>Calculated network</h2><p>{result ? `${result.network}/${result.prefix}` : 'Enter a valid address and prefix'}</p></div></div><div className="panel-body">
        {result ? <><div className="result-list"><ResultRow label="Normalized address" value={result.normalizedIp} /><ResultRow label="CIDR prefix" value={`/${result.prefix}`} /><ResultRow label="Subnet mask" value={result.mask} /><ResultRow label="Wildcard mask" value={result.wildcard} /><ResultRow label="Network address" value={result.network} /><ResultRow label="Broadcast address" value={result.broadcast} /><ResultRow label="First usable / endpoint" value={result.firstUsable} /><ResultRow label="Last usable / endpoint" value={result.lastUsable} /><ResultRow label="Total addresses" value={result.totalAddresses.toLocaleString()} /><ResultRow label="Traditional usable hosts" value={result.traditionalUsable.toLocaleString()} /><ResultRow label="Classification" value={result.classification} mono={false} /><ResultRow label="Address class" value={result.addressClass} mono={false} copy={false} /></div><div className="notice warning" style={{ marginTop: 14 }}>{result.note}</div></> : <div className="empty-state"><ArrowRight /><h2>Results appear here</h2><p>Correct the highlighted input to calculate this network.</p></div>}
      </div></section>
    </div>
    {result && <section className="panel" style={{ marginTop: 18 }}><div className="panel-header"><h2>Binary representation</h2></div><div className="panel-body grid two"><div><span className="eyebrow">Address</span><div className="binary">{result.addressBinary}</div></div><div><span className="eyebrow">Mask</span><div className="binary">{result.maskBinary}</div></div></div></section>}
  </>
}
