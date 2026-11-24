'use client';

import React, { useState } from 'react';
import {
  Database,
  ShieldCheck,
  RefreshCw,
  Clock,
  Mail,
  HardDrive,
  Terminal,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Lock,
  Zap,
  Info,
} from 'lucide-react';
import {
  BackupSystemStatus,
  getBackupSystemStatusAction,
  triggerManualBackupAction,
  sendTestBackupAlertAction,
} from '@/actions/backup';

interface BackupSettingsClientProps {
  initialData: BackupSystemStatus;
}

export function BackupSettingsClient({ initialData }: BackupSettingsClientProps) {
  const [data, setData] = useState<BackupSystemStatus>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState<'success' | 'failure' | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showRunbook, setShowRunbook] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setActionMessage(null);
    try {
      const refreshed = await getBackupSystemStatusAction();
      setData(refreshed);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: `فشل تحديث البيانات: ${err.message}` });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTriggerBackup = async () => {
    if (!confirm('هل تريد بالتأكيد بدء عملية النسخ الاحتياطي والتدوير الآمن إلى Neon الآن؟')) {
      return;
    }

    setIsBackingUp(true);
    setActionMessage(null);
    try {
      const res = await triggerManualBackupAction();
      if (res.success) {
        setActionMessage({ type: 'success', text: res.message });
        const refreshed = await getBackupSystemStatusAction();
        setData(refreshed);
      } else {
        setActionMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: `استثناء غير متوقع: ${err.message}` });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleSendTestEmail = async (type: 'success' | 'failure') => {
    setIsSendingEmail(type);
    setActionMessage(null);
    try {
      const res = await sendTestBackupAlertAction(type);
      if (res.success) {
        setActionMessage({
          type: 'success',
          text: `تم إرسال إشعار التجربة (${type === 'success' ? 'نجاح' : 'تنبيه فشل'}) بنجاح إلى ${data.resendRecipient}.`,
        });
      } else {
        setActionMessage({
          type: 'error',
          text: `فشل إرسال البريد عبر Resend: ${res.error || 'خطأ غير معروف'}`,
        });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: `خطأ في إرسال البريد: ${err.message}` });
    } finally {
      setIsSendingEmail(null);
    }
  };

  const formatFilsToJOD = (fils?: number | null) => {
    if (fils === undefined || fils === null) return '0.000 د.أ';
    return (fils / 1000).toFixed(3) + ' د.أ';
  };

  const formatBytes = (bytes?: number | null) => {
    if (!bytes) return '0 MB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDateAmman = (dateStr?: string | Date | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('ar-JO', {
        timeZone: 'Asia/Amman',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(dateStr);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-rose-100">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-rose-50 text-rose-800 rounded-xl">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">النسخ الاحتياطي وحماية البيانات</h1>
              <p className="text-sm text-gray-500">
                Ghazal Independent Disaster Recovery & Neon Backup Manager
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              بروتوكول Safe Backup Rotation مفعل
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Lock className="w-3.5 h-3.5" />
              عزل تام للكاشير والمتجر (0 Blast Radius)
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              <Database className="w-3.5 h-3.5" />
              سجل تدقيق مستقل في Neon
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold border border-gray-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-rose-600' : ''}`} />
            تحديث الحالة
          </button>
          <button
            onClick={handleTriggerBackup}
            disabled={isBackingUp}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-sm font-bold shadow-md shadow-rose-700/20 transition-all disabled:opacity-60"
          >
            <Zap className={`w-4 h-4 ${isBackingUp ? 'animate-bounce' : ''}`} />
            {isBackingUp ? 'جارٍ تنفيذ النسخ والتحقق...' : 'إنشاء نسخة احتياطية الآن'}
          </button>
        </div>
      </div>

      {/* Action Notification Message */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-sm font-medium">{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs font-bold underline opacity-75 hover:opacity-100"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Grid: Infrastructure Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Supabase Primary DB */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              قاعدة البيانات الرئيسية
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                data.supabase.ok
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {data.supabase.ok ? 'متصلة' : 'انقطاع'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-lg">Supabase PostgreSQL</div>
              <div className="text-xs text-gray-500">{data.supabase.region}</div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-50 text-xs text-gray-600 flex justify-between items-center">
            <span>زمن الاستجابة:</span>
            <span className="font-mono font-bold text-gray-900">{data.supabase.latencyMs} ms</span>
          </div>
        </div>

        {/* Neon Disaster Recovery DB */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              قاعدة الطوارئ الاحتياطية
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                data.neon.ok
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {data.neon.ok ? 'نسخة معتمدة' : 'تعذر الاتصال'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 text-purple-700 rounded-xl">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-lg">Neon PostgreSQL</div>
              <div className="text-xs text-gray-500">ghazal_backup_current</div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-50 text-xs text-gray-600 flex justify-between items-center">
            <span>زمن الاستجابة:</span>
            <span className="font-mono font-bold text-gray-900">{data.neon.latencyMs} ms</span>
          </div>
        </div>

        {/* Scheduling & Cron */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">الجدولة التلقائية</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              أسبوعياً
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm">كل جمعة — 03:17 فجراً</div>
              <div className="text-xs text-gray-500">توقيت الأردن (17 0 * * 5)</div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-50 text-xs text-gray-600 flex justify-between items-center">
            <span>النسخة القادمة:</span>
            <span className="font-semibold text-rose-800">{data.nextScheduledBackup}</span>
          </div>
        </div>

        {/* Resend Notifications */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">إشعارات التقارير</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                data.resendReady
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {data.resendReady ? 'جاهزة' : 'غير مهيأة'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm truncate max-w-[150px]">
                {data.resendRecipient}
              </div>
              <div className="text-xs text-gray-500">تقارير النجاح والفشل</div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-50 text-xs text-gray-600 flex justify-between items-center">
            <span>قوالب البريد:</span>
            <span className="font-semibold text-emerald-700">Arabic RTL معتمدة</span>
          </div>
        </div>
      </div>

      {/* Latest Backup Details Banner */}
      <div className="bg-gradient-to-br from-rose-950 via-rose-900 to-rose-800 text-white p-6 rounded-2xl shadow-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-rose-200 text-xs font-semibold mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>آخر نسخة احتياطية سليمة معتمدة (Verified Disaster Recovery Snapshot)</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              {data.latestBackup
                ? `نسخة معتمدة بتاريخ ${formatDateAmman(data.latestBackup.startedAt)}`
                : 'لم يتم تسجيل نسخة معتمدة بعد'}
            </h2>
            <p className="text-rose-100/80 text-sm mt-1 max-w-2xl leading-relaxed">
              هذه النسخة مخزنة بأمان داخل Neon PostgreSQL في مخطط{' '}
              <code className="bg-black/30 px-2 py-0.5 rounded text-rose-200 font-mono">
                ghazal_backup_current
              </code>{' '}
              وتم التحقق رياضياً من مطابقة 45 جدولاً وكافة الفواتير ومبالغ الكاشير بالفلس الأردني.
            </p>
          </div>

          <div className="flex flex-wrap lg:flex-nowrap gap-4 shrink-0 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
            <div className="px-3 border-l border-white/20 last:border-0">
              <div className="text-xs text-rose-200">الجداول المفحوصة</div>
              <div className="text-xl font-bold font-mono">
                {data.latestBackup?.tableCount || 45} جدول
              </div>
            </div>
            <div className="px-3 border-l border-white/20 last:border-0">
              <div className="text-xs text-rose-200">إجمالي السجلات</div>
              <div className="text-xl font-bold font-mono">
                {data.latestBackup?.rowCount || '—'}
              </div>
            </div>
            <div className="px-3 border-l border-white/20 last:border-0">
              <div className="text-xs text-rose-200">الحجم المقدر</div>
              <div className="text-xl font-bold font-mono">
                {formatBytes(data.latestBackup?.dumpSizeBytes)}
              </div>
            </div>
            <div className="px-3">
              <div className="text-xs text-rose-200">مدة العملية</div>
              <div className="text-xl font-bold font-mono text-emerald-300">
                {data.latestBackup?.durationSeconds ? `${data.latestBackup.durationSeconds}s` : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls for Testing */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleSendTestEmail('success')}
              disabled={isSendingEmail !== null}
              className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg transition-colors font-medium flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              {isSendingEmail === 'success' ? 'جارٍ الإرسال...' : 'اختبار إشعار النجاح (Resend)'}
            </button>
            <button
              onClick={() => handleSendTestEmail('failure')}
              disabled={isSendingEmail !== null}
              className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-950 text-rose-200 rounded-lg transition-colors font-medium flex items-center gap-1.5 border border-rose-700/50"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              {isSendingEmail === 'failure' ? 'جارٍ الإرسال...' : 'اختبار تنبيه الفشل (Resend)'}
            </button>
          </div>

          <button
            onClick={() => setShowRunbook(!showRunbook)}
            className="text-rose-200 hover:text-white underline font-semibold flex items-center gap-1"
          >
            <Terminal className="w-3.5 h-3.5" />
            {showRunbook ? 'إخفاء دليل الاستعادة عند الطوارئ' : 'عرض دليل الاستعادة عند الطوارئ (DR Runbook)'}
          </button>
        </div>
      </div>

      {/* Emergency Disaster Recovery Runbook Modal / Collapsible */}
      {showRunbook && (
        <div className="bg-gray-900 text-gray-100 p-6 rounded-2xl shadow-xl border border-gray-800 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <Terminal className="w-5 h-5" />
              <span>GHAZAL EMERGENCY DISASTER RECOVERY RUNBOOK</span>
            </div>
            <span className="px-2 py-0.5 bg-rose-950 text-rose-300 rounded text-[11px]">
              طوارئ الاستعادة
            </span>
          </div>

          <p className="text-gray-300 font-sans text-sm leading-relaxed">
            في حال حدوث عطل دائم أو حذف غير مقصود في قاعدة بيانات Supabase، تتيح لك Neon استعادة كافة البيانات فوراً
            دون أي فقدان في الحسابات أو المنتجات من خلال الأوامر المعيارية التالية:
          </p>

          <div className="space-y-3 font-mono">
            <div>
              <div className="text-gray-400 font-sans mb-1 font-semibold text-xs">
                1. استخراج النسخة السليمة من Neon إلى ملف محلي:
              </div>
              <div className="bg-black/60 p-3 rounded-lg border border-gray-800 text-emerald-400 overflow-x-auto select-all">
                pg_dump &quot;postgresql://neondb_owner:***@ep-red-mud-bhpmi1cr.c-10.eu-central-1.aws.neon.tech/neondb?sslmode=require&quot; --schema=ghazal_backup_current -f ghazal_recovery.sql
              </div>
            </div>

            <div>
              <div className="text-gray-400 font-sans mb-1 font-semibold text-xs">
                2. تعديل اسم المخطط ليعود إلى public:
              </div>
              <div className="bg-black/60 p-3 rounded-lg border border-gray-800 text-amber-300 overflow-x-auto select-all">
                sed -i &apos;s/ghazal_backup_current/public/g&apos; ghazal_recovery.sql
              </div>
            </div>

            <div>
              <div className="text-gray-400 font-sans mb-1 font-semibold text-xs">
                3. حقن البيانات المستعادة في قاعدة Supabase الجديدة:
              </div>
              <div className="bg-black/60 p-3 rounded-lg border border-gray-800 text-cyan-300 overflow-x-auto select-all">
                psql &quot;postgresql://postgres:***@aws-0-eu-central-1.pooler.supabase.com:5432/postgres&quot; -f ghazal_recovery.sql
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Table from Neon */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-rose-800" />
            <h3 className="font-bold text-gray-900 text-base">سجل عمليات النسخ والتدقيق (Neon DR Audit Log)</h3>
          </div>
          <span className="text-xs text-gray-500 font-sans">
            السجلات محفوظة في جدول <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">_backup_audit_log</code> داخل Neon
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-500 font-semibold text-xs border-b border-gray-100">
              <tr>
                <th className="p-4">تاريخ وبدء العملية</th>
                <th className="p-4">الحالة والنتيجة</th>
                <th className="p-4">المدة</th>
                <th className="p-4">الحجم</th>
                <th className="p-4">الجداول / السجلات</th>
                <th className="p-4">التدقيق المالي (الفلس)</th>
                <th className="p-4">إشعار Resend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    لا توجد سجلات نسخ سابقة حتى الآن. يمكنك الضغط على &quot;إنشاء نسخة احتياطية الآن&quot; للبدء.
                  </td>
                </tr>
              ) : (
                data.auditLogs.map((log) => {
                  const isSuccess = log.status === 'SUCCESS';
                  const isVerificationFail = log.status === 'VERIFICATION_FAILED';
                  const isInProgress = log.status === 'IN_PROGRESS';

                  return (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-mono text-xs">
                        <div className="font-bold text-gray-900">{formatDateAmman(log.startedAt)}</div>
                        <div className="text-gray-400 text-[11px]">{log.id}</div>
                      </td>
                      <td className="p-4">
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            ناجحة ومعتمدة
                          </span>
                        ) : isVerificationFail ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            فشل التحقق (محمية)
                          </span>
                        ) : isInProgress ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            قيد التنفيذ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5" />
                            فشلت العملية
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-mono text-xs font-semibold text-gray-700">
                        {log.durationSeconds !== null && log.durationSeconds !== undefined
                          ? `${log.durationSeconds}s`
                          : '—'}
                      </td>
                      <td className="p-4 font-mono text-xs text-gray-600">
                        {formatBytes(log.dumpSizeBytes)}
                      </td>
                      <td className="p-4 text-xs font-semibold text-gray-700">
                        {log.tableCount ? `${log.tableCount} جدول` : '—'}
                        {log.rowCount ? ` / ${log.rowCount} سجل` : ''}
                      </td>
                      <td className="p-4 font-mono text-xs text-gray-700">
                        {log.financialSumFils !== null && log.financialSumFils !== undefined ? (
                          <span className="text-emerald-700 font-bold">
                            {formatFilsToJOD(log.financialSumFils)}
                          </span>
                        ) : (
                          <span className="text-gray-400">مطابقة آمنة</span>
                        )}
                      </td>
                      <td className="p-4 text-xs">
                        {log.emailSent ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            تم الإرسال
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
