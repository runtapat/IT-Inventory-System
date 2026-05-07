'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'

interface RecentAsset {
  id: string
  assetId: string
  name: string
  createdAt: string
  category: { name: string }
}

export function RecentActivity() {
  const [assets, setAssets] = useState<RecentAsset[]>([])

  useEffect(() => {
    fetch('/api/assets?limit=10')
      .then(r => r.json())
      .then(d => setAssets(d.assets || []))
  }, [])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" />
          เพิ่มล่าสุด
        </CardTitle>
      </CardHeader>
      <CardContent>
        {assets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">ยังไม่มีข้อมูล</p>
        ) : (
          <div className="space-y-3">
            {assets.map((asset) => (
              <div key={asset.id} className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{asset.assetId}</p>
                  <p className="text-xs text-muted-foreground truncate">{asset.name}</p>
                </div>
                <p className="text-xs text-muted-foreground shrink-0">
                  {formatDistanceToNow(new Date(asset.createdAt), { addSuffix: true, locale: th })}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
