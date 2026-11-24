'use server';

import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/dal';
import { revalidatePath } from 'next/cache';
import { uploadMedia } from '@/actions/upload';
import { COSMETICS_CATALOG } from '@/lib/cosmetics-catalog';

export interface SyncedCategory {
  id: string;
  name: string;
  slug: string;
  imagePath?: string;
  _count?: { products: number };
}

const DEFAULT_STORE_CATEGORIES: SyncedCategory[] = [
  { id: 'cat-makeup', name: 'المكياج ومستحضرات التجميل', slug: 'makeup', imagePath: '/logo.png' },
  { id: 'cat-skincare', name: 'العناية بالبشرة', slug: 'skincare', imagePath: '/logo.png' },
  { id: 'cat-haircare', name: 'العناية بالشعر', slug: 'haircare', imagePath: '/logo.png' },
  { id: 'cat-fragrances', name: 'العطور الفاخرة', slug: 'fragrances', imagePath: '/logo.png' },
  { id: 'cat-beauty-tools', name: 'أدوات التجميل والفرش', slug: 'beauty-tools', imagePath: '/logo.png' },
  { id: 'cat-accessories', name: 'الإكسسوارات والهدايا', slug: 'accessories', imagePath: '/logo.png' },
];

// In-memory runtime categories store (ensures offline and fallback resilience)
const inMemoryCategories: SyncedCategory[] = [...DEFAULT_STORE_CATEGORIES];

/**
 * Get synchronized categories across DB, SiteSettings, and In-Memory store
 */
export async function getSynchronizedCategories(): Promise<SyncedCategory[]> {
  let categories: SyncedCategory[] = [];

  // 1. Try fetching from database
  try {
    const dbCats = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: true } }
      }
    });
    if (dbCats && dbCats.length > 0) {
      categories = dbCats.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        imagePath: c.imagePath || '/logo.png',
        _count: c._count
      }));
    }
  } catch (err) {
    // DB offline fallback
  }

  // 2. Try fetching from siteSettings if DB was empty
  if (categories.length === 0) {
    try {
      const setting = await prisma.siteSettings.findUnique({
        where: { key: 'store_custom_categories' }
      });
      if (setting?.value) {
        const parsed = JSON.parse(setting.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          categories = parsed;
        }
      }
    } catch {}
  }

  // 3. Fallback to in-memory store
  if (categories.length === 0) {
    categories = [...inMemoryCategories];
  } else {
    // Merge any missing default categories
    for (const defCat of inMemoryCategories) {
      if (!categories.some(c => c.id === defCat.id || c.name === defCat.name)) {
        categories.push(defCat);
      }
    }
  }

  // 4. Attach live product counts from COSMETICS_CATALOG
  return categories.map(cat => {
    const catalogCount = COSMETICS_CATALOG.filter(p => p.categoryId === cat.id).length;
    const currentCount = cat._count?.products ?? 0;
    return {
      ...cat,
      _count: {
        products: Math.max(currentCount, catalogCount)
      }
    };
  });
}

async function persistCategoriesToSiteSettings(cats: SyncedCategory[]) {
  try {
    await prisma.siteSettings.upsert({
      where: { key: 'store_custom_categories' },
      update: { value: JSON.stringify(cats) },
      create: { key: 'store_custom_categories', value: JSON.stringify(cats) }
    });
  } catch {}
}

async function saveUploadedImage(imageFile: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', imageFile);
  const result = await uploadMedia(formData);
  if (!result.success || !result.url) {
    return '/logo.png';
  }
  return result.url;
}

export async function createCategory(formData: FormData) {
  await requirePermission('manage:products');

  try {
    const name = formData.get('name') as string;
    if (!name || !name.trim()) throw new Error('اسم المجموعة أو التصنيف مطلوب');

    const cleanName = name.trim();
    const slug = cleanName.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-') + '-' + Date.now();

    // Handle image
    let imagePath = '/logo.png';
    const imageFile = formData.get('image') as File;
    if (imageFile && imageFile.size > 0) {
      imagePath = await saveUploadedImage(imageFile);
    }

    let categoryId = `cat-${Date.now()}`;

    // 1. Try DB insertion
    try {
      const category = await prisma.category.create({
        data: {
          name: cleanName,
          slug,
          imagePath
        }
      });
      categoryId = category.id;

      const productIds = formData.getAll('productIds') as string[];
      if (productIds && productIds.length > 0) {
        await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { categoryId: category.id }
        });
      }
    } catch (e) {
      console.warn('Prisma createCategory offline fallback');
    }

    // 2. Synchronize in-memory and siteSettings
    const newCat: SyncedCategory = {
      id: categoryId,
      name: cleanName,
      slug,
      imagePath,
      _count: { products: 0 }
    };
    inMemoryCategories.push(newCat);
    await persistCategoriesToSiteSettings(inMemoryCategories);

    revalidatePath('/admin/categories');
    revalidatePath('/admin/products');
    revalidatePath('/admin/products/new');
    revalidatePath('/ar/shop');

    return { success: true, categoryId };
  } catch (error: any) {
    console.error('Error creating category:', error);
    return { success: false, error: error.message || 'حدث خطأ غير معروف' };
  }
}

