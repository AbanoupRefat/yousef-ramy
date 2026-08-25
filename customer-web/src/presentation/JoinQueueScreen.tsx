import { useCallback, useEffect, useMemo, useState } from 'react';
import type { QueueManagementUseCases } from '../application/QueueManagementUseCases';
import type { IStaffRepo, IServiceRepo, IShopSettingsRepo, IQueueTicketRepo } from '../application/interfaces';
import type { Staff, Service } from '../../../shared/domain/entities';
import { supabase } from '../infrastructure/SupabaseClient';
import { Alert, Button, Icon, Panel, StatusBadge, EmptyState } from './components/UI';
import { LoadingSpinner } from './components/LoadingSpinner';

interface Props {
  customer: { id: string; name: string; phone: string | null };
  queueUseCases: QueueManagementUseCases;
  staffRepo: IStaffRepo;
  serviceRepo: IServiceRepo;
  settingsRepo: IShopSettingsRepo;
  ticketRepo: IQueueTicketRepo;
  onTicketCreated: (ticketId: string) => void;
}

type HeroStat = { queueDepth: number; etaSeconds: number };

const formatEta = (seconds?: number) => {
  if (seconds === undefined) return 'جارٍ الحساب';
  if (seconds <= 0) return 'متاح الآن';
  return `حوالي ${Math.ceil(seconds / 60)} دقيقة`;
};

