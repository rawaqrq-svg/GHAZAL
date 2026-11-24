'use server';

import { prisma } from '@/lib/db';
import { getDemoOrderById } from '@/lib/orders-catalog';

export interface ActiveOrderStatusResult {
  found: boolean;
  reference?: string;
  orderNumber?: string;
  customerName?: string;
  status?: string;
  statusAr?: string;
  isDelivered?: boolean;
  totalAmountFils?: number;
  createdAt?: string;
}

export async function getActiveOrderStatusAction(reference: string): Promise<ActiveOrderStatusResult> {
  if (!reference || typeof reference !== 'string') {
    return { found: false };
  }

  const cleanRef = reference.trim();

  try {
    let order: any = null;
    try {
      order = await prisma.order.findFirst({
        where: {
          OR: [
            { reference: cleanRef },
            { id: cleanRef }
          ]
        },
        select: {
          id: true,
          reference: true,
          customerName: true,
          status: true,
          totalAmount: true,
          createdAt: true,
        }
      });
    } catch (dbErr) {
      // Database connection failed; fallback gracefully to demo orders catalog
    }

  if (!order) {
    const demo = getDemoOrderById(cleanRef);
    if (demo) {
      order = demo;
    }
  }

  if (!order) {
    return { found: false };
  }

    const status = (order.status || 'PENDING').toUpperCase();
    const isDelivered = status === 'DELIVERED' || status === 'COMPLETED' || status === 'CANCELLED';

    let statusAr = 'قيد المتابعة';
    switch (status) {
      case 'AWAITING_WHATSAPP':
      case 'PENDING':
      case 'NEW':
        statusAr = 'طلب جديد بانتظار التأكيد';
        break;
      case 'CONFIRMED':
      case 'PREPARING':
      case 'CONFIRMED_PREPARING':
        statusAr = 'مؤكد وقيد التجهيز';
        break;
      case 'PREPARED':
      case 'READY_FOR_DELIVERY':
        statusAr = 'تم التجهيز بانتظار شركة التوصيل';
        break;
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY':
      case 'IN_TRANSIT':
        statusAr = 'مع شركة التوصيل (في الطريق إليكِ)';
        break;
      case 'DELIVERED':
      case 'COMPLETED':
        statusAr = 'تم التسليم بنجاح ✓';
        break;
      case 'CANCELLED':
        statusAr = 'تم إلغاء الطلب';
        break;
      default:
        statusAr = status;
        break;
    }

    return {
      found: true,
      reference: order.reference || cleanRef,
      orderNumber: (order.reference || cleanRef).replace('ORD-', ''),
      customerName: order.customerName,
      status,
      statusAr,
      isDelivered,
      totalAmountFils: order.totalAmount,
      createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : undefined,
    };
  } catch (error) {
    console.error('Error in getActiveOrderStatusAction:', error);
    return { found: false };
  }
}
