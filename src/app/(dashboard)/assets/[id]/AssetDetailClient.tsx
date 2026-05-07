'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { AssetBarcode } from '@/components/AssetBarcode'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Pencil, Loader2, Barcode as BarcodeIcon, Printer } from 'lucide-react'
import { printBarcodeSticker } from '@/lib/print-barcode'
import { QRCodeSVG } from 'qrcode.react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { AssetStatus, Lifecycle, Availability } from '@prisma/client'
import { formatDistanceToNow } from 'date-fns'
import { th as thLocale } from 'date-fns/locale'

const STATUS_LABELS: Record<AssetStatus, string> = {
  ACTIVE: 'Active',
  MAINTENANCE: 'Maintenance',
  RETIRED: 'Retired',
}

const LIFECYCLE_LABELS: Record<Lifecycle, string> = {
  IN_OPERATION: 'In Operation',
  UNDER_MAINTENANCE: 'Under Maintenance',
  DECOMMISSIONED: 'Decommissioned',
}

const AVAILABILITY_LABELS: Record<Availability, string> = {
  AVAILABLE: 'Available',
  DEGRADED: 'Degraded',
  NA: 'N/A',
}

interface AssetDetail {
  id: string
  assetId: string
  name: string
  brand: string | null
  model: string | null
  serialNumber: string | null
  purchaseDate: string | null
  installDate: string | null
  warrantyExpire: string | null
  eolYear: number | null
  price: string | null
  poNumber: string | null
  locationDetail: string | null
  status: AssetStatus
  lifecycle: Lifecycle
  availability: Availability
  note: string | null
  category: { name: string; prefix: string }
  location: { name: string; code: string } | null
  vendor: { name: string } | null
  assignedTo: { name: string; email: string } | null
  maintenanceLogs: { id: string; type: string; description: string; performedDate: string; cost: string | null }[]
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || '-'}</p>
    </div>
  )
}

interface AuditEntry {
  id: string
  action: string
  oldValue: Record<string, unknown> | null
  newValue: Record<string, unknown> | null
  createdAt: string
  user: { name: string; email: string } | null
}

const FIELD_LABELS: Record<string, string> = {
  name: 'ชื่ออุปกรณ์', brand: 'ยี่ห้อ', model: 'รุ่น', serialNumber: 'Serial No.',
  status: 'Status', lifecycle: 'Lifecycle', availability: 'Availability',
  locationId: 'สถานที่', vendorId: 'ผู้จำหน่าย', categoryId: 'ประเภท',
  purchaseDate: 'วันที่ซื้อ', installDate: 'วันติดตั้ง', warrantyExpire: 'Warranty หมด',
  eolYear: 'EOL Year', price: 'ราคา', poNumber: 'เลข PO',
  locationDetail: 'รายละเอียดตำแหน่ง', note: 'หมายเหตุ', assignedToId: 'ผู้ใช้',
}

function formatVal(val: unknown): string {
  if (val === null || val === undefined || val === '') return '—'
  if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}/)) {
    return format(new Date(val), 'd MMM yyyy', { locale: th })
  }
  return String(val)
}

