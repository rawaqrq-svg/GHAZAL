import { NextRequest, NextResponse } from 'next/server';
import { getSaleDetailsForReceipt } from '@/actions/pos';

export async function GET(
  _req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
