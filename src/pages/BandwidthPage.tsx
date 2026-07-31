import { useMemo, useState } from 'react'
import { Gauge } from 'lucide-react'
import { Field, PageIntro, ResultRow } from '../components/UI'
import { fromBits, humanDuration, packetsPerSecond, requiredBitsPerSecond, toBits, toSeconds, transferableBits, transferSeconds, utilization, type DataUnit, type TimeUnit } from '../lib/bandwidth'

type Mode = 'transfer' | 'required' | 'data' | 'utilization' | 'pps'
const dataUnits: DataUnit[] = ['b','B','Kb','KB','Mb','MB','Gb','GB','KiB','MiB','GiB']
const speedUnits: DataUnit[] = ['Kb','Mb','Gb']
const timeUnits: TimeUnit[] = ['seconds','minutes','hours','days']
const modes: Array<{ value: Mode; label: string }> = [{value:'transfer',label:'Transfer time'},{value:'required',label:'Required bandwidth'},{value:'data',label:'Transferable data'},{value:'utilization',label:'Utilization'},{value:'pps',label:'Packets / second'}]

export function BandwidthPage() {
  const [mode, setMode] = useState<Mode>('transfer')
  const [valueA, setValueA] = useState('10')
  const [unitA, setUnitA] = useState<DataUnit>('GB')
  const [valueB, setValueB] = useState('1')
  const [unitB, setUnitB] = useState<DataUnit>('Gb')
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('hours')
  const [overhead, setOverhead] = useState('3')
  const setModeDefaults = (next: Mode) => { setMode(next); if (next === 'transfer') { setValueA('10');setUnitA('GB');setValueB('1');setUnitB('Gb') } if (next === 'required') { setValueA('500');setUnitA('GB');setValueB('8');setTimeUnit('hours') } if (next === 'data') { setValueA('1');setUnitA('Gb');setValueB('1');setTimeUnit('hours') } if (next === 'utilization') { setValueA('650');setUnitA('Mb');setValueB('1');setUnitB('Gb') } if (next === 'pps') { setValueA('1');setUnitA('Gb');setValueB('1500') } }
  const calculation = useMemo(() => {
    try {
      const a = Number(valueA), b = Number(valueB), o = Number(overhead)
      if (mode === 'transfer') { const seconds = transferSeconds(a,unitA,b,unitB,o); return { result: humanDuration(seconds), raw: `${seconds.toFixed(4)} s`, formula: 'time = data bits ÷ (link bits/s × efficiency)', normalized: `${toBits(a,unitA).toLocaleString()} bits ÷ ${(toBits(b,unitB) * (1-o/100)).toLocaleString()} effective bit/s` } }
      if (mode === 'required') { const rate = requiredBitsPerSecond(a,unitA,b,timeUnit,o); return { result: `${fromBits(rate,'Mb').toLocaleString(undefined,{maximumFractionDigits:3})} Mbps`, raw: `${rate.toLocaleString()} bit/s`, formula: 'required bandwidth = data bits ÷ (target seconds × efficiency)', normalized: `${toBits(a,unitA).toLocaleString()} bits over ${toSeconds(b,timeUnit).toLocaleString()} seconds` } }
      if (mode === 'data') { const bits = transferableBits(a,unitA,b,timeUnit,o); return { result: `${fromBits(bits,'GB').toLocaleString(undefined,{maximumFractionDigits:3})} GB`, raw: `${bits.toLocaleString()} bits`, formula: 'transferable data = bandwidth × duration × efficiency', normalized: `${toBits(a,unitA).toLocaleString()} bit/s for ${toSeconds(b,timeUnit).toLocaleString()} seconds` } }
      if (mode === 'utilization') { const percent = utilization(a,unitA,b,unitB); if (percent > 100) throw new Error('Observed throughput cannot exceed the stated link capacity.'); return { result: `${percent.toFixed(2)}%`, raw: `${toBits(a,unitA).toLocaleString()} ÷ ${toBits(b,unitB).toLocaleString()}`, formula: 'utilization = observed throughput ÷ link capacity × 100', normalized: `${toBits(a,unitA).toLocaleString()} observed bit/s on ${toBits(b,unitB).toLocaleString()} bit/s capacity` } }
      const rate = packetsPerSecond(a,unitA,b,o); return { result: `${rate.toLocaleString(undefined,{maximumFractionDigits:1})} pps`, raw: `${rate} packets/s`, formula: 'packets/s = effective bandwidth bits/s ÷ packet bits', normalized: `${toBits(a,unitA).toLocaleString()} bit/s ÷ ${(b*8).toLocaleString()} bits/packet` }
    } catch (error) { return { result: '', raw: '', formula: '', normalized: '', error: error instanceof Error ? error.message : 'Invalid calculation.' } }
  }, [mode,valueA,valueB,unitA,unitB,timeUnit,overhead])
  const labelA = mode === 'transfer' || mode === 'required' ? 'Data size' : mode === 'utilization' ? 'Observed throughput' : 'Bandwidth'
  const labelB = mode === 'transfer' ? 'Link speed' : mode === 'required' || mode === 'data' ? 'Duration' : mode === 'utilization' ? 'Link capacity' : 'Packet size (bytes)'
  return <>
    <PageIntro eyebrow="Capacity planning" title="Bandwidth Calculator" description="Move cleanly between bits and bytes, decimal and binary units, time, efficiency, utilization, and packet rates." />
    <div className="segmented" style={{ marginBottom: 18, maxWidth: '100%', overflowX: 'auto' }}>{modes.map((item) => <button key={item.value} className={mode === item.value ? 'active' : ''} onClick={() => setModeDefaults(item.value)}>{item.label}</button>)}</div>
    <div className="grid two">
      <section className="panel"><div className="panel-header"><div><h2>{modes.find((item) => item.value === mode)?.label}</h2><p>Decimal bandwidth units use powers of 1000; IEC byte units use powers of 1024.</p></div></div><div className="panel-body stack">
        <Field label={labelA}><div className="input-row"><input type="number" min="0" step="any" value={valueA} onChange={(event) => setValueA(event.target.value)} /><select value={unitA} onChange={(event) => setUnitA(event.target.value as DataUnit)}>{(mode === 'transfer' || mode === 'required' ? dataUnits : speedUnits).map((unit) => <option value={unit} key={unit}>{unit}</option>)}</select></div></Field>
        <Field label={labelB}>{mode === 'required' || mode === 'data' ? <div className="input-row"><input type="number" min="0" step="any" value={valueB} onChange={(event) => setValueB(event.target.value)} /><select value={timeUnit} onChange={(event) => setTimeUnit(event.target.value as TimeUnit)}>{timeUnits.map((unit) => <option key={unit}>{unit}</option>)}</select></div> : mode === 'pps' ? <input type="number" min="1" step="1" value={valueB} onChange={(event) => setValueB(event.target.value)} /> : <div className="input-row"><input type="number" min="0" step="any" value={valueB} onChange={(event) => setValueB(event.target.value)} /><select value={unitB} onChange={(event) => setUnitB(event.target.value as DataUnit)}>{speedUnits.map((unit) => <option value={unit} key={unit}>{unit}</option>)}</select></div>}</Field>
        {mode !== 'utilization' && <Field label="Protocol / efficiency overhead (%)" hint="0 means ideal payload throughput; must remain below 100."><input type="number" min="0" max="99.99" step="0.1" value={overhead} onChange={(event) => setOverhead(event.target.value)} /></Field>}
        {(mode === 'transfer' || mode === 'data' || mode === 'pps') && <div><span className="eyebrow">Link presets</span><div className="form-actions">{[['100','Mb'],['1','Gb'],['10','Gb'],['100','Gb']].map(([value,unit]) => <button className="small" key={`${value}${unit}`} onClick={() => { if (mode === 'transfer') { setValueB(value!); setUnitB(unit as DataUnit) } else { setValueA(value!); setUnitA(unit as DataUnit) } }}>{value} {unit}ps</button>)}</div></div>}
        <div className="notice">Lowercase <span className="mono">b</span> means bits; uppercase <span className="mono">B</span> means bytes. <span className="mono">MB</span> is decimal, while <span className="mono">MiB</span> is binary.</div>
      </div></section>
      <section className="panel"><div className="panel-header"><div><h2>Calculated result</h2><p>Formula and normalized values are shown for auditability.</p></div></div><div className="panel-body">
        {calculation.error ? <div className="notice error" role="alert">{calculation.error}</div> : <><div className="metric" style={{ marginBottom: 14 }}><span>Result</span><strong>{calculation.result}</strong><small>{calculation.raw}</small></div><div className="result-list"><ResultRow label="Formula" value={calculation.formula} mono={false} /><ResultRow label="Normalized values" value={calculation.normalized} /><ResultRow label="Efficiency applied" value={`${(100 - Number(overhead || 0)).toFixed(1)}%`} /></div></>}
      </div><div className="panel-footer"><Gauge size={14} /> These are theoretical calculations; real throughput varies with latency, congestion, packet size, and protocol behavior.</div></section>
    </div>
  </>
}

