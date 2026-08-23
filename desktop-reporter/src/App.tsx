import React, { useState } from 'react';
import { ReceiptEntryScreen } from './presentation/ReceiptEntryScreen';
import { DailyReportScreen } from './presentation/DailyReportScreen';

import { RecordTransaction } from './application/RecordTransaction';
import { RecordProductUsage } from './application/RecordProductUsage';
import { CompleteAndAdvance } from './application/CompleteAndAdvance';
import { GenerateDailyReport } from './application/GenerateDailyReport';

import {
  InMemoryTransactionRepo,
  InMemoryProductRepo,
  InMemoryQueueTicketRepo,
  InMemoryExpenseRepo
} from './infrastructure/InMemoryRepos';

// Dependency Injection Setup (In-Memory Stubs)
const productRepo = new InMemoryProductRepo();
const transactionRepo = new InMemoryTransactionRepo();
const ticketRepo = new InMemoryQueueTicketRepo();
const expenseRepo = new InMemoryExpenseRepo();

const recordProductUsage = new RecordProductUsage(productRepo);
const completeAndAdvance = new CompleteAndAdvance(ticketRepo);
const recordTransaction = new RecordTransaction(transactionRepo, recordProductUsage, completeAndAdvance);
const generateDailyReport = new GenerateDailyReport(transactionRepo, expenseRepo);

function App() {
  const [activeTab, setActiveTab] = useState<'receipts' | 'reports'>('receipts');

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-indigo-600 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-white">Barber Reporter (Stub Mode)</h1>
            <nav className="flex space-x-4">
              <button
                onClick={() => setActiveTab('receipts')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'receipts' ? 'bg-indigo-800 text-white' : 'text-indigo-100 hover:bg-indigo-700'
                }`}
              >
                Receipt Entry
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'reports' ? 'bg-indigo-800 text-white' : 'text-indigo-100 hover:bg-indigo-700'
                }`}
              >
                Daily Report
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {activeTab === 'receipts' && (
          <ReceiptEntryScreen 
            recordTransactionUseCase={recordTransaction} 
            productRepo={productRepo} 
          />
        )}
        {activeTab === 'reports' && (
          <DailyReportScreen 
            generateDailyReportUseCase={generateDailyReport} 
          />
        )}
      </main>
    </div>
  );
}

export default App;
