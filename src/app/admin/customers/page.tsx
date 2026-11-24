import { AdminSidebar } from '@/components/AdminSidebar';
import React from 'react';
import { requireAuth } from '@/lib/dal';
import { getAllCustomers } from '@/actions/admin-pos';
import AdminCustomersClient from './AdminCustomersClient';

export default async function AdminCustomersPage() {
  const session = await requireAuth();

  const customers = await getAllCustomers();

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[var(--color-ivory-100)] overflow-hidden" dir="rtl">
      <AdminSidebar employeeName={session.employee.name} roleName={session?.employee?.role?.name || "ADMIN"} />
      <main className="flex-1 overflow-y-auto w-full max-w-full">
        <AdminCustomersClient initialCustomers={customers} />
      </main>
    </div>
  );
}
