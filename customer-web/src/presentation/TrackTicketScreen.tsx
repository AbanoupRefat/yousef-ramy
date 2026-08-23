import React, { useState, useEffect } from 'react';
import type { QueueManagementUseCases } from '../application/QueueManagementUseCases';
import { supabase } from '../infrastructure/SupabaseClient';

interface Props {
  ticketId: string;
  queueUseCases: QueueManagementUseCases;
  onReset: () => void;
}

export function TrackTicketScreen({ ticketId, queueUseCases, onReset }: Props) {
  const [position, setPosition] = useState<number | null>(null);
  const [eta, setEta] = useState<number>(0);
  const [status, setStatus] = useState<string>('waiting');
  const [error, setError] = useState<string | null>(null);

  const loadStatus = async () => {
    try {
      const res = await queueUseCases.getQueueStatus(ticketId);
      setPosition(res.position);
      setEta(res.etaSeconds);
      setStatus(res.status);
    } catch (err: any) {
      setError('Could not load ticket status. ' + err.message);
    }
  };

  useEffect(() => {
    loadStatus();

    // Subscribe to REALTIME updates from Postgres
    const channel = supabase.channel(`ticket_${ticketId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'queue_tickets'
        // Ideally we'd filter by ticketId, but Supabase Realtime filters require setup.
        // For MVP, we'll just listen to all changes and reload if it's our ticket or anyone's.
        // Since positions shift, we just reload anytime ANY ticket changes.
      }, () => {
        loadStatus();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, queueUseCases]);

  const formatEta = (seconds: number) => {
    if (seconds <= 0) return 'Any moment now';
    const mins = Math.ceil(seconds / 60);
    return `~${mins} minute${mins === 1 ? '' : 's'}`;
  };

  if (error) {
    return (
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-sm mt-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={onReset} className="text-indigo-600 underline">Go Back</button>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm mt-8 text-center">
        <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">All Done!</h2>
        <p className="text-gray-600 mb-6">Thanks for coming in today.</p>
        <button onClick={onReset} className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700">Book Another</button>
      </div>
    );
  }

  if (status === 'with_hero' || (status === 'waiting' && position === 0)) {
    return (
      <div className="max-w-md mx-auto bg-indigo-600 p-8 rounded-lg shadow-lg mt-8 text-center text-white">
        <div className="animate-pulse w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">✂️</span>
        </div>
        <h2 className="text-3xl font-extrabold mb-2">It's Your Turn!</h2>
        <p className="text-indigo-100 text-lg">Please head to the barber chair.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white overflow-hidden rounded-lg shadow-sm mt-8">
      <div className="px-6 py-8 text-center bg-gray-50 border-b border-gray-100">
        <h2 className="text-sm font-semibold tracking-wide text-gray-500 uppercase mb-1">Your Position</h2>
        <div className="text-6xl font-extrabold text-indigo-600">
          #{position !== null ? position + 1 : '-'}
        </div>
        <p className="mt-2 text-sm text-gray-500">Keep this screen open to track your spot live.</p>
      </div>
      
      <div className="px-6 py-6">
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <span className="text-gray-500">Estimated Wait</span>
          <span className="font-semibold text-gray-900">{formatEta(eta)}</span>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-gray-500">Ticket ID</span>
          <span className="font-mono text-xs text-gray-400">{ticketId.split('-')[0]}</span>
        </div>
      </div>
    </div>
  );
}
