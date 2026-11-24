import { AdminSidebar } from '@/components/AdminSidebar';
import React from 'react';
import { requireAuth } from '@/lib/dal';
import { getPrintingSettings } from '@/actions/admin-pos';
import AdminPrintingClient from './AdminPrintingClient';

export default async function AdminPrintingPage() {
  const session = await requireAuth();

  const settings = await getPrintingSettings();

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[var(--color-ivory-100)] overflow-hidden" dir="rtl">
      <AdminSidebar employeeName={session.employee.name} roleName={session?.employee?.role?.name || "ADMIN"} />
      <main className="flex-1 overflow-y-auto w-full max-w-full">
        <AdminPrintingClient initialSettings={settings} />
      </main>
    </div>
  );
}
