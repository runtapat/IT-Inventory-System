import { Header } from '@/components/layout/Header'
import { EditAssetClient } from './EditAssetClient'

export default async function EditAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="flex flex-col h-full">
      <Header title="แก้ไขอุปกรณ์" />
      <div className="flex-1 p-6 overflow-auto">
        <EditAssetClient assetId={id} />
      </div>
    </div>
  )
}
