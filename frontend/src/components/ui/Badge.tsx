import type { HTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'neutral' | 'success' | 'danger' | 'warning';
};

const toneStyles = {
  neutral: 'bg-brand-900/30 text-brand-200 border border-brand-800/30',
  success: 'bg-brand-400 text-white border border-brand-400',
  danger: 'bg-rose-500/20 text-rose-200 border border-rose-500/30',
  warning: 'bg-amber-500/20 text-amber-200 border border-amber-500/30',
};

export const Badge = ({ tone = 'neutral', className, ...props }: BadgeProps) => (
  <span
    className={twMerge('rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide', toneStyles[tone], className)}
    {...props}
  />
);

