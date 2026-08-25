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

type View = 'booking' | 'ticket';

function App() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [view, setView] = useState<View>('booking');

  const handleTicketCreated = (id: string) => { setTicketId(id); setView('ticket'); };
  const resetTicket = () => { setTicketId(null); setView('booking'); };

  return (
    <div className="customer-app" dir="rtl">
      <div className="customer-frame">
        {customer && <header className="mobile-appbar"><div className="mobile-appbar-title"><div className="mobile-appbar-icon"><Icon name="scissors" size={19} /></div><div><h1>{view === 'ticket' ? 'تذكرتي' : 'حجز دور'}</h1><p>صالون الحلاقة</p></div></div>{view === 'ticket' && <button className="mobile-icon-button" onClick={() => setView('booking')} aria-label="العودة إلى الحجز"><Icon name="arrow-left" size={20} /></button>}</header>}
        {!customer && <header className="mobile-appbar"><div className="mobile-appbar-title"><div className="mobile-appbar-icon"><Icon name="scissors" size={19} /></div><div><h1>صالون الحلاقة</h1><p>احجز دورك من هاتفك</p></div></div></header>}
        <main className="mobile-content">
          {!customer ? <LoginScreen onLogin={(id, name, phone) => setCustomer({ id, name, phone })} /> : view === 'ticket' && ticketId ? <TrackTicketScreen ticketId={ticketId} queueUseCases={queueUseCases} onReset={resetTicket} /> : <JoinQueueScreen customer={customer} queueUseCases={queueUseCases} staffRepo={staffRepo} serviceRepo={serviceRepo} settingsRepo={settingsRepo} ticketRepo={ticketRepo} onTicketCreated={handleTicketCreated} />}
        </main>
        {customer && <nav className="mobile-bottom-nav" aria-label="التنقل"><button className={view === 'booking' ? 'active' : ''} onClick={() => setView('booking')}><span><Icon name="scissors" size={17} />حجز جديد</span></button><button className={view === 'ticket' && ticketId ? 'active' : ''} onClick={() => ticketId && setView('ticket')} disabled={!ticketId}><span><Icon name="clock" size={17} />تذكرتي</span></button></nav>}
      </div>
    </div>
  );
}

export default App;
