import { useEffect, useMemo, useState } from 'react';
import type { QueueManagementUseCases } from '../application/QueueManagementUseCases';
import type { IStaffRepo, IServiceRepo } from '../application/interfaces';
import type { Staff, Service, QueueTicket } from '../../../shared/domain/entities';
import { maskPhoneNumber } from '../../../shared/domain/privacy';
import { supabase } from '../infrastructure/SupabaseClient';
import { Alert, Button, ConfirmDialog, EmptyState, Icon, Panel, SectionHeader, StatusBadge } from './components/OperatorUI';

interface Props { queueUseCases: QueueManagementUseCases; staffRepo: IStaffRepo; serviceRepo: IServiceRepo; }
type ConfirmAction = { kind: 'delete' | 'close-day' | 'toggle'; staffId?: string; ticketId?: string } | null;

export function QueueManagementScreen({ queueUseCases, staffRepo, serviceRepo }: Props) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [queues, setQueues] = useState<Record<string, QueueTicket[]>>({});
  const [acceptingRemote, setAcceptingRemote] = useState(true);
  const [notice, setNotice] = useState<{ text: string; tone: 'success' | 'info' | 'danger' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selStaffId, setSelStaffId] = useState('');
  const [selServiceId, setSelServiceId] = useState('');
  const [selPosition, setSelPosition] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [busy, setBusy] = useState(false);

  const notify = (text: string, tone: 'success' | 'info' | 'danger' = 'success') => { setNotice({ text, tone }); window.setTimeout(() => setNotice(null), 5000); };
  const serviceName = (id: string) => services.find((service) => service.id === id)?.name || 'خدمة غير محددة';

  const loadData = async () => {
    try {
      const [staffData, serviceData] = await Promise.all([staffRepo.getAll(), serviceRepo.getAll()]);
      const heroes = staffData.filter((item) => item.role === 'hero');
      const queueEntries = await Promise.all(heroes.map(async (hero) => [hero.id, await queueUseCases.getQueueForStaff(hero.id)] as const));
      setStaff(heroes); setServices(serviceData); setQueues(Object.fromEntries(queueEntries));
    } catch (err: any) { notify(err.message || 'تعذر تحميل الدور الآن.', 'danger'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadData();
    const channel = supabase.channel('admin_queue_view').on('postgres_changes', { event: '*', schema: 'public', table: 'queue_tickets' }, loadData).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [staffRepo, serviceRepo, queueUseCases]);

  const totals = useMemo(() => { const all = Object.values(queues).flat(); return { waiting: all.filter((ticket) => ticket.status === 'waiting').length, onChair: all.filter((ticket) => ticket.status === 'with_hero').length, active: all.length }; }, [queues]);
  const nextTicket = useMemo(() => Object.values(queues).flat().filter((ticket) => ticket.status === 'waiting').sort((a, b) => (a.position || 0) - (b.position || 0))[0], [queues]);

  const handleCreateManual = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selStaffId || !selServiceId) { notify('اختر الحلاق والخدمة أولاً.', 'danger'); return; }
    try { await queueUseCases.createManualReservation(selStaffId, selServiceId, Math.max(0, selPosition), phoneNumber, null); setSelStaffId(''); setSelServiceId(''); setSelPosition(0); setPhoneNumber(''); notify('تمت إضافة الحجز إلى الدور.'); loadData(); }
    catch (err: any) { notify(err.message || 'تعذر إضافة الحجز.', 'danger'); }
  };

  const executeConfirm = async () => {
    if (!confirmAction) return;
    setBusy(true);
    try {
      if (confirmAction.kind === 'delete' && confirmAction.staffId && confirmAction.ticketId) { await queueUseCases.deleteTicket(confirmAction.staffId, confirmAction.ticketId); notify('تم حذف التذكرة وإعادة ترتيب الدور.'); }
      if (confirmAction.kind === 'close-day') { const result = await queueUseCases.cleanupEndOfDay(); notify(`انتهت اليومية. أُغلقت ${result.expiredCount} حجوزات ولم يحضر ${result.noShowCount} أشخاص.`); }
      if (confirmAction.kind === 'toggle') { await queueUseCases.toggleQueueAcceptance(!acceptingRemote); setAcceptingRemote(!acceptingRemote); notify(!acceptingRemote ? 'تم فتح الحجز الإلكتروني.' : 'تم إيقاف الحجز الإلكتروني.', 'info'); }
      setConfirmAction(null); loadData();
    } catch (err: any) { notify(err.message || 'تعذر تنفيذ العملية.', 'danger'); }
    finally { setBusy(false); }
  };

  const moveTicket = async (staffId: string, ticketId: string, position: number, delta: number) => { try { await queueUseCases.reorderQueue(staffId, ticketId, Math.max(0, position + delta)); notify('تم تعديل ترتيب التذكرة.', 'info'); loadData(); } catch (err: any) { notify(err.message || 'تعذر تعديل الترتيب.', 'danger'); } };

  if (loading) return <div className="operator-page"><div className="op-panel">جارٍ تحميل الدور…</div></div>;
  return (
    <div className="operator-page">
      <div className="operator-page-intro"><div><div className="operator-eyebrow">مساحة العمل اليومية</div><h1 className="operator-page-title">مركز إدارة الدور</h1><p className="operator-page-description">اعرف من يحتاج إلى انتباهك الآن، ثم نفّذ الخطوة التالية من نفس الشاشة.</p></div><div className="operator-header-actions"><Button variant={acceptingRemote ? 'danger' : 'secondary'} onClick={() => setConfirmAction({ kind: 'toggle' })}>{acceptingRemote ? 'إيقاف الحجز الإلكتروني' : 'تفعيل الحجز الإلكتروني'}</Button><Button variant="secondary" onClick={() => setConfirmAction({ kind: 'close-day' })}>إنهاء اليومية</Button></div></div>
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      <div className="metric-grid"><div className="metric"><div className="metric-label">في الانتظار</div><div className="metric-value">{totals.waiting}</div><div className="metric-note">حجوزات تحتاج متابعة</div></div><div className="metric metric-good"><div className="metric-label">على الكرسي</div><div className="metric-value">{totals.onChair}</div><div className="metric-note">خدمات قيد التنفيذ</div></div><div className="metric"><div className="metric-label">إجمالي الدور</div><div className="metric-value">{totals.active}</div><div className="metric-note">لكل الحلاقين</div></div><div className={`metric ${acceptingRemote ? '' : 'metric-alert'}`}><div className="metric-label">الحجز عن بُعد</div><div className="metric-value" style={{ fontSize: '1.1rem' }}>{acceptingRemote ? 'مفتوح' : 'مغلق'}</div><div className="metric-note">الحالة الحالية</div></div></div>
      <div className="queue-layout"><div className="queue-lanes">{staff.map((hero) => { const queue = queues[hero.id] || []; return <section className="queue-lane" key={hero.id}><div className="queue-lane-header"><div><h2 className="queue-lane-title">{hero.name}</h2><div className="queue-lane-subtitle">مسار الحلاق</div></div><StatusBadge tone={queue.length ? 'warning' : 'neutral'}>{queue.length} في الدور</StatusBadge></div><div className="queue-list">{queue.length === 0 ? <div className="queue-list-empty"><EmptyState title="لا توجد حجوزات" description="يمكنك إضافة حجز حضور مباشر إلى هذا المسار." /></div> : queue.map((ticket) => <div key={ticket.id} className={`queue-ticket ${ticket.status === 'with_hero' ? 'is-active' : ''}`}><div className="ticket-info"><div className="ticket-main"><span className="ticket-position" dir="ltr">#{ticket.position}</span><span>{maskPhoneNumber(ticket.phoneNumber)}</span>{ticket.status === 'with_hero' && <StatusBadge tone="success">على الكرسي</StatusBadge>}</div><div className="ticket-secondary">{serviceName(ticket.serviceId)}</div><div className="ticket-meta">انضم {ticket.joinedAt.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div></div><div className="ticket-actions"><button className="icon-action" title="تقديم الترتيب" aria-label="تقديم الترتيب" onClick={() => moveTicket(hero.id, ticket.id, ticket.position || 0, -1)}><Icon name="arrow-up" size={16} /></button><button className="icon-action" title="تأخير الترتيب" aria-label="تأخير الترتيب" onClick={() => moveTicket(hero.id, ticket.id, ticket.position || 0, 1)}><Icon name="arrow-down" size={16} /></button><button className="icon-action danger" title="حذف التذكرة" aria-label="حذف التذكرة" onClick={() => setConfirmAction({ kind: 'delete', staffId: hero.id, ticketId: ticket.id })}><Icon name="trash" size={16} /></button></div></div>)}</div></section>; })}</div><div className="operator-page"><Panel><SectionHeader icon="plus" title="إضافة حضور مباشر" description="أضف العميل إلى نهاية الدور افتراضياً." /><form className="form-stack" onSubmit={handleCreateManual}><div className="field-group"><label className="field-label" htmlFor="manual-staff">الحلاق</label><select id="manual-staff" className="field-select" value={selStaffId} onChange={(event) => setSelStaffId(event.target.value)} required><option value="">اختر الحلاق</option>{staff.map((hero) => <option key={hero.id} value={hero.id}>{hero.name}</option>)}</select></div><div className="field-group"><label className="field-label" htmlFor="manual-service">الخدمة</label><select id="manual-service" className="field-select" value={selServiceId} onChange={(event) => setSelServiceId(event.target.value)} required><option value="">اختر الخدمة</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></div><div className="field-group"><label className="field-label" htmlFor="manual-phone">رقم الهاتف <span className="field-hint">(اختياري)</span></label><input id="manual-phone" className="field-input" type="tel" inputMode="numeric" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="01012345678" dir="ltr" /></div><Button type="submit" className="op-button-wide"><Icon name="plus" size={17} />إضافة إلى الدور</Button></form></Panel><Panel><SectionHeader icon="info" title="التذكرة التالية" />{nextTicket ? <div className="data-row"><div className="data-row-main"><div className="data-row-title">{maskPhoneNumber(nextTicket.phoneNumber)}</div><div className="data-row-meta">{serviceName(nextTicket.serviceId)}</div></div><StatusBadge tone="warning">#{nextTicket.position}</StatusBadge></div> : <EmptyState title="الدور فارغ" description="ستظهر التذكرة التالية هنا عند إضافة أول حجز." />}</Panel></div></div>
      <ConfirmDialog open={confirmAction?.kind === 'delete'} title="حذف هذه التذكرة؟" description="سيتم حذفها نهائياً وإعادة ترتيب بقية الدور. لا يمكن التراجع عن هذا الإجراء." confirmLabel="حذف التذكرة" onCancel={() => setConfirmAction(null)} onConfirm={executeConfirm} busy={busy} />
      <ConfirmDialog open={confirmAction?.kind === 'close-day'} title="إنهاء اليومية وتفريغ الدور؟" description={`سيتم إغلاق جميع التذاكر المتبقية (${totals.active}) والبدء بيوم جديد. راجع الدور قبل المتابعة.`} confirmLabel="إنهاء اليومية" onCancel={() => setConfirmAction(null)} onConfirm={executeConfirm} busy={busy} />
      <ConfirmDialog open={confirmAction?.kind === 'toggle'} title={acceptingRemote ? 'إيقاف الحجز الإلكتروني؟' : 'فتح الحجز الإلكتروني؟'} description={acceptingRemote ? 'لن يتمكن العملاء من إنشاء حجوزات جديدة حتى تعيد فتحه.' : 'سيتمكن العملاء من إنشاء حجوزات جديدة من التطبيق.'} confirmLabel={acceptingRemote ? 'إيقاف الحجز' : 'فتح الحجز'} onCancel={() => setConfirmAction(null)} onConfirm={executeConfirm} busy={busy} />
    </div>
  );
}
