# 🗄️ Database Schema (Prisma)

ใส่ schema นี้ในไฟล์ `prisma/schema.prisma`

---

## 📄 prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ═══════════════════════════════════════════════════
// USER & ROLE
// ═══════════════════════════════════════════════════

enum Role {
  ADMIN
  EDITOR
  VIEWER
}

model User {
  id          String   @id @default(uuid())
  email       String   @unique
  name        String
  role        Role     @default(VIEWER)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  assignedAssets   Asset[]        @relation("AssignedTo")
  createdAssets    Asset[]        @relation("CreatedBy")
  updatedAssets    Asset[]        @relation("UpdatedBy")
  auditLogs        AuditLog[]
  maintenanceLogs  MaintenanceLog[]

  @@map("users")
}

// ═══════════════════════════════════════════════════
// CATEGORY (ประเภทอุปกรณ์)
// ═══════════════════════════════════════════════════

model Category {
  id               String   @id @default(uuid())
  prefix           String   @unique @db.VarChar(2)  // เช่น NW, SV, PC
  name             String   @unique                  // Network, Server, Desktop
  description      String?
  currentRunningNo Int      @default(0)              // running number ปัจจุบัน
  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // Relations
  assets Asset[]

  @@map("categories")
}

// ═══════════════════════════════════════════════════
// LOCATION (สถานที่/ห้อง)
// ═══════════════════════════════════════════════════

model Location {
  id          String   @id @default(uuid())
  code        String   @unique  // เช่น HQ-01, BR-01
  name        String              // ชื่อเต็ม
  address     String?
  building    String?
  floor       String?
  room        String?
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  assets Asset[]

  @@map("locations")
}

// ═══════════════════════════════════════════════════
// VENDOR (ผู้จำหน่าย)
// ═══════════════════════════════════════════════════

model Vendor {
  id          String   @id @default(uuid())
  name        String   @unique
  contactName String?
  phone       String?
  email       String?
  address     String?
  note        String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  assets Asset[]

  @@map("vendors")
}

// ═══════════════════════════════════════════════════
// ASSET (อุปกรณ์) - ตารางหลัก
// ═══════════════════════════════════════════════════

enum AssetStatus {
  IN_USE       // กำลังใช้งาน
  IN_STOCK     // อยู่ในสต็อก
  REPAIR       // ส่งซ่อม
  DISPOSED     // ปลดระวาง
  RESERVED     // จองไว้
  LOST         // สูญหาย
}

model Asset {
  id              String      @id @default(uuid())
  assetId         String      @unique  // NW001, SV002 (auto-generated)
  
  // Category
  categoryId      String
  category        Category    @relation(fields: [categoryId], references: [id])
  
  // Basic Info
  name            String                    // ชื่ออุปกรณ์
  brand           String?                   // ยี่ห้อ
  model           String?                   // รุ่น
  serialNumber    String?     @unique       // S/N
  specification   String?     @db.Text      // Spec ละเอียด
  
  // Purchase Info
  purchaseDate    DateTime?
  warrantyExpire  DateTime?
  price           Decimal?    @db.Decimal(12, 2)
  poNumber        String?                   // เลข PO
  
  // Vendor
  vendorId        String?
  vendor          Vendor?     @relation(fields: [vendorId], references: [id])
  
  // Location
  locationId      String?
  location        Location?   @relation(fields: [locationId], references: [id])
  locationDetail  String?                   // ละเอียดเพิ่ม เช่น Rack 5
  
  // Assignment
  assignedToId    String?
  assignedTo      User?       @relation("AssignedTo", fields: [assignedToId], references: [id])
  assignedDate    DateTime?
  
  // Status
  status          AssetStatus @default(IN_STOCK)
  
  // Other
  note            String?     @db.Text
  qrCode          String?                   // QR code data/url
  imageUrl        String?
  
  // Soft delete
  isDeleted       Boolean     @default(false)
  deletedAt       DateTime?
  
  // Audit
  createdById     String?
  createdBy       User?       @relation("CreatedBy", fields: [createdById], references: [id])
  createdAt       DateTime    @default(now())
  updatedById     String?
  updatedBy       User?       @relation("UpdatedBy", fields: [updatedById], references: [id])
  updatedAt       DateTime    @updatedAt

  // Relations
  attachments      Attachment[]
  maintenanceLogs  MaintenanceLog[]
  transferLogs     TransferLog[]

  @@index([categoryId])
  @@index([locationId])
  @@index([status])
  @@index([isDeleted])
  @@map("assets")
}

// ═══════════════════════════════════════════════════
// ATTACHMENT (ไฟล์แนบ - PO, Warranty, รูป)
// ═══════════════════════════════════════════════════

model Attachment {
  id        String   @id @default(uuid())
  assetId   String
  asset     Asset    @relation(fields: [assetId], references: [id], onDelete: Cascade)
  fileName  String
  fileUrl   String              // Supabase Storage URL
  fileType  String              // mime type
  fileSize  Int                 // bytes
  uploadedBy String?
  createdAt DateTime @default(now())

  @@index([assetId])
  @@map("attachments")
}

