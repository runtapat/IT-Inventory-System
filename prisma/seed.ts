import { config } from 'dotenv'
config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Categories — prefix 3 ตัวตาม format SRV-001, NET-001
  const categories = [
    { prefix: 'SRV', name: 'Server', description: 'Physical/Virtual Server' },
    { prefix: 'NET', name: 'Network', description: 'Switch, Router, Firewall' },
    { prefix: 'PC', name: 'Desktop', description: 'Personal Computer' },
    { prefix: 'NB', name: 'Notebook', description: 'Laptop' },
    { prefix: 'PRN', name: 'Printer', description: 'Printer/Scanner' },
    { prefix: 'MON', name: 'Monitor', description: 'Display Monitor' },
    { prefix: 'UPS', name: 'UPS', description: 'Uninterruptible Power Supply' },
    { prefix: 'CAM', name: 'Camera', description: 'CCTV/IP Camera' },
    { prefix: 'TEL', name: 'IP Phone', description: 'IP Phone System' },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { prefix: cat.prefix },
      update: {},
      create: cat,
    })
  }

  const locations = [
    { code: 'HQ-01', name: 'สำนักงานใหญ่ - ชั้นหลัก', building: 'HQ' },
    { code: 'HQ-02', name: 'สำนักงานใหญ่ - ห้อง Server', building: 'HQ', room: 'Server Room' },
    { code: 'BR-01', name: 'สาขา 1' },
  ]

  for (const loc of locations) {
    await prisma.location.upsert({
      where: { code: loc.code },
      update: {},
      create: loc,
    })
  }

  console.log('✅ Seed completed')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
