import { useMemo, useState } from 'react'
import { ArrowRight, Plus, Send, Trash2 } from 'lucide-react'
import { useSearchParams } from '../router'
import { calculateDhcp, type DhcpInput } from '../lib/dhcp'
import { nowIso, type DhcpRange } from '../types'
import { useAppData } from '../state/DataContext'
import { Field, PageIntro, ResultRow, ValidBadge } from '../components/UI'

export function DhcpPage() {
  const { data, setData, notify } = useAppData()
  const params = useSearchParams()
  const initialVlan = data.plans.flatMap((plan) => plan.vlans).find((vlan) => vlan.id === params.get('vlan'))
  const [network, setNetwork] = useState(initialVlan?.subnet ?? '192.168.50.0/24')
  const [gateway, setGateway] = useState(initialVlan?.gateway ?? '192.168.50.1')
  const [rangeMode, setRangeMode] = useState<'range' | 'size'>('range')
  const [start, setStart] = useState(initialVlan?.dhcpRange?.start ?? '192.168.50.50')
  const [end, setEnd] = useState(initialVlan?.dhcpRange?.end ?? '192.168.50.220')
  const [poolSize, setPoolSize] = useState('100')
  const [exclusions, setExclusions] = useState<DhcpRange[]>([{ start: '192.168.50.100', end: '192.168.50.110' }])
  const [reservationsText, setReservationsText] = useState('192.168.50.60')
  const [leaseHours, setLeaseHours] = useState('24')
  const [targetVlanId, setTargetVlanId] = useState(initialVlan?.id ?? '')
  const calculation = useMemo(() => {
    const input: DhcpInput = { network, gateway, start, exclusions, reservations: reservationsText.split(/[\s,]+/).filter(Boolean), leaseHours: Number(leaseHours) || undefined }
    if (rangeMode === 'range') input.end = end
    else input.poolSize = Number(poolSize)
    try { return { result: calculateDhcp(input), error: '' } } catch (error) { return { result: null, error: error instanceof Error ? error.message : 'Unable to calculate this pool.' } }
  }, [network, gateway, start, end, poolSize, exclusions, reservationsText, leaseHours, rangeMode])
  const vlans = data.plans.flatMap((plan) => plan.vlans.map((vlan) => ({ ...vlan, planName: plan.name })))
  const sendToVlan = () => {
    if (!calculation.result || !targetVlanId || calculation.result.warnings.length) return
    setData((current) => ({ ...current, plans: current.plans.map((plan) => ({ ...plan, vlans: plan.vlans.map((vlan) => vlan.id === targetVlanId ? { ...vlan, dhcpEnabled: true, dhcpRange: { start: calculation.result!.proposedStart, end: calculation.result!.proposedEnd }, updatedAt: nowIso() } : vlan) })) })); notify('DHCP pool sent to VLAN Planner')
  }
  const selectVlan = (id: string) => { const vlan = vlans.find((item) => item.id === id); setTargetVlanId(id); if (vlan) { setNetwork(vlan.subnet); setGateway(vlan.gateway); if (vlan.dhcpRange) { setStart(vlan.dhcpRange.start); setEnd(vlan.dhcpRange.end); setRangeMode('range') } } }
  return <>
    <PageIntro eyebrow="Address assignment" title="DHCP Pool Calculator" description="Propose a pool, normalize overlapping exclusions, count reservations once, and estimate lease turnover." actions={calculation.result && !calculation.result.warnings.length && <ValidBadge>Valid pool</ValidBadge>} />
    <div className="grid two">
      <section className="panel"><div className="panel-header"><div><h2>Pool inputs</h2><p>Network and broadcast addresses are always protected.</p></div></div><div className="panel-body stack">
        <div className="input-row"><Field label="Network in CIDR"><input className="mono" value={network} onChange={(event) => setNetwork(event.target.value)} /></Field><Field label="Default gateway"><input className="mono" value={gateway} onChange={(event) => setGateway(event.target.value)} /></Field></div>
        <div className="segmented"><button className={rangeMode === 'range' ? 'active' : ''} onClick={() => setRangeMode('range')}>Start and end</button><button className={rangeMode === 'size' ? 'active' : ''} onClick={() => setRangeMode('size')}>Requested size</button></div>
        {rangeMode === 'range' ? <div className="input-row"><Field label="Desired start"><input className="mono" value={start} onChange={(event) => setStart(event.target.value)} /></Field><Field label="Desired end"><input className="mono" value={end} onChange={(event) => setEnd(event.target.value)} /></Field></div> : <div className="input-row"><Field label="Desired start"><input className="mono" value={start} onChange={(event) => setStart(event.target.value)} /></Field><Field label="Requested pool size"><input type="number" min="1" value={poolSize} onChange={(event) => setPoolSize(event.target.value)} /></Field></div>}
        <div><div className="panel-header" style={{ paddingInline: 0 }}><div><h2>Excluded ranges</h2><p>Overlapping and adjacent ranges are merged.</p></div><button className="small" onClick={() => setExclusions((current) => [...current, { start: '', end: '' }])}><Plus size={14} />Add</button></div>{exclusions.map((range, index) => <div className="input-row" key={index} style={{ marginTop: 8 }}><Field label={`Range ${index + 1} start`}><input className="mono" value={range.start} onChange={(event) => setExclusions((current) => current.map((item,i) => i === index ? { ...item, start: event.target.value } : item))} /></Field><Field label={`Range ${index + 1} end`}><div style={{ display: 'flex', gap: 5 }}><input className="mono" value={range.end} onChange={(event) => setExclusions((current) => current.map((item,i) => i === index ? { ...item, end: event.target.value } : item))} /><button className="icon-button" aria-label={`Remove exclusion ${index + 1}`} onClick={() => setExclusions((current) => current.filter((_,i) => i !== index))}><Trash2 /></button></div></Field></div>)}</div>
        <Field label="Individual reservations" hint="Comma, space, or line separated. Duplicates are counted once."><textarea className="mono" value={reservationsText} onChange={(event) => setReservationsText(event.target.value)} /></Field>
        <Field label="Lease duration (hours)" hint="Optional; used for theoretical daily turnover"><input type="number" min="0.1" step="0.1" value={leaseHours} onChange={(event) => setLeaseHours(event.target.value)} /></Field>
      </div></section>
      <section className="panel"><div className="panel-header"><div><h2>Pool analysis</h2><p>{calculation.result ? `${calculation.result.proposedStart} – ${calculation.result.proposedEnd}` : 'Correct the input to continue'}</p></div></div><div className="panel-body">
        {calculation.error && <div className="notice error" role="alert">{calculation.error}</div>}
        {calculation.result && <><div className="result-list"><ResultRow label="Network address" value={calculation.result.network} /><ResultRow label="Broadcast address" value={calculation.result.broadcast} /><ResultRow label="Proposed pool start" value={calculation.result.proposedStart} /><ResultRow label="Proposed pool end" value={calculation.result.proposedEnd} /><ResultRow label="Total subnet addresses" value={calculation.result.totalAddresses.toLocaleString()} /><ResultRow label="Addresses in pool" value={calculation.result.poolAddresses.toLocaleString()} /><ResultRow label="Excluded / reserved in pool" value={calculation.result.unavailableInPool.toLocaleString()} /><ResultRow label="Assignable leases" value={calculation.result.assignableLeases.toLocaleString()} /><ResultRow label="Pool availability" value={`${calculation.result.utilizationPercent.toFixed(1)}%`} />{calculation.result.turnoverPerDay !== undefined && <ResultRow label="Theoretical leases / day" value={calculation.result.turnoverPerDay.toFixed(1)} />}</div>
        {calculation.result.mergedExclusions.length > 0 && <div className="notice" style={{ marginTop: 14 }}><strong>Merged exclusions:</strong> <span className="mono">{calculation.result.mergedExclusions.map((range) => `${range.start}–${range.end}`).join(', ')}</span></div>}
        {calculation.result.warnings.length > 0 && <div className="notice warning" style={{ marginTop: 14 }}><strong>Review before use</strong><ul>{calculation.result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>}
        </>}
      </div><div className="panel-footer"><div className="stack"><Field label="Send valid pool to VLAN"><select value={targetVlanId} onChange={(event) => selectVlan(event.target.value)}><option value="">Select a VLAN…</option>{vlans.map((vlan) => <option value={vlan.id} key={vlan.id}>{vlan.planName} · {vlan.vlanId} {vlan.name}</option>)}</select></Field><button className="primary" disabled={!targetVlanId || !calculation.result || calculation.result.warnings.length > 0} onClick={sendToVlan}><Send size={15} />Update VLAN DHCP range</button></div></div></section>
    </div>
    <div className="notice" style={{ marginTop: 18 }}><ArrowRight size={14} /> DHCP capacity is a planning estimate. Server-specific conflict detection, failover, relay behavior, and lease database state are outside this browser-only tool.</div>
  </>
}
