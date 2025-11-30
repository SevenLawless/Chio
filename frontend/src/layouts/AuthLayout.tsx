import { Outlet, Link, useLocation } from 'react-router-dom';

const AuthLayout = () => {
  const location = useLocation();
  const isRegister = location.pathname.includes('register');

  return (
    <div className="min-h-screen bg-black text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-2">
        <div 
          className="relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex"
          style={{
            backgroundImage: 'url(/img/180428.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 space-y-6">
            <p className="inline-flex items-center rounded-full bg-white/10 px-4 py-1 text-sm font-medium backdrop-blur">
              CHIO
            </p>
            <h1 className="text-4xl font-semibold leading-tight">
              Chio <span className="text-white/80">yappin.</span>
            </h1>
            <p className="text-white/70">
              Rituals db Gamify it latah.
            </p>
          </div>
          <div className="relative z-10 space-y-2 text-white/70">
            <p className="text-sm uppercase tracking-[0.3em]">Testimonials</p>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              "Mzl makayn walo db wlkin mli yjiw reviews nktbhom hna." —{' '}
              <span className="font-semibold text-white">wlkin ana m9wd u dont need testimonials</span>
            </div>
          </div>
        </div>
        <div className="relative flex items-center justify-center bg-white px-6 py-10 sm:px-10">
          <div className="w-full max-w-md space-y-8">
            <div>
              <Link to="/" className="inline-flex items-center gap-2 text-xl font-semibold text-slate-900">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 text-white">
                  <img src="/img/180428.jpg" alt="CHIO" className="h-10 w-10" />
                </span>
                CHIO
              </Link>
              <p className="mt-2 text-sm text-slate-500">
                {isRegister ? 'Create a new account.' : 'Welcome back.'}
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

