import { prisma } from './prisma'

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE'

export async function logAudit({
  userId,
  action,
  entityType,
  entityId,
  oldValue,
  newValue,
}: {
  userId?: string | null
  action: AuditAction
  entityType: string
  entityId: string
  oldValue?: Record<string, unknown> | null
  newValue?: Record<string, unknown> | null
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        action,
        entityType,
        entityId,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : undefined,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : undefined,
      },
    })
  } catch {
    // Audit log failure must never break the main operation
  }
}

// Compute only the fields that changed between two objects
export function diffObjects(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>
): { old: Record<string, unknown>; new: Record<string, unknown> } | null {
  const changedOld: Record<string, unknown> = {}
  const changedNew: Record<string, unknown> = {}

  const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)])
  for (const key of keys) {
    if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
      changedOld[key] = oldObj[key]
      changedNew[key] = newObj[key]
    }
  }

  if (Object.keys(changedOld).length === 0) return null
  return { old: changedOld, new: changedNew }
}

// Strip Prisma internals + relations, keep only scalar fields for logging
export function pickAssetFields(asset: Record<string, unknown>): Record<string, unknown> {
  const fields = [
    'assetId', 'name', 'brand', 'model', 'serialNumber',
    'purchaseDate', 'installDate', 'warrantyExpire', 'eolYear',
    'price', 'poNumber', 'categoryId', 'vendorId', 'locationId',
    'locationDetail', 'status', 'lifecycle', 'availability', 'note',
    'assignedToId',
  ]
  return Object.fromEntries(fields.map(f => [f, asset[f] ?? null]))
}
