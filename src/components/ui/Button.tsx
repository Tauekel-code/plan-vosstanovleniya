import type { ButtonHTMLAttributes } from 'react';
import clsx from '../../utils/clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-brass text-ink hover:bg-brass-soft font-semibold',
  ghost: 'bg-transparent text-white/70 hover:bg-white/5 hover:text-white',
  outline: 'border border-panel-line text-white/80 hover:border-white/30 hover:text-white',
  danger: 'bg-garnet/15 text-garnet-soft hover:bg-garnet/25',
};

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({ variant = 'outline', size = 'md', className, ...rest }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg transition-colors duration-150',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    />
  );
}
