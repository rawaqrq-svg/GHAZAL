'use server';

import { requirePermission } from '@/lib/dal';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getPOSOrders() {
  try {
    await requirePermission('pos:access');
    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: ['PENDING', 'AWAITING_WHATSAPP', 'CONFIRMED', 'PREPARING', 'PREPARED', 'SHIPPED', 'DELIVERED', 'CANCELLED']
        }
      },
      take: 200,
      include: {
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, orders: orders || [] };
  } catch (err: any) {
    console.warn('Prisma getPOSOrders fallback active:', err?.message || err);
    return { success: true, orders: [] };
  }
}

export async function updatePOSOrderStatus(orderId: string, newStatus: string) {
  const session = await requirePermission('pos:access');
  
  // We should also check for pos.orders.manage or manage:orders ideally.
  
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) {
      return { success: false, error: 'الطلب غير موجود' };
    }

    if (order.status === 'CANCELLED') {
      return { success: false, error: 'لا يمكن تعديل طلب ملغي' };
    }

    // Process Transaction
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: newStatus }
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: newStatus,
          notes: `تم التعديل بواسطة موظف POS`
        }
      });
    });

    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath('/admin/settlements');
    revalidatePath('/pos/cashier');

    return { success: true };
  } catch (error: any) {
    console.error('Error updating order:', error);
    return { success: false, error: error.message };
  }
}
