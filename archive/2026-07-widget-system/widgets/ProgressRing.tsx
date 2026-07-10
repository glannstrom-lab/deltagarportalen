interface ProgressRingProps {
  /** 0-100 */
  value: number
  /** Diameter in px */
  size?: 48 | 64 | 88
  /** Optional label rendered centered */
  label?: string
}

export function ProgressRing({ value, size = 88, label }: ProgressRingProps) {
  const stroke = size === 48 ? 4 : size === 64 ? 6 : 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={`${value}% klart`}>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="var(--stone-150)" strokeWidth={stroke}
        />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="var(--c-solid)" strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {label && (
        <span
          className="absolute text-[var(--stone-900)] font-bold pointer-events-none"
          style={{ fontSize: size === 48 ? 12 : size === 64 ? 14 : 18 }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
