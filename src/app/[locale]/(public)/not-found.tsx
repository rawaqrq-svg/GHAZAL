import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الصفحة غير موجودة — 404 | غزل للمكياج والتجميل',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div
      className="min-h-screen bg-white flex items-center justify-center px-6 py-12"
      dir="rtl"
      style={{ backgroundColor: '#ffffff', colorScheme: 'only light' }}
    >
      <div className="text-center max-w-lg mx-auto">
        {/* رقم 404 بتصميم فاخر لعلامة غزل */}
        <div className="relative mb-8">
          <div className="text-[140px] sm:text-[160px] font-black font-heading text-pink-100 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[#E6007E] flex items-center justify-center shadow-lg shadow-pink-200">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008z"
                />
              </svg>
            </div>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#1A1A1A] mb-3">
          عذراً، المنتج أو الصفحة غير موجودة
        </h1>
        <p className="text-zinc-500 mb-8 leading-relaxed text-sm">
          الصفحة أو المنتج الذي تبحث عنه غير متوفر حالياً أو ربما تم نقله.
          <br />
          يمكنك العودة للمتجر واكتشاف أحدث مستحضرات التجميل والعناية المختارة.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/ar/shop"
            className="px-8 py-3 bg-[#E6007E] hover:bg-[#C5006C] text-white font-bold rounded-xl transition-colors shadow-md text-sm"
          >
            تصفح المتجر
          </Link>
          <Link
            href="/ar"
            className="px-8 py-3 border-2 border-zinc-300 text-zinc-800 font-bold rounded-xl hover:bg-zinc-100 transition-colors text-sm"
          >
            الصفحة الرئيسية
          </Link>
        </div>

        {/* روابط سريعة */}
        <div className="mt-12 pt-8 border-t border-pink-100">
          <p className="text-sm text-zinc-400 mb-4">روابط سريعة</p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { href: '/ar/shop', label: 'المتجر' },
              { href: '/ar/contact', label: 'تواصل معنا' },
              { href: '/ar/store-location', label: 'موقع المحل — عين الباشا' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-[#E6007E] hover:underline font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
