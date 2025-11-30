import type { ButtonHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

const variantClasses = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600',
  outline: 'border border-brand-600/50 text-white hover:border-brand-500 hover:bg-brand-900/20',
  ghost: 'text-white/70 hover:text-white hover:bg-brand-900/20',
  danger: 'bg-rose-500 text-white hover:bg-rose-400',
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variantClasses;
};

export const Button = ({ variant = 'primary', className, ...props }: ButtonProps) => (
  <button
    className={twMerge(
      'rounded-2xl px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50',
      variantClasses[variant],
      className,
    )}
    {...props}
  />
);

