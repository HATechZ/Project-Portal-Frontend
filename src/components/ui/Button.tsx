import type { ButtonHTMLAttributes } from 'react';
import { cx } from '@/utils/cx';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return <button className={cx('btn', `btn--${variant}`, className)} {...props} />;
}
