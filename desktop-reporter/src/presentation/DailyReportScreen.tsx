import React, { useState, useEffect } from 'react';
import { GenerateDailyReport, DailyReport } from '../application/GenerateDailyReport';

interface Props {
  generateDailyReportUseCase: GenerateDailyReport;
}

export function DailyReportScreen({ generateDailyReportUseCase }: Props) {
  const [report, setReport] = useState<DailyReport | null>(null);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const loadReport = async () => {
    try {
      const result = await generateDailyReportUseCase.execute(new Date(date));
      setReport(result);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadReport();
  }, [date]);

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-md space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Daily Report</h2>
        <input 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
        />
      </div>

      {report ? (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-sm text-green-800 font-medium uppercase tracking-wide">Total Income</div>
              <div className="text-3xl font-bold text-green-700">${report.totalIncome.toFixed(2)}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="text-sm text-red-800 font-medium uppercase tracking-wide">Total Outcome</div>
              <div className="text-3xl font-bold text-red-700">${report.totalOutcome.toFixed(2)}</div>
            </div>
            <div className={`p-4 rounded-lg border ${report.netTotal >= 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
              <div className="text-sm font-medium uppercase tracking-wide opacity-80">Net Total</div>
              <div className="text-3xl font-bold">${report.netTotal.toFixed(2)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3 border-b pb-2">Income (Transactions)</h3>
              {report.transactions.length === 0 ? (
                <p className="text-gray-500 italic">No transactions today</p>
              ) : (
                <ul className="space-y-3">
                  {report.transactions.map(t => (
                    <li key={t.id} className="flex justify-between p-3 bg-gray-50 rounded border border-gray-100">
                      <div>
                        <div className="font-medium">Ticket: {t.ticketId}</div>
                        <div className="text-sm text-gray-500">Tip: ${Number(t.tip).toFixed(2)}</div>
                      </div>
                      <div className="font-bold text-green-600">${Number(t.amount).toFixed(2)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3 border-b pb-2">Outcome (Expenses)</h3>
              {report.expenses.length === 0 ? (
                <p className="text-gray-500 italic">No expenses today</p>
              ) : (
                <ul className="space-y-3">
                  {report.expenses.map(e => (
                    <li key={e.id} className="flex justify-between p-3 bg-gray-50 rounded border border-gray-100">
                      <div>
                        <div className="font-medium">{e.description}</div>
                      </div>
                      <div className="font-bold text-red-600">${Number(e.amount).toFixed(2)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-500">Loading report...</p>
      )}
    </div>
  );
}
