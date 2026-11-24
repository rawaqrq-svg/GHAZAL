import React from 'react';
import Link from 'next/link';
import { requireAuth } from '@/lib/dal';
import { logout } from '@/actions/auth';
import { AdminAutoRefresher } from '@/components/AdminAutoRefresher';

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      {children}
      <AdminAutoRefresher />
    </div>
  );
}