// ═══════════════════════════════════════════════════
// MAINTENANCE LOG (ประวัติการซ่อม/บำรุง)
// ═══════════════════════════════════════════════════

enum MaintenanceType {
  PREVENTIVE   // PM
  REPAIR       // ซ่อม
  UPGRADE      // อัพเกรด
  INSPECTION   // ตรวจสอบ
}

model MaintenanceLog {
  id              String          @id @default(uuid())
  assetId         String
  asset           Asset           @relation(fields: [assetId], references: [id])
  type            MaintenanceType
  description     String          @db.Text
  cost            Decimal?        @db.Decimal(12, 2)
  performedBy     String?
  performedDate   DateTime
  nextDueDate     DateTime?
  
  technicianId    String?
  technician      User?           @relation(fields: [technicianId], references: [id])
  
  createdAt       DateTime        @default(now())

  @@index([assetId])
  @@map("maintenance_logs")
}

// ═══════════════════════════════════════════════════
// TRANSFER LOG (ประวัติการโอนย้าย)
// ═══════════════════════════════════════════════════

model TransferLog {
  id           String   @id @default(uuid())
  assetId      String
  asset        Asset    @relation(fields: [assetId], references: [id])
  
  fromUser     String?
  toUser       String?
  fromLocation String?
  toLocation   String?
  reason       String?
  transferDate DateTime @default(now())
  performedBy  String?
  
  createdAt    DateTime @default(now())

  @@index([assetId])
  @@map("transfer_logs")
}

// ═══════════════════════════════════════════════════
// AUDIT LOG (ประวัติการเปลี่ยนแปลงข้อมูลทั้งหมด)
// ═══════════════════════════════════════════════════

model AuditLog {
  id         String   @id @default(uuid())
  userId     String?
  user       User?    @relation(fields: [userId], references: [id])
  action     String              // CREATE, UPDATE, DELETE
  entityType String              // Asset, Category, etc.
  entityId   String
  oldValue   Json?
  newValue   Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())

  @@index([entityType, entityId])
  @@index([userId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

---

## 🔧 หลังจาก Copy Schema แล้วให้รันคำสั่ง:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema ไปยัง Supabase
npx prisma db push

# (ถ้าต้องการ migration files)
npx prisma migrate dev --name init

# เปิด GUI ดู database
npx prisma studio
```

---

## 🌱 Seed Data (ข้อมูลเริ่มต้น)

สร้างไฟล์ `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Categories
  const categories = [
    { prefix: 'NW', name: 'Network', description: 'Switch, Router, Firewall' },
    { prefix: 'SV', name: 'Server', description: 'Physical/Virtual Server' },
    { prefix: 'PC', name: 'Desktop', description: 'Personal Computer' },
    { prefix: 'NB', name: 'Notebook', description: 'Laptop' },
    { prefix: 'PR', name: 'Printer', description: 'Printer/Scanner' },
    { prefix: 'MN', name: 'Monitor', description: 'Display Monitor' },
    { prefix: 'UP', name: 'UPS', description: 'Uninterruptible Power Supply' },
    { prefix: 'CM', name: 'Camera', description: 'CCTV/IP Camera' },
    { prefix: 'PH', name: 'IP Phone', description: 'IP Phone System' },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { prefix: cat.prefix },
      update: {},
      create: cat,
    })
  }

  // Locations
  const locations = [
    { code: 'HQ-01', name: 'Headquarters - Main Office', building: 'HQ' },
    { code: 'HQ-02', name: 'Headquarters - Server Room', building: 'HQ', room: 'Server Room' },
    { code: 'BR-01', name: 'Branch 1' },
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
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

เพิ่มใน `package.json`:
```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

ติดตั้ง tsx:
```bash
npm install -D tsx
```

รัน seed:
```bash
npx prisma db seed
```

---

## 🔑 Logic การ Generate Asset ID

ใช้ Prisma Transaction เพื่อป้องกัน race condition:

```typescript
// src/lib/asset-id-generator.ts
import { prisma } from './prisma'

export async function generateAssetId(categoryId: string): Promise<string> {
  return await prisma.$transaction(async (tx) => {
    // Lock the category row และเพิ่ม running number
    const category = await tx.category.update({
      where: { id: categoryId },
      data: {
        currentRunningNo: { increment: 1 },
      },
    })

    // Format: PREFIX + 3-digit number (NW001, NW002, ...)
    const paddedNumber = String(category.currentRunningNo).padStart(3, '0')
    return `${category.prefix}${paddedNumber}`
  })
}
```

ใช้งาน:
```typescript
// In API: POST /api/assets
const assetId = await generateAssetId(categoryId)

const asset = await prisma.asset.create({
  data: {
    assetId,
    categoryId,
    name,
    // ... other fields
  },
})
```
