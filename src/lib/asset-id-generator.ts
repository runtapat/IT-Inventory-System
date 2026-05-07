import { prisma } from './prisma'

export async function generateAssetId(categoryId: string): Promise<string> {
  return await prisma.$transaction(async (tx) => {
    const category = await tx.category.update({
      where: { id: categoryId },
      data: { currentRunningNo: { increment: 1 } },
    })
    const paddedNumber = String(category.currentRunningNo).padStart(3, '0')
    // Format: PREFIX-001 (เช่น SRV-001, NET-001)
    return `${category.prefix}-${paddedNumber}`
  })
}
