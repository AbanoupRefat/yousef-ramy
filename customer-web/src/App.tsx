import { useState } from 'react';
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
    <div className="min-h-screen bg-gray-50 flex justify-center font-sans">
      <div className="w-full max-w-[428px] bg-gray-50 min-h-screen flex flex-col relative shadow-xl">
        <header className="bg-primary shadow-md py-4 px-6 rounded-b-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm">
              BQ
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Barber Queue</h1>
          </div>
        </header>

        <main className="flex-1 w-full px-4 pb-8 overflow-y-auto">
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
    </div>
  );
}

export default App;
