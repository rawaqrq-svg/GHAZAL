// Curated Comprehensive Cosmetics & Beauty Catalog for GHAZAL Cosmetics
export interface DemoProduct {
  id: string;
  slug: string;
  sku: string;
  barcode: string;
  quickCode?: string; // Shortcode like "1234"
  nameAr: string;
  nameEn: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  brandName: string;
  priceFils: number;
  originalPriceFils?: number;
  rating: number;
  reviewsCount: number;
  tag?: string;
  isFeatured: boolean;
  isPOSOnly?: boolean;
  channel?: 'ONLINE' | 'POS' | 'SHARED';
  shortDescription: string;
  fullDescription: string;
  howToUse: string;
  features: string[];
  images: Array<{ id: string; url: string; isMain: boolean }>;
  variants: Array<{
    id: string;
    sku: string;
    barcode: string;
    size: string;
    shade: string;
    colorHex?: string;
    imageUrl?: string;
    scent?: string;
    colorName?: string;
    price: number;
    stock: number;
  }>;
}

export const COSMETICS_CATALOG: DemoProduct[] = [
  {
    id: 'ghaz-prod-1',
    slug: 'maybelline-superstay-vinyl-ink',
    sku: 'MAY-VIN-020',
    barcode: '6902395778014',
    quickCode: '1001',
    nameAr: 'أحمر شفاه مايبيلين سوبر ستاي فينيل إنك',
    nameEn: 'Maybelline Super Stay Vinyl Ink Liquid Lipstick',
    categoryId: 'cat-makeup',
    categorySlug: 'makeup',
    categoryName: 'المكياج',
    brandName: 'MAYBELLINE NEW YORK',
    priceFils: 12000, // 12.000 JOD
    rating: 4.9,
    reviewsCount: 380,
    isFeatured: true,
    shortDescription: 'أحمر شفاه سائل بلمعان فينيل يدوم حتى 16 ساعة دون تلطخ أو جفاف.',
    fullDescription: 'يمنحكِ أحمر الشفاه سوبر ستاي فينيل إنك من مايبيلين لوناً كثيفاً مشبعاً ولمعاناً لا يقاوم بثبات يدوم حتى 16 ساعة بتركيبة Color Lock المقاومة للتلطخ والتلاشي.',
    howToUse: 'رجي العبوة جيداً لمدة 5 ثوانٍ قبل الاستخدام لتفعيل التركيبة، ثم وزعي اللون على شفاه نظيفة وجافة واتركيه يجف تماماً للحصول على لمعان وثبات فائق.',
    features: [
      'ثبات طويل الأمد حتى 16 ساعة دون الحاجة لتجديده',
      'لمعان جذاب فينيل لا يلتصق ومقاوم للتلطخ',
      'غني بفيتامين E وخلاصة الألوفيرا لترطيب ونعومة الشفاه',
      'تغطية كاملة من المسحة الأولى'
    ],
    images: [
      { id: 'img-1-1', url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80', isMain: true },
      { id: 'img-1-2', url: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=600&q=80', isMain: false },
    ],
    variants: [
      { id: 'v1-1', sku: 'MAY-VIN-020', barcode: '6902395778014', size: '4.2ml', shade: '20 Coy (وردي أنيق)', colorHex: '#E6007E', imageUrl: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80', price: 12000, stock: 45 },
      { id: 'v1-2', sku: 'MAY-VIN-035', barcode: '6902395778021', size: '4.2ml', shade: '35 Cheeky (نيود ناعم)', colorHex: '#B2675E', imageUrl: 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?auto=format&fit=crop&w=600&q=80', price: 12000, stock: 32 },
      { id: 'v1-3', sku: 'MAY-VIN-050', barcode: '6902395778038', size: '4.2ml', shade: '50 Wicked (أحمر كلاسيكي)', colorHex: '#A3001E', imageUrl: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=600&q=80', price: 12000, stock: 20 },
    ]
  },
  {
    id: 'ghaz-prod-2',
    slug: 'loreal-infaillible-foundation',
    sku: 'LOR-INF-120',
    barcode: '3600523784112',
    quickCode: '1002',
    nameAr: 'كريم أساس لوريال إنفاليبل 24 ساعة مات كفر',
    nameEn: "L'Oréal Paris Infaillible 24H Matte Cover Foundation",
    categoryId: 'cat-makeup',
    categorySlug: 'makeup',
    categoryName: 'المكياج',
    brandName: "L'ORÉAL PARIS",
    priceFils: 16500, // 16.500 JOD
    rating: 4.9,
    reviewsCount: 412,
    isFeatured: true,
    shortDescription: 'تغطية كاملة غير لامعة تتحكم بزيوت البشرة وتدوم طوال اليوم دون تكتل.',
    fullDescription: 'كريم أساس خفيف الوزن بتركيبة غنية بحمض الهيالورونيك وتقنية مقاومة التعرق والماء. يوفر ملمساً طبيعياً ناعماً للبشرة بدون لمعان زائد أو انسداد للمسام.',
    howToUse: 'ضعي نقاطاً صغيرة على الجبهة والخدين والذقن، ثم وزعيها باستخدام إسفنجة بيوتي بلندر مبللة أو فرشاة الفاونديشن من المنتصف نحو الخارج.',
    features: [
      'تغطية مثالية لعيوب وتصبغات البشرة تدوم 24 ساعة',
      'حماية مدمجة SPF 18 ضد أشعة الشمس الضارة',
      'مقاوم للماء والحرارة والتعرق وعوامل الرطوبة',
      'مناسب جداً للبشرة الدهنية والمختلطة والمعرضة للمعان'
    ],
    images: [
      { id: 'img-2-1', url: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?auto=format&fit=crop&w=600&q=80', isMain: true },
      { id: 'img-2-2', url: 'https://images.unsplash.com/photo-1599732497672-886ec5717a66?auto=format&fit=crop&w=600&q=80', isMain: false }
    ],
    variants: [
      { id: 'v2-1', sku: 'LOR-INF-110', barcode: '3600523784112', size: '30ml', shade: '110 Rose Vanilla (فاتح وردي)', colorHex: '#F6E4D6', imageUrl: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?auto=format&fit=crop&w=600&q=80', price: 16500, stock: 25 },
      { id: 'v2-2', sku: 'LOR-INF-120', barcode: '3600523784129', size: '30ml', shade: '120 Vanilla (طبيعي متوازن)', colorHex: '#E8C39E', imageUrl: 'https://images.unsplash.com/photo-1599732497672-886ec5717a66?auto=format&fit=crop&w=600&q=80', price: 16500, stock: 38 },
      { id: 'v2-3', sku: 'LOR-INF-130', barcode: '3600523784136', size: '30ml', shade: '130 True Beige (حنطي دافئ)', colorHex: '#DFB183', imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80', price: 16500, stock: 28 },
    ]
  },
  {
    id: 'ghaz-prod-3',
    slug: 'nyx-ultimate-shadow-palette',
    sku: 'NYX-ULT-016',
    barcode: '800897017637',
    quickCode: '1003',
    nameAr: 'باليت ظلال عيون ألتيميت شادو من نيكْس',
    nameEn: 'NYX Ultimate Shadow Palette Warm Neutrals',
    categoryId: 'cat-makeup',
    categorySlug: 'makeup',
    categoryName: 'المكياج',
    brandName: 'NYX MAKEUP',
    priceFils: 19000,
    rating: 4.8,
    reviewsCount: 186,
    isFeatured: false,
    shortDescription: '16 لوناً دافئاً بتدرجات مطفية ولامعة لمكياج عيون احترافي جذاب.',
    fullDescription: 'باليت احترافية تضم تشكيلة متناغمة من درجات النيود، البرونز، والشوكولاتة الدافئة. تتميز الظلال بقوام ناعم حريري سهل الدمج وقوة صبغية عالية تدوم لساعات طويلة.',
    howToUse: 'استخدمي درجات البيج الانتقالية كأساس للجفن، ثم طبقي الدرجات الداكنة لتعميق زاوية العين، وأضيفي لمسة براقة في المنتصف ومدمع العين.',
    features: [
      '16 درجة لونية غنية ومختارة بعناية للمناسبات والمكياج اليومي',
      'تدرجات متنوعة بين المات (Matte)، الساتان (Satin)، والشيمر (Shimmer)',
      'صبغة ألوان قوية بدون تساقط أو تلطخ',
      'سهلة الدمج حتى للمبتدئات'
    ],
    images: [{ id: 'img-3-1', url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80', isMain: true }],
    variants: [
      { id: 'v3-1', sku: 'NYX-ULT-016', barcode: '800897017637', size: '16 Shades', shade: 'Warm Neutrals (نيود دافئ)', colorHex: '#9B5B32', imageUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80', price: 19000, stock: 18 }
    ]
  },
  {
    id: 'ghaz-prod-4',
    slug: 'laneige-lip-sleeping-mask-berry',
    sku: 'LAN-LIP-020',
    barcode: '8809643068995',
    quickCode: '1004',
    nameAr: 'مرطب الشفاه الليلي بالتوت من لانيج',
    nameEn: 'Laneige Lip Sleeping Mask Berry',
    categoryId: 'cat-skincare',
    categorySlug: 'skincare',
    categoryName: 'العناية بالبشرة',
    brandName: 'LANEIGE',
    priceFils: 18000,
    rating: 5.0,
    reviewsCount: 238,
    isFeatured: true,
    shortDescription: 'قناع ليلي مغذٍ يذيب خلايا الجلد الميتة ويمنح الشفاه امتلاءً ونعومة فائقة.',
    fullDescription: 'تركيبة كورية أصلية غنية بفيتامين C ومضادات الأكسدة المستخلصة من التوت المشكل مع تقنية Moisture Wrap المرطبة التي تحبس الرطوبة طوال الليل لتستيقظي بشفاه ناعمة كالحرير.',
    howToUse: 'ضعي طبقة وفيرة على الشفاه قبل النوم باستخدام الملعقة المرفقة، ثم امسحي الفائض بلطف في الصباح بمنديل ناعم.',
    features: [
      'تغذية وترطيب مكثف يعالج أصعب التشققات وجفاف الشفاه',
      'يمنح الشفاه مظهراً ممتلئاً ونضراً',
      'رائحة التوت الطبيعي المنعشة',
      'يدوم لفترة طويلة بفضل حجمه الاقتصادي'
    ],
    images: [
      { id: 'img-4-1', url: 'https://images.unsplash.com/photo-1608248597359-00f898114f08?auto=format&fit=crop&w=600&q=80', isMain: true },
      { id: 'img-4-2', url: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80', isMain: false }
    ],
    variants: [
      { id: 'v4-1', sku: 'LAN-LIP-020', barcode: '8809643068995', size: '20g', shade: 'Berry (توت بري)', colorHex: '#FF6B81', imageUrl: 'https://images.unsplash.com/photo-1608248597359-00f898114f08?auto=format&fit=crop&w=600&q=80', price: 18000, stock: 35 },
      { id: 'v4-2', sku: 'LAN-LIP-021', barcode: '8809643068988', size: '20g', shade: 'Gummy Bear (علكة العنب)', colorHex: '#8E24AA', imageUrl: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80', price: 18000, stock: 20 }
    ]
  },
  {
    id: 'ghaz-prod-5',
    slug: 'the-ordinary-niacinamide-zinc',
    sku: 'ORD-NIA-030',
    barcode: '769915190311',
    quickCode: '1005',
    nameAr: 'سيروم النياسيناميد 10% والزنك 1% من ذا أورديناري',
    nameEn: 'The Ordinary Niacinamide 10% + Zinc 1%',
    categoryId: 'cat-skincare',
    categorySlug: 'skincare',
    categoryName: 'العناية بالبشرة',
    brandName: 'THE ORDINARY',
    priceFils: 8500, // 8.500 JOD
    rating: 4.9,
    reviewsCount: 520,
    isFeatured: false,
    shortDescription: 'سيروم علاجي لتقليل إفراز الدهون وتضييق المسام وتوحيد لون البشرة.',
    fullDescription: 'تركيبة عالية التركيز تجمع بين فيتامين B3 (النياسيناميد) بمعدل 10% لتقليل ظهور البقع والعيوب، مع ملح الزنك 1% لتنظيم إفراز الزهم ومنع لمعان البشرة.',
    howToUse: 'ضعي بضع قطرات على كامل الوجه صباحاً ومساءً قبل الكريمات الثقيلة. تجنبي استخدامه مع علاجات فيتامين C المباشرة في نفس الروتين.',
    features: [
      'تنظيم إفراز الزيوت وتقليل الدهون الزائدة',
      'تضييق المسام الواسعة بشكل ملحوظ',
      'تهدئة الاحمرار وتخفيف آثار الحبوب القديمة',
      'تركيبة خفيفة وسريعة الامتصاص خالية من العطور والسيليكون'
    ],
    images: [{ id: 'img-5-1', url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80', isMain: true }],
    variants: [
      { id: 'v5-1', sku: 'ORD-NIA-030', barcode: '769915190311', size: '30ml', shade: '30ml', colorHex: '#F2F2F2', imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80', price: 8500, stock: 60 },
      { id: 'v5-2', sku: 'ORD-NIA-060', barcode: '769915190328', size: '60ml (حجم توفيري)', shade: '60ml', colorHex: '#F2F2F2', imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80', price: 14000, stock: 24 }
    ]
  },
  {
    id: 'ghaz-prod-6',
    slug: 'cerave-hydrating-cleanser',
    sku: 'CER-HYD-236',
    barcode: '3337875597180',
    quickCode: '1006',
    nameAr: 'غسول الوجه المرطب للبشرة الجافة والعادية من سيرافي',
    nameEn: 'CeraVe Hydrating Facial Cleanser with Ceramides',
    categoryId: 'cat-skincare',
    categorySlug: 'skincare',
    categoryName: 'العناية بالبشرة',
    brandName: 'CERAVE',
    priceFils: 11500,
    rating: 4.9,
    reviewsCount: 310,
    isFeatured: false,
    shortDescription: 'غسول لطيف ينظف البشرة بعمق دون الإخلال بحاجز الحماية الطبيعي.',
    fullDescription: 'غسول جل كريمي مصمم مع أطباء الجلدية يحتوي على 3 سيراميدات أساسية وحمض الهيالورونيك، يعمل على إزالة الأوساخ والشوائب والمكياج بلطف مع ترطيب مستمر طوال اليوم بفضل تقنية MVE.',
    howToUse: 'بللي الوجه بالماء الفاتر، دلكي الغسول بحركات دائرية لطيفة حتى يتحول لقوام كريمي ناعم، ثم اشطفيه جيداً وجففي وجهكِ بلطف.',
    features: [
      'يحتوي على السيراميدات 1 و3 و6-II لترميم حاجز البشرة',
      'خالٍ تماماً من الصابون والعطور والبارابين',
      'لا يسد المسام (Non-comedogenic) ومناسب للبشرة الحساسة',
      'يمنح ترطيباً فورياً ولا يسبب شد البشرة أو الجفاف'
    ],
    images: [{ id: 'img-6-1', url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80', isMain: true }],
    variants: [
      { id: 'v6-1', sku: 'CER-HYD-236', barcode: '3337875597180', size: '236ml', shade: '236ml', colorHex: '#EBF4F6', imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80', price: 11500, stock: 40 },
      { id: 'v6-2', sku: 'CER-HYD-473', barcode: '3337875597197', size: '473ml (كبير اقتصادي)', shade: '473ml', colorHex: '#EBF4F6', imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80', price: 18500, stock: 25 }
    ]
  },
  {
    id: 'ghaz-prod-7',
    slug: 'argan-oil-hair-repair-mask',
    sku: 'GHZ-ARG-250',
    barcode: '6253800119021',
    quickCode: '1007',
    nameAr: 'ماسك زيت الأرغان المغربي لإصلاح وترميم الشعر',
    nameEn: 'Moroccan Argan Oil Intensive Hair Repair Mask',
    categoryId: 'cat-haircare',
    categorySlug: 'haircare',
    categoryName: 'العناية بالشعر',
    brandName: 'GHAZAL CARE',
    priceFils: 14000,
    rating: 4.8,
    reviewsCount: 140,
    isFeatured: true,
    shortDescription: 'علاج مكثف يعيد للشعر الجاف والمصبوغ نعومته ولمعانه من أول استخدام.',
    fullDescription: 'تركيبة غنية بخلاصة زيت الأرغان العضوي النقي، الكيراتين الطبيعي، وبروتينات الحرير. تخترق ألياف الشعر بعمق لترميم التلف الناتج عن الصبغات والحرارة ومنع التقصف.',
    howToUse: 'بعد غسل الشعر بالشامبو، وزعي كمية مناسبة على خصلات الشعر من المنتصف حتى الأطراف، اتركيه لمدة 5-10 دقائق ثم اشطفيه بالماء الفاتر جيداً.',
    features: [
      'ترطيب عميق يفك التشابك ويقلل النفشة بشكل ملحوظ',
      'حماية الشعر من حرارة السيشوار والحرارة البيئية',
      'آمن للشعر المعالج بالبروتين والكيراتين وخالٍ من الكبريتات',
      'يمنح الشعر لمعاناً صحياً وملمساً حريرياً'
    ],
    images: [{ id: 'img-7-1', url: '/logo.png', isMain: true }],
    variants: [
      { id: 'v7-1', sku: 'GHZ-ARG-250', barcode: '6253800119021', size: '250ml', shade: 'ماسك كريمي غني', colorHex: '#D4AF37', price: 14000, stock: 30 }
    ]
  },
  {
    id: 'ghaz-prod-8',
    slug: 'ghazal-signature-edp',
    sku: 'GHZ-EDP-100',
    barcode: '6253800119038',
    quickCode: '1008',
    nameAr: 'عطر غزل سيجنتشر المركز — للجنسين',
    nameEn: 'Ghazal Signature Extrait de Parfum',
    categoryId: 'cat-fragrances',
    categorySlug: 'fragrances',
    categoryName: 'العطور',
    brandName: 'GHAZAL PERFUMES',
    priceFils: 35000,
    rating: 5.0,
    reviewsCount: 97,
    isFeatured: true,
    shortDescription: 'توليفة عطرية آسرة تجمع بين الفانيليا الدافئة، العنبر، والورد الدمشقي بتركيز عالي.',
    fullDescription: 'عطر خاص يمثل الهوية العطرية الراقية لمحل غزل. يفتتح بنفحات منعشة من البرغموت والتوت الوردي، يليه قلب زهري من الياسمين والورد، ليستقر على قاعدة فخمة من خشب الصندل، العنبر، والمسك الأبيض.',
    howToUse: 'رشي العطر على نقاط النبض في المعصمين، العنق، وخلف الأذنين، وعلى الملابس من مسافة مناسبة لثبات يدوم أكثر من 24 ساعة.',
    features: [
      'تركيز عالي Extrait de Parfum لضمان فوحان وثبات يدوم طويلاً',
      'زجاجة كريستالية فاخرة تناسب الإهداء والمناسبات الخاصة',
      'مزيج متوازن يلائم جميع الفصول والأوقات',
      'توليفة عصرية حصرية بمحل غزل'
    ],
    images: [
      { id: 'img-8-1', url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80', isMain: true },
      { id: 'img-8-2', url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80', isMain: false },
    ],
    variants: [
      { id: 'v8-1', sku: 'GHZ-EDP-050', barcode: '6253800119038', size: '50ml', shade: '50ml — وردي ناعم (Eau de Parfum)', colorHex: '#E6007E', imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80', price: 25000, stock: 20 },
      { id: 'v8-2', sku: 'GHZ-EDP-100', barcode: '6253800119045', size: '100ml', shade: '100ml — ذهبي مركز (Extrait de Parfum)', colorHex: '#D4AF37', imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80', price: 35000, stock: 35 }
    ]
  },
  {
    id: 'ghaz-prod-9',
    slug: 'beauty-blender-pro-set',
    sku: 'GHZ-BLN-004',
    barcode: '6253800119052',
    quickCode: '1009',
    nameAr: 'طقم إسفنجات دمج المكياج الاحترافية (4 قطع)',
    nameEn: 'Ghazal Professional Beauty Blender Sponge Set (4 Pcs)',
    categoryId: 'cat-beauty-tools',
    categorySlug: 'beauty-tools',
    categoryName: 'أدوات التجميل',
    brandName: 'GHAZAL TOOLS',
    priceFils: 6000,
    rating: 4.9,
    reviewsCount: 88,
    isFeatured: false,
    shortDescription: 'إسفنجات ناعمة خالية من اللاتكس لدمج كريم الأساس والكونسيلر باحترافية.',
    fullDescription: 'مجموعة متكاملة من 4 إسفنجات تجميل بأشكال وزوايا متعددة للوصول إلى أدق زوايا الوجه تحت العين وحول الأنف. تكبر حجماً وتصبح أكثر نعومة عند بلها بالماء لتمنحكِ تغطية متجانسة كالفوتوشوب.',
    howToUse: 'بللي الإسفنجة بالماء واعصريها جيداً للتخلص من الماء الزائد، ثم طبقي الفاونديشن أو الكونسيلر بحركات تربيت ناعمة.',
    features: [
      'مادة عالية الجودة خالية من اللاتكس 100% ولا تسبب حساسية',
      'لا تمتص أو تهدر كميات كبيرة من كريم الأساس',
      'تتضمن أشكال مختلفة للدمج، التحديد، والتثبيت بالبودرة',
      'سهلة الغسيل والتنظيف وسريعة الجفاف'
    ],
    images: [{ id: 'img-9-1', url: '/logo.png', isMain: true }],
    variants: [
      { id: 'v9-1', sku: 'GHZ-BLN-004', barcode: '6253800119052', size: 'طقم 4 قطع', shade: 'وردي وفوشيا', colorHex: '#E6007E', price: 6000, stock: 50 }
    ]
  },
  {
    id: 'ghaz-prod-10',
    slug: 'velvet-cosmetic-pouch',
    sku: 'GHZ-PCH-001',
    barcode: '6253800119069',
    quickCode: '1010',
    nameAr: 'حقيبة مكياج مخملية فاخرة لحمل مستحضرات التجميل',
    nameEn: 'Luxury Velvet Cosmetic Travel Pouch',
    categoryId: 'cat-accessories',
    categorySlug: 'accessories',
    categoryName: 'الإكسسوارات',
    brandName: 'GHAZAL ACCESSORIES',
    priceFils: 7500,
    rating: 4.8,
    reviewsCount: 64,
    isFeatured: false,
    shortDescription: 'حقيبة واسعة وأنيقة مبطنة لحفظ وحماية مكياجكِ أثناء التنقل والسفر.',
    fullDescription: 'حقيبة مكياج مصنوعة من قماش المخمل الفاخر المقاوم للماء بتطريز ذهبي أنيق وشعار غزل، مزودة بسحاب متين وقسم داخلي منظم لاستيعاب جميع مستحضراتكِ اليومية والفرش بسهولة.',
    howToUse: 'مثالية للاستخدام اليومي في حقيبة اليد أو لحفظ أدوات المكياج أثناء السفر والمناسبات.',
    features: [
      'قماش مخملي ناعم الملمس وسهل المسح والتنظيف',
      'بطانة داخلية واقية ضد تسرب السوائل أو كسر البودرة',
      'سحاب معدني عالي الجودة يدوم طويلاً',
      'حجم مثالي يتسع للباليتات، الفاونديشن، والفرش الكبيرة'
    ],
    images: [{ id: 'img-10-1', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80', isMain: true }],
    variants: [
      { id: 'v10-1', sku: 'GHZ-PCH-001', barcode: '6253800119069', size: '22x15 cm', shade: 'وردي غزل وردي ناعم', colorHex: '#FADAE6', price: 7500, stock: 40 },
      { id: 'v10-2', sku: 'GHZ-PCH-002', barcode: '6253800119076', size: '22x15 cm', shade: 'أسود ملكي فاخر', colorHex: '#1A1A1A', price: 7500, stock: 35 }
    ]
  },
  {
    id: 'ghaz-prod-11',
    slug: 'loreal-true-match-foundation',
    sku: 'LOR-TRU-001',
    barcode: '3600522862415',
    quickCode: '1011',
    nameAr: 'كريم أساس لوريال باريس ترو ماتش الفائق النعومة والترطيب',
    nameEn: "L'Oréal Paris True Match Super-Blendable Foundation",
    categoryId: 'cat-makeup',
    categorySlug: 'makeup',
    categoryName: 'المكياج',
    brandName: "L'ORÉAL PARIS",
    priceFils: 15000,
    rating: 4.9,
    reviewsCount: 412,
    isFeatured: true,
    shortDescription: 'كريم أساس بتركيبة مبتكرة مطابقة لدرجة ولون البشرة مع حمض الهيالورونيك.',
    fullDescription: 'كريم أساس ترو ماتش من لوريال باريس يمنحكِ تغطية طبيعية متكاملة وقابلة للبناء مع مظهر بشرة متألقة وندية. غني بحمض الهيالورونيك وخلاصة الصبار لترطيب يدوم 24 ساعة وحماية من الشمس SPF 17.',
    howToUse: 'رجي العبوة قبل الاستخدام، ثم ضعي كمية مناسبة ووزعيها بلطف على الوجه بحركات دائرية باستخدام الإسفنجة أو الفرشاة.',
    features: [
      'يتناغم بدقة فائقة مع نغمة البشرة الطبيعية',
      'غني بحمض الهيالورونيك لترطيب يدوم طوال اليوم',
      'خالي من الزيوت ولا يسد المسام (Non-comedogenic)',
      'تغطية متوسطة قابلة للبناء مع ملمس حريري طبيعي'
    ],
    images: [
      { id: 'img-11-1', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80', isMain: true },
      { id: 'img-11-2', url: 'https://images.unsplash.com/photo-1631730486784-545631bc2a4d?auto=format&fit=crop&w=600&q=80', isMain: false },
    ],
    variants: [
      { id: 'v11-1', sku: 'LOR-TRU-03N', barcode: '3600522862415', size: '30ml', shade: '3N Creamy Beige (بيج طبيعي)', colorHex: '#E2B897', imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80', price: 15000, stock: 28 },
      { id: 'v11-2', sku: 'LOR-TRU-02N', barcode: '3600522862422', size: '30ml', shade: '2N Vanilla (فانيلا فاتح)', colorHex: '#ECC7A7', imageUrl: 'https://images.unsplash.com/photo-1631730486784-545631bc2a4d?auto=format&fit=crop&w=600&q=80', price: 15000, stock: 24 },
      { id: 'v11-3', sku: 'LOR-TRU-04N', barcode: '3600522862439', size: '30ml', shade: '4N Beige Doré (بيج ذهبي دافئ)', colorHex: '#D6A47B', imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80', price: 15000, stock: 19 },
    ]
  },
  {
    id: 'ghaz-prod-12',
    slug: 'maybelline-lash-sensational-mascara',
    sku: 'MAY-LSH-001',
    barcode: '3600531143459',
    quickCode: '1012',
    nameAr: 'ماسكارا مايبيلين لاش سينسيشنال لتكثيف وتطويل الرموش',
    nameEn: 'Maybelline Lash Sensational Very Black Mascara',
    categoryId: 'cat-makeup',
    categorySlug: 'makeup',
    categoryName: 'المكياج',
    brandName: 'MAYBELLINE NEW YORK',
    priceFils: 11000,
    rating: 4.9,
    reviewsCount: 502,
    isFeatured: true,
    shortDescription: 'ماسكارا احترافية بفرشاة مروحية مقوسة تمنح الرموش كثافة وطولاً كالمروحة.',
    fullDescription: 'ماسكارا لاش سينسيشنال من مايبيلين تتميز بفرشاة سيليكون مروحية حصرية مكونة من 10 طبقات من الشعيرات تلتقط كل رمش من الجذور وحتى الأطراف لتكثيف كامل دون أي تكتل.',
    howToUse: 'استخدمي الجانب الداخلي المنحني للفرشاة للوصول لجذور الرموش، ثم اقلبي الفرشاة للجانب الخارجي لتوسيع وتفريق الرموش كالمروحة.',
    features: [
      'فرشاة ثنائية الاستخدام لتكثيف وتفريق كل رمش على حدة',
      'تركيبة سوداء فاحمة مقاومة للتلطخ طوال اليوم',
      'غنية بزيوت الورد المغذية لصحة وقوة الرموش',
      'آمنة ومناسبة للعيون الحساسة ومستخدمي العدسات اللاصقة'
    ],
    images: [
      { id: 'img-12-1', url: 'https://images.unsplash.com/photo-1591360236480-4ed861025fa1?auto=format&fit=crop&w=600&q=80', isMain: true },
    ],
    variants: [
      { id: 'v12-1', sku: 'MAY-LSH-001', barcode: '3600531143459', size: '9.5ml', shade: 'Very Black Waterproof (أسود فاحم مقاوم للماء)', colorHex: '#1A1A1A', imageUrl: 'https://images.unsplash.com/photo-1591360236480-4ed861025fa1?auto=format&fit=crop&w=600&q=80', price: 11000, stock: 35 },
      { id: 'v12-2', sku: 'MAY-LSH-002', barcode: '3600531143466', size: '9.5ml', shade: 'Extra Black Washable (أسود فاحم سهل الإزالة)', colorHex: '#222222', imageUrl: 'https://images.unsplash.com/photo-1591360236480-4ed861025fa1?auto=format&fit=crop&w=600&q=80', price: 11000, stock: 40 },
    ]
  },
  {
    id: 'ghaz-prod-13',
    slug: 'pro-makeup-brush-set',
    sku: 'GHZ-BRS-012',
    barcode: '6253800119083',
    quickCode: '1013',
    nameAr: 'طقم فرش مكياج احترافية متكاملة (12 قطعة مع حقيبة مخملية)',
    nameEn: 'Ghazal Pro Luxury Makeup Brush Set 12pcs with Velvet Pouch',
    categoryId: 'cat-beauty-tools',
    categorySlug: 'beauty-tools',
    categoryName: 'أدوات التجميل',
    brandName: 'GHAZAL TOOLS',
    priceFils: 11900,
    rating: 4.8,
    reviewsCount: 88,
    isFeatured: true,
    shortDescription: 'طقم فاخر من 12 فرشاة مكياج بشعيرات حريرية فائقة النعومة مع حقيبة أنيقة.',
    fullDescription: 'مجموعة شاملة تلبي جميع احتياجات تطبيق المكياج اليومي والاحترافي، تشمل فرش البودرة، كريم الأساس، الكونتور، الإضاءة، وظلال العيون، مصنوعة بشعيرات كثيفة ناعمة تضمن دمجاً سلساً دون إهدار المستحضرات.',
    howToUse: 'استخدمي الفرش الكبيرة لتوزيع البودرة والكونتور، والفرش المتوسطة لكريم الأساس، والفرش الدقيقة للعيون والحواجب.',
    features: [
      'شعيرات نباتية فائقة النعومة على البشرة ولا تتساقط',
      'مقابض خشبية متوازنة توفر قبضة مريحة وثابتة',
      'تتضمن حقيبة مخملية راقية لحفظ وحمل الفرش أثناء السفر',
      'مناسبة لتطبيق المستحضرات البودرة، السائلة، والكريمية'
    ],
    images: [
      { id: 'img-13-1', url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80', isMain: true },
    ],
    variants: [
      { id: 'v13-1', sku: 'GHZ-BRS-012-RG', barcode: '6253800119083', size: '12 فرشاة + حقيبة', shade: 'Rose Gold & Pink (وردي مع ذهبي وردي)', colorHex: '#B76E79', imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80', price: 11900, stock: 25 },
      { id: 'v13-2', sku: 'GHZ-BRS-012-BK', barcode: '6253800119090', size: '12 فرشاة + حقيبة', shade: 'Royal Black & Gold (أسود ملكي مع ذهبي)', colorHex: '#1A1A1A', imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80', price: 11900, stock: 30 },
    ]
  },
  {
    id: 'ghaz-prod-14',
    slug: 'velvet-hair-scrunchies-pack',
    sku: 'GHZ-SCR-006',
    barcode: '6253800119106',
    quickCode: '1014',
    nameAr: 'مجموعة ربطات شعر مخملية فاخرة (6 قطع بألوان باستيل)',
    nameEn: 'Luxury Velvet Hair Scrunchies Pack (6 Pcs)',
    categoryId: 'cat-accessories',
    categorySlug: 'accessories',
    categoryName: 'الإكسسوارات',
    brandName: 'GHAZAL ACCESSORIES',
    priceFils: 5000,
    rating: 4.7,
    reviewsCount: 65,
    isFeatured: false,
    shortDescription: 'ربطات شعر مخملية لطيفة تحمي الشعر من التقصف وتمنحه مظهراً أنيقاً.',
    fullDescription: 'مجموعة مكونة من 6 ربطات شعر مصنوعة من المخمل فائق النعومة، مصممة لتحافظ على تسريحة شعركِ دون شد أو تكسير للأطراف، مع ألوان باستيل هادئة تتناسق مع مختلف الإطلالات اليومية.',
    howToUse: 'مثالية للاستخدام أثناء تطبيق المكياج، الروتين اليومي للعناية بالبشرة، أو لتسريحات الشعر الأنيقة.',
    features: [
      'مخمل ناعم لا يتسبب في تشابك أو تكسر خصلات الشعر',
      'مطاط داخلي عالي المرونة والمتانة لا يتمدد بمرور الوقت',
      'تشكيلة من 6 ألوان عصرية وجذابة',
      'مناسبة لجميع أنواع وسماكات الشعر'
    ],
    images: [
      { id: 'img-14-1', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80', isMain: true },
    ],
    variants: [
      { id: 'v14-1', sku: 'GHZ-SCR-006-PST', barcode: '6253800119106', size: 'طقم 6 قطع', shade: 'Pastel Colors (مزيج الباستيل الهادئ)', colorHex: '#E9C2C9', price: 5000, stock: 45 },
    ]
  },

  // PRESET SHORTCODE ITEMS FOR CASHIER (أقسام الدينار والدينارين وأكواد الكاش السريعة)
  {
    id: 'pos-quick-1',
    slug: 'pos-dinar-section',
    sku: 'POS-1JOD-SEC',
    barcode: '1234',
    quickCode: '1234',
    nameAr: 'مستحضرات قسم الدينار (1 د.أ)',
    nameEn: '1 JOD Section Items',
    categoryId: 'cat-accessories',
    categorySlug: 'accessories',
    categoryName: 'قسم الدينار',
    brandName: 'قسم الدينار السريع',
    priceFils: 1000, // 1.000 JOD
    rating: 5.0,
    reviewsCount: 1500,
    isFeatured: false,
    isPOSOnly: true,
    shortDescription: 'اختصار كاشير سريع لأي منتج أو إكسسوار من قسم الدينار.',
    fullDescription: 'بند سريع لنظام الكاشير لإدخال منتجات وإكسسوارات قسم الدينار بمجرد إدخال الكود 1234 أو مسح كود الاختصار.',
    howToUse: 'إدخال سريع على الكاشير: اكتب 1234 ثم اضغط Enter.',
    features: ['سعر ثابت 1.000 دينار', 'تسجيل فوري بدون صور', 'كود اختصار 1234'],
    images: [{ id: 'img-p1', url: '/logo.png', isMain: true }],
    variants: [
      { id: 'vp-1', sku: 'POS-1JOD-SEC', barcode: '1234', size: '1 د.أ', shade: 'قطعة واحدة', price: 1000, stock: 9999 }
    ]
  },
  {
    id: 'pos-quick-2',
    slug: 'pos-two-dinars-section',
    sku: 'POS-2JOD-SEC',
    barcode: '2222',
    quickCode: '2222',
    nameAr: 'مستحضرات قسم الدينارين (2 د.أ)',
    nameEn: '2 JOD Section Items',
    categoryId: 'cat-accessories',
    categorySlug: 'accessories',
    categoryName: 'قسم الدينارين',
    brandName: 'قسم الدينارين السريع',
    priceFils: 2000, // 2.000 JOD
    rating: 5.0,
    reviewsCount: 800,
    isFeatured: false,
    isPOSOnly: true,
    shortDescription: 'اختصار كاشير سريع لأي منتج من قسم الدينارين.',
    fullDescription: 'بند سريع لنظام الكاشير لإدخال منتجات قسم الدينارين بمجرد إدخال الكود 2222 أو الضغط على زر الاختصار.',
    howToUse: 'إدخال سريع على الكاشير: اكتب 2222 ثم اضغط Enter.',
    features: ['سعر ثابت 2.000 دينار', 'تسجيل فوري بدون صور', 'كود اختصار 2222'],
    images: [{ id: 'img-p2', url: '/logo.png', isMain: true }],
    variants: [
      { id: 'vp-2', sku: 'POS-2JOD-SEC', barcode: '2222', size: '2 د.أ', shade: 'قطعة واحدة', price: 2000, stock: 9999 }
    ]
  },
  {
    id: 'pos-quick-3',
    slug: 'pos-three-dinars-section',
    sku: 'POS-3JOD-SEC',
    barcode: '3333',
    quickCode: '3333',
    nameAr: 'مستحضرات قسم الثلاثة دنانير (3 د.أ)',
    nameEn: '3 JOD Section Items',
    categoryId: 'cat-accessories',
    categorySlug: 'accessories',
    categoryName: 'قسم 3 دنانير',
    brandName: 'قسم 3 دنانير السريع',
    priceFils: 3000, // 3.000 JOD
    rating: 5.0,
    reviewsCount: 600,
    isFeatured: false,
    isPOSOnly: true,
    shortDescription: 'اختصار كاشير سريع لمنتجات قسم 3 دنانير.',
    fullDescription: 'بند سريع لنظام الكاشير لإدخال منتجات قسم 3 دنانير بمجرد إدخال الكود 3333.',
    howToUse: 'إدخال سريع على الكاشير: اكتب 3333 ثم اضغط Enter.',
    features: ['سعر ثابت 3.000 دينار', 'تسجيل فوري بدون صور', 'كود اختصار 3333'],
    images: [{ id: 'img-p3', url: '/logo.png', isMain: true }],
    variants: [
      { id: 'vp-3', sku: 'POS-3JOD-SEC', barcode: '3333', size: '3 د.أ', shade: 'قطعة واحدة', price: 3000, stock: 9999 }
    ]
  },
  {
    id: 'pos-quick-4',
    slug: 'pos-five-dinars-section',
    sku: 'POS-5JOD-SEC',
    barcode: '5555',
    quickCode: '5555',
    nameAr: 'مستحضرات قسم الخمسة دنانير (5 د.أ)',
    nameEn: '5 JOD Section Items',
    categoryId: 'cat-accessories',
    categorySlug: 'accessories',
    categoryName: 'قسم 5 دنانير',
    brandName: 'قسم 5 دنانير السريع',
    priceFils: 5000, // 5.000 JOD
    rating: 5.0,
    reviewsCount: 450,
    isFeatured: false,
    isPOSOnly: true,
    shortDescription: 'اختصار كاشير سريع لمنتجات قسم 5 دنانير وبكجات التوفير.',
    fullDescription: 'بند سريع لنظام الكاشير لإدخال منتجات قسم 5 دنانير بمجرد إدخال الكود 5555.',
    howToUse: 'إدخال سريع على الكاشير: اكتب 5555 ثم اضغط Enter.',
    features: ['سعر ثابت 5.000 دينار', 'تسجيل فوري بدون صور', 'كود اختصار 5555'],
    images: [{ id: 'img-p4', url: '/logo.png', isMain: true }],
    variants: [
      { id: 'vp-4', sku: 'POS-5JOD-SEC', barcode: '5555', size: '5 د.أ', shade: 'قطعة واحدة', price: 5000, stock: 9999 }
    ]
  }
];

export const SLUG_ALIASES: Record<string, string> = {
  // Foundations
  'loreal-true-match-foundation': 'loreal-true-match-foundation',
  'loreal-true-match': 'loreal-true-match-foundation',
  'loreal-infaillible-foundation': 'loreal-infaillible-foundation',
  'loreal-infaillible': 'loreal-infaillible-foundation',
  'loreal-foundation': 'loreal-true-match-foundation',
  
  // Lip masks
  'laneige-lip-sleeping-mask': 'laneige-lip-sleeping-mask-berry',
  'laneige-lip-sleeping-mask-berry': 'laneige-lip-sleeping-mask-berry',
  'laneige-lip-mask': 'laneige-lip-sleeping-mask-berry',
  
  // Eyeshadow palettes
  'eyeshadow-palette-pro': 'nyx-ultimate-shadow-palette',
  'pro-nude-eyeshadow-palette': 'nyx-ultimate-shadow-palette',
  'nyx-ultimate-shadow-palette': 'nyx-ultimate-shadow-palette',
  'nyx-eyeshadow-palette': 'nyx-ultimate-shadow-palette',
  
  // Mascaras
  'maybelline-lash-sensational-mascara': 'maybelline-lash-sensational-mascara',
  'maybelline-lash-sensational': 'maybelline-lash-sensational-mascara',
  'maybelline-mascara': 'maybelline-lash-sensational-mascara',
  
  // Perfumes
  'ghazal-signature-luxury-perfume': 'ghazal-signature-edp',
  'ghazal-signature-edp': 'ghazal-signature-edp',
  'ghazal-perfume': 'ghazal-signature-edp',
  
  // Skincare
  'the-ordinary-niacinamide-serum': 'the-ordinary-niacinamide-zinc',
  'the-ordinary-niacinamide-zinc': 'the-ordinary-niacinamide-zinc',
  'the-ordinary-niacinamide': 'the-ordinary-niacinamide-zinc',
  'cerave-hydrating-cleanser': 'cerave-hydrating-cleanser',
  'cerave-cleanser': 'cerave-hydrating-cleanser',
  
  // Haircare
  'argan-oil-hair-repair-mask': 'argan-oil-hair-repair-mask',
  'moroccan-argan-oil-hair-repair-mask': 'argan-oil-hair-repair-mask',
  
  // Brushes & tools
  'pro-makeup-brush-set': 'pro-makeup-brush-set',
  'makeup-brush-set': 'pro-makeup-brush-set',
  'beauty-blender-pro-set': 'beauty-blender-pro-set',
  'beauty-blender': 'beauty-blender-pro-set',
  
  // Accessories
  'velvet-hair-scrunchies-pack': 'velvet-hair-scrunchies-pack',
  'velvet-hair-scrunchies': 'velvet-hair-scrunchies-pack',
  'velvet-cosmetic-pouch': 'velvet-cosmetic-pouch',
  
  // Lipsticks
  'maybelline-superstay-vinyl-ink': 'maybelline-superstay-vinyl-ink',
  'maybelline-vinyl-ink': 'maybelline-superstay-vinyl-ink',
};

export function getProductBySlug(slug: string): DemoProduct | undefined {
  if (!slug) return undefined;
  const clean = decodeURIComponent(slug).toLowerCase().trim();

  // 1. Direct match by exact slug or id
  const direct = COSMETICS_CATALOG.find(p => p.slug.toLowerCase() === clean || p.id.toLowerCase() === clean);
  if (direct) return direct;

  // 2. Alias dictionary lookup
  const targetSlug = SLUG_ALIASES[clean];
  if (targetSlug) {
    const aliased = COSMETICS_CATALOG.find(p => p.slug.toLowerCase() === targetSlug);
    if (aliased) return aliased;
  }

  // 3. Substring / partial slug match
  const partial = COSMETICS_CATALOG.find(p => 
    p.slug.toLowerCase().includes(clean) || 
    clean.includes(p.slug.toLowerCase()) ||
    p.sku.toLowerCase() === clean ||
    p.quickCode === clean ||
    p.barcode === clean
  );
  if (partial) return partial;

  // 4. Variant barcode or SKU match
  const variantMatch = COSMETICS_CATALOG.find(p =>
    p.variants.some(v => v.barcode === clean || v.sku?.toLowerCase() === clean)
  );
  if (variantMatch) return variantMatch;

  // 5. Token-based match across brand, category or title
  const tokenMatch = COSMETICS_CATALOG.find(p =>
    !p.isPOSOnly && (
      clean.split('-').some(token => token.length > 3 && (
        p.slug.toLowerCase().includes(token) || 
        p.nameAr.toLowerCase().includes(token) ||
        p.nameEn.toLowerCase().includes(token)
      ))
    )
  );
  if (tokenMatch) return tokenMatch;

  return undefined;
}

export function getProductByBarcodeOrCode(code: string): DemoProduct | undefined {
  const cleanCode = code.trim();
  return COSMETICS_CATALOG.find(p => 
    p.barcode === cleanCode || 
    p.quickCode === cleanCode || 
    p.sku === cleanCode ||
    p.variants.some(v => v.barcode === cleanCode || v.sku === cleanCode)
  );
}
