import React from 'react';
import Link from 'next/link';
import { getCMSContent } from '@/lib/cms';
import { FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale;
  const isAr = locale === 'ar';

  const defaultTerms = {
    titleAr: 'الشروط والأحكام',
    titleEn: 'Terms & Conditions',
    introAr: 'مرحباً بكِ في متجر محل غزل للمكياجات ومستحضرات التجميل (عين الباشا - شارع القدس). باستخدامكِ لموقعنا الإلكتروني أو الشراء من خدماتنا، فإنكِ توافقين على الالتزام بالشروط والأحكام التالية:',
    introEn: 'Welcome to Ghazal Cosmetics & More (Ain Al-Basha - Al-Quds Street). By using our website or purchasing products, you agree to comply with and be bound by the following terms and conditions:'
  };

  const cms = await getCMSContent('terms_of_service', defaultTerms);

  return (
    <div className="bg-white min-h-screen py-12 md:py-16" style={{ backgroundColor: '#ffffff', colorScheme: 'only light' }}>
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FADAE6] text-[#E6007E] text-xs md:text-sm font-bold mb-4">
            <FileText className="w-4 h-4" />
            <span>{isAr ? 'شفافية وثقة تامة في كل معاملة' : 'Transparent & Trusted Transactions'}</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#1A1A1A] tracking-tight mb-4">
            {isAr ? cms.titleAr : cms.titleEn}
          </h1>
          <p className="text-zinc-600 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            {isAr ? cms.introAr : cms.introEn}
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-zinc-200 space-y-8 text-zinc-800 mb-10">
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#E6007E] text-white text-xs font-bold flex items-center justify-center">1</span>
              <h2 className="text-xl font-bold text-[#1A1A1A]">
                {isAr ? 'الأسعار والعملة المعمول بها' : 'Pricing & Currency'}
              </h2>
            </div>
            <p className="text-sm md:text-base leading-relaxed text-zinc-600 ps-9">
              {isAr
                ? 'جميع الأسعار المعروضة على الموقع هي بالدينار الأردني (JOD). نحرص دائماً على دقة الأسعار وتحديث العروض، ونحتفظ بالحق في تصحيح أي أخطاء تسعيرية غير مقصودة قبل تأكيد إرسال الشحنة.'
                : 'All listed prices are in Jordanian Dinars (JOD). We maintain accurate pricing and reserve the right to rectify accidental typos before dispatch.'}
            </p>
          </section>

          <hr className="border-zinc-100" />

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#E6007E] text-white text-xs font-bold flex items-center justify-center">2</span>
              <h2 className="text-xl font-bold text-[#1A1A1A]">
                {isAr ? 'موثوقية وجودة المنتجات والمكياج' : 'Product Quality & Standards'}
              </h2>
            </div>
            <p className="text-sm md:text-base leading-relaxed text-zinc-600 ps-9">
              {isAr
                ? 'نلتزم التزاماً كاملاً بتقديم مستحضرات تجميل، عناية بالبشرة، عطور، وإكسسوارات مستوردة وموزعة بموجب التراخيص الرسمية. لا نتعامل بالمنتجات المقلدة أو مجهولة المصدر نهائياً.'
                : 'We are committed to providing cosmetics, skincare, fragrances, and tools from licensed and verified distributors. We strictly refuse counterfeit items.'}
            </p>
          </section>

          <hr className="border-zinc-100" />

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#E6007E] text-white text-xs font-bold flex items-center justify-center">3</span>
              <h2 className="text-xl font-bold text-[#1A1A1A]">
                {isAr ? 'الطلبات والشحن والتوصيل' : 'Orders & Delivery'}
              </h2>
            </div>
            <p className="text-sm md:text-base leading-relaxed text-zinc-600 ps-9">
              {isAr
                ? 'تستغرق مدة العمل وتجهيز وتوصيل الطلبات لكافة مناطق ومحافظات المملكة بين يومين إلى 3 أيام (2 - 3 أيام). ولا يوجد توصيل فوري لأي منطقة إلا عند الاتصال الهاتفي والتنسيق المسبق المباشر مع إدارة المحل.'
                : 'Orders are processed and delivered across all areas within 2 to 3 business days. Instant delivery is only available upon prior phone contact and direct coordination with the store.'}
            </p>
          </section>

          <hr className="border-zinc-100" />

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#E6007E] text-white text-xs font-bold flex items-center justify-center">4</span>
              <h2 className="text-xl font-bold text-[#1A1A1A]">
                {isAr ? 'الاسترجاع والاستبدال الصحي' : 'Hygiene & Return Conditions'}
              </h2>
            </div>
            <p className="text-sm md:text-base leading-relaxed text-zinc-600 ps-9">
              {isAr
                ? 'حفاظاً على السلامة العامة والاشتراطات الصحية لمنتجات التجميل، لا يجوز استبدال أو إرجاع أي منتج تم فتحه أو فك غلافه السيلوفاني الأصلي. وتفاصيل الشروط موضحة في صفحة سياسة الاستبدال والاسترجاع.'
                : 'For health and hygiene safety, opened cosmetic products cannot be refunded or exchanged. Please refer to our Returns Policy for full details.'}
            </p>
          </section>

          <hr className="border-zinc-100" />

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#E6007E] text-white text-xs font-bold flex items-center justify-center">5</span>
              <h2 className="text-xl font-bold text-[#1A1A1A]">
                {isAr ? 'الملكية الفكرية وحقوق العلامة التجارية' : 'Intellectual Property'}
              </h2>
            </div>
            <p className="text-sm md:text-base leading-relaxed text-zinc-600 ps-9">
              {isAr
                ? 'شعار واسم "غزل للمكياجات ومستحضرات التجميل - GHAZAL Cosmetics & More" وجميع التصاميم والصور المعروضة على الموقع هي حقوق محفوظة لمحل غزل، ويمنع نسخها أو إعادة نشرها لأغراض تجارية دون إذن مسبق.'
                : 'All trademarks, logos, visuals, and brand assets of Ghazal Cosmetics & More are proprietary and protected against unauthorized commercial duplication.'}
            </p>
          </section>
        </div>

        {/* Footer note */}
        <div className="text-center text-xs text-zinc-500">
          <p>{isAr ? 'محل غزل للمكياجات ومستحضرات التجميل - عين الباشا - شارع القدس، المملكة الأردنية الهاشمية.' : 'Ghazal Cosmetics & More - Ain Al-Basha - Al-Quds Street, Jordan.'}</p>
        </div>
      </div>
    </div>
  );
}
