import React from 'react';
import type { Metadata } from 'next';
import { Sparkles, ShieldCheck, Heart, Award, Star } from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'عن غزل | محل غزل للمكياج والتجميل — عين الباشا',
    description: 'تعرفي على قصة محل غزل لمستحضرات التجميل والمكياج والعناية في عين الباشا - شارع القدس، رسالتنا، ومعاييرنا في توفير أفضل المنتجات الموثوقة.',
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale = 'ar' } = await params;
  const isAr = locale === 'ar';

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-16 font-sans" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto bg-white border border-zinc-200/80 rounded-2xl p-6 md:p-10 shadow-sm">
        
        {/* Header */}
        <div className="border-b border-zinc-200 pb-6 mb-8 text-center md:text-start">
          <div className="inline-flex items-center gap-2 bg-pink-50 text-[#E6007E] border border-pink-100 px-3 py-1 rounded-full text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>قصة علامة غزل — عين الباشا - شارع القدس</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold font-heading text-zinc-900">
            {isAr ? 'عن غزل — مستحضرات التجميل والمكياج والعناية' : 'About Ghazal — Cosmetics & Care'}
          </h1>
          <p className="text-zinc-500 text-sm mt-2">
            {isAr
              ? 'وجهتكِ الأولى في عين الباشا - شارع القدس للحصول على أفضل ماركات المكياج والعناية والعطور.'
              : 'Your premier beauty destination in Ain Al-Basha - Al-Quds Street & Jordan for quality makeup and skincare.'}
          </p>
        </div>

        {/* Story content */}
        <div className="space-y-6 text-zinc-700 text-base leading-relaxed">
          <p>
            تأسس <strong>محل غزل للمكياج</strong> في عين الباشا - شارع القدس ليكون أكثر من مجرد متجر تجميل؛ بل مساحة تلهم كل سيدة وفتاة لاكتشاف جمالها الحقيقي والتعبير عن أنوثتها وثقتها بنفسها.
          </p>
          <p>
            انطلقنا من شغف عميق بتوفير مستحضرات التجميل ومستلزمات العناية بالبشرة والشعر ذات الجودة الموثوقة، بعد أن لمسنا حاجة زبائننا في عين الباشا - شارع القدس والمناطق المجاورة إلى وجهة متميزة توفر أفضل الماركات وخلوها التام من المنتجات مجهولة المصدر.
          </p>
          <p>
            نحرص في «غزل» على التعامل المباشر مع الوكلاء الرسميين والموردين المعتمدين لأشهر العلامات العالمية مثل: 
            <strong> Maybelline, L&apos;Oréal Paris, NYX Professional, The Ordinary, Laneige, CeraVe</strong>، إضافة إلى تشكيلاتنا الحصرية من العطور الفاخرة، والإكسسوارات، وأدوات التجميل المتطورة.
          </p>
        </div>

        {/* Pillars / Values Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-zinc-100 text-center">
          <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200/60">
            <div className="w-12 h-12 rounded-xl bg-pink-100 text-[#E6007E] mx-auto mb-3 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-zinc-900 text-base mb-1">
              {isAr ? 'جودة وموثوقية' : 'Quality & Authenticity'}
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {isAr ? 'جميع مستحضراتنا موثوقة ومختارة بعناية فائقة.' : 'Strict quality standards with verified sources.'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200/60">
            <div className="w-12 h-12 rounded-xl bg-pink-100 text-[#E6007E] mx-auto mb-3 flex items-center justify-center">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-zinc-900 text-base mb-1">
              {isAr ? 'استشارات تجميلية' : 'Beauty Guidance'}
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {isAr ? 'فريقنا جاهز دائماً لمساعدتك في اختيار أنسب درجات الفاونديشن والروج ونظام العناية.' : 'Personalized shade matching and skincare routines.'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200/60">
            <div className="w-12 h-12 rounded-xl bg-pink-100 text-[#E6007E] mx-auto mb-3 flex items-center justify-center">
              <Star className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-zinc-900 text-base mb-1">
              {isAr ? 'أسعار منافسة وعروض مستمرة' : 'Best Value'}
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {isAr ? 'نوفر أفضل الأسعار بالدينار الأردني مع عروض وبكجات هدايا دورية متميزة.' : 'Competitive Jordan Dinars pricing and seasonal promos.'}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
