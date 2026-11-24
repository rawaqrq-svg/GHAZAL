'use client';

import React, { useState } from 'react';
import { 
  Gift, Plus, Search, Tag, CheckCircle2, Edit3, X, RefreshCw, ShoppingBag 
} from 'lucide-react';
import { createOrUpdateBundle, ProductBundleRecord } from '@/actions/admin-pos';

interface Props {
  initialBundles: ProductBundleRecord[];
}

export default function AdminBundlesClient({ initialBundles }: Props) {
  const [bundles, setBundles] = useState<ProductBundleRecord[]>(initialBundles);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<ProductBundleRecord | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [originalPriceStr, setOriginalPriceStr] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [itemSku, setItemSku] = useState('');
  const [itemName, setItemName] = useState('');
  const [items, setItems] = useState<{ sku: string; productName: string; quantity: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenModal = (bundle?: ProductBundleRecord) => {
    if (bundle) {
      setEditingBundle(bundle);
      setName(bundle.name);
      setDescription(bundle.description);
      setPriceStr(((bundle.priceFils || 0) / 1000).toFixed(3));
      setOriginalPriceStr(((bundle.originalPriceFils || 0) / 1000).toFixed(3));
      setIsActive(bundle.isActive);
      setItems(bundle.items || []);
    } else {
      setEditingBundle(null);
      setName('');
      setDescription('');
      setPriceStr('15.000');
      setOriginalPriceStr('20.000');
      setIsActive(true);
      setItems([
        { sku: 'LIP-01', productName: 'أحمر شفاه كلاسيكي', quantity: 1 },
        { sku: 'MASC-01', productName: 'ماسكارا لتكثيف الرموش', quantity: 1 }
      ]);
    }
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    if (!itemSku.trim() || !itemName.trim()) return;
    setItems(prev => [...prev, { sku: itemSku.trim(), productName: itemName.trim(), quantity: 1 }]);
    setItemSku('');
    setItemName('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(priceStr);
    const origPrice = parseFloat(originalPriceStr) || price;
    if (!price || price <= 0) {
      alert('يرجى إدخال سعر صحيح للبكج');
      return;
    }
    if (!name.trim()) {
      alert('يرجى إدخال اسم البكج');
      return;
    }

    setIsLoading(true);
    try {
      const res = await createOrUpdateBundle({
        id: editingBundle?.id,
        name: name.trim(),
        description: description.trim(),
        priceFils: Math.round(price * 1000),
        originalPriceFils: Math.round(origPrice * 1000),
        isActive,
        items
      });

      if (res.success && res.bundle) {
        if (editingBundle) {
          setBundles(prev => prev.map(b => b.id === res.bundle.id ? res.bundle : b));
        } else {
          setBundles(prev => [res.bundle, ...prev]);
        }
        setIsModalOpen(false);
      } else {
        alert(res.error || 'فشل حفظ البكج');
      }
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 font-sans text-zinc-900" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-pink-100 text-[#E6007E]">
              <Gift className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-zinc-900 font-heading">
              البكجات والباقات التجميلية (Product Bundles)
            </h1>
          </div>
          <p className="text-xs text-zinc-500">
            تجميع منتجات متعددة في باقة واحدة بسعر موحد جذاب للكاشير والمتجر
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 bg-[#E6007E] hover:bg-[#c4006b] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>+ إضافة بكج جديد</span>
        </button>
      </div>

      {/* Bundles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bundles.map((bundle) => {
          const savingsFils = Math.max(0, bundle.originalPriceFils - bundle.priceFils);
          return (
            <div key={bundle.id} className="bg-white rounded-3xl border border-zinc-200 shadow-xs p-5 flex flex-col justify-between hover:border-pink-300 transition">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    bundle.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    {bundle.isActive ? 'نشط في الكاشير والمتجر' : 'معطل مؤقتاً'}
                  </span>
                  {savingsFils > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-pink-50 text-[#E6007E] text-[10px] font-bold">
                      توفير {(savingsFils / 1000).toFixed(3)} د.أ
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-base text-zinc-900 mb-1">{bundle.name}</h3>
                <p className="text-xs text-zinc-500 mb-4 line-clamp-2">{bundle.description}</p>

                {/* Bundle Items */}
                <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 mb-4 space-y-1.5 text-xs">
                  <p className="font-bold text-zinc-700 text-[11px] mb-1">المحتويات والمكونات:</p>
                  {(bundle.items || []).map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center text-zinc-600">
                      <span>• {it.productName}</span>
                      <span className="font-mono text-[11px] font-bold text-zinc-500">× {it.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing & Actions */}
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                <div>
                  <span className="text-xl font-black text-[#E6007E]" dir="ltr">
                    {(bundle.priceFils / 1000).toFixed(3)} د.أ
                  </span>
                  {bundle.originalPriceFils > bundle.priceFils && (
                    <span className="text-xs text-zinc-400 line-through ms-2" dir="ltr">
                      {(bundle.originalPriceFils / 1000).toFixed(3)}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleOpenModal(bundle)}
                  className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl"
                  title="تعديل البكج"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-zinc-200">
            <div className="p-4 bg-zinc-900 text-white flex items-center justify-between">
              <span className="font-extrabold text-sm">
                {editingBundle ? 'تعديل بيانات البكج' : 'إضافة بكج تجميلي جديد'}
              </span>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">اسم البكج:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: بكج النضارة اليومية..."
                  required
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-800 focus:outline-hidden focus:border-[#E6007E]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">الوصف التسويقي:</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف محتويات ومزايا البكج..."
                  className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-800 focus:outline-hidden focus:border-[#E6007E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">سعر البكج الموحد (د.أ):</label>
                  <input
                    type="number"
                    step="0.05"
                    value={priceStr}
                    onChange={(e) => setPriceStr(e.target.value)}
                    required
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-black text-zinc-900"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">السعر الأصلي قبل الخصم:</label>
                  <input
                    type="number"
                    step="0.05"
                    value={originalPriceStr}
                    onChange={(e) => setOriginalPriceStr(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-black text-zinc-500"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Items in Bundle */}
              <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-2">
                <span className="font-bold text-zinc-800 block">مكونات البكج:</span>
                <div className="space-y-1">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-xl border border-zinc-100">
                      <span>• {it.productName} ({it.sku})</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-red-500 font-bold hover:text-red-700"
                      >
                        حذف
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="اسم المنتج في البكج..."
                    className="flex-1 p-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={itemSku}
                    onChange={(e) => setItemSku(e.target.value)}
                    placeholder="SKU"
                    className="w-24 p-2 bg-white border border-zinc-200 rounded-xl text-xs font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3 bg-zinc-800 text-white rounded-xl font-bold"
                  >
                    + إضافة
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="bundleActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-[#E6007E]"
                />
                <label htmlFor="bundleActive" className="font-bold text-zinc-700 cursor-pointer">
                  البكج نشط ومتاح للبيع على الكاشير والمتجر
                </label>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 bg-[#E6007E] hover:bg-[#c4006b] disabled:opacity-50 text-white rounded-xl font-bold transition flex items-center justify-center gap-2"
                >
                  {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>حفظ البكج التجميلي</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-3 px-4 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-xl font-bold"
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
