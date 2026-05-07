'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const schema = z.object({
  categoryId: z.string().min(1, 'กรุณาเลือกประเภท'),
  name: z.string().min(1, 'กรุณาระบุชื่ออุปกรณ์'),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().optional(),
  installDate: z.string().optional(),
  warrantyExpire: z.string().optional(),
  eolYear: z.string().optional(),
  price: z.string().optional(),
  poNumber: z.string().optional(),
  vendorId: z.string().optional(),
  locationId: z.string().optional(),
  locationDetail: z.string().optional(),
  status: z.string().optional(),
  lifecycle: z.string().optional(),
  availability: z.string().optional(),
  note: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Category { id: string; prefix: string; name: string }
interface Location { id: string; code: string; name: string }
interface Vendor { id: string; name: string }

interface AssetFormProps {
  assetId?: string
  defaultValues?: Partial<FormData>
}

export function AssetForm({ assetId, defaultValues }: AssetFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'ACTIVE', lifecycle: 'IN_OPERATION', availability: 'AVAILABLE', ...defaultValues },
  })

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setCategories)
    fetch('/api/locations').then(r => r.json()).then(setLocations)
    fetch('/api/vendors').then(r => r.json()).then(setVendors)
  }, [])

  async function onSubmit(data: FormData) {
    setSubmitting(true)
    const payload = {
      ...data,
      price: data.price ? parseFloat(data.price) : undefined,
      eolYear: data.eolYear ? parseInt(data.eolYear, 10) : undefined,
      vendorId: data.vendorId === 'none' ? undefined : data.vendorId,
      locationId: data.locationId === 'none' ? undefined : data.locationId,
    }
    const url = assetId ? `/api/assets/${assetId}` : '/api/assets'
    const method = assetId ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSubmitting(false)
    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error || 'เกิดข้อผิดพลาด')
      return
    }
    const result = await res.json()
    toast.success(assetId ? 'แก้ไขสำเร็จ' : `เพิ่มอุปกรณ์สำเร็จ: ${result.assetId}`)
    router.push('/assets')
  }

  const currentStatus = defaultValues?.status || 'ACTIVE'
  const currentLifecycle = defaultValues?.lifecycle || 'IN_OPERATION'
  const currentAvailability = defaultValues?.availability || 'AVAILABLE'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/assets" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}><ArrowLeft className="h-4 w-4" /></Link>
        <div>
          <h2 className="text-lg font-semibold">{assetId ? 'แก้ไขอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่'}</h2>
          {!assetId && <p className="text-sm text-muted-foreground">Asset ID จะถูกสร้างอัตโนมัติตามประเภท</p>}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">ข้อมูลพื้นฐาน</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ประเภทอุปกรณ์ *</Label>
              <Select onValueChange={v => { if (v) setValue('categoryId', v as string) }} defaultValue={defaultValues?.categoryId}>
                <SelectTrigger><SelectValue placeholder="เลือกประเภท" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>[{c.prefix}] {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && <p className="text-sm text-red-500">{errors.categoryId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>สถานะ</Label>
              <Select onValueChange={v => { if (v) setValue('status', v as string) }} defaultValue={currentStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="RETIRED">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lifecycle</Label>
              <Select onValueChange={v => { if (v) setValue('lifecycle', v as string) }} defaultValue={currentLifecycle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN_OPERATION">In Operation</SelectItem>
                  <SelectItem value="UNDER_MAINTENANCE">Under Maintenance</SelectItem>
                  <SelectItem value="DECOMMISSIONED">Decommissioned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Availability</Label>
              <Select onValueChange={v => { if (v) setValue('availability', v as string) }} defaultValue={currentAvailability}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="DEGRADED">Degraded</SelectItem>
                  <SelectItem value="NA">N/A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>ชื่ออุปกรณ์ *</Label>
            <Input placeholder="ชื่อหรือรายละเอียดสั้น" {...register('name')} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ยี่ห้อ</Label>
              <Input placeholder="เช่น Cisco, Dell, HP" {...register('brand')} />
            </div>
            <div className="space-y-2">
              <Label>รุ่น</Label>
              <Input placeholder="Model number" {...register('model')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Serial Number</Label>
              <Input placeholder="S/N" {...register('serialNumber')} />
            </div>
            <div className="space-y-2">
              <Label>เลข PO</Label>
              <Input placeholder="Purchase Order" {...register('poNumber')} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">ข้อมูลการจัดซื้อและอายุการใช้งาน</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>วันที่ซื้อ</Label>
              <Input type="date" {...register('purchaseDate')} />
            </div>
            <div className="space-y-2">
              <Label>วันติดตั้ง</Label>
              <Input type="date" {...register('installDate')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Warranty หมด</Label>
              <Input type="date" {...register('warrantyExpire')} />
            </div>
            <div className="space-y-2">
              <Label>EOL ปี (ค.ศ.)</Label>
              <Input type="number" placeholder="เช่น 2028" {...register('eolYear')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ราคา (บาท)</Label>
              <Input type="number" step="0.01" placeholder="0.00" {...register('price')} />
            </div>
            <div className="space-y-2">
              <Label>ผู้จำหน่าย</Label>
              <Select onValueChange={v => { if (v) setValue('vendorId', v as string) }} defaultValue={defaultValues?.vendorId || 'none'}>
                <SelectTrigger><SelectValue placeholder="เลือกผู้จำหน่าย" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-</SelectItem>
                  {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">ตำแหน่ง</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>สถานที่</Label>
              <Select onValueChange={v => { if (v) setValue('locationId', v as string) }} defaultValue={defaultValues?.locationId || 'none'}>
                <SelectTrigger><SelectValue placeholder="เลือกสถานที่" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-</SelectItem>
                  {locations.map(l => <SelectItem key={l.id} value={l.id}>[{l.code}] {l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>รายละเอียดตำแหน่ง</Label>
              <Input placeholder="เช่น Rack 5, โต๊ะ 3A" {...register('locationDetail')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>หมายเหตุ</Label>
            <textarea className="w-full min-h-[60px] rounded-md border border-input px-3 py-2 text-sm" placeholder="หมายเหตุเพิ่มเติม" {...register('note')} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Link href="/assets" className={cn(buttonVariants({ variant: 'outline' }))}>ยกเลิก</Link>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {assetId ? 'บันทึก' : 'เพิ่มอุปกรณ์'}
        </Button>
      </div>
    </form>
  )
}
