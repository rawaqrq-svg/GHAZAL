'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Truck, ArrowLeft, ArrowRight, X, Clock, CheckCircle2 } from 'lucide-react';
import { getActiveOrderStatusAction, ActiveOrderStatusResult } from '@/actions/order-tracking';

interface ActiveOrderStorageData {
  reference: string;
  orderNumber?: string;
  customerName?: string;
  createdAt?: string;
}

export function ActiveOrderTopBar({ locale }: { locale?: string }) {
  const isAr = locale !== 'en';
  const [activeOrder, setActiveOrder] = useState<ActiveOrderStorageData | null>(null);
  const [orderStatus, setOrderStatus] = useState<ActiveOrderStatusResult | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const checkStatus = useCallback(async (ref: string) => {
    try {
      const res = await getActiveOrderStatusAction(ref);
      if (res.found) {
        if (res.isDelivered) {
          // Order has been delivered or cancelled: clear from device storage and hide
          localStorage.removeItem('ghazal_active_order');
          setActiveOrder(null);
          setOrderStatus(null);
          return;
        }
        setOrderStatus(res);
      }
    } catch (err) {
      console.warn('Error fetching active order status:', err);
    }
  }, []);

  const loadActiveOrder = useCallback(() => {
    try {
      const raw = localStorage.getItem('ghazal_active_order');
      if (!raw) {
        setActiveOrder(null);
        setOrderStatus(null);
        return;
      }
      const parsed: ActiveOrderStorageData = JSON.parse(raw);
      if (parsed && parsed.reference) {
        setActiveOrder(parsed);
        checkStatus(parsed.reference);
      } else {
        setActiveOrder(null);
      }
    } catch (e) {
      setActiveOrder(null);
    }
  }, [checkStatus]);

  useEffect(() => {
    setMounted(true);
    loadActiveOrder();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'ghazal_active_order') {
        loadActiveOrder();
      }
    };

    const handleCustomOrderCreated = () => {
      loadActiveOrder();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('ghazal_order_created', handleCustomOrderCreated);

    // Poll status every 35 seconds to detect when courier delivers the order
    const interval = setInterval(() => {
      const raw = localStorage.getItem('ghazal_active_order');
      if (raw) {
        try {
          const parsed: ActiveOrderStorageData = JSON.parse(raw);
          if (parsed?.reference) {
            checkStatus(parsed.reference);
          }
        } catch (e) {}
      }
    }, 35000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('ghazal_order_created', handleCustomOrderCreated);
      clearInterval(interval);
    };
  }, [loadActiveOrder, checkStatus]);

  if (!mounted || !activeOrder || isDismissed) {
    return null;
  }

  // If status query confirmed delivered or cancelled, don't show
  if (orderStatus?.isDelivered) {
    return null;
  }

  const orderRef = activeOrder.reference;
  const orderNum = orderStatus?.orderNumber || activeOrder.orderNumber || orderRef.replace('ORD-', '');
  const statusLabel = orderStatus?.statusAr || (isAr ? 'قيد المتابعة والتجهيز' : 'In Progress');
  const invoiceHref = `/${locale || 'ar'}/invoice/${orderRef}`;

  return (
    <aside 
      aria-label={isAr ? 'تنبيه الطلب الحالي' : 'Active Order Notice'}
      className="bg-zinc-950 text-white border-b border-zinc-800 text-xs py-1.5 sm:py-2 px-2.5 sm:px-6 relative z-50 transition-all shadow-md select-none"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="container mx-auto flex items-center justify-between gap-1.5 sm:gap-3 flex-nowrap">
        {/* Left / Start Info (Optimized for Mobile & Desktop) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
          {/* Live Pulsing Dot */}
          <span className="relative flex h-2 sm:h-2.5 w-2 sm:w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 sm:h-2.5 w-2 sm:w-2.5 bg-emerald-500"></span>
          </span>

          {/* Truck icon & Order text */}
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <Truck className="w-3.5 h-3.5 text-pink-400 shrink-0" />
            <span className="font-extrabold text-white text-[11px] sm:text-xs truncate">
              <span className="hidden sm:inline">{isAr ? 'لديكِ طلب حالي رقم' : 'Active order:'} </span>
              <span className="inline sm:hidden">{isAr ? 'طلبكِ' : 'Order'} </span>
              <span className="font-mono text-pink-300 font-black">#{orderNum}</span>
            </span>
          </div>

          {/* Status Label (Clean adaptive pill on screens >= 400px) */}
          <div className="hidden min-[400px]:inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-zinc-800 border border-zinc-700 text-zinc-300 shrink-0">
            <Clock className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-amber-400 shrink-0" />
            <span className="truncate max-w-[90px] sm:max-w-none">{statusLabel}</span>
          </div>
        </div>

        {/* Right / End Action & Close (Fits comfortably on all mobile screens) */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 ms-auto">
          <Link
            href={invoiceHref}
            className="inline-flex items-center gap-1 sm:gap-1.5 bg-pink-600 hover:bg-pink-700 active:scale-95 text-white px-2.5 sm:px-3 py-1 sm:py-1 rounded-lg font-bold text-[10px] sm:text-[11px] transition shadow-xs group shrink-0"
          >
            <span className="hidden sm:inline">{isAr ? 'عرض الفاتورة ومتابعة الطلب' : 'Track Order & Invoice'}</span>
            <span className="inline sm:hidden">{isAr ? 'عرض الفاتورة' : 'Invoice'}</span>
            {isAr ? (
              <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform shrink-0" />
            ) : (
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform shrink-0" />
            )}
          </Link>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            aria-label={isAr ? 'إغلاق الشريط' : 'Dismiss top bar'}
            className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
