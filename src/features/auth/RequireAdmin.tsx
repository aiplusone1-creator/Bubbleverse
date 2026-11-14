import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

// Gate the route before mounting any admin page or starting its queries.
// Database RLS remains the authoritative authorization boundary.
export function RequireAdmin() {
  const { user, isAdmin, isLoading } = useAuth();
  if (isLoading) return <div role="status" className="min-h-screen grid place-items-center">Loading admin panel…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}
