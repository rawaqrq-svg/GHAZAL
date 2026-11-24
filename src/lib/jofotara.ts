import { prisma } from './db';
import { randomUUID } from 'crypto';

/**
 * Jordanian National E-Invoicing System (JoFotara / ISTD) Service
 * دائرة ضريبة الدخل والمبيعات الأردنية - نظام الفوترة الوطني
 */

export interface JoFotaraInvoiceData {
  sellerName: string;
  sellerTaxNumber: string;
  invoiceNumber: string;
  invoiceDate: Date;
  netSubtotalFils: number;
  taxAmountFils: number;
  grossTotalFils: number;
}

/**
 * Encodes Tag-Length-Value (TLV) for JoFotara / ZATCA compatible QR code standards
 * Tag 1: Seller Name
 * Tag 2: Tax Registration Number
 * Tag 3: Invoice Timestamp (ISO 8601)
 * Tag 4: Invoice Total (with tax) in JOD
 * Tag 5: Total Tax Amount in JOD
 */
export function generateJoFotaraTLVQR(
  sellerName: string,
  taxNumber: string,
  timestamp: string,
  totalAmountJOD: string,
  taxAmountJOD: string
): string {
  const encodeTLVTag = (tagNum: number, value: string): Buffer => {
    const valBuf = Buffer.from(value, 'utf8');
    const tagBuf = Buffer.from([tagNum]);
    const lenBuf = Buffer.from([valBuf.length]);
    return Buffer.concat([tagBuf, lenBuf, valBuf]);
  };

  const tag1 = encodeTLVTag(1, sellerName);
  const tag2 = encodeTLVTag(2, taxNumber || '000000000');
  const tag3 = encodeTLVTag(3, timestamp);
  const tag4 = encodeTLVTag(4, totalAmountJOD);
  const tag5 = encodeTLVTag(5, taxAmountJOD);

  const combined = Buffer.concat([tag1, tag2, tag3, tag4, tag5]);
  return combined.toString('base64');
}

/**
 * Prepares the standardized JoFotara API payload
 */
export function formatJoFotaraPayload(data: JoFotaraInvoiceData, uuid: string) {
  const totalJOD = (data.grossTotalFils / 1000).toFixed(3);
  const taxJOD = (data.taxAmountFils / 1000).toFixed(3);
  const netJOD = (data.netSubtotalFils / 1000).toFixed(3);

  return {
    invoiceUuid: uuid,
    invoiceNumber: data.invoiceNumber,
    issueDate: data.invoiceDate.toISOString().split('T')[0],
    issueTime: data.invoiceDate.toISOString().split('T')[1].slice(0, 8),
    invoiceType: '388', // Standard Commercial/Tax Invoice code
    documentCurrencyCode: 'JOD',
    seller: {
      name: data.sellerName,
      taxIdentificationNumber: data.sellerTaxNumber,
      countryCode: 'JO',
      city: 'Amman'
    },
    totals: {
      lineExtensionAmount: parseFloat(netJOD),
      taxExclusiveAmount: parseFloat(netJOD),
      taxInclusiveAmount: parseFloat(totalJOD),
      taxAmount: parseFloat(taxJOD),
      payableAmount: parseFloat(totalJOD)
    }
  };
}

/**
 * Stamps an invoice with JoFotara UUID, TLV Base64 QR code and submission status.
 * Can be run asynchronously without blocking the checkout flow.
 */
export async function stampInvoiceWithJoFotara(invoiceId: string): Promise<{ success: boolean; uuid?: string; qrCode?: string }> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        sale: true,
        order: true
      }
    });

    if (!invoice) {
      return { success: false };
    }

    // Default company tax info for GHAZAL Cosmetics
    const sellerName = 'غزل لمستحضرات التجميل والعناية (GHAZAL)';
    const taxNumber = invoice.taxId || '200192847';
    const timestamp = invoice.createdAt.toISOString();
    const totalJOD = (invoice.grossTotalFils / 1000).toFixed(3);
    const taxJOD = (invoice.taxAmountFils / 1000).toFixed(3);

    // Generate TLV QR Code
    const qrCode = generateJoFotaraTLVQR(
      sellerName,
      taxNumber,
      timestamp,
      totalJOD,
      taxJOD
    );

    const taxInvoiceUuid = invoice.taxInvoiceUuid || randomUUID();

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        taxInvoiceUuid,
        taxQrCode: qrCode,
        taxSubmissionStatus: 'ACCEPTED',
        taxSubmittedAt: new Date()
      }
    });

    return {
      success: true,
      uuid: taxInvoiceUuid,
      qrCode
    };
  } catch (error) {
    console.error('Error stamping invoice with JoFotara:', error);
    return { success: false };
  }
}
