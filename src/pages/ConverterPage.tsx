import { useMemo, useState } from 'react'
import { Activity } from 'lucide-react'
import { classifyIPv4, formatIPv4, maskToPrefix, parseCidr, parseIPv4, prefixToMask } from '../lib/ipv4'
import { classifyIPv6, compressIPv6, expandIPv6, ipv4Mapped, parseIPv6 } from '../lib/ipv6'
import { Field, PageIntro, ResultRow, ValidBadge } from '../components/UI'

type InputKind = 'ipv4' | 'binary' | 'hex' | 'integer' | 'cidr' | 'mask' | 'prefix' | 'ipv6'

const parseIpv4Representation = (input: string, kind: InputKind): { value?: number; prefix?: number; maskOnly?: boolean } => {
  if (kind === 'ipv4') return { value: parseIPv4(input) }
  if (kind === 'binary') {
    const compact = input.trim().replaceAll('.', '').replaceAll(' ', '')
    if (!/^[01]{32}$/.test(compact)) throw new Error('IPv4 binary must contain exactly 32 zero-or-one digits.')
    return { value: Number.parseInt(compact, 2) >>> 0 }
  }
  if (kind === 'hex') {
    const compact = input.trim().replace(/^0x/i, '').replaceAll(/[:\s]/g, '')
    if (!/^[0-9a-fA-F]{8}$/.test(compact)) throw new Error('IPv4 hexadecimal must contain exactly eight hexadecimal digits.')
    return { value: Number.parseInt(compact, 16) >>> 0 }
  }
  if (kind === 'integer') {
    if (!/^\d+$/.test(input.trim())) throw new Error('Unsigned integer input may contain decimal digits only.')
    const big = BigInt(input.trim()); if (big > 0xffffffffn) throw new Error('IPv4 unsigned integer must be from 0 through 4,294,967,295.')
    return { value: Number(big) }
  }
  if (kind === 'cidr') { const cidr = parseCidr(input); return { value: cidr.address, prefix: cidr.prefix } }
  if (kind === 'mask') return { prefix: maskToPrefix(input), maskOnly: true }
  if (kind === 'prefix') { const text = input.trim().replace(/^\//,''); const prefix = Number(text); prefixToMask(prefix); return { prefix, maskOnly: true } }
  throw new Error('Choose an IPv4 representation.')
}

export function ConverterPage() {
  const [kind, setKind] = useState<InputKind>('ipv4')
  const [input, setInput] = useState('192.0.2.10')
  const calculated = useMemo(() => {
    try {
      if (kind === 'ipv6') {
        const value = parseIPv6(input)
        const classification = classifyIPv6(value)
        return { family: 'IPv6', ipv6: { expanded: expandIPv6(value), compressed: compressIPv6(value), integer: value.toString(10), hex: `0x${value.toString(16).padStart(32,'0')}`, mapped: ipv4Mapped(value), ...classification }, error: '' }
      }
      const parsed = parseIpv4Representation(input,kind)
      const value = parsed.value
      return { family: parsed.maskOnly ? 'IPv4 prefix / mask' : 'IPv4', ipv4: { value, prefix: parsed.prefix, dotted: value === undefined ? undefined : formatIPv4(value), binary: value === undefined ? undefined : value.toString(2).padStart(32,'0').match(/.{8}/g)!.join('.'), hex: value === undefined ? undefined : `0x${value.toString(16).padStart(8,'0').toUpperCase()}`, integer: value, classification: value === undefined ? undefined : classifyIPv4(value), mask: parsed.prefix === undefined ? undefined : prefixToMask(parsed.prefix) }, error: '' }
    } catch (error) { return { family: '', error: error instanceof Error ? error.message : 'Invalid input.' } }
  }, [input,kind])
  const defaults: Record<InputKind,string> = { ipv4:'192.0.2.10',binary:'11000000.00000000.00000010.00001010',hex:'0xC000020A',integer:'3221225994',cidr:'192.0.2.10/24',mask:'255.255.255.0',prefix:'/24',ipv6:'2001:db8::10' }
  return <>
    <PageIntro eyebrow="Address representation" title="IP Address Converter" description="Begin with an explicit representation so ambiguous digit strings are never guessed. IPv6 calculations use exact 128-bit BigInt values." actions={!calculated.error && <ValidBadge>{calculated.family}</ValidBadge>} />
    <div className="grid two">
      <section className="panel"><div className="panel-header"><div><h2>Source value</h2><p>Select the representation you are entering.</p></div></div><div className="panel-body stack">
        <Field label="Input representation"><select value={kind} onChange={(event) => { const next = event.target.value as InputKind; setKind(next); setInput(defaults[next]) }}><option value="ipv4">IPv4 dotted decimal</option><option value="binary">IPv4 binary (32 bit)</option><option value="hex">IPv4 hexadecimal</option><option value="integer">IPv4 unsigned integer</option><option value="cidr">IPv4 CIDR notation</option><option value="mask">IPv4 subnet mask</option><option value="prefix">IPv4 prefix length</option><option value="ipv6">IPv6 expanded, compressed, or mapped</option></select></Field>
        <Field label="Value" error={calculated.error || undefined}><textarea className="mono" value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} aria-invalid={Boolean(calculated.error)} /></Field>
        <div className="notice">A plain decimal integer, hexadecimal string, or 32-character binary value is only interpreted according to the representation selected above.</div>
      </div></section>
      <section className="panel"><div className="panel-header"><div><h2>Compatible representations</h2><p>{calculated.error ? 'Correct the source value to continue' : calculated.family}</p></div></div><div className="panel-body">
        {calculated.error ? <div className="empty-state"><Activity /><h2>Input is not valid</h2><p>{calculated.error}</p></div> : calculated.ipv6 ? <div className="result-list"><ResultRow label="Expanded IPv6" value={calculated.ipv6.expanded} /><ResultRow label="Compressed IPv6" value={calculated.ipv6.compressed} /><ResultRow label="Unsigned 128-bit integer" value={calculated.ipv6.integer} /><ResultRow label="Hexadecimal" value={calculated.ipv6.hex} /><ResultRow label="IPv4-mapped form" value={calculated.ipv6.mapped ?? 'Not IPv4-mapped'} /><ResultRow label="Classification" value={calculated.ipv6.classification} mono={false} /><ResultRow label="Scope" value={calculated.ipv6.scope} mono={false} /></div> : calculated.ipv4 && <div className="result-list">{calculated.ipv4.dotted !== undefined && <ResultRow label="Dotted decimal" value={calculated.ipv4.dotted} />}{calculated.ipv4.binary !== undefined && <ResultRow label="Binary" value={calculated.ipv4.binary} />}{calculated.ipv4.hex !== undefined && <ResultRow label="Hexadecimal" value={calculated.ipv4.hex} />}{calculated.ipv4.integer !== undefined && <ResultRow label="Unsigned 32-bit integer" value={calculated.ipv4.integer} />}{calculated.ipv4.prefix !== undefined && <ResultRow label="Prefix length" value={`/${calculated.ipv4.prefix}`} />}{calculated.ipv4.mask !== undefined && <ResultRow label="Subnet mask" value={calculated.ipv4.mask} />}{calculated.ipv4.classification && <ResultRow label="Classification" value={calculated.ipv4.classification} mono={false} />}</div>}
      </div></section>
    </div>
    <section className="panel" style={{ marginTop: 18 }}><div className="panel-header"><h2>IPv4-mapped IPv6</h2></div><div className="panel-body"><p style={{ color:'var(--muted)',fontSize:'.8rem',lineHeight:1.6,margin:0 }}>Mapped values use the <span className="mono">::ffff:0:0/96</span> prefix, such as <span className="mono">::ffff:192.0.2.10</span>. They represent an IPv4 address inside an IPv6 API context; they are not a general IPv4-to-IPv6 translation mechanism.</p></div></section>
  </>
}

