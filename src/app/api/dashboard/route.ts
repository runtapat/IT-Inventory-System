import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addDays, startOfMonth, subMonths } from 'date-fns'

export async function GET() {
  try {
    const now = new Date()

    const [statusCounts, totalValue, categoryStats, locationStats, warrantyAlerts, monthlyTrend] =
      await Promise.all([
        prisma.asset.groupBy({
          by: ['status'],
          where: { isDeleted: false },
          _count: { status: true },
        }),
        prisma.asset.aggregate({
          where: { isDeleted: false },
          _sum: { price: true },
        }),
        prisma.asset.groupBy({
          by: ['categoryId'],
          where: { isDeleted: false },
          _count: { categoryId: true },
        }),
        prisma.asset.groupBy({
          by: ['locationId'],
          where: { isDeleted: false, locationId: { not: null } },
          _count: { locationId: true },
        }),
        prisma.asset.findMany({
          where: {
            isDeleted: false,
            warrantyExpire: {
              gte: now,
              lte: addDays(now, 90),
            },
          },
          select: {
            id: true,
            assetId: true,
            name: true,
            warrantyExpire: true,
          },
          orderBy: { warrantyExpire: 'asc' },
        }),
        // Monthly trend: last 12 months
        Promise.all(
          Array.from({ length: 12 }, (_, i) => {
            const date = subMonths(now, 11 - i)
            const start = startOfMonth(date)
            const end = startOfMonth(subMonths(date, -1))
            return prisma.asset.count({
              where: { createdAt: { gte: start, lt: end }, isDeleted: false },
            }).then(count => ({
              month: date.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' }),
              count,
            }))
          })
        ),
      ])

    const categories = await prisma.category.findMany({ select: { id: true, name: true } })
    const locations = await prisma.location.findMany({ select: { id: true, name: true } })

    const statusMap: Record<string, number> = {}
    statusCounts.forEach(s => { statusMap[s.status] = s._count.status })

    return NextResponse.json({
      stats: {
        total: Object.values(statusMap).reduce((a, b) => a + b, 0),
        inUse: statusMap['IN_USE'] || 0,
        inStock: statusMap['IN_STOCK'] || 0,
        repair: statusMap['REPAIR'] || 0,
        disposed: statusMap['DISPOSED'] || 0,
        reserved: statusMap['RESERVED'] || 0,
        lost: statusMap['LOST'] || 0,
        totalValue: Number(totalValue._sum.price || 0),
      },
      categoryStats: categoryStats.map(c => ({
        name: categories.find(cat => cat.id === c.categoryId)?.name || 'ไม่ทราบ',
        count: c._count.categoryId,
      })),
      locationStats: locationStats.map(l => ({
        name: locations.find(loc => loc.id === l.locationId)?.name || 'ไม่ทราบ',
        count: l._count.locationId,
      })),
      warrantyAlerts: warrantyAlerts.map(a => ({
        ...a,
        daysLeft: Math.ceil((new Date(a.warrantyExpire!).getTime() - now.getTime()) / 86400000),
      })),
      monthlyTrend,
    })
  } catch {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
