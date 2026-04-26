import { useState, useEffect } from 'react'
import { 
  Loader2,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  Minus,
} from '@/components/ui/icons'
import { afApi, type SkillTrend, type SalaryStats } from '@/services/arbetsformedlingenApi'

interface MarketInsightsProps {
  occupation?: string
}

export default function MarketInsights({ occupation }: MarketInsightsProps) {
  const [salaryStats, setSalaryStats] = useState<SalaryStats | null>(null)
  const [skillTrends, setSkillTrends] = useState<SkillTrend[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMarketData()
  }, [occupation])

  const loadMarketData = async () => {
    try {
      setLoading(true)
      
      if (occupation) {
        const salary = await afApi.getSalaryStats(occupation)
        setSalaryStats(salary)
      }
      
      const trends = await afApi.getSkillTrends()
      setSkillTrends(trends)
    } catch (err) {
      console.error('Market data error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={32} className="text-brand-900 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {salaryStats && (
        <div className="bg-white rounded-xl p-6 border">
          <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <DollarSign size={20} className="text-brand-900" />
            Lönestatistik för {salaryStats.occupation}
          </h4>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-slate-800">
                {salaryStats.salary_range.min.toLocaleString('sv-SE')}
              </p>
              <p className="text-xs text-slate-700">Lägsta</p>
            </div>
            <div className="bg-brand-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-brand-900">
                {salaryStats.median_salary.toLocaleString('sv-SE')}
              </p>
              <p className="text-xs text-brand-900">Median</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-slate-800">
                {salaryStats.salary_range.max.toLocaleString('sv-SE')}
              </p>
              <p className="text-xs text-slate-700">Högsta</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-6 border">
        <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-brand-900" />
          Trendande kompetenser
        </h4>
        
        <div className="space-y-3">
          {skillTrends.map((trend, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-700">{trend.skill}</span>
                  <span className={`text-sm font-medium ${
                    trend.trend_direction === 'up' ? 'text-brand-900' :
                    trend.trend_direction === 'down' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {trend.trend_direction === 'up' && '+'}{trend.growth_rate}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      trend.trend_direction === 'up' ? 'bg-brand-700' :
                      trend.trend_direction === 'down' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`}
                    style={{ width: `${Math.min(trend.current_demand, 100)}%` }}
                  />
                </div>
              </div>
              {trend.trend_direction === 'up' ? (
                <ArrowUpRight size={20} className="text-brand-700" />
              ) : (
                <Minus size={20} className="text-yellow-500" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
