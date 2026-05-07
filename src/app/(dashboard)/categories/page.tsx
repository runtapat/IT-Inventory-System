import { Header } from '@/components/layout/Header'
import { CategoriesClient } from './CategoriesClient'

export default function CategoriesPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="ประเภทอุปกรณ์" />
      <div className="flex-1 p-6 overflow-auto">
        <CategoriesClient />
      </div>
    </div>
  )
}
