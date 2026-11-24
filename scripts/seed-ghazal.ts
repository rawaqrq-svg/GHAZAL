import { prisma } from '../src/lib/db';
import * as argon2 from 'argon2';

async function hashPass(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    timeCost: 2,
    memoryCost: 19456,
    parallelism: 1,
  });
}

async function main() {
  console.log('🌸 بدء تهيئة بيانات متجر غزل لمستحضرات التجميل (GHAZAL)...');

  // 1. Permissions & Roles
  console.log('1. إعداد الصلاحيات والأدوار...');
  const permissionsList = [
    { name: 'manage:products', description: 'إدارة المنتجات والأقسام والماركات' },
    { name: 'manage:orders', description: 'إدارة طلبات المتجر والمبيعات' },
    { name: 'manage:settings', description: 'إدارة الإعدادات والموظفين' },
    { name: 'pos:cashier', description: 'الوصول إلى شاشة نقطة البيع POS' },
    { name: 'pos:reports', description: 'الاطلاع على تقارير الصندوق والورديات' },
    { name: 'pos:returns', description: 'معالجة مرتجعات المبيعات' },
  ];

  for (const perm of permissionsList) {
    await prisma.permission.upsert({
      where: { action: perm.name },
      update: { description: perm.description },
      create: { action: perm.name, description: perm.description },
    });
  }

  // Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: { description: 'المدير العام للنظام' },
    create: { name: 'ADMIN', description: 'المدير العام للنظام' },
  });

  const cashierRole = await prisma.role.upsert({
    where: { name: 'CASHIER' },
    update: { description: 'كاشير نقطة البيع' },
    create: { name: 'CASHIER', description: 'كاشير نقطة البيع' },
  });

  // Assign permissions to ADMIN
  const allPerms = await prisma.permission.findMany();
  for (const perm of allPerms) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }

  // Assign cashier permissions
  const cashierPerms = allPerms.filter(p => ['pos:cashier', 'pos:returns', 'manage:orders'].includes(p.name));
  for (const perm of cashierPerms) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: cashierRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: cashierRole.id,
        permissionId: perm.id,
      },
    });
  }

  // 2. Default Employees
  console.log('2. إنشاء حسابات الإدارة والكاشير...');
  const defaultAdminPass = await hashPass('AdminPassword2026!');
  const defaultCashierPass = await hashPass('Cashier2026!');

  const adminUser = await prisma.employee.upsert({
    where: { email: 'admin@ghazal.jo' },
    update: {
      name: 'مدير النظام – غزل',
      roleId: adminRole.id,
      isActive: true,
    },
    create: {
      name: 'مدير النظام – غزل',
      email: 'admin@ghazal.jo',
      passwordHash: defaultAdminPass,
      roleId: adminRole.id,
      isActive: true,
    },
  });

  await prisma.employee.upsert({
    where: { email: 'cashier@ghazal.jo' },
    update: {
      name: 'كاشير الفرع الرئيسي',
      roleId: cashierRole.id,
      isActive: true,
    },
    create: {
      name: 'كاشير الفرع الرئيسي',
      email: 'cashier@ghazal.jo',
      passwordHash: defaultCashierPass,
      roleId: cashierRole.id,
      isActive: true,
    },
  });

  // 3. Official Beauty Brands
  console.log('3. إضافة الماركات العالمية المعتمدة...');
  const brandsData = [
    { name: 'Maybelline New York', nameAr: 'ميبيلين نيويورك', slug: 'maybelline', description: 'الماركة رقم 1 عالمياً في مستحضرات التجميل والمكياج العصري.' },
    { name: "L'Oréal Paris", nameAr: 'لوريال باريس', slug: 'loreal-paris', description: 'أحدث ابتكارات الجمال والعناية بالبشرة والشعر بجودة فرنسية رفيعة.' },
    { name: 'NYX Professional Makeup', nameAr: 'نيكس بروفيشنال', slug: 'nyx', description: 'ألوان جريئة وتشكيلة احترافية لخبراء التجميل وعشاق المكياج.' },
    { name: 'Laneige', nameAr: 'لانيج', slug: 'laneige', description: 'العلامة الكورية الرائدة في ترطيب الشفاه والعناية الفائقة بالنضارة.' },
    { name: 'The Ordinary', nameAr: 'ذا أورديناري', slug: 'the-ordinary', description: 'تركيبات علمية مثبتة سريرياً بمكونات فعالة ونقية 100%.' },
    { name: 'CeraVe', nameAr: 'سيرافي', slug: 'cerave', description: 'منتجات طبية مطورة مع أطباء الجلدية غنية بالسيراميدات الأساسية.' },
    { name: 'GHAZAL Cosmetics', nameAr: 'غزل لمستحضرات التجميل', slug: 'ghazal-brand', description: 'العلامة الحصرية لغزل – جمال أصيل يلامس أنوثتك.' },
  ];

  const brandMap = new Map<string, string>();
  for (const b of brandsData) {
    const brand = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: { name: b.name, nameAr: b.nameAr, description: b.description },
      create: { name: b.name, nameAr: b.nameAr, slug: b.slug, description: b.description },
    });
    brandMap.set(b.slug, brand.id);
  }

  // 4. Categories
  console.log('4. إضافة أقسام المتجر السبعة...');
  const categoriesData = [
    { name: 'المكياج', slug: 'makeup', description: 'كريمات الأساس، أحمر الشفاه، الماسكارا وظلال العيون' },
    { name: 'العناية بالبشرة', slug: 'skincare', description: 'سيرومات، مرطبات، غسول وواقيات شمسية طبية' },
    { name: 'العناية بالشعر', slug: 'haircare', description: 'زيوت، شامبو، وماسكات علاجية لجميع أنواع الشعر' },
    { name: 'العطور', slug: 'fragrances', description: 'عطور شرقية وغربية راقية وبخاخات معطرة للجسم' },
    { name: 'أدوات التجميل', slug: 'beauty-tools', description: 'فرش مكياج، إسفنجات بيوتي بلندر، وأجهزة العناية' },
    { name: 'الإكسسوارات', slug: 'accessories', description: 'ربطات شعر، حقائب مكياج، ومرايا بإضاءة LED' },
    { name: 'الهدايا والمجموعات', slug: 'gifts-sets', description: 'بوكسات هدايا أنيقة وباقات جمالية متكاملة' },
  ];

  const categoryMap = new Map<string, string>();
  for (const c of categoriesData) {
    const category = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description },
      create: { name: c.name, slug: c.slug, description: c.description },
    });
    categoryMap.set(c.slug, category.id);
  }

  // 5. Products & Cosmetic Variants
  console.log('5. إضافة منتجات التجميل المميزة مع الدرجات والباركود...');
  const productsData = [
    {
      sku: 'GHZ-1001',
      nameAr: 'أحمر شفاه مايبيلين سوبر ستاي فينيل إنك',
      nameEn: 'Maybelline Super Stay Vinyl Ink Liquid Lipstick',
      slug: 'maybelline-vinyl-ink-lipstick',
      categorySlug: 'makeup',
      brandSlug: 'maybelline',
      isFeatured: true,
      shortDescription: 'لون فينيل لامع وجذاب يدوم حتى 16 ساعة دون تلطخ أو جفاف.',
      longDescription: 'تألقي بشفاه لا تقاوم مع أحمر الشفاه السائل فينيل إنك من مايبيلين. تركيبة نباتية مبتكرة غنية بفيتامين E وخلاصة الألوفيرا تمنحك لوناً غنياً ولمعاناً فائقاً يدوم طوال اليوم.',
      variants: [
        { size: '4.2ml', shade: '10 Lippy', colorName: 'أحمر كرزي جذاب', colorHex: '#C72C41', barcode: '628100010011', price: 12000 },
        { size: '4.2ml', shade: '20 Coy', colorName: 'فوشيا غزل المميز', colorHex: '#E6007E', barcode: '628100010028', price: 12000 },
        { size: '4.2ml', shade: '35 Cheeky', colorName: 'وردي نيود ناعم', colorHex: '#E07A5F', barcode: '628100010035', price: 12000 },
        { size: '4.2ml', shade: '50 Wicked', colorName: 'عنابي كلاسيكي فاخر', colorHex: '#800E13', barcode: '628100010042', price: 12000 },
      ]
    },
    {
      sku: 'GHZ-1002',
      nameAr: 'كريم أساس لوريال باريس إنفاليبل 24 ساعة',
      nameEn: "L'Oréal Paris Infaillible 24H Fresh Wear Foundation",
      slug: 'loreal-infaillible-foundation',
      categorySlug: 'makeup',
      brandSlug: 'loreal-paris',
      isFeatured: true,
      shortDescription: 'تغطية كاملة بلمسة طبيعية تنفسية تدوم 24 ساعة ومقاومة للماء والتعرق.',
      longDescription: 'كريم أساس خفيف الوزن يسمح للبشرة بالتنفس مع توفير تغطية متكاملة غير لامعة تدوم طوال اليوم دون أن يتكتل. يحتوي على SPF 25 لحماية بشرتك من أشعة الشمس.',
      variants: [
        { size: '30ml', shade: '120 Vanilla', colorName: 'فانيلا فاتح عاجي', colorHex: '#E8C39E', barcode: '628100020010', price: 16500 },
        { size: '30ml', shade: '130 True Beige', colorName: 'بيج طبيعي كلاسيكي', colorHex: '#D8A47F', barcode: '628100020027', price: 16500 },
        { size: '30ml', shade: '200 Golden Sand', colorName: 'رملي ذهبي متوسط', colorHex: '#C68B59', barcode: '628100020034', price: 16500 },
      ]
    },
    {
      sku: 'GHZ-1003',
      nameAr: 'سيروم النياسيناميد 10% والزنك 1% من ذا أورديناري',
      nameEn: 'The Ordinary Niacinamide 10% + Zinc 1%',
      slug: 'the-ordinary-niacinamide-serum',
      categorySlug: 'skincare',
      brandSlug: 'the-ordinary',
      isFeatured: true,
      shortDescription: 'يقلل من مظهر المسام والشوائب ويوحد لون البشرة وينظم إفراز الدهون.',
      longDescription: 'تركيبة مائية خفيفة مصممة لتقليل احتقان البشرة وتنقية المسام بفضل تركيز النياسيناميد (فيتامين B3) العالي المعزز بالزنك لتنظيم إفراز الزيوت.',
      variants: [
        { size: '30ml', shade: 'Standard', colorName: 'سيروم شفاف', colorHex: '#F2F2F2', barcode: '628100030019', price: 8500 },
        { size: '60ml', shade: 'Jumbo Size', colorName: 'سيروم شفاف حجم كبير', colorHex: '#F2F2F2', barcode: '628100030026', price: 14000 },
      ]
    },
    {
      sku: 'GHZ-1004',
      nameAr: 'مرطب الشفاه الليلي بالتوت من لانيج',
      nameEn: 'Laneige Lip Sleeping Mask Berry',
      slug: 'laneige-lip-sleeping-mask-berry',
      categorySlug: 'skincare',
      brandSlug: 'laneige',
      isFeatured: true,
      shortDescription: 'قناع شفاه ليلي يغذي الشفاه بعمق بفيتامين C ومضادات الأكسدة.',
      longDescription: 'استيقظي بشفاه ناعمة كالحرير وممتلئة بفضل تقنية Moisture Wrap الغنية بحمض الهيالورونيك والمعادن ومستخلص التوت المنعش.',
      variants: [
        { size: '20g', shade: 'Berry Original', colorName: 'وردي التوت اللامع', colorHex: '#FF6B81', barcode: '628100040018', price: 18000 },
        { size: '8g', shade: 'Travel Mini', colorName: 'حجم السفر التجريبي', colorHex: '#FF6B81', barcode: '628100040025', price: 9000 },
      ]
    },
    {
      sku: 'GHZ-1005',
      nameAr: 'غسول الوجه المرطب للبشرة الجافة والعادية من سيرافي',
      nameEn: 'CeraVe Hydrating Facial Cleanser',
      slug: 'cerave-hydrating-cleanser',
      categorySlug: 'skincare',
      brandSlug: 'cerave',
      isFeatured: false,
      shortDescription: 'ينظف بلطف ويرطب ويساعد على استعادة الحاجز الواقي الطبيعي للبشرة.',
      longDescription: 'غسول يومي مطور مع أطباء الجلد ينظف البشرة بفاعلية دون أن يجردها من رطوبتها الطبيعية بفضل 3 سيراميدات أساسية وحمض الهيالورونيك.',
      variants: [
        { size: '236ml', shade: 'Standard', colorName: 'لوشن غسول حليبي', colorHex: '#EBF4F6', barcode: '628100050017', price: 11500 },
        { size: '473ml', shade: 'Economy Size', colorName: 'عبوة اقتصادية بمضخة', colorHex: '#EBF4F6', barcode: '628100050024', price: 17500 },
      ]
    },
    {
      sku: 'GHZ-1006',
      nameAr: 'باليت ظلال العيون ألتيميت شادو من نيكْس',
      nameEn: 'NYX Ultimate Shadow Palette Warm Neutrals',
      slug: 'nyx-ultimate-shadow-palette',
      categorySlug: 'makeup',
      brandSlug: 'nyx',
      isFeatured: true,
      shortDescription: '16 درجة لونية دافئة مذهلة بين المات والشيمر لإطلالات نهارية ومسائية ساحرة.',
      longDescription: 'لوحة ظلال عيون احترافية تحتوي على 16 لوناً عالي الصبغة وقابل للدمج بنعومة، تناسب جميع ألوان البشرة وتدوم طويلاً دون أن تتناثر.',
      variants: [
        { size: '16 Shades', shade: 'Warm Neutrals', colorName: 'تدرجات ترابية وذهبية', colorHex: '#9B5B32', barcode: '628100060016', price: 19000 },
      ]
    },
    {
      sku: 'GHZ-1007',
      nameAr: 'عطر غزل الفاخر – أو دو بارفان',
      nameEn: 'GHAZAL Signature Eau De Parfum',
      slug: 'ghazal-signature-edp',
      categorySlug: 'fragrances',
      brandSlug: 'ghazal-brand',
      isFeatured: true,
      shortDescription: 'توليفة أنثوية ساحرة من الياسمين الأبيض، المسك الوردي، وخشب الصندل.',
      longDescription: 'العطر الأيقوني لعلامة غزل. ينبض بمقدمة فواحة من التوت البري والبرغموت، يتوسطه قلب من زهر البرتقال والياسمين، وترتكز قاعدته على الباتشولي والفانيليا الفاخرة.',
      variants: [
        { size: '50ml', shade: 'Standard 50ml', colorName: 'زجاجة وردية فاخرة', colorHex: '#E6007E', barcode: '628100070015', price: 25000 },
        { size: '100ml', shade: 'Grand 100ml', colorName: 'زجاجة فاخرة بحجم مضاعف', colorHex: '#E6007E', barcode: '628100070022', price: 40000 },
      ]
    },
  ];

  for (const p of productsData) {
    const categoryId = categoryMap.get(p.categorySlug);
    const brandId = brandMap.get(p.brandSlug);
    if (!categoryId) continue;

    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        slug: p.slug,
        categoryId,
        brandId,
        isFeatured: p.isFeatured,
        shortDescription: p.shortDescription,
        longDescription: p.longDescription,
        isVisible: true,
        stockLiters: 0,
      },
      create: {
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        sku: p.sku,
        slug: p.slug,
        categoryId,
        brandId,
        isFeatured: p.isFeatured,
        shortDescription: p.shortDescription,
        longDescription: p.longDescription,
        isVisible: true,
        stockLiters: 0,
      },
    });

    // Variants
    for (const v of p.variants) {
      const variantSku = `${p.sku}-${v.shade.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || 'STD'}`;
      await prisma.productVariant.upsert({
        where: { sku: variantSku },
        update: {
          productId: product.id,
          size: v.size,
          shade: v.shade,
          colorName: v.colorName,
          colorHex: v.colorHex,
          barcode: v.barcode,
          price: v.price,
          isActive: true,
          usesGlobalPricing: true,
        },
        create: {
          productId: product.id,
          sku: variantSku,
          size: v.size,
          shade: v.shade,
          colorName: v.colorName,
          colorHex: v.colorHex,
          barcode: v.barcode,
          price: v.price,
          isActive: true,
          usesGlobalPricing: true,
        },
      });
    }
  }

  // 6. Site Settings
  console.log('6. ضبط إعدادات المتجر ونقاط البيع...');
  const settingsEntries = [
    { key: 'site_name', value: 'غزل لمستحضرات التجميل والعناية | GHAZAL' },
    { key: 'contact_whatsapp', value: '962799991234' },
    { key: 'store_address', value: 'عمان، المملكة الأردنية الهاشمية' },
    { key: 'tax_enabled', value: 'false' },
    { key: 'tax_rate', value: '16' },
    { key: 'prices_include_tax', value: 'true' },
    { key: 'pos_cashier_idle_enabled', value: 'true' },
    { key: 'pos_cashier_idle_timeout_minutes', value: '10' },
  ];

  for (const s of settingsEntries) {
    await prisma.siteSettings.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value },
    });
  }

  console.log('✅ تم الانتهاء من تهيئة بيانات غزل بنجاح!');
  console.log('----------------------------------------------------');
  console.log('🔑 حسابات الدخول المجهزة:');
  console.log('  المدير العام: admin@ghazal.jo  /  AdminPassword2026!');
  console.log('  الكاشير:      cashier@ghazal.jo /  Cashier2026!');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ خطأ في السكريبت:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
