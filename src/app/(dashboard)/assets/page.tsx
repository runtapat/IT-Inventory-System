import { Header } from '@/components/layout/Header'
import { AssetsClient } from './AssetsClient'

export default function AssetsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="อุปกรณ์ทั้งหมด" />
      <div className="flex-1 p-4 sm:p-6 overflow-auto">
        <AssetsClient />
      </div>
    </div>
  )
}
