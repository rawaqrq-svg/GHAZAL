import { BrowserWindow } from 'electron';
import { PrintReceiptPayload } from './preload';

export class ThermalPrinterService {
  /**
   * Generates clean 80mm thermal receipt HTML and prints silently
   */
  public static async printThermalReceipt(
    payload: PrintReceiptPayload,
    printerName?: string
  ): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      // Hidden window for rendering receipt
      const printWindow = new BrowserWindow({
        show: false,
        width: 320,
        height: 600,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });

      const receiptHtml = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <style>
            @page {
              margin: 0;
              size: 80mm auto;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
              font-size: 11px;
              color: #000;
              width: 72mm;
              margin: 0 auto;
              padding: 6px 0;
            }
            .text-center { text-align: center; }
            .text-end { text-align: left; }
            .font-bold { font-weight: bold; }
            .logo-text { font-size: 18px; font-weight: 900; letter-spacing: 1px; }
            .sub-title { font-size: 10px; margin-top: 2px; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; }
            .double-divider { border-top: 2px solid #000; margin: 6px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; }
            th { border-bottom: 1px solid #000; padding: 3px 0; text-align: right; }
            td { padding: 3px 0; vertical-align: top; }
            .totals-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
            .grand-total { font-size: 13px; font-weight: 900; margin: 4px 0; }
            .barcode-box { margin-top: 8px; text-align: center; font-family: monospace; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="text-center">
            <div class="logo-text">GHAZAL</div>
            <div class="sub-title">غزل لمستحضرات التجميل والعناية</div>
            <div style="font-size: 9px; color: #333;">الأردن - عمّان • هاتف: 0799991234</div>
            <div class="divider"></div>
            <div class="font-bold">فاتورة مبيعات نقدية</div>
            <div style="font-size: 9px;">رقم: ${payload.invoiceNumber || payload.reference}</div>
            <div style="font-size: 9px;">التاريخ: ${payload.date}</div>
            <div style="font-size: 9px;">الكاشير: ${payload.cashierName}</div>
          </div>

          <div class="divider"></div>

          <table>
            <thead>
              <tr>
                <th style="width: 50%;">الصنف</th>
                <th style="width: 15%; text-align: center;">الكمية</th>
                <th style="width: 35%; text-align: left;">المجموع</th>
              </tr>
            </thead>
            <tbody>
              ${payload.items
                .map(
                  (item) => `
                <tr>
                  <td>
                    <div class="font-bold">${item.name}</div>
                    ${item.shade ? `<div style="font-size: 8px;">درجة: ${item.shade}</div>` : ''}
                  </td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: left;">${(item.totalFils / 1000).toFixed(3)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div class="divider"></div>

          <div class="totals-row">
            <span>المجموع الفرعي:</span>
            <span>${(payload.subtotalFils / 1000).toFixed(3)} د.أ</span>
          </div>

          ${
            payload.discountFils > 0
              ? `
            <div class="totals-row">
              <span>الخصم المطبق:</span>
              <span>-${(payload.discountFils / 1000).toFixed(3)} د.أ</span>
            </div>
          `
              : ''
          }

          ${
            payload.taxFils > 0
              ? `
            <div class="totals-row">
              <span>ضريبة المبيعات:</span>
              <span>${(payload.taxFils / 1000).toFixed(3)} د.أ</span>
            </div>
          `
              : ''
          }

          <div class="double-divider"></div>

          <div class="totals-row grand-total">
            <span>الإجمالي المستحق:</span>
            <span>${(payload.grossTotalFils / 1000).toFixed(3)} د.أ</span>
          </div>

          <div class="divider"></div>

          <div class="totals-row" style="font-size: 9px;">
            <span>طريقة السداد:</span>
            <span>${payload.paymentMethod === 'CASH' ? 'نقداً' : payload.paymentMethod === 'CARD' ? 'بطاقة ائتمان' : 'دفع مجزأ'}</span>
          </div>

          ${
            payload.amountTenderedFils
              ? `
            <div class="totals-row" style="font-size: 9px;">
              <span>المبلغ المستلم:</span>
              <span>${(payload.amountTenderedFils / 1000).toFixed(3)} د.أ</span>
            </div>
            <div class="totals-row font-bold" style="font-size: 10px;">
              <span>الباقي للعميل:</span>
              <span>${((payload.changeDueFils || 0) / 1000).toFixed(3)} د.أ</span>
            </div>
          `
              : ''
          }

          <div class="divider"></div>

          <div class="text-center" style="font-size: 9px; margin-top: 6px;">
            <div>شكراً لزيارتكم غزل • نتمنى لكم يوماً جميلاً</div>
            <div>البضاعة المباعة تخضع لسياسة الاستبدال والاسترجاع</div>
            <div class="barcode-box">*${payload.reference}*</div>
          </div>
        </body>
        </html>
      `;

      printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(receiptHtml)}`);

      printWindow.webContents.on('did-finish-load', () => {
        printWindow.webContents.print(
          {
            silent: true,
            printBackground: true,
            deviceName: printerName || ''
          },
          (success, failureReason) => {
            printWindow.close();
            if (success) {
              resolve({ success: true });
            } else {
              resolve({ success: false, error: failureReason });
            }
          }
        );
      });
    });
  }
}
