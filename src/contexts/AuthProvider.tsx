import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { observeAuth, signedOutState, type AuthState } from '@/features/auth/authState';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ ...signedOutState, isLoading: true });
  useEffect(() => observeAuth(supabase.auth, async userId => {
    const { data, error } = await supabase.from('user_roles').select('role')
      .eq('user_id', userId).eq('role', 'admin').maybeSingle();
    return !!data && !error;
  }, setState), []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setState(signedOutState);
  }, []);

  return <AuthContext.Provider value={{ ...state, signOut }}>{children}</AuthContext.Provider>;
}
