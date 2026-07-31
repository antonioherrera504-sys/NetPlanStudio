import { describe,expect,it } from 'vitest'
import { appDataSchema,parseImportedJson } from './schemas'
import { emptyAppData,migrateData } from './storage'
describe('import validation and migration',()=>{
  it('accepts current backup schema',()=>{expect(parseImportedJson(JSON.stringify(emptyAppData()),appDataSchema).schemaVersion).toBe(1)})
  it('rejects malformed and oversized-style data',()=>{expect(()=>parseImportedJson('{broken',appDataSchema)).toThrow(/not valid JSON/);expect(()=>parseImportedJson(JSON.stringify({schemaVersion:1}),appDataSchema)).toThrow(/validation/)})
  it('migrates legacy empty data and resets invalid data safely',()=>{expect(migrateData({}).schemaVersion).toBe(1);expect(migrateData({schemaVersion:999}).plans).toEqual([])})
})

