import { Header } from '@/components/layout/Header'
import { ActivityClient } from './ActivityClient'

export default function ActivityPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="ความเคลื่อนไหวล่าสุด" />
      <div className="flex-1 p-4 sm:p-6 overflow-auto">
        <ActivityClient />
      </div>
    </div>
  )
}
