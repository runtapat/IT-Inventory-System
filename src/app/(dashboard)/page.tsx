import { Header } from '@/components/layout/Header'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { WarrantyAlerts } from '@/components/dashboard/WarrantyAlerts'
import { EOLAlerts } from '@/components/dashboard/EOLAlerts'
import { RecentActivity } from '@/components/dashboard/RecentActivity'

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" />
      <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-auto">
        <DashboardStats />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <DashboardCharts />
          </div>
          <div className="space-y-4 sm:space-y-6">
            <WarrantyAlerts />
            <EOLAlerts />
            <RecentActivity />
          </div>
        </div>
      </div>
    </div>
  )
}
