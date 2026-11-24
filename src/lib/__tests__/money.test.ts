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
} from '../money';

describe('JOD 3-Decimal Currency & Fils Math (1 JOD = 1,000 Fils)', () => {
  it('converts JOD decimal numbers to integer fils correctly', () => {
    expect(jodToFils(10.5)).toBe(10500);
    expect(jodToFils(1.005)).toBe(1005);
    expect(jodToFils(0.25)).toBe(250);
    expect(jodToFils(0.001)).toBe(1);
    expect(jodToFils(0)).toBe(0);
  });

  it('converts string representations of JOD without floating point drift', () => {
    expect(jodToFils('10.500')).toBe(10500);
    expect(jodToFils('1.005')).toBe(1005);
    expect(jodToFils('0.001')).toBe(1);
    expect(jodToFils('0.0005')).toBe(1); // Half-up rounds 4th decimal
    expect(jodToFils('0.0004')).toBe(0);
    expect(jodToFils('-5.250')).toBe(-5250);
    expect(jodToFils('')).toBe(0);
    expect(jodToFils('invalid')).toBe(0);
  });

  it('converts integer fils back to JOD decimal', () => {
    expect(filsToJod(10500)).toBe(10.5);
    expect(filsToJod(1005)).toBe(1.005);
    expect(filsToJod(1)).toBe(0.001);
    expect(filsToJod(0)).toBe(0);
  });

  it('formats fils to user-friendly Arabic and English strings with exact 3 decimals', () => {
    expect(filsToDisplay(10500, 'ar')).toBe('10.500 د.أ');
    expect(filsToDisplay(10500, 'en')).toBe('10.500 JOD');
    expect(filsToDisplay(50, 'ar')).toBe('0.050 د.أ');
    expect(filsToDisplay(5, 'ar')).toBe('0.005 د.أ');
    expect(filsToDisplay(-5000, 'ar')).toBe('-5.000 د.أ');
    expect(filsToDisplay(-5000, 'en')).toBe('-5.000 JOD');
    expect(filsToDisplay(0, 'ar')).toBe('0.000 د.أ');
    expect(filsToDisplay(NaN as any, 'ar')).toBe('0.000 د.أ');
  });
});

describe('Tax & Discount Calculations (Inclusive / Exclusive VAT)', () => {
  it('extracts inclusive VAT accurately from gross total using half-up integer fils', () => {
    // 1160 fils with 16% VAT: net = 1000, tax = 160
    expect(calculateInclusiveTax(1160, 16)).toBe(160);
    // 1000 fils with 16% VAT: net = 862.0689..., tax = 137.931... -> 138 fils
    expect(calculateInclusiveTax(1000, 16)).toBe(138);
    // Rate <= 0 or gross <= 0 should yield 0 tax
    expect(calculateInclusiveTax(1000, 0)).toBe(0);
    expect(calculateInclusiveTax(-500, 16)).toBe(0);
  });

  it('calculates exclusive VAT accurately from net subtotal using half-up integer fils', () => {
    // 1000 fils net with 16% VAT = 160 fils tax
    expect(calculateExclusiveTax(1000, 16)).toBe(160);
    // 1250 fils net with 16% VAT = 200 fils tax
    expect(calculateExclusiveTax(1250, 16)).toBe(200);
    // Rate <= 0 or net <= 0 should yield 0 tax
    expect(calculateExclusiveTax(1000, 0)).toBe(0);
    expect(calculateExclusiveTax(-100, 16)).toBe(0);
  });

  it('prevents negative discounts and negative subtotals', () => {
    // Standard percentage discount (20% off 10000 fils = 2000 fils)
    expect(calculateDiscount(10000, 20, true)).toBe(2000);
    // Fixed amount discount (3000 fils off 10000 fils = 3000 fils)
    expect(calculateDiscount(10000, 3000, false)).toBe(3000);
    // Negative discount input should be clamped to 0
    expect(calculateDiscount(10000, -500, false)).toBe(0);
    expect(calculateDiscount(10000, -20, true)).toBe(0);
    // Excessive discount should be capped at subtotal (no negative subtotals)
    expect(calculateDiscount(5000, 8000, false)).toBe(5000);
    expect(calculateDiscount(5000, 150, true)).toBe(5000);
  });

  it('guarantees exact accounting identity Net + Tax === Gross in calculateTaxAndTotals', () => {
    // Inclusive VAT test: 11.600 JOD with 16% VAT and 1.600 JOD discount
    const incResult = calculateTaxAndTotals(11600, 16, true, 1600, false);
    expect(incResult.subtotalBeforeDiscountFils).toBe(11600);
    expect(incResult.discountFils).toBe(1600);
    expect(incResult.subtotalAfterDiscountFils).toBe(10000);
    expect(incResult.grossTotalFils).toBe(10000);
    expect(incResult.netSubtotalFils + incResult.taxFils).toBe(incResult.grossTotalFils);

    // Exclusive VAT test: 10.000 JOD with 16% VAT and 20% discount
    const excResult = calculateTaxAndTotals(10000, 16, false, 20, true);
    expect(excResult.discountFils).toBe(2000);
    expect(excResult.netSubtotalFils).toBe(8000);
    expect(excResult.taxFils).toBe(1280); // 8000 * 0.16
    expect(excResult.grossTotalFils).toBe(9280);
    expect(excResult.netSubtotalFils + excResult.taxFils).toBe(excResult.grossTotalFils);
  });
});

