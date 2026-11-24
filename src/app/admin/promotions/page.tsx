import { AdminSidebar } from '@/components/AdminSidebar';
import React from 'react';
import { requireAuth } from '@/lib/dal';
import { getAllPromotions } from '@/actions/admin-pos';
import { prisma } from '@/lib/db';
import { COSMETICS_CATALOG } from '@/lib/cosmetics-catalog';
import AdminPromotionsClient from './AdminPromotionsClient';

export default async function AdminPromotionsPage() {
  const session = await requireAuth();

  const promotions = await getAllPromotions();

  let products: { id: string; nameAr: string; brandName?: string; price: number; sku?: string }[] = [];
  try {
    const dbProducts = await prisma.product.findMany({
      include: { brand: true, variants: { take: 1 } },
      orderBy: { nameAr: 'asc' }
    });
    if (dbProducts && dbProducts.length > 0) {
      products = dbProducts.map(p => ({
        id: p.id,
        nameAr: p.nameAr,
        brandName: p.brand?.name || 'غزل',
        price: p.variants[0]?.price || 15000,
        sku: p.variants[0]?.sku || p.id
      }));
    }
  } catch {}

  if (products.length === 0) {
    products = COSMETICS_CATALOG.map(p => ({
      id: p.id,
      nameAr: p.nameAr,
      brandName: p.brandName,
      price: p.variants[0]?.price || p.priceFils,
      sku: p.sku
    }));
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[var(--color-ivory-100)] overflow-hidden" dir="rtl">
      <AdminSidebar employeeName={session.employee.name} roleName={session?.employee?.role?.name || "ADMIN"} />
      <main className="flex-1 overflow-y-auto w-full max-w-full">
        <AdminPromotionsClient initialPromotions={promotions} products={products} />
      </main>
    </div>
  );
}
