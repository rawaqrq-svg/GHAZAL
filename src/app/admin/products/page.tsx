import React from 'react';
import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/db';
import { AdminSidebar } from '@/components/AdminSidebar';
import { getGlobalSizePrices } from '@/actions/settings';
import { getProductCustomBadges } from '@/actions/products';
import { getSynchronizedCategories } from '@/actions/categories';
import { AdminProductsClient } from './AdminProductsClient';
import { filsToDisplay } from '@/lib/money';
import { COSMETICS_CATALOG } from '@/lib/cosmetics-catalog';

export default async function AdminProductsPage() {
  const session = await requireAuth();
  const globalPrices = await getGlobalSizePrices();

  let products: any[] = [];
  let categories: any[] = [];

  try {
    products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        brand: true,
        variants: true,
        images: { where: { isMain: true }, take: 1 }
      }
    });
    categories = await prisma.category.findMany();
  } catch (err) {
    console.warn('Prisma product query skipped, using fallback products');
  }

  const customBadges = await getProductCustomBadges();

  if (products.length > 0) {
    products = products.map(p => ({
      ...p,
      tag: (p.reviewReasons?.startsWith('TAG:') ? p.reviewReasons.replace('TAG:', '') : null) || customBadges[p.id] || customBadges[p.slug] || p.tag || undefined
    }));
  } else {
    products = COSMETICS_CATALOG.map(p => ({
      id: p.id,
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      slug: p.slug,
      sku: p.sku,
      barcode: p.barcode,
      categoryId: p.categoryId,
      category: { id: p.categoryId, name: p.categoryName, slug: p.categorySlug },
      brand: { id: 'b-1', name: p.brandName },
      variants: p.variants.map(v => ({
        id: v.id,
        size: v.size,
        shade: v.shade,
        colorHex: v.colorHex,
        price: v.price,
        stock: v.stock,
        barcode: v.barcode,
        isActive: true,
      })),
      images: p.images.map(img => ({ id: img.id, url: img.url, isMain: img.isMain })),
      isVisible: true,
      isFeatured: p.isFeatured,
      tag: p.tag || customBadges[p.id] || customBadges[p.slug] || undefined,
      createdAt: new Date(),
    }));
  }

  if (categories.length === 0) {
    categories = await getSynchronizedCategories();
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[var(--color-ivory-100)] overflow-hidden" dir="rtl">
      <AdminSidebar employeeName={session.employee.name} roleName={session?.employee?.role?.name || "ADMIN"} />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 font-sans w-full max-w-full">
        <AdminProductsClient 
          products={products} 
          globalPrices={globalPrices} 
          adminId={session.employee.id} 
          categories={categories}
        />
      </main>
    </div>
  );
}
