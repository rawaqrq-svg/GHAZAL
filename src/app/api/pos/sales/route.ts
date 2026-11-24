import { NextRequest, NextResponse } from 'next/server';
import { processPOSCheckout } from '@/actions/pos';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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
