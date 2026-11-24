import { AdminSidebar } from '@/components/AdminSidebar';
import React from 'react';
import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/db';
import AdminPOSShiftsClient from './AdminPOSShiftsClient';

export default async function AdminPOSShiftsPage() {
  const session = await requireAuth();

  let shifts: any[] = [];
  try {
    const dbShifts = await prisma.shift.findMany({
      include: {
        employee: { select: { id: true, name: true, email: true } },
        cashMovements: true
      },
      orderBy: { openedAt: 'desc' },
      take: 50
    });
    shifts = dbShifts.map(s => ({
      id: s.id,
      employeeName: s.employee.name,
      terminalId: s.terminalId,
      openingCashFils: s.openingCashFils,
      expectedCashFils: s.expectedCashFils,
      actualCashFils: s.actualCashFils,
      varianceFils: s.varianceFils,
      cardRecordedFils: s.cardRecordedFils,
      refundFils: s.refundFils,
      status: s.status,
      notes: s.notes,
      openedAt: s.openedAt.toISOString(),
      closedAt: s.closedAt ? s.closedAt.toISOString() : null,
      movementsCount: s.cashMovements.length
    }));
  } catch (err) {
    console.warn('Prisma shifts fallback');
  }

  // Fallback demo/mock shifts if DB empty or offline
  if (shifts.length === 0) {
    shifts = [
      {
        id: 'shift-101',
        employeeName: 'كاشير غزل (عين الباشا)',
        terminalId: 'GHAZAL-POS-01',
        openingCashFils: 50000,
        expectedCashFils: 245000,
        actualCashFils: 245000,
        varianceFils: 0,
        cardRecordedFils: 85000,
        refundFils: 0,
        status: 'CLOSED',
        notes: 'إقفال وردية مطابق تماماً وبدون أي فروقات',
        openedAt: new Date(Date.now() - 3600000 * 9).toISOString(),
        closedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
        movementsCount: 2
      },
      {
        id: 'shift-102',
        employeeName: 'كاشير غزل (عين الباشا)',
        terminalId: 'GHAZAL-POS-01',
        openingCashFils: 50000,
        expectedCashFils: null,
        actualCashFils: null,
        varianceFils: null,
        cardRecordedFils: 0,
        refundFils: 0,
        status: 'OPEN',
        notes: 'الوردية الصباحية الحالية',
        openedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
        closedAt: null,
        movementsCount: 0
      }
    ];
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[var(--color-ivory-100)] overflow-hidden" dir="rtl">
      <AdminSidebar employeeName={session.employee.name} roleName={session?.employee?.role?.name || "ADMIN"} />
      <main className="flex-1 overflow-y-auto w-full max-w-full">
        <AdminPOSShiftsClient initialShifts={shifts} />
      </main>
    </div>
  );
}
