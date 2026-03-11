/**
 * Button Component
 * Standardiserad knapp-komponent med olika varianter och storlekar
 * Följer design-systemet med konsekvent styling
 */

import { cn } from '@/lib/utils'
import { buttonVariants, touch, animations } from '@/styles/design-system'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'default'
  size?: 'sm' | 'md' | 'lg' | 'touch' | 'touch-lg'
  isLoading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  touchOptimized?: boolean
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  touchOptimized = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  // Map legacy 'default' variant to 'primary'
  const actualVariant = variant === 'default' ? 'primary' : variant
  
  const baseClasses = cn(
    // Base styling
    'inline-flex items-center justify-center gap-2',
    'font-medium transition-all duration-200',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    animations.press,
    
    // Variant styling
    buttonVariants[actualVariant as keyof typeof buttonVariants],
    
    // Size styling
    size === 'sm' && 'px-3 py-1.5 text-sm min-h-[36px]',
    size === 'md' && 'px-5 py-2.5 min-h-[44px]',
    size === 'lg' && 'px-6 py-3 text-lg min-h-[52px]',
    size === 'touch' && cn(touch.button, 'text-base'),
    size === 'touch-lg' && cn(touch.buttonLarge, 'text-lg font-semibold'),
    
    // Full width
    fullWidth && 'w-full',
    
    // Loading state
    isLoading && 'opacity-80 cursor-wait',
    
    className
  )
  
  return (
    <button
      className={baseClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {loadingText || children}
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  )
}

// Icon Button - för ikon-only knappar
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode
  label: string
  variant?: 'default' | 'ghost' | 'primary'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export function IconButton({
  icon,
  label,
  variant = 'default',
  size = 'md',
  isLoading,
  className,
  ...props
}: IconButtonProps) {
  const variantClasses = {
    default: cn(
      'bg-white border border-slate-200 text-slate-700',
      'hover:bg-slate-50 hover:border-slate-300'
    ),
    ghost: cn(
      'bg-transparent text-slate-600',
      'hover:bg-slate-100 hover:text-slate-900'
    ),
    primary: cn(
      'bg-indigo-600 text-white',
      'hover:bg-indigo-700'
    ),
  }
  
  const sizeClasses = {
    sm: 'w-9 h-9',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }
  
  return (
    <button
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center rounded-lg',
        'transition-all duration-200',
        animations.press,
        variantClasses[variant],
        sizeClasses[size],
        isLoading && 'opacity-80 cursor-wait',
        className
      )}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className={cn(
          'animate-spin',
          size === 'sm' && 'w-4 h-4',
          size === 'md' && 'w-5 h-5',
          size === 'lg' && 'w-6 h-6'
        )} />
      ) : (
        icon
      )}
    </button>
  )
}

// Touch-optimized Button för mobil
interface TouchButtonProps extends Omit<ButtonProps, 'size'> {
  touchSize?: 'default' | 'large'
}

export function TouchButton({
  touchSize = 'default',
  className,
  ...props
}: TouchButtonProps) {
  return (
    <Button
      size={touchSize === 'large' ? 'touch-lg' : 'touch'}
      className={cn(
        'mobile-btn-touch',
        className
      )}
      {...props}
    />
  )
}

// Close Button - standardiserad stäng-knapp
interface CloseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md'
}

export function CloseButton({ size = 'md', className, ...props }: CloseButtonProps) {
  return (
    <IconButton
      icon={
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      }
      label="Stäng"
      variant="ghost"
      size={size}
      className={className}
      {...props}
    />
  )
}

export default Button
