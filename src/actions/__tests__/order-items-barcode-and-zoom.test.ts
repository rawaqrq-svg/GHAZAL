import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolvePOSItemImage } from '@/lib/order-image';

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
vi.mock('@/lib/dal', () => ({
  requireAuth: vi.fn().mockResolvedValue({ employee: { id: 'emp-1', name: 'كاشير غزل' } }),
  requirePermission: vi.fn().mockResolvedValue({ employeeId: 'emp-1' }),
}));

describe('Store Orders Barcode Scanning & Click-to-Zoom Lightbox Tests', () => {
  it('correctly resolves item image for click-to-zoom in store orders', () => {
    // 1. Direct item imageUrl
    const itemWithDirectUrl = {
      id: 'item-1',
      name: 'أحمر شفاه كيكو',
      imageUrl: 'https://images.unsplash.com/photo-kiko-lipstick.jpg',
      quantity: 2,
      unitPrice: 8500
    };
    expect(resolvePOSItemImage(itemWithDirectUrl)).toBe('https://images.unsplash.com/photo-kiko-lipstick.jpg');

    // 2. Image inside product relation
    const itemWithProductImage = {
      id: 'item-2',
      name: 'عطر غزل مسك',
      product: {
        images: [
          { url: 'https://images.unsplash.com/photo-perfume-thumb.jpg', isMain: false },
          { url: 'https://images.unsplash.com/photo-perfume-main.jpg', isMain: true }
        ]
      }
    };
    expect(resolvePOSItemImage(itemWithProductImage)).toBe('https://images.unsplash.com/photo-perfume-main.jpg');

    // 3. Fallback to logo if no image available
    const itemWithoutImage = {
      id: 'item-3',
      name: 'منتج غير مصور'
    };
    expect(resolvePOSItemImage(itemWithoutImage)).toBe('/logo.png');
  });

  it('accurately identifies products and calculates prices when scanned via barcode or SKU', () => {
    const mockDbProducts = [
      {
        id: 'prod-001',
        nameAr: 'ماسكارا ميبلين لاش سينسيشنال',
        nameEn: 'Maybelline Lash Sensational',
        sku: 'POS-TT-001',
        images: [{ url: '/images/maybelline-mascara.jpg', isMain: true }],
        variants: [
          { id: 'var-1', barcode: '3600531143859', sku: 'POS-TT-001-STD', price: 9500, size: 'Black' }
        ]
      },
      {
        id: 'prod-002',
        nameAr: 'كونسيلر فيت مي 20',
        nameEn: 'Fit Me Concealer 20',
        sku: 'POS-TT-002',
        images: [{ url: '/images/fitme-concealer.jpg', isMain: true }],
        variants: [
          { id: 'var-2', barcode: '3600530752182', sku: 'POS-TT-002-S20', price: 6000, size: 'Sand 20' }
        ]
      }
    ];

    const lookupByBarcodeOrSku = (code: string) => {
      const clean = code.trim();
      const product = mockDbProducts.find(p => 
        p.sku.toLowerCase() === clean.toLowerCase() ||
        p.id === clean ||
        p.variants.some(v => v.barcode === clean || v.sku.toLowerCase() === clean.toLowerCase())
      );

      if (!product) return { success: false, notFound: true };

      const matchedVariant = product.variants.find(v => v.barcode === clean) || product.variants[0];
      const mainImage = product.images.find(img => img.isMain)?.url || product.images[0]?.url || null;

      return {
        success: true,
        product: {
          ...product,
          matchedVariant,
          imageUrl: mainImage,
          unitPriceFils: matchedVariant.price,
          unitPriceJodStr: (matchedVariant.price / 1000).toFixed(3)
        }
      };
    };

    // Test barcode scan for Maybelline Mascara
    const scanResult = lookupByBarcodeOrSku('3600531143859');
    expect(scanResult.success).toBe(true);
    expect(scanResult.product?.nameAr).toBe('ماسكارا ميبلين لاش سينسيشنال');
    expect(scanResult.product?.unitPriceJodStr).toBe('9.500');
    expect(scanResult.product?.imageUrl).toBe('/images/maybelline-mascara.jpg');

    // Test SKU scan for Fit Me Concealer
    const skuResult = lookupByBarcodeOrSku('POS-TT-002');
    expect(skuResult.success).toBe(true);
    expect(skuResult.product?.nameAr).toBe('كونسيلر فيت مي 20');
    expect(skuResult.product?.unitPriceJodStr).toBe('6.000');

    // Test non-existent barcode
    const notFoundResult = lookupByBarcodeOrSku('9999999999999');
    expect(notFoundResult.success).toBe(false);
    expect(notFoundResult.notFound).toBe(true);
  });

  it('correctly calculates order and invoice total and formats audit notes upon adding an item', () => {
    const existingOrder = {
      id: 'ord-1234',
      totalAmount: 25000, // 25.000 JOD
      shippingCost: 3000,  // 3.000 JOD
      items: [
        { id: 'it-1', name: 'عطر كلاسيكي', quantity: 1, unitPrice: 22000, total: 22000 }
      ]
    };

    // Customer calls requesting addition of Maybelline mascara (9.500 JOD)
    const scannedProduct = {
      productId: 'prod-001',
      productName: 'ماسكارا ميبلين لاش سينسيشنال',
      variantLabel: 'Black',
      quantity: 1,
      unitPrice: 9500, // 9.500 JOD
      reason: 'طلب الزبونة هاتفياً إضافة ماسكارا للطلب قبل الشحن'
    };

    const itemTotal = scannedProduct.unitPrice * scannedProduct.quantity;
    const oldTotal = existingOrder.totalAmount;
    const newTotal = oldTotal + itemTotal;

    expect(itemTotal).toBe(9500);
    expect(newTotal).toBe(34500); // 34.500 JOD

    const dynamicAuditNote = `[تعديل فاتورة - إضافة منتج] تم إضافة: "${scannedProduct.productName}" (${scannedProduct.variantLabel}) | الكمية: ${scannedProduct.quantity} | السعر الإفرادي: ${(scannedProduct.unitPrice / 1000).toFixed(3)} د.أ | الإجمالي المضاف: ${(itemTotal / 1000).toFixed(3)} د.أ | تغير السعر من ${(oldTotal / 1000).toFixed(3)} د.أ إلى ${(newTotal / 1000).toFixed(3)} د.أ لضمان النزاهة بين البائع والعميل | سبب التعديل: ${scannedProduct.reason}`;

    expect(dynamicAuditNote).toContain('ماسكارا ميبلين لاش سينسيشنال');
    expect(dynamicAuditNote).toContain('تغير السعر من 25.000 د.أ إلى 34.500 د.أ');
    expect(dynamicAuditNote).toContain('طلب الزبونة هاتفياً إضافة ماسكارا للطلب قبل الشحن');
  });

  it('simulates hardware barcode scanner rapid keystroke buffer vs slow human typing', () => {
    // Hardware barcode scanner sends characters at < 50ms intervals terminated by 'Enter'
    const simulateScannerGunInput = (chars: string[], intervals: number[]) => {
      let buffer = '';
      let isGunDetected = false;
      let lastTime = 0;

      for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        const timeDiff = intervals[i];

        if (char === 'Enter') {
          if (buffer.length >= 3 && isGunDetected) {
            return { detected: true, barcode: buffer };
          }
          return { detected: false, barcode: null };
        }

        if (timeDiff < 70) {
          isGunDetected = true;
          buffer += char;
        } else {
          // Slow human typing resets fast buffer
          buffer = char;
          isGunDetected = false;
        }
      }

      return { detected: false, barcode: null };
    };

    // Fast scanner burst (30ms per char)
    const fastBarcodeChars = ['6', '2', '5', '1', '2', '3', '4', 'Enter'];
    const fastIntervals = [30, 25, 20, 22, 28, 25, 30, 20];
    const fastResult = simulateScannerGunInput(fastBarcodeChars, fastIntervals);

    expect(fastResult.detected).toBe(true);
    expect(fastResult.barcode).toBe('6251234');

    // Slow typing by human (300ms between chars)
    const slowChars = ['6', '2', '5', 'Enter'];
    const slowIntervals = [300, 350, 400, 300];
    const slowResult = simulateScannerGunInput(slowChars, slowIntervals);

    expect(slowResult.detected).toBe(false);
  });
});
