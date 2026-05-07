'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, Pencil, Trash2, Activity as ActivityIcon } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { th } from 'date-fns/locale'

interface AuditEntry {
  id: string
  action: string
  entityId: string
  oldValue: Record<string, unknown> | null
  newValue: Record<string, unknown> | null
  createdAt: string
  user: { name: string; email: string } | null
  asset: { id: string; assetId: string; name: string; isDeleted: boolean } | null
}

const FIELD_LABELS: Record<string, string> = {
  name: 'ชื่ออุปกรณ์', brand: 'ยี่ห้อ', model: 'รุ่น', serialNumber: 'Serial No.',
  status: 'Status', lifecycle: 'Lifecycle', availability: 'Availability',
  locationId: 'สถานที่', vendorId: 'ผู้จำหน่าย', categoryId: 'ประเภท',
  purchaseDate: 'วันที่ซื้อ', installDate: 'วันติดตั้ง', warrantyExpire: 'Warranty หมด',
  eolYear: 'EOL Year', price: 'ราคา', poNumber: 'เลข PO',
  locationDetail: 'รายละเอียดตำแหน่ง', note: 'หมายเหตุ', assignedToId: 'ผู้ใช้',
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'เพิ่มอุปกรณ์',
  UPDATE: 'แก้ไข',
  DELETE: 'ลบอุปกรณ์',
}

function formatVal(val: unknown): string {
  if (val === null || val === undefined || val === '') return '—'
  if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}/)) {
    return format(new Date(val), 'd MMM yyyy', { locale: th })
  }
  return String(val)
}

export function ActivityClient() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('all')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '100' })
    if (actionFilter !== 'all') params.set('action', actionFilter)
    fetch(`/api/audit-logs?${params}`)
      .then(r => r.json())
      .then(data => {
        setLogs(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [actionFilter])

  const grouped: Record<string, AuditEntry[]> = {}
  for (const log of logs) {
    const key = format(new Date(log.createdAt), 'yyyy-MM-dd')
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(log)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={actionFilter} onValueChange={v => setActionFilter(v ?? 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue>
              {actionFilter === 'all' ? 'การกระทำทั้งหมด' : ACTION_LABELS[actionFilter]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">การกระทำทั้งหมด</SelectItem>
            <SelectItem value="CREATE">เพิ่มอุปกรณ์</SelectItem>
            <SelectItem value="UPDATE">แก้ไข</SelectItem>
            <SelectItem value="DELETE">ลบอุปกรณ์</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">{logs.length} รายการ (สูงสุด 100)</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
            <ActivityIcon className="h-10 w-10" />
            <p className="text-sm">ยังไม่มีความเคลื่อนไหว</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([day, dayLogs]) => (
            <div key={day}>
              <h3 className="text-xs font-semibold text-muted-foreground mb-2 sticky top-0 bg-background py-1">
                {format(new Date(day), 'EEEE d MMMM yyyy', { locale: th })}
              </h3>
              <div className="space-y-2">
                {dayLogs.map(log => {
                  const isCreate = log.action === 'CREATE'
                  const isDelete = log.action === 'DELETE'
                  const Icon = isCreate ? Plus : isDelete ? Trash2 : Pencil
                  const colorBg = isCreate ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                    : isDelete ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                  const changedFields = !isCreate && !isDelete && log.oldValue && log.newValue
                    ? Object.keys(log.newValue) : []

                  return (
                    <Card key={log.id}>
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start gap-3">
                          <div className={`shrink-0 rounded-lg p-2 ${colorBg}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                              <span className="text-sm font-medium">{ACTION_LABELS[log.action] || log.action}</span>
                              {log.asset ? (
                                log.asset.isDeleted || isDelete ? (
                                  <span className="text-sm font-mono text-muted-foreground line-through">
                                    {log.asset.assetId} {log.asset.name}
                                  </span>
                                ) : (
                                  <Link
                                    href={`/assets/${log.asset.id}`}
                                    className="text-sm font-mono text-foreground hover:underline"
                                  >
                                    {log.asset.assetId} <span className="font-sans text-muted-foreground">{log.asset.name}</span>
                                  </Link>
                                )
                              ) : (
                                <span className="text-sm text-muted-foreground">(ลบแล้ว)</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {log.user?.name ?? 'ระบบ'} · {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: th })} · {format(new Date(log.createdAt), 'HH:mm')}
                            </p>
                            {changedFields.length > 0 && log.oldValue && log.newValue && (
                              <div className="mt-2 space-y-1">
                                {changedFields.slice(0, 5).map(field => (
                                  <div key={field} className="text-xs flex flex-wrap gap-1 items-center">
                                    <span className="text-muted-foreground">{FIELD_LABELS[field] || field}:</span>
                                    <span className="line-through text-red-500">{formatVal(log.oldValue![field])}</span>
                                    <span className="text-muted-foreground">→</span>
                                    <span className="text-green-600 dark:text-green-400 font-medium">{formatVal(log.newValue![field])}</span>
                                  </div>
                                ))}
                                {changedFields.length > 5 && (
                                  <p className="text-xs text-muted-foreground">และอีก {changedFields.length - 5} field</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
