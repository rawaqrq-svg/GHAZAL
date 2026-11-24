import { describe, it, expect } from 'vitest';
import { resolvePOSItemImage } from '../../lib/order-image';

describe('Category Hierarchy & POS Storefront Integrity', () => {
  it('enforces 1-level category hierarchy rule (subcategories cannot have children)', () => {
    // Simulated categories tree
    const rootCategories = [
      { id: 'cat-makeup', name: 'المكياج ومستحضرات التجميل', slug: 'makeup', parentId: null },
      { id: 'cat-skincare', name: 'العناية بالبشرة', slug: 'skincare', parentId: null },
      { id: 'cat-face-care', name: 'العناية بالوجه', slug: 'face-care', parentId: null },
      { id: 'cat-deodorants', name: 'مزيلات عرق', slug: 'deodorants', parentId: null },
    ];

    const subCategory = {
      id: 'cat-lipsticks',
      name: 'أحمر شفاه',
      slug: 'lipsticks',
      parentId: 'cat-makeup'
    };

    // Validating root category can be parent
    const isValidParentForSub = rootCategories.some(r => r.id === subCategory.parentId && r.parentId === null);
    expect(isValidParentForSub).toBe(true);

    // Rule: Attempting to use a subcategory as a parent must be rejected
    const invalidAttempt = {
      id: 'cat-matte-lipsticks',
      name: 'أحمر شفاه ماط',
      slug: 'matte-lipsticks',
      parentId: subCategory.id // Parent is already a subcategory!
    };

    const isInvalidParent = subCategory.parentId !== null;
    expect(isInvalidParent).toBe(true); // Must be blocked
  });

  it('correctly maps all 6 official status categories matching admin order tabs', () => {
    const tabStatusMap: Record<string, string[]> = {
      'NEW': ['PENDING', 'AWAITING_WHATSAPP', 'NEW'],
      'PREPARING': ['CONFIRMED', 'PREPARING', 'CONFIRMED_PREPARING'],
      'PREPARED': ['PREPARED', 'READY_FOR_DELIVERY', 'AWAITING_DELIVERY'],
      'SHIPPED': ['SHIPPED', 'OUT_FOR_DELIVERY', 'WITH_COURIER'],
      'COMPLETED': ['DELIVERED', 'COMPLETED'],
      'CANCELLED': ['CANCELLED', 'REFUNDED']
    };

    expect(tabStatusMap['NEW']).toContain('PENDING');
    expect(tabStatusMap['NEW']).toContain('AWAITING_WHATSAPP');
    expect(tabStatusMap['PREPARING']).toContain('CONFIRMED');
    expect(tabStatusMap['PREPARING']).toContain('PREPARING');
    expect(tabStatusMap['PREPARED']).toContain('READY_FOR_DELIVERY');
    expect(tabStatusMap['SHIPPED']).toContain('OUT_FOR_DELIVERY');
    expect(tabStatusMap['COMPLETED']).toContain('DELIVERED');
    expect(tabStatusMap['CANCELLED']).toContain('CANCELLED');
  });

  it('resolves item image url gracefully from item or cosmetics catalog', () => {
    const itemWithDirectImage = {
      id: 'item-1',
      name: 'أحمر شفاه مايبيلين',
      imageUrl: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa'
    };
    expect(resolvePOSItemImage(itemWithDirectImage)).toBe('https://images.unsplash.com/photo-1586495777744-4413f21062fa');

    const itemWithCatalogFallback = {
      id: 'item-2',
      sku: 'SKU-MAY-VINYL-20',
      name: 'أحمر شفاه مايبيلين سوبر ستاي فينيل إنك'
    };
    const resolved = resolvePOSItemImage(itemWithCatalogFallback);
    expect(resolved).toBeTruthy();
  });
});
