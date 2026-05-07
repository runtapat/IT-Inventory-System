'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Loader2, Trash2, ShieldCheck, Eye, Pencil } from 'lucide-react'
import { Role } from '@prisma/client'
import { format } from 'date-fns'

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  EDITOR: 'Editor',
  VIEWER: 'Viewer',
}

const ROLE_COLORS: Record<Role, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  EDITOR: 'bg-blue-100 text-blue-700',
  VIEWER: 'bg-gray-100 text-gray-600',
}

interface User {
  id: string
  email: string
  name: string
  role: Role
  isActive: boolean
  createdAt: string
}

export function UsersClient() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'VIEWER' as Role })

  async function load() {
    setLoading(true)
    const res = await fetch('/api/users')
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAdd() {
    setSubmitting(true)
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSubmitting(false)
    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error || 'เกิดข้อผิดพลาด')
      return
    }
    toast.success('เพิ่มผู้ใช้สำเร็จ')
    setShowAdd(false)
    setForm({ email: '', name: '', password: '', role: 'VIEWER' })
    load()
  }

  async function handleRoleChange(id: string, role: Role) {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    if (!res.ok) { toast.error('เกิดข้อผิดพลาด'); return }
    toast.success('อัปเดต Role สำเร็จ')
    load()
  }

  async function handleToggleActive(user: User) {
    const res = await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !user.isActive }),
    })
    if (!res.ok) { toast.error('เกิดข้อผิดพลาด'); return }
    toast.success(user.isActive ? 'ระงับบัญชีแล้ว' : 'เปิดใช้งานแล้ว')
    load()
  }

  async function handleDelete(user: User) {
    if (!confirm(`ลบผู้ใช้ "${user.name}" (${user.email}) ใช่หรือไม่?\nการกระทำนี้ไม่สามารถย้อนกลับได้`)) return
    const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error || 'เกิดข้อผิดพลาด')
      return
    }
    toast.success('ลบผู้ใช้สำเร็จ')
    load()
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold">ผู้ใช้งานทั้งหมด</h2>
          <p className="text-sm text-muted-foreground">{users.length} บัญชี</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-2" />เพิ่มผู้ใช้</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ</TableHead>
                <TableHead>อีเมล</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>เพิ่มเมื่อ</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
              ) : users.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">ยังไม่มีผู้ใช้งาน</TableCell></TableRow>
              ) : users.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Select value={user.role} onValueChange={v => handleRoleChange(user.id, v as Role)}>
                      <SelectTrigger className="w-28 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="EDITOR">Editor</SelectItem>
                        <SelectItem value="VIEWER">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleToggleActive(user)}
                      className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(user.createdAt), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="text-red-500 h-8 w-8" onClick={() => handleDelete(user)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Role Legend */}
      <Card className="mt-4">
        <CardHeader><CardTitle className="text-sm">สิทธิ์การใช้งาน</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Admin</p>
                <p className="text-muted-foreground text-xs">จัดการผู้ใช้ เพิ่ม/แก้ไข/ลบทุกอย่างได้</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Pencil className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Editor</p>
                <p className="text-muted-foreground text-xs">เพิ่ม/แก้ไขอุปกรณ์ได้ ลบไม่ได้</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Eye className="h-4 w-4 text-gray-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Viewer</p>
                <p className="text-muted-foreground text-xs">ดูข้อมูลอย่างเดียว ไม่สามารถแก้ไขได้</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>เพิ่มผู้ใช้ใหม่</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>ชื่อ-นามสกุล</Label>
              <Input placeholder="ชื่อ นามสกุล" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>อีเมล</Label>
              <Input type="email" placeholder="email@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>รหัสผ่าน</Label>
              <Input type="password" placeholder="อย่างน้อย 6 ตัวอักษร" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v as Role }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="EDITOR">Editor</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>ยกเลิก</Button>
            <Button onClick={handleAdd} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              เพิ่มผู้ใช้
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
