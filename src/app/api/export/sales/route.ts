import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/auth';
import { getEmployeePermissions } from '@/lib/dal';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

function sanitizeCsvField(value: any): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  // Prevent CSV Formula Injection (DDE) in Excel/LibreOffice
  if (/^[=+\-@\t\r]/.test(str)) {
    return `"'${str}"`;
  }
  return `"${str}"`;
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const isAllowed = await checkRateLimit(ip, 'api_export_sales', 10, 15);
    if (!isAllowed) {
      return new NextResponse('Too many export requests', { status: 429 });
    }

    const session = await getCurrentSession();
    if (!session || !session.employee?.isActive) {
      return new NextResponse('Unauthorized: Please log in to export reports', { status: 401 });
    }

    const roleName = session.employee.role?.name?.toUpperCase() || '';
    const isAdmin = roleName === 'ADMIN' || roleName === 'SUPER ADMIN';
    if (!isAdmin) {
      const perms = await getEmployeePermissions(session.employeeId);
      if (!perms.includes('manage:reports')) {
        return new NextResponse('Forbidden: Insufficient permissions to export sales records', { status: 403 });
      }
    }

    const { searchParams } = new URL(request.url);
    const filterEmployee = searchParams.get('employeeId');
    const filterSource = searchParams.get('source');
    const filterPayMethod = searchParams.get('payMethod');
    const filterStartDate = searchParams.get('startDate');
    const filterEndDate = searchParams.get('endDate');

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

    const sales = await prisma.sale.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 5000,
      include: {
        employee: true,
        payments: true
      }
    });

    // Create CSV header
    let csv = 'رقم العملية,الكاشير,المصدر,اسم العميل,المجموع الإجمالي (د.أ),طريقة الدفع,التاريخ\n';

    for (const sale of sales) {
      const payMethod = sale.payments[0]?.method || '-';
      const total = (sale.total / 1000).toFixed(3);
      const source = sale.source === 'STOREFRONT' ? 'طلب متجر' : 'POS';
      const date = new Date(sale.createdAt).toLocaleString('ar-JO').replace(/,/g, '');
      const empName = sale.employee?.name || '-';
      
      const row = [
        sanitizeCsvField(sale.reference),
        sanitizeCsvField(empName),
        sanitizeCsvField(source),
        sanitizeCsvField(sale.customerName || '-'),
        sanitizeCsvField(total),
        sanitizeCsvField(payMethod),
        sanitizeCsvField(date)
      ].join(',');

      csv += row + '\n';
    }

    // Prepend UTF-8 BOM for Arabic support in Excel
    const bom = '\uFEFF';
    
    return new NextResponse(bom + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="sales_report.csv"',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });

  } catch (error) {
    console.error('Export Error:', error);
    return new NextResponse('Error generating export', { status: 500 });
  }
}
