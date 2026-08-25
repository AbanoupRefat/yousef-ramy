import { useState } from 'react';
import { supabase } from '../infrastructure/SupabaseClient';
import { Alert, Button, Icon, Panel } from './components/OperatorUI';

export function ReporterAuthScreen() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async () => {
    setError(null); setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    if (signInError) { setError('تعذر فتح Google Sign-In. تحقق من إعدادات Google وSupabase ثم حاول مرة أخرى.'); setLoading(false); }
  };

  return <div className="reporter-auth-page"><div className="reporter-auth-intro"><span className="reporter-auth-mark"><Icon name="scissors" size={25} /></span><div className="operator-eyebrow">مساحة العمل اليومية</div><h1>دخول موحّد للصالون</h1><p>استخدم حساب Google نفسه في الحجز، مساحة الحلاق، والتقارير. لا توجد كلمات مرور منفصلة بين التطبيقات.</p></div>{error && <Alert>{error}</Alert>}<Panel><div className="central-auth-note"><Icon name="info" size={19} /><span>Google يحافظ على حساب مركزي واحد، بينما تحدد صلاحياتك ما يمكنك رؤيته داخل الصالون.</span></div><Button onClick={() => void signInWithGoogle()} className="op-button-wide" disabled={loading}><span style={{ fontWeight: 900, fontSize: '1.05rem' }}>G</span> {loading ? 'جارٍ فتح Google…' : 'المتابعة باستخدام Google'}</Button></Panel></div>;
}
