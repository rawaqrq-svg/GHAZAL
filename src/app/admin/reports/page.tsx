import React from 'react';
import { requireAuth } from '@/lib/dal';
import { getPOSSalesHistory } from '@/actions/pos';
import { getAllOperatingExpenses, getAllFinancialVouchers } from '@/actions/finance';
import { getProductSalesAnalytics } from '@/actions/product-reports';
import AdminReportsClient from './AdminReportsClient';
import { AdminSidebar } from '@/components/AdminSidebar';

export default async function AdminReportsPage() {
  const session = await requireAuth();

  let salesHistory: any[] = [];
  try {
    const res = await getPOSSalesHistory();
    salesHistory = res.sales || [];
  } catch {}

  const expenses = await getAllOperatingExpenses();
  const vouchers = await getAllFinancialVouchers();
  const productAnalytics = await getProductSalesAnalytics();

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[var(--color-ivory-100)] overflow-hidden" dir="rtl">
      <AdminSidebar employeeName={session.employee.name} roleName={session?.employee?.role?.name || "ADMIN"} />
      <main className="flex-1 overflow-y-auto w-full max-w-full">
        <AdminReportsClient 
          sales={salesHistory} 
          expenses={expenses} 
          vouchers={vouchers} 
          productAnalytics={productAnalytics}
        />
      </main>
    </div>
  );
}
