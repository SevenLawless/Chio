import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useHydratedAuth } from '../hooks/useHydratedAuth';

export const PublicRoute = () => {
  const isHydrated = useHydratedAuth();
  const token = useAuthStore((state) => state.token);

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="animate-pulse text-lg">Preparing your workspace…</div>
      </div>
    );
  }

  if (token) {
    return <Navigate to="/app/tasks" replace />;
  }

  return <Outlet />;
};

