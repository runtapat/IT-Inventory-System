import { Header } from '@/components/layout/Header'
import { ScannerClient } from './ScannerClient'

export default function ScanPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="สแกน QR Code" />
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        <ScannerClient />
      </div>
    </div>
  )
}
