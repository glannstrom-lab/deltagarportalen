import { cn } from '@/lib/utils'

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'default'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  className?: string
  disabled?: boolean
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  onClick,
  className,
  disabled = false
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-xl font-medium transition-colors inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-violet-600 text-white hover:bg-violet-700': variant === 'primary' || variant === 'default',
          'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50': variant === 'secondary',
          'border border-violet-600 text-violet-600 hover:bg-violet-50': variant === 'outline',
          'text-slate-600 hover:bg-slate-100': variant === 'ghost',
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-5 py-2.5': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
        },
        className
      )}
    >
      {children}
    </button>
  )
}
