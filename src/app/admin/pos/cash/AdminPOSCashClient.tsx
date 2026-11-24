'use client';

import React, { useState } from 'react';
import { 
  Banknote, ArrowDownLeft, ArrowUpRight, Plus, Search, 
  Calendar, CheckCircle2, AlertCircle, X, RefreshCw
} from 'lucide-react';
import { recordCashMovement } from '@/actions/pos';

interface Props {
  initialMovements: any[];
}

export default function AdminPOSCashClient({ initialMovements }: Props) {
  const [movements, setMovements] = useState<any[]>(initialMovements);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<'CASH_IN' | 'CASH_OUT'>('CASH_IN');
  const [amountStr, setAmountStr] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalInFils = movements
    .filter(m => m.type === 'CASH_IN')
    .reduce((acc, m) => acc + m.amountFils, 0);

  const totalOutFils = movements
    .filter(m => m.type === 'CASH_OUT')
    .reduce((acc, m) => acc + m.amountFils, 0);

  const netMovementFils = totalInFils - totalOutFils;

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amountStr);
    if (!val || val <= 0) {
      setErrorMsg('يرجى إدخال مبلغ صحيح بالدينار');
      return;
    }
    if (!reason.trim()) {
      setErrorMsg('يرجى توضيح سبب الحركة النقدية');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const fils = Math.round(val * 1000);
      const res = await recordCashMovement({
        type: movementType,
        amountFils: fils,
        reason: reason.trim()
      });

      if (res.success && res.movement) {
        setMovements(prev => [
          {
            id: res.movement.id,
            shiftId: res.movement.shiftId,
            terminalId: 'GHAZAL-POS-01',
            employeeName: 'الإدارة',
            type: res.movement.type,
            amountFils: res.movement.amountFils,
            reason: res.movement.reason,
            createdAt: new Date().toISOString()
          },
          ...prev
        ]);
        setIsModalOpen(false);
        setAmountStr('');
        setReason('');
      } else {
        setErrorMsg(res.error || 'فشل تسجيل الحركة النقدية');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 font-sans text-zinc-900" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Banknote className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-zinc-900 font-heading">
              حركة صندوق النقد (Cash Movement)
            </h1>
          </div>
          <p className="text-xs text-zinc-500">
            سجل إيداعات وسحوبات الصندوق (فراطة، سداد مصاريف، تغذية نقدية)
          </p>
        </div>
        <button
          onClick={() => {
            setIsModalOpen(true);
            setErrorMsg(null);
          }}
          className="px-4 py-2.5 bg-[#E6007E] hover:bg-[#c4006b] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل حركة نقدية جديدة</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
          <p className="text-xs font-bold text-zinc-500 mb-1">إجمالي الإيداعات (Cash In)</p>
          <p className="text-2xl font-black text-emerald-600" dir="ltr">
            +{(totalInFils / 1000).toFixed(3)} <span className="text-xs font-bold text-zinc-500">د.أ</span>
          </p>
          <p className="text-[11px] text-zinc-400 mt-2">تغذية الصندوق وفراطة</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
          <p className="text-xs font-bold text-zinc-500 mb-1">إجمالي السحوبات (Cash Out)</p>
          <p className="text-2xl font-black text-red-600" dir="ltr">
            -{(totalOutFils / 1000).toFixed(3)} <span className="text-xs font-bold text-zinc-500">د.أ</span>
          </p>
          <p className="text-[11px] text-zinc-400 mt-2">مصاريف ومسحوبات نقدية</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
          <p className="text-xs font-bold text-zinc-500 mb-1">صافي أثر حركات الصندوق</p>
          <p className={`text-2xl font-black ${netMovementFils >= 0 ? 'text-zinc-900' : 'text-amber-600'}`} dir="ltr">
            {(netMovementFils / 1000).toFixed(3)} <span className="text-xs font-bold text-zinc-500">د.أ</span>
          </p>
          <p className="text-[11px] text-zinc-400 mt-2">محسوبة في مطابقة الوردية</p>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-bold">
              <tr>
                <th className="p-3 text-start">نوع الحركة</th>
                <th className="p-3 text-start">المبلغ (د.أ)</th>
                <th className="p-3 text-start">السبب والتفاصيل</th>
                <th className="p-3 text-start">الموظف المسؤول</th>
                <th className="p-3 text-start">الوقت والتاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-zinc-50 transition">
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      m.type === 'CASH_IN'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {m.type === 'CASH_IN' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                      <span>{m.type === 'CASH_IN' ? 'إيداع نقد (Cash In)' : 'سحب نقد (Cash Out)'}</span>
                    </span>
                  </td>
                  <td className={`p-3 font-black text-sm ${m.type === 'CASH_IN' ? 'text-emerald-600' : 'text-red-600'}`} dir="ltr">
                    {m.type === 'CASH_IN' ? '+' : '-'}{((m.amountFils || 0) / 1000).toFixed(3)} د.أ
                  </td>
                  <td className="p-3 font-bold text-zinc-800">{m.reason}</td>
                  <td className="p-3 text-zinc-600">{m.employeeName}</td>
                  <td className="p-3 text-zinc-500" dir="ltr">
                    {new Date(m.createdAt).toLocaleString('ar-JO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-zinc-200">
            <div className="p-4 bg-zinc-900 text-white flex items-center justify-between">
              <span className="font-extrabold text-sm">تسجيل حركة نقدية في الصندوق</span>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMovement} className="p-5 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-zinc-700 mb-1.5">نوع الحركة النقدية:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementType('CASH_IN')}
                    className={`py-2.5 rounded-xl font-bold border transition ${
                      movementType === 'CASH_IN'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    إيداع نقدي (Cash In)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType('CASH_OUT')}
                    className={`py-2.5 rounded-xl font-bold border transition ${
                      movementType === 'CASH_OUT'
                        ? 'bg-red-600 text-white border-red-600 shadow-xs'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    سحب نقدي (Cash Out)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">المبلغ (بالدينار الأردني):</label>
                <input
                  type="number"
                  step="0.05"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="مثال: 15.000"
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-base font-black text-zinc-900 focus:outline-hidden focus:border-[#E6007E]"
                  dir="ltr"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">سبب الحركة / البيان:</label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="توضيح سبب الإيداع أو السحب..."
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-800 focus:outline-hidden focus:border-[#E6007E]"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 bg-[#E6007E] hover:bg-[#c4006b] disabled:opacity-50 text-white rounded-xl font-bold transition flex items-center justify-center gap-2"
                >
                  {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>حفظ وتثبيت الحركة في الصندوق</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-3 px-4 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-xl font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
