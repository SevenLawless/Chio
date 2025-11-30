import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={twMerge(
        'w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/40 outline-none focus:border-white focus:bg-white/10',
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = 'Input';

