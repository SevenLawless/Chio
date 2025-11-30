import type { HTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'neutral' | 'success' | 'danger' | 'warning';
};

const toneStyles = {
  neutral: 'bg-white/10 text-white',
  success: 'bg-emerald-500/20 text-emerald-200',
  danger: 'bg-rose-500/20 text-rose-200',
  warning: 'bg-amber-500/20 text-amber-200',
};

export const Badge = ({ tone = 'neutral', className, ...props }: BadgeProps) => (
  <span
    className={twMerge('rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide', toneStyles[tone], className)}
    {...props}
  />
);

