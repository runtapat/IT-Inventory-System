import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWarrantyAlert } from '@/lib/email'
import { format, differenceInDays } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const { threshold = 90, emails } = await request.json().catch(() => ({}))
    const recipients: string[] = Array.isArray(emails) && emails.length > 0
      ? emails
      : []

    // Get admin emails from DB if not provided
    if (recipients.length === 0) {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN', isActive: true },
        select: { email: true },
      })
      recipients.push(...admins.map(a => a.email))
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'ไม่พบอีเมลผู้รับ' }, { status: 400 })
    }

    const now = new Date()
    const cutoff = new Date(now.getTime() + threshold * 24 * 60 * 60 * 1000)

    const assets = await prisma.asset.findMany({
      where: {
        isDeleted: false,
        warrantyExpire: { gte: now, lte: cutoff },
      },
      orderBy: { warrantyExpire: 'asc' },
    })

    if (assets.length === 0) {
      return NextResponse.json({ message: 'ไม่มีอุปกรณ์ที่ Warranty ใกล้หมด', sent: 0 })
    }

    let sent = 0
    for (const asset of assets) {
      const daysLeft = differenceInDays(asset.warrantyExpire!, now)
      const warrantyStr = format(asset.warrantyExpire!, 'dd/MM/yyyy')
      for (const email of recipients) {
        const ok = await sendWarrantyAlert({
          to: email,
          assetId: asset.assetId,
          assetName: asset.name,
          warrantyExpire: warrantyStr,
          daysLeft,
        })
        if (ok) sent++
      }
    }

    return NextResponse.json({
      message: `ส่งแจ้งเตือนสำเร็จ`,
      assetsCount: assets.length,
      sent,
    })
  } catch {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
