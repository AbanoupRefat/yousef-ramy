import { useState } from 'react';
import type { Staff } from '../../../shared/domain/entities';
import type { IStaffRepo } from '../application/interfaces';
import { supabase } from '../infrastructure/SupabaseClient';
import { Alert, Button, Icon, Panel } from './components/UI';

interface Props { staffRepo: IStaffRepo; onLogin: (staff: Staff) => void; onBack: () => void; }

type Mode = 'sign-in' | 'sign-up';

export function StaffLoginScreen({ staffRepo, onLogin, onBack }: Props) {
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resolveStaff = async (userId: string, userEmail?: string | null) => {
    const people = await staffRepo.getAll();
    const match = people.find((person) => person.authUserId === userId || (userEmail && person.email?.toLowerCase() === userEmail.toLowerCase()));
    if (!match) throw new Error('هذا الحساب غير مرتبط بحساب Yousef أو Ramy في النظام. اطلب من مدير الصالون ربط بريدك بالحساب أولاً.');
    if (!match.authUserId) await supabase.from('staff').update({ auth_user_id: userId }).eq('id', match.id);
    onLogin({ ...match, authUserId: userId, email: userEmail || match.email });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(null); setNotice(null); setLoading(true);
    try {
      if (mode === 'sign-up') {
        const { data, error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim() } } });
        if (signUpError) throw signUpError;
        if (!data.user) throw new Error('تعذر إنشاء الحساب الآن.');
        setNotice('تم إنشاء الحساب. إذا كان بريدك مرتبطاً بحساب الحلاق، يمكنك تسجيل الدخول الآن.');
        setMode('sign-in');
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signInError) throw signInError;
        if (!data.user) throw new Error('تعذر تسجيل الدخول الآن.');
        await resolveStaff(data.user.id, data.user.email);
      }
    } catch (err: any) { setError(err.message || 'تعذر إكمال العملية.'); }
    finally { setLoading(false); }
  };

  return <div className="staff-login-page mobile-screen"><button className="back-link" onClick={onBack}><Icon name="arrow-left" size={17} /> العودة لدخول العملاء</button><div className="mobile-screen-header"><span className="staff-login-badge"><Icon name="user" size={16} /> مساحة فريق الصالون</span><h2>{mode === 'sign-in' ? 'دخول الحلاقين' : 'إنشاء حساب للفريق'}</h2><p>{mode === 'sign-in' ? 'ادخل لتشاهد دورك اليومي وتدير حجوزاتك من الهاتف.' : 'أنشئ الحساب بالبريد المرتبط بملفك في الصالون.'}</p></div>{error && <Alert>{error}</Alert>}{notice && <Alert tone="success">{notice}</Alert>}<Panel><form className="form-stack" onSubmit={submit}>{mode === 'sign-up' && <div className="field-group"><label className="field-label" htmlFor="staff-name">الاسم</label><input id="staff-name" className="field-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Yousef أو Ramy" required /></div>}<div className="field-group"><label className="field-label" htmlFor="staff-email">البريد الإلكتروني</label><input id="staff-email" className="field-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" dir="ltr" required /></div><div className="field-group"><label className="field-label" htmlFor="staff-password">كلمة المرور</label><input id="staff-password" className="field-input" type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="6 أحرف على الأقل" dir="ltr" required /></div><Button type="submit" className="ui-button-wide" disabled={loading}>{loading ? 'جارٍ التنفيذ…' : mode === 'sign-in' ? 'تسجيل الدخول' : 'إنشاء الحساب'}</Button></form><button className="text-link-button" onClick={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setError(null); setNotice(null); }}>{mode === 'sign-in' ? 'ليس لديك حساب؟ أنشئ حساباً' : 'لديك حساب بالفعل؟ سجل الدخول'}</button></Panel></div>;
}
