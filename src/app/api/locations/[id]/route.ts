import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  address: z.string().optional().nullable(),
  building: z.string().optional().nullable(),
  floor: z.string().optional().nullable(),
  room: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = updateSchema.parse(body)
    const location = await prisma.location.update({ where: { id }, data })
    return NextResponse.json(location)
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
    const assetCount = await prisma.asset.count({
      where: { locationId: id, isDeleted: false },
    })
    if (assetCount > 0) {
      return NextResponse.json(
        { error: `ไม่สามารถลบได้ มีอุปกรณ์ ${assetCount} รายการในสถานที่นี้` },
        { status: 400 }
      )
    }
    await prisma.location.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
