import React, { useState, useEffect } from 'react';
import type { QueueManagementUseCases } from '../application/QueueManagementUseCases';
import type { IStaffRepo, IServiceRepo } from '../application/interfaces';
import type { Staff, Service, QueueTicket } from '../../../shared/domain/entities';
import { supabase } from '../infrastructure/SupabaseClient';

interface Props {
  queueUseCases: QueueManagementUseCases;
  staffRepo: IStaffRepo;
  serviceRepo: IServiceRepo;
}

export function QueueManagementScreen({ queueUseCases, staffRepo, serviceRepo }: Props) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [queues, setQueues] = useState<Record<string, QueueTicket[]>>({});
  const [acceptingRemote, setAcceptingRemote] = useState<boolean>(true);
  
  // Manual Reservation Form
  const [selStaffId, setSelStaffId] = useState('');
  const [selServiceId, setSelServiceId] = useState('');
  const [selPosition, setSelPosition] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');

  const loadData = async () => {
    const s = await staffRepo.getAll();
    const heroes = s.filter(x => x.role === 'hero');
    setStaff(heroes);
    
    const srv = await serviceRepo.getAll();
    setServices(srv);

    const qs: Record<string, QueueTicket[]> = {};
    for (const h of heroes) {
      qs[h.id] = await queueUseCases.getQueueForStaff(h.id);
    }
    setQueues(qs);
  };

  useEffect(() => {
    loadData();
    
    // Subscribe to realtime changes to auto-refresh the admin view
    const channel = supabase.channel('admin_queue_view')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_tickets' }, () => {
        loadData();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [staffRepo, serviceRepo, queueUseCases]);

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selStaffId || !selServiceId) return;
    try {
      await queueUseCases.createManualReservation(selStaffId, selServiceId, selPosition, phoneNumber, null);
      setSelStaffId('');
      setSelServiceId('');
      setSelPosition(0);
      setPhoneNumber('');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleAcceptance = async () => {
    try {
      await queueUseCases.toggleQueueAcceptance(!acceptingRemote);
      setAcceptingRemote(!acceptingRemote);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const moveTicket = async (staffId: string, ticketId: string, currentPos: number, delta: number) => {
    try {
      await queueUseCases.reorderQueue(staffId, ticketId, currentPos + delta);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Queue Settings</h2>
          <button
            onClick={handleToggleAcceptance}
            className={`px-4 py-2 rounded-md text-white font-medium ${acceptingRemote ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {acceptingRemote ? 'Block Remote Reservations' : 'Allow Remote Reservations'}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Create Manual Reservation</h2>
        <form onSubmit={handleCreateManual} className="grid grid-cols-1 gap-4 sm:grid-cols-5 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700">Hero</label>
            <select value={selStaffId} onChange={e => setSelStaffId(e.target.value)} required className="mt-1 block w-full p-2 border rounded-md">
              <option value="">Select Hero</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Service</label>
            <select value={selServiceId} onChange={e => setSelServiceId(e.target.value)} required className="mt-1 block w-full p-2 border rounded-md">
              <option value="">Select Service</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Position</label>
            <input type="number" min="0" value={selPosition} onChange={e => setSelPosition(parseInt(e.target.value))} className="mt-1 block w-full p-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="(optional)" className="mt-1 block w-full p-2 border rounded-md" />
          </div>
          <div>
            <button type="submit" className="w-full bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700">
              Add Ticket
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {staff.map(hero => (
          <div key={hero.id} className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-md font-bold text-gray-900 mb-4">{hero.name}'s Queue</h3>
            <div className="space-y-2">
              {(queues[hero.id] || []).length === 0 ? (
                <p className="text-gray-500 text-sm">No waiting tickets.</p>
              ) : (
                (queues[hero.id] || []).map(ticket => (
                  <div key={ticket.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                    <div>
                      <span className="font-bold text-indigo-600 mr-2">#{ticket.position}</span>
                      <span className="text-sm font-medium text-gray-900">{ticket.phoneNumber || 'Walk-in'}</span>
                      <span className="text-xs text-gray-500 block">Since: {ticket.joinedAt.toLocaleTimeString()}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => moveTicket(hero.id, ticket.id, ticket.position!, -1)} className="p-1 bg-gray-200 rounded hover:bg-gray-300">↑</button>
                      <button onClick={() => moveTicket(hero.id, ticket.id, ticket.position!, 1)} className="p-1 bg-gray-200 rounded hover:bg-gray-300">↓</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
