'use client';

import React, { useState } from 'react';
import { 
  Printer, Tag, Save, CheckCircle2, RefreshCw, Barcode, FileText, Image as ImageIcon
} from 'lucide-react';
import { updatePrintingSettings, PrintingSettingsRecord } from '@/actions/admin-pos';

interface Props {
  initialSettings: PrintingSettingsRecord;
}

export default function AdminPrintingClient({ initialSettings }: Props) {
  const [settings, setSettings] = useState<PrintingSettingsRecord>(initialSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSaveSuccess(false);

    try {
      const res = await updatePrintingSettings(settings);
      if (res.success && res.settings) {
        setSettings(res.settings);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e: any) {
      alert(e.message || 'حدث خطأ أثناء الحفظ');
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
            <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Printer className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-zinc-900 font-heading">
              إعدادات الإيصالات والملصقات (Printing & Labels)
            </h1>
          </div>
          <p className="text-xs text-zinc-500">
            تخصيص شكل ومقاس الإيصال الحراري 80mm/58mm، طباعة الباركود، وقوالب ملصقات المنتجات
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" />
            <span>تم حفظ الإعدادات بنجاح</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        {/* Thermal Receipt Settings */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
            <Printer className="w-4 h-4 text-[#E6007E]" />
            <h2 className="font-extrabold text-sm text-zinc-900">إعدادات طابعة الإيصال الحراري (Thermal Receipt)</h2>
          </div>

          <div>
            <label className="block font-bold text-zinc-700 mb-1.5">عرض ورق الطابعة الحرارية:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSettings(s => ({ ...s, receiptPaperWidth: '80mm' }))}
                className={`py-3 rounded-2xl font-bold border transition ${
                  settings.receiptPaperWidth === '80mm'
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                    : 'bg-zinc-50 text-zinc-700 border-zinc-200'
                }`}
              >
                مقاس 80 مم (الأكثر شيوعاً للمحلات)
              </button>
              <button
                type="button"
                onClick={() => setSettings(s => ({ ...s, receiptPaperWidth: '58mm' }))}
                className={`py-3 rounded-2xl font-bold border transition ${
                  settings.receiptPaperWidth === '58mm'
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                    : 'bg-zinc-50 text-zinc-700 border-zinc-200'
                }`}
              >
                مقاس 58 مم (طابعات صغيرة محمولة)
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-zinc-700 mb-1">الترويسة العلوية للإيصال:</label>
            <input
              type="text"
              value={settings.receiptHeader}
              onChange={(e) => setSettings(s => ({ ...s, receiptHeader: e.target.value }))}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-800"
            />
          </div>

          <div>
            <label className="block font-bold text-zinc-700 mb-1">التذييل وسياسة الاسترجاع (أسفل الفاتورة):</label>
            <textarea
              rows={3}
              value={settings.receiptFooter}
              onChange={(e) => setSettings(s => ({ ...s, receiptFooter: e.target.value }))}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-800"
            />
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showShopLogo}
                onChange={(e) => setSettings(s => ({ ...s, showShopLogo: e.target.checked }))}
                className="rounded text-[#E6007E]"
              />
              <span className="font-bold text-zinc-700">طباعة شعار غزل أعلى الفاتورة الحرارية</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showBarcodeOnReceipt}
                onChange={(e) => setSettings(s => ({ ...s, showBarcodeOnReceipt: e.target.checked }))}
                className="rounded text-[#E6007E]"
              />
              <span className="font-bold text-zinc-700">طباعة باركود الفاتورة أسفل الإيصال لتسهيل الإرجاع السريع</span>
            </label>
          </div>
        </div>

        {/* Product Labels & Barcode Settings */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
            <Tag className="w-4 h-4 text-[#E6007E]" />
            <h2 className="font-extrabold text-sm text-zinc-900">إعدادات ملصقات واستكرات الباركود (Product Labels)</h2>
          </div>

          <div>
            <label className="block font-bold text-zinc-700 mb-1.5">مقاس ملصق الباركود (Sticker Size):</label>
            <div className="grid grid-cols-3 gap-2">
              {(['50x30mm', '40x25mm', '60x40mm'] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setSettings(s => ({ ...s, labelPaperSize: sz }))}
                  className={`py-2.5 rounded-xl font-bold border transition ${
                    settings.labelPaperSize === sz
                      ? 'bg-[#E6007E] text-white border-[#E6007E] shadow-xs'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-2 p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={settings.labelShowPrice}
                onChange={(e) => setSettings(s => ({ ...s, labelShowPrice: e.target.checked }))}
                className="rounded text-[#E6007E]"
              />
              <span className="font-bold text-zinc-700">إظهار السعر الموحد بالدينار الأردني على الملصق</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={settings.labelShowShade}
                onChange={(e) => setSettings(s => ({ ...s, labelShowShade: e.target.checked }))}
                className="rounded text-[#E6007E]"
              />
              <span className="font-bold text-zinc-700">إظهار درجة ولون المنتج على الاستكر (للمكياج)</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={settings.labelShowBrand}
                onChange={(e) => setSettings(s => ({ ...s, labelShowBrand: e.target.checked }))}
                className="rounded text-[#E6007E]"
              />
              <span className="font-bold text-zinc-700">إظهار اسم الماركة التجارية (Brand Name)</span>
            </label>
          </div>

          {/* Label Preview Card */}
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-2">
            <span className="font-bold text-zinc-600 text-[11px] block">معاينة شكل ملصق الباركود:</span>
            <div className="bg-white p-3 rounded-xl border border-zinc-300 w-48 mx-auto text-center shadow-xs">
              <p className="font-extrabold text-[11px] text-zinc-900 truncate">Maybelline SuperStay</p>
              <p className="text-[10px] text-zinc-500">درجة: 20 Pioneer</p>
              <div className="py-1 flex justify-center font-mono tracking-widest text-[11px] font-black">
                |||| | ||||| ||| |||
              </div>
              <p className="font-mono text-[9px] text-zinc-400">628100234567</p>
              <p className="font-black text-xs text-[#E6007E] mt-1" dir="ltr">7.900 د.أ</p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="lg:col-span-2 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-[#E6007E] hover:bg-[#c4006b] disabled:opacity-50 text-white rounded-2xl font-black text-sm shadow-md transition flex items-center justify-center gap-2"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>حفظ وتطبيق إعدادات الطباعة والملصقات</span>
          </button>
        </div>
      </form>
    </div>
  );
}
