import { describe, it, expect } from 'vitest';
import {
  jodToFils,
  filsToJod,
  filsToDisplay,
  calculatePercentage,
  calculateInclusiveTax,
  calculateExclusiveTax,
  calculateDiscount,
  calculateTaxAndTotals,
  validatePaymentAllocation,
  calculateCashDrawerReconciliation,
  calculateCourierBatchSettlement,
  calculateProfitAndLoss
} from '../../lib/money';

describe('Audit Verification: 1. JOD 3-Decimal Fils Currency Math', () => {
  it('converts exact decimal amounts without float precision issues', () => {
    // Typical Jordanian prices in cosmetics: 12.500 JOD, 4.250 JOD, 0.750 JOD, 0.005 JOD
    expect(jodToFils(12.5)).toBe(12500);
    expect(jodToFils(4.25)).toBe(4250);
    expect(jodToFils(0.75)).toBe(750);
    expect(jodToFils(0.005)).toBe(5);
    expect(jodToFils('12.500')).toBe(12500);
    expect(jodToFils('4.250')).toBe(4250);
    expect(jodToFils('0.005')).toBe(5);
  });

  it('guarantees integer fils output and half-up rounding', () => {
    // 10.0005 should round up to 10001 fils
    expect(jodToFils('10.0005')).toBe(10001);
    // 10.0004 should round down to 10000 fils
    expect(jodToFils('10.0004')).toBe(10000);
  });

  it('formats display with 3 decimals cleanly in Arabic and English', () => {
    expect(filsToDisplay(12500, 'ar')).toBe('12.500 د.أ');
    expect(filsToDisplay(12500, 'en')).toBe('12.500 JOD');
    expect(filsToDisplay(-3500, 'ar')).toBe('-3.500 د.أ');
    expect(filsToDisplay(0, 'ar')).toBe('0.000 د.أ');
  });
});

describe('Audit Verification: 2. Cash Drawer Reconciliation Formula', () => {
  it('strictly enforces Opening + Cash Sales - Cash Refunds - Cash Expenses = Expected Closing Cash', () => {
    // Real store shift simulation:
    // Opening float: 50.000 JOD (50000 fils)
    // Cash sales during shift: 124.500 JOD (124500 fils)
    // Customer returned item cash refund: 8.500 JOD (8500 fils)
    // Cash expense paid from drawer for cleaning supplies: 15.000 JOD (15000 fils)
    // Expected closing cash = 50000 + 124500 - 8500 - 15000 = 151000 fils (151.000 JOD)
    const result = calculateCashDrawerReconciliation({
      openingCashFils: 50000,
      cashSalesFils: 124500,
      cashRefundsFils: 8500,
      cashExpensesFils: 15000,
      countedCashFils: 151000
    });

    expect(result.expectedClosingCashFils).toBe(151000);
    expect(result.varianceFils).toBe(0);
    expect(result.status).toBe('MATCH');
  });

  it('identifies cash deficit (shortage) accurately', () => {
    // Expected is 151000, cashier counted 146000 -> Shortage of -5000 fils (-5.000 JOD)
    const result = calculateCashDrawerReconciliation({
      openingCashFils: 50000,
      cashSalesFils: 124500,
      cashRefundsFils: 8500,
      cashExpensesFils: 15000,
      countedCashFils: 146000
    });

    expect(result.expectedClosingCashFils).toBe(151000);
    expect(result.varianceFils).toBe(-5000);
    expect(result.status).toBe('SHORTAGE');
  });

  it('identifies cash surplus accurately', () => {
    // Expected is 151000, cashier counted 153500 -> Surplus of +2500 fils (+2.500 JOD)
    const result = calculateCashDrawerReconciliation({
      openingCashFils: 50000,
      cashSalesFils: 124500,
      cashRefundsFils: 8500,
      cashExpensesFils: 15000,
      countedCashFils: 153500
    });

    expect(result.expectedClosingCashFils).toBe(151000);
    expect(result.varianceFils).toBe(2500);
    expect(result.status).toBe('SURPLUS');
  });
});

