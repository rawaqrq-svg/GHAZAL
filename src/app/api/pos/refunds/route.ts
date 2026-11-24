import { NextRequest, NextResponse } from 'next/server';
import { getSaleForReturn, processPOSReturn } from '@/actions/pos';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invoiceNumber, reason = 'إرجاع حسب طلب الزبون' } = body;

    if (!invoiceNumber) {
      return NextResponse.json({ success: false, error: 'رقم الفاتورة مطلوب للإرجاع' }, { status: 400 });
    }

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
