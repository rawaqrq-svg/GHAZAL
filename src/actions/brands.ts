'use server';

import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/dal';
import { revalidatePath } from 'next/cache';

export async function getBrands() {
  return await prisma.brand.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { products: true }
      }
    }
  });
}

export async function createBrand(formData: FormData) {
  await requirePermission('manage:products');

  try {
    const name = formData.get('name') as string;
    const nameAr = (formData.get('nameAr') as string) || null;
    const description = (formData.get('description') as string) || null;
    const logoUrl = (formData.get('logoUrl') as string) || null;

    if (!name) {
      return { success: false, error: 'اسم الماركة بالإنجليزية أو اللاتينية مطلوب' };
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

    const brand = await prisma.brand.create({
      data: {
        name,
        nameAr,
        slug,
        description,
        logoUrl
      }
    });

    revalidatePath('/admin/brands');
    revalidatePath('/admin/products');
    return { success: true, brand };
  } catch (error: any) {
    console.error('Error creating brand:', error);
    return { success: false, error: error.message || 'فشل إنشاء الماركة' };
  }
}

export async function updateBrand(id: string, formData: FormData) {
  await requirePermission('manage:products');

  try {
    const name = formData.get('name') as string;
    const nameAr = (formData.get('nameAr') as string) || null;
    const description = (formData.get('description') as string) || null;
    const logoUrl = (formData.get('logoUrl') as string) || null;

    if (!name) {
      return { success: false, error: 'اسم الماركة مطلوب' };
    }

    await prisma.brand.update({
      where: { id },
      data: {
        name,
        nameAr,
        description,
        logoUrl
      }
    });

    revalidatePath('/admin/brands');
    revalidatePath('/admin/products');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating brand:', error);
    return { success: false, error: error.message || 'فشل تحديث الماركة' };
  }
}

export async function deleteBrand(id: string) {
  await requirePermission('manage:products');

  try {
    const productsCount = await prisma.product.count({ where: { brandId: id } });
    if (productsCount > 0) {
      return { success: false, error: `لا يمكن حذف الماركة لأنها مرتبطة بـ ${productsCount} منتج` };
    }

    await prisma.brand.delete({ where: { id } });
    revalidatePath('/admin/brands');
    revalidatePath('/admin/products');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting brand:', error);
    return { success: false, error: error.message || 'فشل حذف الماركة' };
  }
}
