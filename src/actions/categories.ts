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
  sortOrder?: number;
  parentId?: string | null;
  parentName?: string | null;
  children?: SyncedCategory[];
  _count?: { products: number };
}

const DEFAULT_STORE_CATEGORIES: SyncedCategory[] = [
  { id: 'cat-makeup', name: 'المكياج ومستحضرات التجميل', slug: 'makeup', imagePath: '/logo.png', sortOrder: 1 },
  { id: 'cat-skincare', name: 'العناية بالبشرة', slug: 'skincare', imagePath: '/logo.png', sortOrder: 2 },
  { id: 'cat-face-care', name: 'العناية بالوجه', slug: 'face-care', imagePath: '/logo.png', sortOrder: 3 },
  { id: 'cat-deodorants', name: 'مزيلات عرق', slug: 'deodorants', imagePath: '/logo.png', sortOrder: 4 },
  { id: 'cat-haircare', name: 'العناية بالشعر', slug: 'haircare', imagePath: '/logo.png', sortOrder: 5 },
  { id: 'cat-fragrances', name: 'العطور الفاخرة', slug: 'fragrances', imagePath: '/logo.png', sortOrder: 6 },
  { id: 'cat-beauty-tools', name: 'أدوات التجميل والفرش', slug: 'beauty-tools', imagePath: '/logo.png', sortOrder: 7 },
  { id: 'cat-accessories', name: 'الإكسسوارات والهدايا', slug: 'accessories', imagePath: '/logo.png', sortOrder: 8 },
];

// In-memory runtime categories store (ensures offline and fallback resilience)
let inMemoryCategories: SyncedCategory[] = [...DEFAULT_STORE_CATEGORIES];

/**
 * Get synchronized categories across DB, SiteSettings, and In-Memory store
 */
