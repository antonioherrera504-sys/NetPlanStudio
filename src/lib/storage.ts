import { openDB } from 'idb'
import type { AppData } from '../types'
import { appDataSchema } from './schemas'

export const STORAGE_NAMESPACE = 'netplan-studio'
export const STORAGE_SCHEMA_VERSION = 1
const DB_VERSION = 1
const STORE = 'state'
const KEY = 'app-data'

export const emptyAppData = (): AppData => ({
  schemaVersion: 1,
  plans: [],
  diagrams: [],
  preferences: { theme: 'system', favoriteReferences: [] }
})

const dbPromise = typeof indexedDB === 'undefined' ? null : openDB(STORAGE_NAMESPACE, DB_VERSION, {
  upgrade(db) { if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE) }
})

export const migrateData = (value: unknown): AppData => {
  if (!value || typeof value !== 'object') return emptyAppData()
  const candidate = value as Record<string, unknown>
  if (candidate.schemaVersion === undefined) {
    candidate.schemaVersion = 1
    candidate.plans ??= []
    candidate.diagrams ??= []
    candidate.preferences ??= { theme: 'system', favoriteReferences: [] }
  }
  const parsed = appDataSchema.safeParse(candidate)
  return parsed.success ? parsed.data : emptyAppData()
}

export const loadAppData = async (): Promise<AppData> => {
  if (!dbPromise) return emptyAppData()
  try { return migrateData(await (await dbPromise).get(STORE, KEY)) } catch { return emptyAppData() }
}

export const saveAppData = async (data: AppData) => {
  const parsed = appDataSchema.parse(data)
  if (dbPromise) await (await dbPromise).put(STORE, parsed, KEY)
}

export const clearAppData = async () => { if (dbPromise) await (await dbPromise).clear(STORE) }

