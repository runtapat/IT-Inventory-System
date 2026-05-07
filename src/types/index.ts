import { AssetStatus, MaintenanceType, Role } from '@prisma/client'

export type { AssetStatus, MaintenanceType, Role }

export interface CategoryWithCount {
  id: string
  prefix: string
  name: string
  description: string | null
  currentRunningNo: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  _count: { assets: number }
}

export interface AssetWithRelations {
  id: string
  assetId: string
  name: string
  brand: string | null
  model: string | null
  serialNumber: string | null
  specification: string | null
  purchaseDate: Date | null
  warrantyExpire: Date | null
  price: string | null
  poNumber: string | null
  locationDetail: string | null
  assignedDate: Date | null
  status: AssetStatus
  note: string | null
  qrCode: string | null
  imageUrl: string | null
  isDeleted: boolean
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
  category: { id: string; name: string; prefix: string }
  location: { id: string; name: string; code: string } | null
  vendor: { id: string; name: string } | null
  assignedTo: { id: string; name: string; email: string } | null
}

export interface DashboardStats {
  total: number
  inUse: number
  inStock: number
  repair: number
  disposed: number
  reserved: number
  lost: number
  totalValue: number
}

export interface WarrantyAlert {
  id: string
  assetId: string
  name: string
  warrantyExpire: Date
  daysLeft: number
}
