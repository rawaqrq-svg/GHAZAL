import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

/**
 * Cron Job — تنظيف أحداث Rate Limiting المنتهية الصلاحية
 * يُنفَّذ يومياً الساعة 2 صباحاً
 */
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
    const now = new Date();

    // حذف أحداث Rate Limit المنتهية
    const deleted = await prisma.rateLimitEvent.deleteMany({
      where: {
        expireAt: { lt: now },
      },
    });

    // حذف MFA Challenges المنتهية
    const deletedMfa = await prisma.pendingMfaChallenge.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    });

    // حذف Sessions المنتهية
    const deletedSessions = await prisma.session.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    });

    return NextResponse.json({
      success: true,
      deleted: {
        rateLimitEvents: deleted.count,
        mfaChallenges: deletedMfa.count,
        sessions: deletedSessions.count,
      },
    });
  } catch (error) {
    console.error('[Cron cleanup-ratelimits] Error:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
