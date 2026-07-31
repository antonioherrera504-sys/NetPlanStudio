import { useMemo, useRef, useState } from 'react'
import { CopyPlus, Download, FileUp, Network, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Link } from '../router'
import { downloadText, escapeCsv } from '../lib/files'
import { parseCidr } from '../lib/ipv4'
import { parseImportedJson, vlanPlanSchema } from '../lib/schemas'
import { validateVlans } from '../lib/vlan'
import { nowIso, uid, type Vlan, type VlanPlan } from '../types'
import { useAppData } from '../state/DataContext'
import { EmptyState, Field, PageIntro } from '../components/UI'

const blankVlan = (): Vlan => { const now = nowIso(); return { id: uid('vlan'), vlanId: 10, name: '', description: '', subnet: '192.168.10.0/24', gateway: '192.168.10.1', dhcpEnabled: false, site: '', notes: '', color: '#2387c9', createdAt: now, updatedAt: now } }
const samplePlan = (): VlanPlan => { const now = nowIso(); return { id: uid('plan'), name: 'Branch office sample', createdAt: now, updatedAt: now, vlans: [
  { ...blankVlan(), id: uid('vlan'), vlanId: 10, name: 'Users', description: 'Employee wired clients', subnet: '10.44.10.0/24', gateway: '10.44.10.1', dhcpEnabled: true, dhcpRange: { start: '10.44.10.50', end: '10.44.10.220' }, site: 'Branch 44', createdAt: now, updatedAt: now },
  { ...blankVlan(), id: uid('vlan'), vlanId: 20, name: 'Voice', description: 'IP phones', subnet: '10.44.20.0/24', gateway: '10.44.20.1', dhcpEnabled: true, dhcpRange: { start: '10.44.20.20', end: '10.44.20.240' }, site: 'Branch 44', color: '#8b5cf6', createdAt: now, updatedAt: now },
  { ...blankVlan(), id: uid('vlan'), vlanId: 99, name: 'Management', description: 'Network infrastructure', subnet: '10.44.99.0/26', gateway: '10.44.99.1', dhcpEnabled: false, site: 'Branch 44', color: '#df7b17', createdAt: now, updatedAt: now }
] } }

