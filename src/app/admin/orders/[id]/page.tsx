import React from 'react';
import { requireAuth } from '@/lib/dal';
import { filsToDisplay } from '@/lib/money';
import { prisma } from '@/lib/db';
import { AdminSidebar } from '@/components/AdminSidebar';
import { updateOrderStatus, confirmStorefrontOrder, cancelStorefrontOrder } from '@/actions/orders';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminOrderQuickActions } from '@/components/AdminOrderQuickActions';
import { AdminOrderItemsEditor } from '@/components/AdminOrderItemsEditor';
import { ArrowRight, User, Phone, MapPin, Calendar, Clock, ShoppingBag, FileEdit, CheckCircle2, AlertTriangle, Printer, FileText } from 'lucide-react';
import { getDemoOrderById } from '@/lib/orders-catalog';
import { COSMETICS_CATALOG } from '@/lib/cosmetics-catalog';

export default async function AdminOrderDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireAuth();
  const { id } = await params;

  let order: any = null;
  let availableProducts: any[] = [];

  try {
    const [dbOrder, dbProducts] = await Promise.all([
      prisma.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  variants: true,
                  images: true
                }
              }
            }
          },
          statusHistory: {
            orderBy: { createdAt: 'desc' }
          }
        }
      }),
      prisma.product.findMany({
        where: { isVisible: true },
        select: {
          id: true,
          nameAr: true,
          images: {
            select: { url: true, isMain: true },
            take: 2
          },
          variants: {
            select: { id: true, size: true, price: true, imageUrl: true },
            take: 1
          }
        },
        orderBy: { nameAr: 'asc' }
      })
    ]);
    order = dbOrder;
    availableProducts = dbProducts || [];
  } catch (err) {
    console.warn('AdminOrderDetailPage DB query failed, checking demo orders catalog');
  }

  // Fallback to demo orders if not in DB
  if (!order) {
    const demo = getDemoOrderById(id);
    if (demo) {
      order = demo;
    }
  }

  // Fallback for available products to add
  if (availableProducts.length === 0) {
    availableProducts = COSMETICS_CATALOG.map(p => ({
      id: p.id,
      nameAr: p.nameAr,
      name: p.nameEn,
      imageUrl: p.variants?.[0]?.imageUrl || p.images?.find(i => i.isMain)?.url || p.images?.[0]?.url || null,
      variants: p.variants.map(v => ({ id: v.id, size: v.size || v.shade, price: v.price, imageUrl: v.imageUrl }))
    }));
  } else {
    availableProducts = availableProducts.map(p => ({
      ...p,
      imageUrl: p.variants?.[0]?.imageUrl || p.images?.find((i: any) => i.isMain)?.url || p.images?.[0]?.url || null
    }));
  }

  if (!order) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-zinc-50" dir="rtl">
        <AdminSidebar
          employeeName={session.employee.name}
          roleName={session?.employee?.role?.name || 'ADMIN'}
        />
        <main className="flex-1 p-6 md:p-8 flex items-center justify-center">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm text-center space-y-4">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-zinc-900">الطلبية غير متوفرة حالياً</h2>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed">
              لم نتمكن من العثور على الطلبية برقم المعرف (<code className="font-mono font-bold text-zinc-800">{id}</code>). ربما تم نقلها أو قد تكون مسودة غير محفوظة بعد.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/admin/orders"
                className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-black text-white text-xs font-black rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
              >
                <ArrowRight className="w-4 h-4" />
                <span>العودة إلى جدول كافة الطلبات</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  async function handleUpdateStatusQuick(orderId: string, newStatus: string, shippingCost?: number) {
    'use server';
    const cost = shippingCost !== undefined ? shippingCost : order!.shippingCost;
    const res = await updateOrderStatus(orderId, newStatus, cost);
    if (!res.success) {
      console.error("Error updating status:", res.error);
      return res;
    }
    return { success: true };
  }

  const orderSubtotal = order.totalAmount - order.shippingCost;
  
  // An order is locked for editing ONLY when completed (DELIVERED) or CANCELLED!
  // Before becoming completed, admin can freely add/remove items.
  const isLocked = order.status === 'CANCELLED' || order.status === 'DELIVERED' || order.status === 'COMPLETED';

  // Helper to resolve the best image and attributes for each item to facilitate warehouse packaging & fulfillment
  const enrichedItems = (order.items || []).map((item: any) => {
    let resolvedImage: string | null = item.imageUrl || item.image || null;

    if (!resolvedImage && item.product?.images && item.product.images.length > 0) {
      const main = item.product.images.find((img: any) => img.isMain);
      resolvedImage = main?.url || item.product.images[0]?.url || null;
    }

    if (!resolvedImage && item.product?.variants && item.product.variants.length > 0) {
      const matchingVariant = item.product.variants.find((v: any) => v.id === item.variantId || v.sku === item.sku);
      resolvedImage = matchingVariant?.imageUrl || item.product.variants[0]?.imageUrl || null;
    }

    // Fallback to cosmetics catalog by product id, sku, or name
    if (!resolvedImage) {
      const catalogItem = COSMETICS_CATALOG.find(p => 
        p.id === item.productId || 
        p.sku === item.sku || 
        p.nameAr === item.name || 
        p.nameEn === item.name ||
        p.variants?.some(v => v.id === item.variantId || v.sku === item.sku)
      );
      if (catalogItem) {
        const matchingVar = catalogItem.variants?.find(v => v.id === item.variantId || v.sku === item.sku);
        resolvedImage = matchingVar?.imageUrl || catalogItem.images?.find(i => i.isMain)?.url || catalogItem.images?.[0]?.url || null;
      }
    }

    return {
      ...item,
      imageUrl: resolvedImage
    };
  });

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'AWAITING_WHATSAPP':
      case 'PENDING':
      case 'NEW':
        return { label: 'الطلبات الجديدة', badge: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'CONFIRMED':
      case 'PREPARING':
      case 'CONFIRMED_PREPARING':
        return { label: 'مؤكد وقيد التجهيز', badge: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'PREPARED':
      case 'READY_FOR_DELIVERY':
        return { label: 'تم التجهيز بانتظار التوصيل', badge: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY':
        return { label: 'مع التوصيل', badge: 'bg-orange-100 text-orange-800 border-orange-200' };
      case 'DELIVERED':
      case 'COMPLETED':
        return { label: 'مكتمل', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'CANCELLED':
        return { label: 'ملغي', badge: 'bg-rose-100 text-rose-800 border-rose-200' };
      default:
        return { label: status, badge: 'bg-zinc-100 text-zinc-800 border-zinc-200' };
    }
  };

  const statusInfo = getStatusInfo(order.status);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[var(--color-ivory-100)] overflow-hidden" dir="rtl">
      <AdminSidebar employeeName={session.employee.name} roleName={session?.employee?.role?.name || "ADMIN"} />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 font-sans w-full max-w-7xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/orders"
              className="p-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 transition shadow-xs cursor-pointer"
              title="العودة لقائمة الطلبات"
            >
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-500">تفاصيل الطلب:</span>
                <span className="font-mono font-black text-lg text-[#E6007E]">{order.reference}</span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                تاريخ تسجيل الطلب: <span dir="ltr" className="font-mono">{new Date(order.createdAt).toLocaleString('ar-JO-u-nu-latn')}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/ar/invoice/${order.id}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold transition shadow-xs"
              title="عرض رابط الفاتورة الرسمية"
            >
              <Printer className="w-3.5 h-3.5 text-pink-400" />
              <span>عرض رابط الفاتورة</span>
            </Link>
            <span className={`px-3.5 py-1.5 rounded-full text-xs font-black border ${statusInfo.badge}`}>
              حالة الطلب الحالية: {statusInfo.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column: Items & Customer Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer & Address Details */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs space-y-4">
              <h2 className="text-sm font-black text-zinc-900 pb-2 border-b border-zinc-100 flex items-center gap-2">
                <User className="w-4 h-4 text-[#E6007E]" />
                <span>بيانات الزبونة والتوصيل</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-700 font-bold">
                <div>
                  <span className="text-zinc-400 block mb-0.5">الاسم الكامل:</span>
                  <span className="text-sm text-zinc-900">{order.customerName}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block mb-0.5">رقم الهاتف:</span>
                  <span className="text-sm text-zinc-900 font-mono" dir="ltr">{order.customerPhone}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-zinc-400 block mb-0.5">العنوان التفصيلي:</span>
                  <span className="text-sm text-zinc-800">
                    {[order.addressStreet, order.addressBuilding, order.addressApartment].filter(Boolean).join('، ') || 'عين الباشا'}
                  </span>
                </div>
                {order.notes && (
                  <div className="md:col-span-2 bg-pink-50/50 p-3 rounded-xl border border-pink-100">
                    <span className="text-[#E6007E] block text-[11px] mb-0.5 font-bold">ملاحظات الزبونة:</span>
                    <span className="text-xs text-zinc-700 font-medium">{order.notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Editable Items Section (Add / Remove products before order is completed) */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs space-y-4">
              <AdminOrderItemsEditor 
                orderId={order.id} 
                items={enrichedItems} 
                shippingCost={order.shippingCost}
                availableProducts={availableProducts}
                isLocked={isLocked}
              />

              {/* Financial Totals */}
              <div className="border-t border-zinc-200 pt-4 space-y-2 text-xs font-bold text-zinc-600">
                <div className="flex justify-between">
                  <span>المجموع الفرعي للأصناف:</span>
                  <span className="font-mono text-zinc-900" dir="ltr">{filsToDisplay(orderSubtotal, 'ar')}</span>
                </div>
                <div className="flex justify-between">
                  <span>رسوم التوصيل المعتمدة:</span>
                  <span className="font-mono text-zinc-900" dir="ltr">{filsToDisplay(order.shippingCost, 'ar')}</span>
                </div>
                <div className="flex justify-between text-base font-black text-zinc-900 pt-3 border-t border-zinc-200">
                  <span>إجمالي الفاتورة المطلوب سداده:</span>
                  <span className="text-[#E6007E] font-mono text-lg" dir="ltr">{filsToDisplay(order.totalAmount, 'ar')}</span>
                </div>
              </div>
            </div>

            {/* Status History & Modification Notes (Showing modifications & reasons) */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs space-y-4">
              <h2 className="text-sm font-black text-zinc-900 pb-2 border-b border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#E6007E]" />
                  <span>سجل الحالات وتعديلات الفاتورة الرسمية</span>
                </div>
                <span className="text-[11px] font-bold text-zinc-400">
                  {order.statusHistory?.length || 0} أحداث مسجلة
                </span>
              </h2>

              <div className="space-y-3">
                {order.statusHistory?.map((hist: any) => {
                  const isModification = hist.notes?.includes('[تعديل فاتورة');

                  return (
                    <div 
                      key={hist.id} 
                      className={`p-3 rounded-2xl border text-xs space-y-1.5 transition ${
                        isModification 
                          ? 'bg-amber-50/60 border-amber-200 shadow-2xs' 
                          : 'bg-zinc-50 border-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {isModification ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-200/70 text-amber-900 font-black text-[10px] flex items-center gap-1">
                              <FileEdit className="w-3 h-3" />
                              تعديل فاتورة
                            </span>
                          ) : (
                            <span className="font-black text-zinc-800">
                              {getStatusInfo(hist.status).label}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono" dir="ltr">
                          {new Date(hist.createdAt).toLocaleString('ar-JO-u-nu-latn')}
                        </span>
                      </div>

                      {hist.notes && (
                        <p className={`text-xs leading-relaxed ${isModification ? 'text-zinc-900 font-bold' : 'text-zinc-600'}`}>
                          {hist.notes}
                        </p>
                      )}
                    </div>
                  );
                })}

                {(!order.statusHistory || order.statusHistory.length === 0) && (
                  <p className="text-xs text-zinc-400 text-center py-4">لا توجد ملاحظات سابقة على هذا الطلب.</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Actions Column */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs sticky top-6 space-y-4">
              <h3 className="text-sm font-black text-zinc-900 pb-2 border-b border-zinc-100 flex items-center justify-between">
                <span>إجراءات وحالة الطلب</span>
                <span className="text-[11px] font-bold text-zinc-400">تحديث فوري</span>
              </h3>

              <AdminOrderQuickActions 
                orderId={order.id} 
                status={order.status} 
                phone={order.customerPhone} 
                reference={order.reference} 
                confirmAction={confirmStorefrontOrder}
                cancelAction={cancelStorefrontOrder}
                updateStatusAction={handleUpdateStatusQuick} 
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
