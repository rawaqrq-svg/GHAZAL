import React from 'react';
import { requireAuth } from '@/lib/dal';
import { AdminSidebar } from '@/components/AdminSidebar';
import { prisma } from '@/lib/db';
import { COSMETICS_CATALOG } from '@/lib/cosmetics-catalog';
import { getRewardsDashboardDataAction } from '@/actions/rewards';
import AdminRewardsClient from './AdminRewardsClient';

export default async function AdminRewardsPage({
  searchParams
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireAuth();
  const sp = searchParams ? await searchParams : {};
  const period = typeof sp.period === 'string' ? sp.period : 'LAST_30_DAYS';
  const requestedTab = typeof sp.tab === 'string' ? sp.tab : typeof sp.q === 'string' ? sp.q : typeof sp.view === 'string' ? sp.view : 'rules';

  const dashboardData = await getRewardsDashboardDataAction(period);

  // Load available catalog products with images, stock & prices for gift picker
  let products: any[] = [];
  try {
    const dbProds = await prisma.product.findMany({
      include: {
        images: { where: { isMain: true }, take: 1 },
        variants: true
      },
      take: 200,
      orderBy: { nameAr: 'asc' }
    });
    if (dbProds && dbProds.length > 0) {
      products = dbProds.map(p => ({
        id: p.id,
        nameAr: p.nameAr,
        sku: p.sku,
        imageUrl: p.images[0]?.url || '/product-placeholder.png',
        price: p.variants[0]?.price || 15000,
        costPrice: Math.round((p.variants[0]?.price || 15000) * 0.55),
        stock: p.variants.reduce((acc, v: any) => acc + (v.stock || 12), 0)
      }));
    }
  } catch {}

  if (products.length === 0) {
    products = COSMETICS_CATALOG.map(p => ({
      id: p.id,
      nameAr: p.nameAr,
      sku: p.sku,
      imageUrl: p.images[0]?.url || '/product-placeholder.png',
      price: p.variants[0]?.price || p.priceFils,
      costPrice: Math.round((p.variants[0]?.price || p.priceFils) * 0.55),
      stock: p.variants.reduce((acc, v: any) => acc + (v.stock || 15), 0)
    }));
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[var(--color-ivory-100)] overflow-hidden" dir="rtl">
      <AdminSidebar employeeName={session.employee.name} roleName={session?.employee?.role?.name || "ADMIN"} />
      <main className="flex-1 overflow-y-auto w-full max-w-full p-4 md:p-8 font-sans">
        <AdminRewardsClient 
          initialTabParam={requestedTab}
          initialData={dashboardData}
          availableProducts={products}
        />
      </main>
    </div>
  );
}
