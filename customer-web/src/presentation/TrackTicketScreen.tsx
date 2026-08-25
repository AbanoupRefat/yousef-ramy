import { useCallback, useEffect, useState } from 'react';
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

  const fetchStatus = useCallback(async () => {
    try {
      const nextStatus = await queueUseCases.getQueueStatus(ticketId);
      setStatus(nextStatus); setLastUpdated(new Date()); setLoadError(null);
    } catch (err) {
      console.error(err); setLoadError('تعذر تحديث التذكرة الآن. سنحاول مرة أخرى تلقائياً.');
    } finally { setLoading(false); }
  }, [queueUseCases, ticketId]);

  useEffect(() => {
    const channel = supabase.channel('queue_tracking').on('postgres_changes', { event: '*', schema: 'public', table: 'queue_tickets' }, fetchStatus).subscribe();
    const interval = window.setInterval(fetchStatus, 30000);
    const initialRefresh = window.setTimeout(() => { void fetchStatus(); }, 0);
    return () => { supabase.removeChannel(channel); window.clearInterval(interval); window.clearTimeout(initialRefresh); };
  }, [fetchStatus]);

  const handleDecline = async () => {
    setCancelBusy(true);
    try { await queueUseCases.declineReservation(ticketId); onReset(); }
    catch (err) { console.error(err); setLoadError('تعذر إلغاء الحجز. حاول مرة أخرى.'); setConfirmOpen(false); }
    finally { setCancelBusy(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (!status) return <div className="login-page">{loadError && <Alert>{loadError}</Alert>}<EmptyState title="لم نعثر على هذه التذكرة" description="قد تكون التذكرة أُغلقت أو انتهت. عد إلى الحجز لإنشاء تذكرة جديدة." action={<Button variant="secondary" onClick={onReset}>العودة إلى الحجز</Button>} /></div>;

  const { position, etaSeconds, status: ticketStatus } = status;
  const isDone = ticketStatus === 'done';
  const isReady = position === 0 && ticketStatus === 'with_hero';
  const statusLabel = isReady ? 'حان دورك' : isDone ? 'اكتملت الخدمة' : 'أنت في الدور';

  if (isDone) return <div className="mobile-screen"><div className="ticket-hero"><StatusBadge tone="success"><Icon name="check" size={15} /> اكتملت الخدمة</StatusBadge><div className="ticket-number">✓</div><h2 className="ticket-status-title">تم إنهاء خدمتك</h2><p className="ticket-status-copy">نتمنى أن نراك مرة أخرى قريباً.</p></div><Button onClick={onReset} className="ui-button-wide">حجز دور جديد</Button></div>;

  return <div className="mobile-screen"><div className="mobile-screen-header"><div className="mobile-kicker">تذكرتك الحالية</div><h2>{statusLabel}</h2><p>سنحدّث الحالة تلقائياً. يمكنك مغادرة الصفحة والعودة عندما يقترب دورك.</p></div>{loadError && <Alert tone="info">{loadError}</Alert>}<Panel className="ticket-hero"><StatusBadge tone={isReady ? 'success' : 'warning'}><Icon name={isReady ? 'check' : 'clock'} size={15} /> {isReady ? 'الحلاق بانتظارك' : 'التذكرة نشطة'}</StatusBadge><div className="ticket-number" dir="ltr">#{position}</div><h3 className="ticket-status-title">{isReady ? 'توجه إلى كرسي الحلاقة الآن' : position === 1 ? 'أنت التالي بعد الحلاق الحالي' : `يوجد ${position} أشخاص قبلك`}</h3><p className="ticket-status-copy">{isReady ? 'لا تتأخر حتى لا تفقد دورك.' : formatEta(etaSeconds)}</p></Panel><Panel><div className="ui-panel-header"><div><h3 className="ui-panel-title">تفاصيل التذكرة</h3><p className="ui-panel-note">آخر تحديث: {lastUpdated ? lastUpdated.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : 'الآن'}</p></div><Icon name="clock" size={21} color="#2f5d50" /></div><div className="summary-list"><div className="summary-row"><span className="summary-label">رقم التذكرة</span><span className="summary-value" dir="ltr">{ticketId.split('-')[0]}</span></div><div className="summary-row"><span className="summary-label">الحالة</span><span className="summary-value">{isReady ? 'على الكرسي الآن' : 'في الانتظار'}</span></div></div></Panel><div className="track-actions"><Button variant="secondary" onClick={() => void fetchStatus}><Icon name="refresh" size={17} /> تحديث الحالة</Button>{!isReady && <Button variant="quiet" onClick={() => setConfirmOpen(true)}>إلغاء الحجز</Button>}</div><ConfirmDialog open={confirmOpen} title="إلغاء الحجز؟" description="سيتم إلغاء تذكرتك واحتساب هذا الحجز ضمن حدك اليومي. لن تتمكن من استعادة مكانك الحالي." confirmLabel="إلغاء الحجز" onCancel={() => setConfirmOpen(false)} onConfirm={handleDecline} busy={cancelBusy} /></div>;
}
