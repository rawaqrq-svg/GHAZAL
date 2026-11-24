import React from 'react';
import { requireAdmin } from '@/lib/dal';
import { AdminSidebar } from '@/components/AdminSidebar';
import { getBackupSystemStatusAction } from '@/actions/backup';
import { BackupSettingsClient } from './BackupSettingsClient';

export const dynamic = 'force-dynamic';

export default async function AdminBackupsSettingsPage() {
  const session = await requireAdmin();
  const backupData = await getBackupSystemStatusAction();

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#FAF8F5] overflow-hidden" dir="rtl">
      <AdminSidebar
        employeeName={session.employee.name}
        roleName={session?.employee?.role?.name || 'ADMIN'}
      />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 font-sans w-full max-w-full">
        <BackupSettingsClient initialData={backupData} />
      </main>
    </div>
  );
}
