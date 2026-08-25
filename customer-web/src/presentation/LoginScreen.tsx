import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../infrastructure/SupabaseClient';
import { Button, Icon, Panel, Alert } from './components/UI';
import { LoadingSpinner } from './components/LoadingSpinner';

export function LoginScreen({ onLogin }: { onLogin: (customerId: string, name: string, phone: string | null) => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleUserSession = useCallback(async (user: any) => {
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
  }, [onLogin]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) await handleUserSession(session.user);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) await handleUserSession(session.user);
    });
    return () => subscription.unsubscribe();
  }, [handleUserSession]);

  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    if (signInError) { setError('تعذر فتح تسجيل الدخول. تحقق من اتصالك وحاول مرة أخرى.'); setLoading(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="login-page">
      <div className="mobile-screen-header"><div className="login-mark"><Icon name="scissors" size={25} /></div><div className="mobile-kicker">أهلاً بك</div><h2>احجز دورك بهدوء</h2><p>اختر خدمتك من هاتفك واعرف مكانك في الدور بدون انتظار داخل الصالون.</p><div className="login-benefits"><div className="login-benefit"><span className="login-benefit-icon"><Icon name="clock" size={16} /></span><span>تقدير واضح لوقت الانتظار</span></div><div className="login-benefit"><span className="login-benefit-icon"><Icon name="refresh" size={16} /></span><span>تذكرتك تبقى متاحة عند العودة</span></div></div></div>
      {error && <Alert>{error}</Alert>}
      <Panel><div className="ui-panel-header"><div><h3 className="ui-panel-title">ابدأ من هنا</h3><p className="ui-panel-note">نستخدم حساب جوجل للتعرّف عليك وحفظ تذكرتك.</p></div><Icon name="user" size={21} color="#2f5d50" /></div><Button onClick={signInWithGoogle} className="ui-button-wide"><span style={{ fontWeight: 900, fontSize: '1.05rem' }}>G</span> تسجيل الدخول باستخدام جوجل</Button><p className="legal-copy">بالمتابعة، أنت توافق على شروط الخدمة وسياسة الخصوصية.</p></Panel>
    </div>
  );
}
