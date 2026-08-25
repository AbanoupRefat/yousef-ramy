import React, { useState, useEffect } from 'react';
import { RecordTransaction } from '../application/RecordTransaction';
import { RecordExpense } from '../application/RecordExpense';
import type { IProductRepo, IStaffRepo, IServiceRepo } from '../application/interfaces';
import type { Product, Staff, Service, QueueTicket } from '../../../shared/domain/entities';
import { supabase } from '../infrastructure/SupabaseClient';

interface Props {
  recordTransactionUseCase: RecordTransaction;
  recordExpenseUseCase: RecordExpense;
  productRepo: IProductRepo;
  staffRepo: IStaffRepo;
  serviceRepo: IServiceRepo;
}

export function ReceiptEntryScreen({
  recordTransactionUseCase,
  recordExpenseUseCase,
  productRepo,
  staffRepo,
  serviceRepo
}: Props) {
  const [activeTab, setActiveTab] = useState<'haircut' | 'inventory'>('haircut');

  // Candidate Haircut Tickets currently active in queue
  const [candidateTickets, setCandidateTickets] = useState<QueueTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string>('');
  
  // Haircut Receipt Form State
  const [staffId, setStaffId] = useState<string>('');
  const [serviceId, setServiceId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [tip, setTip] = useState<string>('');

  // Repositories Data
  const [products, setProducts] = useState<Product[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // Inventory Transaction Form State
  const [invType, setInvType] = useState<'usage' | 'purchase'>('usage');
  const [invProductId, setInvProductId] = useState<string>('');
  const [invQty, setInvQty] = useState<number>(1);
  const [invCost, setInvCost] = useState<string>('');

  const loadData = async () => {
    const prods = await productRepo.getAll();
    setProducts(prods);

    const stf = await staffRepo.getAll();
    setStaffList(stf);

    const srv = await serviceRepo.getAll();
    setServices(srv);

    // Fetch active candidates for haircut completion (status = with_hero or waiting)
    const { data: rawTickets } = await supabase
      .from('queue_tickets')
      .select('*')
      .in('status', ['with_hero', 'waiting'])
      .order('position', { ascending: true });

    if (rawTickets) {
      const tickets: QueueTicket[] = rawTickets.map((row: any) => ({
        id: row.id,
        customerId: row.customer_id,
        heroId: row.hero_id,
        serviceId: row.service_id,
        status: row.status,
        reservationStatus: row.reservation_status,
        joinedAt: new Date(row.joined_at),
        position: row.position,
        phoneNumber: row.phone_number
      }));
      setCandidateTickets(tickets);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to realtime queue ticket changes
    const channel = supabase.channel('receipt_candidates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_tickets' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handle selecting a candidate haircut ticket
  const handleSelectCandidate = (tId: string) => {
    setSelectedTicketId(tId);
    if (!tId) {
      setStaffId('');
      setServiceId('');
      setAmount('');
      return;
    }
    const candidate = candidateTickets.find(t => t.id === tId);
    if (candidate) {
      setStaffId(candidate.heroId || '');
      setServiceId(candidate.serviceId || '');
      setAmount('100'); // Standard default suggested price
    }
  };

  // Submit Haircut Receipt
  const handleHaircutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !staffId || !serviceId) {
      alert('يرجى اختيار زبون مرشح من قائمة الدور الحالي.');
      return;
    }

    try {
      await recordTransactionUseCase.execute(
        staffId,
        serviceId,
        parseFloat(amount) || 0,
        parseFloat(tip) || 0,
        selectedTicketId,
        [] // Products are internal consumables managed separately in inventory
      );

      alert('تم تسجيل فاتورة الحلاقة وتحديث الدور بنجاح! 🎉');
      
      // Reset form
      setSelectedTicketId('');
      setStaffId('');
      setServiceId('');
      setAmount('');
      setTip('');
      
      loadData();
    } catch (err: any) {
      alert(`حدث خطأ أثناء تسجيل الفاتورة: ${err.message}`);
    }
  };

  // Submit Inventory Purchase or Usage
  const handleInventorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invProductId || invQty <= 0) {
      alert('يرجى اختيار المستلزم وتحديد الكمية بشكل صحيح.');
      return;
    }

    const prod = products.find(p => p.id === invProductId);
    if (!prod) return;

    try {
      if (invType === 'usage') {
        // Product Usage / Consumption: Decrement stock, no impact on safe income
        if (prod.stockQty < invQty) {
          alert('الكمية المستهلكة أكبر من المخزون المتاح حالياً!');
          return;
        }
        prod.stockQty -= invQty;
        await productRepo.update(prod);

        alert(`تم تسجيل استهلاك (عدد ${invQty}) من مستلزمات (${prod.name}) وتحديث المخزون بنجاح!`);
      } else {
        // Product Purchase / Restock: Increase stock, record expense (cost outflow from treasury)
        const unitCostNum = parseFloat(invCost) || (prod.unitCost || 0);
        const totalCost = unitCostNum * invQty;

        prod.stockQty += invQty;
        if (unitCostNum > 0) prod.unitCost = unitCostNum;
        await productRepo.update(prod);

        await recordExpenseUseCase.execute(
          `شراء وتوريد مستلزمات: ${prod.name} (عدد ${invQty})`,
          totalCost
        );

        alert(`تم تسجيل توريد مستلزمات (${prod.name}) بمبلغ ${totalCost}$ وتثبيت المصروف في الخزنة!`);
      }

      setInvProductId('');
      setInvQty(1);
      setInvCost('');
      loadData();
    } catch (err: any) {
      alert(`خطأ أثناء عملية المخزون: ${err.message}`);
    }
  };

  const getStaffName = (id: string) => staffList.find(s => s.id === id)?.name || 'غير محدد';
  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || 'خدمة حلاقة';

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 dir-rtl text-right font-sans" dir="rtl">
      
      {/* Sub Navigation Tabs */}
      <div className="flex bg-slate-200/80 p-1.5 rounded-2xl max-w-md mx-auto shadow-inner">
        <button
          onClick={() => setActiveTab('haircut')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'haircut' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          فواتير الحلاقة والخدمات
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'inventory' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
          استهلاك وتوريد الأدوات والمخزون
        </button>
      </div>

      {/* HAIRCUT RECEIPT SECTION */}
      {activeTab === 'haircut' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
          <div className="flex items-center gap-3 border-b pb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">تسجيل فاتورة حلاقة لزبون انتهى من الخدمة</h2>
              <p className="text-sm text-slate-500">اختر الزبون المنتهي من قائمة الحلاقة الحالية لإغلاق تذكرته وتسجيل الإيراد في الخزنة</p>
            </div>
          </div>

          <form onSubmit={handleHaircutSubmit} className="space-y-6">
            
            {/* Candidate Selector */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                اختر الزبون المرشح (الموجودين على كرسي الحلاقة / الدور الحالي):
              </label>
              {candidateTickets.length === 0 ? (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-sm font-medium">
                  ⚠️ لا يوجد زبائن نشطين في الدور حالياً. يمكنك الذهاب لشاشة إدارة الدور لإضافة حجز جديد.
                </div>
              ) : (
                <select
                  value={selectedTicketId}
                  onChange={e => handleSelectCandidate(e.target.value)}
                  required
                  className="block w-full rounded-xl border-slate-200 bg-slate-50 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-base p-3.5 border font-bold text-slate-900"
                >
                  <option value="">-- اضغط لاختيار الزبون المنتهي من الحلاقة --</option>
                  {candidateTickets.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.status === 'with_hero' ? '🟢 [على الكرسي الآن]' : '⏳ [في الانتظار]'} تذكرة #{t.position} - {t.phoneNumber || 'حضور مباشر'} ({getServiceName(t.serviceId || '')} مع {getStaffName(t.heroId || '')})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Readonly/Pre-filled Information */}
            {selectedTicketId && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-amber-50/60 p-4 rounded-xl border border-amber-200/60">
                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">الحلاق المسؤول</label>
                  <input type="text" readOnly value={getStaffName(staffId)} className="w-full p-2.5 bg-white border border-amber-200 rounded-lg font-bold text-slate-800" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">الخدمة المستفاد منها</label>
                  <input type="text" readOnly value={getServiceName(serviceId)} className="w-full p-2.5 bg-white border border-amber-200 rounded-lg font-bold text-slate-800" />
                </div>
              </div>
            )}

            {/* Financial Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">مبلغ الفاتورة المستحق ($)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="block w-full rounded-xl border-slate-200 bg-slate-50 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm p-3 border font-bold text-slate-900"
                  required
                  min="0"
                  placeholder="مثال: 100"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">الإكرامية / البقشيش ($)</label>
                <input
                  type="number"
                  value={tip}
                  onChange={e => setTip(e.target.value)}
                  className="block w-full rounded-xl border-slate-200 bg-slate-50 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm p-3 border font-bold text-slate-900"
                  min="0"
                  placeholder="0.00"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedTicketId}
              className={`w-full py-4 px-4 rounded-xl shadow-md text-base font-bold text-white transition-all ${
                selectedTicketId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              إكتمال الحلاقة وتسجيل الفاتورة في الخزنة
            </button>
          </form>
        </div>
      )}

      {/* INVENTORY PURCHASES & INTERNAL CONSUMPTION SECTION */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
          <div className="flex items-center gap-3 border-b pb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">إدارة استهلاك وتوريد الأدوات والمستلزمات</h2>
              <p className="text-sm text-slate-500">تسجيل استهلاك الأدوات داخلياً أثناء العمل، أو توريد وشراء بضاعة جديدة وتأثيرها على الخزنة</p>
            </div>
          </div>

          {/* Operation Type Switcher */}
          <div className="flex gap-4 p-2 bg-slate-50 rounded-xl border border-slate-200">
            <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg cursor-pointer font-bold transition-all ${invType === 'usage' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
              <input type="radio" name="invType" value="usage" checked={invType === 'usage'} onChange={() => setInvType('usage')} className="sr-only" />
              <span>✂️ تسجيل استهلاك أدوات ومستلزمات (استخدام داخلي)</span>
            </label>
            <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg cursor-pointer font-bold transition-all ${invType === 'purchase' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
              <input type="radio" name="invType" value="purchase" checked={invType === 'purchase'} onChange={() => setInvType('purchase')} className="sr-only" />
              <span>🚛 فاتورة شراء وتوريد مستلزمات (مصروف من الخزنة)</span>
            </label>
          </div>

          <form onSubmit={handleInventorySubmit} className="space-y-4">
            <div className={`grid grid-cols-1 ${invType === 'purchase' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">اختر المستلزم / المنتج</label>
                <select
                  value={invProductId}
                  onChange={e => {
                    setInvProductId(e.target.value);
                    const prod = products.find(p => p.id === e.target.value);
                    if (prod && invType === 'purchase') {
                      setInvCost(prod.unitCost?.toString() || '');
                    }
                  }}
                  required
                  className="block w-full rounded-xl border-slate-200 bg-slate-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-3 border font-medium"
                >
                  <option value="">-- اختر المستلزم --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (المخزون الحالي: {p.stockQty})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">الكمية المستهلكة / المشتراة</label>
                <input
                  type="number"
                  min="1"
                  value={invQty}
                  onChange={e => setInvQty(parseInt(e.target.value) || 1)}
                  className="block w-full rounded-xl border-slate-200 bg-slate-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-3 border font-bold"
                  required
                />
              </div>

              {invType === 'purchase' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">سعر تكلفة القطعة ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={invCost}
                    onChange={e => setInvCost(e.target.value)}
                    className="block w-full rounded-xl border-slate-200 bg-slate-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-3 border font-bold"
                    placeholder="سعر شراء القطعة"
                    required
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              className={`w-full py-3.5 px-4 rounded-xl shadow-md text-base font-bold text-white transition-all ${
                invType === 'usage' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {invType === 'usage' ? 'خصم الكمية المستهلكة من المخزون' : 'حفظ فاتورة الشراء وتثبيت المصروف في الخزنة'}
            </button>
          </form>

          {/* Current Inventory Overview Table */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">جدول متابعة مخزون الأدوات والمستلزمات</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {products.map(p => (
                <div key={p.id} className={`p-4 rounded-xl border ${p.stockQty <= p.lowStockThreshold ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="font-bold text-slate-900">{p.name}</div>
                  <div className="flex justify-between items-baseline mt-2">
                    <span className="text-xs text-slate-500">الكمية المتاحة:</span>
                    <span className={`text-2xl font-black ${p.stockQty <= p.lowStockThreshold ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {p.stockQty}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-1 border-t pt-1">
                    <span>حد التنبيه: {p.lowStockThreshold}</span>
                    <span>سعر التكلفة: ${p.unitCost || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
