'use client';

import React, { useState } from 'react';
import { 
  Clock, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownLeft, 
  Printer, Calendar, Users, DollarSign, X
} from 'lucide-react';

interface Props {
  initialShifts: any[];
}

export default function AdminPOSShiftsClient({ initialShifts }: Props) {
  const [shifts] = useState<any[]>(initialShifts);
  const [selectedShift, setSelectedShift] = useState<any | null>(null);

  const activeShift = shifts.find(s => s.status === 'OPEN');
  const totalVarianceFils = shifts
    .filter(s => s.varianceFils !== null && s.varianceFils !== undefined)
    .reduce((acc, s) => acc + s.varianceFils, 0);

  return (
    <div className="p-6 space-y-6 font-sans text-zinc-900" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Clock className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-zinc-900 font-heading">
              ورديات الكاشير ومطابقة الصندوق (POS Shifts)
            </h1>
          </div>
          <p className="text-xs text-zinc-500">
            متابعة فتح وإغلاق ورديات المحل، جرد النقد الفعلي، والفروقات اليومية
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
          <p className="text-xs font-bold text-zinc-500 mb-1">حالة الوردية الحالية</p>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${activeShift ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
            <span className="text-lg font-black text-zinc-900">
              {activeShift ? `مفتوحة • ${activeShift.employeeName}` : 'مغلقة حالياً'}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2">
            {activeShift ? `رصيد البداية: ${(activeShift.openingCashFils / 1000).toFixed(3)} د.أ` : 'لا توجد وردية نشطة'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
          <p className="text-xs font-bold text-zinc-500 mb-1">إجمالي الورديات المسجلة</p>
          <p className="text-2xl font-black text-zinc-900">
            {shifts.length} <span className="text-xs font-bold text-zinc-500">وردية</span>
          </p>
          <p className="text-[11px] text-zinc-400 mt-2">سجل متكامل ومؤرشف</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
          <p className="text-xs font-bold text-zinc-500 mb-1">صافي الفروقات التراكمية</p>
          <p className={`text-2xl font-black ${
            totalVarianceFils < 0 ? 'text-red-600' : totalVarianceFils > 0 ? 'text-emerald-600' : 'text-zinc-700'
          }`} dir="ltr">
            {(totalVarianceFils / 1000).toFixed(3)} <span className="text-xs font-bold text-zinc-500">د.أ</span>
          </p>
          <p className="text-[11px] text-zinc-400 mt-2">
            {totalVarianceFils === 0 ? 'مطابقة 100% بدون أي عجز' : totalVarianceFils < 0 ? 'عجز نقدي في الصندوق' : 'فائض نقدي'}
          </p>
        </div>
      </div>

      {/* Shifts Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-bold">
              <tr>
                <th className="p-3 text-start">الموظف / الكاشير</th>
                <th className="p-3 text-start">الجهاز</th>
                <th className="p-3 text-start">وقت الفتح</th>
                <th className="p-3 text-start">وقت الإغلاق</th>
                <th className="p-3 text-start">رصيد البداية</th>
                <th className="p-3 text-start">النقد المتوقع</th>
                <th className="p-3 text-start">النقد الفعلي</th>
                <th className="p-3 text-start">الفارق</th>
                <th className="p-3 text-center">الحالة</th>
                <th className="p-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium">
              {shifts.map((shift) => (
                <tr key={shift.id} className="hover:bg-zinc-50 transition">
                  <td className="p-3 font-bold text-zinc-800">{shift.employeeName}</td>
                  <td className="p-3 text-zinc-500 font-mono text-[11px]">{shift.terminalId}</td>
                  <td className="p-3 text-zinc-500" dir="ltr">
                    {new Date(shift.openedAt).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-3 text-zinc-500" dir="ltr">
                    {shift.closedAt 
                      ? new Date(shift.closedAt).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })
                      : '— مفتوحة —'
                    }
                  </td>
                  <td className="p-3 font-bold" dir="ltr">
                    {((shift.openingCashFils || 0) / 1000).toFixed(3)} د.أ
                  </td>
                  <td className="p-3 text-zinc-600" dir="ltr">
                    {shift.expectedCashFils !== null ? `${(shift.expectedCashFils / 1000).toFixed(3)} د.أ` : '—'}
                  </td>
                  <td className="p-3 font-bold text-zinc-900" dir="ltr">
                    {shift.actualCashFils !== null ? `${(shift.actualCashFils / 1000).toFixed(3)} د.أ` : '—'}
                  </td>
                  <td className="p-3">
                    {shift.varianceFils !== null && shift.varianceFils !== undefined ? (
                      <span className={`font-bold ${
                        shift.varianceFils < 0 ? 'text-red-600' : shift.varianceFils > 0 ? 'text-emerald-600' : 'text-zinc-600'
                      }`} dir="ltr">
                        {shift.varianceFils > 0 ? '+' : ''}{(shift.varianceFils / 1000).toFixed(3)} د.أ
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      shift.status === 'OPEN' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-zinc-100 text-zinc-700'
                    }`}>
                      {shift.status === 'OPEN' ? 'مفتوحة' : 'مغلقة'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => setSelectedShift(shift)}
                      className="p-1.5 text-purple-700 hover:bg-purple-50 rounded-lg font-bold"
                      title="عرض تقرير الوردية"
                    >
                      عرض التقرير
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shift Report Modal */}
      {selectedShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-zinc-200">
            <div className="p-4 bg-zinc-900 text-white flex items-center justify-between">
              <span className="font-extrabold text-sm">تقرير إغلاق الوردية</span>
              <button onClick={() => setSelectedShift(null)} className="p-1 text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3 text-xs">
              <div className="text-center pb-2 border-b border-zinc-200">
                <h3 className="font-black text-base text-[#E6007E]">GHAZAL POS • ملخص الوردية</h3>
                <p className="text-[11px] text-zinc-500">{selectedShift.employeeName} • {selectedShift.terminalId}</p>
              </div>

              <div className="space-y-1.5 text-zinc-700">
                <div className="flex justify-between">
                  <span>رصيد البداية (العهدة):</span>
                  <span className="font-bold" dir="ltr">{((selectedShift.openingCashFils || 0) / 1000).toFixed(3)} د.أ</span>
                </div>
                <div className="flex justify-between">
                  <span>النقد المتوقع في الصندوق:</span>
                  <span className="font-bold" dir="ltr">{((selectedShift.expectedCashFils || 0) / 1000).toFixed(3)} د.أ</span>
                </div>
                <div className="flex justify-between">
                  <span>النقد الفعلي المعدود:</span>
                  <span className="font-bold text-zinc-900" dir="ltr">{((selectedShift.actualCashFils || 0) / 1000).toFixed(3)} د.أ</span>
                </div>
                <div className="flex justify-between border-t border-zinc-200 pt-1.5">
                  <span className="font-bold">الفارق (عجز / زيادة):</span>
                  <span className={`font-black ${selectedShift.varianceFils < 0 ? 'text-red-600' : 'text-emerald-600'}`} dir="ltr">
                    {((selectedShift.varianceFils || 0) / 1000).toFixed(3)} د.أ
                  </span>
                </div>
                {selectedShift.notes && (
                  <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-200 text-zinc-600 mt-2">
                    <p className="font-bold mb-0.5">ملاحظات الكاشير:</p>
                    <p>{selectedShift.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة تقرير الإغلاق</span>
              </button>
              <button
                onClick={() => setSelectedShift(null)}
                className="py-2.5 px-4 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-xl font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