describe('Audit Verification: 3. Courier Batch Settlements & Net Payout Math', () => {
  it('correctly calculates batch COD, delivery deductions, and net payout', () => {
    // Batch of 3 orders:
    // Order 1: Delivered, COD 29.000 JOD, Fee 3.000 JOD -> Net 26.000 JOD
    // Order 2: Delivered, COD 45.000 JOD, Fee 3.500 JOD -> Net 41.500 JOD
    // Order 3: Cancelled, store waived delivery fee: COD 0, Fee 0
    const orders = [
      { codAmountFils: 29000, deliveryFeeFils: 3000, status: 'DELIVERED' },
      { codAmountFils: 45000, deliveryFeeFils: 3500, status: 'DELIVERED' },
      { codAmountFils: 20000, deliveryFeeFils: 2500, status: 'CANCELLED', storeBearsDeliveryCost: false }
    ];

    const result = calculateCourierBatchSettlement(orders);
    expect(result.totalCodFils).toBe(74000);
    expect(result.totalDeliveryFeeFils).toBe(6500);
    expect(result.netSettlementFils).toBe(67500);
    expect(result.deliveredOrdersCount).toBe(2);
    expect(result.cancelledOrdersCount).toBe(1);
  });

  it('correctly handles cancelled order where store bears delivery fee', () => {
    const orders = [
      { codAmountFils: 35000, deliveryFeeFils: 3000, status: 'DELIVERED' },
      // Cancelled, store pays attempted delivery fee 2.500 JOD
      { codAmountFils: 18000, deliveryFeeFils: 2500, status: 'CANCELLED', storeBearsDeliveryCost: true }
    ];

    const result = calculateCourierBatchSettlement(orders);
    expect(result.totalCodFils).toBe(35000);
    expect(result.totalDeliveryFeeFils).toBe(5500); // 3000 + 2500
    expect(result.netSettlementFils).toBe(29500); // 35000 - 5500
  });
});

describe('Audit Verification: 4. Operating Expenses & P&L Profit Deductions', () => {
  it('verifies that rent, electricity, water, and internet bills are accurately deducted from gross profit', () => {
    // Monthly store P&L simulation:
    // Gross Sales = 1,200.000 JOD (1200000 fils)
    // COGS (65%) = 780.000 JOD (780000 fils)
    // Gross Profit = 420.000 JOD (420000 fils)
    // Operating Expenses:
    //   Rent (المعرض): 300.000 JOD (300000 fils)
    //   Electricity (الكهرباء): 45.000 JOD (45000 fils)
    //   Water & Internet (المياه والإنترنت): 25.000 JOD (25000 fils)
    //   Packaging & Marketing: 30.000 JOD (30000 fils)
    //   Delivery fees deductible: 10.000 JOD (10000 fils)
    // Total OPEX = 300000 + 45000 + 25000 + 30000 + 10000 = 410000 fils (410.000 JOD)
    // Net Operating Profit = 420000 - 410000 = 10000 fils (10.000 JOD)
    const pnl = calculateProfitAndLoss({
      grossSalesFils: 1200000,
      cogsFils: 780000,
      operatingExpenses: {
        rentFils: 300000,
        electricityFils: 45000,
        waterAndInternetFils: 25000,
        otherOpexFils: 30000,
        deliveryFeesFils: 10000
      }
    });

    expect(pnl.grossSalesFils).toBe(1200000);
    expect(pnl.cogsFils).toBe(780000);
    expect(pnl.grossProfitFils).toBe(420000);
    expect(pnl.totalOperatingExpensesFils).toBe(410000);
    expect(pnl.netOperatingProfitFils).toBe(10000);
    expect(pnl.isLoss).toBe(false);
  });
});

describe('Audit Verification: 5. Tax & Discount Integrity (No Negative Subtotals)', () => {
  it('prevents subtotal underflow when discount exceeds order value', () => {
    // 15 JOD order with 20 JOD coupon
    const totals = calculateTaxAndTotals(15000, 16, true, 20000, false);
    expect(totals.subtotalBeforeDiscountFils).toBe(15000);
    expect(totals.discountFils).toBe(15000); // Capped at subtotal
    expect(totals.subtotalAfterDiscountFils).toBe(0);
    expect(totals.grossTotalFils).toBe(0);
    expect(totals.netSubtotalFils).toBe(0);
    expect(totals.taxFils).toBe(0);
  });

  it('guarantees payment allocation validation and change calculation', () => {
    // 25.000 JOD invoice paid with 30.000 JOD cash -> Change due = 5.000 JOD
    const alloc = validatePaymentAllocation(25000, [
      { method: 'CASH', amount: 25000, amountTendered: 30000 }
    ]);

    expect(alloc.cashApplied).toBe(25000);
    expect(alloc.cashTendered).toBe(30000);
    expect(alloc.changeDue).toBe(5000);
  });

  it('rejects negative payment amounts that attempt to tamper with invoice totals', () => {
    expect(() => {
      validatePaymentAllocation(25000, [
        { method: 'CASH', amount: 30000 },
        { method: 'CARD', amount: -5000 }
      ]);
    }).toThrow('مبلغ الدفعة لا يمكن أن يكون سالباً');
  });
});
