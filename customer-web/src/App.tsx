import { useState } from 'react';
import { JoinQueueScreen } from './presentation/JoinQueueScreen';
import { TrackTicketScreen } from './presentation/TrackTicketScreen';
import { LoginScreen } from './presentation/LoginScreen';
import { QueueManagementUseCases } from './application/QueueManagementUseCases';
import { Icon } from './presentation/components/UI';
import { PostgresQueueTicketRepo, PostgresShopSettingsRepo, PostgresStaffServiceDurationRepo, PostgresStaffRepo, PostgresServiceRepo } from './infrastructure/PostgresRepos';

const ticketRepo = new PostgresQueueTicketRepo();
const settingsRepo = new PostgresShopSettingsRepo();
const durationRepo = new PostgresStaffServiceDurationRepo();
const staffRepo = new PostgresStaffRepo();
const serviceRepo = new PostgresServiceRepo();
const queueUseCases = new QueueManagementUseCases(ticketRepo, settingsRepo, durationRepo);

type Customer = { id: string; name: string; phone: string | null };

function App() {
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);

  return (
    <div className="customer-app" dir="rtl">
      <div className="customer-frame">
        <header className="app-header">
          <div className="app-header-inner">
            <div className="brand-mark"><Icon name="scissors" size={22} /></div>
            <div>
              <div className="brand-name">صالون الحلاقة</div>
              <div className="brand-meta">دورك، بدون انتظار داخل الصالون</div>
            </div>
          </div>
        </header>
        <main className="app-main">
          {!customer ? (
            <LoginScreen onLogin={(id, name, phone) => setCustomer({ id, name, phone })} />
          ) : !ticketId ? (
            <JoinQueueScreen customer={customer} queueUseCases={queueUseCases} staffRepo={staffRepo} serviceRepo={serviceRepo} settingsRepo={settingsRepo} ticketRepo={ticketRepo} onTicketCreated={setTicketId} />
          ) : (
            <TrackTicketScreen ticketId={ticketId} queueUseCases={queueUseCases} onReset={() => setTicketId(null)} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
