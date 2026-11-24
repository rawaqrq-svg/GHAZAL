import React from 'react';
import { requireAuth } from '@/lib/dal';
import { AdminSidebar } from '@/components/AdminSidebar';
import { DeliveriesClient } from './DeliveriesClient';
import { getSettlementsDashboardData } from '@/actions/settlements';
import { getShippingZonesList } from '@/actions/shipping';

export default async function AdminDeliveriesPage({
  searchParams
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireAuth();
  const sp = searchParams ? await searchParams : {};
  const requestedTab = typeof sp.tab === 'string' ? sp.tab : typeof sp.view === 'string' ? sp.view : typeof sp.q === 'string' ? sp.q : '';

  // Load live delivery orders, prepared batches, courier settlements, and shipping zones
  const [data, shippingZones] = await Promise.all([
    getSettlementsDashboardData('ONLINE'),
    getShippingZonesList()
  ]);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#FAF8F5] overflow-hidden" dir="rtl">
      <AdminSidebar employeeName={session.employee.name} roleName={session?.employee?.role?.name || "ADMIN"} />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 font-sans w-full max-w-full">
        <DeliveriesClient
          initialTabParam={requestedTab}
          initialPreparedOrders={data.preparedOrders || []}
          initialCourierBatches={data.courierBatches || []}
          initialDeliveryOrders={data.deliveryOrders || []}
          deliverySettlement={data.deliverySettlement}
          initialShippingZones={shippingZones || []}
          initialCourierCompanies={data.courierCompanies || []}
        />
      </main>
    </div>
  );
}
