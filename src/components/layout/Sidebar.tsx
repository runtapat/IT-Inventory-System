'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Monitor,
  Tag,
  MapPin,
  Users,
  LogOut,
  Menu,
  X,
  Package,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useLayout } from './LayoutContext'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/assets', label: 'อุปกรณ์', icon: Monitor },
  { href: '/categories', label: 'ประเภทอุปกรณ์', icon: Tag },
  { href: '/locations', label: 'สถานที่', icon: MapPin },
  { href: '/users', label: 'ผู้ใช้งาน', icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const { mobileOpen, closeMobile } = useLayout()

  // Close mobile sidebar on route change
  useEffect(() => { closeMobile() }, [pathname])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className={cn(
        // Base styles
        'flex flex-col h-screen bg-slate-900 text-white transition-all duration-300',
        // Mobile: fixed overlay, slide in/out
        'fixed inset-y-0 left-0 z-50 md:relative md:z-auto md:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        // Desktop width (collapsed/expanded)
        collapsed ? 'md:w-16' : 'md:w-64',
        // Mobile always full width when open
        'w-72 md:w-auto',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-blue-400 shrink-0" />
          {(!collapsed || mobileOpen) && (
            <span className="font-bold text-sm">IT Inventory</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (mobileOpen) { closeMobile() } else { setCollapsed(!collapsed) }
          }}
          className="text-slate-400 hover:text-white hover:bg-slate-700"
        >
          {(mobileOpen || !collapsed) ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {(!collapsed || mobileOpen) && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white w-full transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {(!collapsed || mobileOpen) && <span>ออกจากระบบ</span>}
        </button>
      </div>
    </aside>
  )
}
