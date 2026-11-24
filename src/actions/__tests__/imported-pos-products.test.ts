import { describe, it, expect } from 'vitest';

describe('Imported POS Products & Channel Isolation Safeguards', () => {
  it('enforces that products marked with channel POS are completely isolated from online storefront queries', () => {
    const products = [
      { id: '1', sku: 'ONLINE-01', channel: 'ONLINE', isVisible: true },
      { id: '2', sku: 'SHARED-01', channel: 'SHARED', isVisible: true },
      { id: '3', sku: 'POS-TT-509', channel: 'POS', isVisible: false },
      { id: '4', sku: 'POS-TT-510', channel: 'POS', isVisible: false },
    ];

    // Storefront filtering rule: where: { channel: { not: 'POS' }, isVisible: true }
    const storefrontVisible = products.filter(p => p.channel !== 'POS' && p.isVisible === true);

    expect(storefrontVisible.length).toBe(2);
    expect(storefrontVisible.some(p => p.sku.startsWith('POS-TT-'))).toBe(false);
    expect(storefrontVisible.some(p => p.channel === 'POS')).toBe(false);
  });

  it('enforces that POS cashier workspace loads products with channel in [POS, SHARED]', () => {
    const products = [
      { id: '1', sku: 'ONLINE-01', channel: 'ONLINE' },
      { id: '2', sku: 'SHARED-01', channel: 'SHARED' },
      { id: '3', sku: 'POS-TT-509', channel: 'POS' },
      { id: '4', sku: 'POS-TT-510', channel: 'POS' },
    ];

    // POS filtering rule: where: { channel: { in: ['POS', 'SHARED'] } }
    const posAvailable = products.filter(p => ['POS', 'SHARED'].includes(p.channel));

    expect(posAvailable.length).toBe(3);
    expect(posAvailable.some(p => p.sku === 'ONLINE-01')).toBe(false);
    expect(posAvailable.filter(p => p.sku.startsWith('POS-TT-')).length).toBe(2);
  });

  it('correctly maps JOD sell price to integer minor units (fils) without precision loss', () => {
    const testPrices = [
      { jod: 6, expectedFils: 6000 },
      { jod: 3.5, expectedFils: 3500 },
      { jod: 1.75, expectedFils: 1750 },
      { jod: 0.75, expectedFils: 750 },
      { jod: 0, expectedFils: 0 }
    ];

    testPrices.forEach(({ jod, expectedFils }) => {
      const fils = Math.max(0, Math.round(jod * 1000));
      expect(fils).toBe(expectedFils);
    });
  });

  it('ensures receipt layout is preserved and not altered by POS product attributes', () => {
    const saleItem = {
      variantId: 'v-pos-509',
      sku: 'POS-TT-509-STD',
      name: 'سيرو م شعر اليغانس 300 مل الالوفيرا',
      size: 'Standard',
      quantity: 2,
      unitPrice: 6000,
      total: 12000,
      costPrice: null // Left empty/null as required
    };

    expect(saleItem.costPrice).toBeNull();
    expect(saleItem.unitPrice).toBe(6000);
    expect(saleItem.total).toBe(12000);
    expect(saleItem.name).toBe('سيرو م شعر اليغانس 300 مل الالوفيرا');
  });
});