describe('Cash Drawer Reconciliation', () => {
  it('correctly calculates expected closing cash: opening + sales - refunds - expenses', () => {
    // Opening: 50 JOD (50000 fils)
    // Cash Sales: 180 JOD (180000 fils)
    // Cash Refunds: 15 JOD (15000 fils)
    // Cash Expenses: 35 JOD (35000 fils)
    // Expected = 50000 + 180000 - 15000 - 35000 = 180000 fils (180 JOD)
    const recon = calculateCashDrawerReconciliation({
      openingCashFils: 50000,
      cashSalesFils: 180000,
      cashRefundsFils: 15000,
      cashExpensesFils: 35000,
      countedCashFils: 180000
    });

    expect(recon.expectedClosingCashFils).toBe(180000);
    expect(recon.varianceFils).toBe(0);
    expect(recon.status).toBe('MATCH');
  });

  it('detects cash shortage (عجز بالصندوق)', () => {
    const recon = calculateCashDrawerReconciliation({
      openingCashFils: 50000,
      cashSalesFils: 100000,
      cashRefundsFils: 0,
      cashExpensesFils: 20000,
      countedCashFils: 125000 // Expected is 130000, deficit is -5000
    });

    expect(recon.expectedClosingCashFils).toBe(130000);
    expect(recon.varianceFils).toBe(-5000);
    expect(recon.status).toBe('SHORTAGE');
  });

  it('detects cash surplus (فائض بالصندوق)', () => {
    const recon = calculateCashDrawerReconciliation({
      openingCashFils: 50000,
      cashSalesFils: 100000,
      cashRefundsFils: 0,
      cashExpensesFils: 0,
      countedCashFils: 155000 // Expected is 150000, surplus is +5000
    });

    expect(recon.expectedClosingCashFils).toBe(150000);
    expect(recon.varianceFils).toBe(5000);
    expect(recon.status).toBe('SURPLUS');
  });
});

describe('Courier Batch Settlements', () => {
  it('calculates total COD, deductible fees, and net payout correctly for delivered orders', () => {
    const orders = [
      { codAmountFils: 30000, deliveryFeeFils: 3000, status: 'DELIVERED' },
      { codAmountFils: 45000, deliveryFeeFils: 3500, status: 'DELIVERED' }
    ];

    const settlement = calculateCourierBatchSettlement(orders);
    expect(settlement.totalCodFils).toBe(75000);
    expect(settlement.totalDeliveryFeeFils).toBe(6500);
    expect(settlement.netSettlementFils).toBe(68500);
    expect(settlement.deliveredOrdersCount).toBe(2);
    expect(settlement.cancelledOrdersCount).toBe(0);
  });

  it('handles cancelled orders with and without store bearing delivery fees', () => {
    const orders = [
      { codAmountFils: 30000, deliveryFeeFils: 3000, status: 'DELIVERED' },
      // Cancelled, store waived delivery fee: COD = 0, fee = 0
      { codAmountFils: 20000, deliveryFeeFils: 2500, status: 'CANCELLED', storeBearsDeliveryCost: false },
      // Cancelled, store bears delivery fee: COD = 0, fee = 2500 deducted
      { codAmountFils: 25000, deliveryFeeFils: 2500, status: 'CANCELLED', storeBearsDeliveryCost: true }
    ];

    const settlement = calculateCourierBatchSettlement(orders);
    expect(settlement.totalCodFils).toBe(30000); // Only delivered order COD
    expect(settlement.totalDeliveryFeeFils).toBe(5500); // 3000 + 2500
    expect(settlement.netSettlementFils).toBe(24500); // 30000 - 5500
    expect(settlement.deliveredOrdersCount).toBe(1);
    expect(settlement.cancelledOrdersCount).toBe(2);
  });
});

describe('Operating Expenses & P&L Statement', () => {
  it('accurately deducts rent, electricity, water, internet, and opex from gross profit to yield net operating profit', () => {
    // Sales: 1000 JOD (1,000,000 fils)
    // COGS: 600 JOD (600,000 fils) -> Gross Profit = 400 JOD (400,000 fils)
    // Expenses:
    //   Rent: 150 JOD (150,000 fils)
    //   Electricity: 30 JOD (30,000 fils)
    //   Water & Internet: 20 JOD (20,000 fils)
    //   Other OPEX: 40 JOD (40,000 fils)
    //   Delivery Fees: 10 JOD (10,000 fils)
    // Total OPEX = 250 JOD (250,000 fils)
    // Net Operating Profit = 400,000 - 250,000 = 150,000 fils (150 JOD)
    const pnl = calculateProfitAndLoss({
      grossSalesFils: 1000000,
      cogsFils: 600000,
      operatingExpenses: {
        rentFils: 150000,
        electricityFils: 30000,
        waterAndInternetFils: 20000,
        otherOpexFils: 40000,
        deliveryFeesFils: 10000
      }
    });

    expect(pnl.grossProfitFils).toBe(400000);
    expect(pnl.grossMarginPercent).toBe(40);
    expect(pnl.totalOperatingExpensesFils).toBe(250000);
    expect(pnl.netOperatingProfitFils).toBe(150000);
    expect(pnl.netMarginPercent).toBe(15);
    expect(pnl.isLoss).toBe(false);
  });

  it('correctly reports net operating loss when expenses exceed gross profit', () => {
    const pnl = calculateProfitAndLoss({
      grossSalesFils: 500000,
      cogsFils: 350000, // Gross Profit = 150,000 fils
      operatingExpenses: {
        rentFils: 200000,
        electricityFils: 30000,
        waterAndInternetFils: 20000,
        otherOpexFils: 10000,
        deliveryFeesFils: 5000
      } // Total OPEX = 265,000 fils
    });

    expect(pnl.grossProfitFils).toBe(150000);
    expect(pnl.totalOperatingExpensesFils).toBe(265000);
    expect(pnl.netOperatingProfitFils).toBe(-115000); // Loss of 115 JOD
    expect(pnl.isLoss).toBe(true);
  });
});
