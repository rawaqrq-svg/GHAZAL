import React from 'react';
import { requireAuth } from '@/lib/dal';
import { AdminSidebar } from '@/components/AdminSidebar';
import { DataRetentionClient } from './DataRetentionClient';
import { getDataRetentionStatusAction } from '@/actions/data-retention';

export default async function DataRetentionPage() {
  const session = await requireAuth();
  const status = await getDataRetentionStatusAction();

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#FAF8F5] overflow-hidden" dir="rtl">
      <AdminSidebar employeeName={session.employee.name} roleName={session?.employee?.role?.name || "ADMIN"} />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 font-sans w-full max-w-full">
        <DataRetentionClient initialStatus={status} />
      </main>
    </div>
  );
}
