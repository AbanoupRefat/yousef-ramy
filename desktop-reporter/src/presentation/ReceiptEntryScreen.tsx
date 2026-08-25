import React, { useState, useEffect } from 'react';
import { RecordTransaction } from '../application/RecordTransaction';
import type { IProductRepo, IStaffRepo, IServiceRepo } from '../application/interfaces';
import type { Product, Staff, Service } from '../../../shared/domain/entities';

interface Props {
  recordTransactionUseCase: RecordTransaction;
  productRepo: IProductRepo;
  staffRepo: IStaffRepo;
  serviceRepo: IServiceRepo;
}

export function ReceiptEntryScreen({ recordTransactionUseCase, productRepo, staffRepo, serviceRepo }: Props) {
  const [amount, setAmount] = useState<string>('');
  const [tip, setTip] = useState<string>('');
  const [staffId, setStaffId] = useState<string>('');
  const [serviceId, setServiceId] = useState<string>('');
  const [ticketId, setTicketId] = useState<string>('ticket-1');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<{productId: string, quantity: number}[]>([]);

  useEffect(() => {
    productRepo.getAll().then(setProducts);
    staffRepo.getAll().then(setStaffList);
    serviceRepo.getAll().then(setServices);
  }, [productRepo, staffRepo, serviceRepo]);

  const handleAddProduct = (productId: string) => {
    if (!productId) return;
    const existing = selectedProducts.find(p => p.productId === productId);
    if (existing) {
      setSelectedProducts(selectedProducts.map(p => 
        p.productId === productId ? { ...p, quantity: p.quantity + 1 } : p
      ));
    } else {
      setSelectedProducts([...selectedProducts, { productId, quantity: 1 }]);
    }
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.productId !== productId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await recordTransactionUseCase.execute(
        staffId,
        serviceId,
        parseFloat(amount) || 0,
        parseFloat(tip) || 0,
        ticketId,
        selectedProducts
      );
      alert('تم تسجيل الفاتورة بنجاح!');
      
      setAmount('');
      setTip('');
      setSelectedProducts([]);
      
      const updatedProducts = await productRepo.getAll();
      setProducts(updatedProducts);
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 space-y-6 dir-rtl text-right font-sans" dir="rtl">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">تسجيل فاتورة جديدة</h2>
          <p className="text-sm text-gray-500">إدخال الفواتير والخدمات والمبيعات والعمولات</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الحلاق / المقدم للخدمة</label>
            <select 
              value={staffId} 
              onChange={e => setStaffId(e.target.value)}
              className="block w-full rounded-xl border-gray-200 bg-gray-50 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm p-3 border"
              required
            >
              <option value="">-- اختر الحلاق --</option>
              {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الخدمة المقدمة</label>
            <select 
              value={serviceId} 
              onChange={e => setServiceId(e.target.value)}
              className="block w-full rounded-xl border-gray-200 bg-gray-50 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm p-3 border"
              required
            >
              <option value="">-- اختر الخدمة --</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ الإجمالي ($)</label>
            <input 
              type="number" 
              value={amount} 
              onChange={e => setAmount(e.target.value)}
              className="block w-full rounded-xl border-gray-200 bg-gray-50 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm p-3 border"
              required
              min="0"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الإكرامية / البقشيش ($)</label>
            <input 
              type="number" 
              value={tip} 
              onChange={e => setTip(e.target.value)}
              className="block w-full rounded-xl border-gray-200 bg-gray-50 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm p-3 border"
              min="0"
              placeholder="0.00"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">رقم الفاتورة / التذكرة</label>
          <input 
            type="text" 
            value={ticketId} 
            onChange={e => setTicketId(e.target.value)}
            className="block w-full rounded-xl border-gray-200 bg-gray-50 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm p-3 border"
            required
          />
        </div>

        <div className="border-t pt-5">
          <h3 className="text-base font-bold text-gray-900 mb-3">المنتجات والمستلزمات المباعة</h3>
          <div className="flex gap-2 mb-4">
            <select 
              id="product-select"
              className="block w-full rounded-xl border-gray-200 bg-gray-50 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm p-3 border"
            >
              <option value="">-- إختيار منتج من المخزن --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (المخزون: {p.stockQty}) {p.stockQty <= p.lowStockThreshold ? '⚠️ منخفض' : ''}
                </option>
              ))}
            </select>
            <button 
              type="button"
              onClick={() => {
                const select = document.getElementById('product-select') as HTMLSelectElement;
                handleAddProduct(select.value);
                select.value = '';
              }}
              className="px-5 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition-colors shadow-xs"
            >
              إضافة
            </button>
          </div>
          
          {selectedProducts.length > 0 && (
            <ul className="space-y-2">
              {selectedProducts.map(sp => {
                const p = products.find(prod => prod.id === sp.productId);
                return (
                  <li key={sp.productId} className="flex justify-between items-center bg-amber-50/50 border border-amber-100 p-3 rounded-xl">
                    <span className="font-bold text-gray-800">{p?.name} (الكمية: {sp.quantity})</span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveProduct(sp.productId)}
                      className="text-rose-600 hover:text-rose-800 font-bold text-xs bg-white px-3 py-1 rounded-lg border border-rose-200 shadow-2xs"
                    >
                      حذف
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <button 
          type="submit" 
          className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-amber-600 hover:bg-amber-700 transition-all focus:outline-none"
        >
          حفظ وإكمال الفاتورة
        </button>
      </form>

      <div className="mt-8 border-t pt-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">حالة المخزون الحالية</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.id} className={`p-4 rounded-xl border ${p.stockQty <= p.lowStockThreshold ? 'bg-rose-50 border-rose-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="font-bold text-gray-900">{p.name}</div>
              <div className={`text-2xl font-black mt-1 ${p.stockQty <= p.lowStockThreshold ? 'text-rose-600' : 'text-emerald-600'}`}>
                {p.stockQty}
              </div>
              {p.stockQty <= p.lowStockThreshold && (
                <div className="text-xs font-bold text-rose-600 mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  تنبيه: المخزون منخفض!
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
