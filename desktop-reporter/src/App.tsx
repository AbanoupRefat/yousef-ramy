import { useState } from 'react';
import { ReceiptEntryScreen } from './presentation/ReceiptEntryScreen';
import { DailyReportScreen } from './presentation/DailyReportScreen';
import { BonusConfigScreen } from './presentation/BonusConfigScreen';
import { ExpensesScreen } from './presentation/ExpensesScreen';
import { QueueManagementScreen } from './presentation/QueueManagementScreen';

import { RecordTransaction } from './application/RecordTransaction';
import { RecordProductUsage } from './application/RecordProductUsage';
import { CompleteAndAdvance } from './application/CompleteAndAdvance';
import { GenerateDailyReport } from './application/GenerateDailyReport';
import { ComputeBonus } from './application/ComputeBonus';
import { UpdateBonusType } from './application/UpdateBonusType';
import { RecordExpense } from './application/RecordExpense';
import { QueueManagementUseCases } from './application/QueueManagementUseCases';

import {
  PostgresTransactionRepo,
  PostgresProductRepo,
  PostgresQueueTicketRepo,
  PostgresExpenseRepo,
  PostgresStaffRepo,
  PostgresBonusTypeRepo,
  PostgresServiceRepo,
  PostgresStaffServiceDurationRepo,
  PostgresShopSettingsRepo
} from './infrastructure/PostgresRepos';

// Dependency Injection Setup (Supabase / Postgres)
const productRepo = new PostgresProductRepo();
const transactionRepo = new PostgresTransactionRepo();
const ticketRepo = new PostgresQueueTicketRepo();
const expenseRepo = new PostgresExpenseRepo();
const staffRepo = new PostgresStaffRepo();
const bonusTypeRepo = new PostgresBonusTypeRepo();
const serviceRepo = new PostgresServiceRepo();
const durationRepo = new PostgresStaffServiceDurationRepo();
const shopSettingsRepo = new PostgresShopSettingsRepo();

const recordProductUsage = new RecordProductUsage(productRepo);
const completeAndAdvance = new CompleteAndAdvance(ticketRepo, durationRepo);
const recordTransaction = new RecordTransaction(transactionRepo, recordProductUsage, completeAndAdvance);
const generateDailyReport = new GenerateDailyReport(transactionRepo, expenseRepo);
const computeBonus = new ComputeBonus(staffRepo, bonusTypeRepo, transactionRepo);
const updateBonusType = new UpdateBonusType(staffRepo, bonusTypeRepo);
const recordExpense = new RecordExpense(expenseRepo);
const queueUseCases = new QueueManagementUseCases(ticketRepo, shopSettingsRepo, durationRepo);

type Tab = 'receipts' | 'reports' | 'bonus' | 'expenses' | 'queue';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('queue');

  const tabClass = (tab: Tab) => `px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
    activeTab === tab ? 'bg-amber-500 text-gray-950 shadow-md' : 'text-slate-200 hover:bg-slate-800'
  }`;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans dir-rtl" dir="rtl">
      <header className="bg-slate-900 text-white shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between h-auto md:h-20 items-center py-3 md:py-0 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-xs">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div>
                <h1 className="text-lg font-black tracking-wide text-white">نظام إدارة صالون الحلاقة والخزنة</h1>
                <p className="text-xs text-amber-400/90 font-medium">لوحة التحكم التنفيذية وإدارة الأدوار والمخزون</p>
              </div>
            </div>
            <nav className="flex flex-wrap gap-2 justify-center">
              <button onClick={() => setActiveTab('queue')} className={tabClass('queue')}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                إدارة الدور والانتظار
              </button>
              <button onClick={() => setActiveTab('receipts')} className={tabClass('receipts')}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                تسجيل إيصال / فواتير
              </button>
              <button onClick={() => setActiveTab('expenses')} className={tabClass('expenses')}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                المصروفات
              </button>
              <button onClick={() => setActiveTab('reports')} className={tabClass('reports')}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                التقرير اليومي
              </button>
              <button onClick={() => setActiveTab('bonus')} className={tabClass('bonus')}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
                إعدادات الحوافز
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {activeTab === 'queue' && (
          <QueueManagementScreen 
            queueUseCases={queueUseCases}
            staffRepo={staffRepo}
            serviceRepo={serviceRepo}
          />
        )}
        {activeTab === 'receipts' && (
          <ReceiptEntryScreen 
            recordTransactionUseCase={recordTransaction} 
            recordExpenseUseCase={recordExpense}
            productRepo={productRepo}
            staffRepo={staffRepo} 
            serviceRepo={serviceRepo}
          />
        )}
        {activeTab === 'expenses' && (
          <ExpensesScreen 
            recordExpenseUseCase={recordExpense} 
            expenseRepo={expenseRepo} 
          />
        )}
        {activeTab === 'reports' && (
          <DailyReportScreen 
            generateDailyReportUseCase={generateDailyReport} 
            computeBonusUseCase={computeBonus}
            staffRepo={staffRepo}
          />
        )}
        {activeTab === 'bonus' && (
          <BonusConfigScreen 
            updateBonusTypeUseCase={updateBonusType} 
            computeBonusUseCase={computeBonus}
            staffRepo={staffRepo}
            bonusTypeRepo={bonusTypeRepo}
          />
        )}
      </main>
    </div>
  );
}

export default App;
