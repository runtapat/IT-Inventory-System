import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entityId = searchParams.get('entityId')
    const entityType = searchParams.get('entityType') || 'ASSET'
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!entityId) {
      return NextResponse.json({ error: 'entityId required' }, { status: 400 })
    }

    const logs = await prisma.auditLog.findMany({
      where: { entityId, entityType },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json(logs)
  } catch {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
