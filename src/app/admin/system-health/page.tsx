import React from 'react';
import { requireAuth } from '@/lib/dal';
import { AdminSidebar } from '@/components/AdminSidebar';
import { getSystemHealthOverviewAction } from '@/actions/system-health';
import { SystemHealthClient } from './SystemHealthClient';

export const dynamic = 'force-dynamic';

export default async function AdminSystemHealthPage() {
  const session = await requireAuth();
  const healthData = await getSystemHealthOverviewAction();

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#FAF8F5] overflow-hidden" dir="rtl">
      <AdminSidebar employeeName={session.employee.name} roleName={session?.employee?.role?.name || "ADMIN"} />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 font-sans w-full max-w-full">
        <SystemHealthClient initialData={healthData} />
      </main>
    </div>
  );
}
