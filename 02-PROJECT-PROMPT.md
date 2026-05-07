# 🎯 Project Prompt — IT Inventory Management System

> **วิธีใช้**: Copy เนื้อหาทั้งหมดด้านล่างนี้ไปวางใน Claude Code / Cursor / GitHub Copilot Chat ใน VS Code เพื่อให้ AI ช่วยสร้างระบบ

---

## 📋 Prompt สำหรับใช้กับ AI Assistant

```
คุณเป็น Senior Full-Stack Developer ที่จะช่วยสร้างระบบ IT Inventory Management 
ทำตาม Spec ด้านล่างนี้แบบครบถ้วน เน้นโค้ดที่สะอาด, type-safe, และ production-ready

═══════════════════════════════════════════════════════════════
🎯 PROJECT: IT Inventory Management System
═══════════════════════════════════════════════════════════════

OBJECTIVE:
สร้างระบบจัดการ IT Inventory สำหรับฝ่าย Service เพื่อเก็บข้อมูลอุปกรณ์ทั้งหมด
พร้อมระบบ Auto-generate Asset ID ตามประเภทอุปกรณ์

═══════════════════════════════════════════════════════════════
🛠️ TECH STACK
═══════════════════════════════════════════════════════════════

- Framework: Next.js 14 (App Router) + TypeScript
- Styling: Tailwind CSS + shadcn/ui
- Database: Supabase (PostgreSQL)
- ORM: Prisma
- Auth: Supabase Auth
- Forms: react-hook-form + zod
- Charts: Recharts
- Icons: lucide-react
- QR Code: qrcode.react

═══════════════════════════════════════════════════════════════
📊 CORE FEATURES
═══════════════════════════════════════════════════════════════

[1] CATEGORY MANAGEMENT (จัดการประเภทอุปกรณ์)
   - URL: /categories
   - CRUD ประเภทอุปกรณ์
   - Fields: prefix (2 ตัวอักษร), name, description, current_running_no
   - Validation: prefix ต้อง unique, ตัวพิมพ์ใหญ่ A-Z 2 ตัว
   - แสดง running number ปัจจุบันของแต่ละประเภท
   - ป้องกันการลบประเภทที่ยังมีอุปกรณ์อยู่
   - ตัวอย่างประเภท: NW=Network, SV=Server, PC=Desktop, NB=Notebook, 
     PR=Printer, MN=Monitor, UP=UPS, CM=Camera, PH=IP Phone

[2] ASSET MANAGEMENT (จัดการอุปกรณ์)
   - URL: /assets
   - หน้า list มี: Search, Filter (category/status/location), Sort, Pagination
   - Auto-generate Asset ID ตาม category prefix + running number 3 หลัก
     เช่น NW001, NW002, SV001
   - ใช้ Database Transaction ป้องกัน race condition ตอน gen ID
   - Form fields:
     * Category (Dropdown - required)
     * Asset Name (required)
     * Brand, Model
     * Serial Number (unique)
     * Specification (textarea)
     * Purchase Date, Warranty Expire Date
     * Price (number)
     * Vendor (dropdown หรือ text)
     * Location (dropdown)
     * Assigned To (dropdown user หรือ text)
     * Status: In Use / In Stock / Repair / Disposed / Reserved
     * Note (textarea)
     * Attachments (upload to Supabase Storage)
   - Soft delete (is_deleted flag)
   - Export ไป Excel/CSV
   - แสดง QR Code ของแต่ละ asset (สำหรับพิมพ์ติดอุปกรณ์)

[3] LOCATION MANAGEMENT
   - URL: /locations
   - CRUD location (สาขา/ห้อง/Rack)

[4] DASHBOARD (หน้าแรก)
   - URL: /
   - Summary Cards:
     * จำนวนอุปกรณ์ทั้งหมด
     * In Use / In Stock / Repair / Disposed
     * มูลค่ารวม
   - Charts:
     * Pie Chart: สัดส่วนตามประเภท
     * Bar Chart: จำนวนตาม Location
     * Line Chart: แนวโน้มการเพิ่มอุปกรณ์รายเดือน (12 เดือนล่าสุด)
   - Alerts:
     * อุปกรณ์ Warranty ใกล้หมด (30/60/90 วัน)
     * อุปกรณ์ที่อยู่ Repair นานเกิน 30 วัน
   - Recent Activities (10 รายการล่าสุด)

[5] USER & ROLE MANAGEMENT
   - URL: /users (Admin only)
   - Roles: Admin, Editor, Viewer
   - ใช้ Supabase Auth + RLS

═══════════════════════════════════════════════════════════════
🎨 UI/UX REQUIREMENTS
═══════════════════════════════════════════════════════════════

- Layout: Sidebar (left) + Main content
- Sidebar Menu: Dashboard, Assets, Categories, Locations, Users, Reports
- Theme: Light + Dark mode toggle
- Responsive: ใช้ได้บน Desktop, Tablet, Mobile
- ภาษา: ภาษาไทย (UI) แต่ code/comment เป็นอังกฤษ
- Toast notification: ใช้ sonner หรือ shadcn toast
- Loading states: Skeleton loaders
- Empty states: รูปประกอบ + ข้อความแนะนำ
- Confirmation dialog: ก่อน delete หรือ action สำคัญ

═══════════════════════════════════════════════════════════════
📐 ARCHITECTURE & CODE QUALITY
═══════════════════════════════════════════════════════════════

- ใช้ Server Components ที่เป็นไปได้
- Client Components ใช้เฉพาะที่มี interactivity
- API Routes: /app/api/[resource]/route.ts
- Validation: Zod schema ทั้ง client และ server
- Error Handling: try-catch + proper HTTP status
- Type Safety: TypeScript strict mode
- Component structure: ไฟล์ละ 1 component, แยก logic ออก hook

═══════════════════════════════════════════════════════════════
🗄️ DATABASE SCHEMA (Prisma)
═══════════════════════════════════════════════════════════════

ดูไฟล์ 03-DATABASE-SCHEMA.md (ใช้ schema นี้ใน prisma/schema.prisma)

═══════════════════════════════════════════════════════════════
📝 IMPLEMENTATION ORDER
═══════════════════════════════════════════════════════════════

ทำตามลำดับนี้ทีละขั้น เพื่อให้สร้างได้สมบูรณ์:

PHASE 1 — Foundation
  1. Setup Prisma schema และ migrate
  2. สร้าง src/lib/prisma.ts, src/lib/supabase.ts, src/lib/utils.ts
  3. สร้าง types ใน src/types/
  4. สร้าง Layout หลัก (Sidebar + Header)
  5. ทำหน้า Login (Supabase Auth)

PHASE 2 — Categories
  6. API: GET/POST/PUT/DELETE /api/categories
  7. UI: หน้า /categories — list + form (modal)
  8. Validation prefix unique, 2 chars A-Z

PHASE 3 — Locations
  9. API + UI หน้า /locations

PHASE 4 — Assets (ส่วนหลัก)
 10. API: GET/POST/PUT/DELETE /api/assets
 11. Logic Auto-generate Asset ID (ใช้ Prisma Transaction)
 12. UI: หน้า /assets — list table + filters + pagination
 13. UI: form เพิ่ม/แก้ไข asset (dropdown category)
 14. UI: หน้า detail asset + QR code
 15. File upload to Supabase Storage
 16. Export Excel/CSV

PHASE 5 — Dashboard
 17. API: /api/dashboard/stats
 18. UI: Cards + Charts ทั้งหมด
 19. Alerts สำหรับ warranty ใกล้หมด

PHASE 6 — Users & Permissions
 20. Supabase Auth integration
 21. Middleware ป้องกัน route
 22. หน้า /users (Admin only)
 23. RLS policies

PHASE 7 — Polish
 24. Dark mode
 25. Loading/Empty states
 26. Toast notifications
 27. Audit log (ถ้ามีเวลา)

═══════════════════════════════════════════════════════════════
✅ ACCEPTANCE CRITERIA
═══════════════════════════════════════════════════════════════

ระบบต้องทำได้:
- [ ] เพิ่มประเภทอุปกรณ์พร้อม prefix 2 ตัวได้
- [ ] เพิ่มอุปกรณ์ใหม่ → Asset ID ถูก gen อัตโนมัติตาม prefix
- [ ] เพิ่ม 2 อุปกรณ์ category เดียวกัน → ID ไม่ซ้ำ (NW001, NW002)
- [ ] แก้ไข/ลบ (soft delete) อุปกรณ์ได้
- [ ] ค้นหา + filter ได้
- [ ] Dashboard แสดงข้อมูลถูกต้อง realtime
- [ ] Export Excel ได้
- [ ] Login/Logout ได้
- [ ] Admin/Editor/Viewer สิทธิ์ต่างกัน
- [ ] ทุกหน้าใช้บนมือถือได้

═══════════════════════════════════════════════════════════════
🚀 GETTING STARTED
═══════════════════════════════════════════════════════════════

ผมได้ setup Next.js + Tailwind + shadcn เรียบร้อยแล้ว และมี .env.local เชื่อม
Supabase ไว้แล้ว ขอให้คุณเริ่มจาก Phase 1 ก่อน:

1. สร้าง prisma/schema.prisma ตาม schema ที่ให้
2. สร้าง src/lib/prisma.ts และ src/lib/supabase.ts
3. ออกแบบ Sidebar Layout

แสดงให้ดูแบบไฟล์ต่อไฟล์ พร้อมอธิบายแต่ละส่วน
ถ้ามีคำถามหรือต้องการรายละเอียดเพิ่ม ถามได้ครับ
```

