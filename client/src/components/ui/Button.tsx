import { cn } from '@/lib/utils'

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'default'
  size?: 'sm' | 'md' | 'lg' | 'touch' | 'touch-lg'
  onClick?: () => void
  className?: string
  disabled?: boolean
  fullWidth?: boolean
  ariaLabel?: string
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  onClick,
  className,
  disabled = false,
  fullWidth = false,
  ariaLabel,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'rounded-xl font-medium transition-all duration-200 inline-flex items-center justify-center',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'touch-manipulation active:scale-[0.98]',
        fullWidth && 'w-full',
        {
          // Variants
          'bg-violet-600 text-white hover:bg-violet-700 shadow-sm hover:shadow': variant === 'primary' || variant === 'default',
          'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50': variant === 'secondary',
          'border border-violet-600 text-violet-600 hover:bg-violet-50': variant === 'outline',
          'text-slate-600 hover:bg-slate-100': variant === 'ghost',
          // Sizes - standard
          'px-3 py-1.5 text-sm min-h-[36px]': size === 'sm',
          'px-5 py-2.5 min-h-[44px]': size === 'md',
          'px-6 py-3 text-lg min-h-[52px]': size === 'lg',
          // Sizes - touch-optimized (minimum 44px för tillgänglighet)
          'px-4 py-3 text-base min-h-[48px] min-w-[48px]': size === 'touch',
          'px-6 py-4 text-lg min-h-[56px] min-w-[56px] font-semibold': size === 'touch-lg',
        },
        className
      )}
    >
      {children}
    </button>
  )
}

// Touch-vänlig knapp för mobil
interface TouchButtonProps extends Omit<ButtonProps, 'size'> {
  touchSize?: 'default' | 'large'
}

export function TouchButton({
  children,
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
    >
      {children}
    </Button>
  )
}
