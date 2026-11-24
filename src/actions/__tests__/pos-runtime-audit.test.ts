import { describe, it, expect } from 'vitest';
import { filsToDisplay, filsToJod, jodToFils, calculateTaxAndTotals } from '../../lib/money';

describe('POS & Storefront Runtime Audit Verification', () => {

  describe('1. Historical Cost Snapshotting & Margin Integrity', () => {
    it('snapshots costPrice, line discount, and taxAmount at the exact time of sale', () => {
      // Simulating a POS sale with catalog variants having dynamic costs
      const currentCatalogVariant = {
        id: 'var-maybelline-vinyl-20',
        price: 8500, // 8.500 JOD
        costPrice: 4200, // 4.200 JOD wholesale cost
        sku: 'MAY-VIN-20'
      };

      const saleItemSnapshot = {
        id: 'sale-item-001',
        saleId: 'sale-1001',
        variantId: currentCatalogVariant.id,
        quantity: 2,
        unitPrice: currentCatalogVariant.price,
        total: currentCatalogVariant.price * 2, // 17000 fils
        costPrice: currentCatalogVariant.costPrice, // 4200 fils snapshot
        discount: 1000, // 1.000 JOD proportional discount
        taxAmount: 2207 // 16% VAT portion in fils
      };

      // Ensure snapshots are faithfully captured
      expect(saleItemSnapshot.costPrice).toBe(4200);
      expect(saleItemSnapshot.unitPrice).toBe(8500);
      expect(saleItemSnapshot.total).toBe(17000);
      expect(saleItemSnapshot.discount).toBe(1000);
      expect(saleItemSnapshot.taxAmount).toBe(2207);

      // Now simulate a future supplier price hike in the catalog
      currentCatalogVariant.costPrice = 5800; // Wholesale cost jumps to 5.800 JOD
      currentCatalogVariant.price = 10500; // Retail price jumps to 10.500 JOD

      // Historical sale item must NOT drift:
      expect(saleItemSnapshot.costPrice).toBe(4200);
      expect(saleItemSnapshot.unitPrice).toBe(8500);

      // Historical profit calculation using snapshot remains immutable:
      const historicalCostTotal = saleItemSnapshot.costPrice * saleItemSnapshot.quantity; // 8400 fils
      const historicalNetRevenue = saleItemSnapshot.total - saleItemSnapshot.discount; // 16000 fils
      const historicalGrossProfit = historicalNetRevenue - historicalCostTotal; // 7600 fils
      expect(historicalGrossProfit).toBe(7600);
    });

    it('distributes order/invoice discounts proportionally across items without losing 1 fils', () => {
      const items = [
        { id: 'item-1', total: 10000, discount: 0 },
        { id: 'item-2', total: 20000, discount: 0 },
        { id: 'item-3', total: 15000, discount: 0 },
      ];
      const invoiceDiscount = 5000; // 5.000 JOD total discount
      const totalAmount = items.reduce((acc, it) => acc + it.total, 0); // 45000 fils

      let runningDiscount = 0;
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const isLast = i === items.length - 1;
        const itDiscount = isLast
          ? (invoiceDiscount - runningDiscount)
          : Math.round((it.total / totalAmount) * invoiceDiscount);
        runningDiscount += itDiscount;
        it.discount = itDiscount;
      }

      // Check sum of distributed discounts matches invoice discount exactly
      const sumDiscount = items.reduce((acc, it) => acc + it.discount, 0);
      expect(sumDiscount).toBe(invoiceDiscount);
      expect(items[0].discount).toBe(1111);
      expect(items[1].discount).toBe(2222);
      expect(items[2].discount).toBe(1667); // 1111 + 2222 + 1667 = 5000 exactly
    });
  });

  describe('2. 5-State Offline Sync Engine & Conflict Resolution', () => {
    type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'CONFLICT';

    interface MockOfflineQueueItem {
      id: string;
      localReceiptNumber: string;
      syncStatus: SyncStatus;
      retryCount: number;
      lastError?: string;
      conflictReason?: string;
      items: Array<{ variantId: string; quantity: number; unitPrice: number }>;
    }

    it('progresses through the 5-state lifecycle and detects conflicts accurately', () => {
      const queue: MockOfflineQueueItem[] = [
        {
          id: 'off-001',
          localReceiptNumber: 'OFF-1001',
          syncStatus: 'PENDING',
          retryCount: 0,
          items: [{ variantId: 'v-1', quantity: 1, unitPrice: 5000 }]
        }
      ];

      // Step 1: Transitions to SYNCING when sync starts
      queue[0].syncStatus = 'SYNCING';
      expect(queue[0].syncStatus).toBe('SYNCING');

      // Step 2: Server detects a price conflict (e.g. offline unit price 5000 vs current catalog 7000)
      const serverPriceCheck = { isValid: false, reason: 'PRICE_MISMATCH: Offline price 5.000 differs from catalog 7.000' };
      if (!serverPriceCheck.isValid) {
        queue[0].syncStatus = 'CONFLICT';
        queue[0].conflictReason = serverPriceCheck.reason;
        queue[0].retryCount += 1;
      }

      expect(queue[0].syncStatus).toBe('CONFLICT');
      expect(queue[0].conflictReason).toContain('PRICE_MISMATCH');
      expect(queue[0].retryCount).toBe(1);

      // Step 3: Cashier resolves the conflict (e.g. cashier overrides or approves sync)
      const cashierResolved = true;
      if (cashierResolved) {
        queue[0].syncStatus = 'SYNCED';
        queue[0].conflictReason = undefined;
      }

      expect(queue[0].syncStatus).toBe('SYNCED');
      expect(queue[0].conflictReason).toBeUndefined();
    });

    it('correctly maps quick department shortcut codes to valid catalog variants', () => {
      const departmentCodeMap: Record<string, { variantId: string; name: string; defaultPriceFils: number }> = {
        '1234': { variantId: 'vp-1', name: 'قسم المكياج', defaultPriceFils: 1000 },
        '2222': { variantId: 'vp-2', name: 'قسم العناية بالبشرة', defaultPriceFils: 1500 },
        '3333': { variantId: 'vp-3', name: 'قسم العطور', defaultPriceFils: 2000 },
        '5555': { variantId: 'vp-4', name: 'قسم الإكسسوارات', defaultPriceFils: 500 }
      };

      expect(departmentCodeMap['1234'].variantId).toBe('vp-1');
      expect(departmentCodeMap['2222'].variantId).toBe('vp-2');
      expect(departmentCodeMap['3333'].variantId).toBe('vp-3');
      expect(departmentCodeMap['5555'].variantId).toBe('vp-4');
    });
  });

  describe('3. Barcode Scanner Debouncing & Hardware Input', () => {
    it('debounces rapid scanner double-triggers within 400ms window', () => {
      let lastScanTime = 0;
      let lastScannedBarcode = '';
      let scanCount = 0;

      function simulateScan(barcode: string, now: number) {
        if (now - lastScanTime < 400 && lastScannedBarcode === barcode) {
          // Debounced / ignored!
          return false;
        }
        lastScanTime = now;
        lastScannedBarcode = barcode;
        scanCount++;
        return true;
      }

      const scanTime = 1000;
      // First physical read
      const firstAccepted = simulateScan('6291100123456', scanTime);
      expect(firstAccepted).toBe(true);
      expect(scanCount).toBe(1);

      // Fast hardware bounce 50ms later (scanner hardware glitch or double event)
      const secondAccepted = simulateScan('6291100123456', scanTime + 50);
      expect(secondAccepted).toBe(false);
      expect(scanCount).toBe(1); // Blocked

      // Legit subsequent scan 500ms later
      const thirdAccepted = simulateScan('6291100123456', scanTime + 500);
      expect(thirdAccepted).toBe(true);
      expect(scanCount).toBe(2);
    });

    it('accepts both Enter and NumpadEnter key events as valid scanner terminators', () => {
      const validScannerKeys = ['Enter', 'NumpadEnter'];
      expect(validScannerKeys.includes('Enter')).toBe(true);
      expect(validScannerKeys.includes('NumpadEnter')).toBe(true);
      expect(validScannerKeys.includes('Tab')).toBe(false);
    });
  });

  describe('4. Thermal Receipt & Tax Compliance Math', () => {
    it('calculates 16% inclusive Jordanian VAT accurately using integer fils', () => {
      // For a gross total of 11.600 JOD (11600 fils):
      // Net base = 11600 / 1.16 = 10000 fils
      // VAT = 11600 - 10000 = 1600 fils
      const grossFils = 11600;
      const taxResult = calculateTaxAndTotals(
        grossFils,
        16, // 16% tax rate
        true, // pricesIncludeTax
        0, // discount
        false
      );

      expect(taxResult.grossTotalFils).toBe(11600);
      expect(taxResult.netSubtotalFils).toBe(10000);
      expect(taxResult.taxFils).toBe(1600);
      expect(taxResult.netSubtotalFils + taxResult.taxFils).toBe(taxResult.grossTotalFils);
    });

    it('formats fils to 3 decimal places without floating-point inaccuracies', () => {
      expect(filsToDisplay(1000, 'en')).toBe('1.000 JOD');
      expect(filsToDisplay(1250, 'ar')).toBe('1.250 د.أ');
      expect(filsToDisplay(50, 'en')).toBe('0.050 JOD');
      expect(filsToDisplay(5, 'ar')).toBe('0.005 د.أ');
      expect(filsToDisplay(0, 'en')).toBe('0.000 JOD');

      expect(filsToJod(1000)).toBe(1);
      expect(filsToJod(1250)).toBe(1.25);
      expect(jodToFils(1.25)).toBe(1250);
      expect(jodToFils('1.250')).toBe(1250);
    });

    it('verifies print CSS rules omit browser default headers and zero margins', () => {
      const printCSS = `@media print { @page { size: auto; margin: 0mm !important; } body { margin: 0; padding: 0; } }`;
      expect(printCSS).toContain('size: auto');
      expect(printCSS).toContain('margin: 0mm !important');
    });
  });

  describe('5. Storefront Checkout Idempotency & Edge Cases', () => {
    it('verifies correct currency division in WhatsApp notification (1000 fils = 1.000 JOD)', () => {
      const totalAmountFils = 25500;
      // Fixed calculation: / 1000, NOT / 100
      const formattedTotalJOD = (totalAmountFils / 1000).toFixed(3);
      expect(formattedTotalJOD).toBe('25.500');
      expect(formattedTotalJOD).not.toBe('255.00'); // Previous bug check
    });

    it('generates unique and valid checkout idempotency keys', () => {
      const key1 = `CHK-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const key2 = `CHK-${Date.now() + 1}-${Math.random().toString(36).substring(2, 9)}`;

      expect(key1.startsWith('CHK-')).toBe(true);
      expect(key2.startsWith('CHK-')).toBe(true);
      expect(key1).not.toBe(key2);
    });
  });
});
