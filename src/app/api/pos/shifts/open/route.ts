import { NextRequest, NextResponse } from 'next/server';
import { openShift, closeShift } from '@/actions/pos';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { startingCashFils = 50000, notes = 'افتتاح الصندوق' } = body;

    const result = await openShift(startingCashFils, notes);
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
