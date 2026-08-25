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
  const [invType, setInvType] = useState<'sale' | 'purchase'>('sale');
  const [invProductId, setInvProductId] = useState<string>('');
  const [invQty, setInvQty] = useState<number>(1);
  const [invPrice, setInvPrice] = useState<string>('');

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
        [] // Products are now managed separately in inventory section
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

  // Submit Inventory Purchase or Sale
  const handleInventorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invProductId || invQty <= 0) {
      alert('يرجى اختيار المنتج وتحديد الكمية بشكل صحيح.');
      return;
    }

    const prod = products.find(p => p.id === invProductId);
    if (!prod) return;

    const defaultPrice = invType === 'sale' ? (prod.salePrice || 0) : (prod.unitCost || 0);
    const unitPriceNum = parseFloat(invPrice) || defaultPrice;
    const totalPrice = unitPriceNum * invQty;

    try {
      if (invType === 'sale') {
        // Product Sale: Reduce stock, record transaction (revenue into treasury)
        if (prod.stockQty < invQty) {
          alert('الكمية المطلوبة أكبر من المخزون المتاح حالياً!');
          return;
        }
        prod.stockQty -= invQty;
        await productRepo.update(prod);

        // Record as sale transaction
        const firstHero = staffList.find(s => s.role === 'hero')?.id || staffList[0]?.id;
        const firstService = services[0]?.id;
        if (firstHero && firstService) {
          await supabase.from('transactions').insert({
            id: crypto.randomUUID(),
            staff_id: firstHero,
            service_id: firstService,
            amount: totalPrice,
            tip: 0,
            ticket_id: 'product-sale',
            timestamp: new Date().toISOString()
          });
        }

        alert(`تم تسجيل بيع منتج (${prod.name}) بمبلغ ${totalPrice}$ بنجاح وتحديث الخزنة!`);
      } else {
        // Product Purchase / Restock: Increase stock, record expense (cost outflow from treasury)
        prod.stockQty += invQty;
        await productRepo.update(prod);

        await recordExpenseUseCase.execute(
          `شراء وتوريد مخزون: ${prod.name} (عدد ${invQty})`,
          totalPrice
        );

        alert(`تم تسجيل توريد منتج (${prod.name}) وتخصيص ${totalPrice}$ للمورد بنجاح!`);
      }

      setInvProductId('');
      setInvQty(1);
      setInvPrice('');
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
      <div className="flex bg-gray-200/80 p-1.5 rounded-2xl max-w-md mx-auto shadow-inner">
        <button
          onClick={() => setActiveTab('haircut')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'haircut' ? 'bg-white text-indigo-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span>✂️</span> إغلاق فواتير الحلاقة والدور
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'inventory' ? 'bg-white text-indigo-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span>📦</span> مبيعات وتوريد المخزون
        </button>
      </div>

      {/* HAIRCUT RECEIPT SECTION */}
      {activeTab === 'haircut' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="flex items-center gap-3 border-b pb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">تسجيل فاتورة حلاقة لزبون انتهى من الخدمة</h2>
              <p className="text-sm text-gray-500">اختر الزبون المنتهي من قائمة الحلاقة الحالية لإغلاق تذكرته وتسجيل الإيراد</p>
            </div>
          </div>

          <form onSubmit={handleHaircutSubmit} className="space-y-6">
            
            {/* Candidate Selector */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                اختر الزبون المرشح (الموجودين على كرسي الحلاقة / الدور الحالي):
              </label>
              {candidateTickets.length === 0 ? (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-sm font-medium">
                  ⚠️ لا يوجد زبائن نشطين في الدور حالياً. يمكنك الذهاب لشاشة إدارة الدور لإضافة حجز.
                </div>
              ) : (
                <select
                  value={selectedTicketId}
                  onChange={e => handleSelectCandidate(e.target.value)}
                  required
                  className="block w-full rounded-xl border-gray-200 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base p-3.5 border font-bold text-gray-900"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <div>
                  <label className="block text-xs font-bold text-indigo-900 mb-1">الحلاق المسؤول</label>
                  <input type="text" readOnly value={getStaffName(staffId)} className="w-full p-2.5 bg-white border border-indigo-200 rounded-lg font-bold text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-indigo-900 mb-1">الخدمة المستفاد منها</label>
                  <input type="text" readOnly value={getServiceName(serviceId)} className="w-full p-2.5 bg-white border border-indigo-200 rounded-lg font-bold text-gray-800" />
                </div>
              </div>
            )}

            {/* Financial Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">مبلغ الفاتورة المستحق ($)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="block w-full rounded-xl border-gray-200 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-3 border font-bold text-gray-900"
                  required
                  min="0"
                  placeholder="مثال: 100"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">الإكرامية / البقشيش ($)</label>
                <input
                  type="number"
                  value={tip}
                  onChange={e => setTip(e.target.value)}
                  className="block w-full rounded-xl border-gray-200 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-3 border font-bold text-gray-900"
                  min="0"
                  placeholder="0.00"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedTicketId}
              className={`w-full py-4 px-4 rounded-xl shadow-md text-base font-bold text-white transition-all ${
                selectedTicketId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              إكتمال الحلاقة وتسجيل الفاتورة في الخزنة
            </button>
          </form>
        </div>
      )}

      {/* INVENTORY PURCHASES & SALES SECTION */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="flex items-center gap-3 border-b pb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">إدارة مبيعات وتوريد المنتجات والمخزون</h2>
              <p className="text-sm text-gray-500">تسجيل فواتير بيع المنتجات للزبائن أو شراء وتوريد البضاعة وتأثيرها المباشر على الخزنة والمخزون</p>
            </div>
          </div>

          {/* Operation Type Switcher */}
          <div className="flex gap-4 p-2 bg-gray-50 rounded-xl border border-gray-200">
            <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg cursor-pointer font-bold transition-all ${invType === 'sale' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'}`}>
              <input type="radio" name="invType" value="sale" checked={invType === 'sale'} onChange={() => setInvType('sale')} className="sr-only" />
              <span>🛍️ فاتورة بيع منتج (إيراد للخزنة)</span>
            </label>
            <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg cursor-pointer font-bold transition-all ${invType === 'purchase' ? 'bg-rose-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'}`}>
              <input type="radio" name="invType" value="purchase" checked={invType === 'purchase'} onChange={() => setInvType('purchase')} className="sr-only" />
              <span>🚛 فاتورة توريد/شراء مخزون (مصروف من الخزنة)</span>
            </label>
          </div>

          <form onSubmit={handleInventorySubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">اختر المنتج</label>
                <select
                  value={invProductId}
                  onChange={e => {
                    setInvProductId(e.target.value);
                    const prod = products.find(p => p.id === e.target.value);
                    if (prod) {
                      setInvPrice(invType === 'sale' ? (prod.salePrice?.toString() || '') : (prod.unitCost?.toString() || ''));
                    }
                  }}
                  required
                  className="block w-full rounded-xl border-gray-200 bg-gray-50 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm p-3 border font-medium"
                >
                  <option value="">-- اختر المنتج --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (المخزون الحالي: {p.stockQty})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">الكمية</label>
                <input
                  type="number"
                  min="1"
                  value={invQty}
                  onChange={e => setInvQty(parseInt(e.target.value) || 1)}
                  className="block w-full rounded-xl border-gray-200 bg-gray-50 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm p-3 border font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">سعر الوحدة ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={invPrice}
                  onChange={e => setInvPrice(e.target.value)}
                  className="block w-full rounded-xl border-gray-200 bg-gray-50 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm p-3 border font-bold"
                  placeholder="سعر القطعة"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-3.5 px-4 rounded-xl shadow-md text-base font-bold text-white transition-all ${
                invType === 'sale' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {invType === 'sale' ? 'حفظ فاتورة البيع وإدخال المبلغ للخزنة' : 'حفظ فاتورة الشراء وتحديث إجمالي المصروفات'}
            </button>
          </form>

          {/* Current Inventory Overview Table */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">جدول متابعة المخزون</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {products.map(p => (
                <div key={p.id} className={`p-4 rounded-xl border ${p.stockQty <= p.lowStockThreshold ? 'bg-rose-50 border-rose-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="font-bold text-gray-900">{p.name}</div>
                  <div className="flex justify-between items-baseline mt-2">
                    <span className="text-xs text-gray-500">الكمية بالمخزن:</span>
                    <span className={`text-2xl font-black ${p.stockQty <= p.lowStockThreshold ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {p.stockQty}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1 border-t pt-1">
                    <span>سعر البيع: ${p.salePrice || 0}</span>
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
