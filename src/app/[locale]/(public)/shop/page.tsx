import { prisma } from '@/lib/db';
import Link from 'next/link';
import { filsToDisplay } from '@/lib/money';
import { ShopFilters } from '@/components/ShopFilters';
import { MobileCategoriesFeed } from '@/components/MobileCategoriesFeed';
import { PaginatedProductGrid } from '@/components/PaginatedProductGrid';
import type { Metadata } from 'next';
import { Sparkles, ShoppingBag, ArrowLeft, Tag } from 'lucide-react';
import { COSMETICS_CATALOG } from '@/lib/cosmetics-catalog';
import { getActivePromotions, computeProductPromotionPricing, findActivePromotionForProduct } from '@/lib/promotions';
import { getProductCustomBadges } from '@/actions/products';

export const revalidate = 60;

const BASE_URL = 'https://ghazal.jo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === 'ar';
  return {
    title: isAr
      ? 'متجر غزل للمكياج والعناية | عين الباشا — GHAZAL'
      : 'GHAZAL Cosmetics Shop | Ain Al-Basha, Jordan',
    description: isAr
      ? 'تسوقي أفضل الماركات لمستحضرات التجميل، المكياج، العناية بالبشرة والشعر، والعطور في محل غزل للمكياجات - عين الباشا مع توصيل لجميع المحافظات.'
      : 'Shop cosmetics, makeup, skincare, haircare and perfumes from Ghazal Cosmetics in Ain Al-Basha with delivery across Jordan.',
    alternates: {
      canonical: `${BASE_URL}/${locale}/shop`,
      languages: { ar: `${BASE_URL}/ar/shop`, en: `${BASE_URL}/en/shop` },
    },
    openGraph: {
      title: isAr ? 'متجر غزل للمكياج والعناية' : 'GHAZAL Cosmetics Shop',
      description: isAr ? 'جمالك في مكان واحد • ماركات عالمية ومحلية مختارة' : 'Your beauty in one place',
      url: `${BASE_URL}/${locale}/shop`,
      locale: isAr ? 'ar_JO' : 'en_US',
    },
  };
}

