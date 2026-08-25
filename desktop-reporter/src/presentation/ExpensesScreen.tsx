import React, { useState, useEffect } from 'react';
import { RecordExpense } from '../application/RecordExpense';
import type { IExpenseRepo } from '../application/interfaces';
import type { Expense } from '../../../shared/domain/entities';

interface Props {
  recordExpenseUseCase: RecordExpense;
  expenseRepo: IExpenseRepo;
}

export function ExpensesScreen({ recordExpenseUseCase, expenseRepo }: Props) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const loadExpenses = async () => {
    const exps = await expenseRepo.getExpensesForDay(new Date());
    setExpenses(exps);
  };

  useEffect(() => {
    loadExpenses();
  }, [expenseRepo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await recordExpenseUseCase.execute(description, parseFloat(amount));
      setDescription('');
      setAmount('');
      await loadExpenses();
      alert('تم تسجيل المصروف بنجاح!');
    } catch (err: any) {
      alert(`خطأ أثناء تسجيل المصروف: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 dir-rtl text-right font-sans" dir="rtl">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 border-b pb-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">تسجيل المصروفات والمنصرف</h2>
            <p className="text-sm text-gray-500">إضافة المصاريف التشغيلية اليومية للصالون</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">وصف المصروف / البند</label>
              <input 
                type="text" 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                className="block w-full rounded-xl border-gray-200 bg-gray-50 shadow-sm focus:border-rose-500 focus:ring-rose-500 text-sm p-3 border"
                required
                placeholder="مثال: إيجار، أدوات نظافة، كهرباء، صيانة"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ ($)</label>
              <input 
                type="number" 
                value={amount} 
                onChange={e => setAmount(e.target.value)}
                className="block w-full rounded-xl border-gray-200 bg-gray-50 shadow-sm focus:border-rose-500 focus:ring-rose-500 text-sm p-3 border"
                required
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>
          <button 
            type="submit" 
            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all focus:outline-none"
          >
            حفظ المصروف
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">مصروفات اليوم</h3>
        {expenses.length === 0 ? (
          <p className="text-gray-400 text-sm italic">لم يتم تسجيل أي مصروفات اليوم.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">الوقت</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">البيان / الوصف</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">المبلغ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {expenses.map(e => (
                  <tr key={e.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(e.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                      {e.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-rose-600 font-extrabold text-left">
                      ${Number(e.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
