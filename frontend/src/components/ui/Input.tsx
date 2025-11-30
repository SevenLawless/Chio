import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={twMerge(
        'w-full rounded-2xl border border-brand-800/30 bg-brand-900/20 px-4 py-3 text-base text-white placeholder:text-white/40 outline-none focus:border-brand-500 focus:bg-brand-900/30',
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = 'Input';