export async function updateCategory(id: string, formData: FormData) {
  await requirePermission('manage:products');

  try {
    const name = formData.get('name') as string;
    if (!name || !name.trim()) throw new Error('اسم المجموعة أو التصنيف مطلوب');

    const cleanName = name.trim();
    const data: any = { name: cleanName };

    const imageFile = formData.get('image') as File;
    if (imageFile && imageFile.size > 0) {
      data.imagePath = await saveUploadedImage(imageFile);
    }

    // 1. Try DB update
    try {
      await prisma.category.update({
        where: { id },
        data
      });

      const productIds = formData.getAll('productIds') as string[];
      if (productIds && productIds.length > 0) {
        await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { categoryId: id }
        });
      }
    } catch (e) {
      console.warn('Prisma updateCategory offline fallback');
    }

    // 2. Synchronize in-memory and catalog
    const memIdx = inMemoryCategories.findIndex(c => c.id === id);
    if (memIdx >= 0) {
      inMemoryCategories[memIdx].name = cleanName;
      if (data.imagePath) inMemoryCategories[memIdx].imagePath = data.imagePath;
    }
    await persistCategoriesToSiteSettings(inMemoryCategories);

    // Sync COSMETICS_CATALOG
    for (const prod of COSMETICS_CATALOG) {
      if (prod.categoryId === id) {
        prod.categoryName = cleanName;
      }
    }

    revalidatePath('/admin/categories');
    revalidatePath('/admin/products');
    revalidatePath('/admin/products/new');
    revalidatePath('/ar/shop');

    return { success: true };
  } catch (error: any) {
    console.error('Error updating category:', error);
    return { success: false, error: error.message || 'حدث خطأ غير معروف' };
  }
}

export async function deleteCategory(id: string, deleteProducts: boolean, fallbackCategoryId?: string) {
  await requirePermission('manage:products');

  try {
    // 1. Try DB deletion
    try {
      if (deleteProducts) {
        await prisma.product.deleteMany({
          where: { categoryId: id }
        });
      } else {
        if (!fallbackCategoryId) {
          throw new Error('يجب اختيار مجموعة بديلة لنقل المنتجات إليها');
        }
        if (fallbackCategoryId === id) {
          throw new Error('لا يمكن نقل المنتجات إلى نفس المجموعة المحذوفة');
        }
        await prisma.product.updateMany({
          where: { categoryId: id },
          data: { categoryId: fallbackCategoryId }
        });
      }

      await prisma.category.delete({
        where: { id }
      });
    } catch (e) {
      console.warn('Prisma deleteCategory offline fallback');
    }

    // 2. Synchronize in-memory store
    const memIdx = inMemoryCategories.findIndex(c => c.id === id);
    if (memIdx >= 0) {
      inMemoryCategories.splice(memIdx, 1);
    }
    await persistCategoriesToSiteSettings(inMemoryCategories);

    // Sync COSMETICS_CATALOG
    const fallbackId = fallbackCategoryId || 'cat-makeup';
    for (const prod of COSMETICS_CATALOG) {
      if (prod.categoryId === id) {
        prod.categoryId = fallbackId;
        const fb = inMemoryCategories.find(c => c.id === fallbackId);
        if (fb) {
          prod.categoryName = fb.name;
          prod.categorySlug = fb.slug;
        }
      }
    }

    revalidatePath('/admin/categories');
    revalidatePath('/admin/products');
    revalidatePath('/admin/products/new');
    revalidatePath('/ar/shop');

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return { success: false, error: error.message || 'حدث خطأ أثناء الحذف' };
  }
}
