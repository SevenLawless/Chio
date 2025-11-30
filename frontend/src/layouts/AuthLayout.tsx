import { Outlet, Link, useLocation } from 'react-router-dom';

const AuthLayout = () => {
  const location = useLocation();
  const isRegister = location.pathname.includes('register');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-2">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-500 via-indigo-600 to-slate-900 p-12 text-white lg:flex">
          <div className="space-y-6">
            <p className="inline-flex items-center rounded-full bg-white/10 px-4 py-1 text-sm font-medium backdrop-blur">
              TaskFlow Studio · modern productivity
            </p>
            <h1 className="text-4xl font-semibold leading-tight">
              Elegant routines, <span className="text-white/80">everyday.</span>
            </h1>
            <p className="text-white/70">
              Track rituals, plan one-off missions, and let insight-rich dashboards tell the story of your week.
            </p>
          </div>
          <div className="space-y-2 text-white/70">
            <p className="text-sm uppercase tracking-[0.3em]">Testimonials</p>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              “Our ops standups now start with TaskFlow snapshots. Everyone sees where energy lives at a glance.” —{' '}
              <span className="font-semibold text-white">Maya, Ritual Ops</span>
            </div>
          </div>
        </div>
        <div className="relative flex items-center justify-center bg-white px-6 py-10 sm:px-10">
          <div className="w-full max-w-md space-y-8">
            <div>
              <Link to="/" className="inline-flex items-center gap-2 text-xl font-semibold text-slate-900">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 text-white">
                  TF
                </span>
                TaskFlow
              </Link>
              <p className="mt-2 text-sm text-slate-500">
                {isRegister ? 'Create a new workspace.' : 'Welcome back. Let’s get you synced.'}
              </p>
            </div>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

