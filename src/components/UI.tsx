import type { ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'
import { copyText } from '../lib/files'
import { useAppData } from '../state/DataContext'

export function PageIntro({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return <div className="page-intro"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{actions && <div className="page-actions">{actions}</div>}</div>
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return <label className={`field ${error ? 'has-error' : ''}`}><span>{label}</span>{children}{error ? <small role="alert">{error}</small> : hint ? <small>{hint}</small> : null}</label>
}

export function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const { notify } = useAppData()
  return <button className="copy-button" type="button" onClick={() => void copyText(value).then(() => notify(`${label} copied`))} aria-label={`${label}: ${value}`}><Copy size={14} />{label}</button>
}

export function ResultRow({ label, value, mono = true, copy = true }: { label: string; value: string | number; mono?: boolean; copy?: boolean }) {
  return <div className="result-row"><span>{label}</span><strong className={mono ? 'mono' : ''}>{value}</strong>{copy && <CopyButton value={String(value)} />}</div>
}

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children: ReactNode; action?: ReactNode }) {
  return <div className="empty-state">{icon}<h2>{title}</h2><p>{children}</p>{action}</div>
}

export function ValidBadge({ children }: { children: ReactNode }) { return <span className="valid-badge"><Check size={13} />{children}</span> }

