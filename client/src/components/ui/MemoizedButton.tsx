/**
 * Memoized Button Component
 * Optimized to prevent unnecessary re-renders
 */

import React, { memo, useCallback } from 'react';
import { Loader2 } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

export interface MemoizedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  ariaControls?: string;
  id?: string;
}

const MemoizedButton = memo(function MemoizedButton({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  className,
  ariaLabel,
  ariaExpanded,
  ariaControls,
  id
}: MemoizedButtonProps) {
  // Memoized click handler to prevent unnecessary re-renders
  const handleClick = useCallback(() => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  }, [disabled, loading, onClick]);

  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'bg-[var(--c-solid)] text-white hover:bg-[var(--c-text)] active:bg-[var(--c-solid)] shadow-sm',
    secondary: 'bg-stone-100 text-stone-900 hover:bg-stone-200 active:bg-stone-300',
    outline: 'border-2 border-[var(--c-solid)] text-[var(--c-text)] hover:bg-[var(--c-bg)] active:bg-[var(--c-accent)]/40',
    ghost: 'text-stone-700 hover:bg-stone-100 active:bg-stone-200',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm'
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2'
  };

  return (
    <button
      id={id}
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      aria-busy={loading}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
      {!loading && icon && iconPosition === 'left' && (
        <span className="flex-shrink-0" aria-hidden="true">{icon}</span>
      )}
      <span>{children}</span>
      {!loading && icon && iconPosition === 'right' && (
        <span className="flex-shrink-0" aria-hidden="true">{icon}</span>
      )}
    </button>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.children === nextProps.children &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.loading === nextProps.loading &&
    prevProps.variant === nextProps.variant &&
    prevProps.size === nextProps.size &&
    prevProps.className === nextProps.className &&
    prevProps.ariaExpanded === nextProps.ariaExpanded &&
    prevProps.icon === nextProps.icon
  );
});

MemoizedButton.displayName = 'MemoizedButton';

export default MemoizedButton;