// Fallback beauty catalog if DB is empty or during local dev
const fallbackCatalog = [
  {
    id: 'ghaz-prod-1',
    slug: 'maybelline-superstay-vinyl-ink',
    nameAr: 'أحمر شفاه مايبيلين سوبر ستاي فينيل إنك',
    nameEn: 'Maybelline Super Stay Vinyl Ink',
    categoryId: 'cat-makeup',
    categorySlug: 'makeup',
    categoryName: 'المكياج',
    brandName: 'MAYBELLINE',
    isFeatured: true,
    priceFils: 12000,
    rating: 4.9,
    reviewsCount: 380,
    images: [{ url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80', isMain: true }],
    variants: [{ id: 'v1', size: '4.2ml', shade: '20 Coy (#E6007E)', price: 12000, colorHex: '#E6007E' }],
  },
  {
    id: 'ghaz-prod-11',
    slug: 'loreal-true-match-foundation',
    nameAr: 'كريم أساس لوريال ترو ماتش الفائق النعومة',
    nameEn: "L'Oréal True Match Foundation",
    categoryId: 'cat-makeup',
    categorySlug: 'makeup',
    categoryName: 'المكياج',
    brandName: "L'ORÉAL PARIS",
    isFeatured: true,
    priceFils: 15000,
    rating: 4.9,
    reviewsCount: 412,
    images: [{ url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80', isMain: true }],
    variants: [{ id: 'v11', size: '30ml', shade: '3N Creamy Beige', price: 15000, colorHex: '#E2B897' }],
  },
  {
    id: 'ghaz-prod-2',
    slug: 'loreal-infaillible-foundation',
    nameAr: 'كريم أساس لوريال إنفاليبل 24 ساعة',
    nameEn: "L'Oréal Infaillible 24H Foundation",
    categoryId: 'cat-makeup',
    categorySlug: 'makeup',
    categoryName: 'المكياج',
    brandName: "L'ORÉAL PARIS",
    isFeatured: true,
    priceFils: 16500,
    rating: 4.9,
    reviewsCount: 412,
    images: [{ url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80', isMain: true }],
    variants: [{ id: 'v2', size: '30ml', shade: '120 Vanilla', price: 16500, colorHex: '#E8C39E' }],
  },
  {
    id: 'ghaz-prod-12',
    slug: 'maybelline-lash-sensational-mascara',
    nameAr: 'ماسكارا مايبيلين لاش سينسيشنال لتكثيف وتطويل الرموش',
    nameEn: 'Maybelline Lash Sensational Mascara',
    categoryId: 'cat-makeup',
    categorySlug: 'makeup',
    categoryName: 'المكياج',
    brandName: 'MAYBELLINE',
    isFeatured: true,
    priceFils: 11000,
    rating: 4.9,
    reviewsCount: 502,
    images: [{ url: 'https://images.unsplash.com/photo-1591360236480-4ed861025fa1?auto=format&fit=crop&w=600&q=80', isMain: true }],
    variants: [{ id: 'v12', size: '9.5ml', shade: 'Very Black Waterproof', price: 11000, colorHex: '#1A1A1A' }],
  },
  {
    id: 'ghaz-prod-3',
    slug: 'nyx-ultimate-shadow-palette',
    nameAr: 'باليت ظلال عيون ألتيميت شادو من نيكْس',
    nameEn: 'NYX Ultimate Shadow Palette Warm Neutrals',
    categoryId: 'cat-makeup',
    categorySlug: 'makeup',
    categoryName: 'المكياج',
    brandName: 'NYX MAKEUP',
    isFeatured: false,
    priceFils: 19000,
    rating: 4.8,
    reviewsCount: 186,
    images: [{ url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80', isMain: true }],
    variants: [{ id: 'v3', size: '16 Shades', shade: 'Warm Neutrals', price: 19000, colorHex: '#9B5B32' }],
  },
  {
    id: 'ghaz-prod-4',
    slug: 'laneige-lip-sleeping-mask-berry',
    nameAr: 'مرطب الشفاه الليلي بالتوت من لانيج',
    nameEn: 'Laneige Lip Sleeping Mask Berry',
    categoryId: 'cat-skincare',
    categorySlug: 'skincare',
    categoryName: 'العناية بالبشرة',
    brandName: 'LANEIGE',
    isFeatured: true,
    priceFils: 18000,
    rating: 5.0,
    reviewsCount: 238,
    images: [{ url: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80', isMain: true }],
    variants: [{ id: 'v4', size: '20g', shade: 'Berry Original', price: 18000, colorHex: '#FF6B81' }],
  },
  {
    id: 'ghaz-prod-5',
    slug: 'the-ordinary-niacinamide-zinc',
    nameAr: 'سيروم النياسيناميد 10% والزنك 1% من ذا أورديناري',
    nameEn: 'The Ordinary Niacinamide 10% + Zinc 1%',
    categoryId: 'cat-skincare',
    categorySlug: 'skincare',
    categoryName: 'العناية بالبشرة',
    brandName: 'THE ORDINARY',
    isFeatured: false,
    priceFils: 8500,
    rating: 4.9,
    reviewsCount: 520,
    images: [{ url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80', isMain: true }],
    variants: [{ id: 'v5', size: '30ml', shade: 'Standard', price: 8500, colorHex: '#F2F2F2' }],
  },
  {
    id: 'ghaz-prod-6',
    slug: 'cerave-hydrating-cleanser',
    nameAr: 'غسول الوجه المرطب للبشرة الجافة والعادية من سيرافي',
    nameEn: 'CeraVe Hydrating Facial Cleanser',
    categoryId: 'cat-skincare',
    categorySlug: 'skincare',
    categoryName: 'العناية بالبشرة',
    brandName: 'CERAVE',
    isFeatured: false,
    priceFils: 11500,
    rating: 4.9,
    reviewsCount: 310,
    images: [{ url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80', isMain: true }],
    variants: [{ id: 'v6', size: '236ml', shade: 'Standard', price: 11500, colorHex: '#EBF4F6' }],
  },
  {
    id: 'ghaz-prod-7',
    slug: 'argan-oil-hair-repair-mask',
    nameAr: 'ماسك زيت الأرغان لإصلاح وتغذية الشعر',
    nameEn: 'Moroccan Argan Oil Hair Repair Mask',
    categoryId: 'cat-haircare',
    categorySlug: 'haircare',
    categoryName: 'العناية بالشعر',
    brandName: 'GHAZAL CARE',
    isFeatured: true,
    priceFils: 14000,
    rating: 4.8,
    reviewsCount: 140,
    images: [{ url: 'https://images.unsplash.com/photo-1608248597359-00918f0f089b?auto=format&fit=crop&w=600&q=80', isMain: true }],
    variants: [{ id: 'v7', size: '250ml', shade: 'معالج مكثف', price: 14000, colorHex: '#D4AF37' }],
  },
  {
    id: 'ghaz-prod-8',
    slug: 'ghazal-signature-edp',
    nameAr: 'عطر غزل الفاخر – أو دو بارفان',
    nameEn: 'GHAZAL Signature Eau De Parfum',
    categoryId: 'cat-fragrances',
    categorySlug: 'fragrances',
    categoryName: 'العطور',
    brandName: 'GHAZAL BRAND',
    isFeatured: true,
    priceFils: 25000,
    rating: 5.0,
    reviewsCount: 195,
    images: [{ url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80', isMain: true }],
    variants: [{ id: 'v8', size: '50ml', shade: 'Eau De Parfum', price: 25000, colorHex: '#E6007E' }],
  },
  {
    id: 'ghaz-prod-13',
    slug: 'pro-makeup-brush-set',
    nameAr: 'طقم فرش مكياج احترافية ناعمة (12 قطعة)',
    nameEn: 'Pro Soft Makeup Brush Set 12pcs',
    categoryId: 'cat-beauty-tools',
    categorySlug: 'beauty-tools',
    categoryName: 'أدوات التجميل',
    brandName: 'GHAZAL TOOLS',
    isFeatured: true,
    priceFils: 11900,
    rating: 4.8,
    reviewsCount: 88,
    images: [{ url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80', isMain: true }],
    variants: [{ id: 'v9', size: '12 فرشاة + حقيبة', shade: 'Rose Gold', price: 11900, colorHex: '#B76E79' }],
  },
  {
    id: 'ghaz-prod-14',
    slug: 'velvet-hair-scrunchies-pack',
    nameAr: 'مجموعة ربطات شعر مخملية فاخرة (6 قطع)',
    nameEn: 'Luxury Velvet Hair Scrunchies Pack',
    categoryId: 'cat-accessories',
    categorySlug: 'accessories',
    categoryName: 'الإكسسوارات',
    brandName: 'GHAZAL ACCESSORIES',
    isFeatured: false,
    priceFils: 5000,
    rating: 4.7,
    reviewsCount: 65,
    images: [{ url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80', isMain: true }],
    variants: [{ id: 'v10', size: '6 قطع', shade: 'Pastel Mix', price: 5000, colorHex: '#E9C2C9' }],
  },
];

export default async function ShopPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ locale: string }>; 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale = 'ar' } = await params;
  const isAr = locale === 'ar';
  const sp = await searchParams;
  
  const q = typeof sp.q === 'string' ? sp.q : typeof sp.search === 'string' ? sp.search : '';
  const rawCategory = typeof sp.category === 'string' ? sp.category.trim() : '';
  const isAllCategory = !rawCategory || rawCategory === '*' || rawCategory.toLowerCase() === 'all';
  const categoryParam = isAllCategory ? '' : rawCategory;
  const filterParam = typeof sp.filter === 'string' ? sp.filter : '';
  const genderStr = typeof sp.gender === 'string' ? sp.gender : '';
  const familyStr = typeof sp.family === 'string' ? sp.family : '';

  // Normalized category slug
  const normalizedCategory = 
    categoryParam === 'perfumes' ? 'fragrances' :
    categoryParam === 'tools' ? 'beauty-tools' :
    categoryParam;

  // Active storefront promotions from /admin/promotions
  const activePromos = getActivePromotions('STOREFRONT');
  const promoTargetIds = activePromos.map(p => p.targetProductId).filter(Boolean) as string[];

  let products: any[] = [];
  let totalCount = 0;
  let categories: any[] = [];
  let genders: any[] = [];
  let families: any[] = [];
  let customBadges: Record<string, string> = {};

  try {
    // Build prisma where clause
    const where: any = { isVisible: true };
    
    if (categoryParam) {
      where.category = {
        OR: [
          { slug: normalizedCategory },
          { slug: categoryParam },
          { id: categoryParam }
        ]
      };
    }

    if (filterParam === 'offers') {
      if (promoTargetIds.length > 0) {
        where.OR = [
          { id: { in: promoTargetIds } },
          { slug: { in: promoTargetIds } }
        ];
      } else {
        where.id = 'NO_ACTIVE_PROMOTIONS';
      }
    }

    if (genderStr) where.genderId = genderStr;
    if (familyStr) where.familyId = familyStr;
    
    if (q) {
      where.OR = [
        { nameAr: { contains: q, mode: 'insensitive' } },
        { nameEn: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } }
      ];
    }

    const [dbProducts, dbTotal, dbCats, dbGenders, dbFamilies, fetchedBadges] = await Promise.all([
      prisma.product.findMany({
        where,
        take: 40,
        skip: 0,
        include: {
          variants: { orderBy: { size: 'asc' } },
          images: { orderBy: { order: 'asc' } },
          category: true,
          brand: true,
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where }),
      prisma.category.findMany({ orderBy: { name: 'asc' } }),
      prisma.gender.findMany({ orderBy: { name: 'asc' } }),
      prisma.fragranceFamily.findMany({ orderBy: { name: 'asc' } }),
      getProductCustomBadges(),
    ]);

    customBadges = fetchedBadges || {};

    products = dbProducts.map((p: any) => {
      const lowestPrice = p.variants?.length > 0 ? Math.min(...p.variants.map((v: any) => v.price)) : 0;
      const pricing = computeProductPromotionPricing({ ...p, priceFils: lowestPrice }, 'STOREFRONT', activePromos);

      return {
        ...p,
        tag: (p.reviewReasons?.startsWith('TAG:') ? p.reviewReasons.replace('TAG:', '') : null) || customBadges[p.id] || customBadges[p.slug] || p.tag || undefined,
        priceFils: pricing.priceFils,
        originalPriceFils: pricing.originalPriceFils,
        compareAtPriceFils: pricing.compareAtPriceFils,
        discountPercent: pricing.discountPercent,
        hasOffer: pricing.hasOffer,
      };
    });

    totalCount = dbTotal;
    categories = dbCats;
    genders = dbGenders;
    families = dbFamilies;
  } catch (error) {
    console.warn('Database query failed or is offline in ShopPage, using curated beauty catalog fallback.');
    try {
      customBadges = await getProductCustomBadges();
    } catch {}
  }

  // If DB returned 0 products or is empty/offline, filter from COSMETICS_CATALOG
  if (products.length === 0) {
    let filtered = COSMETICS_CATALOG.filter(p => !p.isPOSOnly);

    if (categoryParam) {
      filtered = filtered.filter(p => 
        p.categorySlug === normalizedCategory || 
        p.categorySlug === categoryParam || 
        p.categoryId === categoryParam
      );
    }

    if (filterParam === 'offers') {
      filtered = filtered.filter(p => findActivePromotionForProduct(p.id, p.slug, 'STOREFRONT', activePromos) !== null);
    }

    if (q) {
      const lowerQ = q.toLowerCase();
      filtered = filtered.filter(p => 
        p.nameAr.toLowerCase().includes(lowerQ) || 
        p.nameEn.toLowerCase().includes(lowerQ) ||
        p.brandName.toLowerCase().includes(lowerQ)
      );
    }

    // Map to expected structure with strict promotion pricing
    products = filtered.map(p => {
      const pricing = computeProductPromotionPricing(p, 'STOREFRONT', activePromos);

      return {
        id: p.id,
        slug: p.slug,
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        category: { id: p.categoryId, name: p.categoryName, slug: p.categorySlug },
        categoryId: p.categoryId,
        brand: { name: p.brandName },
        variants: p.variants,
        images: p.images,
        rating: p.rating,
        isFeatured: p.isFeatured,
        tag: p.tag || customBadges[p.id] || customBadges[p.slug] || undefined,
        priceFils: pricing.priceFils,
        originalPriceFils: pricing.originalPriceFils,
        compareAtPriceFils: pricing.compareAtPriceFils,
        discountPercent: pricing.discountPercent,
        hasOffer: pricing.hasOffer,
      };
    });
    totalCount = products.length;

    if (categories.length === 0) {
      categories = [
        { id: 'cat-makeup', name: 'المكياج', slug: 'makeup' },
        { id: 'cat-skincare', name: 'العناية بالبشرة', slug: 'skincare' },
        { id: 'cat-haircare', name: 'العناية بالشعر', slug: 'haircare' },
        { id: 'cat-fragrances', name: 'العطور', slug: 'fragrances' },
        { id: 'cat-beauty-tools', name: 'أدوات التجميل', slug: 'beauty-tools' },
        { id: 'cat-accessories', name: 'الإكسسوارات', slug: 'accessories' },
      ];
    }
  }

  // Category-specific rich content headers (كلام مناسب لكل قسم)
  const categoryHeaders: Record<string, { title: string; subtitle: string; badge: string }> = {
    all: {
      badge: isAr ? 'تشكيلة الجمال والأناقة' : 'Complete Beauty Catalog',
      title: isAr ? 'متجر غزل لمستحضرات التجميل والعناية' : 'Ghazal Beauty Collection',
      subtitle: isAr 
        ? 'تسوقي أحدث صيحات المكياج، العناية بالبشرة والشعر، وأرقى العطور مع خدمة التوصيل لكافة المحافظات والدفع عند الاستلام.'
        : 'Discover cosmetics, skincare, haircare, and fragrances with fast delivery across Jordan.',
    },
    makeup: {
      badge: isAr ? 'إشراقة وإطلالة ساحرة' : 'Radiant Glamour',
      title: isAr ? 'عالم المكياج ومستحضرات التجميل' : 'Makeup & Cosmetics',
      subtitle: isAr
        ? 'أحدث كريمات الأساس، أحمر الشفاه، الماسكارا، وباليتات الظلال من أشهر الماركات العالمية لإبراز جمالكِ الطبيعي وتألقكِ في كل مناسبة.'
        : 'Explore foundations, lipsticks, mascaras, and eyeshadow palettes from top global beauty brands.',
    },
    skincare: {
      badge: isAr ? 'نضارة وصحة البشرة' : 'Healthy Radiant Skin',
      title: isAr ? 'العناية الفائقة بالبشرة' : 'Skincare & Essentials',
      subtitle: isAr
        ? 'سيرومات علاجية مركزة، غسولات لطيفة، ومرطبات طبية معتمدة لحماية وتجديد خلايا بشرتكِ ومنحها الإشراقة والصفاء الدائم.'
        : 'Targeted serums, gentle cleansers, and dermatologist-tested moisturizers for glowing skin.',
    },
    haircare: {
      badge: isAr ? 'حيوية ولمعان الشعر' : 'Hair Health & Vitality',
      title: isAr ? 'العناية وترميم الشعر' : 'Haircare & Treatments',
      subtitle: isAr
        ? 'أفضل الزيوت المغذية، الشامبوهات المعالجة، وماسكات الأرغان لترميم التلف وفك التشابك لشعر ناعم، صحي، وحريري الملمس.'
        : 'Nourishing oils, restorative shampoos, and intensive hair masks for healthy hair.',
    },
    fragrances: {
      badge: isAr ? 'عبير وأناقة تدوم' : 'Long-Lasting Scents',
      title: isAr ? 'العطور الفاخرة والنفحات الشرقية' : 'Luxury Perfumes & Scents',
      subtitle: isAr
        ? 'باقة عطرية مميزة تجمع بين الفواحان العالي والثبات الطويل بتركيزات راقية تلائم جميع الأوقات والمناسبات الخاصة.'
        : 'Exquisite fragrance compositions with exceptional sillage and longevity.',
    },
    perfumes: {
      badge: isAr ? 'عبير وأناقة تدوم' : 'Long-Lasting Scents',
      title: isAr ? 'العطور الفاخرة والنفحات الشرقية' : 'Luxury Perfumes & Scents',
      subtitle: isAr
        ? 'باقة عطرية مميزة تجمع بين الفواحان العالي والثبات الطويل بتركيزات راقية تلائم جميع الأوقات والمناسبات الخاصة.'
        : 'Exquisite fragrance compositions with exceptional sillage and longevity.',
    },
    accessories: {
      badge: isAr ? 'لمسات أنيقة وهدايا' : 'Chic Accents & Gifts',
      title: isAr ? 'الإكسسوارات وبكجات الهدايا' : 'Accessories & Gift Sets',
      subtitle: isAr
        ? 'حقائب مكياج مخملية، إكسسوارات أنيقة، وبكجات هدايا صممت لتضفي لمسة رقي وجمال على كل تفاصيلكِ وتكون هدية مثالية لمن تحبين.'
        : 'Cosmetic pouches, elegant accessories, and curated gift boxes for all occasions.',
    },
    'beauty-tools': {
      badge: isAr ? 'تطبيق احترافي دقيق' : 'Pro Application Tools',
      title: isAr ? 'أدوات وفرش المكياج الاحترافية' : 'Beauty & Makeup Tools',
      subtitle: isAr
        ? 'فرش ناعمة عالية الجودة وإسفنجات دمج متطورة تمنحكِ توزيعاً متجانساً واحترافياً لمكياجكِ دون أي تكتل أو هدر للمنتج.'
        : 'Professional blenders, ultra-soft brushes, and precision tools for flawless application.',
    },
    tools: {
      badge: isAr ? 'تطبيق احترافي دقيق' : 'Pro Application Tools',
      title: isAr ? 'أدوات وفرش المكياج الاحترافية' : 'Beauty & Makeup Tools',
      subtitle: isAr
        ? 'فرش ناعمة عالية الجودة وإسفنجات دمج متطورة تمنحكِ توزيعاً متجانساً واحترافياً لمكياجكِ دون أي تكتل أو هدر للمنتج.'
        : 'Professional blenders, ultra-soft brushes, and precision tools for flawless application.',
    },
    offers: {
      badge: isAr ? 'العروض والتخفيضات' : 'Special Offers',
      title: isAr ? 'العروض والتخفيضات' : 'Offers & Discounts',
      subtitle: isAr
        ? 'خصومات وعروض على أفضل منتجات التجميل والمكياج بأسعار خاصة ولفترة محدودة.'
        : 'Discounts on top beauty products for a limited time.',
    },
  };

  const currentHeaderKey = filterParam === 'offers' 
    ? 'offers' 
    : (categoryParam ? normalizedCategory : 'all');
  const activeHeader = categoryHeaders[currentHeaderKey] || categoryHeaders['all'];

  const displayTitle = q ? (isAr ? `نتائج البحث عن: "${q}"` : `Search results for: "${q}"`) : activeHeader.title;
  const displaySubtitle = q ? (isAr ? `وجدنا ${totalCount} منتج يطابق معايير بحثكِ` : `Found ${totalCount} matching items`) : activeHeader.subtitle;
  const displayBadge = q ? (isAr ? 'البحث في المتجر' : 'Store Search') : activeHeader.badge;

  // Group filtered products by category for the mobile feed
  const categoriesMap = new Map();
  for (const product of products) {
    const catId = product.categoryId || product.category?.id || 'general';
    const catName = product.category?.name || 'المنتجات';
    const catSlug = product.category?.slug || 'shop';
    if (!categoriesMap.has(catId)) {
      categoriesMap.set(catId, {
        id: catId,
        name: catName,
        slug: catSlug,
        products: []
      });
    }
    categoriesMap.get(catId).products.push(product);
  }
  const groupedCategories = Array.from(categoriesMap.values());

  return (
    <div className="bg-white min-h-screen pb-20 font-sans" dir={isAr ? 'rtl' : 'ltr'} style={{ backgroundColor: '#ffffff', colorScheme: 'only light' }}>
      {/* Header Banner - Hot Pink Accent */}
      <div className="bg-gradient-to-r from-[#1A1A1A] via-[#2A1020] to-[#1A1A1A] text-white py-12 md:py-16 text-center border-b-4 border-[#E6007E] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#E6007E_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
        
        <div className="container mx-auto px-6 relative z-10 max-w-3xl">
          <h1 className="text-3xl md:text-5xl font-extrabold font-heading mb-3 text-white tracking-tight">
            {displayTitle}
          </h1>
          <p className="text-zinc-300 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
            {displaySubtitle}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 mt-8 flex flex-col gap-6">
        
        {/* Inline Top Filters */}
        <div className="mb-6">
          <ShopFilters 
            categories={categories} 
            genders={genders}
            families={families}
            initialCategory={categoryParam}
            initialGender={genderStr}
            initialFamily={familyStr}
          />
        </div>

        {/* Product Grid */}
        <main className="w-full overflow-hidden">
          <PaginatedProductGrid 
            key={`${categoryParam}-${q}-${filterParam}-${genderStr}-${familyStr}`}
            initialProducts={products}
            totalCount={totalCount}
            locale={locale}
            filters={{ categoryId: categoryParam, genderId: genderStr, familyId: familyStr, q }}
          />
        </main>
      </div>
    </div>
  );
}
