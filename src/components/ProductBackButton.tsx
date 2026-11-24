'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export function ProductBackButton({ locale = 'ar' }: { locale?: string }) {
  const router = useRouter();
  const isAr = locale === 'ar';

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(`/${locale}/shop`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200/80 bg-white hover:bg-pink-50 hover:border-pink-300 text-zinc-700 hover:text-[#E6007E] text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
      title={isAr ? 'الرجوع للمتجر أو الصفحة السابقة' : 'Go Back'}
    >
      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180 text-zinc-500 hover:text-[#E6007E]" />
      <span>{isAr ? 'رجوع' : 'Back'}</span>
    </button>
  );
}
