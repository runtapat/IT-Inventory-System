import { Header } from '@/components/layout/Header'
import { UsersClient } from './UsersClient'

export default function UsersPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="ผู้ใช้งาน" />
      <div className="flex-1 p-6 overflow-auto">
        <UsersClient />
      </div>
    </div>
  )
}
