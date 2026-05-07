'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Loader2, Eye, Trash2, Download, Barcode as BarcodeIcon, ScanLine, Printer, X } from 'lucide-react'
import { AssetStatus, Lifecycle, Availability } from '@prisma/client'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { QRPrintModal } from '@/components/QRPrintModal'
import { AssetBarcode } from '@/components/AssetBarcode'
import { QRCodeSVG } from 'qrcode.react'
import { printMultiStickers } from '@/lib/print-multi-stickers'

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
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const printContainerRef = useRef<HTMLDivElement>(null)

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  function toggleSelectAll() {
    setSelected(prev => prev.size === assets.length ? new Set() : new Set(assets.map(a => a.id)))
  }
  function clearSelection() { setSelected(new Set()) }

  function handlePrintSelected() {
    const selectedAssets = assets.filter(a => selected.has(a.id))
    if (selectedAssets.length === 0) return
    const container = printContainerRef.current
    if (!container) return
    const stickers = selectedAssets.map(asset => {
      const node = container.querySelector(`[data-print-id="${asset.id}"]`)
      const svgs = node?.querySelectorAll('svg') ?? []
      const barcodeSvg = svgs[0]?.outerHTML ?? ''
      const qrSvg = svgs[1]?.outerHTML ?? null
      return {
        assetCode: asset.assetId,
        name: asset.name,
        location: asset.location?.name,
        barcodeSvg,
        qrSvg,
      }
    })
    printMultiStickers(stickers)
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return
    if (!confirm(`ลบอุปกรณ์ ${selected.size} รายการที่เลือก ใช่หรือไม่?`)) return
    const ids = [...selected]
    let ok = 0, fail = 0
    for (const id of ids) {
      const res = await fetch(`/api/assets/${id}`, { method: 'DELETE' })
      if (res.ok) ok++; else fail++
    }
    if (ok) toast.success(`ลบสำเร็จ ${ok} รายการ`)
    if (fail) toast.error(`ลบไม่สำเร็จ ${fail} รายการ`)
    clearSelection()
    load()
  }

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

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-3 p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearSelection} title="ยกเลิก"><X className="h-4 w-4" /></Button>
          <span className="text-sm font-medium">เลือก {selected.size} รายการ</span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={handlePrintSelected}>
              <Printer className="h-4 w-4 mr-1" />พิมพ์ Sticker
            </Button>
            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-1" />ลบ
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="ค้นหา..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <Select value={categoryId} onValueChange={v => { setCategoryId(v ?? 'all'); setPage(1) }}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="ประเภทอุปกรณ์">
              {categoryId === 'all' ? 'ทุกประเภท' : (categories.find(c => c.id === categoryId)?.name ?? 'ประเภทอุปกรณ์')}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกประเภท</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={locationId} onValueChange={v => { setLocationId(v ?? 'all'); setPage(1) }}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="สถานที่">
              {locationId === 'all' ? 'ทุกสถานที่' : (locations.find(l => l.id === locationId)?.name ?? 'สถานที่')}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานที่</SelectItem>
            {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={v => { setStatus(v ?? 'all'); setPage(1) }}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="สถานะ">
              {status === 'all' ? 'ทุกสถานะ' : (STATUS_LABELS[status as AssetStatus] ?? 'สถานะ')}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานะ</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Mobile: card view */}
      <div className="md:hidden space-y-2">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : assets.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground border rounded-lg">ไม่พบข้อมูลอุปกรณ์</div>
        ) : assets.map(asset => (
          <div key={asset.id} className={cn("border rounded-lg p-3 bg-card", selected.has(asset.id) && "ring-2 ring-blue-500")}>
            <div className="flex items-start justify-between gap-2">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 rounded border-input accent-blue-600"
                checked={selected.has(asset.id)}
                onChange={() => toggleSelect(asset.id)}
                onClick={e => e.stopPropagation()}
              />
              <Link href={`/assets/${asset.id}`} className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="font-mono text-xs">{asset.assetId}</Badge>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[asset.status]}`}>
                    {STATUS_LABELS[asset.status]}
                  </span>
                </div>
                <div className="font-medium text-sm truncate">{asset.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {[asset.brand, asset.model].filter(Boolean).join(' ') || asset.category.name}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-muted-foreground">
                  <span>{asset.category.name}</span>
                  {asset.location && <span>• {asset.location.name}</span>}
                  {asset.warrantyExpire && <span>• Warranty: {fmtDate(asset.warrantyExpire)}</span>}
                </div>
              </Link>
              <div className="flex flex-col gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQrAsset(asset)} title="พิมพ์ Barcode">
                  <BarcodeIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(asset)} title="ลบ">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table view */}
      <div className="hidden md:block rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input accent-blue-600"
                  checked={assets.length > 0 && selected.size === assets.length}
                  onChange={toggleSelectAll}
                />
              </TableHead>
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
              <TableRow><TableCell colSpan={12} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
            ) : assets.length === 0 ? (
              <TableRow><TableCell colSpan={12} className="text-center py-8 text-muted-foreground">ไม่พบข้อมูลอุปกรณ์</TableCell></TableRow>
            ) : assets.map(asset => (
              <TableRow key={asset.id} className={cn(selected.has(asset.id) && "bg-blue-50/50 dark:bg-blue-950/20")}>
                <TableCell>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-input accent-blue-600"
                    checked={selected.has(asset.id)}
                    onChange={() => toggleSelect(asset.id)}
                  />
                </TableCell>
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

      {/* Hidden render container for capturing barcode/QR SVGs of selected assets */}
      <div ref={printContainerRef} aria-hidden className="fixed -left-[9999px] top-0 pointer-events-none">
        {assets.filter(a => selected.has(a.id)).map(a => (
          <div key={a.id} data-print-id={a.id} className="bg-white">
            <AssetBarcode value={a.assetId} width={2} height={60} />
            <QRCodeSVG value={typeof window !== 'undefined' ? `${window.location.origin}/assets/${a.id}` : `/assets/${a.id}`} size={56} bgColor="#ffffff" fgColor="#000000" level="M" />
          </div>
        ))}
      </div>
    </>
  )
}
