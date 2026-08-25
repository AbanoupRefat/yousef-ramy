import { useState } from 'react';
import type { Staff } from '../../shared/domain/entities';
import { JoinQueueScreen } from './presentation/JoinQueueScreen';
import { TrackTicketScreen } from './presentation/TrackTicketScreen';
import { LoginScreen } from './presentation/LoginScreen';
import { StaffLoginScreen } from './presentation/StaffLoginScreen';
import { StaffControlCenterScreen } from './presentation/StaffControlCenterScreen';
import { QueueManagementUseCases } from './application/QueueManagementUseCases';
import { Icon } from './presentation/components/UI';
import { PostgresQueueTicketRepo, PostgresShopSettingsRepo, PostgresStaffServiceDurationRepo, PostgresStaffRepo, PostgresServiceRepo, PostgresStaffScheduleRepo } from './infrastructure/PostgresRepos';
import { supabase } from './infrastructure/SupabaseClient';

const ticketRepo = new PostgresQueueTicketRepo();
const settingsRepo = new PostgresShopSettingsRepo();
const durationRepo = new PostgresStaffServiceDurationRepo();
const staffRepo = new PostgresStaffRepo();
const serviceRepo = new PostgresServiceRepo();
const scheduleRepo = new PostgresStaffScheduleRepo();
const queueUseCases = new QueueManagementUseCases(ticketRepo, settingsRepo, durationRepo);

type Customer = { id: string; name: string; phone: string | null };
type View = 'booking' | 'ticket';
type LoginMode = 'customer' | 'staff';

function App() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [view, setView] = useState<View>('booking');
  const [loginMode, setLoginMode] = useState<LoginMode>('customer');

  const handleTicketCreated = (id: string) => { setTicketId(id); setView('ticket'); };
  const resetTicket = () => { setTicketId(null); setView('booking'); };
  const handleSignOut = async () => { await supabase.auth.signOut(); setCustomer(null); setStaff(null); setTicketId(null); setView('booking'); setLoginMode('customer'); };

  return (
    <div className="customer-app" dir="rtl">
      <div className="customer-frame">
        <header className="mobile-appbar">
          <div className="mobile-appbar-title"><div className="mobile-appbar-icon"><Icon name={staff ? 'user' : 'scissors'} size={19} /></div><div><h1>{staff ? `مساحة ${staff.name}` : customer ? view === 'ticket' ? 'تذكرتي' : 'حجز دور' : loginMode === 'staff' ? 'مساحة فريق الصالون' : 'صالون الحلاقة'}</h1><p>{staff ? 'مركز التحكم اليومي' : customer ? 'احجز، ثم تابع دورك من هاتفك' : loginMode === 'staff' ? 'دخول آمن للحلاقين' : 'احجز دورك من هاتفك'}</p></div></div>
          {(customer || staff) && <button className="mobile-signout-button" onClick={() => void handleSignOut} aria-label="تسجيل الخروج"><Icon name="logout" size={17} /> تسجيل الخروج</button>}
        </header>
        <main className="mobile-content">
          {staff ? <StaffControlCenterScreen staff={staff} queueUseCases={queueUseCases} ticketRepo={ticketRepo} serviceRepo={serviceRepo} scheduleRepo={scheduleRepo} onSignOut={() => void handleSignOut()} /> : !customer ? loginMode === 'staff' ? <StaffLoginScreen staffRepo={staffRepo} onLogin={setStaff} onBack={() => setLoginMode('customer')} /> : <LoginScreen onLogin={(id, name, phone) => setCustomer({ id, name, phone })} onStaffMode={() => setLoginMode('staff')} /> : view === 'ticket' && ticketId ? <TrackTicketScreen ticketId={ticketId} queueUseCases={queueUseCases} onReset={resetTicket} /> : view === 'ticket' ? <div className="mobile-screen"><div className="mobile-screen-header"><div className="mobile-kicker">تذكرتي</div><h2>لا يوجد حجز نشط</h2><p>عندما تحجز دورك ستجد رقم التذكرة ووقت الانتظار هنا.</p></div><button className="ui-button ui-button-primary ui-button-wide" onClick={() => setView('booking')}>ابدأ الحجز</button></div> : <JoinQueueScreen customer={customer} queueUseCases={queueUseCases} staffRepo={staffRepo} serviceRepo={serviceRepo} settingsRepo={settingsRepo} ticketRepo={ticketRepo} onTicketCreated={handleTicketCreated} />}
        </main>
        {customer && <nav className="mobile-bottom-nav" aria-label="التنقل"><button className={view === 'booking' ? 'active' : ''} onClick={() => setView('booking')}><span><Icon name="scissors" size={17} />حجز جديد</span></button><button className={view === 'ticket' ? 'active' : ''} onClick={() => setView('ticket')}><span><Icon name="clock" size={17} />تذكرتي</span></button></nav>}
      </div>
    </div>
  );
}

export default App;
