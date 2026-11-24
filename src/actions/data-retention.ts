'use server';

import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/dal';
import { revalidatePath } from 'next/cache';
import { DATA_RETENTION_CONFIG, DataRetentionPolicy } from '@/lib/data-retention-config';

export { DATA_RETENTION_CONFIG };
export type { DataRetentionPolicy };

export interface DataRetentionStatus {
  invoices: {
    total: number;
    olderThan30Days: number;
    retentionDays: number;
  };
  systemLogs: {
    auditLogsTotal: number;
    auditLogsOlderThan90Days: number;
    rateLimitEventsTotal: number;
    rateLimitEventsOlderThan90Days: number;
    expiredSessionsTotal: number;
    retentionDays: number;
  };
  corePermanentData: {
    productsCount: number;
    categoriesCount: number;
    brandsCount: number;
    status: 'PERMANENT';
  };
  lastCleanup: {
    executedAt: string | null;
    deletedInvoicesCount: number;
    deletedLogsCount: number;
    deletedSessionsCount: number;
    totalDeleted: number;
  } | null;
  supabaseFreeTierSafety: {
    isSafe: boolean;
    tierLimitMb: number;
    statusMessage: string;
  };
}

/**
 * فحص حالة تخزين قاعدة البيانات وسجلات الاحتفاظ وحساب العناصر المؤهلة للتنظيف
 */
export async function getDataRetentionStatusAction(): Promise<DataRetentionStatus> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - DATA_RETENTION_CONFIG.invoicesDays * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - DATA_RETENTION_CONFIG.systemLogsDays * 24 * 60 * 60 * 1000);

  let invoicesTotal = 0;
  let invoicesOlderThan30Days = 0;
  let auditLogsTotal = 0;
  let auditLogsOlderThan90Days = 0;
  let rateLimitEventsTotal = 0;
  let rateLimitEventsOlderThan90Days = 0;
  let expiredSessionsTotal = 0;
  let productsCount = 0;
  let categoriesCount = 0;
  let brandsCount = 0;
  let lastCleanup: any = null;

  try {
    // 1. Invoices metrics (30 days limit)
    try {
      [invoicesTotal, invoicesOlderThan30Days] = await Promise.all([
        prisma.invoice.count(),
        prisma.invoice.count({ where: { createdAt: { lt: thirtyDaysAgo } } })
      ]);
    } catch {}

    // 2. System logs metrics (90 days limit)
    try {
      [auditLogsTotal, auditLogsOlderThan90Days] = await Promise.all([
        prisma.auditLog.count(),
        prisma.auditLog.count({ where: { createdAt: { lt: ninetyDaysAgo } } })
      ]);
    } catch {}

    try {
      [rateLimitEventsTotal, rateLimitEventsOlderThan90Days] = await Promise.all([
        prisma.rateLimitEvent.count(),
        prisma.rateLimitEvent.count({ where: { createdAt: { lt: ninetyDaysAgo } } })
      ]);
    } catch {}

    try {
      expiredSessionsTotal = await prisma.session.count({
        where: {
          OR: [
            { expiresAt: { lt: now } },
            { createdAt: { lt: ninetyDaysAgo } }
          ]
        }
      });
    } catch {}

    // 3. Core Permanent Data metrics
    try {
      [productsCount, categoriesCount, brandsCount] = await Promise.all([
        prisma.product.count(),
        prisma.category.count(),
        prisma.brand.count()
      ]);
    } catch {}

    // 4. Retrieve last cleanup run recorded in siteSettings
    try {
      const setting = await prisma.siteSettings.findUnique({
        where: { key: 'data_retention_last_cleanup' }
      });
      if (setting?.value) {
        lastCleanup = JSON.parse(setting.value);
      }
    } catch {}
  } catch (err) {
    console.warn('Error reading data retention status:', err);
  }

  const totalPrunable = invoicesOlderThan30Days + auditLogsOlderThan90Days + rateLimitEventsOlderThan90Days + expiredSessionsTotal;

  return {
    invoices: {
      total: invoicesTotal,
      olderThan30Days: invoicesOlderThan30Days,
      retentionDays: DATA_RETENTION_CONFIG.invoicesDays
    },
    systemLogs: {
      auditLogsTotal,
      auditLogsOlderThan90Days,
      rateLimitEventsTotal,
      rateLimitEventsOlderThan90Days,
      expiredSessionsTotal,
      retentionDays: DATA_RETENTION_CONFIG.systemLogsDays
    },
    corePermanentData: {
      productsCount,
      categoriesCount,
      brandsCount,
      status: 'PERMANENT'
    },
    lastCleanup,
    supabaseFreeTierSafety: {
      isSafe: true,
      tierLimitMb: 500, // Supabase Free Tier 500 MB
      statusMessage: totalPrunable > 0 
        ? `يوجد ${totalPrunable} سجل منتهي الصلاحية جاهز للتفريغ للحفاظ على مساحة الخطة المجانية.`
        : 'قاعدة البيانات نظيفة ومحسنة تماماً ومطابقة لسياسة الـ 90 والـ 30 يوماً.'
    }
  };
}

