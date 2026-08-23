import { useEffect, useState } from 'react';
import { supabase } from '../infrastructure/SupabaseClient';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { IconBadge } from './components/IconBadge';
import { LoadingSpinner } from './components/LoadingSpinner';

export function LoginScreen({ onLogin }: { onLogin: (customerId: string, name: string, phone: string | null) => void }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        await handleUserSession(session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await handleUserSession(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserSession = async (user: any) => {
    try {
      const googleId = user.id;
      const name = user.user_metadata?.full_name || 'Customer';
      const email = user.email;
      
      // Upsert into customers table
      const { data, error } = await supabase
        .from('customers')
        .upsert(
          { google_id: googleId, name, email },
          { onConflict: 'google_id' }
        )
        .select()
        .single();
        
      if (error) {
        console.error('Error saving customer:', error);
        setLoading(false);
        return;
      }
      
      onLogin(data.id, data.name, data.phone_number);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center animate-in fade-in duration-500">
      <div className="mb-8">
        <IconBadge 
          icon={<svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>} 
          variant="primary" 
          size="xl" 
        />
        <h1 className="text-4xl font-black text-gray-900 mt-6 tracking-tight">Barber Queue</h1>
        <p className="text-gray-500 mt-3 text-lg">Sign in to book your spot in line.</p>
      </div>

      <Card className="w-full p-8 flex flex-col items-center border-none ring-1 ring-gray-100 shadow-md">
        <Button onClick={signInWithGoogle} variant="secondary" className="w-full flex items-center justify-center gap-3">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            <path d="M1 1h22v22H1z" fill="none"/>
          </svg>
          Sign in with Google
        </Button>
        <p className="mt-4 text-xs text-gray-400">By signing in, you agree to our Terms of Service.</p>
      </Card>
    </div>
  );
}
