import type { Session, User, SupabaseClient } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
}

export const signedOutState: AuthState = {
  user: null, session: null, isAdmin: false, isLoading: false,
};

// One subscription per application; late responses cannot restore a previous user's role.
export function observeAuth(
  auth: Pick<SupabaseClient['auth'], 'getSession' | 'onAuthStateChange'>,
  readAdminRole: (userId: string) => Promise<boolean>,
  publish: (state: AuthState) => void,
) {
  let active = true;
  let revision = 0;
  const timers = new Set<ReturnType<typeof setTimeout>>();

  function apply(session: Session | null) {
    const current = ++revision;
    if (!session) { publish(signedOutState); return; }
    publish({ session, user: session.user, isAdmin: false, isLoading: true });
    // Supabase auth callbacks must return before another authenticated API operation.
    const timer = setTimeout(async () => {
      timers.delete(timer);
      if (!active || current !== revision) return;
      let isAdmin = false;
      try { isAdmin = await readAdminRole(session.user.id); } catch { /* deny by default */ }
      if (active && current === revision) {
        publish({ session, user: session.user, isAdmin, isLoading: false });
      }
    }, 0);
    timers.add(timer);
  }

  const { data: { subscription } } = auth.onAuthStateChange((_event, session) => {
    if (active) apply(session);
  });
  const initialRevision = revision;
  void auth.getSession().then(({ data: { session }, error }) => {
    if (active && revision === initialRevision) apply(error ? null : session);
  }).catch(() => {
    if (active && revision === initialRevision) apply(null);
  });

  return () => {
    active = false;
    for (const timer of timers) clearTimeout(timer);
    subscription.unsubscribe();
  };
}
