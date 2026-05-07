'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Monitor, Package, Wrench, Archive, DollarSign, Loader2 } from 'lucide-react'

interface Stats {
  total: number
  inUse: number
  inStock: number
  repair: number
  disposed: number
  totalValue: number
}

export function DashboardStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(data => { setStats(data.stats); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const cards = [
    { title: 'อุปกรณ์ทั้งหมด', value: stats?.total ?? 0, icon: Package, color: 'text-blue-600' },
    { title: 'กำลังใช้งาน', value: stats?.inUse ?? 0, icon: Monitor, color: 'text-green-600' },
    { title: 'ในสต็อก', value: stats?.inStock ?? 0, icon: Archive, color: 'text-orange-600' },
    { title: 'ส่งซ่อม', value: stats?.repair ?? 0, icon: Wrench, color: 'text-red-600' },
    {
      title: 'มูลค่ารวม',
      value: stats ? `฿${stats.totalValue.toLocaleString('th-TH', { minimumFractionDigits: 0 })}` : '฿0',
      icon: DollarSign,
      color: 'text-purple-600',
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center h-24">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