export function VlanPage() {
  const { data, setData, notify } = useAppData()
  const [query, setQuery] = useState('')
  const [site, setSite] = useState('all')
  const [sort, setSort] = useState<'id' | 'name' | 'subnet'>('id')
  const [editing, setEditing] = useState<Vlan | null>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const active = data.plans.find((plan) => plan.id === data.preferences.activePlanId) ?? data.plans[0]
  const issues = useMemo(() => validateVlans(active?.vlans ?? []), [active?.vlans])
  const visible = useMemo(() => [...(active?.vlans ?? [])].filter((vlan) => site === 'all' || vlan.site === site).filter((vlan) => [vlan.vlanId, vlan.name, vlan.description, vlan.subnet, vlan.site].some((value) => String(value).toLowerCase().includes(query.toLowerCase()))).sort((a, b) => sort === 'id' ? a.vlanId - b.vlanId : String(a[sort]).localeCompare(String(b[sort]))), [active?.vlans, query, site, sort])
  const sites = [...new Set((active?.vlans ?? []).map((vlan) => vlan.site).filter(Boolean))]
  const capacity = (active?.vlans ?? []).reduce((total, vlan) => { try { return total + 2 ** (32 - parseCidr(vlan.subnet).prefix) } catch { return total } }, 0)
  const setActiveId = (activePlanId: string) => setData((current) => ({ ...current, preferences: { ...current.preferences, activePlanId } }))
  const newPlan = () => { const now = nowIso(); const plan: VlanPlan = { id: uid('plan'), name: `VLAN plan ${data.plans.length + 1}`, vlans: [], createdAt: now, updatedAt: now }; setData((current) => ({ ...current, plans: [...current.plans, plan], preferences: { ...current.preferences, activePlanId: plan.id } })); notify('New plan created') }
  const saveVlan = (vlan: Vlan) => {
    if (!active) return
    const updated = { ...vlan, updatedAt: nowIso() }
    setData((current) => ({ ...current, plans: current.plans.map((plan) => plan.id === active.id ? { ...plan, vlans: plan.vlans.some((item) => item.id === updated.id) ? plan.vlans.map((item) => item.id === updated.id ? updated : item) : [...plan.vlans, updated], updatedAt: nowIso() } : plan) })); setEditing(null); notify('VLAN saved locally')
  }
  const removeVlan = (id: string) => { if (!active || !confirm('Delete this VLAN? Diagram references will be preserved but shown as unlinked.')) return; setData((current) => ({ ...current, plans: current.plans.map((plan) => plan.id === active.id ? { ...plan, vlans: plan.vlans.filter((vlan) => vlan.id !== id), updatedAt: nowIso() } : plan) })); notify('VLAN deleted') }
  const duplicate = (vlan: Vlan) => { const copy = { ...vlan, id: uid('vlan'), vlanId: Math.min(4094, vlan.vlanId + 1), name: `${vlan.name} copy`, createdAt: nowIso(), updatedAt: nowIso() }; saveVlan(copy) }
  const deletePlan = () => { if (!active || !confirm(`Delete “${active.name}” and all ${active.vlans.length} VLANs? This cannot be undone.`)) return; setData((current) => { const plans = current.plans.filter((plan) => plan.id !== active.id); return { ...current, plans, preferences: { ...current.preferences, activePlanId: plans[0]?.id } } }); notify('Plan deleted') }
  const renamePlan = (name: string) => { if (!active) return; setData((current) => ({ ...current, plans: current.plans.map((plan) => plan.id === active.id ? { ...plan, name: name.slice(0,100), updatedAt: nowIso() } : plan) })) }
  const exportJson = () => { if (!active) return; downloadText(`${active.name.replace(/[^a-z0-9]+/gi,'-').toLowerCase()}.netplan.json`, JSON.stringify(active, null, 2)); notify('Plan exported') }
  const exportCsv = () => { if (!active) return; const headers = ['VLAN ID','Name','Description','Subnet','Gateway','DHCP','DHCP Start','DHCP End','Site','Notes']; const rows = active.vlans.map((vlan) => [vlan.vlanId,vlan.name,vlan.description,vlan.subnet,vlan.gateway,vlan.dhcpEnabled,vlan.dhcpRange?.start ?? '',vlan.dhcpRange?.end ?? '',vlan.site,vlan.notes]); downloadText(`${active.name.replace(/[^a-z0-9]+/gi,'-').toLowerCase()}.csv`, [headers,...rows].map((row) => row.map(escapeCsv).join(',')).join('\r\n'), 'text/csv'); notify('CSV exported') }
  const importPlan = async (file?: File) => { if (!file) return; try { const plan = parseImportedJson(await file.text(), vlanPlanSchema); const id = uid('plan'); setData((current) => ({ ...current, plans: [...current.plans, { ...plan, id, name: `${plan.name} (imported)`, updatedAt: nowIso() }], preferences: { ...current.preferences, activePlanId: id } })); notify('Validated plan imported') } catch (error) { notify(error instanceof Error ? error.message : 'Import failed') } finally { if (importRef.current) importRef.current.value = '' } }
  const loadSample = () => { const plan = samplePlan(); setData((current) => ({ ...current, plans: [...current.plans, plan], preferences: { ...current.preferences, activePlanId: plan.id } })); notify('Sample plan loaded') }
  return <>
    <PageIntro eyebrow="Segmentation planning" title="VLAN Planner" description="Build named plans, catch duplicate IDs and overlapping subnets, and keep gateways and DHCP scopes inside their assigned networks." actions={<><button onClick={newPlan}><Plus size={15} />New plan</button>{active && <button className="primary" onClick={() => setEditing(blankVlan())}><Plus size={15} />Add VLAN</button>}</>} />
    {!active ? <section className="panel"><EmptyState icon={<Network size={30} />} title="No VLAN plans yet" action={<div className="form-actions"><button className="primary" onClick={newPlan}>Create blank plan</button><button onClick={loadSample}>Load sample plan</button></div>}>Start a clean plan or intentionally load a documented branch-office example.</EmptyState></section> : <div className="stack">
      <section className="metrics"><div className="metric"><span>VLANs</span><strong>{active.vlans.length}</strong><small>in this plan</small></div><div className="metric"><span>Address capacity</span><strong>{capacity.toLocaleString()}</strong><small>total addresses</small></div><div className="metric"><span>Validation issues</span><strong>{issues.length}</strong><small>{issues.length ? 'review before use' : 'plan is consistent'}</small></div><div className="metric"><span>DHCP-enabled</span><strong>{active.vlans.filter((vlan) => vlan.dhcpEnabled).length}</strong><small>VLAN entries</small></div></section>
      <section className="panel"><div className="panel-header"><div style={{ flex: 1 }}><span className="eyebrow">Active plan</span><input aria-label="Plan name" value={active.name} onChange={(event) => renamePlan(event.target.value)} style={{ maxWidth: 360, marginTop: 5 }} /></div><div className="form-actions"><select aria-label="Select plan" value={active.id} onChange={(event) => setActiveId(event.target.value)}>{data.plans.map((plan) => <option value={plan.id} key={plan.id}>{plan.name}</option>)}</select><button className="small" onClick={exportJson}><Download size={14} />JSON</button><button className="small" onClick={exportCsv}><Download size={14} />CSV</button><button className="small" onClick={() => importRef.current?.click()}><FileUp size={14} />Import</button><button className="small danger" onClick={deletePlan}><Trash2 size={14} />Delete plan</button><input ref={importRef} className="sr-only" type="file" accept="application/json,.json" onChange={(event) => void importPlan(event.target.files?.[0])} /></div></div><div className="panel-body"><div className="toolbar">
        <Field label="Search"><div className="search-field"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ID, name, subnet, site…" /></div></Field>
        <Field label="Site"><select value={site} onChange={(event) => setSite(event.target.value)}><option value="all">All sites</option>{sites.map((value) => <option key={value}>{value}</option>)}</select></Field>
        <Field label="Sort"><select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option value="id">VLAN ID</option><option value="name">Name</option><option value="subnet">Subnet</option></select></Field>
      </div></div>
      {issues.length > 0 && <div className="panel-footer"><div className="notice warning"><strong>{issues.length} validation issue{issues.length === 1 ? '' : 's'}:</strong><ul>{issues.slice(0,5).map((issue,index) => <li key={`${issue.vlanId}-${index}`}>{issue.message}</li>)}</ul>{issues.length > 5 && <span>And {issues.length - 5} more.</span>}</div></div>}
      <div className="table-wrap">{visible.length ? <table className="data-table"><thead><tr><th>ID</th><th>Name</th><th>Subnet</th><th>Gateway</th><th>DHCP</th><th>Site</th><th>Actions</th></tr></thead><tbody>{visible.map((vlan) => <tr key={vlan.id}><td><strong>{vlan.vlanId}</strong></td><td><span className="tag" style={{ borderLeft: `3px solid ${vlan.color ?? 'var(--accent)'}` }}>{vlan.name || 'Unnamed'}</span></td><td className="mono">{vlan.subnet}</td><td className="mono">{vlan.gateway || '—'}</td><td>{vlan.dhcpEnabled ? <span className="valid-badge">Enabled</span> : 'Off'}</td><td>{vlan.site || '—'}</td><td><div className="row-actions"><Link className="button small" to={`/subnet?ip=${vlan.subnet.split('/')[0]}&prefix=${vlan.subnet.split('/')[1]}`} title="Open in Subnet Calculator"><Network size={14} /></Link><Link className="button small" to={`/dhcp?vlan=${vlan.id}`} title="Open in DHCP Calculator"><Network size={14} /></Link><button className="icon-button" title="Edit VLAN" onClick={() => setEditing(vlan)}><Pencil /></button><button className="icon-button" title="Duplicate VLAN" onClick={() => duplicate(vlan)}><CopyPlus /></button><button className="icon-button" title="Delete VLAN" onClick={() => removeVlan(vlan.id)}><Trash2 /></button></div></td></tr>)}</tbody></table> : <EmptyState title="No VLANs match" action={<button onClick={() => { setQuery(''); setSite('all') }}>Clear filters</button>}>Adjust the filters or add another VLAN to this plan.</EmptyState>}</div></section>
      <button onClick={loadSample} style={{ justifySelf: 'start' }}>Load another sample plan</button>
    </div>}
    {editing && <VlanModal vlan={editing} onClose={() => setEditing(null)} onSave={saveVlan} />}
  </>
}

