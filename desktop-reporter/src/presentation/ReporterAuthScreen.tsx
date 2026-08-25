import { useState } from 'react';
import { supabase } from '../infrastructure/SupabaseClient';
import { Alert, Button, Icon, Panel } from './components/OperatorUI';

type Mode = 'sign-in' | 'sign-up';

export function ReporterAuthScreen() {
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(null); setNotice(null); setLoading(true);
    try {
      if (mode === 'sign-up') {
        const { data, error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim(), app_role: 'reporter' } } });
        if (signUpError) throw signUpError;
        if (!data.session) { setNotice('تم إنشاء الحساب. افتح رسالة التأكيد في بريدك، ثم سجل الدخول.'); setMode('sign-in'); }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signInError) throw signInError;
      }
    } catch (err: any) { setError(err.message || 'تعذر إكمال العملية.'); }
    finally { setLoading(false); }
  };

  return <div className="reporter-auth-page"><div className="reporter-auth-intro"><span className="reporter-auth-mark"><Icon name="scissors" size={25} /></span><div className="operator-eyebrow">مساحة العمل اليومية</div><h1>{mode === 'sign-in' ? 'دخول فريق الصالون' : 'إنشاء حساب جديد'}</h1><p>{mode === 'sign-in' ? 'سجل الدخول للوصول إلى الدور، الفواتير، التقارير، والمخزون.' : 'أنشئ حساباً للوصول إلى أدوات إدارة الصالون.'}</p></div>{error && <Alert>{error}</Alert>}{notice && <Alert tone="success">{notice}</Alert>}<Panel><form className="form-stack" onSubmit={submit}>{mode === 'sign-up' && <div className="field-group"><label className="field-label" htmlFor="reporter-name">الاسم</label><input className="field-input" id="reporter-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="اسمك" required /></div>}<div className="field-group"><label className="field-label" htmlFor="reporter-email">البريد الإلكتروني</label><input className="field-input" id="reporter-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" dir="ltr" required /></div><div className="field-group"><label className="field-label" htmlFor="reporter-password">كلمة المرور</label><input className="field-input" id="reporter-password" type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="6 أحرف على الأقل" dir="ltr" required /></div><Button type="submit" className="op-button-wide" disabled={loading}>{loading ? 'جارٍ التنفيذ…' : mode === 'sign-in' ? 'تسجيل الدخول' : 'إنشاء الحساب'}</Button></form><button className="reporter-auth-switch" onClick={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setError(null); setNotice(null); }}>{mode === 'sign-in' ? 'ليس لديك حساب؟ أنشئ حساباً' : 'لديك حساب؟ سجل الدخول'}</button></Panel></div>;
}
