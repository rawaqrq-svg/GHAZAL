'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, RefreshCw, CheckCircle2, PackageCheck, Truck, Clock, XCircle, ArrowRight } from 'lucide-react';

interface Props {
  orderId: string;
  status: string;
  phone: string;
  reference: string;
  confirmAction: (orderId: string) => Promise<any>;
  cancelAction: (orderId: string) => Promise<any>;
  updateStatusAction: (orderId: string, status: string, shippingCost?: number) => Promise<any>;
}

export function AdminOrderQuickActions({ 
  orderId,
  status,
  phone,
  reference,
  confirmAction,
  cancelAction,
  updateStatusAction
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Map any status to its official tab
  const getTargetTab = (st: string) => {
    switch (st) {
      case 'NEW':
      case 'PENDING':
      case 'AWAITING_WHATSAPP':
        return 'NEW';
      case 'PREPARING':
      case 'CONFIRMED':
      case 'CONFIRMED_PREPARING':
        return 'PREPARING';
      case 'PREPARED':
      case 'READY_FOR_DELIVERY':
      case 'AWAITING_DELIVERY':
        return 'PREPARED';
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY':
      case 'WITH_COURIER':
        return 'SHIPPED';
      case 'DELIVERED':
      case 'COMPLETED':
        return 'COMPLETED';
      case 'CANCELLED':
        return 'CANCELLED';
      default:
        return 'NEW';
    }
  };

  const handleUpdate = (newStatus: string, openWhatsApp: boolean = false) => {
    if (openWhatsApp) {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const msg = encodeURIComponent(`مرحباً بكِ في محل غزل للمكياج والتجميل (عين الباشا - شارع القدس) 💄✨\nتم تأكيد طلبكِ رقم #${reference} وهو الآن قيد التجهيز بعناية!\n\nرابط فاتورتكِ الرسمية:\n${baseUrl}/ar/invoice/${orderId}\n\nشكراً لاختياركِ غزل!`);
      const cleanPhone = phone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
    }

    startTransition(async () => {
      try {
        if (newStatus === 'PREPARING' && (status === 'PENDING' || status === 'AWAITING_WHATSAPP' || status === 'NEW')) {
          try {
            await confirmAction(orderId);
          } catch (e) {
            console.warn('Confirm action bypassed, applying status update');
          }
          await updateStatusAction(orderId, newStatus);
        } else if (newStatus === 'CANCELLED') {
          try {
            await cancelAction(orderId);
          } catch (e) {
            await updateStatusAction(orderId, newStatus);
          }
        } else {
          const res = await updateStatusAction(orderId, newStatus);
          if (!res?.success) {
            alert(res?.error || 'حدث خطأ أثناء تحديث الحالة');
            return;
          }
        }
      } catch (err) {
        console.error('Status update transition error:', err);
      }

      // الانتقال فوراً لتبويب حالة الطلب الجديدة
      const targetTab = getTargetTab(newStatus);
      router.push(`/admin/orders?tab=${targetTab}`);
      router.refresh();
    });
  };

  const isNew = status === 'NEW' || status === 'PENDING' || status === 'AWAITING_WHATSAPP';
  const isPreparing = status === 'PREPARING' || status === 'CONFIRMED' || status === 'CONFIRMED_PREPARING';
  const isPrepared = status === 'PREPARED' || status === 'READY_FOR_DELIVERY';
  const isShipped = status === 'SHIPPED' || status === 'OUT_FOR_DELIVERY';
  const isCompleted = status === 'DELIVERED' || status === 'COMPLETED';
  const isCancelled = status === 'CANCELLED';

  if (isCompleted) {
    return (
      <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-black space-y-1.5 shadow-2xs">
        <div className="flex items-center gap-2 text-sm text-emerald-800 font-extrabold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>الطلب مكتمل ومسلّم للزبونة بنجاح ✓</span>
        </div>
        <p className="text-[11px] text-emerald-700 font-bold leading-relaxed">
          تم قفل الطلب نهائياً — لا يمكن تعديل حالته أو إضافة أصناف أو حذفها نهائياً بعد اكتمال التسليم.
        </p>
      </div>
    );
  }

  if (isCancelled) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs font-black space-y-1.5 shadow-2xs">
        <div className="flex items-center gap-2 text-sm text-rose-800 font-extrabold">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>تم إلغاء هذا الطلب ✗</span>
        </div>
        <p className="text-[11px] text-rose-700 font-bold leading-relaxed">
          الطلب ملغي ومغلق نهائياً — لا يمكن إعادة تعديل حالته أو إضافة أصناف أو حذفها نهائياً.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Step-by-Step Progress Action Buttons */}
      <div className="space-y-2.5">
        {isNew && (
          <>
            <button 
              type="button"
              onClick={() => handleUpdate('PREPARING', true)}
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold py-3 px-4 rounded-xl shadow-xs text-xs flex items-center justify-center gap-2 w-full transition-colors cursor-pointer"
            >
              {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
              <span>تأكيد الطلب وبدء التجهيز + واتساب</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button 
              type="button"
              onClick={() => handleUpdate('CANCELLED', false)}
              disabled={isPending}
              className="bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 disabled:opacity-50 font-bold py-2 px-4 rounded-xl text-xs w-full transition-colors cursor-pointer"
            >
              إلغاء الطلب (ملغي)
            </button>
          </>
        )}

        {isPreparing && (
          <>
            <button 
              type="button"
              onClick={() => handleUpdate('PREPARED', false)}
              disabled={isPending}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-extrabold py-3 px-4 rounded-xl shadow-xs text-xs flex items-center justify-center gap-2 w-full transition-colors cursor-pointer"
            >
              {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-4 h-4" />}
              <span>تم التجهيز — بانتظار استلام المندوب</span>
            </button>
            <button 
              type="button"
              onClick={() => handleUpdate('CANCELLED', false)}
              disabled={isPending}
              className="bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 disabled:opacity-50 font-bold py-2 px-4 rounded-xl text-xs w-full transition-colors cursor-pointer"
            >
              إلغاء الطلب (ملغي)
            </button>
          </>
        )}

        {isPrepared && (
          <div className="p-4 bg-purple-50/90 border-2 border-purple-200 rounded-2xl text-xs space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 text-sm font-black text-purple-900">
              <PackageCheck className="w-5 h-5 text-purple-600 shrink-0" />
              <span>الطلب جاهز بانتظار التوصيل 📦</span>
            </div>
            <p className="text-[11px] text-purple-800 font-bold leading-relaxed">
              المكان الوحيد لتغيير حالة هذا الطلب هو من خلال <strong>طلبيات شركة التوصيل</strong>. يتم تحديد هذا الطلب هناك وإنشاء طلبية شحن وتحديد رقم لها لتغيير حالتها ومتابعتها.
            </p>
            <Link 
              href="/admin/deliveries"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs transition shadow-xs active:scale-95 cursor-pointer"
            >
              <Truck className="w-4 h-4" />
              <span>الانتقال إلى طلبيات شركة التوصيل 🚚</span>
            </Link>
          </div>
        )}

        {isShipped && (
          <>
            <button 
              type="button"
              onClick={() => handleUpdate('DELIVERED', false)}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold py-3 px-4 rounded-xl shadow-xs text-xs flex items-center justify-center gap-2 w-full transition-colors cursor-pointer"
            >
              {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>تم توصيل الطلب بنجاح (مكتمل)</span>
            </button>
            <button 
              type="button"
              onClick={() => handleUpdate('CANCELLED', false)}
              disabled={isPending}
              className="bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 disabled:opacity-50 font-bold py-2 px-4 rounded-xl text-xs w-full transition-colors cursor-pointer"
            >
              فشل التوصيل / إلغاء الطلب
            </button>
          </>
        )}
      </div>
    </div>
  );
}
