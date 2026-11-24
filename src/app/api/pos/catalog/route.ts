import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    let products: any[] = [];
    try {
      products = await prisma.product.findMany({
        where: { isVisible: true },
        include: {
          variants: true,
          category: true,
          brand: true,
        },
        orderBy: { nameAr: 'asc' },
      });
    } catch {}

    // Fallback beauty catalog if DB empty
    if (products.length === 0) {
      products = [
        {
          id: 'ghaz-prod-1',
          nameAr: 'أحمر شفاه مايبيلين سوبر ستاي فينيل إنك',
          barcode: '6902395780011',
          quickCode: '101',
          price: 12.0,
          category: 'المكياج',
          variants: [{ id: 'v1', shade: '20 Coy (#E6007E)', price: 12.0 }],
        },
        {
          id: 'ghaz-prod-2',
          nameAr: 'كريم أساس لوريال إنفاليبل 24 ساعة',
          barcode: '3600523724390',
          quickCode: '102',
          price: 16.5,
          category: 'المكياج',
          variants: [{ id: 'v2', shade: '120 Vanilla', price: 16.5 }],
        },
        {
          id: 'ghaz-prod-3',
          nameAr: 'باليت ظلال عيون ألتيميت شادو من نيكْس',
          barcode: '800897017637',
          quickCode: '103',
          price: 19.0,
          category: 'المكياج',
          variants: [{ id: 'v3', shade: 'Warm Neutrals', price: 19.0 }],
        },
        {
          id: 'ghaz-prod-4',
          nameAr: 'سيروم النياسيناميد 10% والزنك 1% من ذا أورديناري',
          barcode: '769915190311',
          quickCode: '201',
          price: 8.5,
          category: 'العناية بالبشرة',
          variants: [{ id: 'v4', shade: '30ml Standard', price: 8.5 }],
        },
        {
          id: 'ghaz-prod-quick-1jd',
          nameAr: 'أصناف عرض 1 دينار (إكسسوارات/مبرد/قطن)',
          barcode: '1234',
          quickCode: '1234',
          price: 1.0,
          category: 'عروض دينار',
          variants: [{ id: 'v-1jd', shade: 'صنف دينار', price: 1.0 }],
        },
      ];
    }

    return NextResponse.json({
      success: true,
      shop: 'محل غزل للمكياج — عين الباشا',
      count: products.length,
      products,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error loading catalog' }, { status: 500 });
  }
}
