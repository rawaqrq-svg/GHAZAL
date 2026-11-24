'use client';

import React, { useState, useTransition } from 'react';
import { recordCashMovement, closeShift, openShift } from '@/actions/pos';
import { PlusCircle, MinusCircle, DollarSign, Lock, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface ShiftData {
  id: string;
  openingCashFils: number;
  status: string;
  terminalId: string;
  openedAt: string;
}

interface CashMovementItem {
  id: string;
  type: string;
  amountFils: number;
  reason: string;
  createdAt: string;
  employeeName: string;
}

export function ShiftManagementClient({
  activeShift,
  movements,
  totals,
}: {
  activeShift: ShiftData | null;
  movements: CashMovementItem[];
  totals: {
    cashSalesFils: number;
    cardSalesFils: number;
    totalCashInFils: number;
    totalCashOutFils: number;
    totalRefundFils: number;
    expectedCashFils: number;
  };
}) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Cash In/Out Modal
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<'CASH_IN' | 'CASH_OUT'>('CASH_IN');
  const [amountJod, setAmountJod] = useState('');
  const [reason, setReason] = useState('');

  // Close Shift Modal
  const [closeShiftOpen, setCloseShiftOpen] = useState(false);
  const [actualCashJod, setActualCashJod] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');

  // Open Shift Form (if no active shift)
  const [openingFloatJod, setOpeningFloatJod] = useState('50.000');
  const [terminalId, setTerminalId] = useState('POS-01');

  const handleOpenShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const fils = Math.round(parseFloat(openingFloatJod) * 1000);
    if (isNaN(fils) || fils < 0) {
      setErrorMsg('يرجى إدخال مبلغ عهدة صحيح');
      return;
    }
    startTransition(async () => {
      const res = await openShift(fils, terminalId);
      if (res.success) {
        setSuccessMsg('تم فتح الوردية بنجاح');
        window.location.reload();
      } else {
        setErrorMsg(res.error || 'فشل فتح الوردية');
      }
    });
  };

  const handleMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const fils = Math.round(parseFloat(amountJod) * 1000);
    if (isNaN(fils) || fils <= 0) {
      setErrorMsg('يرجى إدخال مبلغ صحيح');
      return;
    }
    if (!reason.trim()) {
      setErrorMsg('يرجى ذكر سبب الحركة');
      return;
    }
    startTransition(async () => {
      const res = await recordCashMovement({
        type: movementType,
        amountFils: fils,
        reason: reason.trim(),
      });
      if (res.success) {
        setSuccessMsg('تم تسجيل الحركة النقدية بنجاح');
        setMovementModalOpen(false);
        setAmountJod('');
        setReason('');
        window.location.reload();
      } else {
        setErrorMsg(res.error || 'فشل تسجيل الحركة');
      }
    });
  };

  const handleCloseShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const fils = Math.round(parseFloat(actualCashJod) * 1000);
    if (isNaN(fils) || fils < 0) {
      setErrorMsg('يرجى إدخال المبلغ المعدود فعلياً في الدرج');
      return;
    }
    startTransition(async () => {
      const res = await closeShift(fils, shiftNotes.trim());
      if (res.success) {
        setSuccessMsg('تم إغلاق الوردية ومطابقة الصندوق بنجاح');
        setCloseShiftOpen(false);
        window.location.reload();
      } else {
        setErrorMsg(res.error || 'فشل إغلاق الوردية');
      }
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Alert Notices */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border-r-4 border-red-500 rounded-lg flex items-center gap-3 text-red-800 text-sm font-bold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border-r-4 border-emerald-500 rounded-lg flex items-center gap-3 text-emerald-800 text-sm font-bold">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* If No Active Shift */}
      {!activeShift ? (
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-8 text-center max-w-md mx-auto">
          <div className="w-14 h-14 bg-[#FADAE6] text-[#E6007E] rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">لا توجد وردية مفتوحة حالياً</h2>
          <p className="text-sm text-zinc-500 mb-6">
            يرجى فتح وردية جديدة وإدخال عهدة البداية (الفكة) لبدء استقبال المبيعات وحركات الصندوق.
          </p>
          <form onSubmit={handleOpenShiftSubmit} className="space-y-4 text-start">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">المبلغ الافتتاحي بالصندوق (د.أ):</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={openingFloatJod}
                onChange={(e) => setOpeningFloatJod(e.target.value)}
                className="w-full border border-zinc-300 rounded-lg p-2.5 text-base font-bold text-zinc-900 outline-none focus:border-[#E6007E]"
                dir="ltr"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">معرف نقطة البيع / الجهاز:</label>
              <input
                type="text"
                value={terminalId}
                onChange={(e) => setTerminalId(e.target.value)}
                className="w-full border border-zinc-300 rounded-lg p-2 text-sm text-zinc-900 outline-none focus:border-[#E6007E]"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 bg-[#E6007E] hover:bg-[#C5006C] text-white font-bold rounded-lg transition-colors text-sm shadow-md disabled:opacity-50"
            >
              {isPending ? 'جاري الفتح...' : 'تأكيد فتح الوردية'}
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* Active Shift Summary Header */}
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-lg font-bold text-zinc-900">الوردية الحالية نشطة</h2>
                <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded font-mono">
                  {activeShift.terminalId}
                </span>
              </div>
              <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                تم الفتح: {new Date(activeShift.openedAt).toLocaleString('ar-JO')}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => {
                  setMovementType('CASH_IN');
                  setMovementModalOpen(true);
                }}
                className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-colors shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                إيداع نقدية (Cash In)
              </button>

              <button
                onClick={() => {
                  setMovementType('CASH_OUT');
                  setMovementModalOpen(true);
                }}
                className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-colors shadow-xs"
              >
                <MinusCircle className="w-4 h-4" />
                سحب نقدية (Cash Out)
              </button>

              <button
                onClick={() => setCloseShiftOpen(true)}
                className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-colors shadow-xs"
              >
                <Lock className="w-4 h-4" />
                إغلاق الصندوق
              </button>
            </div>
          </div>

          {/* Real-time Drawer Financial Summary Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-zinc-200">
              <span className="text-xs text-zinc-500 font-bold block mb-1">العهدة الافتتاحية:</span>
              <p className="text-xl font-extrabold text-zinc-900 font-mono">
                {(activeShift.openingCashFils / 1000).toFixed(3)} <span className="text-xs font-normal">د.أ</span>
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-zinc-200">
              <span className="text-xs text-zinc-500 font-bold block mb-1">مبيعات نقدية محصلة:</span>
              <p className="text-xl font-extrabold text-emerald-600 font-mono">
                +{(totals.cashSalesFils / 1000).toFixed(3)} <span className="text-xs font-normal">د.أ</span>
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-zinc-200">
              <span className="text-xs text-zinc-500 font-bold block mb-1">إيداعات / سحوبات نقدية:</span>
              <p className="text-sm font-bold text-zinc-800 font-mono">
                <span className="text-emerald-600">+{(totals.totalCashInFils / 1000).toFixed(3)}</span> /{' '}
                <span className="text-red-500">-{(totals.totalCashOutFils / 1000).toFixed(3)}</span>
              </p>
              <span className="text-[10px] text-zinc-400">مرتجعات: -{(totals.totalRefundFils / 1000).toFixed(3)} د.أ</span>
            </div>

            <div className="bg-[#1A1A1A] p-4 rounded-xl text-white shadow-sm border border-zinc-800">
              <span className="text-xs text-[#E6007E] font-bold block mb-1">النقد المتوقع في الدرج:</span>
              <p className="text-2xl font-extrabold font-mono text-white">
                {(totals.expectedCashFils / 1000).toFixed(3)} <span className="text-xs font-normal text-zinc-300">د.أ</span>
              </p>
            </div>
          </div>

          {/* Cash Movements Table */}
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#E6007E]" />
                سجل حركات النقدية أثناء الوردية
              </h3>
              <span className="text-xs text-zinc-400">{movements.length} حركة مسجلة</span>
            </div>

            {movements.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 text-xs">
                لا توجد حركات سحب أو إيداع نقدية في هذه الوردية حتى الآن.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs">
                  <thead className="bg-zinc-50 text-zinc-600 font-bold border-b border-zinc-100">
                    <tr>
                      <th className="p-3 text-start">الوقت</th>
                      <th className="p-3 text-start">نوع الحركة</th>
                      <th className="p-3 text-start">المبلغ</th>
                      <th className="p-3 text-start">السبب والتفاصيل</th>
                      <th className="p-3 text-start">المسؤول</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {movements.map((m) => (
                      <tr key={m.id} className="hover:bg-zinc-50/60">
                        <td className="p-3 text-zinc-500 font-mono">
                          {new Date(m.createdAt).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3">
                          {m.type === 'CASH_IN' ? (
                            <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                              إيداع نقدي
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">
                              سحب نقدي
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono font-bold">
                          {m.type === 'CASH_IN' ? '+' : '-'}
                          {(m.amountFils / 1000).toFixed(3)} د.أ
                        </td>
                        <td className="p-3 text-zinc-800 font-medium">{m.reason}</td>
                        <td className="p-3 text-zinc-500">{m.employeeName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal: Cash In / Out */}
      {movementModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5 text-start animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base text-zinc-900 mb-4">
              {movementType === 'CASH_IN' ? 'تسجيل إيداع نقدية بالصندوق (Cash In)' : 'تسجيل سحب نقدية من الصندوق (Cash Out)'}
            </h3>
            <form onSubmit={handleMovementSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">المبلغ (د.أ):</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={amountJod}
                  onChange={(e) => setAmountJod(e.target.value)}
                  placeholder="0.000"
                  className="w-full border border-zinc-300 rounded-lg p-2.5 text-base font-bold text-zinc-900 outline-none focus:border-[#E6007E]"
                  dir="ltr"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">السبب أو البيان:</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder={movementType === 'CASH_IN' ? 'مثال: تغذية فكة إضافية من الإدارة' : 'مثال: تحويل جزء من النقد للخزينة الرئيسية'}
                  className="w-full border border-zinc-300 rounded-lg p-2 text-xs text-zinc-900 outline-none focus:border-[#E6007E]"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMovementModalOpen(false)}
                  className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-lg text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2 bg-[#E6007E] hover:bg-[#C5006C] text-white font-bold rounded-lg text-xs disabled:opacity-50"
                >
                  {isPending ? 'جاري الحفظ...' : 'تأكيد الحركة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Close Shift */}
      {closeShiftOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-start animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base text-zinc-900 mb-2">إغلاق الصندوق وتسوية الوردية</h3>
            <p className="text-xs text-zinc-500 mb-4">
              قم بعد النقدية الموجودة بالدرج فعلياً وإدخالها. سيقوم النظام بحساب الفارق المالي وتثبيته.
            </p>

            <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 mb-4 text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-600 font-sans">النقد المتوقع في الدرج:</span>
                <span className="font-bold text-zinc-900">{(totals.expectedCashFils / 1000).toFixed(3)} د.أ</span>
              </div>
            </div>

            <form onSubmit={handleCloseShiftSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">النقد المعدود فعلياً (د.أ):</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={actualCashJod}
                  onChange={(e) => setActualCashJod(e.target.value)}
                  placeholder="0.000"
                  className="w-full border border-zinc-300 rounded-lg p-2.5 text-lg font-bold text-zinc-900 outline-none focus:border-[#E6007E]"
                  dir="ltr"
                  autoFocus
                  required
                />
                {actualCashJod && !isNaN(parseFloat(actualCashJod)) && (
                  <div className="mt-2 text-xs font-bold">
                    {Math.round(parseFloat(actualCashJod) * 1000) - totals.expectedCashFils === 0 ? (
                      <span className="text-emerald-600">✓ الصندوق مطابق تماماً بدون أي فارق</span>
                    ) : Math.round(parseFloat(actualCashJod) * 1000) - totals.expectedCashFils > 0 ? (
                      <span className="text-blue-600">
                        فائض نقدي: +{((Math.round(parseFloat(actualCashJod) * 1000) - totals.expectedCashFils) / 1000).toFixed(3)} د.أ
                      </span>
                    ) : (
                      <span className="text-red-600">
                        عجز نقدي: {((Math.round(parseFloat(actualCashJod) * 1000) - totals.expectedCashFils) / 1000).toFixed(3)} د.أ
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">ملاحظات الإغلاق (اختياري):</label>
                <textarea
                  value={shiftNotes}
                  onChange={(e) => setShiftNotes(e.target.value)}
                  rows={2}
                  placeholder="أي ملاحظات حول الفروقات أو حالة الدرج..."
                  className="w-full border border-zinc-300 rounded-lg p-2 text-xs text-zinc-900 outline-none focus:border-[#E6007E]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCloseShiftOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-lg text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs disabled:opacity-50"
                >
                  {isPending ? 'جاري الإغلاق...' : 'تأكيد إغلاق الوردية'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
