'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { LayoutProvider, useLayout } from '@/components/layout/LayoutContext'
import { Toaster } from 'sonner'

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { mobileOpen, closeMobile } = useLayout()
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeMobile}
        />
      )}
      <Sidebar />
      <main className="flex-1 overflow-y-auto min-w-0">
        {children}
      </main>
      <Toaster richColors position="top-right" />
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <LayoutProvider>
      <DashboardContent>{children}</DashboardContent>
    </LayoutProvider>
  )
}
