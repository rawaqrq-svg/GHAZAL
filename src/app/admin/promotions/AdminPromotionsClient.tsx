'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Tag, Plus, Search, Calendar, Percent, CheckCircle2, Edit3, X, RefreshCw,
  ShoppingBag, Monitor, Globe, ArrowRight, Sparkles, Filter, Trash2
} from 'lucide-react';
import { createOrUpdatePromotion, deletePromotion, PromotionCouponRecord } from '@/actions/admin-pos';

interface ProductOption {
  id: string;
  nameAr: string;
  price: number; // in fils
}

interface Props {
  initialPromotions: PromotionCouponRecord[];
  products?: ProductOption[];
}

export default function AdminPromotionsClient({ initialPromotions, products = [] }: Props) {
  const [promotions, setPromotions] = useState<PromotionCouponRecord[]>(initialPromotions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromotionCouponRecord | null>(null);
  const [search, setSearch] = useState('');
  const [filterChannel, setFilterChannel] = useState<'ALL' | 'STOREFRONT' | 'POS' | 'BOTH'>('ALL');

  // Form State
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [targetProductId, setTargetProductId] = useState<string>('');
  const [channel, setChannel] = useState<'BOTH' | 'STOREFRONT' | 'POS'>('BOTH');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('10');
  const [maxDiscountStr, setMaxDiscountStr] = useState('5.000');
  const [minOrderStr, setMinOrderStr] = useState('15.000');
  const [startsAtDate, setStartsAtDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endsAtDate, setEndsAtDate] = useState(() => new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]);
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  const handleDeletePromo = async (promoId: string, promoTitle: string) => {
    const confirmed = window.confirm(`هل أنتِ متأكدة من حذف هذا العرض (${promoTitle}) بشكل نهائي؟`);
    if (!confirmed) return;

    setIsDeletingId(promoId);
    try {
      const res = await deletePromotion(promoId);
      if (res.success) {
        setPromotions(prev => prev.filter(p => p.id !== promoId));
      } else {
        alert(res.error || 'فشل حذف العرض');
      }
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء حذف العرض');
    } finally {
      setIsDeletingId(null);
    }
  };

  // Selected product object
  const selectedProduct = products.find(p => p.id === targetProductId);

  // Auto-calculated percentage when Fixed Discount is entered for a specific product
  const getCalculatedPercentage = (): number | null => {
    if (discountType !== 'FIXED' || !selectedProduct || selectedProduct.price <= 0) return null;
    const fixedValJOD = parseFloat(discountValue) || 0;
    const prodPriceJOD = selectedProduct.price / 1000;
    if (prodPriceJOD <= 0) return null;
    const pct = (fixedValJOD / prodPriceJOD) * 100;
    return Math.min(100, Math.max(0, Math.round(pct * 10) / 10));
  };

  const handleOpenModal = (promo?: PromotionCouponRecord) => {
    if (promo) {
      setEditingPromo(promo);
      setCode(promo.code);
      setTitle(promo.title);
      setTargetProductId(promo.targetProductId || '');
      setChannel(promo.channel || 'BOTH');
      setDiscountType(promo.discountType);
      setDiscountValue(
        promo.discountType === 'PERCENTAGE'
          ? promo.discountValue.toString()
          : (promo.discountValue / 1000).toFixed(3)
      );
      setMaxDiscountStr(promo.maxDiscountFils ? ((promo.maxDiscountFils / 1000).toFixed(3)) : '');
      setMinOrderStr(promo.minOrderTotalFils ? ((promo.minOrderTotalFils / 1000).toFixed(3)) : '');
      setStartsAtDate(promo.startsAt ? promo.startsAt.split('T')[0] : new Date().toISOString().split('T')[0]);
      setEndsAtDate(promo.endsAt ? promo.endsAt.split('T')[0] : new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]);
      setIsActive(promo.isActive);
    } else {
      setEditingPromo(null);
      setCode('');
      setTitle('');
      setTargetProductId('');
      setChannel('BOTH');
      setDiscountType('PERCENTAGE');
      setDiscountValue('10');
      setMaxDiscountStr('5.000');
      setMinOrderStr('15.000');
      setStartsAtDate(new Date().toISOString().split('T')[0]);
      setEndsAtDate(new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]);
      setIsActive(true);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(discountValue);
    if (isNaN(val) || val <= 0) {
      alert('يرجى إدخال قيمة خصم صحيحة أكبر من الصفر');
      return;
    }

    const cleanCode = code.trim() ? code.trim().toUpperCase() : `OFFER-${Date.now().toString(36).slice(-4).toUpperCase()}`;

    setIsLoading(true);
    try {
      const maxFils = maxDiscountStr ? Math.round(parseFloat(maxDiscountStr) * 1000) : undefined;
      const minFils = minOrderStr ? Math.round(parseFloat(minOrderStr) * 1000) : undefined;
      const calcPct = getCalculatedPercentage() || undefined;

      const res = await createOrUpdatePromotion({
        id: editingPromo?.id,
        code: cleanCode,
        title: title.trim() || `عرض ${discountType === 'PERCENTAGE' ? `${val}%` : `${val} د.أ`}${selectedProduct ? ` على ${selectedProduct.nameAr}` : ' الترويجي'}`,
        targetProductId: targetProductId || undefined,
        targetProductName: selectedProduct?.nameAr,
        channel,
        discountType,
        discountValue: discountType === 'PERCENTAGE' ? val : Math.round(val * 1000),
        calculatedPercentage: calcPct,
        maxDiscountFils: maxFils,
        minOrderTotalFils: minFils,
        startsAt: new Date(startsAtDate).toISOString(),
        endsAt: new Date(endsAtDate + 'T23:59:59').toISOString(),
        isActive
      });

      if (res.success && res.promotion) {
        if (editingPromo) {
          setPromotions(prev => prev.map(p => p.id === res.promotion.id ? res.promotion : p));
        } else {
          setPromotions(prev => [res.promotion, ...prev]);
        }
        setIsModalOpen(false);
      } else {
        alert(res.error || 'فشل حفظ العرض الترويجي');
      }
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء حفظ العرض');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPromotions = promotions.filter(p => {
    const matchesSearch = p.code.toLowerCase().includes(search.toLowerCase()) || 
                          p.title.toLowerCase().includes(search.toLowerCase()) ||
                          (p.targetProductName && p.targetProductName.toLowerCase().includes(search.toLowerCase()));
    const matchesChannel = filterChannel === 'ALL' || p.channel === filterChannel;
    return matchesSearch && matchesChannel;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 font-sans text-zinc-900 max-w-7xl mx-auto" dir="rtl">
      {/* Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-200">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 transition shadow-xs"
            title="العودة للوحة الإدارة"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-pink-100 text-[#E6007E]">
                <Tag className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-black font-heading text-zinc-900">
                إدارة العروض والخصومات المتقدمة
              </h1>
            </div>
            <p className="text-xs text-zinc-500">
              تحديد خصومات للمنتجات، قنوات البيع (المتجر أو الكاشير)، الفترات الزمنية، واحتساب النسب المئوية تلقائياً.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#E6007E] hover:bg-pink-600 text-white rounded-xl text-sm font-bold shadow-md transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة عرض جديد</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute right-3 top-3" />
          <input
            type="text"
            placeholder="بحث بالكود، عنوان العرض، أو اسم الصنف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm outline-none focus:border-[#E6007E]"
          />
        </div>

        {/* Channel Filter */}
        <div className="flex items-center gap-1 bg-white border border-zinc-200 p-1 rounded-xl shrink-0 text-xs font-bold">
          <span className="px-2 text-zinc-400">القناة:</span>
          {(['ALL', 'STOREFRONT', 'POS', 'BOTH'] as const).map((ch) => (
            <button
              key={ch}
              onClick={() => setFilterChannel(ch)}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterChannel === ch 
                  ? 'bg-zinc-900 text-white shadow-xs' 
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              {ch === 'ALL' ? 'الكل' : ch === 'STOREFRONT' ? 'المتجر الإلكتروني' : ch === 'POS' ? 'كاشير المحل' : 'كلاهما'}
            </button>
          ))}
        </div>
      </div>

      {/* Promotions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPromotions.map((promo) => {
          const isExpired = new Date(promo.endsAt) < new Date();
          return (
            <div 
              key={promo.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition hover:shadow-md ${
                !promo.isActive || isExpired ? 'border-zinc-200 opacity-60' : 'border-pink-200 hover:border-[#E6007E]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-black px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg">
                        ✓ عرض مباشر بدون كود
                      </span>
                      <span className="font-mono text-xs text-zinc-500 font-bold">
                        {promo.code}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-zinc-900 mt-1.5 line-clamp-1">{promo.title}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                    promo.isActive && !isExpired ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    {isExpired ? 'منتهي الصلاحية' : promo.isActive ? 'فعال' : 'معطل'}
                  </span>
                </div>

                {/* Target Product Badge */}
                {promo.targetProductName && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs px-2.5 py-1.5 rounded-xl font-bold mb-3 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">صنف مخصص: {promo.targetProductName}</span>
                  </div>
                )}

                {/* Details Breakdown */}
                <div className="space-y-1.5 text-xs text-zinc-600 border-t border-zinc-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">قيمة الخصم:</span>
                    <span className="font-black text-zinc-900 font-mono">
                      {promo.discountType === 'PERCENTAGE' 
                        ? `${promo.discountValue}% خصم`
                        : `${(promo.discountValue / 1000).toFixed(3)} د.أ`
                      }
                      {promo.calculatedPercentage && (
                        <span className="text-[10px] text-pink-600 mr-1">
                          (يعادل {promo.calculatedPercentage}%)
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-zinc-400">قناة البيع:</span>
                    <span className="font-bold text-zinc-800 flex items-center gap-1">
                      {promo.channel === 'STOREFRONT' ? (
                        <>
                          <Globe className="w-3 h-3 text-blue-600" />
                          <span>المتجر الإلكتروني فقط</span>
                        </>
                      ) : promo.channel === 'POS' ? (
                        <>
                          <Monitor className="w-3 h-3 text-emerald-600" />
                          <span>كاشير المحل فقط</span>
                        </>
                      ) : (
                        <span>كلا القناتين (متجر + كاشير)</span>
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-zinc-400">فترة العرض:</span>
                    <span className="font-mono text-[11px] text-zinc-700" dir="ltr">
                      {promo.startsAt.split('T')[0]} ➜ {promo.endsAt.split('T')[0]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="border-t border-zinc-100 pt-3 mt-4 flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 font-mono">استخدم: {promo.usageCount} مرة</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeletePromo(promo.id, promo.title)}
                    disabled={isDeletingId === promo.id}
                    className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded-lg transition"
                    title="حذف العرض نهائياً"
                  >
                    {isDeletingId === promo.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>حذف</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenModal(promo)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#E6007E] hover:text-pink-700 hover:bg-pink-50 px-2 py-1 rounded-lg transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>تعديل</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPromotions.length === 0 && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center text-zinc-500">
          <Tag className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <p className="font-bold text-base text-zinc-800">لا توجد عروض أو خصومات مطابقة</p>
          <p className="text-xs text-zinc-400 mt-1">اضغط على زر &quot;إضافة عرض جديد&quot; للبدء.</p>
        </div>
      )}

      {/* CREATE / EDIT PROMOTION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-zinc-200 animate-fade-in my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#E6007E]" />
                <h3 className="font-black text-lg text-zinc-900">
                  {editingPromo ? 'تعديل بيانات العرض' : 'إضافة عرض ترويجي جديد'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-zinc-100 rounded-lg text-zinc-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-4 text-xs font-bold text-zinc-700">
              {/* Direct Offer Notice (بدون كود خصم) */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center gap-2.5 text-xs text-emerald-900">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-black flex items-center justify-center shrink-0">
                  ⚡
                </span>
                <div>
                  <h4 className="font-black text-emerald-950">عرض مباشر وتلقائي (بدون كود خصم)</h4>
                  <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                    يُطبق العرض تلقائياً على السعر المعروض للزبونة دون إلزامها بكتابة أي كود أو رمز خصم.
                  </p>
                </div>
              </div>

              {/* Title & Optional Internal Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-zinc-900 font-black">عنوان العرض الترويجي *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: خصم 20% على أحمر الشفاه"
                    className="w-full border border-zinc-300 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-[#E6007E]"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-zinc-600">رمز العرض الترويجي الداخلي (تلقائي اختياري)</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="تلقائي بالنظام (اتركه فارغاً للعرض المباشر)"
                    className="w-full border border-zinc-300 bg-zinc-50 rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase outline-none focus:border-[#E6007E]"
                  />
                  <span className="text-[10px] text-zinc-400 block mt-0.5">يُنشأ رمز داخلي تلقائياً عند تركه فارغاً</span>
                </div>
              </div>

              {/* Target Product with Search Box (مربع بحث لتحديد المنتج للخصم) */}
              <div>
                <label className="block mb-1 text-zinc-800 font-bold">
                  تحديد منتج معين للخصم (اختياري — اتركه للكل إذا كان عرضاً عاماً):
                </label>
                
                {/* Search Box to pick product */}
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-zinc-400 absolute start-3 top-3" />
                  <input
                    type="text"
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    placeholder="ابحث بالاسم لاختيار المنتج ووضع خصم عليه..."
                    className="w-full ps-9 pe-8 py-2 text-xs border border-zinc-300 rounded-xl outline-none focus:border-[#E6007E] bg-white font-bold"
                  />
                  {productSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setProductSearchQuery('')}
                      className="absolute end-3 top-2.5 text-zinc-400 hover:text-zinc-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filtered Products Dropdown List when searching */}
                {productSearchQuery && (
                  <div className="max-h-48 overflow-y-auto border border-zinc-200 rounded-xl bg-white shadow-lg mb-2 divide-y divide-zinc-100">
                    <button
                      type="button"
                      onClick={() => {
                        setTargetProductId('');
                        setProductSearchQuery('');
                      }}
                      className="w-full text-start p-2.5 hover:bg-zinc-50 text-xs font-bold text-zinc-600 flex justify-between"
                    >
                      <span>-- عام على كافة منتجات السلة --</span>
                      <span className="text-[10px] text-zinc-400">بدون تخصيص صنف</span>
                    </button>
                    {products
                      .filter(p => p.nameAr.toLowerCase().includes(productSearchQuery.toLowerCase()) || ((p as any).brandName && (p as any).brandName.toLowerCase().includes(productSearchQuery.toLowerCase())))
                      .slice(0, 15)
                      .map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setTargetProductId(p.id);
                            setProductSearchQuery('');
                            if (!title) {
                              setTitle(`خصم خاص على ${p.nameAr}`);
                            }
                            if (!code) {
                              setCode(`OFF-${p.id.slice(0, 6).toUpperCase()}`);
                            }
                          }}
                          className={`w-full text-start p-2.5 hover:bg-pink-50/70 text-xs flex items-center justify-between transition ${
                            targetProductId === p.id ? 'bg-pink-50 text-[#E6007E] font-black' : 'text-zinc-800 font-bold'
                          }`}
                        >
                          <div>
                            <span className="block">{p.nameAr}</span>
                            <span className="text-[10px] text-zinc-400 font-normal">{(p as any).brandName || 'غزل'}</span>
                          </div>
                          <span className="font-mono text-xs text-zinc-700 font-black">
                            {(p.price / 1000).toFixed(3)} د.أ
                          </span>
                        </button>
                      ))}
                  </div>
                )}

                {/* Selected Product Card Banner */}
                {selectedProduct ? (
                  <div className="p-3 bg-pink-50/80 rounded-xl border border-pink-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-pink-700 font-bold block">المنتج المحدد للخصم:</span>
                      <span className="font-black text-zinc-900">{selectedProduct.nameAr}</span>
                      <span className="text-[11px] text-zinc-500 font-mono ms-2">
                        السعر الأساسي: {(selectedProduct.price / 1000).toFixed(3)} د.أ
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTargetProductId('')}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1 rounded-lg bg-white border border-rose-200"
                    >
                      إلغاء التحديد
                    </button>
                  </div>
                ) : (
                  <div className="text-[11px] text-zinc-500 bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
                    العرض حالياً سارٍ على سلة المشتريات بالكامل. يمكنك كتابة اسم الصنف في مربع البحث أعلاه لتخصيص الخصم عليه حصراً.
                  </div>
                )}
              </div>

              {/* Target Channel */}
              <div className="bg-pink-50/60 p-3.5 rounded-2xl border border-pink-200 space-y-2">
                <label className="block text-zinc-900 font-black">
                  قناة البيع المعتمدة للعرض: *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'BOTH', label: 'كلاهما (متجر + كاشير)' },
                    { id: 'STOREFRONT', label: 'المتجر الإلكتروني فقط' },
                    { id: 'POS', label: 'كاشير المحل فقط' }
                  ].map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setChannel(ch.id as any)}
                      className={`py-2 px-2 rounded-xl text-center font-bold text-xs border transition ${
                        channel === ch.id
                          ? 'bg-[#E6007E] text-white border-[#E6007E] shadow-sm'
                          : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                      }`}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Discount Type and Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">نوع الخصم: *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDiscountType('PERCENTAGE')}
                      className={`py-2 px-3 rounded-xl font-bold border transition ${
                        discountType === 'PERCENTAGE'
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : 'bg-white text-zinc-700 border-zinc-200'
                      }`}
                    >
                      نسبة مئوية (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('FIXED')}
                      className={`py-2 px-3 rounded-xl font-bold border transition ${
                        discountType === 'FIXED'
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : 'bg-white text-zinc-700 border-zinc-200'
                      }`}
                    >
                      خصم ثابت (د.أ)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block mb-1">
                    {discountType === 'PERCENTAGE' ? 'نسبة الخصم المئوية (%)' : 'قيمة الخصم بالدينار (د.أ)'} *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full border border-zinc-300 rounded-xl px-3 py-2 text-sm font-mono font-bold outline-none focus:border-[#E6007E]"
                  />
                  {/* Automatic Percentage Calculation preview for fixed discount on product */}
                  {discountType === 'FIXED' && selectedProduct && (
                    <div className="mt-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                      ✓ النسبة المحسوبة تلقائياً: {getCalculatedPercentage()}% من سعر المنتج
                    </div>
                  )}
                </div>
              </div>

              {/* Date Range: startsAt & endsAt */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">تاريخ بداية العرض: *</label>
                  <input
                    type="date"
                    required
                    value={startsAtDate}
                    onChange={(e) => setStartsAtDate(e.target.value)}
                    className="w-full border border-zinc-300 rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none focus:border-[#E6007E]"
                  />
                </div>
                <div>
                  <label className="block mb-1">تاريخ انتهاء العرض: *</label>
                  <input
                    type="date"
                    required
                    value={endsAtDate}
                    onChange={(e) => setEndsAtDate(e.target.value)}
                    className="w-full border border-zinc-300 rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none focus:border-[#E6007E]"
                  />
                </div>
              </div>

              {/* Status Switch */}
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-[#E6007E] rounded border-zinc-300 focus:ring-[#E6007E]"
                  />
                  <span className="font-bold text-zinc-900">تفعيل هذا العرض فوراً للعملاء</span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-zinc-200">
                {editingPromo && (
                  <button
                    type="button"
                    onClick={() => {
                      if (editingPromo) {
                        handleDeletePromo(editingPromo.id, editingPromo.title);
                        setIsModalOpen(false);
                      }
                    }}
                    className="py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl transition flex items-center gap-1.5 text-xs border border-rose-200 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف العرض</span>
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 bg-[#E6007E] hover:bg-pink-600 text-white font-extrabold rounded-xl transition shadow-md flex items-center justify-center gap-2"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{editingPromo ? 'تحديث العرض' : 'حفظ ونشر العرض'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-3 px-5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
