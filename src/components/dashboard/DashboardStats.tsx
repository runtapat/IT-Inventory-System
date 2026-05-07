'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Package, CheckCircle2, Wrench, XCircle, DollarSign, Loader2, ShieldCheck } from 'lucide-react'

interface Stats {
  total: number
  active: number
  maintenance: number
  retired: number
  available: number
  degraded: number
  inOperation: number
  decommissioned: number
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
    {
      title: 'อุปกรณ์ทั้งหมด',
      value: stats?.total ?? 0,
      icon: Package,
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'ใช้งานอยู่ (Active)',
      value: stats?.active ?? 0,
      icon: CheckCircle2,
      iconBg: 'bg-green-100 dark:bg-green-900/40',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'ซ่อมบำรุง',
      value: stats?.maintenance ?? 0,
      icon: Wrench,
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/40',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      title: 'ปลดระวาง',
      value: stats?.retired ?? 0,
      icon: XCircle,
      iconBg: 'bg-gray-100 dark:bg-gray-800',
      iconColor: 'text-gray-600 dark:text-gray-400',
    },
    {
      title: 'พร้อมใช้งาน',
      value: stats?.available ?? 0,
      icon: ShieldCheck,
      iconBg: 'bg-cyan-100 dark:bg-cyan-900/40',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
    },
    {
      title: 'มูลค่ารวม',
      value: stats ? `฿${stats.totalValue.toLocaleString('th-TH')}` : '฿0',
      icon: DollarSign,
      iconBg: 'bg-purple-100 dark:bg-purple-900/40',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center h-24">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title} className="overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1">{card.title}</p>
                  <p className="text-xl sm:text-2xl font-bold mt-1 truncate">{card.value}</p>
                </div>
                <div className={`shrink-0 rounded-lg p-2 ${card.iconBg}`}>
                  <Icon className={`h-4 w-4 ${card.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
