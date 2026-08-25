import { useState } from 'react';
import { JoinQueueScreen } from './presentation/JoinQueueScreen';
import { TrackTicketScreen } from './presentation/TrackTicketScreen';
import { LoginScreen } from './presentation/LoginScreen';
import { QueueManagementUseCases } from './application/QueueManagementUseCases';
import { Button, Icon, Panel } from './presentation/components/UI';
import { supabase } from './infrastructure/SupabaseClient';
import { PostgresQueueTicketRepo, PostgresShopSettingsRepo, PostgresStaffServiceDurationRepo, PostgresStaffRepo, PostgresServiceRepo } from './infrastructure/PostgresRepos';

const ticketRepo = new PostgresQueueTicketRepo();
const settingsRepo = new PostgresShopSettingsRepo();
const durationRepo = new PostgresStaffServiceDurationRepo();
const staffRepo = new PostgresStaffRepo();
const serviceRepo = new PostgresServiceRepo();
const queueUseCases = new QueueManagementUseCases(ticketRepo, settingsRepo, durationRepo);

type Customer = { id: string; name: string; phone: string | null };
type View = 'booking' | 'ticket';

function EmptyTicketView({ onStartBooking }: { onStartBooking: () => void }) {
  return <div className="mobile-screen empty-ticket-screen"><div className="empty-ticket-icon"><Icon name="clock" size={28} /></div><div className="mobile-screen-header"><div className="mobile-kicker">تذكرتي</div><h2>لا يوجد حجز نشط</h2><p>عندما تحجز دورك ستجد رقم التذكرة ووقت الانتظار هنا، ويمكنك العودة إليها من أي وقت.</p></div><Panel><div className="empty-ticket-guide"><div className="empty-ticket-guide-row"><span className="empty-ticket-step">1</span><span>اختر الخدمة المناسبة</span></div><div className="empty-ticket-guide-row"><span className="empty-ticket-step">2</span><span>اختر الحلاق أو أسرع دور متاح</span></div><div className="empty-ticket-guide-row"><span className="empty-ticket-step">3</span><span>تابع مكانك من شاشة تذكرتي</span></div></div></Panel><Button className="ui-button-wide" onClick={onStartBooking}>ابدأ الحجز</Button></div>;
}

function App() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [view, setView] = useState<View>('booking');
  const [signingOut, setSigningOut] = useState(false);

  const handleTicketCreated = (id: string) => { setTicketId(id); setView('ticket'); };
  const resetTicket = () => { setTicketId(null); setView('booking'); };
  const handleSignOut = async () => { setSigningOut(true); await supabase.auth.signOut(); setCustomer(null); setTicketId(null); setView('booking'); setSigningOut(false); };

  return (
    <div className="customer-app" dir="rtl">
      <div className="customer-frame">
        <header className="mobile-appbar">
          <div className="mobile-appbar-title"><div className="mobile-appbar-icon"><Icon name="scissors" size={19} /></div><div><h1>{customer ? view === 'ticket' ? 'تذكرتي' : 'حجز دور' : 'صالون الحلاقة'}</h1><p>{customer ? 'احجز، ثم تابع دورك من هاتفك' : 'احجز دورك من هاتفك'}</p></div></div>
          {customer && <button className="mobile-signout-button" onClick={handleSignOut} disabled={signingOut} aria-label="تسجيل الخروج"><Icon name="logout" size={17} /> تسجيل الخروج</button>}
        </header>
        <main className="mobile-content">
          {!customer ? <LoginScreen onLogin={(id, name, phone) => setCustomer({ id, name, phone })} /> : view === 'ticket' && ticketId ? <TrackTicketScreen ticketId={ticketId} queueUseCases={queueUseCases} onReset={resetTicket} /> : view === 'ticket' ? <EmptyTicketView onStartBooking={() => setView('booking')} /> : <JoinQueueScreen customer={customer} queueUseCases={queueUseCases} staffRepo={staffRepo} serviceRepo={serviceRepo} settingsRepo={settingsRepo} ticketRepo={ticketRepo} onTicketCreated={handleTicketCreated} />}
        </main>
        {customer && <nav className="mobile-bottom-nav" aria-label="التنقل"><button className={view === 'booking' ? 'active' : ''} onClick={() => setView('booking')}><span><Icon name="scissors" size={17} />حجز جديد</span></button><button className={view === 'ticket' ? 'active' : ''} onClick={() => setView('ticket')}><span><Icon name="clock" size={17} />تذكرتي</span></button></nav>}
      </div>
    </div>
  );
}

export default App;
