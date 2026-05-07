'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Camera, CheckCircle2, AlertCircle, RefreshCcw, ScanLine, Keyboard } from 'lucide-react'
import { toast } from 'sonner'

function parseQRText(text: string): { type: 'url' | 'code'; value: string } | null {
  // 1) URL like http://host/assets/{uuid}
  try {
    const url = new URL(text)
    const m = url.pathname.match(/\/assets\/([a-zA-Z0-9-]+)/)
    if (m) return { type: 'url', value: m[1] }
  } catch {}
  // 2) Asset ID code like SRV-001 or NET-1
  if (/^[A-Z]{2,6}-\d{1,5}$/.test(text.trim())) {
    return { type: 'code', value: text.trim() }
  }
  return null
}

async function resolveAsset(parsed: { type: 'url' | 'code'; value: string }) {
  if (parsed.type === 'url') {
    const res = await fetch(`/api/assets/${parsed.value}`)
    if (!res.ok) throw new Error('not found')
    const d = await res.json()
    return { assetId: parsed.value as string, name: d.name as string, code: d.assetId as string }
  } else {
    const res = await fetch(`/api/assets/by-code/${parsed.value}`)
    if (!res.ok) throw new Error('not found')
    const d = await res.json()
    return { assetId: d.id as string, name: d.name as string, code: d.assetId as string }
  }
}

export function ScannerClient() {
  const router = useRouter()
  const [active, setActive] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastScan, setLastScan] = useState<{ assetId: string; code: string; name: string } | null>(null)
  const [manualCode, setManualCode] = useState('')
  const [manualLoading, setManualLoading] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [barcodeSupported, setBarcodeSupported] = useState<boolean | null>(null)
  const navigatedRef = useRef(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      // @ts-expect-error BarcodeDetector is not in TS lib yet
      BarcodeDetector.getSupportedFormats().then((formats: string[]) => {
        setBarcodeSupported(formats.includes('code_128') || formats.includes('qr_code'))
      }).catch(() => setBarcodeSupported(false))
    } else {
      setBarcodeSupported(false)
    }
  }, [])

  async function handleScan(detected: IDetectedBarcode[]) {
    if (navigatedRef.current || !active || detected.length === 0) return
    const text = detected[0].rawValue
    const parsed = parseQRText(text)
    if (!parsed) {
      toast.error('ไม่รู้จัก: ' + text.slice(0, 40))
      return
    }
    navigatedRef.current = true
    setActive(false)
    try {
      const result = await resolveAsset(parsed)
      setLastScan(result)
      toast.success(`พบอุปกรณ์: ${result.code}`)
      setTimeout(() => router.push(`/assets/${result.assetId}`), 800)
    } catch {
      toast.error('ไม่พบข้อมูลอุปกรณ์ในระบบ')
      navigatedRef.current = false
      setActive(true)
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = manualCode.trim().toUpperCase()
    if (!code) return
    const parsed = parseQRText(code)
    if (!parsed) {
      toast.error('รหัสไม่ถูกต้อง เช่น SRV-001')
      return
    }
    setManualLoading(true)
    try {
      const result = await resolveAsset(parsed)
      setLastScan(result)
      toast.success(`พบอุปกรณ์: ${result.code}`)
      setTimeout(() => router.push(`/assets/${result.assetId}`), 800)
    } catch {
      toast.error('ไม่พบข้อมูลอุปกรณ์ในระบบ')
    } finally {
      setManualLoading(false)
    }
  }

  function handleError(err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.toLowerCase().includes('permission') || message.toLowerCase().includes('notallowed')) {
      setError('ไม่ได้รับอนุญาตให้เข้าถึงกล้อง — กรุณาอนุญาตการใช้กล้องในเบราว์เซอร์')
    } else if (message.toLowerCase().includes('notfound') || message.toLowerCase().includes('device')) {
      setError('ไม่พบกล้องในอุปกรณ์นี้')
    } else {
      setError('ไม่สามารถเปิดกล้องได้: ' + message.slice(0, 80))
    }
  }

  function reset() {
    setError(null)
    setLastScan(null)
    setManualCode('')
    navigatedRef.current = false
    setActive(true)
  }

  // Determine scan formats based on BarcodeDetector support
  const scanFormats: ('qr_code' | 'code_128' | 'code_39' | 'ean_13')[] =
    barcodeSupported === false
      ? ['qr_code']
      : ['qr_code', 'code_128', 'code_39', 'ean_13']

  return (
    <div className="max-w-md mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-blue-500" />
            สแกน Barcode / QR Code
          </CardTitle>
          <p className="text-sm text-muted-foreground">วาง Barcode หรือ QR ของอุปกรณ์ในกรอบเพื่อดูข้อมูลทันที</p>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <p className="text-sm font-medium">ไม่สามารถเปิดกล้องได้</p>
              <p className="text-xs text-muted-foreground max-w-xs">{error}</p>
              <Button onClick={reset} variant="outline" size="sm">
                <RefreshCcw className="h-4 w-4 mr-2" />ลองใหม่
              </Button>
            </div>
          ) : lastScan ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <div>
                <p className="font-mono font-bold text-lg">{lastScan.code}</p>
                <p className="text-sm text-muted-foreground">{lastScan.name}</p>
              </div>
              <p className="text-xs text-muted-foreground">กำลังเปิดข้อมูล...</p>
            </div>
          ) : (
            <div className="rounded-lg overflow-hidden bg-black aspect-square relative">
              <Scanner
                onScan={handleScan}
                onError={handleError}
                paused={!active}
                constraints={{ facingMode: 'environment' }}
                formats={scanFormats}
                styles={{
                  container: { width: '100%', height: '100%' },
                  video: { width: '100%', height: '100%', objectFit: 'cover' },
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3/4 aspect-square border-2 border-white/80 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual input fallback */}
      {!lastScan && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <button
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full"
              onClick={() => setShowManual(v => !v)}
            >
              <Keyboard className="h-4 w-4" />
              <span>{showManual ? 'ซ่อนการพิมพ์รหัส' : 'พิมพ์รหัสอุปกรณ์แทน'}</span>
            </button>
            {showManual && (
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <Input
                  placeholder="เช่น SRV-001"
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value)}
                  className="uppercase"
                  autoFocus
                />
                <Button type="submit" disabled={manualLoading} size="sm">
                  {manualLoading ? 'กำลังค้น...' : 'ค้นหา'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {!error && !lastScan && (
        <Card>
          <CardContent className="p-4 text-xs text-muted-foreground space-y-1">
            <p className="flex items-center gap-2"><Camera className="h-3 w-3" />ใช้กล้องหลัง (environment) อัตโนมัติ</p>
            <p>• รองรับ Barcode (Code 128) และ QR Code</p>
            {barcodeSupported === false && (
              <p className="text-amber-600">• เบราว์เซอร์นี้ไม่รองรับสแกน Barcode — ใช้ QR หรือพิมพ์รหัสแทน</p>
            )}
            <p>• Asset Code เช่น SRV-001, NET-001</p>
            <p>• เมื่อสแกนสำเร็จ → เปิดหน้าอุปกรณ์ทันที</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
