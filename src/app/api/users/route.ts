import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { z } from 'zod'
import { Role } from '@prisma/client'

const createSchema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  name: z.string().min(1, 'กรุณาระบุชื่อ'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัว'),
  role: z.nativeEnum(Role).default('VIEWER'),
})

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(users)
  } catch {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createSchema.parse(body)

    const { data: authUser, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const user = await prisma.user.create({
      data: {
        id: authUser.user.id,
        email: data.email,
        name: data.name,
        role: data.role,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
