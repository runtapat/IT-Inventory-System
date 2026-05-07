import { Header } from '@/components/layout/Header'
import { AssetDetailClient } from './AssetDetailClient'

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="flex flex-col h-full">
      <Header title="รายละเอียดอุปกรณ์" />
      <div className="flex-1 p-6 overflow-auto">
        <AssetDetailClient assetId={id} />
      </div>
    </div>
  )
}
