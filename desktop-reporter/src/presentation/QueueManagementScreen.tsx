import React, { useState, useEffect } from 'react';
import type { QueueManagementUseCases } from '../application/QueueManagementUseCases';
import type { IStaffRepo, IServiceRepo } from '../application/interfaces';
import type { Staff, Service, QueueTicket } from '../../../shared/domain/entities';
import { supabase } from '../infrastructure/SupabaseClient';
import { ToastContainer, type ToastMessage } from './components/Toast';

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
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // Manual Reservation Form
  const [selStaffId, setSelStaffId] = useState('');
  const [selServiceId, setSelServiceId] = useState('');
  const [selPosition, setSelPosition] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');

  const addToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

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
      addToast('تمت إضافة التذكرة اليدوية بنجاح ✅', 'success');
      loadData();
    } catch (err: any) {
      addToast(err.message || 'حدث خطأ أثناء إضافة التذكرة', 'error');
    }
  };

  const handleToggleAcceptance = async () => {
    try {
      await queueUseCases.toggleQueueAcceptance(!acceptingRemote);
      const newState = !acceptingRemote;
      setAcceptingRemote(newState);
      addToast(newState ? 'تم فتح استقبال الحجوزات الإلكترونية 🟢' : 'تم إيقاف استقبال الحجوزات الإلكترونية 🔴', 'info');
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const moveTicket = async (staffId: string, ticketId: string, currentPos: number, delta: number) => {
    try {
      await queueUseCases.reorderQueue(staffId, ticketId, currentPos + delta);
      addToast('تم تعديل ترتيب التذكرة', 'info');
      loadData();
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const handleDeleteTicket = async (staffId: string, ticketId: string) => {
    if (window.confirm("هل أنت تأكد من رغبتك في حذف هذه التذكرة نهائياً؟")) {
      try {
        await queueUseCases.deleteTicket(staffId, ticketId);
        addToast('تم حذف التذكرة وإعادة ترتيب الدور بنجاح 🗑️', 'success');
        loadData();
      } catch (err: any) {
        addToast(err.message || 'فشل حذف التذكرة', 'error');
      }
    }
  };

  const handleCleanupEndOfDay = async () => {
    if (window.confirm("هل أنت متأكد من إنهاء اليومية؟ سيتم إغلاق وتفريغ جميع التذاكر المتبقية نهائياً للبدء ليوم جديد.")) {
      try {
        const { expiredCount, noShowCount } = await queueUseCases.cleanupEndOfDay();
        addToast(`تم إنهاء اليومية بنجاح! تم إغلاق ${expiredCount} حجز معلق و ${noShowCount} عدم حضور 🎉`, 'success');
        loadData();
      } catch (err: any) {
        addToast(err.message || 'حدث خطأ أثناء تقفيل اليومية', 'error');
      }
    }
  };

  return (
    <div className="space-y-6 dir-rtl text-right font-sans" dir="rtl">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Header & Settings Toolbar */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">إدارة أدوار الحلاقين</h2>
            <p className="text-sm text-gray-500 mt-1">التحكم في قائمة الانتظار، إضافة الحجوزات، وإنهاء اليومية</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleToggleAcceptance}
              className={`px-5 py-2.5 rounded-lg text-white font-medium shadow-sm transition-all flex items-center gap-2 ${
                acceptingRemote ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {acceptingRemote ? '🔴 إيقاف الحجز الإلكتروني' : '🟢 تفعيل الحجز الإلكتروني'}
            </button>
            <button
              onClick={handleCleanupEndOfDay}
              className="px-5 py-2.5 rounded-lg bg-gray-800 text-white font-medium hover:bg-gray-900 shadow-sm transition-all flex items-center gap-2"
            >
              🌙 إنهاء اليومية وتفريغ الدور
            </button>
          </div>
        </div>
      </div>

      {/* Create Manual Ticket Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-3 flex items-center gap-2">
          <span>➕</span> إضافة حجز يدوي مباشر
        </h3>
        <form onSubmit={handleCreateManual} className="grid grid-cols-1 gap-4 sm:grid-cols-5 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اختر الحلاق</label>
            <select value={selStaffId} onChange={e => setSelStaffId(e.target.value)} required className="block w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500">
              <option value="">-- اختر الحلاق --</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اختر الخدمة</label>
            <select value={selServiceId} onChange={e => setSelServiceId(e.target.value)} required className="block w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500">
              <option value="">-- اختر الخدمة --</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ترتيب الزبون</label>
            <input type="number" min="0" value={selPosition} onChange={e => setSelPosition(parseInt(e.target.value))} className="block w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف (اختياري)</label>
            <input type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="010XXXXXXXX" className="block w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <button type="submit" className="w-full bg-indigo-600 text-white p-2.5 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm">
              إضافة إلى الدور
            </button>
          </div>
        </form>
      </div>

      {/* Hero Queues Display */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {staff.map(hero => (
          <div key={hero.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>✂️</span> دور الحلاق: <span className="text-indigo-600">{hero.name}</span>
              </h3>
              <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">
                {(queues[hero.id] || []).length} زبائن
              </span>
            </div>

            <div className="space-y-3">
              {(queues[hero.id] || []).length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed text-gray-400">
                  لا يوجد زبائن في الانتظار حالياً.
                </div>
              ) : (
                (queues[hero.id] || []).map(ticket => (
                  <div key={ticket.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-indigo-200 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-lg text-indigo-600">#{ticket.position}</span>
                        <span className="text-sm font-bold text-gray-800">{ticket.phoneNumber || 'حضور مباشر (Walk-in)'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>وقت الانضمام: {ticket.joinedAt.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                        {ticket.reservationStatus === 'declined' && <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold">مرفوض</span>}
                        {ticket.reservationStatus === 'no_show' && <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">لم يحضر</span>}
                        {ticket.reservationStatus === 'expired' && <span className="bg-gray-200 text-gray-800 px-2 py-0.5 rounded font-bold">منتهي</span>}
                      </div>
                    </div>

                    {/* Actions: Move Up, Move Down, Delete */}
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <button 
                        onClick={() => moveTicket(hero.id, ticket.id, ticket.position!, -1)} 
                        title="تقديم الترتيب" 
                        className="p-2 bg-white rounded-lg border text-gray-700 hover:bg-gray-100 hover:text-indigo-600 transition-colors shadow-xs font-bold"
                      >
                        ↑
                      </button>
                      <button 
                        onClick={() => moveTicket(hero.id, ticket.id, ticket.position!, 1)} 
                        title="تأخير الترتيب" 
                        className="p-2 bg-white rounded-lg border text-gray-700 hover:bg-gray-100 hover:text-indigo-600 transition-colors shadow-xs font-bold"
                      >
                        ↓
                      </button>
                      <button 
                        onClick={() => handleDeleteTicket(hero.id, ticket.id)} 
                        title="حذف التذكرة" 
                        className="p-2 bg-rose-50 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors shadow-xs font-bold flex items-center gap-1 text-xs"
                      >
                        <span>🗑️</span> حذف
                      </button>
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
