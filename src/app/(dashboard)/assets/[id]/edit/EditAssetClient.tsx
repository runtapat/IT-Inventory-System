'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { AssetForm } from '@/components/forms/AssetForm'

interface AssetRaw {
  id: string
  categoryId: string
  name: string
  brand: string | null
  model: string | null
  serialNumber: string | null
  purchaseDate: string | null
  installDate: string | null
  warrantyExpire: string | null
  eolYear: number | null
  price: string | null
  poNumber: string | null
  vendorId: string | null
  locationId: string | null
  locationDetail: string | null
  status: string
  lifecycle: string
  availability: string
  note: string | null
}

function toDateInput(dateStr: string | null): string | undefined {
  if (!dateStr) return undefined
  return new Date(dateStr).toISOString().split('T')[0]
}

export function EditAssetClient({ assetId }: { assetId: string }) {
  const [asset, setAsset] = useState<AssetRaw | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/assets/${assetId}`)
      .then(r => r.json())
      .then(data => { setAsset(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [assetId])

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (!asset) {
    return <div className="text-center py-20 text-muted-foreground">ไม่พบข้อมูลอุปกรณ์</div>
  }

  const defaultValues = {
    categoryId: asset.categoryId,
    name: asset.name,
    brand: asset.brand ?? undefined,
    model: asset.model ?? undefined,
    serialNumber: asset.serialNumber ?? undefined,
    purchaseDate: toDateInput(asset.purchaseDate),
    installDate: toDateInput(asset.installDate),
    warrantyExpire: toDateInput(asset.warrantyExpire),
    eolYear: asset.eolYear ? String(asset.eolYear) : undefined,
    price: asset.price ? String(parseFloat(asset.price)) : undefined,
    poNumber: asset.poNumber ?? undefined,
    vendorId: asset.vendorId ?? undefined,
    locationId: asset.locationId ?? undefined,
    locationDetail: asset.locationDetail ?? undefined,
    status: asset.status,
    lifecycle: asset.lifecycle,
    availability: asset.availability,
    note: asset.note ?? undefined,
  }

  return <AssetForm assetId={assetId} defaultValues={defaultValues} />
}
