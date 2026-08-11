import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { seedDemoDataForUser } from '../lib/demoDataSeeder';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  signOut: async () => {},
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      seedDemoDataForUser(user.id, true);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    // Safety timeout: Ensure loading finishes within 2.5 seconds max
    const timer = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 2500);

    const initAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (error) {
          console.warn('Session init notice:', error.message);
          if (error.message?.includes('Refresh Token Not Found')) {
            try {
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
                  localStorage.removeItem(key);
                }
              }
            } catch (e) {}
          }
          setSession(null);
          setUser(null);
        } else {
          setSession(data.session);
          setUser(data.session?.user ?? null);
        }
      } catch (err) {
        console.warn('Unexpected auth error during init:', err);
        if (isMounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          clearTimeout(timer);
        }
      }
    };

    initAuth();

    let subscriptionObj: any = null;
    try {
      const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
        if (!isMounted) return;
        
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
          setSession(newSession);
          setUser(newSession?.user ?? null);
        }

        setLoading(false);
        clearTimeout(timer);
      });
      subscriptionObj = data.subscription;
    } catch (e) {
      console.warn('onAuthStateChange setup error:', e);
      setLoading(false);
    }

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (subscriptionObj) {
        subscriptionObj.unsubscribe();
      }
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setSession(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
