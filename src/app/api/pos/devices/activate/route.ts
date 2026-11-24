import { NextRequest, NextResponse } from 'next/server';
import { authorizeDeviceByCode } from '@/actions/pos-devices';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { z } from 'zod';

const activateInputSchema = z.object({
  code: z.string().min(4, 'رمز التفعيل غير صالح').max(20),
  deviceName: z.string().max(100).default('GHAZAL-POS-01'),
  machineKey: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const isAllowed = await checkRateLimit(ip, 'api_pos_device_activate', 5, 15);
    if (!isAllowed) {
      return NextResponse.json({ 
        success: false, 
        error: 'تم تجاوز الحد المسموح به من محاولات التفعيل. يرجى الانتظار 15 دقيقة.' 
      }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    const parsed = activateInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ 
        success: false, 
        error: parsed.error.issues[0]?.message || 'رمز التفعيل مطلوب' 
      }, { status: 400 });
    }

    const { code, deviceName } = parsed.data;

    const result = await authorizeDeviceByCode(code, deviceName);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: 'تم تفعيل الجهاز بنجاح كجهاز كاشير معتمد لمحل غزل',
      device: result.device,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Server error' }, { status: 500 });
  }
}
