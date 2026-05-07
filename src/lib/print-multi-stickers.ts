interface StickerData {
  assetCode: string
  name: string
  location?: string | null
  barcodeSvg: string
  qrSvg?: string | null
}

export function printMultiStickers(stickers: StickerData[]) {
  if (stickers.length === 0) return

  const stickerHtml = stickers
    .map(
      (s) => `
    <div class="sticker">
      <div class="barcode-row">${s.barcodeSvg}</div>
      <div class="info-row">
        ${s.qrSvg ? `<div class="qr-box">${s.qrSvg}</div>` : ''}
        <div class="info-text">
          <div class="code">${escapeHtml(s.assetCode)}</div>
          <div class="name">${escapeHtml(s.name)}</div>
          ${s.location ? `<div class="loc">${escapeHtml(s.location)}</div>` : ''}
        </div>
      </div>
    </div>`
    )
    .join('')

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Stickers (${stickers.length})</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
    padding: 8mm;
    background: white;
    color: #000;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6mm;
  }
  .sticker {
    border: 1.5px solid #000;
    border-radius: 6px;
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    background: white;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .barcode-row { width: 100%; display: flex; justify-content: center; }
  .barcode-row svg { display: block; max-width: 100%; height: auto; }
  .info-row {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .qr-box { flex-shrink: 0; }
  .qr-box svg { display: block; width: 56px; height: 56px; }
  .info-text { flex: 1; min-width: 0; }
  .code { font-size: 16px; font-weight: 700; letter-spacing: 0.05em; }
  .name { font-size: 10px; color: #333; word-break: break-word; line-height: 1.2; margin-top: 1px; }
  .loc { font-size: 9px; color: #666; margin-top: 1px; }
  @media print {
    body { padding: 6mm; }
    @page { size: A4; margin: 6mm; }
  }
</style>
</head>
<body>
  <div class="grid">${stickerHtml}</div>
  <script>
    window.addEventListener('load', () => {
      setTimeout(() => { window.focus(); window.print(); }, 80);
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
      setTimeout(() => iframe.remove(), 3000)
    }, 100)
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}
