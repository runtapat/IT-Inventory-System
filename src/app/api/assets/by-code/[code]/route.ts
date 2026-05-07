import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params
    const asset = await prisma.asset.findFirst({
      where: { assetId: code, isDeleted: false },
      select: { id: true, assetId: true, name: true },
    })
    if (!asset) {
      return NextResponse.json({ error: 'ไม่พบอุปกรณ์' }, { status: 404 })
    }
    return NextResponse.json(asset)
  } catch {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
