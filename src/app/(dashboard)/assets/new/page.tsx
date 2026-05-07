import { Header } from '@/components/layout/Header'
import { AssetForm } from '@/components/forms/AssetForm'

export default function NewAssetPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="เพิ่มอุปกรณ์ใหม่" />
      <div className="flex-1 p-6 overflow-auto">
        <AssetForm />
      </div>
    </div>
  )
}
