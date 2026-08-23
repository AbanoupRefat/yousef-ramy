import React, { useState, useEffect } from 'react';
import { RecordExpense } from '../application/RecordExpense';
import type {  IExpenseRepo  } from '../application/interfaces';
import type {  Expense  } from '../../../shared/domain/entities';

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
      alert('Expense recorded successfully!');
    } catch (err: any) {
      alert(`Error recording expense: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Record Expense</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Description / Category</label>
              <input 
                type="text" 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
                required
                placeholder="e.g. Rent, Supplies, Electricity"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount ($)</label>
              <input 
                type="number" 
                value={amount} 
                onChange={e => setAmount(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <button 
            type="submit" 
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Record Expense (Outcome)
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mt-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Today's Expenses</h3>
        {expenses.length === 0 ? (
          <p className="text-gray-500 italic">No expenses recorded today.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map(e => (
                  <tr key={e.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(e.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {e.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-bold text-right">
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