export function AssetDetailClient({ assetId }: { assetId: string }) {
  const [asset, setAsset] = useState<AssetDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([])
  const barcodeRef = useRef<HTMLDivElement>(null)
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/assets/${assetId}`)
      .then(r => r.json())
      .then(data => { setAsset(data); setLoading(false) })
  }, [assetId])

  function loadAuditLogs() {
    fetch(`/api/audit-logs?entityId=${assetId}&entityType=ASSET`)
      .then(r => r.json())
      .then(setAuditLogs)
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (!asset) {
    return <div className="text-center py-20 text-muted-foreground">ไม่พบข้อมูลอุปกรณ์</div>
  }

  const assetUrl = `${window.location.origin}/assets/${assetId}`

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/assets" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}><ArrowLeft className="h-4 w-4" /></Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold">{asset.assetId}</h2>
              <Badge>{STATUS_LABELS[asset.status]}</Badge>
            </div>
            <p className="text-muted-foreground">{asset.name}</p>
          </div>
        </div>
        <Link href={`/assets/${assetId}/edit`} className={cn(buttonVariants())}><Pencil className="h-4 w-4 mr-2" />แก้ไข</Link>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">ข้อมูลทั่วไป</TabsTrigger>
          <TabsTrigger value="maintenance">ประวัติซ่อม</TabsTrigger>
          <TabsTrigger value="history" onClick={loadAuditLogs}>ประวัติการแก้ไข</TabsTrigger>
          <TabsTrigger value="qr">Barcode</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">ข้อมูลพื้นฐาน</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Field label="ประเภท" value={asset.category.name} />
                <Field label="สถานะ" value={STATUS_LABELS[asset.status]} />
                <Field label="Lifecycle" value={LIFECYCLE_LABELS[asset.lifecycle]} />
                <Field label="Availability" value={AVAILABILITY_LABELS[asset.availability]} />
                <Field label="ยี่ห้อ" value={asset.brand} />
                <Field label="รุ่น" value={asset.model} />
                <Field label="Serial No." value={asset.serialNumber} />
                <Field label="เลข PO" value={asset.poNumber} />
                <Field label="ผู้จำหน่าย" value={asset.vendor?.name} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">ตำแหน่ง</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Field label="สถานที่" value={asset.location?.name} />
                <Field label="รายละเอียด" value={asset.locationDetail} />
                <Field label="ผู้ใช้งาน" value={asset.assignedTo?.name} />
                <Field label="อีเมล" value={asset.assignedTo?.email} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">การจัดซื้อและอายุการใช้งาน</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Field label="วันที่ซื้อ" value={asset.purchaseDate ? format(new Date(asset.purchaseDate), 'd MMM yyyy', { locale: th }) : undefined} />
                <Field label="วันติดตั้ง" value={asset.installDate ? format(new Date(asset.installDate), 'd MMM yyyy', { locale: th }) : undefined} />
                <Field label="Warranty หมด" value={asset.warrantyExpire ? format(new Date(asset.warrantyExpire), 'd MMM yyyy', { locale: th }) : undefined} />
                <Field label="EOL ปี" value={asset.eolYear ? String(asset.eolYear) : undefined} />
                <Field label="ราคา" value={asset.price ? `฿${parseFloat(asset.price).toLocaleString()}` : undefined} />
              </CardContent>
            </Card>
          </div>
          {asset.note && (
            <Card>
              <CardHeader><CardTitle className="text-base">หมายเหตุ</CardTitle></CardHeader>
              <CardContent><p className="text-sm">{asset.note}</p></CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader><CardTitle className="text-base">ประวัติการซ่อมบำรุง</CardTitle></CardHeader>
            <CardContent>
              {asset.maintenanceLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">ยังไม่มีประวัติ</p>
              ) : (
                <div className="space-y-3">
                  {asset.maintenanceLogs.map(log => (
                    <div key={log.id} className="border rounded-lg p-3">
                      <div className="flex justify-between">
                        <Badge variant="outline">{log.type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.performedDate), 'd MMM yyyy', { locale: th })}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{log.description}</p>
                      {log.cost && <p className="text-xs text-muted-foreground mt-1">ค่าใช้จ่าย: ฿{parseFloat(log.cost).toLocaleString()}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader><CardTitle className="text-base">ประวัติการแก้ไข</CardTitle></CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">ยังไม่มีประวัติ</p>
              ) : (
                <div className="relative pl-6 space-y-0">
                  {auditLogs.map((log, idx) => {
                    const isCreate = log.action === 'CREATE'
                    const isDelete = log.action === 'DELETE'
                    const changedFields = !isCreate && !isDelete && log.oldValue && log.newValue
                      ? Object.keys(log.newValue)
                      : []
                    return (
                      <div key={log.id} className="relative pb-6">
                        {/* Timeline line */}
                        {idx < auditLogs.length - 1 && (
                          <div className="absolute left-[-17px] top-5 bottom-0 w-px bg-border" />
                        )}
                        {/* Dot */}
                        <div className={`absolute left-[-21px] top-1.5 h-3 w-3 rounded-full border-2 border-background ${
                          isCreate ? 'bg-green-500' : isDelete ? 'bg-red-500' : 'bg-blue-500'
                        }`} />
                        <div className="bg-muted/40 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              isCreate ? 'bg-green-100 text-green-700' :
                              isDelete ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {isCreate ? 'สร้างอุปกรณ์' : isDelete ? 'ลบอุปกรณ์' : 'แก้ไข'}
                            </span>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: thLocale })}
                              </p>
                              {log.user && <p className="text-xs text-muted-foreground">{log.user.name}</p>}
                            </div>
                          </div>
                          {isCreate && log.newValue && (
                            <p className="text-xs text-muted-foreground mt-1">
                              เพิ่มอุปกรณ์: <span className="font-medium text-foreground">{String(log.newValue.assetId || '')}</span>
                            </p>
                          )}
                          {changedFields.length > 0 && log.oldValue && log.newValue && (
                            <div className="mt-2 space-y-1">
                              {changedFields.map(field => (
                                <div key={field} className="text-xs flex flex-wrap gap-1 items-center">
                                  <span className="text-muted-foreground">{FIELD_LABELS[field] || field}:</span>
                                  <span className="line-through text-red-500">{formatVal(log.oldValue![field])}</span>
                                  <span className="text-muted-foreground">→</span>
                                  <span className="text-green-600 font-medium">{formatVal(log.newValue![field])}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qr">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarcodeIcon className="h-4 w-4" />Barcode</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="flex flex-col items-center gap-3 p-4 border rounded-lg bg-white min-w-[300px] w-full max-w-sm">
                <div ref={barcodeRef} className="flex justify-center w-full">
                  <AssetBarcode value={asset.assetId} width={2.2} height={80} />
                </div>
                <div className="flex items-center gap-3 w-full">
                  <div ref={qrRef} className="shrink-0">
                    <QRCodeSVG value={assetUrl} size={72} bgColor="#ffffff" fgColor="#000000" level="M" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono font-bold text-xl tracking-wider">{asset.assetId}</p>
                    <p className="text-sm text-muted-foreground truncate max-w-[180px]">{asset.name}</p>
                    {asset.location && <p className="text-xs text-muted-foreground">{asset.location.name}</p>}
                  </div>
                </div>
              </div>
              <Button variant="outline" onClick={() => {
                const barcodeSvg = barcodeRef.current?.querySelector('svg')
                const qrSvg = qrRef.current?.querySelector('svg')
                if (!barcodeSvg) return
                printBarcodeSticker({
                  assetCode: asset.assetId,
                  name: asset.name,
                  location: asset.location?.name,
                  svgMarkup: barcodeSvg.outerHTML,
                  qrSvgMarkup: qrSvg?.outerHTML ?? null,
                })
              }}>
                <Printer className="h-4 w-4 mr-2" />พิมพ์ Sticker
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
