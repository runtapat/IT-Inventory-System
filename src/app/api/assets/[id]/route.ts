import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { AssetStatus, Lifecycle, Availability } from '@prisma/client'
import { logAudit, pickAssetFields, diffObjects } from '@/lib/audit'
import { getCurrentUserId } from '@/lib/auth'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable().transform(v => v ? new Date(v) : null),
  installDate: z.string().optional().nullable().transform(v => v ? new Date(v) : null),
  warrantyExpire: z.string().optional().nullable().transform(v => v ? new Date(v) : null),
  eolYear: z.number().optional().nullable(),
  price: z.number().optional().nullable(),
  poNumber: z.string().optional().nullable(),
  vendorId: z.string().optional().nullable(),
  locationId: z.string().optional().nullable(),
  locationDetail: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  assignedDate: z.string().optional().nullable().transform(v => v ? new Date(v) : null),
  status: z.nativeEnum(AssetStatus).optional(),
  lifecycle: z.nativeEnum(Lifecycle).optional(),
  availability: z.nativeEnum(Availability).optional(),
  note: z.string().optional().nullable(),
})

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        category: true,
        location: true,
        vendor: true,
        assignedTo: true,
        attachments: true,
        maintenanceLogs: { orderBy: { performedDate: 'desc' } },
        transferLogs: { orderBy: { transferDate: 'desc' } },
      },
    })
    if (!asset) return NextResponse.json({ error: 'ไม่พบข้อมูล' }, { status: 404 })
    return NextResponse.json(asset)
  } catch {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = updateSchema.parse(body)

    const before = await prisma.asset.findUnique({ where: { id } })
    const asset = await prisma.asset.update({ where: { id }, data })

    const userId = await getCurrentUserId()
    if (before) {
      const diff = diffObjects(
        pickAssetFields(before as unknown as Record<string, unknown>),
        pickAssetFields(asset as unknown as Record<string, unknown>)
      )
      if (diff) {
        await logAudit({ userId, action: 'UPDATE', entityType: 'ASSET', entityId: id, oldValue: diff.old, newValue: diff.new })
      }
    }
    return NextResponse.json(asset)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const before = await prisma.asset.findUnique({ where: { id } })
    await prisma.asset.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    })
    const userId = await getCurrentUserId()
    if (before) {
      await logAudit({
        userId, action: 'DELETE', entityType: 'ASSET', entityId: id,
        oldValue: pickAssetFields(before as unknown as Record<string, unknown>),
      })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
