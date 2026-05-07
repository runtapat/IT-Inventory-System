interface WarrantyEmailPayload {
  to: string
  assetId: string
  assetName: string
  warrantyExpire: string
  daysLeft: number
}

export async function sendWarrantyAlert(payload: WarrantyEmailPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[Email] RESEND_API_KEY not set — skipping email send')
    return false
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)

    const urgency = payload.daysLeft <= 30 ? '🚨 เร่งด่วน' : payload.daysLeft <= 60 ? '⚠️ ใกล้หมด' : '📋 แจ้งเตือน'

    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'IT Inventory <noreply@yourdomain.com>',
      to: payload.to,
      subject: `${urgency} Warranty ${payload.assetId} หมดใน ${payload.daysLeft} วัน`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">IT Inventory — แจ้งเตือน Warranty</h2>
          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; font-size: 16px;"><strong>${payload.assetId}</strong> — ${payload.assetName}</p>
            <p style="margin: 8px 0 0; color: #92400e;">
              Warranty หมดอายุ: <strong>${payload.warrantyExpire}</strong><br/>
              เหลืออีก: <strong style="color: ${payload.daysLeft <= 30 ? '#dc2626' : '#d97706'}">${payload.daysLeft} วัน</strong>
            </p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">กรุณาต่อ Warranty หรือดำเนินการตามที่เหมาะสมก่อนหมดอายุ</p>
        </div>
      `,
    })
    return true
  } catch (err) {
    console.error('[Email] Send failed:', err)
    return false
  }
}
