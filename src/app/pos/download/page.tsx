import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Download, 
  Monitor, 
  ShieldCheck, 
  Printer, 
  ScanBarcode, 
  CheckCircle2, 
  Sparkles,
  Zap,
  HardDrive
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'تحميل برنامج كاشير غزل (GHAZAL POS) | نسخة Windows 10/11',
  description: 'تحميل برنامج كاشير غزل لمستحضرات التجميل لسطح المكتب Windows مع دعم الطابعات الحرارية وقارئ الباركود والربط بالسيرفر المركزي.',
};

export default function POSDownloadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-[#1F0D18] to-zinc-950 text-white font-sans py-12 md:py-20" dir="rtl">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        
        {/* Top Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E6007E]/20 border border-[#E6007E]/40 text-[#E6007E] text-xs font-bold mb-4 shadow-xs">
            <Sparkles className="w-4 h-4" />
            <span>الإصدار الرسمي v1.0.0 — مخصص لمحل غزل (عين الباشا)</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight font-heading mb-4">
            برنامج كاشير غزل المستقل <span className="text-[#E6007E]">(GHAZAL POS)</span>
          </h1>
          <p className="text-zinc-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            تطبيق سطح المكتب المتكامل لأجهزة Windows 10 و 11: سرعة فائقة في قراءة الباركود، دعم الطابعات الحرارية 80mm ودرج النقد، مع ربط آمن وسحابي بلوحة تحكم المتجر.
          </p>
        </div>

        {/* Download Hero Card */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden mb-12">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#E6007E]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center lg:text-right">
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <div className="w-16 h-16 rounded-2xl bg-white p-2.5 shadow-md flex items-center justify-center">
                  <Image src="/logo.png" alt="GHAZAL" width={60} height={60} className="object-contain" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">GHAZAL-POS-Setup.zip</h3>
                  <span className="text-xs text-zinc-400 font-mono">Windows 10/11 (64-bit) • الحجم: ~115 MB • حزمة كاملة مع كافة الملفات</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-zinc-300 pt-2">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> فك ضغط وتشغيل فوري</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> يحتوي على كافة مكتبات التشغيل (ffmpeg & dlls)</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> ربط آمن ومشفر بالسيرفر المركزي</span>
              </div>
            </div>

            {/* Direct Download Button (ZIP ONLY) */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
              <a
                href="/api/pos/download"
                download="GHAZAL-POS-Setup.zip"
                className="px-8 py-4 bg-[#E6007E] hover:bg-[#C5006C] text-white font-extrabold rounded-2xl transition shadow-lg hover:shadow-[#E6007E]/30 flex items-center justify-center gap-3 group text-base"
              >
                <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                <span>تحميل البرنامج (حزمة ZIP كاملة)</span>
              </a>

              <Link
                href="/pos/cashier"
                className="px-6 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-2xl transition flex items-center justify-center gap-2 text-sm border border-zinc-700"
              >
                <Monitor className="w-4 h-4 text-[#E6007E]" />
                <span>واجهة الويب مباشرة</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-zinc-900/60 border border-zinc-800/80 p-6 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-[#E6007E] flex items-center justify-center">
              <ScanBarcode className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-base">دعم أجهزة قراءة الباركود</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              توافق تلقائي وفوري مع ماسحات الباركود الليزرية (USB / Bluetooth) مع دعم البحث بالباركود المطبوع والأصناف السريعة.
            </p>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800/80 p-6 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-[#E6007E] flex items-center justify-center">
              <Printer className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-base">الطباعة الحرارية السريعة</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              طباعة إيصالات الفواتير مباشرة على طابعات الإيصالات مقاس 80mm و 58mm مع فتح درج النقد الإلكتروني تلقائياً عند إتمام العملية.
            </p>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800/80 p-6 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-[#E6007E] flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-base">مزامنة سريعة وآمنة</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              مزامنة فورية للأسعار، الخصومات، والكميات مع لوحة إدارة المتجر المركزية، وإمكانية المتابعة المباشرة للمبيعات من أي مكان.
            </p>
          </div>
        </div>

        {/* System Specs Requirements */}
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 text-xs text-zinc-400 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-zinc-300 font-bold">
            <HardDrive className="w-4 h-4 text-[#E6007E]" />
            <span>متطلبات التشغيل:</span>
          </div>
          <span>نظام التشغيل: Windows 10 (64-bit) أو Windows 11</span>
          <span>المعالج: Intel / AMD ثنائي النواة أو أحدث</span>
          <span>الذاكرة العشوائية: 4 GB RAM فما فوق</span>
          <span>المساحة: 500 MB مساحة تخزينية متوفرة</span>
        </div>

      </div>
    </div>
  );
}
