'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'

const schema = z.object({
  code: z.string().min(1, 'กรุณาระบุรหัส'),
  name: z.string().min(1, 'กรุณาระบุชื่อ'),
  building: z.string().optional(),
  floor: z.string().optional(),
  room: z.string().optional(),
  address: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface Location {
  id: string
  code: string
  name: string
  building: string | null
  floor: string | null
  room: string | null
  address: string | null
  isActive: boolean
  _count: { assets: number }
}

export function LocationsClient() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Location | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function load() {
    const res = await fetch('/api/locations')
    setLocations(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditing(null)
    reset({})
    setOpen(true)
  }

  function openEdit(loc: Location) {
    setEditing(loc)
    reset({ code: loc.code, name: loc.name, building: loc.building || '', floor: loc.floor || '', room: loc.room || '', address: loc.address || '' })
    setOpen(true)
  }

  async function onSubmit(data: FormData) {
    setSubmitting(true)
    const url = editing ? `/api/locations/${editing.id}` : '/api/locations'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    setSubmitting(false)
    if (!res.ok) { toast.error((await res.json()).error || 'เกิดข้อผิดพลาด'); return }
    toast.success(editing ? 'แก้ไขสำเร็จ' : 'เพิ่มสถานที่สำเร็จ')
    setOpen(false)
    load()
  }

  async function handleDelete(loc: Location) {
    if (!confirm(`ลบสถานที่ "${loc.name}" ใช่หรือไม่?`)) return
    const res = await fetch(`/api/locations/${loc.id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error((await res.json()).error || 'เกิดข้อผิดพลาด'); return }
    toast.success('ลบสำเร็จ')
    load()
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold">สถานที่ทั้งหมด</h2>
          <p className="text-sm text-muted-foreground">{locations.length} สถานที่</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />เพิ่มสถานที่</Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>รหัส</TableHead>
              <TableHead>ชื่อสถานที่</TableHead>
              <TableHead>อาคาร</TableHead>
              <TableHead>ชั้น/ห้อง</TableHead>
              <TableHead className="text-center">อุปกรณ์</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
            ) : locations.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">ยังไม่มีข้อมูลสถานที่</TableCell></TableRow>
            ) : locations.map((loc) => (
              <TableRow key={loc.id}>
                <TableCell><Badge variant="outline" className="font-mono">{loc.code}</Badge></TableCell>
                <TableCell className="font-medium">{loc.name}</TableCell>
                <TableCell className="text-muted-foreground">{loc.building || '-'}</TableCell>
                <TableCell className="text-muted-foreground">{[loc.floor, loc.room].filter(Boolean).join(' / ') || '-'}</TableCell>
                <TableCell className="text-center">{loc._count.assets}</TableCell>
                <TableCell><Badge variant={loc.isActive ? 'default' : 'secondary'}>{loc.isActive ? 'ใช้งาน' : 'ปิด'}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(loc)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(loc)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'แก้ไขสถานที่' : 'เพิ่มสถานที่'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>รหัส</Label>
                <Input placeholder="เช่น HQ-01" {...register('code')} />
                {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>อาคาร</Label>
                <Input placeholder="เช่น HQ, Building A" {...register('building')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>ชื่อสถานที่</Label>
              <Input placeholder="ชื่อเต็ม" {...register('name')} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ชั้น</Label>
                <Input placeholder="เช่น 3, B1" {...register('floor')} />
              </div>
              <div className="space-y-2">
                <Label>ห้อง</Label>
                <Input placeholder="เช่น Server Room" {...register('room')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>ที่อยู่</Label>
              <Input placeholder="ที่อยู่เพิ่มเติม" {...register('address')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? 'บันทึก' : 'เพิ่ม'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
