interface ProgressProps {
  value: number
  className?: string
}

export function Progress({ value, className = '' }: ProgressProps) {
  return (
    <div className={`h-2 bg-stone-100 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-[var(--c-solid)] rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
