'use client'

import { createContext, useContext, useState } from 'react'

interface LayoutContextType {
  mobileOpen: boolean
  openMobile: () => void
  closeMobile: () => void
}

const LayoutContext = createContext<LayoutContextType>({
  mobileOpen: false,
  openMobile: () => {},
  closeMobile: () => {},
})

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <LayoutContext.Provider value={{
      mobileOpen,
      openMobile: () => setMobileOpen(true),
      closeMobile: () => setMobileOpen(false),
    }}>
      {children}
    </LayoutContext.Provider>
  )
}

export const useLayout = () => useContext(LayoutContext)
