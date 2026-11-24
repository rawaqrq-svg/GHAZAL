import { NextRequest, NextResponse } from 'next/server';
import { getSaleDetailsForReceipt } from '@/actions/pos';
import { getCurrentSession } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIp(req.headers);
    const isAllowed = await checkRateLimit(ip, 'api_pos_sale_get', 60, 15);
    if (!isAllowed) {
      return NextResponse.json({ success: false, error: 'تم تجاوز الحد المسموح به من الطلبات' }, { status: 429 });
    }

    const session = await getCurrentSession();
    if (!session || !session.employee?.isActive) {
      return NextResponse.json({ success: false, error: 'غير مصرح - يرجى تسجيل الدخول إلى نقطة البيع' }, { status: 401 });
    }

    const { id } = await params;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ success: false, error: 'معرف الفاتورة غير صالح' }, { status: 400 });
    }

    const result = await getSaleDetailsForReceipt(id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      sale: result.sale,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error fetching sale' }, { status: 500 });
  }
}
