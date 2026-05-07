# 🚀 IT Inventory System - Setup Guide

คู่มือนี้จะช่วยให้คุณ setup โปรเจกต์และเชื่อมต่อกับ Supabase Database พร้อมรันบน localhost

---

## 📋 สิ่งที่ต้องมีก่อนเริ่ม (Prerequisites)

1. **Node.js** v18+ ([ดาวน์โหลด](https://nodejs.org/))
2. **Git** ([ดาวน์โหลด](https://git-scm.com/))
3. **VS Code** + Extensions แนะนำ:
   - ES7+ React/Redux/React-Native snippets
   - Tailwind CSS IntelliSense
   - Prisma
   - Prettier
4. **บัญชี Supabase** (ฟรี) — [signup ที่นี่](https://supabase.com/)

---

## 🗂️ Step 1: สร้างโปรเจกต์ Next.js

เปิด Terminal/PowerShell ที่โฟลเดอร์ที่ต้องการ:

```bash
npx create-next-app@latest it-inventory
```

ตั้งค่าตามนี้:
```
✔ Would you like to use TypeScript? … Yes
✔ Would you like to use ESLint? … Yes
✔ Would you like to use Tailwind CSS? … Yes
✔ Would you like to use `src/` directory? … Yes
✔ Would you like to use App Router? … Yes
✔ Would you like to customize the default import alias? … No
```

เข้าโปรเจกต์:
```bash
cd it-inventory
```

---

## 📦 Step 2: ติดตั้ง Dependencies

```bash
# Database & ORM
npm install @prisma/client @supabase/supabase-js
npm install -D prisma

# UI Components
npx shadcn-ui@latest init
# ตอบ: Default style, Slate color, CSS variables: Yes

# ติดตั้ง shadcn components ที่ใช้บ่อย
npx shadcn-ui@latest add button input label table card dialog form select dropdown-menu badge tabs

# Charts
npm install recharts

# Form handling & validation
npm install react-hook-form @hookform/resolvers zod

# Utility
npm install date-fns lucide-react
npm install qrcode.react

# State management (optional)
npm install zustand
```

---

## 🗄️ Step 3: สร้าง Supabase Project

### 3.1 สร้าง Project บน Supabase
1. ไปที่ [supabase.com](https://supabase.com/) → Sign in
2. คลิก **New Project**
3. กรอกข้อมูล:
   - **Name**: `it-inventory`
   - **Database Password**: ตั้งรหัสแน่นๆ (เก็บไว้ดีๆ)
   - **Region**: `Southeast Asia (Singapore)` (ใกล้ไทยที่สุด)
4. กด **Create new project** รอประมาณ 2 นาที

### 3.2 เก็บ Connection Info
ไปที่ **Settings → Database** จะเห็น:

```
Host:     db.xxxxx.supabase.co
Database: postgres
Port:     5432
User:     postgres
Password: [ที่ตั้งไว้]
```

**Connection String** (สำคัญมาก) — มี 2 แบบ:
- **Direct Connection** (สำหรับ Migration): `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres`
- **Pooler Connection** (สำหรับ Production): `postgresql://postgres.xxxxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`

ไปที่ **Settings → API** เก็บ:
- **Project URL**: `https://xxxxx.supabase.co`
- **anon/public key**: `eyJhbGc...` (ใช้ใน frontend)
- **service_role key**: `eyJhbGc...` (เก็บลับสุดๆ ใช้ใน backend เท่านั้น)

---

## 🔐 Step 4: ตั้งค่า Environment Variables

สร้างไฟล์ `.env.local` ที่ root ของโปรเจกต์:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Database (สำหรับ Prisma)
DATABASE_URL="postgresql://postgres.xxxxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

⚠️ **สำคัญ**: เพิ่ม `.env.local` เข้า `.gitignore` (Next.js ทำให้แล้วโดย default)

---

## 🛠️ Step 5: Setup Prisma

### 5.1 Init Prisma
```bash
npx prisma init
```

### 5.2 แก้ไข `prisma/schema.prisma`
ใช้ schema จากไฟล์ `03-DATABASE-SCHEMA.md`

### 5.3 Generate Client + Push to DB
```bash
# Generate Prisma Client
npx prisma generate

# Push schema ไป Supabase
npx prisma db push

# (Optional) ดู Database GUI
npx prisma studio
```

---

## 🎨 Step 6: ตั้งค่า Supabase Client

สร้างไฟล์ `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

สร้างไฟล์ `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

## ▶️ Step 7: รัน Development Server

```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่ **http://localhost:3000**

---

## 📁 Step 8: โครงสร้างโฟลเดอร์ที่แนะนำ

```
it-inventory/
├── prisma/
│   └── schema.prisma
├── public/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Dashboard
│   │   │   ├── assets/
│   │   │   │   ├── page.tsx          # List
│   │   │   │   ├── new/page.tsx      # Add new
│   │   │   │   └── [id]/page.tsx     # Detail/Edit
│   │   │   ├── categories/
│   │   │   ├── locations/
│   │   │   └── users/
│   │   ├── api/
│   │   │   ├── assets/
│   │   │   ├── categories/
│   │   │   └── ...
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                        # shadcn components
│   │   ├── forms/
│   │   ├── tables/
│   │   └── charts/
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── supabase.ts
│   │   └── utils.ts
│   ├── hooks/
│   └── types/
├── .env.local
├── next.config.js
├── tailwind.config.ts
└── package.json
```

---

## 🔄 Step 9: ใช้ใน VS Code

1. เปิด VS Code: `code .`
2. เปิด Terminal ใน VS Code (Ctrl + `)
3. รัน `npm run dev` ทิ้งไว้
4. เริ่ม coding!

---

## 🎯 Step 10: ขั้นตอนถัดไป

หลังจาก setup เสร็จ:
1. ใช้ **Project Prompt** (ไฟล์ `02-PROJECT-PROMPT.md`) ส่งให้ Claude Code/Cursor
2. ให้ AI สร้างหน้าต่างๆ ตาม spec
3. ทดสอบบน localhost
4. เมื่อพอใจ → Deploy บน Vercel หรือ Server องค์กร

---

## 🐛 Troubleshooting

### ปัญหา: `prisma db push` error connection
- ตรวจสอบ `DIRECT_URL` ใน `.env.local`
- ตรวจสอบ Database password ถูกต้อง
- ลอง URL encode password ถ้ามีตัวอักษรพิเศษ

### ปัญหา: Supabase project paused
- เข้าไปที่ Dashboard → กด Resume project
- เกิดเมื่อไม่ใช้ 1 สัปดาห์ (Free tier)

### ปัญหา: Module not found
- รัน `npm install` อีกครั้ง
- ลบ `node_modules` + `package-lock.json` แล้วติดตั้งใหม่

---

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
