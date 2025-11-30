import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

const navItems = [
  { label: 'Daily Flow', to: '/app/tasks' },
  { label: 'Insights', to: '/app/stats' },
];

const AppLayout = () => {
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    clearAuth();
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-6 sm:px-6 lg:px-8 lg:pt-10">
        <header className="flex flex-col gap-4 rounded-3xl border border-brand-800/30 bg-brand-900/20 px-6 py-5 backdrop-blur md:flex-row md:items-center md:justify-between" role="banner">
          <div>
            <p className="text-sm text-white/60">Hi, {user?.username ?? 'Explorer'}</p>
            <h1 className="text-2xl font-semibold tracking-tight text-white">CHIO</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-full bg-brand-900/30 border border-brand-800/30 px-4 py-2 text-brand-300" aria-label="Current streak: 7 days">Focus streak · 7d</span>
            <button
              onClick={handleLogout}
              className="rounded-full border border-brand-700/40 px-4 py-2 text-white/80 transition hover:border-brand-600/60 hover:text-white hover:bg-brand-900/20 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              aria-label="Logout from your account"
            >
              Logout
            </button>
          </div>
        </header>

        <nav className="mt-6 flex gap-3 rounded-3xl border border-brand-800/30 bg-brand-900/20 p-2 text-sm font-medium backdrop-blur" role="navigation" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }: { isActive: boolean }) =>
                  [
                    'flex-1 rounded-2xl px-4 py-2 text-center transition focus:outline-none focus:ring-2 focus:ring-brand-500/50',
                    isActive ? 'bg-brand-500 text-white shadow-lg' : 'text-white/60 hover:bg-brand-900/30',
                  ].join(' ')
                }
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <main className="mt-6 flex-1" role="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

