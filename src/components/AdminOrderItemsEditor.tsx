'use client';

import React, { useState, useTransition } from 'react';
import { Plus, Trash2, RefreshCw, AlertCircle, ShoppingBag, AlertTriangle, FileEdit, Eye, Maximize2, X, Sparkles } from 'lucide-react';
import { addOrderItemToCustomerOrder, removeOrderItemFromCustomerOrder } from '@/actions/orders';
import { filsToDisplay } from '@/lib/money';

interface Props {
  orderId: string;
  items: any[];
  shippingCost: number;
  availableProducts?: any[];
  isLocked: boolean; // true if DELIVERED or CANCELLED
}

export function AdminOrderItemsEditor({ orderId, items, shippingCost, availableProducts = [], isLocked }: Props) {
  const [isPending, startTransition] = useTransition();

  // Add Item Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customPriceStr, setCustomPriceStr] = useState('');
  const [addReason, setAddReason] = useState('');

  // Delete Item Modal State
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; quantity: number; total: number } | null>(null);
  const [deleteReason, setDeleteReason] = useState('');

  // Image Lightbox Preview State
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const [error, setError] = useState<string | null>(null);

  const selectedProduct = availableProducts.find(p => p.id === selectedProductId);

  const handleOpenAddModal = () => {
    setSelectedProductId(availableProducts[0]?.id || '');
    setQuantity(1);
    const initialPrice = availableProducts[0]?.variants?.[0]?.price || 15000;
    setCustomPriceStr((initialPrice / 1000).toFixed(3));
    setAddReason('طلب الزبونة هاتفياً إضافة صنف للفاتورة');
    setError(null);
    setIsAddModalOpen(true);
  };

  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const p = availableProducts.find(x => x.id === prodId);
    if (p) {
      const priceFils = p.variants?.[0]?.price || 15000;
      setCustomPriceStr((priceFils / 1000).toFixed(3));
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const priceVal = parseFloat(customPriceStr);
    if (isNaN(priceVal) || priceVal <= 0) {
      setError('يرجى تحديد سعر صالح');
      return;
    }
    if (!addReason.trim()) {
      setError('يرجى كتابة سبب التعديل والإضافة لتسجيلها في سجل الطلب');
      return;
    }

    startTransition(async () => {
      setError(null);
      const res = await addOrderItemToCustomerOrder(orderId, {
        productId: selectedProduct.id,
        variantId: selectedProduct.variants?.[0]?.id,
        quantity: Math.max(1, quantity),
        unitPrice: Math.round(priceVal * 1000),
        productName: selectedProduct.nameAr || selectedProduct.name,
        variantLabel: selectedProduct.variants?.[0]?.size || 'قياسي',
        reason: addReason.trim()
      });

      if (res.success) {
        setIsAddModalOpen(false);
      } else {
        setError(res.error || 'فشل إضافة الصنف');
      }
    });
  };

  const handleOpenDeleteModal = (item: any) => {
    setItemToDelete({
      id: item.id,
      name: item.name || item.product?.nameAr || 'هذا المنتج',
      quantity: item.quantity || 1,
      total: item.total || item.totalPrice || ((item.unitPrice || 0) * (item.quantity || 1))
    });
    setDeleteReason('طلب الزبونة إلغاء هذا الصنف قبل التوصيل');
    setError(null);
  };

  const handleConfirmDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemToDelete) return;
    if (!deleteReason.trim()) {
      setError('يرجى كتابة سبب حذف الصنف لتسجيله رسمياً في سجل التعديلات');
      return;
    }

    startTransition(async () => {
      setError(null);
      const res = await removeOrderItemFromCustomerOrder(orderId, itemToDelete.id, deleteReason.trim());
      if (res.success) {
        setItemToDelete(null);
      } else {
        setError(res.error || 'فشل حذف الصنف');
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-zinc-200">
        <div>
          <h3 className="font-extrabold text-sm text-zinc-900 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#E6007E]" />
            <span>الأصناف والمنتجات بالفاتورة</span>
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            {isLocked
              ? 'تم قفل تعديل الفاتورة لأن الطلب أصبح مكتملاً أو ملغياً.'
              : 'يمكنك إضافة أو حذف منتجات من الفاتورة وتسجيل سبب التعديل قبل اكتمال الطلب.'}
          </p>
        </div>

        {!isLocked && (
          <button
            type="button"
            onClick={handleOpenAddModal}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E6007E] hover:bg-[#c4006b] text-white text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة منتج للفاتورة</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Items List with Clear Product Images for Order Preparation & Fulfillment */}
      <div className="divide-y divide-zinc-200">
        {items.map((item) => {
          const itemName = item.name || item.product?.nameAr || 'منتج غير مسمى';
          const itemSpec = item.size || item.variant?.size || item.shade || null;
          const itemTotal = ((item.total || item.totalPrice || ((item.unitPrice || 0) * (item.quantity || 1))) || 0);
          const itemImage = item.imageUrl || item.image || item.product?.images?.[0]?.url || item.variant?.imageUrl || null;

          return (
            <div 
              key={item.id} 
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-zinc-50/80 p-3 rounded-2xl transition border border-transparent hover:border-zinc-200"
            >
              {/* Product Visual Thumbnail & Info */}
              <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
                {/* Image Box with Click-to-Zoom */}
                <div 
                  onClick={() => itemImage && setPreviewImage({ url: itemImage, title: itemName })}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl overflow-hidden border border-zinc-200 bg-white shadow-2xs flex items-center justify-center ${
                    itemImage ? 'cursor-pointer hover:border-[#E6007E] transition' : ''
                  }`}
                  title={itemImage ? 'انقر لتكبير صورة الصنف والتأكد من التجهيز' : 'صورة الصنف غير متوفرة'}
                >
                  {itemImage ? (
                    <>
                      <img 
                        src={itemImage} 
                        alt={itemName} 
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-200" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Eye className="w-5 h-5 drop-shadow-md" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-300">
                      <ShoppingBag className="w-6 h-6 text-pink-300" />
                      <span className="text-[9px] font-black text-pink-400 mt-0.5">غزل</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-1.5 min-w-0 flex-1">
                  <h4 className="font-black text-sm sm:text-base text-zinc-900 leading-snug" title={itemName}>
                    {itemName}
                  </h4>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {itemSpec && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-zinc-100 text-zinc-800 font-bold border border-zinc-200 text-xs">
                        المواصفة: {itemSpec}
                      </span>
                    )}
                    {item.sku && (
                      <span className="font-mono text-[11px] text-zinc-500 bg-white px-2 py-0.5 rounded-lg border border-zinc-200" dir="ltr">
                        SKU: {item.sku}
                      </span>
                    )}
                  </div>

                  {/* High-Visibility Quantity for Warehouse Packaging */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-pink-100/80 text-[#E6007E] font-black text-xs sm:text-sm border border-pink-200 shadow-2xs">
                      الكمية للتجهيز: {item.quantity} قطعة
                    </span>
                    <span className="text-xs text-zinc-500 font-bold font-mono">
                      (سعر الحبة: {((item.unitPrice || 0) / 1000).toFixed(3)} د.أ)
                    </span>
                  </div>
                </div>
              </div>

              {/* Price & Delete Action */}
              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100">
                <div className="text-start sm:text-end">
                  <span className="text-[10px] font-bold text-zinc-400 block">إجمالي الصنف</span>
                  <span className="font-black text-[#E6007E] font-mono text-base sm:text-lg" dir="ltr">
                    {(itemTotal / 1000).toFixed(3)} د.أ
                  </span>
                </div>

                {!isLocked && (
                  <button
                    type="button"
                    onClick={() => handleOpenDeleteModal(item)}
                    disabled={isPending}
                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer border border-transparent hover:border-red-200"
                    title="حذف هذا الصنف من الطلب"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Item Modal with Reason */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 animate-fade-in my-8">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#E6007E]" />
                <h3 className="font-black text-base text-zinc-900">إضافة منتج جديد لفاتورة الطلب</h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="p-1 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4 pt-4 text-xs font-bold text-zinc-700">
              <div>
                <label className="block mb-1">اختر المنتج المراد إضافته: *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full border border-zinc-300 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#E6007E] bg-white cursor-pointer"
                >
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nameAr || p.name} — {( (p.variants?.[0]?.price || 15000) / 1000).toFixed(3)} د.أ
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct && (
                <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-2xl border border-zinc-200">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-zinc-200 bg-white shrink-0 flex items-center justify-center shadow-2xs">
                    {selectedProduct.imageUrl ? (
                      <img src={selectedProduct.imageUrl} alt={selectedProduct.nameAr || selectedProduct.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="w-5 h-5 text-pink-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-xs text-zinc-900 truncate">{selectedProduct.nameAr || selectedProduct.name}</p>
                    <p className="text-[11px] text-zinc-500 font-medium font-mono">
                      السعر المقترح: {((selectedProduct.variants?.[0]?.price || 15000) / 1000).toFixed(3)} د.أ
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">الكمية: *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full border border-zinc-300 rounded-xl px-3 py-2 text-sm font-bold font-mono outline-none focus:border-[#E6007E]"
                  />
                </div>

                <div>
                  <label className="block mb-1">سعر الوحدة (د.أ): *</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    required
                    value={customPriceStr}
                    onChange={(e) => setCustomPriceStr(e.target.value)}
                    className="w-full border border-zinc-300 rounded-xl px-3 py-2 text-sm font-bold font-mono outline-none focus:border-[#E6007E]"
                  />
                </div>
              </div>

              {/* Required Modification Reason */}
              <div className="space-y-1">
                <label className="block text-zinc-900 font-extrabold flex items-center gap-1">
                  <FileEdit className="w-3.5 h-3.5 text-[#E6007E]" />
                  <span>سبب التعديل والإضافة: * (إلزامي للتوثيق)</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={addReason}
                  onChange={(e) => setAddReason(e.target.value)}
                  placeholder="اكتب سبب تعديل الفاتورة وإضافة الصنف (مثال: طلب الزبونة هاتفياً إضافة درجة أحمر شفاه إضافية)"
                  className="w-full border border-zinc-300 rounded-xl p-2.5 text-xs font-medium outline-none focus:border-[#E6007E] bg-zinc-50 focus:bg-white resize-none"
                />
              </div>

              <div className="bg-pink-50 p-3 rounded-xl border border-pink-200 flex justify-between text-xs font-bold">
                <span className="text-zinc-700">المبلغ الإضافي على الفاتورة:</span>
                <span className="font-black text-[#E6007E] font-mono text-sm" dir="ltr">
                  +{((parseFloat(customPriceStr || '0') * quantity) || 0).toFixed(3)} د.أ
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-[#E6007E] hover:bg-[#c4006b] text-white font-extrabold rounded-xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>تأكيد الإضافة وتسجيل الملاحظة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Item Modal with Reason */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 animate-fade-in my-8">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-black text-base text-zinc-900">حذف منتج من الفاتورة</h3>
              </div>
              <button 
                onClick={() => setItemToDelete(null)} 
                className="p-1 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmDelete} className="space-y-4 pt-4 text-xs font-bold text-zinc-700">
              <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl text-xs space-y-1">
                <p className="font-black text-rose-900 text-sm">{itemToDelete.name}</p>
                <div className="flex justify-between text-rose-800 text-xs pt-1">
                  <span>الكمية المحذوفة: {itemToDelete.quantity}</span>
                  <span className="font-black font-mono" dir="ltr">
                    -{(itemToDelete.total / 1000).toFixed(3)} د.أ
                  </span>
                </div>
                <p className="text-[11px] text-rose-600 pt-1">
                  سيتم خصم هذا المبلغ من إجمالي الفاتورة وتحديث المجموع تلقائياً.
                </p>
              </div>

              {/* Required Deletion Reason */}
              <div className="space-y-1">
                <label className="block text-zinc-900 font-extrabold flex items-center gap-1">
                  <FileEdit className="w-3.5 h-3.5 text-rose-600" />
                  <span>سبب حذف الصنف والتعديل: * (إلزامي للتوثيق)</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="اكتب سبب حذف هذا الصنف من الفاتورة (مثال: الزبونة اتصلت وطلبت إلغاء هذا الصنف قبل التوصيل)"
                  className="w-full border border-zinc-300 rounded-xl p-2.5 text-xs font-medium outline-none focus:border-rose-600 bg-zinc-50 focus:bg-white resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>تأكيد الحذف وتسجيل الملاحظة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className="py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold cursor-pointer"
                >
                  تراجع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Image Preview Lightbox for Order Fulfillment Verification */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4" 
          dir="rtl"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-zinc-200 animate-fade-in flex flex-col items-center space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full pb-2 border-b border-zinc-100">
              <h4 className="font-black text-sm text-zinc-900 truncate max-w-xs">{previewImage.title}</h4>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="w-full max-h-[70vh] rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-200 flex items-center justify-center p-2">
              <img 
                src={previewImage.url} 
                alt={previewImage.title} 
                className="w-full h-auto max-h-[60vh] object-contain rounded-xl" 
              />
            </div>
            <div className="flex items-center justify-between w-full text-xs text-zinc-500 font-bold pt-1">
              <span>صورة الصنف المعتمدة لتجهيز وتغليف الطلب</span>
              <button 
                type="button"
                onClick={() => setPreviewImage(null)}
                className="text-[#E6007E] hover:underline"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
