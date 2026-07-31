import { useEffect, useRef, useState } from 'react'
import { Database, Download, FileUp, HardDrive, ShieldCheck, Trash2 } from 'lucide-react'
import { PageIntro } from '../components/UI'
import { downloadText } from '../lib/files'
import { appDataSchema, parseImportedJson } from '../lib/schemas'
import { clearAppData, emptyAppData, STORAGE_NAMESPACE } from '../lib/storage'
import { useAppData } from '../state/DataContext'

export function SettingsPage() {
  const { data,setData,notify } = useAppData()
  const inputRef = useRef<HTMLInputElement>(null)
  const [updateReady,setUpdateReady] = useState(false)
  useEffect(() => { const ready = () => setUpdateReady(true); addEventListener('netplan:update-ready',ready); return () => removeEventListener('netplan:update-ready',ready) }, [])
  const exportAll = () => { downloadText(`netplan-studio-backup-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(data,null,2)); notify('Full backup exported') }
  const importAll = async (file?: File) => { if (!file) return; try { const imported = parseImportedJson(await file.text(),appDataSchema); if (!confirm(`Replace local data with this validated backup (${imported.plans.length} plans and ${imported.diagrams.length} diagrams)?`)) return; setData(imported); notify('Backup restored') } catch (error) { notify(error instanceof Error ? error.message : 'Import failed') } finally { if (inputRef.current) inputRef.current.value = '' } }
  const clearAll = async () => { if (!confirm('Clear every NetPlan Studio plan, diagram, favorite, and preference stored in this browser? Export a backup first if needed.')) return; await clearAppData(); setData(emptyAppData()); notify('All local data cleared') }
  return <>
    <PageIntro eyebrow="Privacy & resilience" title="Data & Settings" description="Back up or restore the complete versioned workspace and understand exactly where application data lives." />
    {updateReady && <div className="notice" style={{marginBottom:18}}>A newer application version is ready. <button className="small" onClick={() => location.reload()}>Reload to update</button></div>}
    <section className="metrics"><div className="metric"><span>Storage namespace</span><strong style={{fontSize:'1rem'}} className="mono">{STORAGE_NAMESPACE}</strong><small>IndexedDB</small></div><div className="metric"><span>Schema version</span><strong>{data.schemaVersion}</strong><small>migration-aware</small></div><div className="metric"><span>VLAN plans</span><strong>{data.plans.length}</strong><small>saved locally</small></div><div className="metric"><span>Diagrams</span><strong>{data.diagrams.length}</strong><small>saved locally</small></div></section>
    <div className="grid two" style={{marginTop:18}}><section className="panel"><div className="panel-header"><div><h2>Backup and restore</h2><p>Validated, versioned JSON with a 5 MB import safety limit.</p></div><Database /></div><div className="panel-body stack"><button className="primary" onClick={exportAll}><Download size={16}/>Export all data</button><button onClick={() => inputRef.current?.click()}><FileUp size={16}/>Import backup</button><input ref={inputRef} className="sr-only" type="file" accept="application/json,.json" onChange={(event) => void importAll(event.target.files?.[0])}/><div className="notice">Imports are parsed as untrusted data, checked against the current schema, and rejected before your current data changes if malformed or oversized.</div></div></section>
      <section className="panel"><div className="panel-header"><div><h2>Clear local data</h2><p>Removes application records from this browser.</p></div><Trash2 /></div><div className="panel-body stack"><p style={{color:'var(--muted)',fontSize:'.82rem',lineHeight:1.6}}>Clearing browser site data, using private browsing, or removing this app may also delete plans and diagrams. Export a backup before clearing anything important.</p><button className="danger" onClick={() => void clearAll()}><Trash2 size={16}/>Clear all local data</button></div></section>
    </div>
    <div className="grid two" style={{marginTop:18}}><section className="panel"><div className="panel-header"><h2><ShieldCheck size={18}/> Privacy statement</h2></div><div className="panel-body"><p style={{color:'var(--muted)',fontSize:'.82rem',lineHeight:1.65,margin:0}}>NetPlan Studio has no accounts, analytics, telemetry, backend, or API calls. User-entered addresses, plans, favorites, and diagrams remain in browser storage on this device. Exporting creates a local file only when you request it.</p></div></section><section className="panel"><div className="panel-header"><h2><HardDrive size={18}/> Offline behavior</h2></div><div className="panel-body"><p style={{color:'var(--muted)',fontSize:'.82rem',lineHeight:1.65,margin:0}}>After the production app has loaded once, its service worker caches the application shell and bundled assets. All seven tools then remain usable without a network connection. New deployments are downloaded separately and activated after reload.</p></div></section></div>
  </>
}

