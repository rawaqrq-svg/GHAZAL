import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, pin } = body;

    // Fast PIN check (1234 or 0000)
    if (pin === '1234' || pin === '0000') {
      return NextResponse.json({
        success: true,
        user: {
          id: 'emp-cashier-01',
          name: 'كاشير غزل — الوردية المعتمدة',
          email: 'cashier@ghazal.jo',
          role: 'CASHIER',
        },
        token: `pin_session_${Date.now()}`,
      });
    }

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'البريد وكلمة المرور أو رقم PIN مطلوب' }, { status: 400 });
    }

    const isCashier = (email === 'cashier@ghazal.jo' || email.includes('cashier')) && (password === 'Cashier2026!' || password === '1234');
    const isAdmin = (email === 'admin@ghazal.jo' || email.includes('admin')) && (password === 'AdminPassword2026!');

    if (isCashier) {
      return NextResponse.json({
        success: true,
        user: {
          id: 'emp-cashier-01',
          name: 'كاشير غزل — عين الباشا',
          email: 'cashier@ghazal.jo',
          role: 'CASHIER',
        },
        token: `cashier_session_${Date.now()}`,
      });
    }

    if (isAdmin) {
      return NextResponse.json({
        success: true,
        user: {
          id: 'emp-admin-01',
          name: 'المدير العام — غزل للمكياج',
          email: 'admin@ghazal.jo',
          role: 'ADMIN',
        },
        token: `admin_session_${Date.now()}`,
      });
    }

    return NextResponse.json({ success: false, error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Login failed' }, { status: 500 });
  }
}
