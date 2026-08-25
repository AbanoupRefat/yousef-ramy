import { useEffect, useState } from 'react';
import { supabase } from '../infrastructure/SupabaseClient';
import { Button, Icon, Panel, Alert } from './components/UI';
import { LoadingSpinner } from './components/LoadingSpinner';

export function LoginScreen({ onLogin }: { onLogin: (customerId: string, name: string, phone: string | null) => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) await handleUserSession(session.user);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) await handleUserSession(session.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleUserSession = async (user: any) => {
    try {
      const { data, error: upsertError } = await supabase.from('customers').upsert(
        { google_id: user.id, name: user.user_metadata?.full_name || 'عميل', email: user.email },
        { onConflict: 'google_id' },
      ).select().single();
      if (upsertError) throw upsertError;
      onLogin(data.id, data.name, data.phone_number);
    } catch (err) {
      console.error(err);
      setError('تعذر تجهيز حسابك الآن. حاول مرة أخرى بعد لحظات.');
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    if (signInError) { setError('تعذر فتح تسجيل الدخول. تحقق من اتصالك وحاول مرة أخرى.'); setLoading(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="login-page">
      <div className="page-intro">
        <div className="login-mark"><Icon name="scissors" size={30} /></div>
        <div className="eyebrow" style={{ marginTop: 18 }}>أهلاً بك</div>
        <h1 className="page-title">احجز دورك بهدوء</h1>
        <p className="page-description">اعرف مكانك في الدور، واستغل وقتك بعيداً عن زحمة الانتظار داخل الصالون.</p>
        <div className="login-benefits">
          <div className="login-benefit"><span className="login-benefit-icon"><Icon name="clock" size={17} /></span><span>تقدير واضح لوقت الانتظار</span></div>
          <div className="login-benefit"><span className="login-benefit-icon"><Icon name="refresh" size={17} /></span><span>يمكنك العودة لتذكرتك في أي وقت</span></div>
        </div>
      </div>
      {error && <Alert>{error}</Alert>}
      <Panel>
        <div className="ui-panel-header"><div><h2 className="ui-panel-title">ابدأ الحجز</h2><p className="ui-panel-note">نستخدم حساب جوجل للتعرّف عليك وحفظ تذكرتك.</p></div><Icon name="user" size={22} color="#7a452d" /></div>
        <Button onClick={signInWithGoogle} className="ui-button-wide"><span style={{ fontWeight: 900, fontSize: '1.1rem' }}>G</span> تسجيل الدخول باستخدام جوجل</Button>
        <p className="legal-copy">بالمتابعة، أنت توافق على شروط الخدمة وسياسة الخصوصية.</p>
      </Panel>
    </div>
  );
}
