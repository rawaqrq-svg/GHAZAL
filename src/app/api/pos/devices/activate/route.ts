import { NextRequest, NextResponse } from 'next/server';
import { authorizeDeviceByCode } from '@/actions/pos-devices';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, deviceName = 'GHAZAL-POS-01', machineKey } = body;

    if (!code) {
      return NextResponse.json({ success: false, error: 'رمز التفعيل مطلوب' }, { status: 400 });
    }

    const result = await authorizeDeviceByCode(code, deviceName);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: 'تم تفعيل الجهاز بنجاح كجهاز كاشير معتمد لمحل غزل',
      device: result.device,
      token: `pos_tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Server error' }, { status: 500 });
  }
}