function VlanModal({ vlan, onClose, onSave }: { vlan: Vlan; onClose: () => void; onSave: (vlan: Vlan) => void }) {
  const [draft, setDraft] = useState(vlan)
  const update = <K extends keyof Vlan>(key: K, value: Vlan[K]) => setDraft((current) => ({ ...current, [key]: value }))
  let error = ''
  if (!Number.isInteger(draft.vlanId) || draft.vlanId < 1 || draft.vlanId > 4094) error = 'VLAN ID must be an integer from 1 through 4094.'
  else { try { parseCidr(draft.subnet) } catch (cause) { error = cause instanceof Error ? cause.message : 'Invalid subnet.' } }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="vlan-dialog-title"><div className="modal-header"><h2 id="vlan-dialog-title">{vlan.name ? 'Edit VLAN' : 'Add VLAN'}</h2><button className="icon-button" aria-label="Close" onClick={onClose}>×</button></div><div className="modal-body stack">
    <div className="input-row"><Field label="VLAN ID"><input type="number" min="1" max="4094" value={draft.vlanId} onChange={(event) => update('vlanId', Number(event.target.value))} /></Field><Field label="VLAN name"><input value={draft.name} maxLength={100} onChange={(event) => update('name', event.target.value)} /></Field></div>
    <Field label="Description"><input value={draft.description} maxLength={500} onChange={(event) => update('description', event.target.value)} /></Field>
    <div className="input-row"><Field label="IPv4 subnet (CIDR)"><input className="mono" value={draft.subnet} onChange={(event) => update('subnet', event.target.value)} /></Field><Field label="Default gateway"><input className="mono" value={draft.gateway} onChange={(event) => update('gateway', event.target.value)} /></Field></div>
    <div className="input-row"><Field label="Site / location"><input value={draft.site} onChange={(event) => update('site', event.target.value)} /></Field><Field label="Color tag"><input type="color" value={draft.color ?? '#2387c9'} onChange={(event) => update('color', event.target.value)} /></Field></div>
    <label className="check-row"><input type="checkbox" checked={draft.dhcpEnabled} onChange={(event) => update('dhcpEnabled', event.target.checked)} />DHCP enabled</label>
    {draft.dhcpEnabled && <div className="input-row"><Field label="DHCP start"><input className="mono" value={draft.dhcpRange?.start ?? ''} onChange={(event) => update('dhcpRange', { start: event.target.value, end: draft.dhcpRange?.end ?? '' })} /></Field><Field label="DHCP end"><input className="mono" value={draft.dhcpRange?.end ?? ''} onChange={(event) => update('dhcpRange', { start: draft.dhcpRange?.start ?? '', end: event.target.value })} /></Field></div>}
    <Field label="Notes"><textarea value={draft.notes} maxLength={2000} onChange={(event) => update('notes', event.target.value)} /></Field>{error && <p className="error-text" role="alert">{error}</p>}
  </div><div className="modal-footer"><button onClick={onClose}>Cancel</button><button className="primary" disabled={Boolean(error)} onClick={() => onSave(draft)}>Save VLAN</button></div></section></div>
}
