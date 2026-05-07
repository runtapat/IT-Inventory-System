'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Mail, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface WarrantyAlert {
  id: string
  assetId: string
  name: string
  warrantyExpire: string
  daysLeft: number
}

export function WarrantyAlerts() {
  const [alerts, setAlerts] = useState<WarrantyAlert[]>([])
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => setAlerts(d.warrantyAlerts || []))
  }, [])

  function getBadgeVariant(days: number) {
    if (days <= 30) return 'destructive'
    if (days <= 60) return 'secondary'
    return 'outline'
  }

  async function handleSendEmail() {
    setSending(true)
    const res = await fetch('/api/notifications/warranty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threshold: 90 }),
    })
    setSending(false)
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'เกิดข้อผิดพลาด')
      return
    }
    if (data.sent === 0 && !process.env.NEXT_PUBLIC_RESEND_CONFIGURED) {
      toast.warning('ยังไม่ได้ตั้งค่า RESEND_API_KEY ใน .env.local')
    } else {
      toast.success(`ส่งอีเมลแจ้งเตือนสำเร็จ (${data.assetsCount} รายการ)`)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Warranty ใกล้หมด
          </CardTitle>
          {alerts.length > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleSendEmail} disabled={sending}>
              {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
              แจ้งเตือน
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">ไม่มีรายการแจ้งเตือน</p>
        ) : (
          <div className="space-y-2">
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{alert.assetId}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[120px]">{alert.name}</p>
                </div>
                <Badge variant={getBadgeVariant(alert.daysLeft)}>
                  {alert.daysLeft} วัน
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
