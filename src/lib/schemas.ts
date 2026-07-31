import { z } from 'zod'

const safeText = (max: number) => z.string().max(max)
const dhcpRangeSchema = z.object({ start: safeText(15), end: safeText(15) })
const vlanSchema = z.object({
  id: safeText(100), vlanId: z.number().int().min(1).max(4094), name: safeText(100), description: safeText(500),
  subnet: safeText(32), gateway: safeText(15), dhcpEnabled: z.boolean(), dhcpRange: dhcpRangeSchema.optional(),
  site: safeText(100), notes: safeText(2000), color: safeText(32).optional(), createdAt: safeText(40), updatedAt: safeText(40)
})
export const vlanPlanSchema = z.object({ id: safeText(100), name: safeText(100), vlans: z.array(vlanSchema).max(4094), createdAt: safeText(40), updatedAt: safeText(40) })

const nodeSchema = z.object({
  id: safeText(100), type: z.enum(['router', 'l2-switch', 'l3-switch', 'firewall', 'server', 'access-point', 'cloud', 'endpoint', 'device', 'annotation', 'group']),
  x: z.number().finite(), y: z.number().finite(), name: safeText(120), managementIp: safeText(64).optional(), vendorModel: safeText(120).optional(),
  location: safeText(120).optional(), notes: safeText(2000).optional(), color: safeText(32).optional(), vlanId: safeText(100).optional(), width: z.number().positive().max(2000).optional(), height: z.number().positive().max(2000).optional()
})
const linkSchema = z.object({
  id: safeText(100), source: safeText(100), target: safeText(100), sourceLabel: safeText(100).optional(), targetLabel: safeText(100).optional(),
  speed: safeText(100).optional(), vlanLabel: safeText(100).optional(), color: safeText(32).optional(), lineStyle: z.enum(['solid', 'dashed', 'dotted']).optional(), notes: safeText(2000).optional(), vlanId: safeText(100).optional()
})
export const diagramSchema = z.object({ id: safeText(100), name: safeText(100), nodes: z.array(nodeSchema).max(2000), links: z.array(linkSchema).max(5000), grid: z.boolean(), snap: z.boolean(), createdAt: safeText(40), updatedAt: safeText(40) }).superRefine((diagram, context) => {
  const ids = new Set(diagram.nodes.map((node) => node.id))
  diagram.links.forEach((link, index) => { if (!ids.has(link.source) || !ids.has(link.target)) context.addIssue({ code: 'custom', path: ['links', index], message: 'Link references a missing node.' }) })
})

export const appDataSchema = z.object({
  schemaVersion: z.literal(1), plans: z.array(vlanPlanSchema).max(200), diagrams: z.array(diagramSchema).max(200),
  preferences: z.object({ theme: z.enum(['light', 'dark', 'system']), favoriteReferences: z.array(safeText(100)).max(1000), activePlanId: safeText(100).optional(), activeDiagramId: safeText(100).optional() })
})

export const IMPORT_LIMIT_BYTES = 5 * 1024 * 1024
export const parseImportedJson = <T>(text: string, schema: z.ZodType<T>): T => {
  if (new Blob([text]).size > IMPORT_LIMIT_BYTES) throw new Error('Import exceeds the 5 MB safety limit.')
  let data: unknown
  try { data = JSON.parse(text) } catch { throw new Error('The selected file is not valid JSON.') }
  const result = schema.safeParse(data)
  if (!result.success) throw new Error(`Import failed validation: ${result.error.issues[0]?.message ?? 'Unknown schema error'}`)
  return result.data
}

