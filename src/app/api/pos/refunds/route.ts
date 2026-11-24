import { NextRequest, NextResponse } from 'next/server';
import { getSaleForReturn, processPOSReturn } from '@/actions/pos';
import { getCurrentSession } from '@/lib/auth';
import { getEmployeePermissions } from '@/lib/dal';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { z } from 'zod';

const refundRequestSchema = z.object({
  invoiceNumber: z.string().min(1, 'رقم الفاتورة مطلوب').max(50),
  reason: z.string().max(255).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const isAllowed = await checkRateLimit(ip, 'api_pos_refund', 10, 15);
    if (!isAllowed) {
      return NextResponse.json({ success: false, error: 'تم تجاوز الحد المسموح به من محاولات الإرجاع' }, { status: 429 });
    }

    // 1. Authenticate Session
    const session = await getCurrentSession();
    if (!session || !session.employee?.isActive) {
      return NextResponse.json({ success: false, error: 'غير مصرح - يرجى تسجيل الدخول إلى نقطة البيع' }, { status: 401 });
    }

    // 2. Authorize Permissions for Sensitive Refund Operation
    const roleName = session.employee.role?.name?.toUpperCase() || '';
    const isAdmin = roleName === 'ADMIN' || roleName === 'SUPER ADMIN';
    if (!isAdmin) {
      const perms = await getEmployeePermissions(session.employeeId);
      if (!perms.includes('pos:refund')) {
        return NextResponse.json({ 
          success: false, 
          error: 'غير مصرح: عملية استرداد المبالغ النقدية تتطلب موافقة المشرف أو صلاحية pos:refund' 
        }, { status: 403 });
      }
    }

    // 3. Input Validation
    const body = await req.json().catch(() => null);
    const parsed = refundRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ 
        success: false, 
        error: parsed.error.issues[0]?.message || 'بيانات طلب الإرجاع غير صالحة' 
      }, { status: 400 });
    }

    const { invoiceNumber, reason = 'إرجاع حسب طلب الزبون' } = parsed.data;

    const saleRes = await getSaleForReturn(invoiceNumber);
    if (!saleRes.success || !saleRes.sale) {
      return NextResponse.json({ success: false, error: saleRes.error || 'لم يتم العثور على الفاتورة' }, { status: 404 });
    }

    const returnItems = (saleRes.sale.items || []).map((it: any) => ({
      variantId: it.variantId || it.id,
      quantity: it.quantity,
      amount: it.priceFils,
    }));

    const result = await processPOSReturn({
      saleReference: saleRes.sale.reference,
      items: returnItems,
      refundMethod: 'CASH',
      reason,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'تم تسجيل إرجاع الفاتورة واسترداد المبلغ بنجاح',
      refund: result,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Refund error' }, { status: 500 });
  }
}
