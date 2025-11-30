import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/auth';

const schema = z.object({
  username: z.string().min(3, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormValues = z.infer<typeof schema>;

const LoginPage = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      api.post<{ user: { id: string; username: string }; token: string }>('/auth/login', data),
    onSuccess: (data) => {
      setAuth({ user: data.user, token: data.token });
      navigate('/app/tasks', { replace: true });
    },
  });

  return (
    <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-600" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          {...register('username')}
        />
        {errors.username && <p className="text-sm text-rose-500">{errors.username.message}</p>}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-600" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          {...register('password')}
        />
        {errors.password && <p className="text-sm text-rose-500">{errors.password.message}</p>}
      </div>
      {mutation.isError && (
        <div className="rounded-2xl bg-rose-50 px-4 py-3" role="alert" aria-live="polite">
          <p className="text-sm font-medium text-rose-900">Login failed</p>
          <p className="mt-1 text-sm text-rose-600">{(mutation.error as Error).message}</p>
        </div>
      )}
      <button
        type="submit"
        disabled={mutation.isPending}
        className="flex w-full items-center justify-center rounded-2xl bg-brand-500 px-4 py-3 text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-800/50"
      >
        {mutation.isPending ? 'Signing in…' : 'Enter workspace'}
      </button>
      <p className="text-center text-sm text-slate-500">
        Need an account?{' '}
        <Link to="/auth/register" className="font-semibold text-slate-900">
          Create one
        </Link>
      </p>
    </form>
  );
};

export default LoginPage;

