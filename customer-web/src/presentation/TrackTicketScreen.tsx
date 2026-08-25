import { useEffect, useState } from 'react';
import type { QueueManagementUseCases } from '../application/QueueManagementUseCases';
import { supabase } from '../infrastructure/SupabaseClient';
import { Alert, Button, ConfirmDialog, EmptyState, Icon, Panel, StatusBadge } from './components/UI';
import { LoadingSpinner } from './components/LoadingSpinner';

interface Props { ticketId: string; queueUseCases: QueueManagementUseCases; onReset: () => void; }

const formatEta = (seconds: number) => seconds <= 0 ? 'دورك قريب جداً' : `حوالي ${Math.ceil(seconds / 60)} دقيقة`;

export function TrackTicketScreen({ ticketId, queueUseCases, onReset }: Props) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);

  const fetchStatus = async () => {
    try {
      const nextStatus = await queueUseCases.getQueueStatus(ticketId);
      setStatus(nextStatus);
      setLastUpdated(new Date());
      setLoadError(null);
    } catch (err) {
      console.error(err);
      setLoadError('تعذر تحديث حالة التذكرة الآن. سنحاول مرة أخرى تلقائياً.');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchStatus();
    const channel = supabase.channel('queue_tracking').on('postgres_changes', { event: '*', schema: 'public', table: 'queue_tickets' }, fetchStatus).subscribe();
    const interval = window.setInterval(fetchStatus, 30000);
    return () => { supabase.removeChannel(channel); window.clearInterval(interval); };
  }, [ticketId]);

  const handleDecline = async () => {
    setCancelBusy(true);
    try { await queueUseCases.declineReservation(ticketId); onReset(); }
    catch (err) { console.error(err); setLoadError('تعذر إلغاء الحجز. حاول مرة أخرى.'); setConfirmOpen(false); }
    finally { setCancelBusy(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (!status) return <div className="login-page">{loadError && <Alert>{loadError}</Alert>}<EmptyState title="لم نعثر على هذه التذكرة" description="قد تكون التذكرة أُغلقت أو انتهت. عد إلى البداية لإنشاء حجز جديد." action={<Button variant="secondary" onClick={onReset}>العودة إلى الحجز</Button>} /></div>;

  const { position, etaSeconds, status: ticketStatus } = status;
  const isDone = ticketStatus === 'done';
  const isReady = position === 0 && ticketStatus === 'with_hero';
  const statusLabel = isReady ? 'حان دورك' : isDone ? 'اكتملت الخدمة' : 'أنت في الدور';

  if (isDone) return <div className="login-page"><div className="track-hero"><StatusBadge tone="success"><Icon name="check" size={15} /> اكتملت الخدمة</StatusBadge><div className="ticket-number">شكراً</div><p className="track-status">تم إنهاء خدمتك بنجاح</p><p className="track-subtitle">نتمنى أن نراك مرة أخرى قريباً.</p></div><Button onClick={onReset} className="ui-button-wide">حجز دور جديد</Button></div>;

  return (
    <div>
      <div className="page-intro"><div className="eyebrow">متابعة التذكرة</div><h1 className="page-title">{statusLabel}</h1><p className="page-description">نحدّث حالتك تلقائياً، ولا تحتاج إلى إبقاء الصفحة مفتوحة طوال الوقت.</p></div>
      {loadError && <Alert tone="info">{loadError}</Alert>}
      <Panel className="track-hero"><StatusBadge tone={isReady ? 'success' : 'warning'}><Icon name={isReady ? 'check' : 'clock'} size={15} /> {isReady ? 'الحلاق بانتظارك' : 'التذكرة نشطة'}</StatusBadge><div className="ticket-number" dir="ltr">#{position}</div><p className="track-status">{isReady ? 'توجه إلى كرسي الحلاقة الآن' : position === 1 ? 'أنت التالي بعد الحلاق الحالي' : `يوجد ${position} أشخاص قبلك`}</p><p className="track-subtitle">{isReady ? 'لا تتأخر حتى لا تفقد دورك.' : formatEta(etaSeconds)}</p></Panel>
      <Panel><div className="ui-panel-header"><div><h2 className="ui-panel-title">تفاصيل دورك</h2><p className="ui-panel-note">آخر تحديث: {lastUpdated ? lastUpdated.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : 'الآن'}</p></div><Icon name="clock" size={22} color="#7a452d" /></div><div className="summary-list"><div className="summary-row"><span className="summary-label">رقم التذكرة</span><span className="summary-value" dir="ltr">{ticketId.split('-')[0]}</span></div><div className="summary-row"><span className="summary-label">الحالة</span><span className="summary-value">{isReady ? 'على الكرسي الآن' : 'في الانتظار'}</span></div></div></Panel>
      <Panel><div className="ui-panel-header"><div><h2 className="ui-panel-title">ماذا بعد؟</h2><p className="ui-panel-note">يمكنك مغادرة الصفحة والعودة من نفس الجهاز عندما يقترب دورك. سنواصل تحديث التذكرة تلقائياً.</p></div><Icon name="info" size={22} color="#7a452d" /></div><div className="track-actions"><Button variant="secondary" onClick={fetchStatus}><Icon name="refresh" size={17} /> تحديث الآن</Button>{!isReady && <Button variant="quiet" onClick={() => setConfirmOpen(true)}>إلغاء الحجز</Button>}</div></Panel>
      <ConfirmDialog open={confirmOpen} title="إلغاء الحجز؟" description="سيتم إلغاء تذكرتك واحتساب هذا الحجز ضمن حدك اليومي. لن تتمكن من استعادة مكانك الحالي." confirmLabel="إلغاء الحجز" onCancel={() => setConfirmOpen(false)} onConfirm={handleDecline} busy={cancelBusy} />
    </div>
  );
}
