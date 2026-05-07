import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  prefix: z.string().min(2).max(3).regex(/^[A-Z]{2,3}$/).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = updateSchema.parse(body)

    // Check if prefix is changing — propagate to all assets in this category
    if (data.prefix !== undefined) {
      const existing = await prisma.category.findUnique({
        where: { id },
        select: { prefix: true },
      })
      if (!existing) {
        return NextResponse.json({ error: 'ไม่พบประเภทอุปกรณ์' }, { status: 404 })
      }

      if (existing.prefix !== data.prefix) {
        // Ensure new prefix is not in use by another category
        const conflict = await prisma.category.findFirst({
          where: { prefix: data.prefix, NOT: { id } },
          select: { id: true, name: true },
        })
        if (conflict) {
          return NextResponse.json(
            { error: `Prefix "${data.prefix}" ถูกใช้อยู่แล้วโดย "${conflict.name}"` },
            { status: 400 }
          )
        }

        const oldPrefix = existing.prefix
        const newPrefix = data.prefix

        // Update category + all asset IDs in a single transaction
        const result = await prisma.$transaction(async (tx) => {
          // 1) Find all assets in this category
          const assetsToUpdate = await tx.asset.findMany({
            where: {
              categoryId: id,
              assetId: { startsWith: oldPrefix + '-' },
            },
            select: { id: true, assetId: true },
          })

          // 2) Update category prefix
          const updatedCategory = await tx.category.update({ where: { id }, data })

          // 3) Update each asset's assetId individually
          //    (must be sequential to avoid unique constraint conflicts)
          for (const asset of assetsToUpdate) {
            const newAssetId = newPrefix + asset.assetId.substring(oldPrefix.length)
            await tx.asset.update({
              where: { id: asset.id },
              data: { assetId: newAssetId },
            })
          }

          return { category: updatedCategory, assetsUpdated: assetsToUpdate.length }
        })

        return NextResponse.json(result.category)
      }
    }

    const category = await prisma.category.update({ where: { id }, data })
    return NextResponse.json(category)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'
    console.error('[categories PUT]', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const assetCount = await prisma.asset.count({
      where: { categoryId: id, isDeleted: false },
    })
    if (assetCount > 0) {
      return NextResponse.json(
        { error: `ไม่สามารถลบได้ มีอุปกรณ์ ${assetCount} รายการในประเภทนี้` },
        { status: 400 }
      )
    }
    await prisma.category.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
