import { useState, useEffect } from 'react';
import { GenerateDailyReport, type DailyReport } from '../application/GenerateDailyReport';
import { ComputeBonus } from '../application/ComputeBonus';
import type { IStaffRepo } from '../application/interfaces';

interface Props {
  generateDailyReportUseCase: GenerateDailyReport;
  computeBonusUseCase: ComputeBonus;
  staffRepo: IStaffRepo;
}

export function DailyReportScreen({ generateDailyReportUseCase, computeBonusUseCase, staffRepo }: Props) {
  const [report, setReport] = useState<DailyReport | null>(null);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [staffBonuses, setStaffBonuses] = useState<{staffName: string, amount: number}[]>([]);

  const loadReport = async () => {
    try {
      const d = new Date(date);
      const result = await generateDailyReportUseCase.execute(d);
      setReport(result);

      const allStaff = await staffRepo.getAll();
      const bonuses: {staffName: string, amount: number}[] = [];
      for (const staff of allStaff) {
        const bonusAmount = await computeBonusUseCase.execute(staff.id, d);
        if (bonusAmount > 0) {
          bonuses.push({ staffName: staff.name, amount: bonusAmount });
        }
      }
      setStaffBonuses(bonuses);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadReport();
  }, [date]);

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 space-y-6 dir-rtl text-right font-sans" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">التقرير المالي اليومي</h2>
            <p className="text-sm text-gray-500">ملخص الإيرادات، المصروفات، والأرباح الصافية</p>
          </div>
        </div>
        <input 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border-gray-200 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2.5 border font-bold text-gray-800"
        />
      </div>

      {report ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
              <div className="text-xs text-emerald-800 font-bold uppercase tracking-wider mb-1">إجمالي الإيرادات (الدخل)</div>
              <div className="text-3xl font-black text-emerald-700">${report.totalIncome.toFixed(2)}</div>
            </div>
            <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100">
              <div className="text-xs text-rose-800 font-bold uppercase tracking-wider mb-1">إجمالي المصروفات (المنصرف)</div>
              <div className="text-3xl font-black text-rose-700">${report.totalOutcome.toFixed(2)}</div>
            </div>
            <div className={`p-5 rounded-2xl border ${report.netTotal >= 0 ? 'bg-indigo-50 border-indigo-100 text-indigo-900' : 'bg-amber-50 border-amber-100 text-amber-900'}`}>
              <div className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">الربح الصافي الحقيقي</div>
              <div className="text-3xl font-black">${(report.netTotal - staffBonuses.reduce((sum, b) => sum + b.amount, 0)).toFixed(2)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-3 border-b pb-2">فواتير الدخل (المبيعات)</h3>
              {report.transactions.length === 0 ? (
                <p className="text-gray-400 text-sm italic">لا توجد عمليات مبيعات لهذا اليوم.</p>
              ) : (
                <ul className="space-y-3">
                  {report.transactions.map(t => (
                    <li key={t.id} className="flex justify-between items-center p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                      <div>
                        <div className="font-bold text-gray-900">فاتورة رقم: {t.ticketId}</div>
                        <div className="text-xs text-gray-500">إكرامية: ${Number(t.tip).toFixed(2)}</div>
                      </div>
                      <div className="font-black text-emerald-600 text-base">${Number(t.amount).toFixed(2)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-3 border-b pb-2">سجل المصروفات</h3>
                {report.expenses.length === 0 ? (
                  <p className="text-gray-400 text-sm italic">لا توجد مصروفات لهذا اليوم.</p>
                ) : (
                  <ul className="space-y-3">
                    {report.expenses.map(e => (
                      <li key={e.id} className="flex justify-between items-center p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="font-bold text-gray-800">{e.description}</div>
                        <div className="font-black text-rose-600 text-base">${Number(e.amount).toFixed(2)}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-3 border-b pb-2">مستحقات حوافز الحلاقين</h3>
                {staffBonuses.length === 0 ? (
                  <p className="text-gray-400 text-sm italic">لا توجد حوافز مستحقة لهذا اليوم.</p>
                ) : (
                  <ul className="space-y-3">
                    {staffBonuses.map(b => (
                      <li key={b.staffName} className="flex justify-between items-center p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
                        <div className="font-bold text-indigo-950">{b.staffName}</div>
                        <div className="font-black text-indigo-700 text-base">${Number(b.amount).toFixed(2)}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-400 text-sm">جاري تحميل التقرير...</p>
      )}
    </div>
  );
}
