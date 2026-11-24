'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/actions/auth';
import { getPOSActiveEmployees, switchCashierEmployee } from '@/actions/employees';
import { Users, Lock, Check, AlertCircle, RefreshCw, KeyRound, Mail } from 'lucide-react';

export default function POSLoginPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(login, null);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<'quick_pin' | 'email'>('quick_pin');

  // Quick PIN Cashier State
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [pinCode, setPinCode] = useState<string>('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Check if terminal is already permanently paired
  useEffect(() => {
    try {
      const isPaired = localStorage.getItem('ghazal_pos_paired_device') === 'true';
      if (isPaired) {
        // Automatically forward to cashier workspace
        router.replace('/pos/cashier');
      }
    } catch {}

    // Load active cashiers list for the dropdown
    getPOSActiveEmployees()
      .then((list) => {
        setEmployees(list || []);
        if (list && list.length > 0) {
          setSelectedEmpId(list[0].id);
        }
      })
      .catch(() => {});
  }, [router]);

  const handleQuickPinSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedEmpId) {
      setPinError('يرجى اختيار الموظف من القائمة');
      return;
    }

    setPinLoading(true);
    setPinError(null);

    try {
      const res = await switchCashierEmployee(selectedEmpId, pinCode);
      if (res.success && res.employee) {
        try {
          localStorage.setItem('ghazal_pos_paired_device', 'true');
          localStorage.setItem('ghazal_current_cashier_name', res.employee.name);
        } catch {}
        router.push('/pos/cashier');
      } else {
        setPinError(res.error || 'رمز الـ PIN أو كلمة المرور غير صحيحة');
      }
    } catch (err: any) {
      setPinError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-900 px-4 py-8" dir="rtl">
      <div className="max-w-md w-full bg-[#1A1A1A] p-8 rounded-3xl shadow-2xl border border-zinc-800 text-white">
        {/* Header Branding */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 mb-3 flex items-center justify-center p-2 rounded-2xl bg-zinc-800/80 border border-zinc-700 shadow-inner">
            <img src="/logo.png" alt="Ghazal Logo" className="object-contain w-full h-full drop-shadow-md" />
          </div>
          <h2 className="text-center text-2xl font-black text-white font-heading tracking-wide">
            نظام كاشير غزل <span className="text-[#E6007E]">POS</span>
          </h2>
          <p className="mt-1 text-center text-xs text-zinc-400">
            بوابة تسجيل دخول كاشير محل غزل للمكياج والتجميل
          </p>
        </div>

        {/* Login Mode Toggle Tabs */}
        <div className="flex rounded-2xl bg-zinc-850 p-1 mt-6 border border-zinc-800">
          <button
            type="button"
            onClick={() => setLoginMode('quick_pin')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              loginMode === 'quick_pin'
                ? 'bg-[#E6007E] text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>الدخول السريع (PIN)</span>
          </button>
          <button
            type="button"
            onClick={() => setLoginMode('email')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              loginMode === 'email'
                ? 'bg-[#E6007E] text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>البريد الإلكتروني</span>
          </button>
        </div>

        {/* Tab 1: Fast Cashier PIN Switch / Login */}
        {loginMode === 'quick_pin' && (
          <form onSubmit={handleQuickPinSubmit} className="mt-6 space-y-4">
            {pinError && (
              <div className="p-3 bg-red-950/60 border border-red-800 text-red-200 rounded-2xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{pinError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#E6007E]" />
                <span>اختيار الموظف / الكاشير:</span>
              </label>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full p-3 bg-zinc-800 border-2 border-zinc-700 focus:border-[#E6007E] rounded-2xl text-sm font-bold text-white focus:outline-hidden transition"
              >
                {employees.length === 0 ? (
                  <option value="">جاري تحميل الموظفين...</option>
                ) : (
                  employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.roleName === 'Admin' ? 'مدير' : 'كاشير'})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#E6007E]" />
                  <span>رمز الـ PIN أو كلمة المرور:</span>
                </span>
                <span className="text-[10px] text-zinc-400">الافتراضي: 1234</span>
              </label>
              <input
                type="password"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder="••••"
                maxLength={12}
                autoFocus
                className="w-full p-3 bg-zinc-800 border-2 border-zinc-700 focus:border-[#E6007E] rounded-2xl text-center text-xl tracking-widest font-black text-white focus:outline-hidden transition"
                dir="ltr"
              />
            </div>

            {/* On-Screen Touch Keypad */}
            <div className="bg-zinc-800/60 p-2.5 rounded-2xl border border-zinc-800">
              <div className="grid grid-cols-3 gap-1.5" dir="ltr">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => setPinCode(prev => prev + digit)}
                    className="h-11 bg-zinc-700 hover:bg-[#E6007E] active:scale-95 text-white font-extrabold text-base rounded-xl transition flex items-center justify-center shadow-xs"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPinCode('')}
                  className="h-11 bg-red-900/40 hover:bg-red-800/60 active:scale-95 text-red-300 font-bold text-xs rounded-xl border border-red-800/40 transition flex items-center justify-center"
                >
                  مسح C
                </button>
                <button
                  type="button"
                  onClick={() => setPinCode(prev => prev + '0')}
                  className="h-11 bg-zinc-700 hover:bg-[#E6007E] active:scale-95 text-white font-extrabold text-base rounded-xl transition flex items-center justify-center shadow-xs"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => setPinCode(prev => prev.slice(0, -1))}
                  className="h-11 bg-amber-900/40 hover:bg-amber-800/60 active:scale-95 text-amber-300 font-bold text-xs rounded-xl border border-amber-800/40 transition flex items-center justify-center"
                >
                  ⌫
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={pinLoading}
              className="w-full py-3.5 px-4 bg-[#E6007E] hover:bg-[#c4006b] disabled:opacity-50 text-white rounded-2xl font-black text-sm shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
            >
              {pinLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>دخول الكاشير وربط الجهاز دائمياً</span>
            </button>
          </form>
        )}

        {/* Tab 2: Standard Email / Password Login */}
        {loginMode === 'email' && (
          <form className="mt-6 space-y-4" action={formAction}>
            <input type="hidden" name="loginType" value="pos" />
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-zinc-300 mb-1">
                البريد الإلكتروني
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-2xl text-white focus:outline-hidden focus:border-[#E6007E] text-sm"
                dir="ltr"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-zinc-300 mb-1">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-2xl text-white focus:outline-hidden focus:border-[#E6007E] text-sm pr-10"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-white"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            {state?.error && (
              <div className="text-red-300 text-xs text-center bg-red-950/60 p-2.5 rounded-xl border border-red-800 font-bold">
                {state.error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 px-4 rounded-2xl text-white bg-[#E6007E] hover:bg-[#c4006b] font-bold text-sm shadow-md transition disabled:opacity-50"
              >
                {isPending ? 'جاري التحقق...' : 'تسجيل الدخول'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-zinc-800 text-center">
          <p className="text-[11px] text-zinc-500">
            🔒 عند تسجيل الدخول، يتم تثبيت ربط هذا الجهاز كمحطة كاشير دائمة لفرعك دون الحاجة لتسجيل الخروج المتكرر.
          </p>
        </div>
      </div>
    </div>
  );
}
