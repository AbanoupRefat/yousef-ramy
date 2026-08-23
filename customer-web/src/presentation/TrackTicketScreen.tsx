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
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
        <IconBadge icon="!" variant="danger" />
        <h2 className="text-xl font-bold text-gray-900 mt-4">Ticket Not Found</h2>
        <p className="text-gray-500 mt-2 mb-8">We couldn't find your place in line. It may have been removed or completed.</p>
        <Button onClick={onReset} variant="secondary">Go Back</Button>
      </div>
    );
  }

  const { position, etaSeconds, status: ticketStatus } = status;
  const isDone = ticketStatus === 'done';
  const isReady = position === 0 && ticketStatus === 'with_hero';
  
  const formatEta = (seconds: number) => {
    if (seconds <= 0) return 'Any moment';
    const mins = Math.ceil(seconds / 60);
    return `~${mins} minute${mins === 1 ? '' : 's'}`;
  };

  const handleDecline = async () => {
    if (window.confirm("Are you sure you want to cancel this reservation? It will count towards your daily limit.")) {
      try {
        await queueUseCases.declineReservation(ticketId);
        onReset();
      } catch (err) {
        console.error(err);
        alert('Failed to decline reservation.');
      }
    }
  };

  if (isDone) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-in fade-in zoom-in duration-500">
        <IconBadge 
          icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>} 
          variant="success" 
          size="xl" 
        />
        <h2 className="text-3xl font-extrabold text-gray-900 mt-6 tracking-tight">All Done!</h2>
        <p className="text-gray-500 mt-3 mb-10 text-lg">Thanks for visiting Barber Queue.</p>
        <Button onClick={onReset} variant="primary">Book Again</Button>
      </div>
    );
  }

  if (isReady) {
    return (
      <div className="flex flex-col items-center min-h-[70vh] pt-12 p-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <IconBadge 
          icon={<svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>} 
          variant="success" 
          size="xl" 
          pulse={true} 
        />
        <h2 className="text-4xl font-black text-gray-900 mt-6 tracking-tight text-center uppercase">
          It's Your Turn!
        </h2>
        <p className="text-gray-600 mt-3 text-lg font-medium text-center">
          Please head to the barber chair now.
        </p>

        <Card className="w-full mt-10 mb-8 p-6 text-center shadow-md bg-secondary border-none ring-1 ring-primary/10">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Confirmation</p>
          <p className="text-lg font-semibold text-primary">Your barber is ready for you.</p>
        </Card>

        <Button onClick={onReset} className="py-4 text-[16px] mb-4">
          I'M ON MY WAY
        </Button>
        <Button onClick={handleDecline} variant="text" className="text-red-500">
          CANCEL RESERVATION
        </Button>
      </div>
    );
  }

  // Waiting State
  return (
    <div className="flex flex-col mt-6 p-2 animate-in fade-in duration-500">
      <div className="text-center py-6">
        <IconBadge 
          icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>} 
          variant="secondary" 
        />
        <h2 className="text-3xl font-extrabold text-gray-900 mt-6 tracking-tight">
          You are <span className="text-primary">#{position}</span> in line
        </h2>
        <div className="mt-4 inline-flex items-center justify-center bg-accent/10 px-5 py-2 rounded-full">
          <span className="text-2xl font-black text-accent tracking-tight">{formatEta(etaSeconds)}</span>
        </div>
      </div>

      <div className="w-full h-px bg-gray-200 my-6"></div>

      <div className="space-y-6">
        <section>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Reservation Details</h3>
          <Card className="flex items-center gap-4 border-none shadow-sm ring-1 ring-gray-100">
             <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">👤</div>
             <div>
               <p className="font-bold text-gray-900">Your Barber</p>
               <p className="text-sm text-gray-500">Ticket ID: {ticketId.split('-')[0]}</p>
             </div>
          </Card>
        </section>

        <section>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Location</h3>
          <div className="px-1 flex items-start gap-3 text-gray-600">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            <div>
              <p className="font-medium text-gray-900">Master piece Barbershop</p>
              <p className="text-sm">Main Branch</p>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-12 space-y-3">
        <Button onClick={fetchStatus} variant="secondary" className="py-4 text-[15px]">
          Refresh Status
        </Button>
        <Button onClick={handleDecline} variant="text" className="text-red-500">
          Decline This Reservation
        </Button>
      </div>
    </div>
  );
}
