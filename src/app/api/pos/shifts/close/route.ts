import { NextRequest, NextResponse } from 'next/server';
import { closeShift } from '@/actions/pos';
import { getCurrentSession } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { z } from 'zod';

const closeShiftSchema = z.object({
  actualCashFils: z.number().int().nonnegative('النقد الفعلي بالصندوق يجب أن يكون صفراً أو موجباً'),
  notes: z.string().max(255).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const isAllowed = await checkRateLimit(ip, 'api_pos_shift_close', 10, 15);
    if (!isAllowed) {
      return NextResponse.json({ success: false, error: 'تم تجاوز الحد المسموح به من المحاولات' }, { status: 429 });
    }

    const session = await getCurrentSession();
    if (!session || !session.employee?.isActive) {
      return NextResponse.json({ success: false, error: 'غير مصرح - يرجى تسجيل الدخول أولاً' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = closeShiftSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'بيانات إغلاق الوردية غير صالحة' }, { status: 400 });
    }

    const { actualCashFils, notes } = parsed.data;

    const result = await closeShift(actualCashFils, notes || 'إغلاق الوردية ومطابقة الصندوق');
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'تم إغلاق الوردية ومطابقة الصندوق بنجاح',
      shift: result.shift,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error closing shift' }, { status: 500 });
  }
}
