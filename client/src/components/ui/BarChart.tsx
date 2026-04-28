interface BarChartProps {
  data: { label: string; value: number; color: string }[]
}

export function BarChart({ data }: BarChartProps) {
  const max = Math.max(...data.map(d => d.value))

  return (
    <div className="card">
      <h3 className="font-semibold text-stone-800 mb-6">Jobbsök aktivitet</h3>
      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="text-sm text-stone-700 w-16">{item.label}</span>
            <div className="flex-1 h-8 bg-stone-100 rounded-lg overflow-hidden">
              <div
                className={`h-full rounded-lg transition-all duration-500 ${item.color}`}
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-stone-700 w-8">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
