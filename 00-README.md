# 📚 IT Inventory System — เอกสารชุดเริ่มต้น

ยินดีต้อนรับครับ! เอกสารชุดนี้มี 3 ไฟล์ที่ต้องใช้งานตามลำดับ

---

## 📂 ไฟล์ในชุดนี้

| ลำดับ | ไฟล์ | ใช้ทำอะไร |
|---|---|---|
| 1️⃣ | [01-SETUP-GUIDE.md](./01-SETUP-GUIDE.md) | คู่มือติดตั้ง Next.js + Supabase + Prisma + รัน localhost |
| 2️⃣ | [02-PROJECT-PROMPT.md](./02-PROJECT-PROMPT.md) | Prompt สำหรับวางใน Claude Code/Cursor ใน VS Code |
| 3️⃣ | [03-DATABASE-SCHEMA.md](./03-DATABASE-SCHEMA.md) | Prisma Schema + Seed Data + Logic Auto-gen ID |

---

## 🚀 ขั้นตอนการเริ่มงาน (Workflow)

```
┌─────────────────────────────────────────────────┐
│  STEP 1: อ่าน 01-SETUP-GUIDE.md                  │
│  - Setup Next.js project                        │
│  - สร้าง Supabase project                       │
│  - ตั้งค่า .env.local                           │
│  - ติดตั้ง dependencies                         │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  STEP 2: ใช้ 03-DATABASE-SCHEMA.md              │
│  - Copy schema → prisma/schema.prisma           │
│  - npx prisma db push                           │
│  - npx prisma db seed                           │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  STEP 3: เปิด VS Code + ใช้ 02-PROJECT-PROMPT  │
│  - Copy prompt ลงใน Claude Code/Cursor          │
│  - ให้ AI สร้างทีละ Phase                       │
│  - ทดสอบบน http://localhost:3000                │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  STEP 4: Iterate & Improve                      │
│  - ทดสอบ feature                                │
│  - แก้ bug                                       │
│  - เพิ่ม feature ตาม Phase ถัดไป                │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Goal ของ MVP (Minimum Viable Product)

หลังจาก setup เสร็จ คุณจะได้ระบบที่:
- ✅ รันบน `http://localhost:3000`
- ✅ เพิ่ม/แก้ไข/ลบประเภทอุปกรณ์ได้
- ✅ เพิ่มอุปกรณ์ใหม่พร้อม Auto-gen ID (NW001, NW002, ...)
- ✅ มีหน้า Dashboard สรุปข้อมูล
- ✅ Login/Logout ได้

---

## ⏱️ เวลาที่คาดว่าจะใช้

| งาน | เวลา |
|---|---|
| Setup environment + Supabase | 30-60 นาที |
| Database + Migration | 15-30 นาที |
| สร้าง MVP ด้วย AI | 4-8 ชม. |
| ทดสอบ + แก้บั๊ก | 2-4 ชม. |
| **รวม** | **~1-2 วัน** |

---

## 🆘 ถ้าติดปัญหา

1. **Setup ไม่ได้** → อ่าน Troubleshooting ใน `01-SETUP-GUIDE.md`
2. **AI สร้างโค้ดผิด** → ส่ง error message + path ไฟล์ให้ AI ช่วยแก้
3. **Database connection error** → ตรวจสอบ `.env.local` + Supabase project ยัง active

---

## 💬 คำสั่งที่ใช้บ่อย

```bash
# รัน dev server
npm run dev

# ดู database GUI
npx prisma studio

# Update schema
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed data
npx prisma db seed

# Build production
npm run build

# Start production
npm start
```

---

โชคดีครับ! 🎉
