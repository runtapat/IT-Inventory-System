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
  prefix: z.string().length(2).regex(/^[A-Z]{2}$/, 'ต้องเป็นตัวพิมพ์ใหญ่ A-Z 2 ตัว'),
  name: z.string().min(1, 'กรุณาระบุชื่อ'),
  description: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface Category {
  id: string
  prefix: string
  name: string
  description: string | null
  currentRunningNo: number
  isActive: boolean
  _count: { assets: number }
}

export function CategoriesClient() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function load() {
    const res = await fetch('/api/categories')
    setCategories(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditing(null)
    reset({ prefix: '', name: '', description: '' })
    setOpen(true)
  }

  function openEdit(cat: Category) {
    setEditing(cat)
    reset({ prefix: cat.prefix, name: cat.name, description: cat.description || '' })
    setOpen(true)
  }

  async function onSubmit(data: FormData) {
    setSubmitting(true)
    const url = editing ? `/api/categories/${editing.id}` : '/api/categories'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setSubmitting(false)
    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error || 'เกิดข้อผิดพลาด')
      return
    }
    toast.success(editing ? 'แก้ไขสำเร็จ' : 'เพิ่มประเภทสำเร็จ')
    setOpen(false)
    load()
  }

  async function handleDelete(cat: Category) {
    if (!confirm(`ลบประเภท "${cat.name}" ใช่หรือไม่?`)) return
    const res = await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error || 'เกิดข้อผิดพลาด')
      return
    }
    toast.success('ลบสำเร็จ')
    load()
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold">ประเภทอุปกรณ์ทั้งหมด</h2>
          <p className="text-sm text-muted-foreground">{categories.length} ประเภท</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          เพิ่มประเภท
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Prefix</TableHead>
              <TableHead>ชื่อประเภท</TableHead>
              <TableHead>คำอธิบาย</TableHead>
              <TableHead className="w-24 text-center">Running No.</TableHead>
              <TableHead className="w-24 text-center">อุปกรณ์</TableHead>
              <TableHead className="w-20">สถานะ</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  ยังไม่มีข้อมูลประเภทอุปกรณ์
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell>
                    <Badge variant="outline" className="font-mono font-bold">{cat.prefix}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{cat.description || '-'}</TableCell>
                  <TableCell className="text-center">{cat.currentRunningNo}</TableCell>
                  <TableCell className="text-center">{cat._count.assets}</TableCell>
                  <TableCell>
                    <Badge variant={cat.isActive ? 'default' : 'secondary'}>
                      {cat.isActive ? 'ใช้งาน' : 'ปิด'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(cat)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'แก้ไขประเภทอุปกรณ์' : 'เพิ่มประเภทอุปกรณ์'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Prefix (2 ตัวอักษร A-Z)</Label>
              <Input placeholder="เช่น NW, SV, PC" className="uppercase" {...register('prefix')} onChange={e => { e.target.value = e.target.value.toUpperCase(); register('prefix').onChange(e) }} />
              {errors.prefix && <p className="text-sm text-red-500">{errors.prefix.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>ชื่อประเภท</Label>
              <Input placeholder="เช่น Network, Server" {...register('name')} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>คำอธิบาย</Label>
              <Input placeholder="รายละเอียดเพิ่มเติม" {...register('description')} />
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