export function JoinQueueScreen({ customer, queueUseCases, staffRepo, serviceRepo, settingsRepo, ticketRepo, onTicketCreated }: Props) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [heroStats, setHeroStats] = useState<Record<string, HeroStat>>({});
  const [selStaffId, setSelStaffId] = useState('');
  const [selServiceId, setSelServiceId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(customer.phone || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(true);
  const [reservationsUsed, setReservationsUsed] = useState(0);

  const fetchSettingsAndLimits = useCallback(async () => {
    try {
      const settings = await settingsRepo.getSettings();
      setIsAccepting(settings.queueAcceptingRemote);
      const activeCount = await ticketRepo.countForCustomerToday(customer.id, ['active']);
      const declinedCount = await ticketRepo.countForCustomerToday(customer.id, ['declined']);
      setReservationsUsed(activeCount + declinedCount);
    } catch (err) {
      console.error(err);
    }
  }, [customer.id, settingsRepo, ticketRepo]);

  useEffect(() => {
    Promise.all([
      staffRepo.getAll().then((items) => setStaff(items.filter((item) => item.role === 'hero'))),
      serviceRepo.getAll().then(setServices),
    ]).finally(() => setInitialLoading(false));
    const initialRefresh = window.setTimeout(() => { void fetchSettingsAndLimits(); }, 0);
    const channel = supabase.channel('shop_settings_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'shop_settings' }, fetchSettingsAndLimits).subscribe();
    return () => { supabase.removeChannel(channel); window.clearTimeout(initialRefresh); };
  }, [staffRepo, serviceRepo, fetchSettingsAndLimits]);

  useEffect(() => {
    if (!selServiceId || staff.length === 0) return;
    let cancelled = false;
    const loadStats = async () => {
      const stats: Record<string, HeroStat> = {};
      for (const hero of staff) {
        const queue = await queueUseCases.getQueueForStaff(hero.id);
        const { data: duration } = await supabase.from('staff_service_durations').select('rolling_avg_seconds').eq('staff_id', hero.id).eq('service_id', selServiceId).single();
        const average = duration?.rolling_avg_seconds || 15 * 60;
        stats[hero.id] = { queueDepth: queue.length, etaSeconds: queue.length * average };
      }
      if (!cancelled) setHeroStats(stats);
    };
    loadStats();
    return () => { cancelled = true; };
  }, [selServiceId, staff, queueUseCases]);

  const nextAvailableHeroId = useMemo(() => {
    const entries = Object.entries(heroStats);
    if (!entries.length) return null;
    return entries.sort(([, a], [, b]) => a.etaSeconds - b.etaSeconds)[0][0];
  }, [heroStats]);

  const selectedHeroName = selStaffId === 'next-available' ? 'أسرع حلاق متاح' : staff.find((hero) => hero.id === selStaffId)?.name;
  const selectedServiceName = services.find((service) => service.id === selServiceId)?.name;
  const limitReached = reservationsUsed >= 2;

  const handleJoin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!selServiceId || !selStaffId) {
      setError('اختر الخدمة والحلاق قبل تأكيد الحجز.');
      return;
    }
    const targetHeroId = selStaffId === 'next-available' ? nextAvailableHeroId : selStaffId;
    if (!targetHeroId) {
      setError('لا توجد معلومات كافية عن وقت الانتظار الآن. اختر حلاقاً محدداً وحاول مرة أخرى.');
      return;
    }
    setLoading(true);
    try {
      const ticket = await queueUseCases.joinQueue(customer.id, selServiceId, targetHeroId, phoneNumber);
      onTicketCreated(ticket.id);
    } catch (err: any) {
      setError(err.message || 'تعذر تأكيد الحجز. تحقق من البيانات وحاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <LoadingSpinner />;
  if (!isAccepting) return <div className="login-page"><EmptyState title="الحجز الإلكتروني مغلق حالياً" description="الصالون ممتلئ الآن ولا يستقبل حجوزات جديدة عن بُعد. يمكنك زيارتنا حضورياً أو المحاولة لاحقاً." /></div>;

  return (
    <div>
      <div className="welcome-bar"><div><div className="welcome-label">مرحباً بعودتك</div><div className="welcome-name">{customer.name}</div></div><StatusBadge tone={limitReached ? 'warning' : 'neutral'}>{reservationsUsed}/2 حجوزات اليوم</StatusBadge></div>
      <div className="page-intro"><div className="eyebrow">حجز دور جديد</div><h1 className="page-title">احجز مكانك في الدور</h1><p className="page-description">اختر الخدمة والحلاق، وسنخبرك بالوقت المتوقع قبل أن تؤكد.</p></div>
      <div className="progress-line" aria-label="تقدم الحجز"><span style={{ width: `${selServiceId ? (selStaffId ? '100%' : '66%') : '33%'}` }} /></div>
      {error && <Alert>{error}</Alert>}
      {limitReached ? <Panel><EmptyState title="اكتملت حجوزاتك اليوم" description="يمكنك استخدام الحجز الإلكتروني مرتين يومياً. عد غداً لحجز دور جديد." /></Panel> : (
        <form className="form-stack" onSubmit={handleJoin}>
          <div className="step"><div className="step-heading"><span className="step-number">01</span><h2 className="step-title">اختر الخدمة</h2></div><div className="choice-list">{services.map((service) => <button type="button" key={service.id} className={`choice ${selServiceId === service.id ? 'selected' : ''}`} onClick={() => { setSelServiceId(service.id); setSelStaffId(''); }}><span className="choice-main"><span className="choice-title">{service.name}</span><span className="choice-subtitle">خدمة حلاقة داخل الصالون</span></span><span className="choice-check">{selServiceId === service.id && <Icon name="check" size={14} />}</span></button>)}</div></div>
          {selServiceId && <div className="step"><div className="step-heading"><span className="step-number">02</span><h2 className="step-title">اختر ما يناسبك</h2></div><div className="choice-list"><button type="button" className={`choice ${selStaffId === 'next-available' ? 'selected' : ''}`} onClick={() => setSelStaffId('next-available')}><span className="choice-main"><span className="choice-title">الأسرع لك</span><span className="choice-subtitle">نختار الحلاق صاحب أقصر وقت انتظار</span></span><span className="choice-meta"><Icon name="clock" size={16} />{formatEta(nextAvailableHeroId ? heroStats[nextAvailableHeroId]?.etaSeconds : undefined)}</span></button>{staff.map((hero) => { const stat = heroStats[hero.id]; return <button type="button" key={hero.id} className={`choice ${selStaffId === hero.id ? 'selected' : ''}`} onClick={() => setSelStaffId(hero.id)}><span className="choice-main"><span className="choice-title">{hero.name}</span><span className="choice-subtitle">{stat ? `${stat.queueDepth} ${stat.queueDepth === 1 ? 'شخص' : 'أشخاص'} قبلك` : 'نحسب وقت الانتظار الآن'}</span></span><span className="choice-meta"><Icon name="clock" size={16} />{formatEta(stat?.etaSeconds)}</span></button>; })}</div></div>}
          {selServiceId && selStaffId && <Panel><div className="step"><div className="step-heading"><span className="step-number">03</span><h2 className="step-title">رقم للتواصل وإعادة فتح التذكرة</h2></div><div className="form-group"><label className="form-label" htmlFor="customer-phone">رقم الهاتف</label><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span className="status-badge status-neutral" dir="ltr">+20</span><input id="customer-phone" className="text-input" type="tel" inputMode="numeric" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="01012345678" dir="ltr" aria-describedby="phone-hint" /></div><div className="form-hint" id="phone-hint">سنستخدمه لمساعدتك على العودة إلى تذكرتك إذا أغلقت الصفحة.</div></div></div></Panel>}
          {selServiceId && selStaffId && <Panel><div className="ui-panel-header"><div><h2 className="ui-panel-title">راجع الحجز</h2><p className="ui-panel-note">تأكد من التفاصيل قبل دخول الدور.</p></div><Icon name="check" size={22} color="#7a452d" /></div><div className="summary-list"><div className="summary-row"><span className="summary-label">الخدمة</span><span className="summary-value">{selectedServiceName}</span></div><div className="summary-row"><span className="summary-label">الاختيار</span><span className="summary-value">{selectedHeroName}</span></div><div className="summary-row"><span className="summary-label">الحجوزات المتبقية اليوم</span><span className="summary-value">{2 - reservationsUsed}</span></div></div><div className="action-footer"><Button type="submit" className="ui-button-wide" disabled={loading}>{loading ? 'جارٍ تأكيد دورك…' : 'تأكيد ودخول الدور'}</Button></div></Panel>}
        </form>
      )}
    </div>
  );
}
