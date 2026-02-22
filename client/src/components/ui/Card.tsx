import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div 
      className={cn(
        'bg-white rounded-2xl border border-slate-100',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
