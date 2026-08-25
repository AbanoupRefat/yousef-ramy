import { useCallback, useEffect, useState } from 'react';
import type { Staff } from '../../../shared/domain/entities';
import type { IStaffRepo } from '../application/interfaces';
import { supabase } from '../infrastructure/SupabaseClient';
import { Alert, Button, Icon, Panel } from './components/UI';

interface Props { staffRepo: IStaffRepo; onLogin: (staff: Staff, customer: { id: string; name: string; phone: string | null }) => void; onBack: () => void; }

export function StaffLoginScreen({ staffRepo, onLogin, onBack }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resolveGoogleUser = useCallback(async (user: any) => {
    setLoading(true); setError(null);
    try {
      const people = await staffRepo.getAll();
      const match = people.find((person) => person.authUserId === user.id || (user.email && person.email?.toLowerCase() === user.email.toLowerCase()));
      if (!match) throw new Error('هذا الحساب غير مرتبط بحساب Yousef أو Ramy في النظام. اطلب من مدير الصالون ربط بريدك أولاً.');
      if (!match.authUserId) {
        const { error: bindError } = await supabase.from('staff').update({ auth_user_id: user.id }).eq('id', match.id);
        if (bindError) throw bindError;
      }
      const { data: customer, error: customerError } = await supabase.from('customers').upsert({ google_id: user.id, name: user.user_metadata?.full_name || match.name, email: user.email }, { onConflict: 'google_id' }).select().single();
      if (customerError) throw customerError;
      onLogin({ ...match, authUserId: user.id, email: user.email || match.email }, { id: customer.id, name: customer.name || match.name, phone: customer.phone_number });
    } catch (err: any) { setError(err.message || 'تعذر تجهيز مساحة الفريق.'); }
    finally { setLoading(false); }
  }, [onLogin, staffRepo]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { if (session) void resolveGoogleUser(session.user); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { if (session) void resolveGoogleUser(session.user); });
    return () => subscription.unsubscribe();
  }, [resolveGoogleUser]);

  const signInWithGoogle = async () => {
    setError(null); setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/?mode=staff` } });
    if (signInError) { setError('تعذر فتح Google Sign-In. تحقق من إعدادات Google وSupabase.'); setLoading(false); }
  };

  return <div className="staff-login-page mobile-screen"><button className="back-link" onClick={onBack}><Icon name="arrow-left" size={17} /> العودة لدخول العملاء</button><div className="mobile-screen-header"><span className="staff-login-badge"><Icon name="user" size={16} /> مساحة فريق الصالون</span><h2>دخول Yousef أو Ramy</h2><p>استخدم حساب Google نفسه الذي تستخدمه للحجز. سيظهر لك مركز التحكم إذا كان بريدك مرتبطاً بملفك في الصالون.</p></div>{error && <Alert>{error}</Alert>}<Panel><div className="staff-google-note"><Icon name="info" size={19} /><span>لا توجد كلمة مرور منفصلة للفريق. Google هو حسابك المركزي في التطبيقات الثلاثة.</span></div><Button onClick={() => void signInWithGoogle()} className="ui-button-wide" disabled={loading}><span style={{ fontWeight: 900, fontSize: '1.05rem' }}>G</span> {loading ? 'جارٍ فتح Google…' : 'المتابعة باستخدام Google'}</Button></Panel></div>;
}
