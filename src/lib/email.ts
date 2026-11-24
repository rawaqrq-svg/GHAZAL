import { Resend } from 'resend';

export interface OrderItemEmailData {
  name: string;
  size?: string;
  quantity: number;
  unitPrice: number; // in fils
  total: number; // in fils
  sku?: string;
}

export interface NewOrderEmailPayload {
  reference: string;
  customerName: string;
  customerPhone: string;
  zoneName?: string;
  address?: string;
  items: OrderItemEmailData[];
  subtotalFils: number;
  shippingCostFils: number;
  rewardDiscountFils?: number;
  grandTotalFils: number;
  notes?: string;
  createdAt?: string;
}

const DEFAULT_API_KEY = 're_PLACEHOLDER_KEY_REMOVED';
const DEFAULT_FROM = 'onboarding@resend.dev';
const DEFAULT_TO = 'storeghazal0@gmail.com';

function formatJOD(fils: number): string {
  return (fils / 1000).toFixed(3) + ' د.أ';
}

export async function sendNewOrderNotificationEmail(payload: NewOrderEmailPayload): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY || DEFAULT_API_KEY;
    const resend = new Resend(apiKey);

    const from = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM;
    const to = process.env.RESEND_ORDER_NOTIFICATION_EMAIL || DEFAULT_TO;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const orderTime = payload.createdAt 
      ? new Date(payload.createdAt).toLocaleString('ar-JO', { timeZone: 'Asia/Amman' }) 
      : new Date().toLocaleString('ar-JO', { timeZone: 'Asia/Amman' });

    // Clean phone number for WhatsApp link
    const cleanPhone = payload.customerPhone.replace(/[^0-9]/g, '');
    const waPhone = cleanPhone.startsWith('0') ? '962' + cleanPhone.slice(1) : (cleanPhone.startsWith('962') ? cleanPhone : '962' + cleanPhone);
    const waUrl = `https://wa.me/${waPhone}`;

    // Generate Items HTML Rows
    const itemsHtml = payload.items.map((item, index) => {
      const isFreeGift = item.unitPrice === 0 || item.total === 0;
      return `
        <tr style="border-bottom: 1px solid #f3e8e2;">
          <td style="padding: 12px 8px; text-align: right; font-size: 14px; color: #1f2937;">
            <div style="font-weight: 600;">${item.name}</div>
            ${item.size ? `<div style="font-size: 12px; color: #6b7280;">الحجم / التنوع: ${item.size}</div>` : ''}
            ${item.sku ? `<div style="font-size: 11px; color: #9ca3af;">رمز الصنف (SKU): ${item.sku}</div>` : ''}
          </td>
          <td style="padding: 12px 8px; text-align: center; font-size: 14px; font-weight: 600; color: #374151;">
            ${item.quantity}
          </td>
          <td style="padding: 12px 8px; text-align: left; font-size: 14px; color: #374151;">
            ${isFreeGift ? '<span style="color: #059669; font-weight: bold;">🎁 مجاناً</span>' : formatJOD(item.unitPrice)}
          </td>
          <td style="padding: 12px 8px; text-align: left; font-size: 14px; font-weight: bold; color: ${isFreeGift ? '#059669' : '#111827'};">
            ${isFreeGift ? '0.000 د.أ' : formatJOD(item.total)}
          </td>
        </tr>
      `;
    }).join('');

    // Plain text items
    const itemsText = payload.items.map(it => {
      const isGift = it.unitPrice === 0 || it.total === 0;
      return `- ${it.name} ${it.size ? `(${it.size})` : ''} | الكمية: ${it.quantity} | السعر: ${isGift ? 'هدية مجانية' : formatJOD(it.total)}`;
    }).join('\n');

    // Email Subject
    const subject = `طلب جديد #${payload.reference}`;

    // Plain Text Version
    const textContent = `
وصلك طلب جديد في متجر غزل (GHAZAL)
----------------------------------------
رقم الطلب: ${payload.reference}
التاريخ والوقت: ${orderTime}

بيانات العميل والتوصيل:
- اسم العميل: ${payload.customerName}
- رقم الهاتف: ${payload.customerPhone}
- منطقة التوصيل: ${payload.zoneName || 'غير محدد'}
- العنوان: ${payload.address || 'العنوان مسجل'}

المنتجات:
${itemsText}

الملخص المالي:
- المجموع الفرعي: ${formatJOD(payload.subtotalFils)}
- رسوم التوصيل: ${payload.shippingCostFils === 0 ? 'مجاني' : formatJOD(payload.shippingCostFils)}
${payload.rewardDiscountFils && payload.rewardDiscountFils > 0 ? `- خصم المكافآت: -${formatJOD(payload.rewardDiscountFils)}\n` : ''}
- الإجمالي النهائي: ${formatJOD(payload.grandTotalFils)}

رابط الطلب في لوحة التحكم:
${appUrl}/admin/orders
    `.trim();

    // Responsive, Elegant Arabic RTL HTML Template
    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #faf5f3; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #faf5f3; padding: 25px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 650px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); border: 1px solid #f1ded5;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #881337 0%, #be123c 50%, #9f1239 100%); padding: 30px 24px; text-align: center; color: #ffffff;">
              <div style="font-size: 26px; font-weight: 800; letter-spacing: 1px; margin-bottom: 6px;">غزل | GHAZAL</div>
              <div style="font-size: 14px; opacity: 0.9; margin-bottom: 16px;">مستحضرات التجميل والعناية الفاخرة</div>
              <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.35); border-radius: 30px; padding: 8px 20px; font-size: 16px; font-weight: bold;">
                🛍️ وصلك طلب جديد #${payload.reference}
              </div>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 28px 24px;">

              <!-- Status Alert Box -->
              <div style="background-color: #fdf2f4; border-right: 4px solid #be123c; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 14px; color: #881337; font-weight: 600;">
                  تم استلام طلب جديد بنجاح عبر المتجر الإلكتروني. يرجى مراجعة تفاصيل الطلب وتجهيزه للتسليم.
                </p>
                <p style="margin: 6px 0 0 0; font-size: 12px; color: #9f1239;">
                  🕒 توقيت استلام الطلب: <strong>${orderTime}</strong>
                </p>
              </div>

              <!-- Customer & Shipping Information -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fffaf8; border: 1px solid #f4dfd5; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <div style="font-size: 15px; font-weight: 700; color: #881337; margin-bottom: 12px; border-bottom: 1px dashed #eed1c3; padding-bottom: 8px;">
                      👤 معلومات العميل والتوصيل
                    </div>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #6b7280; width: 35%;">اسم المستلم:</td>
                        <td style="padding: 4px 0; font-size: 14px; font-weight: bold; color: #111827;">${payload.customerName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #6b7280;">رقم الهاتف:</td>
                        <td style="padding: 4px 0; font-size: 14px; color: #111827;">
                          <a href="tel:${payload.customerPhone}" style="color: #be123c; text-decoration: none; font-weight: bold;">${payload.customerPhone}</a>
                          &nbsp;|&nbsp;
                          <a href="${waUrl}" target="_blank" style="color: #059669; text-decoration: none; font-size: 12px; font-weight: bold;">💬 فتح واتساب</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #6b7280;">منطقة التوصيل:</td>
                        <td style="padding: 4px 0; font-size: 14px; font-weight: 600; color: #374151;">${payload.zoneName || 'الأردن'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #6b7280;">العنوان التفصيلي:</td>
                        <td style="padding: 4px 0; font-size: 14px; color: #374151;">${payload.address || 'العنوان مسجل في الطلب'}</td>
                      </tr>
                      ${payload.notes ? `
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #6b7280;">ملاحظات إضافية:</td>
                        <td style="padding: 4px 0; font-size: 13px; color: #4b5563; font-style: italic;">${payload.notes}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Order Items Table -->
              <div style="font-size: 15px; font-weight: 700; color: #881337; margin-bottom: 10px;">
                📦 الأصناف المطلوبة (${payload.items.length})
              </div>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 24px;">
                <thead>
                  <tr style="background-color: #fce7ec; border-bottom: 2px solid #f43f5e;">
                    <th style="padding: 10px 8px; text-align: right; font-size: 13px; color: #881337;">المنتج</th>
                    <th style="padding: 10px 8px; text-align: center; font-size: 13px; color: #881337; width: 60px;">الكمية</th>
                    <th style="padding: 10px 8px; text-align: left; font-size: 13px; color: #881337; width: 90px;">السعر</th>
                    <th style="padding: 10px 8px; text-align: left; font-size: 13px; color: #881337; width: 90px;">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Financial Totals -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fbfbfb; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #4b5563;">المجموع الفرعي:</td>
                        <td style="padding: 4px 0; font-size: 14px; text-align: left; font-weight: 600; color: #111827;">${formatJOD(payload.subtotalFils)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #4b5563;">أجرة التوصيل:</td>
                        <td style="padding: 4px 0; font-size: 14px; text-align: left; font-weight: 600; color: ${payload.shippingCostFils === 0 ? '#059669' : '#111827'};">
                          ${payload.shippingCostFils === 0 ? 'مجاني 🎉' : formatJOD(payload.shippingCostFils)}
                        </td>
                      </tr>
                      ${payload.rewardDiscountFils && payload.rewardDiscountFils > 0 ? `
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #059669;">خصم مكافأة السلة:</td>
                        <td style="padding: 4px 0; font-size: 14px; text-align: left; font-weight: bold; color: #059669;">
                          -${formatJOD(payload.rewardDiscountFils)}
                        </td>
                      </tr>
                      ` : ''}
                      <tr style="border-top: 2px solid #e5e7eb;">
                        <td style="padding: 12px 0 4px 0; font-size: 16px; font-weight: bold; color: #881337;">
                          المبلغ المطلوب تحصيله (COD):
                        </td>
                        <td style="padding: 12px 0 4px 0; font-size: 20px; font-weight: 900; text-align: left; color: #be123c;">
                          ${formatJOD(payload.grandTotalFils)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Call to Action Button -->
              <div style="text-align: center; margin-bottom: 10px;">
                <a href="${appUrl}/admin/orders" target="_blank" style="display: inline-block; background-color: #be123c; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: bold; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 12px rgba(190, 18, 60, 0.25);">
                  🔍 فتح وإدارة الطلب في لوحة الإدارة
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fdf8f6; border-top: 1px solid #f1ded5; padding: 18px 24px; text-align: center; font-size: 12px; color: #9ca3af;">
              هذا الإشعار تلقائي صادر من منصة غزل (GHAZAL) لإدارة المتجر الإلكتروني ونقاط البيع السحابية.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    // Send the email via Resend
    const response = await resend.emails.send({
      from,
      to,
      subject,
      text: textContent,
      html: htmlContent
    });

    if (response.error) {
      console.error('[Resend Email Error]:', response.error);
      return { success: false, error: response.error.message };
    }

    console.log(`[Resend Email Sent] Successfully sent notification for order ${payload.reference} (ID: ${response.data?.id}) to ${to}`);
    return { success: true, id: response.data?.id };
  } catch (err: any) {
    console.error('[Resend Email Exception]:', err?.message || err);
    return { success: false, error: err?.message || String(err) };
  }
}
