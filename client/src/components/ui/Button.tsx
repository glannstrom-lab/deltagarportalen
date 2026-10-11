/**
 * Button Component
 * Standardiserad knapp-komponent med olika varianter och storlekar
 * UPPDATERAD: "Calm & Capable" färgpalett (Violet + Warm Stone)
 */

import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { buttonVariants, touch, animations } from '@/styles/design-system'
import { Loader2 } from '@/components/ui/icons'

/**
 * Knappregeln i omtaget "Kvarter" (2026-10-11): EN primärknapp per vy.
 *   primary   — fylld (Gran i kontorstonen, hubbfärgen annars)
 *   secondary — ramad
 *   tertiary  — text
 * Resten av handlingarna i MerMeny. `ton="kvarter"` ger förslagets form och
 * färger direkt ur tokens (--j-*), oberoende av hubbfärgen: 44 px höjd,
 * rundning 14, fokusring 3 px Gran. Utan `ton` ser knappen ut som förut.
 * Varje knapp bär `data-variant`, så ett test kan räkna primärknapparna.
 */
const KVARTER_BAS =
  'rounded-[var(--j-r-m)] font-semibold min-h-[44px] ' +
  'focus:outline-none focus-visible:outline focus-visible:outline-[3px] ' +
  'focus-visible:outline-offset-2 focus-visible:outline-[var(--j-fokus)]'

const KVARTER_VARIANT: Record<'primary' | 'secondary' | 'tertiary', string> = {
  primary:
    'bg-[var(--j-gran)] text-[var(--j-pa-gran)] border border-transparent hover:brightness-110',
  secondary:
    'bg-[var(--j-kort)] text-[var(--j-blak)] border border-[var(--j-linje-2)] hover:bg-[var(--j-sankt)]',
  tertiary:
    'bg-transparent text-[var(--j-blak-2)] border border-transparent hover:bg-[var(--j-sankt)] hover:text-[var(--j-blak)]',
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost' | 'danger' | 'default'
  /** "kvarter" = omtagets knappar (tokens --j-*). Standard: portalens äldre knappar. */
  ton?: 'standard' | 'kvarter'
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
  touchOptimized: _touchOptimized = false,
  ton = 'standard',
  disabled,
  className,
  ...props
}: ButtonProps) {
  // Map legacy 'default' variant to 'primary'
  const actualVariant = variant === 'default' ? 'primary' : variant
  const kvarter =
    ton === 'kvarter' &&
    (actualVariant === 'primary' || actualVariant === 'secondary' || actualVariant === 'tertiary')

  const baseClasses = cn(
    // Base styling
    'inline-flex items-center justify-center gap-1.5 sm:gap-2',
    'font-medium transition-all duration-200',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    animations.press,

    // Variant styling. `tertiary` utan kvarter-ton är textknappen i den
    // äldre stilen, alltså samma som ghost.
    kvarter
      ? cn(KVARTER_BAS, KVARTER_VARIANT[actualVariant as keyof typeof KVARTER_VARIANT])
      : buttonVariants[(actualVariant === 'tertiary' ? 'ghost' : actualVariant) as keyof typeof buttonVariants],

    // Size styling - auto touch-optimized on mobile
    // MB3 (2026-09-08): text-sm på ALLA bredder. `text-xs sm:text-sm` gav 12 px
    // knapptext under 640 px på bl.a. "Säg upp kopplingen" och "Spara
    // reflektion" — tap-målet var fint (40 px), läsbarheten inte. Över 640 px
    // var det redan text-sm, så desktop är oförändrad.
    size === 'sm' && 'px-2.5 py-1.5 sm:px-3 text-sm min-h-[40px] sm:min-h-[36px]',
    size === 'md' && 'px-4 py-2.5 sm:px-5 text-sm sm:text-base min-h-[44px]',
    size === 'lg' && 'px-5 py-3 sm:px-6 text-base sm:text-lg min-h-[48px] sm:min-h-[52px]',
    size === 'touch' && cn(touch.button, 'text-sm sm:text-base'),
    size === 'touch-lg' && cn(touch.buttonLarge, 'text-base sm:text-lg font-semibold'),

    // Kvarter: 44 px tryckyta på mobil även för sm; 36 px bara på dator
    // (förslaget: "mindre knappar bara i täta tabeller på dator").
    kvarter && size === 'sm' && 'min-h-[44px] sm:min-h-[36px]',

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
      data-variant={actualVariant}
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
      'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200',
      'hover:bg-stone-50 dark:hover:bg-stone-800 hover:border-stone-300 dark:hover:border-stone-600'
    ),
    ghost: cn(
      'bg-transparent text-stone-600 dark:text-stone-300',
      'hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100'
    ),
    primary: cn(
      'bg-[var(--c-solid)] text-white',
      'hover:bg-[var(--c-solid)]'
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
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)] focus-visible:ring-offset-2',
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
  const { t } = useTranslation()
  return (
    <IconButton
      icon={
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      }
      label={t('common.close', 'Stäng')}
      variant="ghost"
      size={size}
      className={className}
      {...props}
    />
  )
}

export default Button
