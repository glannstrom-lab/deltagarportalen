import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn(
      'bg-white rounded-2xl border border-slate-100',
      className
    )}>
      {children}
    </div>
  )
}
