import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { z } from 'zod'
import { Role } from '@prisma/client'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = updateSchema.parse(body)
    const user = await prisma.user.update({ where: { id }, data })
    return NextResponse.json(user)
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
      where: { assignedToId: id, isDeleted: false },
    })
    if (assetCount > 0) {
      return NextResponse.json(
        { error: `ไม่สามารถลบได้ มีอุปกรณ์ ${assetCount} รายการที่ถูก assign อยู่` },
        { status: 400 }
      )
    }

    await supabaseAdmin.auth.admin.deleteUser(id)
    await prisma.user.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
