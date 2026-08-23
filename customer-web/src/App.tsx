import React, { useState } from 'react';
import { JoinQueueScreen } from './presentation/JoinQueueScreen';
import { TrackTicketScreen } from './presentation/TrackTicketScreen';
import { QueueManagementUseCases } from './application/QueueManagementUseCases';
import { 
  PostgresQueueTicketRepo, 
  PostgresShopSettingsRepo,
  PostgresStaffServiceDurationRepo,
  PostgresStaffRepo,
  PostgresServiceRepo
} from './infrastructure/PostgresRepos';

const ticketRepo = new PostgresQueueTicketRepo();
const settingsRepo = new PostgresShopSettingsRepo();
const durationRepo = new PostgresStaffServiceDurationRepo();
const staffRepo = new PostgresStaffRepo();
const serviceRepo = new PostgresServiceRepo();

const queueUseCases = new QueueManagementUseCases(ticketRepo, settingsRepo, durationRepo);

function App() {
  const [ticketId, setTicketId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <header className="bg-white shadow-sm py-4">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Barber Queue</h1>
        </div>
      </header>

      <main className="flex-1 w-full px-4 pb-8">
        {!ticketId ? (
          <JoinQueueScreen 
            queueUseCases={queueUseCases}
            staffRepo={staffRepo}
            serviceRepo={serviceRepo}
            settingsRepo={settingsRepo}
            onTicketCreated={setTicketId} 
          />
        ) : (
          <TrackTicketScreen 
            ticketId={ticketId} 
            queueUseCases={queueUseCases} 
            onReset={() => setTicketId(null)} 
          />
        )}
      </main>
    </div>
  );
}

export default App;
