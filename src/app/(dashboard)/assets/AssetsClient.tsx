'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Loader2, Eye, Trash2, Download, Barcode as BarcodeIcon, ScanLine } from 'lucide-react'
import { AssetStatus, Lifecycle, Availability } from '@prisma/client'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { QRPrintModal } from '@/components/QRPrintModal'

const STATUS_LABELS: Record<AssetStatus, string> = {
  ACTIVE: 'Active',
  MAINTENANCE: 'Maintenance',
  RETIRED: 'Retired',
}

const STATUS_COLORS: Record<AssetStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  MAINTENANCE: 'bg-yellow-100 text-yellow-700',
  RETIRED: 'bg-gray-100 text-gray-700',
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

const AVAILABILITY_COLORS: Record<Availability, string> = {
  AVAILABLE: 'bg-blue-100 text-blue-700',
  DEGRADED: 'bg-orange-100 text-orange-700',
  NA: 'bg-gray-100 text-gray-500',
}

function fmtDate(d: string | null) {
  if (!d) return '-'
  return format(new Date(d), 'dd/MM/yy')
}

interface Asset {
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
  status: AssetStatus
  lifecycle: Lifecycle
  availability: Availability
  createdAt: string
  category: { name: string; prefix: string }
  location: { name: string; code: string } | null
  assignedTo: { name: string } | null
}

interface Category { id: string; name: string }
interface Location { id: string; name: string }

export function AssetsClient() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('all')
  const [locationId, setLocationId] = useState('all')
  const [status, setStatus] = useState('all')
  const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [qrAsset, setQrAsset] = useState<Asset | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    if (categoryId !== 'all') params.set('categoryId', categoryId)
    if (locationId !== 'all') params.set('locationId', locationId)
    if (status !== 'all') params.set('status', status)
    const res = await fetch(`/api/assets?${params}`)
    const data = await res.json()
    setAssets(data.assets || [])
    setTotal(data.total || 0)
    setTotalPages(data.totalPages || 1)
    setLoading(false)
  }, [page, search, categoryId, locationId, status])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setCategories)
    fetch('/api/locations').then(r => r.json()).then(setLocations)
  }, [])

  async function handleDelete(asset: Asset) {
    if (!confirm(`ลบอุปกรณ์ "${asset.assetId} - ${asset.name}" ใช่หรือไม่?`)) return
    const res = await fetch(`/api/assets/${asset.id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('เกิดข้อผิดพลาด'); return }
    toast.success('ลบสำเร็จ')
    load()
  }

  function exportExcel() {
    const rows = assets.map(a => ({
      'Asset ID': a.assetId,
      'ชื่ออุปกรณ์': a.name,
      'ประเภท': a.category.name,
      'ยี่ห้อ': a.brand || '',
      'รุ่น': a.model || '',
      'Serial No.': a.serialNumber || '',
      'Status': STATUS_LABELS[a.status],
      'Lifecycle': LIFECYCLE_LABELS[a.lifecycle],
      'Purchase': fmtDate(a.purchaseDate),
      'Install': fmtDate(a.installDate),
      'Warranty': fmtDate(a.warrantyExpire),
      'EOL Year': a.eolYear || '',
      'Availability': AVAILABILITY_LABELS[a.availability],
      'สถานที่': a.location?.name || '',
      'ผู้ใช้': a.assignedTo?.name || '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Assets')
    XLSX.writeFile(wb, `it-assets-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold">อุปกรณ์ทั้งหมด</h2>
          <p className="text-sm text-muted-foreground">{total} รายการ</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/scan" className={cn(buttonVariants({ variant: 'outline' }))}><ScanLine className="h-4 w-4 mr-2" />สแกน</Link>
          <Button variant="outline" onClick={exportExcel}><Download className="h-4 w-4 mr-2" />Export</Button>
          <Link href="/assets/new" className={cn(buttonVariants())}><Plus className="h-4 w-4 mr-2" />เพิ่มอุปกรณ์</Link>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="ค้นหา..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <Select value={categoryId} onValueChange={v => { setCategoryId(v ?? 'all'); setPage(1) }}>
          <SelectTrigger><SelectValue placeholder="ประเภทอุปกรณ์" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกประเภท</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={locationId} onValueChange={v => { setLocationId(v ?? 'all'); setPage(1) }}>
          <SelectTrigger><SelectValue placeholder="สถานที่" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานที่</SelectItem>
            {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={v => { setStatus(v ?? 'all'); setPage(1) }}>
          <SelectTrigger><SelectValue placeholder="สถานะ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานะ</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Asset ID</TableHead>
              <TableHead>ชื่ออุปกรณ์</TableHead>
              <TableHead>ประเภท</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Lifecycle</TableHead>
              <TableHead>Purchase</TableHead>
              <TableHead>Install</TableHead>
              <TableHead>Warranty</TableHead>
              <TableHead>EOL</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={11} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
            ) : assets.length === 0 ? (
              <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">ไม่พบข้อมูลอุปกรณ์</TableCell></TableRow>
            ) : assets.map(asset => (
              <TableRow key={asset.id}>
                <TableCell><Badge variant="outline" className="font-mono">{asset.assetId}</Badge></TableCell>
                <TableCell>
                  <div className="font-medium whitespace-nowrap">{asset.name}</div>
                  <div className="text-xs text-muted-foreground">{[asset.brand, asset.model].filter(Boolean).join(' ') || ''}</div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{asset.category.name}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[asset.status]}`}>
                    {STATUS_LABELS[asset.status]}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{LIFECYCLE_LABELS[asset.lifecycle]}</TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(asset.purchaseDate)}</TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(asset.installDate)}</TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(asset.warrantyExpire)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{asset.eolYear || '-'}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${AVAILABILITY_COLORS[asset.availability]}`}>
                    {AVAILABILITY_LABELS[asset.availability]}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Link href={`/assets/${asset.id}`} className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))} title="ดูรายละเอียด"><Eye className="h-4 w-4" /></Link>
                    <Button variant="ghost" size="icon" onClick={() => setQrAsset(asset)} title="พิมพ์ Barcode"><BarcodeIcon className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(asset)} title="ลบ"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">หน้า {page} / {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>ก่อนหน้า</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>ถัดไป</Button>
          </div>
        </div>
      )}

      {qrAsset && (
        <QRPrintModal
          open={!!qrAsset}
          onClose={() => setQrAsset(null)}
          assetId={qrAsset.id}
          assetCode={qrAsset.assetId}
          name={qrAsset.name}
          location={qrAsset.location?.name}
        />
      )}
    </>
  )
}
