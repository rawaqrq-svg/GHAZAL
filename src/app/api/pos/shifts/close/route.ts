import { NextRequest, NextResponse } from 'next/server';
import { closeShift } from '@/actions/pos';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { actualCashFils, notes } = body;

    if (actualCashFils === undefined) {
      return NextResponse.json({ success: false, error: 'النقد الفعلي بالصندوق مطلوب' }, { status: 400 });
    }

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
