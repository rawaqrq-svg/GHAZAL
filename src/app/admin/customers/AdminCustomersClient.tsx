'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Plus, Phone, Mail, MapPin, 
  ShoppingBag, DollarSign, Calendar, Edit3, X, RefreshCw, CheckCircle2
} from 'lucide-react';
import { createOrUpdateCustomer, getAllCustomers } from '@/actions/admin-pos';

interface Props {
  initialCustomers: any[];
}

export default function AdminCustomersClient({ initialCustomers }: Props) {
  const [customers, setCustomers] = useState<any[]>(initialCustomers);

  useEffect(() => {
    setCustomers(initialCustomers);
  }, [initialCustomers]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('عمّان');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    (c.city && c.city.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenModal = (cust?: any) => {
    if (cust) {
      setEditingCustomer(cust);
      setName(cust.name);
      setPhone(cust.phone);
      setEmail(cust.email || '');
      setCity(cust.city || 'عمّان');
      setNotes(cust.notes || '');
    } else {
      setEditingCustomer(null);
      setName('');
      setPhone('');
      setEmail('');
      setCity('عمّان');
      setNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('يرجى ملء الاسم ورقم الهاتف');
      return;
    }

    setIsLoading(true);
    try {
      const res = await createOrUpdateCustomer({
        id: editingCustomer?.id,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        city: city.trim(),
        notes: notes.trim() || undefined
      });

      if (res.success && res.customer) {
        if (editingCustomer) {
          setCustomers(prev => prev.map(c => c.id === res.customer.id ? res.customer : c));
        } else {
          setCustomers(prev => [res.customer, ...prev]);
        }
        setIsModalOpen(false);
      } else {
        alert(res.error || 'فشل حفظ بيانات العميل');
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
            <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-zinc-900 font-heading">
              سجل العملاء والبيانات (Customers Directory)
            </h1>
          </div>
          <p className="text-xs text-zinc-500">
            إدارة بيانات العملاء، أرقام الهواتف، سجل المشتريات، وأرصدة الذمم والآجل
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 bg-[#E6007E] hover:bg-[#c4006b] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>+ إضافة عميل جديد</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute start-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="البحث بالاسم، رقم الهاتف، أو المدينة..."
            className="w-full ps-9 pe-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-hidden focus:border-[#E6007E]"
          />
        </div>
        <span className="text-xs font-bold text-zinc-500">{filteredCustomers.length} عميل</span>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-bold">
              <tr>
                <th className="p-3 text-start">اسم العميل</th>
                <th className="p-3 text-start">رقم الهاتف</th>
                <th className="p-3 text-start">المدينة</th>
                <th className="p-3 text-start">عدد الطلبات</th>
                <th className="p-3 text-start">إجمالي الإنفاق (د.أ)</th>
                <th className="p-3 text-start">رصيد الذمم (الآجل)</th>
                <th className="p-3 text-start">ملاحظات</th>
                <th className="p-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium">
              {filteredCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-zinc-50 transition">
                  <td className="p-3 font-bold text-zinc-900">{cust.name}</td>
                  <td className="p-3 font-mono font-bold text-zinc-700" dir="ltr">{cust.phone}</td>
                  <td className="p-3 text-zinc-600">{cust.city || '—'}</td>
                  <td className="p-3 font-bold text-zinc-800">{cust.totalOrdersCount} عملية</td>
                  <td className="p-3 font-black text-[#E6007E]" dir="ltr">
                    {(cust.totalSpentFils / 1000).toFixed(3)} د.أ
                  </td>
                  <td className="p-3">
                    {cust.creditBalanceFils > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]" dir="ltr">
                        {(cust.creditBalanceFils / 1000).toFixed(3)} د.أ
                      </span>
                    ) : (
                      <span className="text-zinc-400 font-bold">لا يوجد</span>
                    )}
                  </td>
                  <td className="p-3 text-zinc-500 max-w-[200px] truncate">{cust.notes || '—'}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleOpenModal(cust)}
                      className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
                      title="تعديل العميل"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-zinc-200">
            <div className="p-4 bg-zinc-900 text-white flex items-center justify-between">
              <span className="font-extrabold text-sm">
                {editingCustomer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
              </span>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">اسم العميل:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="الاسم الكامل..."
                  required
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-800 focus:outline-hidden focus:border-[#E6007E]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">رقم الهاتف (الخلوي):</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="مثال: 0791234567"
                  required
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-mono font-bold text-zinc-800 focus:outline-hidden focus:border-[#E6007E]"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">البريد الإلكتروني (اختياري):</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-800"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">المدينة / المنطقة:</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="عمّان، عين الباشا..."
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">ملاحظات العميل:</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="تفضيلات العميل، الحساب، إلخ..."
                  className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-800"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 bg-[#E6007E] hover:bg-[#c4006b] disabled:opacity-50 text-white rounded-xl font-bold transition flex items-center justify-center gap-2"
                >
                  {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>حفظ بيانات العميل</span>
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
