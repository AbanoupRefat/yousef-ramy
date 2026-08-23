import React, { useState, useEffect } from 'react';
import { RecordTransaction } from '../application/RecordTransaction';
import type {  IProductRepo, IStaffRepo, IServiceRepo  } from '../application/interfaces';
import type {  Product, Staff, Service, QueueTicket  } from '../../../shared/domain/entities';

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
  
  // Hardcode a ticket for now as instructed (stub manual ticket)
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
      alert('Transaction recorded successfully!');
      
      // Reset form
      setAmount('');
      setTip('');
      setSelectedProducts([]);
      
      // Refresh products stock
      const updatedProducts = await productRepo.getAll();
      setProducts(updatedProducts);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-md space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Receipt Entry</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Staff (Hero)</label>
            <select 
              value={staffId} 
              onChange={e => setStaffId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              required
            >
              <option value="">Select Staff</option>
              {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Service</label>
            <select 
              value={serviceId} 
              onChange={e => setServiceId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              required
            >
              <option value="">Select Service</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount ($)</label>
            <input 
              type="number" 
              value={amount} 
              onChange={e => setAmount(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              required
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tip ($)</label>
            <input 
              type="number" 
              value={tip} 
              onChange={e => setTip(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              min="0"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Manual Ticket ID (Stub)</label>
          <input 
            type="text" 
            value={ticketId} 
            onChange={e => setTicketId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            required
          />
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Products Used / Sold</h3>
          <div className="flex gap-2 mb-4">
            <select 
              id="product-select"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            >
              <option value="">Add Product...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stock: {p.stockQty}) {p.stockQty <= p.lowStockThreshold ? '⚠️ LOW' : ''}
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
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Add
            </button>
          </div>
          
          {selectedProducts.length > 0 && (
            <ul className="space-y-2">
              {selectedProducts.map(sp => {
                const p = products.find(prod => prod.id === sp.productId);
                return (
                  <li key={sp.productId} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                    <span>{p?.name} (x{sp.quantity})</span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveProduct(sp.productId)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <button 
          type="submit" 
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Complete & Record
        </button>
      </form>

      <div className="mt-8 border-t pt-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Current Inventory Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.id} className={`p-4 rounded-lg border ${p.stockQty <= p.lowStockThreshold ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
              <div className="font-medium text-gray-900">{p.name}</div>
              <div className={`text-2xl font-bold ${p.stockQty <= p.lowStockThreshold ? 'text-red-600' : 'text-green-600'}`}>
                {p.stockQty}
              </div>
              {p.stockQty <= p.lowStockThreshold && (
                <div className="text-sm text-red-600 mt-1 flex items-center">
                  ⚠️ Low Stock Alert
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
