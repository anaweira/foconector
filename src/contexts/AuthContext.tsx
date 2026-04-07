import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionInfo {
  subscribed: boolean;
  status: 'active' | 'trialing' | 'expired' | 'cancelled';
  subscription_end: string | null;
  in_trial: boolean;
  trial_end: string | null;
  trial_days_left?: number;
  lifetime?: boolean;
  referral_code: string | null;
  is_influencer: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscription: SubscriptionInfo | null;
  subscriptionLoading: boolean;
  isAdmin: boolean;
  adminLoading: boolean;
  checkSubscription: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  subscription: null,
  subscriptionLoading: true,
  isAdmin: false,
  adminLoading: true,
  checkSubscription: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);

  const checkSubscription = useCallback(async () => {
    if (!session) {
      setSubscription(null);
      setSubscriptionLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      setSubscription(data as SubscriptionInfo);
    } catch (err) {
      console.error('Error checking subscription:', err);
    } finally {
      setSubscriptionLoading(false);
    }
  }, [session]);

  const checkAdmin = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      setAdminLoading(false);
      return;
    }
    setAdminLoading(true);
    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin',
      });
      if (error) throw error;
      setIsAdmin(Boolean(data));
    } catch {
      setIsAdmin(false);
    } finally {
      setAdminLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => authSub.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      checkSubscription();
      checkAdmin();
    } else {
      setSubscription(null);
      setSubscriptionLoading(false);
      setIsAdmin(false);
      setAdminLoading(false);
    }
  }, [session, checkSubscription, checkAdmin]);

  // Auto-refresh subscription every 60s
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [session, checkSubscription]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, subscription, subscriptionLoading, isAdmin, adminLoading, checkSubscription, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
