import React from 'react';
import { requireAuth } from '@/lib/dal';
import { AdminSidebar } from '@/components/AdminSidebar';
import AdminSettlementsClient from './AdminSettlementsClient';
import { getSettlementsDashboardData } from '@/actions/settlements';

export default async function AdminSettlementsPage({
  searchParams
}: {
  searchParams: Promise<{ channel?: string; q?: string; tab?: string }>;
}) {
  const session = await requireAuth();
  const resolvedParams = await searchParams;
  const channel = resolvedParams?.channel;
  const initialQuery = resolvedParams?.q || resolvedParams?.tab;

  const initialData = await getSettlementsDashboardData(channel);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#FBFBFC]" dir="rtl">
      <AdminSidebar
        employeeName={session.employee.name}
        roleName={session?.employee?.role?.name || 'ADMIN'}
      />

      <main className="flex-1 w-full max-w-full overflow-y-auto">
        <AdminSettlementsClient
          initialData={initialData}
          currentUserRole={session?.employee?.role?.name || 'ADMIN'}
          initialQueryParam={initialQuery}
        />
      </main>
    </div>
  );
}
