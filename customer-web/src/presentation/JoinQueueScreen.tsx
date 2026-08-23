import React, { useState, useEffect, useMemo } from 'react';
import type { QueueManagementUseCases } from '../application/QueueManagementUseCases';
import type { IStaffRepo, IServiceRepo, IShopSettingsRepo } from '../application/interfaces';
import type { Staff, Service } from '../../../shared/domain/entities';
import { supabase } from '../infrastructure/SupabaseClient';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { PillButton } from './components/PillButton';
import { HeroCard } from './components/HeroCard';
import { LoadingSpinner } from './components/LoadingSpinner';

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
  const [heroStats, setHeroStats] = useState<Record<string, { queueDepth: number, etaSeconds: number }>>({});
  
  const [selStaffId, setSelStaffId] = useState<string>(''); // 'next-available' or UUID
  const [selServiceId, setSelServiceId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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
    Promise.all([
      staffRepo.getAll().then(s => setStaff(s.filter(x => x.role === 'hero'))),
      serviceRepo.getAll().then(setServices),
      fetchSettings()
    ]).finally(() => setInitialLoading(false));

    const channel = supabase.channel('shop_settings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shop_settings' }, () => fetchSettings())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [staffRepo, serviceRepo, settingsRepo]);

  useEffect(() => {
    if (!selServiceId || staff.length === 0) return;

    // Load stats for all heroes based on selected service
    const loadStats = async () => {
      const stats: Record<string, { queueDepth: number, etaSeconds: number }> = {};
      for (const hero of staff) {
        // Find tickets
        const queue = await queueUseCases.getQueueForStaff(hero.id);
        const depth = queue.length;
        
        // Find duration
        const { data: duration } = await supabase
          .from('staff_service_durations')
          .select('rolling_avg_seconds')
          .eq('staff_id', hero.id)
          .eq('service_id', selServiceId)
          .single();
          
        const avg = duration?.rolling_avg_seconds || 15 * 60;
        stats[hero.id] = { queueDepth: depth, etaSeconds: depth * avg };
      }
      setHeroStats(stats);
    };

    loadStats();
  }, [selServiceId, staff, queueUseCases]);

  // Determine Next Available Hero (shortest ETA)
  const nextAvailableHeroId = useMemo(() => {
    if (Object.keys(heroStats).length === 0) return null;
    let bestId = null;
    let minEta = Infinity;
    for (const [heroId, stat] of Object.entries(heroStats)) {
      if (stat.etaSeconds < minEta) {
        minEta = stat.etaSeconds;
        bestId = heroId;
      }
    }
    return bestId;
  }, [heroStats]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selStaffId || !selServiceId) {
      setError('Please select a service and a hero.');
      return;
    }

    const targetHeroId = selStaffId === 'next-available' ? nextAvailableHeroId : selStaffId;
    if (!targetHeroId) {
      setError('Could not determine next available hero. Please pick one manually.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const ticket = await queueUseCases.joinQueue(null, selServiceId, targetHeroId, phoneNumber);
      onTicketCreated(ticket.id);
    } catch (err: any) {
      setError(err.message || 'Failed to join queue.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <LoadingSpinner />;
  }

  if (!isAccepting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center mt-8">
        <div className="w-20 h-20 bg-red-50 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Reservations Closed</h2>
        <p className="text-gray-600 mb-6 leading-relaxed">
          We are currently operating at full capacity and not accepting remote reservations at this time.
        </p>
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          Walk-ins still welcome!
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 mb-10">
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 shadow-sm text-sm font-medium flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          {error}
        </div>
      )}

      <form onSubmit={handleJoin} className="space-y-8">
        
        {/* Service Picker */}
        <section>
          <h2 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-3">Select Service</h2>
          <div className="flex flex-wrap gap-2">
            {services.map(s => (
              <PillButton 
                key={s.id}
                label={s.name}
                selected={selServiceId === s.id}
                onClick={() => setSelServiceId(s.id)}
              />
            ))}
          </div>
        </section>

        {/* Hero Picker */}
        {selServiceId && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-3">Select Your Hero</h2>
            <div className="space-y-3">
              <HeroCard
                name="Next Available"
                subtitle="Fastest Option"
                isNextAvailable={true}
                selected={selStaffId === 'next-available'}
                onClick={() => setSelStaffId('next-available')}
              />
              
              {staff.map(hero => {
                const stats = heroStats[hero.id];
                return (
                  <HeroCard
                    key={hero.id}
                    name={hero.name}
                    queueDepth={stats?.queueDepth}
                    etaSeconds={stats?.etaSeconds}
                    selected={selStaffId === hero.id}
                    onClick={() => setSelStaffId(hero.id)}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* Contact Info */}
        {selServiceId && selStaffId && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-3">Your Phone Number</h2>
            <Card className="p-1 border-0 ring-1 ring-gray-200 focus-within:ring-2 focus-within:ring-primary shadow-sm bg-white overflow-hidden transition-all duration-200">
              <div className="flex items-center">
                <span className="pl-4 pr-2 text-gray-400 font-medium">+20</span>
                <input 
                  type="tel" 
                  value={phoneNumber} 
                  onChange={e => setPhoneNumber(e.target.value)} 
                  placeholder="10 1234 5678"
                  className="w-full py-4 pr-4 bg-transparent focus:outline-none font-medium text-gray-900 placeholder-gray-300" 
                />
              </div>
            </Card>
            <p className="text-[11px] text-gray-500 mt-2 ml-1">We use this to find your ticket later if you close the app.</p>
          </section>
        )}

        {/* Submit */}
        {selServiceId && selStaffId && (
          <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <Button type="submit" disabled={loading} className="py-4 text-[15px] uppercase tracking-wide">
              {loading ? 'Securing spot...' : 'Reserve Your Spot'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
