import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return new NextResponse('Cron secret not configured on server', { status: 500 });
  }

  const authHeader = request.headers.get('authorization') || '';
  const expectedHeader = `Bearer ${cronSecret}`;

  let isAuthorized = false;
  try {
    const authBuf = Buffer.from(authHeader);
    const expBuf = Buffer.from(expectedHeader);
    isAuthorized = authBuf.length === expBuf.length && crypto.timingSafeEqual(authBuf, expBuf);
  } catch {
    isAuthorized = false;
  }

  if (!isAuthorized) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Only clean up CANCELLED orders older than 6 months to preserve financial audit trail
    // DELIVERED orders are strictly retained for VAT and accounting compliance
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const deletedOrders = await prisma.order.deleteMany({
      where: {
        status: 'CANCELLED',
        updatedAt: {
          lt: sixMonthsAgo
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedOrders.count} old cancelled orders. Financial sales records are strictly preserved.`,
      deletedCount: deletedOrders.count,
    });
  } catch (error: any) {
    console.error('CRON Cleanup Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
