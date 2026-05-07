'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarClock } from 'lucide-react'

interface EOLAlert {
  id: string
  assetId: string
  name: string
  eolYear: number
  yearsLeft: number
}

export function EOLAlerts() {
  const [alerts, setAlerts] = useState<EOLAlert[]>([])

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => setAlerts(d.eolAlerts || []))
  }, [])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-purple-500" />
          อุปกรณ์ใกล้หมดอายุ (EOL)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">ไม่มีรายการ</p>
        ) : (
          <div className="space-y-2">
            {alerts.slice(0, 5).map((alert) => {
              const variant = alert.yearsLeft < 0 ? 'destructive' : alert.yearsLeft === 0 ? 'destructive' : 'secondary'
              const text = alert.yearsLeft < 0 ? `เลย EOL ${Math.abs(alert.yearsLeft)} ปี`
                : alert.yearsLeft === 0 ? 'EOL ปีนี้'
                : `เหลือ ${alert.yearsLeft} ปี`
              return (
                <Link key={alert.id} href={`/assets/${alert.id}`} className="flex items-center justify-between hover:bg-muted/50 -mx-2 px-2 py-1 rounded transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium font-mono">{alert.assetId}</p>
                    <p className="text-xs text-muted-foreground truncate">{alert.name}</p>
                  </div>
                  <Badge variant={variant} className="shrink-0 ml-2">
                    {text}
                  </Badge>
                </Link>
              )
            })}
            {alerts.length > 5 && (
              <p className="text-xs text-muted-foreground text-center pt-1">และอีก {alerts.length - 5} รายการ</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