export async function getSynchronizedCategories(): Promise<SyncedCategory[]> {
  let categories: SyncedCategory[] = [];

  // 1. Try fetching from database
  try {
    let dbCats = await prisma.category.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ],
      include: {
        parent: { select: { id: true, name: true } },
        children: {
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          include: { _count: { select: { products: true } } }
        },
        _count: { select: { products: true } }
      }
    });

    // Auto-seed required categories if missing: "العناية بالوجه" and "مزيلات عرق"
    const requiredCats = [
      { name: 'العناية بالوجه', slug: 'face-care', sortOrder: 3 },
      { name: 'مزيلات عرق', slug: 'deodorants', sortOrder: 4 }
    ];

    for (const req of requiredCats) {
      if (!dbCats.some(c => c.slug === req.slug || c.name === req.name)) {
        try {
          const created = await prisma.category.create({
            data: {
              name: req.name,
              slug: req.slug,
              imagePath: '/logo.png',
              sortOrder: req.sortOrder
            },
            include: {
              parent: { select: { id: true, name: true } },
              children: { include: { _count: { select: { products: true } } } },
              _count: { select: { products: true } }
            }
          });
          dbCats.push(created as any);
        } catch {}
      }
    }

    if (dbCats && dbCats.length > 0) {
      categories = dbCats.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        imagePath: c.imagePath || '/logo.png',
        sortOrder: c.sortOrder ?? 0,
        parentId: c.parentId,
        parentName: c.parent?.name || null,
        children: (c.children || []).map(ch => ({
          id: ch.id,
          name: ch.name,
          slug: ch.slug,
          imagePath: ch.imagePath || '/logo.png',
          sortOrder: ch.sortOrder ?? 0,
          parentId: ch.parentId,
          _count: ch._count
        })),
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

/**
 * Reorder categories (Drag & Drop)
 */
export async function reorderCategoriesAction(orderedIds: string[], parentId?: string | null) {
  await requirePermission('manage:products');

  try {
    for (let index = 0; index < orderedIds.length; index++) {
      const id = orderedIds[index];
      const sortOrder = index + 1;
      try {
        await prisma.category.update({
          where: { id },
          data: {
            sortOrder,
            ...(parentId !== undefined ? { parentId: parentId || null } : {})
          }
        });
      } catch {}

      const memCat = inMemoryCategories.find(c => c.id === id);
      if (memCat) {
        memCat.sortOrder = sortOrder;
        if (parentId !== undefined) {
          memCat.parentId = parentId || null;
        }
      }
    }

    // Refresh in-memory list sorting
    inMemoryCategories.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    await persistCategoriesToSiteSettings(inMemoryCategories);

    revalidatePath('/admin/categories');
    revalidatePath('/admin/products');
    revalidatePath('/ar/shop');
    revalidatePath('/pos/cashier');

    return { success: true };
  } catch (error: any) {
    console.error('Error reordering categories:', error);
    return { success: false, error: error?.message || 'حدث خطأ أثناء حفظ ترتيب الأقسام' };
  }
}

/**
 * Create a new category or subcategory (strictly 1 level deep)
 */
export async function createCategory(formData: FormData) {
  await requirePermission('manage:products');

  try {
    const name = formData.get('name') as string;
    if (!name || !name.trim()) throw new Error('اسم المجموعة أو التصنيف مطلوب');

    const cleanName = name.trim();
    const slug = cleanName.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-') + '-' + Date.now();

    // Check parentId (1-level deep hierarchy enforcement)
    const rawParentId = formData.get('parentId') as string;
    let parentId: string | null = null;
    let parentName: string | null = null;

    if (rawParentId && rawParentId.trim() && rawParentId !== 'root') {
      parentId = rawParentId.trim();

      // Enforce: Parent cannot be a subcategory itself! (Maximum 1 level of nesting)
      const parentCat = await prisma.category.findUnique({
        where: { id: parentId },
        select: { id: true, parentId: true, name: true }
      });

      if (parentCat) {
        if (parentCat.parentId) {
          throw new Error('لا يمكن إضافة قسم داخل قسم فرعي! الحد الأقصى للتفريغ هو مستوى واحد فقط (أقسام رئيسية وبداخلها أقسام فرعية مباشرة).');
        }
        parentName = parentCat.name;
      }
    }

    // Handle image
    let imagePath = '/logo.png';
    const imageFile = formData.get('image') as File;
    if (imageFile && imageFile.size > 0) {
      imagePath = await saveUploadedImage(imageFile);
    }

    let categoryId = `cat-${Date.now()}`;
    const nextSortOrder = inMemoryCategories.length + 1;

    // 1. Try DB insertion
    try {
      const category = await prisma.category.create({
        data: {
          name: cleanName,
          slug,
          imagePath,
          parentId,
          sortOrder: nextSortOrder
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
    } catch (e: any) {
      if (e?.message?.includes('الحد الأقصى')) throw e;
      console.warn('Prisma createCategory offline fallback');
    }

    // 2. Synchronize in-memory and siteSettings
    const newCat: SyncedCategory = {
      id: categoryId,
      name: cleanName,
      slug,
      imagePath,
      parentId,
      parentName,
      sortOrder: nextSortOrder,
      _count: { products: 0 }
    };
    inMemoryCategories.push(newCat);
    await persistCategoriesToSiteSettings(inMemoryCategories);

    revalidatePath('/admin/categories');
    revalidatePath('/admin/products');
    revalidatePath('/admin/products/new');
    revalidatePath('/ar/shop');
    revalidatePath('/pos/cashier');

    return { success: true, categoryId };
  } catch (error: any) {
    console.error('Error creating category:', error);
    return { success: false, error: error.message || 'حدث خطأ غير معروف' };
  }
}

/**
 * Update an existing category
 */
export async function updateCategory(id: string, formData: FormData) {
  await requirePermission('manage:products');

  try {
    const name = formData.get('name') as string;
    if (!name || !name.trim()) throw new Error('اسم المجموعة أو التصنيف مطلوب');

    const cleanName = name.trim();
    const data: any = { name: cleanName };

    // Parent ID update
    const rawParentId = formData.get('parentId') as string;
    let parentId: string | null = null;
    let parentName: string | null = null;

    if (rawParentId && rawParentId.trim() && rawParentId !== 'root') {
      parentId = rawParentId.trim();
      if (parentId === id) {
        throw new Error('لا يمكن تعيين القسم ليكون قسماً فرعياً لنفسه');
      }

      const parentCat = await prisma.category.findUnique({
        where: { id: parentId },
        select: { id: true, parentId: true, name: true }
      });

      if (parentCat) {
        if (parentCat.parentId) {
          throw new Error('لا يمكن إضافة قسم داخل قسم فرعي! الحد الأقصى للتفريغ هو مستوى واحد فقط.');
        }
        parentName = parentCat.name;
      }
      data.parentId = parentId;
    } else if (rawParentId === 'root') {
      data.parentId = null;
    }

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
    } catch (e: any) {
      if (e?.message?.includes('لا يمكن')) throw e;
      console.warn('Prisma updateCategory offline fallback');
    }

    // 2. Synchronize in-memory and catalog
    const memIdx = inMemoryCategories.findIndex(c => c.id === id);
    if (memIdx >= 0) {
      inMemoryCategories[memIdx].name = cleanName;
      if (data.imagePath) inMemoryCategories[memIdx].imagePath = data.imagePath;
      if (data.parentId !== undefined) {
        inMemoryCategories[memIdx].parentId = data.parentId;
        inMemoryCategories[memIdx].parentName = parentName;
      }
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
    revalidatePath('/pos/cashier');

    return { success: true };
  } catch (error: any) {
    console.error('Error updating category:', error);
    return { success: false, error: error.message || 'حدث خطأ غير معروف' };
  }
}

/**
 * Delete a category
 */
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
    revalidatePath('/pos/cashier');

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return { success: false, error: error.message || 'حدث خطأ أثناء الحذف' };
  }
}