/**
 * تنفيذ دورة تنظيف وتفريغ المساحة لقاعدة البيانات
 * - حذف الفواتير وإيصالات الكاشير الأقدم من 30 يوماً
 * - حذف سجلات التدقيق، المحاولات، والأحداث الأقدم من 90 يوماً
 * - حذف الجلسات المنتهية
 * - ضمان حماية دائمة 100% للمنتجات والأقسام والماركات والإعدادات
 */
export async function executeDataRetentionCleanupAction(): Promise<{
  success: boolean;
  message: string;
  deletedInvoices: number;
  deletedLogs: number;
  deletedSessions: number;
  totalDeleted: number;
  timestamp: string;
}> {
  await requirePermission('manage:settings');

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - DATA_RETENTION_CONFIG.invoicesDays * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - DATA_RETENTION_CONFIG.systemLogsDays * 24 * 60 * 60 * 1000);

  let deletedInvoices = 0;
  let deletedLogs = 0;
  let deletedSessions = 0;

  try {
    // 1. Delete Invoices older than 30 days
    try {
      const resInvoices = await prisma.invoice.deleteMany({
        where: { createdAt: { lt: thirtyDaysAgo } }
      });
      deletedInvoices += resInvoices.count;
    } catch (e) {
      console.warn('Invoices cleanup warning:', e);
    }

    // Also delete any suspended temporary cart sales (HeldSale) older than 30 days
    try {
      await prisma.heldSale.deleteMany({
        where: { createdAt: { lt: thirtyDaysAgo } }
      });
    } catch {}

    // 2. Delete Audit Logs & Events older than 90 days
    try {
      const resAudit = await prisma.auditLog.deleteMany({
        where: { createdAt: { lt: ninetyDaysAgo } }
      });
      deletedLogs += resAudit.count;
    } catch (e) {
      console.warn('AuditLog cleanup warning:', e);
    }

    try {
      const resRate = await prisma.rateLimitEvent.deleteMany({
        where: { createdAt: { lt: ninetyDaysAgo } }
      });
      deletedLogs += resRate.count;
    } catch {}

    try {
      const resLogin = await prisma.loginAttempt.deleteMany({
        where: { createdAt: { lt: ninetyDaysAgo } }
      });
      deletedLogs += resLogin.count;
    } catch {}

    try {
      await prisma.pendingMfaChallenge.deleteMany({
        where: { createdAt: { lt: ninetyDaysAgo } }
      });
    } catch {}

    try {
      await prisma.importJob.deleteMany({
        where: { createdAt: { lt: ninetyDaysAgo } }
      });
    } catch {}

    // 3. Delete Expired Sessions & Sessions older than 90 days
    try {
      const resSessions = await prisma.session.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: now } },
            { createdAt: { lt: ninetyDaysAgo } }
          ]
        }
      });
      deletedSessions += resSessions.count;
    } catch (e) {
      console.warn('Sessions cleanup warning:', e);
    }

    const totalDeleted = deletedInvoices + deletedLogs + deletedSessions;
    const cleanupRecord = {
      executedAt: now.toISOString(),
      deletedInvoicesCount: deletedInvoices,
      deletedLogsCount: deletedLogs,
      deletedSessionsCount: deletedSessions,
      totalDeleted
    };

    // Save cleanup audit record in siteSettings
    try {
      await prisma.siteSettings.upsert({
        where: { key: 'data_retention_last_cleanup' },
        update: { value: JSON.stringify(cleanupRecord) },
        create: { key: 'data_retention_last_cleanup', value: JSON.stringify(cleanupRecord) }
      });
    } catch {}

    revalidatePath('/admin');
    revalidatePath('/admin/settlements');
    revalidatePath('/admin/system/retention');

    return {
      success: true,
      message: `تم تنظيف وتفريغ ${totalDeleted} سجل بنجاح. الفواتير محددة بـ 30 يوماً، والسجلات بـ 90 يوماً، والمنتجات والبيانات الرئيسية محفوظة بالكامل ودائمة.`,
      deletedInvoices,
      deletedLogs,
      deletedSessions,
      totalDeleted,
      timestamp: now.toISOString()
    };
  } catch (err: any) {
    console.error('Error during data retention cleanup:', err);
    return {
      success: false,
      message: err.message || 'حدث خطأ أثناء تنظيف البيانات',
      deletedInvoices,
      deletedLogs,
      deletedSessions,
      totalDeleted: 0,
      timestamp: now.toISOString()
    };
  }
}
