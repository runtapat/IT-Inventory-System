interface PrintParams {
  assetCode: string
  name: string
  location?: string | null
  svgMarkup: string
  qrSvgMarkup?: string | null
}

export function printBarcodeSticker({ assetCode, name, location, svgMarkup, qrSvgMarkup }: PrintParams) {
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Sticker ${assetCode}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 20px;
    background: white;
  }
  .sticker {
    border: 2px solid #000;
    border-radius: 8px;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    background: white;
    page-break-inside: avoid;
    min-width: 280px;
    max-width: 360px;
  }
  .barcode-row { width: 100%; display: flex; justify-content: center; }
  .barcode-row svg { display: block; max-width: 100%; }
  .info-row {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .info-row .qr-box { flex-shrink: 0; }
  .info-row .qr-box svg { display: block; width: 72px; height: 72px; }
  .info-text { flex: 1; min-width: 0; }
  .code { font-size: 20px; font-weight: 700; letter-spacing: 0.06em; }
  .name { font-size: 12px; color: #333; word-break: break-word; margin-top: 2px; }
  .loc { font-size: 11px; color: #777; margin-top: 1px; }
  .no-qr-info { text-align: center; }
  @media print {
    body { padding: 0; }
    @page { size: auto; margin: 6mm; }
  }
</style>
</head>
<body>
  <div class="sticker">
    <div class="barcode-row">${svgMarkup}</div>
    <div class="info-row">
      ${qrSvgMarkup ? `<div class="qr-box">${qrSvgMarkup}</div>` : ''}
      <div class="info-text ${qrSvgMarkup ? '' : 'no-qr-info'}">
        <div class="code">${escapeHtml(assetCode)}</div>
        <div class="name">${escapeHtml(name)}</div>
        ${location ? `<div class="loc">${escapeHtml(location)}</div>` : ''}
      </div>
    </div>
  </div>
  <script>
    window.addEventListener('load', () => {
      setTimeout(() => { window.focus(); window.print(); }, 50);
    });
    window.addEventListener('afterprint', () => { setTimeout(() => window.close(), 100); });
  </script>
</body>
</html>`

  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;'
  document.body.appendChild(iframe)
  iframe.srcdoc = html
  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
      } catch {
        const w = window.open('', '_blank')
        if (w) { w.document.write(html); w.document.close() }
      }
      setTimeout(() => iframe.remove(), 2000)
    }, 100)
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}
