interface ProgressProps {
  value: number
  className?: string
  /**
   * Tillgänglig etikett (TI5). Utan en är stapeln osynlig i
   * tillgänglighetsträdet — en skärmläsare hör bara "förloppsindikator, N
   * procent" utan att veta vad som mäts. Valfri eftersom en anropare kan
   * välja att i stället sätta `aria-labelledby` på ett omslutande element;
   * `aria-label` sätts bara när `label` faktiskt ges.
   */
  label?: string
}

export function Progress({ value, className = '', label }: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value))

  return (
    <div className={`h-2 bg-stone-100 rounded-full overflow-hidden ${className}`}>
      <div
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-full bg-[var(--c-solid)] rounded-full transition-all duration-500"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  )
}
