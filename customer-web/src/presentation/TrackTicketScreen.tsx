import { useEffect, useState } from 'react';
import type { QueueManagementUseCases } from '../application/QueueManagementUseCases';
import { supabase } from '../infrastructure/SupabaseClient';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { IconBadge } from './components/IconBadge';
import { LoadingSpinner } from './components/LoadingSpinner';

interface Props {
  ticketId: string;
  queueUseCases: QueueManagementUseCases;
  onReset: () => void;
}

export function TrackTicketScreen({ ticketId, queueUseCases, onReset }: Props) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const s = await queueUseCases.getQueueStatus(ticketId);
      setStatus(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    const channel = supabase.channel('queue_tracking')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_tickets' }, () => {
        fetchStatus();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!status) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 dir-rtl" dir="rtl">
        <IconBadge icon="!" variant="danger" />
        <h2 className="text-xl font-bold text-gray-900 mt-4">لم يتم العثور على التذكرة</h2>
        <p className="text-gray-500 mt-2 mb-8">تعذر العثور على تذكرتك في الدور، ربما تم إلغاؤها أو إكتمالها.</p>
        <Button onClick={onReset} variant="secondary">العودة للرئيسية</Button>
      </div>
    );
  }

  const { position, etaSeconds, status: ticketStatus } = status;
  const isDone = ticketStatus === 'done';
  const isReady = position === 0 && ticketStatus === 'with_hero';
  
  const formatEta = (seconds: number) => {
    if (seconds <= 0) return 'في أي لحظة ⏱️';
    const mins = Math.ceil(seconds / 60);
    return `متبقي ~${mins} دقيقة`;
  };

  const handleDecline = async () => {
    if (window.confirm("هل أنت تأكد من رغبتك في إلغاء هذا الحجز؟ (سيتم احتسابه ضمن حدك اليومي)")) {
      try {
        await queueUseCases.declineReservation(ticketId);
        onReset();
      } catch (err) {
        console.error(err);
        alert('فشل إلغاء الحجز.');
      }
    }
  };

  if (isDone) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-in fade-in zoom-in duration-500 dir-rtl" dir="rtl">
        <IconBadge 
          icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>} 
          variant="success" 
          size="xl" 
        />
        <h2 className="text-3xl font-extrabold text-gray-900 mt-6 tracking-tight">تم إنهاء الحلاقة بنجاح!</h2>
        <p className="text-gray-500 mt-3 mb-10 text-lg">شكراً لزيارتك لصالون الحلاقة.</p>
        <Button onClick={onReset} variant="primary">حجز دور جديد</Button>
      </div>
    );
  }

  if (isReady) {
    return (
      <div className="flex flex-col items-center min-h-[70vh] pt-12 p-6 animate-in fade-in slide-in-from-bottom-8 duration-500 dir-rtl text-center" dir="rtl">
        <IconBadge 
          icon={<svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>} 
          variant="success" 
          size="xl" 
          pulse={true} 
        />
        <h2 className="text-3xl font-black text-gray-900 mt-6 tracking-tight">
          جاء دورك الآن! ✂️
        </h2>
        <p className="text-gray-600 mt-3 text-lg font-medium">
          تفضل إلى كرسي الحلاقة، الحلاق بانتظارك.
        </p>

        <Card className="w-full mt-10 mb-8 p-6 text-center shadow-md bg-emerald-50 border-none ring-1 ring-emerald-200">
          <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-2">حالة الدور</p>
          <p className="text-lg font-bold text-emerald-700">الحلاق في انتظارك الآن على الكرسي</p>
        </Card>

        <Button onClick={onReset} className="py-4 text-base mb-4 font-bold">
          أنا في الطريق للكرسي
        </Button>
        <Button onClick={handleDecline} variant="text" className="text-rose-600">
          إلغاء هذا الحجز
        </Button>
      </div>
    );
  }

  // Waiting State
  return (
    <div className="flex flex-col mt-6 p-2 animate-in fade-in duration-500 dir-rtl text-right" dir="rtl">
      <div className="text-center py-6">
        <IconBadge 
          icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>} 
          variant="secondary" 
        />
        <h2 className="text-3xl font-extrabold text-gray-900 mt-6 tracking-tight">
          ترتيبك في الدور: <span className="text-indigo-600">#{position}</span>
        </h2>
        <div className="mt-4 inline-flex items-center justify-center bg-indigo-50 px-5 py-2.5 rounded-full border border-indigo-100">
          <span className="text-xl font-bold text-indigo-700 tracking-tight">{formatEta(etaSeconds)}</span>
        </div>
      </div>

      <div className="w-full h-px bg-gray-200 my-6"></div>

      <div className="space-y-6">
        <section>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">تفاصيل التذكرة</h3>
          <Card className="flex items-center gap-4 border-none shadow-sm ring-1 ring-gray-100 p-4">
             <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-xl">💈</div>
             <div>
               <p className="font-bold text-gray-900 text-base">تذكرة دور حلاقة</p>
               <p className="text-xs text-gray-500">رقم التعريف: {ticketId.split('-')[0]}</p>
             </div>
          </Card>
        </section>

        <section>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">موقع الصالون</h3>
          <div className="px-1 flex items-start gap-3 text-gray-600">
            <span className="text-xl">📍</span>
            <div>
              <p className="font-bold text-gray-900">صالون الحلاقة الرئيسي</p>
              <p className="text-xs text-gray-500">الفرع الرئيسي</p>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-10 space-y-3">
        <Button onClick={fetchStatus} variant="secondary" className="py-3.5 text-base font-bold">
          تحديث حالة الدور
        </Button>
        <Button onClick={handleDecline} variant="text" className="text-rose-600 font-bold">
          إلغاء هذا الحجز
        </Button>
      </div>
    </div>
  );
}
