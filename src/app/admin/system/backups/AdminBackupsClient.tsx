'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, HardDrive, Download, RefreshCw, CheckCircle2, 
  Lock, Calendar, Plus, AlertCircle 
} from 'lucide-react';
import { createManualBackup, BackupRecord } from '@/actions/admin-pos';

interface Props {
  initialBackups: BackupRecord[];
}

export default function AdminBackupsClient({ initialBackups }: Props) {
  const [backups, setBackups] = useState<BackupRecord[]>(initialBackups);
  const [isCreating, setIsCreating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCreateBackup = async () => {
    setIsCreating(true);
    setSuccessMsg(null);
    try {
      const res = await createManualBackup();
      if (res.success && res.backup) {
        setBackups(prev => [res.backup, ...prev]);
        setSuccessMsg('تم إنشاء النسخة الاحتياطية المشفرة بنجاح وحفظها بأمان على السيرفر المركزي.');
      }
    } catch (e: any) {
      alert(e.message || 'فشل إنشاء النسخة الاحتياطية');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-6 space-y-6 font-sans text-zinc-900" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-zinc-900 font-heading">
              النسخ الاحتياطية المشفرة (Central System Backups)
            </h1>
          </div>
          <p className="text-xs text-zinc-500">
            إدارة النسخ الاحتياطية المركزية لقاعدة البيانات وحمايتها بتشفير AES-256
          </p>
        </div>

        <button
          onClick={handleCreateBackup}
          disabled={isCreating}
          className="px-4 py-2.5 bg-[#E6007E] hover:bg-[#c4006b] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
        >
          {isCreating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          <span>إنشاء نسخة احتياطية مشفرة الآن</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Security Info Card */}
      <div className="p-4 bg-zinc-900 text-white rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm">سياسة الأمان والنسخ الاحتياطي المركزي</h3>
            <p className="text-xs text-zinc-400">
              يتم أخذ نسخ احتياطية دورية مشفرة تلقائياً كل ليلة عند الساعة 04:00 فجراً على السيرفر المركزي.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-800">
          تشفير: AES-256 GCM
        </span>
      </div>

      {/* Backups Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-bold">
              <tr>
                <th className="p-3 text-start">اسم ملف النسخة الاحتياطية</th>
                <th className="p-3 text-start">النوع</th>
                <th className="p-3 text-start">الحجم</th>
                <th className="p-3 text-start">نوع التشفير</th>
                <th className="p-3 text-start">تاريخ الإنشاء</th>
                <th className="p-3 text-start">الحالة</th>
                <th className="p-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium">
              {backups.map((b) => (
                <tr key={b.id} className="hover:bg-zinc-50 transition">
                  <td className="p-3 font-mono font-bold text-zinc-900">{b.fileName}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      b.type === 'AUTOMATIC' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {b.type === 'AUTOMATIC' ? 'تلقائية يومية' : 'يدوية من الإدارة'}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-zinc-700" dir="ltr">
                    {(b.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                  </td>
                  <td className="p-3 font-mono text-emerald-700 font-bold">{b.encryption}</td>
                  <td className="p-3 text-zinc-500" dir="ltr">{new Date(b.createdAt).toLocaleString('ar-JO')}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                      مكتملة ومؤمنة
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => alert(`جاري تنزيل الملف المشفر: ${b.fileName}`)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-xs font-bold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تحميل</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
