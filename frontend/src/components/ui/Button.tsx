import type { ButtonHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

const variantClasses = {
  primary: 'bg-white text-slate-900 hover:bg-white/90',
  outline: 'border border-white/30 text-white hover:border-white/70',
  ghost: 'text-white/70 hover:text-white hover:bg-white/10',
  danger: 'bg-rose-500 text-white hover:bg-rose-400',
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variantClasses;
};

export const Button = ({ variant = 'primary', className, ...props }: ButtonProps) => (
  <button
    className={twMerge(
      'rounded-2xl px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50',
      variantClasses[variant],
      className,
    )}
    {...props}
  />
);

