import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={twMerge(
        'w-full rounded-2xl border border-brand-800/30 bg-brand-900/20 px-4 py-3 text-base text-white placeholder:text-white/40 outline-none focus:border-brand-500 focus:bg-brand-900/30',
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = 'Textarea';

