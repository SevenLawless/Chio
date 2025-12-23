import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useMemo } from 'react';

const navItems = [
  { label: 'Daily Flow', to: '/app/tasks' },
];

// Randomly select a background image from back1.jpg to back5.jpg
const getRandomBackground = () => {
  const randomNum = Math.floor(Math.random() * 5) + 1;
  return `/img/back/back${randomNum}.jpg`;
};

const AppLayout = () => {
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();
  const location = useLocation();

  // Memoize background image to persist across re-renders
  const backgroundImage = useMemo(() => getRandomBackground(), []);

  const handleLogout = () => {
    clearAuth();
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 relative">
      {/* Dimmed background image */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-15 pointer-events-none"
        style={{ backgroundImage: `url('${backgroundImage}')` }}
        aria-hidden="true"
      />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[95%] flex-col px-4 pb-10 pt-6 sm:px-6 lg:px-8 lg:pt-10 xl:px-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-brand-800/30 bg-brand-900/20 px-6 py-5 backdrop-blur md:flex-row md:items-center md:justify-between" role="banner">
          <div>
            <p className="text-sm text-white/60">Hi, {user?.username ?? 'Explorer'}</p>
            <h1 className="text-2xl font-semibold tracking-tight text-white">CHIO</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
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

