interface ProgressItem {
  label: string
  value: number
  color: string
}

interface ProgressBarsProps {
  items: ProgressItem[]
}

export function ProgressBars({ items }: ProgressBarsProps) {
  return (
    <div className="card">
      <h3 className="font-semibold text-slate-800 mb-6">Din framsteg</h3>
      <div className="space-y-5">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">{item.label}</span>
              <span className="font-semibold text-slate-800">{item.value}%</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
