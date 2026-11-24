import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { WishlistHeart } from '@/components/WishlistHeart';
import type { Metadata } from 'next';
import { Sparkles, ShoppingBag, Star, ArrowLeft, ArrowRight, ShieldCheck, Truck, RefreshCw, Heart } from 'lucide-react';
import { HeroCarousel } from '@/components/HeroCarousel';
import { getHeroSlides, getHeroCarouselSettings } from '@/actions/homepage-cms';
import { HomeProductShowcase } from '@/components/HomeProductShowcase';
import { COSMETICS_CATALOG } from '@/lib/cosmetics-catalog';
import { getActivePromotions, findActivePromotionForProduct, computeProductPromotionPricing } from '@/lib/promotions';
import { getProductCustomBadges } from '@/actions/products';
import {
  PerfumeIcon,
  HaircareIcon,
  SkincareIcon,
  MakeupIcon,
  AccessoriesIcon,
  ToolsIcon,
  OffersIcon
} from '@/components/CategoryIcons';

interface Params {
  locale?: string;
}

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale = 'ar' } = await params;
  const isAr = locale === 'ar';
  const BASE_URL = 'https://ghazal.jo';

  return {
    title: isAr
      ? 'غزل — مستحضرات تجميل، مكياج، عناية وعطور | GHAZAL'
      : 'GHAZAL — Cosmetics, Makeup, Skincare & Fragrances',
    description: isAr
      ? 'غزل وجهتك المتكاملة للجمال والأناقة في الأردن: مكياج، عناية بالبشرة والشعر، عطور فاخرة وأدوات تجميل مع توصيل سريع لجميع المحافظات.'
      : 'Ghazal is your premier beauty destination in Jordan: makeup, skincare, haircare, and perfumes with fast delivery across Jordan.',
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: {
        ar: `${BASE_URL}/ar`,
        en: `${BASE_URL}/en`,
      },
    },
    openGraph: {
      title: isAr ? 'غزل — جمالك في مكان واحد' : 'GHAZAL — Your Beauty in One Place',
      description: isAr
        ? 'مكياج • عناية • عطور • وأكثر بأعلى معايير الجودة والتألق.'
        : 'Makeup • Skincare • Fragrances • and more.',
      url: `${BASE_URL}/${locale}`,
      locale: isAr ? 'ar_JO' : 'en_US',
    },
  };
}

