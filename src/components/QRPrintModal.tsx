'use client'

import { useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'
import { AssetBarcode } from '@/components/AssetBarcode'
import { QRCodeSVG } from 'qrcode.react'
import { printBarcodeSticker } from '@/lib/print-barcode'

interface QRPrintModalProps {
  open: boolean
  onClose: () => void
  assetId: string
  assetCode: string
  name: string
  location?: string | null
}

export function QRPrintModal({ open, onClose, assetId, assetCode, name, location }: QRPrintModalProps) {
  const barcodeRef = useRef<HTMLDivElement>(null)
  const qrRef = useRef<HTMLDivElement>(null)

  const assetUrl = typeof window !== 'undefined' ? `${window.location.origin}/assets/${assetId}` : `/assets/${assetId}`

  function handlePrint() {
    const barcodeSvg = barcodeRef.current?.querySelector('svg')
    const qrSvg = qrRef.current?.querySelector('svg')
    if (!barcodeSvg) return
    printBarcodeSticker({
      assetCode,
      name,
      location,
      svgMarkup: barcodeSvg.outerHTML,
      qrSvgMarkup: qrSvg?.outerHTML ?? null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Barcode Sticker</DialogTitle></DialogHeader>
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="flex flex-col items-center gap-3 p-4 border-2 rounded-lg bg-white w-full">
            {/* Barcode */}
            <div ref={barcodeRef} className="flex justify-center w-full">
              <AssetBarcode value={assetCode} width={2} height={70} />
            </div>
            {/* Info row with QR */}
            <div className="flex items-center gap-3 w-full">
              <div ref={qrRef} className="shrink-0">
                <QRCodeSVG value={assetUrl} size={72} bgColor="#ffffff" fgColor="#000000" level="M" />
              </div>
              <div className="min-w-0">
                <p className="font-mono font-bold text-xl tracking-wider">{assetCode}</p>
                <p className="text-sm text-muted-foreground truncate max-w-[180px]">{name}</p>
                {location && <p className="text-xs text-muted-foreground">{location}</p>}
              </div>
            </div>
          </div>
          <Button onClick={handlePrint} className="w-full">
            <Printer className="h-4 w-4 mr-2" />
            พิมพ์ Sticker
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
