import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const locationSchema = z.object({
  code: z.string().min(1, 'กรุณาระบุรหัสสถานที่'),
  name: z.string().min(1, 'กรุณาระบุชื่อสถานที่'),
  address: z.string().optional(),
  building: z.string().optional(),
  floor: z.string().optional(),
  room: z.string().optional(),
  description: z.string().optional(),
})

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      include: { _count: { select: { assets: { where: { isDeleted: false } } } } },
      orderBy: { code: 'asc' },
    })
    return NextResponse.json(locations)
  } catch {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = locationSchema.parse(body)
    const location = await prisma.location.create({ data })
    return NextResponse.json(location, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
