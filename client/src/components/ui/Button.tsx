import { cn } from '@/lib/utils'

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  className?: string
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  onClick,
  className 
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-xl font-medium transition-colors inline-flex items-center justify-center',
        {
          'bg-violet-600 text-white hover:bg-violet-700': variant === 'primary',
          'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50': variant === 'secondary',
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
