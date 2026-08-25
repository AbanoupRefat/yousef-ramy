import React, { useState, useEffect, useMemo } from 'react';
import type { QueueManagementUseCases } from '../application/QueueManagementUseCases';
import type { IStaffRepo, IServiceRepo, IShopSettingsRepo, IQueueTicketRepo } from '../application/interfaces';
import type { Staff, Service } from '../../../shared/domain/entities';
import { supabase } from '../infrastructure/SupabaseClient';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { PillButton } from './components/PillButton';
import { HeroCard } from './components/HeroCard';
import { LoadingSpinner } from './components/LoadingSpinner';

interface Props {
  customer: { id: string, name: string, phone: string | null };
  queueUseCases: QueueManagementUseCases;
  staffRepo: IStaffRepo;
  serviceRepo: IServiceRepo;
  settingsRepo: IShopSettingsRepo;
  ticketRepo: IQueueTicketRepo;
  onTicketCreated: (ticketId: string) => void;
}

export function JoinQueueScreen({ customer, queueUseCases, staffRepo, serviceRepo, settingsRepo, ticketRepo, onTicketCreated }: Props) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [heroStats, setHeroStats] = useState<Record<string, { queueDepth: number, etaSeconds: number }>>({});
  
  const [selStaffId, setSelStaffId] = useState<string>(''); // 'next-available' or UUID
  const [selServiceId, setSelServiceId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(customer.phone || '');
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState<boolean>(true);
  
  const [reservationsUsed, setReservationsUsed] = useState(0);

  const fetchSettingsAndLimits = async () => {
    try {
      const s = await settingsRepo.getSettings();
      setIsAccepting(s.queueAcceptingRemote);
      
      const activeCount = await ticketRepo.countForCustomerToday(customer.id, ['active']);
      const declinedCount = await ticketRepo.countForCustomerToday(customer.id, ['declined']);
      setReservationsUsed(activeCount + declinedCount);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    Promise.all([
      staffRepo.getAll().then(s => setStaff(s.filter(x => x.role === 'hero'))),
      serviceRepo.getAll().then(setServices),
      fetchSettingsAndLimits()
    ]).finally(() => setInitialLoading(false));

    const channel = supabase.channel('shop_settings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shop_settings' }, () => fetchSettingsAndLimits())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [staffRepo, serviceRepo, settingsRepo, customer.id, ticketRepo]);

  useEffect(() => {
    if (!selServiceId || staff.length === 0) return;

    const loadStats = async () => {
      const stats: Record<string, { queueDepth: number, etaSeconds: number }> = {};
      for (const hero of staff) {
        const queue = await queueUseCases.getQueueForStaff(hero.id);
        const depth = queue.length;
        
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
      setError('يرجى اختيار الخدمة والحلاق المفضّل.');
      return;
    }

    const targetHeroId = selStaffId === 'next-available' ? nextAvailableHeroId : selStaffId;
    if (!targetHeroId) {
      setError('تعذر تحديد الحلاق الأسرع، يرجى اختياره يدوياً.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const ticket = await queueUseCases.joinQueue(customer.id, selServiceId, targetHeroId, phoneNumber);
      onTicketCreated(ticket.id);
    } catch (err: any) {
      setError(err.message || 'فشل الانضمام إلى قائمة الانتظار.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <LoadingSpinner />;
  }

  if (!isAccepting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center mt-8 dir-rtl" dir="rtl">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <span className="text-4xl">🛑</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">الحجز الإلكتروني متوقف حالياً</h2>
        <p className="text-gray-600 mb-6 leading-relaxed">
          نحن نعمل حالياً بالطاقة الاستيعابية الكاملة ولا نستقبل حجوزات أونلاين في هذا الوقت.
        </p>
        <p className="text-sm font-bold text-indigo-600 uppercase tracking-wider">
          يسعدنا استقبالكم حضورياً في الصالون!
        </p>
      </div>
    );
  }

  const getLimitText = () => {
    if (reservationsUsed >= 2) return "لقد استهلكت حجزيك لليوم (الحد الأقصى 2 حجز). يمكنك الحجز غداً.";
    return `لديك ${reservationsUsed}/2 حجوزات اليوم — متبقي لك ${2 - reservationsUsed} حجز`;
  };

  const limitReached = reservationsUsed >= 2;

  return (
    <div className="mt-6 mb-10 dir-rtl text-right" dir="rtl">
      
      {/* Welcome Banner */}
      <div className="mb-6 bg-white p-4 rounded-xl shadow-sm flex items-center justify-between border-r-4 border-indigo-600">
        <div>
          <p className="text-xs text-gray-500">أهلاً بك،</p>
          <p className="font-bold text-gray-900 text-base">{customer.name}</p>
        </div>
        <div className="text-left">
          <p className={`text-xs font-semibold ${limitReached ? 'text-rose-600' : 'text-indigo-600'}`}>
            {getLimitText()}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 shadow-sm text-sm font-medium flex items-start gap-3">
          <span className="text-lg">⚠️</span>
          <div>{error}</div>
        </div>
      )}

      {limitReached ? (
        <Card className="p-6 text-center border-none ring-1 ring-red-100 bg-red-50 mt-8">
           <h3 className="font-bold text-red-700 text-lg mb-2">وصلت للحد الأقصى للحجز اليوم</h3>
           <p className="text-red-600 text-sm">لقد قمت بالحجز مرتين اليوم. يمكنك الحجز مجدداً أونلاين بدءاً من الغد.</p>
        </Card>
      ) : (
        <form onSubmit={handleJoin} className="space-y-8">
          
          {/* Service Picker */}
          <section>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">1. اختر الخدمة</h2>
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
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">2. اختر الحلاق المفضّل</h2>
              <div className="space-y-3">
                <HeroCard
                  name="أول حلاق متاح (الأسرع)"
                  subtitle="الخيار الأسرع لك"
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
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">3. رقم الهاتف للتواصل</h2>
              <Card className="p-1 border-0 ring-1 ring-gray-200 focus-within:ring-2 focus-within:ring-indigo-600 shadow-sm bg-white overflow-hidden transition-all duration-200">
                <div className="flex items-center">
                  <span className="pr-4 pl-2 text-gray-400 font-medium">+20</span>
                  <input 
                    type="tel" 
                    value={phoneNumber} 
                    onChange={e => setPhoneNumber(e.target.value)} 
                    placeholder="010XXXXXXXX"
                    className="w-full py-4 pl-4 bg-transparent focus:outline-none font-medium text-gray-900 placeholder-gray-300" 
                  />
                </div>
              </Card>
              <p className="text-[11px] text-gray-500 mt-2 mr-1">نستخدم هذا الرقم لاسترجاع تذكرتك في حال إغلاق الصفحة.</p>
            </section>
          )}

          {/* Submit */}
          {selServiceId && selStaffId && (
            <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <Button type="submit" disabled={loading} className="py-4 text-base font-bold uppercase tracking-wide">
                {loading ? 'جاري تأكيد حجز دورك...' : 'تأكيد الحجز والدخول في الدور'}
              </Button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
