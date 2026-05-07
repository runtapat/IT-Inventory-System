# สถานะการทำงาน IT Inventory System

อัปเดตล่าสุด: 2026-05-07

---

## ✅ ทำเสร็จแล้ว

### 🏗 Setup & Infrastructure
- [x] Next.js 16.2.4 (App Router) + TypeScript + Tailwind v4
- [x] Prisma v7.8.0 + `@prisma/adapter-pg` + `prisma.config.ts` (ไม่มี url ใน schema.prisma)
- [x] Supabase Auth ด้วย `@supabase/ssr` (cookie-based session — ทำงานร่วมกับ middleware/proxy)
- [x] `prisma/schema.prisma` — User, Category, Location, Vendor, Asset, Attachment, MaintenanceLog, TransferLog, AuditLog
- [x] Enum: `AssetStatus` (ACTIVE/MAINTENANCE/RETIRED), `Lifecycle` (IN_OPERATION/UNDER_MAINTENANCE/DECOMMISSIONED), `Availability` (AVAILABLE/DEGRADED/NA), `Role`, `MaintenanceType`
- [x] `prisma/seed.ts` — Categories (NW, SV, PC, NB, PR, MN, UP, CM, PH) + Locations (OFF-01, SRV-RM, STG-01)
- [x] `next-themes` ThemeProvider — Dark mode

### 🔐 Authentication
- [x] `/login` — Supabase email/password
- [x] `proxy.ts` (Next.js 16) — Route guard, redirect ถ้ายังไม่ login
- [x] `src/lib/supabase.ts` (browser, cookie-based) แยกจาก `src/lib/supabase-admin.ts` (server-only)
- [x] `src/lib/auth.ts` — `getCurrentUserId()` ผ่าน cookie สำหรับ API routes

### 🛠 Lib & Utilities
- [x] `src/lib/prisma.ts` — Prisma singleton
- [x] `src/lib/asset-id-generator.ts` — Auto-gen Asset ID ด้วย Transaction (SRV-001, NET-002, ...)
- [x] `src/lib/audit.ts` — `logAudit()`, `diffObjects()`, `pickAssetFields()`
- [x] `src/lib/print-barcode.ts` — Print sticker ผ่าน iframe + srcdoc (รองรับ barcode + QR คู่กัน)
- [x] `src/lib/utils.ts` — cn() utility

### 🔌 API Routes
- [x] `GET/POST /api/categories` + `PUT/DELETE /api/categories/[id]`
- [x] `GET/POST /api/locations` + `PUT/DELETE /api/locations/[id]`
- [x] `GET/POST /api/assets` (search/filter/pagination + auto-gen ID + audit log)
- [x] `GET/PUT/DELETE /api/assets/[id]` (detail + diff-based audit log + soft delete)
- [x] `GET /api/assets/by-code/[code]` — Lookup ด้วย Asset Code (สำหรับ scanner)
- [x] `GET /api/vendors` + `POST /api/vendors`
- [x] `GET/POST /api/users` — User management
- [x] `GET /api/audit-logs` — Audit log history (filter ด้วย entityId/entityType)
- [x] `GET /api/dashboard` — Stats (status/lifecycle/availability), category/location stats, warranty alerts, monthly trend
- [x] `POST /api/notifications/warranty` — ส่ง email warranty ผ่าน Resend

### 🎨 UI Pages

#### Dashboard
- [x] 6 Stats Cards: Total / Active / Maintenance / Retired / Available / มูลค่ารวม (ปรับให้ตรงกับ enum ปัจจุบัน)
- [x] Pie Chart — สัดส่วนตามประเภท
- [x] Bar Chart — จำนวนตามสถานที่
- [x] Line Chart — แนวโน้มการเพิ่มอุปกรณ์ 12 เดือนล่าสุด
- [x] Warranty Alerts — แจ้ง warranty ใกล้หมดใน 90 วัน
- [x] Recent Activity — อุปกรณ์ที่เพิ่มล่าสุด

#### Assets
- [x] `/assets` — รายการ + ค้นหา + filter (category/location/status) + pagination + Export Excel
- [x] **Mobile card view** — แสดงเป็นการ์ดบนมือถือ (md:hidden) แทนตารางที่ตกแถว
- [x] Filter dropdown แสดง label ภาษาไทยถูกต้อง (แก้ปัญหา base-ui ที่โชว์ "all")
- [x] `/assets/new` — Add asset ด้วย AssetForm
- [x] `/assets/[id]` — Detail page พร้อม 4 Tabs:
  - ข้อมูลทั่วไป — แสดงข้อมูลครบทุก field
  - ประวัติซ่อม — Maintenance logs
  - ประวัติการแก้ไข — Audit log timeline (สีตาม CREATE/UPDATE/DELETE)
  - Barcode — แสดง Code 128 + QR Code คู่กัน + ปุ่มพิมพ์ Sticker
- [x] `/assets/[id]/edit` — Edit asset

#### อื่นๆ
- [x] `/categories` — CRUD modal + กัน delete ถ้ายังมี asset อยู่
- [x] `/locations` — CRUD modal
- [x] `/users` — User management (role + active toggle + เพิ่ม user)
- [x] `/scan` — Barcode/QR Scanner ด้วย `@yudiel/react-qr-scanner`
  - รองรับ Code 128 + QR Code
  - Auto-redirect ไปหน้า asset เมื่อสแกนสำเร็จ
  - Manual input fallback (พิมพ์รหัสมือ ถ้ากล้องใช้ไม่ได้)
  - ตรวจ BarcodeDetector support + warning ถ้าเบราว์เซอร์ไม่รองรับ

