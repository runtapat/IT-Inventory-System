import { Header } from '@/components/layout/Header'
import { LocationsClient } from './LocationsClient'

export default function LocationsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="สถานที่" />
      <div className="flex-1 p-6 overflow-auto">
        <LocationsClient />
      </div>
    </div>
  )
}
