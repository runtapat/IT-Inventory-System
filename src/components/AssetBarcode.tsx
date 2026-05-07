'use client'

import Barcode from 'react-barcode'

interface AssetBarcodeProps {
  value: string
  width?: number
  height?: number
  displayValue?: boolean
}

export function AssetBarcode({ value, width = 2, height = 60, displayValue = false }: AssetBarcodeProps) {
  return (
    <Barcode
      value={value}
      format="CODE128"
      width={width}
      height={height}
      displayValue={displayValue}
      background="#ffffff"
      lineColor="#000000"
      margin={0}
    />
  )
}
