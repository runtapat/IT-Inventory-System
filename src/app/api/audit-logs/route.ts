import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entityId = searchParams.get('entityId')
    const entityType = searchParams.get('entityType') || 'ASSET'
    const action = searchParams.get('action')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)

    const where: Record<string, unknown> = { entityType }
    if (entityId) where.entityId = entityId
    if (action) where.action = action

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Enrich with asset info if entity-wide query (no specific entityId)
    if (!entityId) {
      const assetIds = [...new Set(logs.map(l => l.entityId))]
      const assets = await prisma.asset.findMany({
        where: { id: { in: assetIds } },
        select: { id: true, assetId: true, name: true, isDeleted: true },
      })
      const assetMap = new Map(assets.map(a => [a.id, a]))

      return NextResponse.json(
        logs.map(log => ({
          ...log,
          asset: assetMap.get(log.entityId) || null,
        }))
      )
    }

    return NextResponse.json(logs)
  } catch {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
