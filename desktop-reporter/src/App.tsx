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
import { PostgresTransactionRepo, PostgresProductRepo, PostgresQueueTicketRepo, PostgresExpenseRepo, PostgresStaffRepo, PostgresBonusTypeRepo, PostgresServiceRepo, PostgresStaffServiceDurationRepo, PostgresShopSettingsRepo } from './infrastructure/PostgresRepos';
import { Icon } from './presentation/components/OperatorUI';

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
const navItems: { key: Tab; label: string; icon: 'queue' | 'receipt' | 'wallet' | 'chart' | 'star' }[] = [
  { key: 'queue', label: 'الدور', icon: 'queue' },
  { key: 'receipts', label: 'الفواتير والمخزون', icon: 'receipt' },
  { key: 'expenses', label: 'المصروفات', icon: 'wallet' },
  { key: 'reports', label: 'التقارير', icon: 'chart' },
  { key: 'bonus', label: 'الحوافز', icon: 'star' },
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('queue');
  return (
    <div className="operator-app" dir="rtl">
      <header className="operator-header">
        <div className="operator-header-inner">
          <div className="operator-brand"><div className="operator-brand-mark"><Icon name="scissors" size={22} /></div><div><div className="operator-brand-title">صالون الحلاقة</div><div className="operator-brand-subtitle">مساحة العمل اليومية</div></div></div>
          <nav className="operator-nav" aria-label="الأقسام الرئيسية">{navItems.map((item) => <button key={item.key} className={activeTab === item.key ? 'active' : ''} onClick={() => setActiveTab(item.key)}><Icon name={item.icon} size={17} />{item.label}</button>)}</nav>
        </div>
      </header>
      <main className="operator-main">
        {activeTab === 'queue' && <QueueManagementScreen queueUseCases={queueUseCases} staffRepo={staffRepo} serviceRepo={serviceRepo} />}
        {activeTab === 'receipts' && <ReceiptEntryScreen recordTransactionUseCase={recordTransaction} recordExpenseUseCase={recordExpense} productRepo={productRepo} staffRepo={staffRepo} serviceRepo={serviceRepo} />}
        {activeTab === 'expenses' && <ExpensesScreen recordExpenseUseCase={recordExpense} expenseRepo={expenseRepo} />}
        {activeTab === 'reports' && <DailyReportScreen generateDailyReportUseCase={generateDailyReport} computeBonusUseCase={computeBonus} staffRepo={staffRepo} />}
        {activeTab === 'bonus' && <BonusConfigScreen updateBonusTypeUseCase={updateBonusType} computeBonusUseCase={computeBonus} staffRepo={staffRepo} bonusTypeRepo={bonusTypeRepo} />}
      </main>
    </div>
  );
}

export default App;
