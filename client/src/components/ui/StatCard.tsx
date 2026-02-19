import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string
  trend?: 'up' | 'down'
  trendValue?: string
  color?: 'purple' | 'orange' | 'blue' | 'pink'
}

export function StatCard({ label, value, trend, trendValue, color = 'purple' }: StatCardProps) {
  const colors = {
    purple: 'text-primary',
    orange: 'text-accent-orange',
    blue: 'text-accent-blue',
    pink: 'text-accent-pink',
  }

  return (
    <div className="card card-hover">
      <p className="text-slate-500 text-sm mb-2">{label}</p>
      <div className="flex items-end gap-3">
        <span className={`text-3xl font-bold ${colors[color]}`}>{value}</span>
        {trend && trendValue && (
          <div className={`flex items-center gap-1 text-sm mb-1 ${
            trend === 'up' ? 'text-accent-green' : 'text-red-500'
          }`}>
            {trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  )
}
