import { NextRequest, NextResponse } from 'next/server';
import { processPOSCheckout } from '@/actions/pos';
import { getCurrentSession } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const isAllowed = await checkRateLimit(ip, 'api_pos_sales', 30, 15);
    if (!isAllowed) {
      return NextResponse.json({ success: false, error: 'تم تجاوز الحد المسموح به من الطلبات' }, { status: 429 });
    }

    const session = await getCurrentSession();
    if (!session || !session.employee?.isActive) {
      return NextResponse.json({ success: false, error: 'غير مصرح - يرجى تسجيل الدخول إلى نقطة البيع' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'بيانات العملية غير صالحة' }, { status: 400 });
    }

    const result = await processPOSCheckout(body);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'تم تسجيل عملية البيع بنجاح وإصدار الفاتورة',
      sale: result,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Checkout failed' }, { status: 500 });
  }
}
