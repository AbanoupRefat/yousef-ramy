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

  const tabClass = (tab: Tab) => `px-4 py-2 rounded-lg text-sm font-bold transition-all ${
    activeTab === tab ? 'bg-white text-indigo-900 shadow-sm' : 'text-indigo-100 hover:bg-indigo-700/50'
  }`;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans dir-rtl" dir="rtl">
      <header className="bg-indigo-900 text-white shadow-md border-b border-indigo-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between h-auto md:h-20 items-center py-3 md:py-0 gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💈</span>
              <h1 className="text-xl font-black tracking-wide">نظام إدارة صالون الحلاقة والدور</h1>
            </div>
            <nav className="flex flex-wrap gap-2 justify-center">
              <button onClick={() => setActiveTab('queue')} className={tabClass('queue')}>
                📋 إدارة الدور والانتظار
              </button>
              <button onClick={() => setActiveTab('receipts')} className={tabClass('receipts')}>
                🧾 تسجيل فاتورة / خدمة
              </button>
              <button onClick={() => setActiveTab('expenses')} className={tabClass('expenses')}>
                💸 المصروفات
              </button>
              <button onClick={() => setActiveTab('reports')} className={tabClass('reports')}>
                📊 التقرير اليومي
              </button>
              <button onClick={() => setActiveTab('bonus')} className={tabClass('bonus')}>
                ⭐ إعدادات الحوافز والنسب
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
