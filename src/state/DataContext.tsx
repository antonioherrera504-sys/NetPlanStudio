import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { AppData, ThemeMode } from '../types'
import { emptyAppData, loadAppData, saveAppData } from '../lib/storage'

interface DataContextValue {
  data: AppData
  setData: React.Dispatch<React.SetStateAction<AppData>>
  loaded: boolean
  saveState: 'loading' | 'saved' | 'saving' | 'error'
  toast: string | null
  notify: (message: string) => void
  setTheme: (theme: ThemeMode) => void
}
const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(emptyAppData)
  const [loaded, setLoaded] = useState(false)
  const [saveState, setSaveState] = useState<DataContextValue['saveState']>('loading')
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)
  const notify = useCallback((message: string) => {
    setToast(message); window.clearTimeout(toastTimer.current); toastTimer.current = window.setTimeout(() => setToast(null), 2600)
  }, [])
  useEffect(() => { void loadAppData().then((stored) => { setData(stored); setLoaded(true); setSaveState('saved') }) }, [])
  useEffect(() => {
    if (!loaded) return
    const timer = window.setTimeout(() => { setSaveState('saving'); void saveAppData(data).then(() => setSaveState('saved')).catch(() => setSaveState('error')) }, 350)
    return () => window.clearTimeout(timer)
  }, [data, loaded])
  useEffect(() => {
    const mode = data.preferences.theme
    const dark = mode === 'dark' || (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
    const media = matchMedia('(prefers-color-scheme: dark)')
    const update = () => { if (mode === 'system') document.documentElement.dataset.theme = media.matches ? 'dark' : 'light' }
    media.addEventListener('change', update); return () => media.removeEventListener('change', update)
  }, [data.preferences.theme])
  const setTheme = useCallback((theme: ThemeMode) => setData((current) => ({ ...current, preferences: { ...current.preferences, theme } })), [])
  const value = useMemo(() => ({ data, setData, loaded, saveState, toast, notify, setTheme }), [data, loaded, saveState, toast, notify, setTheme])
  return <DataContext.Provider value={value}>{children}{toast && <div className="toast" role="status">{toast}</div>}</DataContext.Provider>
}

export const useAppData = () => {
  const value = useContext(DataContext)
  if (!value) throw new Error('useAppData must be used inside DataProvider.')
  return value
}
