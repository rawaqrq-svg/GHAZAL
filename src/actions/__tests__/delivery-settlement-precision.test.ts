import { describe, it, expect } from 'vitest';
import {
  calculateNetSettlement,
  calculateCourierBatchSettlement,
  CourierBatchOrderInput
} from '../../lib/money';

describe('Delivery Settlement Precision & Accounting Hardening', () => {
  it('correctly calculates user scenario #BATCH-001 (10 orders: 7 delivered, 2 returned, 1 in-transit)', () => {
    // 10 orders scenario matching user prompt:
    const orders: CourierBatchOrderInput[] = [
      // 7 Delivered (Expected: 20 JOD each, Collected: 20 JOD each, Delivery fee: 3 JOD each)
      { codAmountFils: 20000, collectedCodFils: 20000, deliveryFeeFils: 3000, returnFeeFils: 0, status: 'DELIVERED' },
      { codAmountFils: 20000, collectedCodFils: 20000, deliveryFeeFils: 3000, returnFeeFils: 0, status: 'DELIVERED' },
      { codAmountFils: 20000, collectedCodFils: 20000, deliveryFeeFils: 3000, returnFeeFils: 0, status: 'DELIVERED' },
      { codAmountFils: 20000, collectedCodFils: 20000, deliveryFeeFils: 3000, returnFeeFils: 0, status: 'DELIVERED' },
      { codAmountFils: 20000, collectedCodFils: 20000, deliveryFeeFils: 3000, returnFeeFils: 0, status: 'DELIVERED' },
      { codAmountFils: 20000, collectedCodFils: 20000, deliveryFeeFils: 3000, returnFeeFils: 0, status: 'DELIVERED' },
      { codAmountFils: 20000, collectedCodFils: 20000, deliveryFeeFils: 3000, returnFeeFils: 0, status: 'DELIVERED' },
      // 2 Returned (Expected: 20 JOD each, Collected: 0 JOD, Return fee: 2 JOD each)
      { codAmountFils: 20000, collectedCodFils: 0, deliveryFeeFils: 0, returnFeeFils: 2000, status: 'RETURNED' },
      { codAmountFils: 20000, collectedCodFils: 0, deliveryFeeFils: 0, returnFeeFils: 2000, status: 'RETURNED' },
      // 1 In Transit (Expected: 20 JOD, Collected: null, Pending)
      { codAmountFils: 20000, collectedCodFils: null, deliveryFeeFils: 3000, returnFeeFils: 0, status: 'IN_TRANSIT' }
    ];

    const result = calculateCourierBatchSettlement(orders);

    expect(result.totalOrdersCount).toBe(10);
    expect(result.totalExpectedCodFils).toBe(200000); // 200.000 د.أ التحصيل المتوقع
    expect(result.deliveredOrdersCount).toBe(7);
    expect(result.returnedOrdersCount).toBe(2);
    expect(result.inTransitOrdersCount).toBe(1);
    expect(result.totalCollectedCodFils).toBe(140000); // 140.000 د.أ التحصيل الفعلي للطلبات المسلمة
    expect(result.totalDeliveryFeeFils).toBe(21000); // 21.000 د.أ أجور التوصيل
    expect(result.totalReturnFeeFils).toBe(4000); // 4.000 د.أ أجور إرجاع الطلبات
    expect(result.totalCourierFeesFils).toBe(25000); // 25.000 د.أ مجموع أجور شركة التوصيل
    expect(result.netSettlementFils).toBe(115000); // 115.000 د.أ صافي المبلغ المستحق حالياً (140 - 21 - 4)
    expect(result.storeReceivableFils).toBe(115000);
    expect(result.companyPayableFils).toBe(0);
    expect(result.isPartialSettlement).toBe(true);
    expect(result.settlementStatus).toBe('PARTIALLY_SETTLED');
  });

  it('accurately reveals negative settlement liability without Math.max(0) masking', () => {
    // If all deliveries failed, total COD collected is 0, but courier is owed 10 JOD:
    const settlement = calculateNetSettlement(0, 10000, 0);

    // Negative net settlement must be preserved!
    expect(settlement.netSettlementFils).toBe(-10000); // -10.000 د.أ
    expect(settlement.companyPayableFils).toBe(10000); // 10.000 د.أ دين مستحق لشركة التوصيل
    expect(settlement.storeReceivableFils).toBe(0); // لا يوجد مبالغ مستحقة للمحل
  });

  it('handles returned packages with store liability and zero COD collection', () => {
    const orders: CourierBatchOrderInput[] = [
      { codAmountFils: 15000, collectedCodFils: 0, deliveryFeeFils: 0, returnFeeFils: 2500, status: 'RETURNED' },
      { codAmountFils: 18000, collectedCodFils: 0, deliveryFeeFils: 0, returnFeeFils: 2500, status: 'RETURNED' },
      { codAmountFils: 22000, collectedCodFils: 0, deliveryFeeFils: 0, returnFeeFils: 2500, status: 'RETURNED' }
    ];

    const result = calculateCourierBatchSettlement(orders);

    expect(result.totalOrdersCount).toBe(3);
    expect(result.deliveredOrdersCount).toBe(0);
    expect(result.returnedOrdersCount).toBe(3);
    expect(result.totalCollectedCodFils).toBe(0);
    expect(result.totalReturnFeeFils).toBe(7500); // 3 * 2.500 JOD = 7.500 JOD
    expect(result.netSettlementFils).toBe(-7500); // -7.500 JOD
    expect(result.companyPayableFils).toBe(7500); // Store owes courier 7.500 JOD
    expect(result.storeReceivableFils).toBe(0);
    expect(result.settlementStatus).toBe('LIABILITY_OWED');
  });

  it('supports collection discrepancies when customer pays partial COD', () => {
    const orders: CourierBatchOrderInput[] = [
      // Customer paid 18.000 instead of expected 20.000
      { codAmountFils: 20000, collectedCodFils: 18000, deliveryFeeFils: 3000, status: 'DELIVERED' }
    ];

    const result = calculateCourierBatchSettlement(orders);

    expect(result.totalExpectedCodFils).toBe(20000);
    expect(result.totalCollectedCodFils).toBe(18000);
    expect(result.netSettlementFils).toBe(15000); // 18000 - 3000 = 15000
    expect(result.storeReceivableFils).toBe(15000);
  });
});
