import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateAssetId } from '@/lib/asset-id-generator'
import { z } from 'zod'
import { AssetStatus, Lifecycle, Availability } from '@prisma/client'
import { logAudit, pickAssetFields } from '@/lib/audit'
import { getCurrentUserId } from '@/lib/auth'

const assetSchema = z.object({
  categoryId: z.string().min(1, 'กรุณาเลือกประเภทอุปกรณ์'),
  name: z.string().min(1, 'กรุณาระบุชื่ออุปกรณ์'),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().optional().transform(v => v ? new Date(v) : undefined),
  installDate: z.string().optional().transform(v => v ? new Date(v) : undefined),
  warrantyExpire: z.string().optional().transform(v => v ? new Date(v) : undefined),
  eolYear: z.number().optional(),
  price: z.number().optional(),
  poNumber: z.string().optional(),
  vendorId: z.string().optional(),
  locationId: z.string().optional(),
  locationDetail: z.string().optional(),
  assignedToId: z.string().optional(),
  assignedDate: z.string().optional().transform(v => v ? new Date(v) : undefined),
  status: z.nativeEnum(AssetStatus).default('ACTIVE'),
  lifecycle: z.nativeEnum(Lifecycle).default('IN_OPERATION'),
  availability: z.nativeEnum(Availability).default('AVAILABLE'),
  note: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('categoryId')
    const locationId = searchParams.get('locationId')
    const status = searchParams.get('status') as AssetStatus | null
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where = {
      isDeleted: false,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { assetId: { contains: search, mode: 'insensitive' as const } },
          { brand: { contains: search, mode: 'insensitive' as const } },
          { serialNumber: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(categoryId && { categoryId }),
      ...(locationId && { locationId }),
      ...(status && { status }),
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, prefix: true } },
          location: { select: { id: true, name: true, code: true } },
          vendor: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.asset.count({ where }),
    ])

    return NextResponse.json({ assets, total, page, totalPages: Math.ceil(total / limit) })
  } catch {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = assetSchema.parse(body)
    const assetId = await generateAssetId(data.categoryId)
    const asset = await prisma.asset.create({
      data: { ...data, assetId },
      include: {
        category: { select: { id: true, name: true, prefix: true } },
        location: { select: { id: true, name: true, code: true } },
      },
    })
    const userId = await getCurrentUserId()
    await logAudit({
      userId,
      action: 'CREATE',
      entityType: 'ASSET',
      entityId: asset.id,
      newValue: pickAssetFields(asset as unknown as Record<string, unknown>),
    })
    return NextResponse.json(asset, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