---

## 💡 Tips การใช้ Prompt นี้

### กับ Claude Code (CLI)
```bash
cd it-inventory
claude
# วาง prompt ลงไป
```

### กับ Cursor
1. เปิด Cursor → กด `Ctrl+L` เปิด Chat
2. วาง prompt ลงไป
3. เลือก model: Claude 3.5 Sonnet หรือ GPT-4

### กับ GitHub Copilot Chat
1. เปิด VS Code → Ctrl+Alt+I
2. วาง prompt
3. ใช้ `@workspace` เพื่อให้เห็น context ทั้ง project

### Best Practices
- **อย่าทำทั้งหมดพร้อมกัน** — ทำทีละ Phase
- ทุก Phase เสร็จ → ทดสอบ → commit git
- ถ้าเจอ bug → ส่ง error log ให้ AI ช่วยแก้
- ขอให้ AI เขียน comment เป็นภาษาไทยถ้าต้องการ
- ขอให้สร้าง test cases ในส่วนสำคัญ

---

## 🔁 Prompt เพิ่มเติม (ใช้ทีหลัง)

### เมื่ออยากเพิ่ม Feature
```
ขอเพิ่มฟีเจอร์ [ชื่อฟีเจอร์] ในระบบ IT Inventory ที่ทำไว้
- รายละเอียด: ...
- ต้องเชื่อมกับ: ...
- UI ควรเป็น: ...
ทำตาม code style เดิมและ tech stack เดิม
```

### เมื่อ Debug
```
ผมเจอ error นี้: [paste error]
ที่ไฟล์ [path]:[line]
ตอนทำ action: [อธิบาย]
ช่วยวิเคราะห์ root cause และเสนอวิธีแก้ที่ถูกต้อง
อย่า suppress error อย่าใช้ try-catch ปิดบัง
```

### เมื่ออยาก Refactor
```
ดูไฟล์ [path] ตรงนี้ดูซ้ำซ้อน/ยาวเกินไป
ช่วย refactor โดยรักษา behavior เดิม 100%
แยก logic ออกเป็น hooks/utilities ตามเหมาะสม
```