export default async function StoreFrontPage({ params }: { params: Promise<Params> }) {
  const { locale = 'ar' } = await params;
  const isAr = locale === 'ar';

  // Fetch real products from DB if available (Only products assigned to ONLINE or SHARED channels)
  let dbProducts: any[] = [];
  try {
    dbProducts = await prisma.product.findMany({
      where: { 
        isVisible: true,
        channel: { in: ['ONLINE', 'SHARED'] }
      },
      take: 8,
      include: {
        variants: { where: { isActive: true }, take: 1 },
        images: { where: { isMain: true }, take: 1 },
        category: true,
      },
    });
  } catch (err) {
    console.warn('Database query bypassed:', err);
  }

  // Load Hero Banner Slides from CMS (Hero Slides Manager)
  let heroSlides: any[] = [];
  let carouselSettings: any = { enabled: true, autoplayEnabled: true, autoplayIntervalMs: 5000, showIndicators: true, showNavigation: true };
  try {
    const [dbSlides, dbSettings] = await Promise.all([
      getHeroSlides(),
      getHeroCarouselSettings()
    ]);
    heroSlides = dbSlides || [];
    carouselSettings = dbSettings || carouselSettings;
  } catch (err) {
    console.warn('Hero slides query bypassed:', err);
  }

  // 1. Reference Categories (الأقسام الدائرية السبعة بأيقونات احترافية موحدة بنفس ثيم غزل)
  const circularCategories = [
    { nameAr: 'العطور', nameEn: 'Perfumes', icon: <PerfumeIcon className="w-9 h-9 md:w-11 md:h-11" />, href: `/${locale}/shop?category=perfumes` },
    { nameAr: 'العناية بالشعر', nameEn: 'Haircare', icon: <HaircareIcon className="w-9 h-9 md:w-11 md:h-11" />, href: `/${locale}/shop?category=haircare` },
    { nameAr: 'العناية بالبشرة', nameEn: 'Skincare', icon: <SkincareIcon className="w-9 h-9 md:w-11 md:h-11" />, href: `/${locale}/shop?category=skincare` },
    { nameAr: 'المكياج', nameEn: 'Makeup', icon: <MakeupIcon className="w-9 h-9 md:w-11 md:h-11" />, href: `/${locale}/shop?category=makeup` },
    { nameAr: 'الإكسسوارات', nameEn: 'Accessories', icon: <AccessoriesIcon className="w-9 h-9 md:w-11 md:h-11" />, href: `/${locale}/shop?category=accessories` },
    { nameAr: 'أدوات التجميل', nameEn: 'Beauty Tools', icon: <ToolsIcon className="w-9 h-9 md:w-11 md:h-11" />, href: `/${locale}/shop?category=tools` },
    { nameAr: 'هدايا وعروض', nameEn: 'Gifts & Sets', icon: <OffersIcon className="w-9 h-9 md:w-11 md:h-11" />, href: `/${locale}/shop?filter=offers` },
  ];

  // 2. Real Storefront Products from Database (ONLINE & SHARED channels only)
  const customBadges = await getProductCustomBadges();
  const activePromotions = getActivePromotions('STOREFRONT');

  const realBestSellers = dbProducts.map(p => {
    const primaryVariant = p.variants?.[0];
    const lowestPrice = primaryVariant ? primaryVariant.price : 0;
    const promoPricing = computeProductPromotionPricing({ ...p, priceFils: lowestPrice }, 'STOREFRONT', activePromotions);
    return {
      id: p.id,
      slug: p.slug,
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      brand: p.category?.name || (isAr ? 'غزل' : 'GHAZAL'),
      priceFils: promoPricing.priceFils,
      originalPriceFils: promoPricing.originalPriceFils,
      discountPercent: promoPricing.discountPercent,
      rating: p.rating || 5.0,
      reviewsCount: p.reviewsCount || 0,
      shade: primaryVariant?.shade || '',
      tag: customBadges[p.id] || customBadges[p.slug] || p.reviewReasons?.replace('TAG:', '') || undefined,
      imageUrl: p.images?.[0]?.url || '/logo.png',
    };
  });

  // Filter only products that have an active promotion applied from /admin/promotions
  const realOffers = realBestSellers.filter(p => 
    findActivePromotionForProduct(p.id, p.slug, 'STOREFRONT', activePromotions) !== null
  );


  return (
    <main className="flex-1 bg-white text-[#1A1A1A]" dir={isAr ? 'rtl' : 'ltr'}>
      {/* -------------------------------------------------------------
          1. HERO SHOWCASE FULL-WIDTH BANNER (من طرف اليمين للطرف اليسار)
      ------------------------------------------------------------- */}
      {carouselSettings?.enabled && heroSlides && heroSlides.length > 0 && (
        <section className="w-full relative overflow-hidden bg-zinc-950 border-b border-pink-100">
          <HeroCarousel slides={heroSlides} settings={carouselSettings} />
        </section>
      )}

      {/* -------------------------------------------------------------
          2. CIRCULAR CATEGORIES SECTION (الأقسام الدائرية)
      ------------------------------------------------------------- */}
      <section className="py-10 md:py-14 bg-white border-b border-zinc-100">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold font-heading text-[#1A1A1A]">
              {isAr ? 'تسوقي حسب التصنيف' : 'Shop by Category'}
            </h2>
            <div className="w-12 h-1 bg-[#E6007E] mx-auto rounded-full mt-2" />
          </div>

          <div className="flex items-center justify-start sm:justify-center gap-6 md:gap-8 overflow-x-auto pb-4 pt-2 no-scrollbar">
            {circularCategories.map((cat, idx) => (
              <Link
                key={idx}
                href={cat.href}
                className="flex flex-col items-center gap-2.5 shrink-0 group focus:outline-none"
              >
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-tr from-[#FADAE6]/50 via-pink-50 to-white border-2 border-pink-100 shadow-sm flex items-center justify-center p-3.5 group-hover:scale-105 group-hover:border-[#E6007E] group-hover:shadow-md transition-all duration-300">
                  {cat.icon}
                </div>
                <span className="text-xs md:text-sm font-bold text-zinc-800 group-hover:text-[#E6007E] transition-colors text-center">
                  {isAr ? cat.nameAr : cat.nameEn}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          3. DUAL FEATURE PROMO BANNERS (بانرات المجموعات - بجانب بعض حتى في واجهة الهاتف)
      ------------------------------------------------------------- */}
      <section className="py-8 sm:py-12 bg-zinc-50 border-b border-zinc-100">
        <div className="container mx-auto px-3 sm:px-6">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-6 max-w-5xl mx-auto">
            {/* Banner 1: Skincare */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#FADAE6] via-pink-100 to-[#FFF0F5] p-3.5 sm:p-7 md:p-8 border border-pink-200 flex flex-col justify-between min-h-[170px] sm:min-h-[220px] shadow-xs group">
              <div className="space-y-1 sm:space-y-2 z-10">
                <span className="text-[8px] sm:text-[11px] font-bold text-[#E6007E] bg-white px-2 py-0.5 rounded-md uppercase tracking-wider inline-block">
                  {isAr ? 'عناية يومية متكاملة' : 'Daily Routine'}
                </span>
                <h3 className="text-xs sm:text-xl md:text-2xl font-extrabold text-[#1A1A1A] font-heading leading-tight">
                  {isAr ? 'العناية بالبشرة' : 'Skincare Collection'}
                </h3>
                <p className="text-[9px] sm:text-xs text-zinc-600 font-medium line-clamp-2 sm:line-clamp-none">
                  {isAr ? 'بشرة صحية ومشرقة بأقوى الماركات' : 'Radiant, healthy glow with top brands'}
                </p>
              </div>
              <div className="pt-3 sm:pt-6 z-10">
                <Link
                  href={`/${locale}/shop?category=skincare`}
                  className="inline-flex items-center gap-1 sm:gap-2 px-2.5 py-1.5 sm:px-5 sm:py-2.5 bg-white hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] font-bold rounded-lg sm:rounded-xl text-[10px] sm:text-xs transition-colors shadow-xs"
                >
                  <span>{isAr ? 'اكتشفي المجموعة' : 'Discover'}</span>
                  <span>{isAr ? '←' : '→'}</span>
                </Link>
              </div>
              <div className="absolute -bottom-3 -left-3 sm:-bottom-6 sm:-left-6 text-3xl sm:text-7xl opacity-20 pointer-events-none group-hover:scale-110 transition-transform">
                🧴
              </div>
            </div>

            {/* Banner 2: Makeup */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#1A1A1A] via-zinc-900 to-[#331122] p-3.5 sm:p-7 md:p-8 text-white flex flex-col justify-between min-h-[170px] sm:min-h-[220px] shadow-xs group">
              <div className="space-y-1 sm:space-y-2 z-10">
                <span className="text-[8px] sm:text-[11px] font-bold text-white bg-[#E6007E] px-2 py-0.5 rounded-md uppercase tracking-wider inline-block">
                  {isAr ? 'سحر الإطلالة' : 'Glamour Look'}
                </span>
                <h3 className="text-xs sm:text-xl md:text-2xl font-extrabold font-heading text-white leading-tight">
                  {isAr ? 'المكياج ومستحضرات التجميل' : 'Makeup Collection'}
                </h3>
                <p className="text-[9px] sm:text-xs text-zinc-300 font-medium line-clamp-2 sm:line-clamp-none">
                  {isAr ? 'إطلالة مثالية تدوم طوال اليوم لكل مناسبة' : 'Flawless all-day finish for any event'}
                </p>
              </div>
              <div className="pt-3 sm:pt-6 z-10">
                <Link
                  href={`/${locale}/shop?category=makeup`}
                  className="inline-flex items-center gap-1 sm:gap-2 px-2.5 py-1.5 sm:px-5 sm:py-2.5 bg-[#E6007E] hover:bg-[#C5006C] text-white font-bold rounded-lg sm:rounded-xl text-[10px] sm:text-xs transition-colors shadow-xs"
                >
                  <span>{isAr ? 'تسوقي الآن' : 'Shop Now'}</span>
                  <span>{isAr ? '←' : '→'}</span>
                </Link>
              </div>
              <div className="absolute -bottom-3 -left-3 sm:-bottom-6 sm:-left-6 text-3xl sm:text-7xl opacity-20 pointer-events-none group-hover:scale-110 transition-transform">
                💄
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          4. MOST REQUESTED PRODUCTS SECTION ("الأكثر طلباً")
          تظهر المنتجات الحقيقية فقط المخصصة للمتجر الإلكتروني من لوحة الإدارة
      ------------------------------------------------------------- */}
      {realBestSellers.length > 0 ? (
        <HomeProductShowcase
          title={isAr ? 'الأكثر طلباً' : 'Best Sellers'}
          subtitle={isAr ? 'المنتجات الأكثر طلباً وإقبالاً في متجرنا' : 'Top selling products in our store'}
          viewAllHref={`/${locale}/shop`}
          viewAllLabel={isAr ? 'عرض جميع المنتجات' : 'View All'}
          products={realBestSellers}
          locale={locale}
          isOfferSection={false}
        />
      ) : (
        <section className="py-12 bg-pink-50/40 border-b border-pink-100/60">
          <div className="container mx-auto px-6 text-center max-w-xl">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-pink-100 flex items-center justify-center text-[#E6007E]">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-black text-lg text-zinc-900 mb-1">
              {isAr ? 'المتجر الإلكتروني قيد تجهيز العروض' : 'Storefront Launching Soon'}
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              {isAr 
                ? 'منتجاتنا متوفرة حالياً في صالة المحل والكاشير في عين الباشا، وسيتم توفير الطلب أونلاين فور إضافة المنتجات لقسم المتجر الإلكتروني.'
                : 'Our products are currently available in-store at Ain Al-Basha. Online ordering will be enabled soon.'}
            </p>
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------
          5. EXCLUSIVE OFFERS & DEALS SECTION (قسم العروض والتخفيضات)
          يظهر فقط وحصرياً إذا كان هناك عروض ترويجية مطبقة من admin/promotions
      ------------------------------------------------------------- */}
      {realOffers.length > 0 && (
        <HomeProductShowcase
          title={isAr ? 'العروض والتخفيضات' : 'Special Offers'}
          subtitle={isAr ? 'خصومات وعروض على منتجات مختارة لفترة محدودة' : 'Discounts on selected products for a limited time'}
          viewAllHref={`/${locale}/shop?filter=offers`}
          viewAllLabel={isAr ? 'عرض جميع العروض' : 'All Offers'}
          products={realOffers}
          locale={locale}
          isOfferSection={true}
        />
      )}


    </main>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}
