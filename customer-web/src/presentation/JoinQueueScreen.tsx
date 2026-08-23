import React, { useState, useEffect } from 'react';
import type { QueueManagementUseCases } from '../application/QueueManagementUseCases';
import type { IStaffRepo, IServiceRepo, IShopSettingsRepo } from '../application/interfaces';
import type { Staff, Service } from '../../../shared/domain/entities';
import { supabase } from '../infrastructure/SupabaseClient';

interface Props {
  queueUseCases: QueueManagementUseCases;
  staffRepo: IStaffRepo;
  serviceRepo: IServiceRepo;
  settingsRepo: IShopSettingsRepo;
  onTicketCreated: (ticketId: string) => void;
}

export function JoinQueueScreen({ queueUseCases, staffRepo, serviceRepo, settingsRepo, onTicketCreated }: Props) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  
  const [selStaffId, setSelStaffId] = useState('');
  const [selServiceId, setSelServiceId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAccepting, setIsAccepting] = useState<boolean>(true);

  const fetchSettings = async () => {
    try {
      const s = await settingsRepo.getSettings();
      setIsAccepting(s.queueAcceptingRemote);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    staffRepo.getAll().then(s => setStaff(s.filter(x => x.role === 'hero')));
    serviceRepo.getAll().then(setServices);
    fetchSettings();

    const channel = supabase.channel('shop_settings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shop_settings' }, () => {
        fetchSettings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [staffRepo, serviceRepo, settingsRepo]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selStaffId || !selServiceId) {
      setError('Please select a service and a hero.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const ticket = await queueUseCases.joinQueue(null, selServiceId, selStaffId, phoneNumber);
      onTicketCreated(ticket.id);
    } catch (err: any) {
      setError(err.message || 'Failed to join queue.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAccepting) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm mt-8 text-center border-t-4 border-red-500">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Reservations Closed</h2>
        <p className="text-gray-600 mb-4">
          We are not accepting remote reservations at this time. Please walk in or try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-sm mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Join the Queue</h2>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleJoin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">What do you need today?</label>
          <select value={selServiceId} onChange={e => setSelServiceId(e.target.value)} required className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
            <option value="">Select a Service</option>
            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Choose your Hero</label>
          <select value={selStaffId} onChange={e => setSelStaffId(e.target.value)} required className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
            <option value="">Select a Barber</option>
            {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Phone Number (Optional)</label>
          <input 
            type="tel" 
            value={phoneNumber} 
            onChange={e => setPhoneNumber(e.target.value)} 
            placeholder="05X XXX XXXX"
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" 
          />
          <p className="text-xs text-gray-500 mt-1">We'll use this to find your ticket later.</p>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Joining...' : 'Get in Line'}
        </button>
      </form>
    </div>
  );
}
