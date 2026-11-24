'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { filsToDisplay } from '@/lib/money';
import { Search, Plus, Sparkles, Tag, Trash2, Edit3, Globe, ShoppingBag, Eye, EyeOff, Loader2, Layers, CheckCircle2 } from 'lucide-react';
import { deleteProduct, toggleProductStoreVisibility, toggleProductPOSVisibility, updateProductChannelAction } from '@/actions/products';

export function AdminProductsClient({ products, globalPrices, adminId, categories }: { products: any[], globalPrices: any, adminId: string, categories: any[] }) {
  const [productList, setProductList] = useState<any[]>(products);

  useEffect(() => {
    setProductList(products);
  }, [products]);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});
  const [activeChannelTab, setActiveChannelTab] = useState<'ALL' | 'ONLINE' | 'POS' | 'SHARED'>('ALL');

  // Channel product counts
  const onlineCount = useMemo(() => 
    productList.filter(p => p.channel === 'ONLINE' || (p.isVisible && p.isPOSAvailable === false)).length,
    [productList]
  );
  const posCount = useMemo(() => 
    productList.filter(p => p.channel === 'POS' || (!p.isVisible && p.isPOSAvailable)).length,
    [productList]
  );
  const sharedCount = useMemo(() => 
    productList.filter(p => p.channel === 'SHARED' || (!p.channel && (p.isVisible !== false && p.isPOSAvailable !== false))).length,
    [productList]
  );

  // Filter products by search and channel
  const filteredProducts = useMemo(() => {
    let list = productList;
    if (activeChannelTab === 'ONLINE') {
      list = list.filter(p => p.channel === 'ONLINE' || (p.isVisible && p.isPOSAvailable === false));
    } else if (activeChannelTab === 'POS') {
      list = list.filter(p => p.channel === 'POS' || (!p.isVisible && p.isPOSAvailable));
    } else if (activeChannelTab === 'SHARED') {
      list = list.filter(p => p.channel === 'SHARED' || (!p.channel && (p.isVisible !== false && p.isPOSAvailable !== false)));
    }

    if (!search.trim()) return list;
    const lowerSearch = search.toLowerCase();
    return list.filter(p => 
      p.nameAr?.toLowerCase().includes(lowerSearch) || 
      (p.nameEn && p.nameEn.toLowerCase().includes(lowerSearch)) ||
      (p.sku && p.sku.toLowerCase().includes(lowerSearch)) ||
      (p.brand?.name && p.brand.name.toLowerCase().includes(lowerSearch)) ||
      (p.brand?.nameAr && p.brand.nameAr.toLowerCase().includes(lowerSearch))
    );
  }, [productList, search, activeChannelTab]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Switch product channel action
  const handleChannelChange = async (productId: string, newChannel: 'ONLINE' | 'POS' | 'SHARED') => {
    setBusyIds(prev => ({ ...prev, [`chan_${productId}`]: true }));
    // Optimistic update
    setProductList(prev => prev.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          channel: newChannel,
          isVisible: newChannel !== 'POS',
          isPOSAvailable: newChannel !== 'ONLINE'
        };
      }
      return p;
    }));

    try {
      const res = await updateProductChannelAction(productId, newChannel);
      if (!res.success) {
        alert(res.error || 'فشل تحديث قسم المنتج');
      }
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء تحديث قسم المنتج');
    } finally {
      setBusyIds(prev => ({ ...prev, [`chan_${productId}`]: false }));
    }
  };

  // Toggle Store Visibility (المتجر الإلكتروني)
  const handleToggleStoreVisibility = async (productId: string, currentVisible: boolean) => {
    const nextState = !currentVisible;
    setBusyIds(prev => ({ ...prev, [`store_${productId}`]: true }));
    // Optimistic update
    setProductList(prev => prev.map(p => p.id === productId ? { ...p, isVisible: nextState } : p));
    try {
      const res = await toggleProductStoreVisibility(productId, nextState);
      if (!res.success) {
        // revert on failure
        setProductList(prev => prev.map(p => p.id === productId ? { ...p, isVisible: currentVisible } : p));
        alert(res.error || 'فشل تحديث حالة العرض في المتجر');
      }
    } catch (err: any) {
      setProductList(prev => prev.map(p => p.id === productId ? { ...p, isVisible: currentVisible } : p));
      alert(err.message || 'حدث خطأ');
    } finally {
      setBusyIds(prev => ({ ...prev, [`store_${productId}`]: false }));
    }
  };

  // Toggle POS Visibility (كاشير البيع)
  const handleTogglePOSVisibility = async (productId: string, currentPOSAvailable: boolean) => {
    const nextState = !currentPOSAvailable;
    setBusyIds(prev => ({ ...prev, [`pos_${productId}`]: true }));
    // Optimistic update
    setProductList(prev => prev.map(p => {
      if (p.id === productId) {
        const updatedVariants = (p.variants || []).map((v: any) => ({ ...v, isActive: nextState }));
        return { ...p, isPOSAvailable: nextState, variants: updatedVariants };
      }
      return p;
    }));

    try {
      const res = await toggleProductPOSVisibility(productId, nextState);
      if (!res.success) {
        setProductList(prev => prev.map(p => {
          if (p.id === productId) {
            const revertedVariants = (p.variants || []).map((v: any) => ({ ...v, isActive: currentPOSAvailable }));
            return { ...p, isPOSAvailable: currentPOSAvailable, variants: revertedVariants };
          }
          return p;
        }));
        alert(res.error || 'فشل تحديث حالة البيع في الكاشير');
      }
    } catch (err: any) {
      alert(err.message || 'حدث خطأ');
    } finally {
      setBusyIds(prev => ({ ...prev, [`pos_${productId}`]: false }));
    }
  };

  // Delete product action
  const handleDeleteProduct = async (productId: string, productName: string) => {
    const confirmed = window.confirm(`هل أنت متأكد من رغبتك في حذف المنتج:\n"${productName}"؟\nسيتم حذفه من المتجر ونظام الكاشير نهائياً.`);
    if (!confirmed) return;

    setBusyIds(prev => ({ ...prev, [`del_${productId}`]: true }));
    try {
      const res = await deleteProduct(productId);
      if (res.success) {
        setProductList(prev => prev.filter(p => p.id !== productId));
      } else {
        alert(res.error || 'فشل حذف المنتج');
      }
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء الحذف');
    } finally {
      setBusyIds(prev => ({ ...prev, [`del_${productId}`]: false }));
    }
  };

  return (
    <div className="w-full flex flex-col gap-6" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-6 bg-[#E6007E] rounded-full inline-block"></span>
            <h1 className="text-2xl md:text-3xl font-bold font-heading text-zinc-900">
              إدارة المنتجات والأسعار
            </h1>
          </div>
          <p className="text-zinc-500 mt-1 text-sm">
            التحكم المباشر بالعرض في المتجر والكاشير، الدرجات، الباركود، والأسعار • {productList.length} منتج
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute start-3 top-3" />
            <input 
              type="text" 
              placeholder="بحث بالاسم، الماركة أو SKU..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-zinc-300 rounded-xl ps-9 pe-4 py-2 text-sm focus:outline-none focus:border-[#E6007E] w-full sm:w-64 bg-white"
            />
          </div>
          <Link
            href={
              activeChannelTab === 'ONLINE' ? '/admin/products/new?channel=ONLINE' :
              activeChannelTab === 'POS' ? '/admin/products/new?channel=POS' :
              activeChannelTab === 'SHARED' ? '/admin/products/new?channel=SHARED' :
              '/admin/products/new'
            }
            className="flex items-center justify-center gap-2 bg-[#E6007E] hover:bg-[#c9006e] text-white px-5 py-2 rounded-xl font-bold transition text-sm shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            {
              activeChannelTab === 'ONLINE' ? 'إضافة منتج للمتجر الإلكتروني' :
              activeChannelTab === 'POS' ? 'إضافة منتج لكاشير المحل' :
              activeChannelTab === 'SHARED' ? 'إضافة منتج مشترك (متجر + كاشير)' :
              'إضافة منتج جديد'
            }
          </Link>
        </div>
      </div>

      {/* Product Channels Tabs (أقسام المتجر الإلكتروني، الكاشير، والمنتجات المشتركة) */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-zinc-100 rounded-2xl border border-zinc-200">
        <button
          type="button"
          onClick={() => setActiveChannelTab('ALL')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeChannelTab === 'ALL'
              ? 'bg-zinc-800 text-white shadow-xs'
              : 'text-zinc-700 hover:bg-white hover:text-zinc-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>كافة المنتجات</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-200 text-zinc-800">
            {productList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveChannelTab('ONLINE')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeChannelTab === 'ONLINE'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-zinc-700 hover:bg-white hover:text-zinc-900'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>قسم المتجر الإلكتروني</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            activeChannelTab === 'ONLINE' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'
          }`}>
            {onlineCount} منتج
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveChannelTab('POS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeChannelTab === 'POS'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-zinc-700 hover:bg-white hover:text-zinc-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>قسم كاشير وصالة المحل</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            activeChannelTab === 'POS' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800'
          }`}>
            {posCount} منتج
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveChannelTab('SHARED')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeChannelTab === 'SHARED'
              ? 'bg-[#E6007E] text-white shadow-xs'
              : 'text-zinc-700 hover:bg-white hover:text-zinc-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>قسم المنتجات المشتركة (المتجر + الكاشير)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            activeChannelTab === 'SHARED' ? 'bg-pink-700 text-white' : 'bg-pink-100 text-[#E6007E]'
          }`}>
            {sharedCount} منتج
          </span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200/80 overflow-hidden">
        <div className="overflow-x-auto w-full pb-2">
          <table className="w-full text-right border-collapse min-w-[1050px]">
            <thead className="bg-zinc-50/80 border-b border-zinc-200">
              <tr className="text-xs font-bold text-zinc-600">
                <th className="px-4 py-3.5 w-12 text-center">
                  <input 
                    type="checkbox" 
                    checked={filteredProducts.length > 0 && selectedIds.length === filteredProducts.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-[#E6007E] rounded border-zinc-300 focus:ring-[#E6007E]"
                  />
                </th>
                <th className="px-4 py-3.5 w-14">صورة</th>
                <th className="px-4 py-3.5">المنتج</th>
                <th className="px-4 py-3.5">القسم</th>
                <th className="px-4 py-3.5 text-center">قناة البيع / القسم</th>
                <th className="px-4 py-3.5">الدرجات / الخيارات</th>
                <th className="px-4 py-3.5 text-center">سعر التكلفة</th>
                <th className="px-4 py-3.5 text-center">سعر البيع</th>
                <th className="px-4 py-3.5 text-center">عرض المتجر</th>
                <th className="px-4 py-3.5 text-center">كاشير POS</th>
                <th className="px-4 py-3.5 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredProducts.map((product) => {
                const mainImage = product.images?.[0];
                const isSelected = selectedIds.includes(product.id);
                const isStoreBusy = busyIds[`store_${product.id}`];
                const isPOSBusy = busyIds[`pos_${product.id}`];
                const isDelBusy = busyIds[`del_${product.id}`];
                
                // Determine if POS is available (any active variant or product flag)
                const isPOSActive = product.isPOSAvailable !== undefined 
                  ? product.isPOSAvailable 
                  : (product.variants?.some((v: any) => v.isActive) ?? true);

                // Selling price calculation
                const variantPrices = (product.variants || [])
                  .map((v: any) => Number(v.price) || 0)
                  .filter((p: number) => p > 0);
                const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : (product.priceFils || 0);
                const maxPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : (product.priceFils || 0);

                // Cost price calculation
                const variantCosts = (product.variants || [])
                  .map((v: any) => {
                    if (v.costPrice !== undefined && Number(v.costPrice) > 0) return Number(v.costPrice);
                    if ((product as any).costPrice !== undefined && Number((product as any).costPrice) > 0) return Number((product as any).costPrice);
                    return Math.round((Number(v.price) || (product.priceFils || 0)) * 0.55);
                  })
                  .filter((c: number) => c > 0);
                const minCost = variantCosts.length > 0 ? Math.min(...variantCosts) : Math.round(minPrice * 0.55);
                const maxCost = variantCosts.length > 0 ? Math.max(...variantCosts) : Math.round(maxPrice * 0.55);

                return (
                  <tr key={product.id} className={`hover:bg-zinc-50/60 transition text-zinc-700 text-sm ${isSelected ? 'bg-pink-50/30' : ''}`}>
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleSelect(product.id)}
                        className="w-4 h-4 text-[#E6007E] rounded border-zinc-300 focus:ring-[#E6007E]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 rounded-xl border border-zinc-200 bg-white overflow-hidden flex items-center justify-center p-0.5">
                        {mainImage ? (
                          <img src={mainImage.url.startsWith('local://') ? '/product-placeholder.png' : mainImage.url} alt={product.nameAr} className="w-full h-full object-contain rounded-lg" />
                        ) : (
                          <span className="text-[10px] text-zinc-400">بدون صورة</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-zinc-900">{product.nameAr}</div>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <span className="text-xs text-zinc-400 font-mono" dir="ltr">{product.sku}</span>
                        {product.tag ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-pink-100 text-[#E6007E] border border-pink-200">
                            🏷️ {product.tag}
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-300 font-medium">(بدون شارة)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-800 font-bold">
                      {product.category?.name || '-'}
                    </td>
                    
                    {/* Channel / Section Selector */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {(() => {
                        const currentChannel: 'ONLINE' | 'POS' | 'SHARED' = product.channel || (
                          (product.isPOSAvailable !== false && product.isVisible !== false) ? 'SHARED' :
                          product.isPOSAvailable ? 'POS' : 'ONLINE'
                        );

                        return (
                          <div className="inline-flex flex-col items-center">
                            <select
                              value={currentChannel}
                              disabled={busyIds[`chan_${product.id}`]}
                              onChange={(e) => handleChannelChange(product.id, e.target.value as any)}
                              className={`text-xs font-black px-2.5 py-1 rounded-xl border outline-none cursor-pointer transition shadow-2xs ${
                                currentChannel === 'ONLINE'
                                  ? 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
                                  : currentChannel === 'POS'
                                  ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                                  : 'bg-pink-50 text-[#E6007E] border-pink-200 hover:bg-pink-100'
                              }`}
                            >
                              <option value="ONLINE">🌐 متجر إلكتروني</option>
                              <option value="POS">🛍️ كاشير المحل</option>
                              <option value="SHARED">✨ مشترك</option>
                            </select>
                            <span className="text-[10px] text-zinc-400 mt-0.5">
                              {currentChannel === 'ONLINE' && 'المتجر فقط'}
                              {currentChannel === 'POS' && 'الكاشير فقط'}
                              {currentChannel === 'SHARED' && 'المتجر والكاشير'}
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    
                    {/* Shades / Variants */}
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {product.variants.map((v: any) => (
                          <span key={v.id} className="inline-flex items-center gap-1 bg-zinc-100 px-2 py-0.5 rounded-lg text-xs font-medium text-zinc-700 border border-zinc-200">
                            {v.colorHex && (
                              <span className="w-2.5 h-2.5 rounded-full inline-block border border-black/10 shrink-0" style={{ backgroundColor: v.colorHex }}></span>
                            )}
                            <span>{v.shade || v.size}</span>
                          </span>
                        ))}
                        {product.variants.length === 0 && <span className="text-xs text-zinc-400">لا درجات</span>}
                      </div>
                    </td>

                    {/* Cost Price (سعر التكلفة) */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="inline-flex flex-col items-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-amber-50 text-amber-900 border border-amber-200/90 shadow-2xs">
                          <span>{minCost === maxCost ? filsToDisplay(minCost, 'ar') : `${filsToDisplay(minCost, 'ar')} - ${filsToDisplay(maxCost, 'ar')}`}</span>
                        </span>
                        <span className="text-[10px] text-zinc-400 font-semibold mt-0.5">تكلفة الوحدة</span>
                      </div>
                    </td>

                    {/* Selling Price (سعر البيع) */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="inline-flex flex-col items-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-emerald-50 text-emerald-900 border border-emerald-200/90 shadow-2xs">
                          <span>{minPrice === maxPrice ? filsToDisplay(minPrice, 'ar') : `${filsToDisplay(minPrice, 'ar')} - ${filsToDisplay(maxPrice, 'ar')}`}</span>
                        </span>
                        {product.variants?.some((v: any) => v.compareAt && v.compareAt > v.price) ? (
                          <span className="text-[10px] text-rose-600 font-extrabold mt-0.5">خصم فعال</span>
                        ) : (
                          <span className="text-[10px] text-zinc-400 font-semibold mt-0.5">سعر الجمهور</span>
                        )}
                      </div>
                    </td>

                    {/* Storefront Online Toggle (المتجر الإلكتروني) */}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStoreVisibility(product.id, product.isVisible)}
                        disabled={isStoreBusy}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                          product.isVisible
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-zinc-100 text-zinc-500 border border-zinc-200 hover:bg-zinc-200'
                        }`}
                        title="انقر لتبديل الظهور في المتجر الإلكتروني مباشرة"
                      >
                        {isStoreBusy ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : product.isVisible ? (
                          <Eye className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <EyeOff className="w-3 h-3 text-zinc-400" />
                        )}
                        <span>{product.isVisible ? 'متاح بالمتجر' : 'مخفي بالمتجر'}</span>
                      </button>
                    </td>

                    {/* POS Cashier Toggle (كاشير البيع) */}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleTogglePOSVisibility(product.id, isPOSActive)}
                        disabled={isPOSBusy}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                          isPOSActive
                            ? 'bg-pink-50 text-[#E6007E] border border-pink-200 hover:bg-pink-100'
                            : 'bg-zinc-100 text-zinc-500 border border-zinc-200 hover:bg-zinc-200'
                        }`}
                        title="انقر لتبديل إتاحة المنتج في كاشير البيع POS مباشرة"
                      >
                        {isPOSBusy ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <ShoppingBag className={`w-3 h-3 ${isPOSActive ? 'text-[#E6007E]' : 'text-zinc-400'}`} />
                        )}
                        <span>{isPOSActive ? 'متاح بالكاشير' : 'مخفي بالكاشير'}</span>
                      </button>
                    </td>

                    {/* Actions: Edit & Delete */}
                    <td className="px-4 py-3 text-center text-sm font-bold">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg text-zinc-700 bg-zinc-100 hover:bg-pink-50 hover:text-[#E6007E] border border-zinc-200 transition"
                          title="تعديل المنتج"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>تعديل</span>
                        </Link>
                        
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(product.id, product.nameAr)}
                          disabled={isDelBusy}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition cursor-pointer"
                          title="حذف المنتج نهائياً"
                        >
                          {isDelBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          <span>حذف</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center">
                    <p className="text-zinc-500 mb-2">لا توجد منتجات تطابق البحث.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
