import { AdminSidebar } from '@/components/AdminSidebar';
import React from 'react';
import { requireAuth } from '@/lib/dal';
import { getPOSSalesHistory } from '@/actions/pos';
import AdminPOSSalesClient from './AdminPOSSalesClient';

export default async function AdminPOSSalesPage() {
  const session = await requireAuth();

  // Load initial sales history
  let initialSales: any[] = [];
  let employees: any[] = [];
  try {
    const res = await getPOSSalesHistory();
    if (res && res.sales) {
      initialSales = res.sales;
      employees = res.employees || [];
    }
  } catch (e) {
    console.warn('Failed to load initial POS sales:', e);
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[var(--color-ivory-100)] overflow-hidden" dir="rtl">
      <AdminSidebar employeeName={session.employee.name} roleName={session?.employee?.role?.name || "ADMIN"} />
      <main className="flex-1 overflow-y-auto w-full max-w-full">
        <AdminPOSSalesClient initialSales={initialSales} employees={employees} />
      </main>
    </div>
  );
}
