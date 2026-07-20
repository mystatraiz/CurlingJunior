'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseBrowser, isSupabaseConfigured } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  configured: false,
  loading: true,
  session: null,
  profile: null,
  isAdmin: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    const supabase = getSupabaseBrowser();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => subscription.unsubscribe();
  }, [configured]);

  useEffect(() => {
    if (!configured || !session?.user) {
      setProfile(null);
      return;
    }
    const supabase = getSupabaseBrowser();
    supabase
      .from('coaches')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setProfile((data as Profile) ?? null));
  }, [configured, session?.user?.id, session]);

  const signOut = useCallback(async () => {
    if (!configured) return;
    await getSupabaseBrowser().auth.signOut();
    window.location.href = '/login';
  }, [configured]);

  return (
    <AuthContext.Provider
      value={{
        configured,
        loading,
        session,
        profile,
        isAdmin: profile?.role === 'admin',
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
