import { NextRequest, NextResponse } from 'next/server';
import { openShift } from '@/actions/pos';
import { getCurrentSession } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { z } from 'zod';

const openShiftSchema = z.object({
  startingCashFils: z.number().int().nonnegative('المبلغ الابتدائي يجب أن يكون صفراً أو موجباً').default(50000),
  terminalId: z.string().max(50).default('POS-TERM-01'),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const isAllowed = await checkRateLimit(ip, 'api_pos_shift_open', 10, 15);
    if (!isAllowed) {
      return NextResponse.json({ success: false, error: 'تم تجاوز الحد المسموح به من المحاولات' }, { status: 429 });
    }

    const session = await getCurrentSession();
    if (!session || !session.employee?.isActive) {
      return NextResponse.json({ success: false, error: 'غير مصرح - يرجى تسجيل الدخول أولاً' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = openShiftSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'بيانات فتح الوردية غير صالحة' }, { status: 400 });
    }

    const { startingCashFils, terminalId } = parsed.data;

    const result = await openShift(startingCashFils, terminalId);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'تم فتح الوردية بنجاح',
      shift: result.shift,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error opening shift' }, { status: 500 });
  }
}
