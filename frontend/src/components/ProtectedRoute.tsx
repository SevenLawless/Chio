import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useHydratedAuth } from '../hooks/useHydratedAuth';

export const ProtectedRoute = () => {
  const isHydrated = useHydratedAuth();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="animate-pulse text-lg">Preparing your workspace…</div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
};

