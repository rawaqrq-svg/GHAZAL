import React from 'react';
import { requireAuth } from '@/lib/dal';
import { filsToDisplay } from '@/lib/money';
import { prisma } from '@/lib/db';
import { AdminSidebar } from '@/components/AdminSidebar';
import { SalesFilters } from '@/components/SalesFilters';
import Link from 'next/link';

export default async function AdminSalesPage({
  searchParams
}: {
  searchParams: Promise<{ employeeId?: string; source?: string; payMethod?: string; startDate?: string; endDate?: string }>;
}) {
  const session = await requireAuth();

  const resolvedParams = await searchParams;
  const filterEmployee = resolvedParams.employeeId;
  const filterSource = resolvedParams.source;
  const filterPayMethod = resolvedParams.payMethod;
  const filterStartDate = resolvedParams.startDate;
  const filterEndDate = resolvedParams.endDate;

  const whereClause: any = {};
  if (filterEmployee) whereClause.employeeId = filterEmployee;
  if (filterSource) whereClause.source = filterSource;
  if (filterPayMethod) {
    whereClause.payments = {
      some: { method: filterPayMethod }
    };
  }
  if (filterStartDate || filterEndDate) {
    whereClause.createdAt = {};
    if (filterStartDate) {
      whereClause.createdAt.gte = new Date(`${filterStartDate}T00:00:00Z`);
    }
    if (filterEndDate) {
      whereClause.createdAt.lte = new Date(`${filterEndDate}T23:59:59Z`);
    }
  }

  let sales: any[] = [];
  let employees: any[] = [];

  try {
    sales = await prisma.sale.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: true,
        items: true,
        payments: true
      }
    });
    employees = await prisma.employee.findMany();
  } catch (err) {
    console.warn('Prisma sales query skipped, using fallback');
  }

  const totalSalesCount = sales.length;
  const totalSalesSum = sales.reduce((sum, sale) => sum + sale.total, 0);
  const cashSalesSum = sales.filter((s: any) => (s.payments || []).some((p: any) => p.method === 'CASH')).reduce((sum: number, s: any) => sum + s.total, 0);
  const cardSalesSum = sales.filter((s: any) => (s.payments || []).some((p: any) => p.method === 'CARD')).reduce((sum: number, s: any) => sum + s.total, 0);
  const walletSalesSum = sales.filter((s: any) => (s.payments || []).some((p: any) => p.method === 'WALLET')).reduce((sum: number, s: any) => sum + s.total, 0);
  const creditSalesSum = sales.filter((s: any) => (s.payments || []).some((p: any) => p.method === 'CREDIT')).reduce((sum: number, s: any) => sum + s.total, 0);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#FAF8F5] overflow-hidden" dir="rtl">
      <AdminSidebar employeeName={session.employee.name} roleName={session?.employee?.role?.name || "ADMIN"} />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 font-sans w-full max-w-full">
        <div className="flex justify-between items-center mb-6 border-b border-zinc-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold font-heading text-zinc-900">
              عمليات البيع والفواتير والتحصيل المالي (الجرد)
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              سجل تدقيق المبيعات، الصندوق النقدي، الحركات الإلكترونية، والذمم الآجلة
            </p>
          </div>
        </div>

        {/* Filters */}
        <SalesFilters 
          filterEmployee={filterEmployee || ''} 
          filterSource={filterSource || ''} 
          filterPayMethod={filterPayMethod || ''} 
          filterStartDate={filterStartDate || ''}
          filterEndDate={filterEndDate || ''}
          employees={employees} 
        />

        {/* Financial Audit Breakdown (جرد الصندوق وقنوات الدفع) */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-4">
            <p className="text-zinc-500 text-xs font-bold mb-1">إجمالي المبيعات</p>
            <p className="text-xl font-black text-zinc-900">{filsToDisplay(totalSalesSum, 'ar')}</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">{totalSalesCount} عملية مسجلة</p>
          </div>

          <div className="bg-emerald-50 rounded-2xl shadow-sm border border-emerald-200 p-4">
            <p className="text-emerald-800 text-xs font-bold mb-1">المبيعات النقدية (كاش)</p>
            <p className="text-xl font-black text-emerald-700">{filsToDisplay(cashSalesSum, 'ar')}</p>
            <p className="text-[10px] text-emerald-600 mt-0.5">في صندوق الكاشير</p>
          </div>

          <div className="bg-blue-50 rounded-2xl shadow-sm border border-blue-200 p-4">
            <p className="text-blue-800 text-xs font-bold mb-1">بطاقات (فيزا)</p>
            <p className="text-xl font-black text-blue-700">{filsToDisplay(cardSalesSum, 'ar')}</p>
            <p className="text-[10px] text-blue-600 mt-0.5">أجهزة نقاط البيع POS</p>
          </div>

          <div className="bg-purple-50 rounded-2xl shadow-sm border border-purple-200 p-4">
            <p className="text-purple-800 text-xs font-bold mb-1">محافظ CliQ</p>
            <p className="text-xl font-black text-purple-700">{filsToDisplay(walletSalesSum, 'ar')}</p>
            <p className="text-[10px] text-purple-600 mt-0.5">تحويلات بنكية ومحافظ</p>
          </div>

          <div className="bg-amber-50 rounded-2xl shadow-sm border border-amber-200 p-4">
            <p className="text-amber-800 text-xs font-bold mb-1">البيع الآجل (الذمم)</p>
            <p className="text-xl font-black text-amber-700">{filsToDisplay(creditSalesSum, 'ar')}</p>
            <p className="text-[10px] text-amber-600 mt-0.5">مبالغ مستحقة على الزبائن</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-[var(--color-ivory-200)] overflow-x-auto">
          <div className="overflow-x-auto w-full max-w-[90vw] md:max-w-full pb-4"><table className="w-full text-right border-collapse min-w-[800px]">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr className="text-sm font-bold text-zinc-700">
                <th className="px-6 py-4">رقم العملية</th>
                <th className="px-6 py-4">الكاشير</th>
                <th className="px-6 py-4">المصدر</th>
                <th className="px-6 py-4">اسم العميل</th>
                <th className="px-6 py-4 min-w-[250px]">المنتجات</th>
                <th className="px-6 py-4">المجموع الإجمالي</th>
                <th className="px-6 py-4">طريقة الدفع</th>
                <th className="px-6 py-4">التاريخ والوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sales.map((sale) => {
                const payMethod = sale.payments[0]?.method || '-';
                return (
                  <tr key={sale.id} className="hover:bg-zinc-50/50 transition-colors text-zinc-650">
                    <td className="px-6 py-4 font-bold font-mono text-zinc-900">{sale.reference}</td>
                    <td className="px-6 py-4">{sale.employee?.name || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sale.source === 'STOREFRONT' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                        {sale.source === 'STOREFRONT' ? 'طلب توصيل' : 'نقاط بيع (POS)'}
                      </span>
                    </td>
                    <td className="px-6 py-4">{sale.customerName || '-'}</td>
                    <td className="px-6 py-4 text-xs text-zinc-600">
                      <ul className="list-disc list-inside">
                        {(sale.items || []).map((item: any) => (
                          <li key={item.id}>{item.name} ({item.size}) <span className="font-bold text-zinc-800">x{item.quantity}</span></li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600">
                      {filsToDisplay(sale.total, 'ar')}
                    </td>
                    <td className="px-6 py-4">
                      {payMethod === 'CREDIT' ? (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full text-xs font-extrabold">
                          بيع آجل (ذمم)
                        </span>
                      ) : payMethod === 'WALLET' ? (
                        <span className="bg-purple-100 text-purple-900 border border-purple-200 px-2.5 py-0.5 rounded-full text-xs font-bold">
                          محفظة / CliQ
                        </span>
                      ) : payMethod === 'CARD' ? (
                        <span className="bg-blue-100 text-blue-900 border border-blue-200 px-2.5 py-0.5 rounded-full text-xs font-bold">
                          بطاقة (فيزا)
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-900 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-bold">
                          نقدي (كاش)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(sale.createdAt).toLocaleString('ar-JO')}
                    </td>
                  </tr>
                );
              })}

              {sales.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-zinc-500">
                    لا توجد مبيعات مسجلة تطابق الفلاتر.
                  </td>
                </tr>
              )}
            </tbody>
          </table></div>
        </div>
      </main>
    </div>
  );
}