### 🧩 Components
- [x] `Sidebar` — Navigation, mobile overlay, collapsible desktop, auto-close on navigate
- [x] `Header` — Title + dark mode toggle
- [x] `LayoutContext` — Mobile sidebar state via React Context
- [x] `AssetForm` — Create/Edit form (รองรับ status/lifecycle/availability/installDate/eolYear)
- [x] `AssetBarcode` — Code 128 wrapper จาก `react-barcode`
- [x] `QRPrintModal` — Modal พิมพ์ Sticker (Barcode + QR + ข้อมูลอุปกรณ์)
- [x] `DashboardStats` / `DashboardCharts` / `WarrantyAlerts` / `RecentActivity`

### 📱 Mobile Responsive
- [x] Sidebar: Fixed overlay บนมือถือ + hamburger menu
- [x] Backdrop overlay ปิด sidebar เมื่อแตะนอก
- [x] Auto-close sidebar เมื่อเปลี่ยนหน้า
- [x] Asset list: Card view บนมือถือ, table บน `md+`
- [x] Dashboard stats: 2 cols (mobile) → 3 cols (md) → 6 cols (lg)
- [x] Filter dropdown: เต็มความกว้าง ไม่ตกแถว
- [x] Padding: `p-4 sm:p-6` ใช้พื้นที่จอเล็กให้คุ้ม

### 📊 Audit Log System
- [x] Schema: `AuditLog` table — userId, action, entityType, entityId, oldValue, newValue, ipAddress, userAgent
- [x] `logAudit()` ทุก CREATE/UPDATE/DELETE ของ Asset
- [x] `diffObjects()` คำนวณ diff เฉพาะ field ที่เปลี่ยน
- [x] Timeline UI — สี dot ตาม action (เขียว/น้ำเงิน/แดง), ก่อน-หลัง, relative time (Thai locale)

### 🖨 Barcode/QR Print System
- [x] Code 128 Barcode (react-barcode) — primary scan target
- [x] QR Code (qrcode.react) — encode URL `/assets/{uuid}` สำหรับสแกนแล้วเปิดหน้าเว็บ
- [x] Sticker layout: barcode บนสุด → row ล่าง = QR + asset code + name + location
- [x] Print ผ่าน iframe + srcdoc (แก้ปัญหา blank PDF จาก Radix portal + CSS @media print)
- [x] เข้าถึงได้จาก: หน้ารายการ (modal), หน้ารายละเอียด (Barcode tab)

### 🔍 Scanner
- [x] `@yudiel/react-qr-scanner` v2.5.1 + BarcodeDetector API
- [x] รองรับ formats: `qr_code`, `code_128`, `code_39`, `ean_13`
- [x] Camera permission error handling (permission/notfound/general)
- [x] Manual input fallback ใส่รหัสเช่น "SRV-001"
- [x] Parse 2 รูปแบบ: URL (`/assets/{uuid}`) และ Asset code (`SRV-001`)

### ✉️ Email Notifications
- [x] Resend integration (`POST /api/notifications/warranty`)
- [x] ส่ง email ให้ admin users เมื่อ warranty ใกล้หมด

### 📥 Export
- [x] Export รายการอุปกรณ์เป็น Excel (`xlsx` library)

### 🆕 Power Features
- [x] **Activity Feed** (`/activity`) — Timeline กลาง ดูทุกการเปลี่ยนแปลง พร้อม filter ตามประเภทการกระทำ + group ตามวัน + คลิกชื่ออุปกรณ์ไปดูรายละเอียดได้
- [x] **EOL Alerts widget** บน Dashboard — เตือนอุปกรณ์ที่ใกล้หรือเลย End-of-Life แล้ว (สีแดงถ้าเลย/ปีนี้, เทาถ้าใกล้)
- [x] **Bulk Multi-select & Multi-print** — เลือกหลายชิ้นพร้อมกัน → พิมพ์ sticker เป็นกริด 2 คอลัมน์บน A4 หรือ ลบหลายชิ้นพร้อมกัน
- [x] **Global cursor lock** — ป้องกัน text cursor (I-beam) เด้งขึ้นทั่ว UI ยกเว้นในช่อง input

---

## ⏳ ยังไม่ได้ทำ

- [ ] Supabase Storage — upload file attachments
- [ ] Cron job สำหรับส่ง warranty email อัตโนมัติ (ตอนนี้ต้องเรียก endpoint เอง)
- [ ] User invite ผ่าน email link
- [ ] Bulk actions (ลบ/แก้สถานะหลายชิ้นพร้อมกัน)
- [ ] Asset transfer flow + log
- [ ] Print หลาย sticker พร้อมกัน

---

## 📦 Dependencies หลัก

```
next 16.2.4
react 19.2.4
@prisma/client 7.8.0 + adapter-pg
@supabase/ssr 0.10.2
@base-ui/react 1.4.1 (shadcn/ui v4)
@yudiel/react-qr-scanner 2.5.1
react-barcode 1.6.1
qrcode.react 4.2.0
recharts 3.8.1
react-hook-form + zod
date-fns 4.1.0
xlsx 0.18.5
resend 6.12.3
next-themes 0.4.6
sonner 2.0.7
```

---

## 🔧 คำสั่งสำคัญ

```bash
npm run dev               # รัน dev server
npm run build             # Build production
npx prisma db push        # Push schema ไป Supabase
npx prisma db seed        # Seed ข้อมูลเริ่มต้น
npx prisma studio         # ดู database GUI
```
