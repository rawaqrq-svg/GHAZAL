'use client';

import React, { useState } from 'react';
import { createBrand, updateBrand, deleteBrand } from '@/actions/brands';
import { Plus, Edit2, Trash2, Loader2, Sparkles } from 'lucide-react';

interface Brand {
  id: string;
  name: string;
  nameAr: string | null;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  _count: { products: number };
}

export function BrandsClient({ initialBrands }: { initialBrands: Brand[] }) {
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const openCreateModal = () => {
    setEditingBrand(null);
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (brand: Brand) => {
    setEditingBrand(brand);
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setError('');

    const formData = new FormData(e.currentTarget);

    if (editingBrand) {
      const res = await updateBrand(editingBrand.id, formData);
      if (res.success) {
        setIsModalOpen(false);
        window.location.reload();
      } else {
        setError(res.error || 'حدث خطأ أثناء التحديث');
        setPending(false);
      }
    } else {
      const res = await createBrand(formData);
      if (res.success && res.brand) {
        setIsModalOpen(false);
        window.location.reload();
      } else {
        setError(res.error || 'حدث خطأ أثناء الإنشاء');
        setPending(false);
      }
    }
  };

  const handleDelete = async (brand: Brand) => {
    if (!confirm(`هل أنت متأكد من حذف الماركة "${brand.nameAr || brand.name}"؟`)) return;

    const res = await deleteBrand(brand.id);
    if (res.success) {
      setBrands(prev => prev.filter(b => b.id !== brand.id));
    } else {
      alert(res.error || 'فشل حذف الماركة');
    }
  };

  return (
    <div>
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">قائمة الماركات المسجلة ({brands.length})</h2>
          <p className="text-sm text-zinc-500">إدارة العلامات التجارية لمستحضرات التجميل والعناية</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-[#E6007E] hover:bg-[#c9006e] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          إضافة ماركة جديدة
        </button>
      </div>

      {/* Brands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {brands.map((brand) => (
          <div
            key={brand.id}
            className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center font-bold text-zinc-700 text-sm border border-zinc-200">
                    {brand.logoUrl ? (
                      <img src={brand.logoUrl} alt={brand.name} className="w-8 h-8 object-contain rounded-lg" />
                    ) : (
                      brand.name.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 text-base">{brand.nameAr || brand.name}</h3>
                    <p className="text-xs text-zinc-400 font-mono" dir="ltr">{brand.name}</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-pink-50 text-[#E6007E] rounded-full border border-pink-100">
                  {brand._count.products} منتج
                </span>
              </div>
              {brand.description && (
                <p className="text-xs text-zinc-600 line-clamp-2 mt-2 leading-relaxed">{brand.description}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-zinc-100">
              <button
                onClick={() => openEditModal(brand)}
                className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition"
                title="تعديل"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(brand)}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                title="حذف"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {brands.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-zinc-300">
            <Sparkles className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
            <p className="text-zinc-500 font-medium">لم يتم إضافة أي ماركات بعد.</p>
            <button
              onClick={openCreateModal}
              className="mt-3 text-sm text-[#E6007E] font-bold hover:underline"
            >
              أضف أول ماركة تجارية الآن
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-100 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-zinc-900 mb-4">
              {editingBrand ? 'تعديل بيانات الماركة' : 'إضافة ماركة جديدة'}
            </h3>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs mb-4 border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">اسم الماركة (بالإنجليزية/اللاتينية) *</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingBrand?.name || ''}
                  required
                  placeholder="e.g. Maybelline, L'Oréal, Laneige"
                  className="w-full border border-zinc-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E6007E]"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">اسم الماركة (بالعربية)</label>
                <input
                  type="text"
                  name="nameAr"
                  defaultValue={editingBrand?.nameAr || ''}
                  placeholder="مثال: ميبيلين، لوريال باريس، لانيج"
                  className="w-full border border-zinc-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E6007E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">رابط الشعار Logo URL (اختياري)</label>
                <input
                  type="text"
                  name="logoUrl"
                  defaultValue={editingBrand?.logoUrl || ''}
                  placeholder="https://... أو مسار الصورة"
                  className="w-full border border-zinc-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E6007E]"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">نبذة عن الماركة (اختياري)</label>
                <textarea
                  name="description"
                  defaultValue={editingBrand?.description || ''}
                  rows={3}
                  placeholder="وصف مختصر لماركة التجميل ومميزاتها..."
                  className="w-full border border-zinc-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E6007E]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-zinc-200 rounded-xl text-zinc-600 text-sm font-medium hover:bg-zinc-50"
                  disabled={pending}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex items-center gap-2 bg-[#E6007E] hover:bg-[#c9006e] text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm disabled:opacity-50"
                >
                  {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingBrand ? 'حفظ التعديلات' : 'إضافة الماركة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
