/**
 * Button Component
 * Standardiserad knapp-komponent med olika varianter och storlekar
 * UPPDATERAD: "Calm & Capable" färgpalett (Violet + Warm Stone)
 */

import { cn } from '@/lib/utils'
import { buttonVariants, touch, animations } from '@/styles/design-system'
import { Loader2 } from '@/components/ui/icons'

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
    'inline-flex items-center justify-center gap-1.5 sm:gap-2',
    'font-medium transition-all duration-200',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    animations.press,

    // Variant styling
    buttonVariants[actualVariant as keyof typeof buttonVariants],

    // Size styling - auto touch-optimized on mobile
    size === 'sm' && 'px-2.5 py-1.5 sm:px-3 text-xs sm:text-sm min-h-[40px] sm:min-h-[36px]',
    size === 'md' && 'px-4 py-2.5 sm:px-5 text-sm sm:text-base min-h-[44px]',
    size === 'lg' && 'px-5 py-3 sm:px-6 text-base sm:text-lg min-h-[48px] sm:min-h-[52px]',
    size === 'touch' && cn(touch.button, 'text-sm sm:text-base'),
    size === 'touch-lg' && cn(touch.buttonLarge, 'text-base sm:text-lg font-semibold'),

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
      'bg-white border border-stone-200 text-stone-700',
      'hover:bg-stone-50 hover:border-stone-300'
    ),
    ghost: cn(
      'bg-transparent text-stone-600',
      'hover:bg-stone-100 hover:text-stone-900'
    ),
    primary: cn(
      'bg-violet-600 text-white',
      'hover:bg-violet-700'
    ),
  }
  
  // Responsive sizes - larger on mobile for better touch targets
  const sizeClasses = {
    sm: 'w-9 h-9 sm:w-8 sm:h-8 min-w-[36px] min-h-[36px]',
    md: 'w-11 h-11 sm:w-10 sm:h-10 min-w-[44px] min-h-[44px]',
    lg: 'w-12 h-12 min-w-[48px] min-h-[48px]',
  }
  
  return (
    <button
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center rounded-lg',
        'transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2',
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
