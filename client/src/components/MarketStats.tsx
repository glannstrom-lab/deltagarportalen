import { useState, useEffect } from 'react'
import { TrendingUp, MapPin, DollarSign, Star, BarChart3 } from 'lucide-react'
import { marketStatsService, type CompetenceDemand, type RegionalStat } from '../services/marketStatsService'

export default function MarketStats() {
  const [topCompetences, setTopCompetences] = useState<CompetenceDemand[]>([])
  const [regionalStats, setRegionalStats] = useState<RegionalStat[]>([])
  const [trending, setTrending] = useState<any[]>([])
  const [generalStats, setGeneralStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true)
      try {
        const [competences, regions, trendingJobs, general] = await Promise.all([
          marketStatsService.getTopCompetences(10),
          marketStatsService.getRegionalStats(),
          marketStatsService.getTrendingOccupations(5),
          marketStatsService.getGeneralStats(),
        ])

        setTopCompetences(competences)
        setRegionalStats(regions)
        setTrending(trendingJobs)
        setGeneralStats(general)
      } catch (error) {
        console.error('Error loading stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️'
      case 'down': return '↘️'
      default: return '➡️'
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600">Laddar marknadsstatistik...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Arbetsmarknadsstatistik</h2>
        <p className="text-slate-500 mt-1">Aktuella trender och efterfrågan</p>
      </div>

      {/* General Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {generalStats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {stat.value.toLocaleString('sv-SE')}
                </p>
              </div>
              <div className="p-3 bg-teal-100 rounded-xl">
                <BarChart3 className="w-6 h-6 text-teal-600" />
              </div>
            </div>
            {stat.change && (
              <p className={`text-sm mt-2 ${stat.trend === 'up' ? 'text-green-600' : 'text-slate-600'}`}>
                {stat.trend === 'up' ? '+' : ''}{stat.change}% sedan förra månaden
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Trending Jobs */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-amber-600" />
          <h3 className="font-semibold text-amber-900">Heta yrken just nu</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trending.map((job, idx) => (
            <div key={idx} className="bg-white p-4 rounded-lg border border-amber-100">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-slate-900">{job.occupation}</h4>
                <span className="text-green-600 font-bold text-sm">+{job.growth}%</span>
              </div>
              <p className="text-sm text-slate-600">{job.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Competences */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-slate-900">Mest efterfrågade kompetenser</h3>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {topCompetences.map((comp, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50">
              <div className="flex items-center gap-4">
                <span className="w-8 h-8 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </span>
                <div>
                  <p className="font-medium text-slate-900 capitalize">{comp.competence}</p>
                  <p className="text-sm text-slate-500">{comp.count.toLocaleString('sv-SE')} annonser</p>
                </div>
              </div>
              <span className="text-2xl" title={comp.trend === 'up' ? 'Ökande efterfrågan' : 'Stabil efterfrågan'}>
                {getTrendIcon(comp.trend)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Regional Stats */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-slate-900">Jobb per region</h3>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {regionalStats.map((region, idx) => (
            <div key={idx} className="p-4 hover:bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-slate-900">{region.region}</h4>
                <span className={`text-sm font-medium ${region.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {region.growth > 0 ? '+' : ''}{region.growth}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>{region.totalJobs.toLocaleString('sv-SE')} lediga jobb</span>
                <span className="text-slate-400">
                  Toppar: {region.topOccupations.slice(0, 2).join(', ')}
                </span>
              </div>
              <div className="mt-2 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-500"
                  style={{ width: `${Math.min((region.totalJobs / 20000) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Salary Info */}
      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-teal-600" />
          <h3 className="font-semibold text-slate-900">Löneinformation</h3>
        </div>
        <p className="text-slate-600 text-sm">
          Lönestatistik kommer från SCB och Arbetsförmedlingen. Observera att löner varierar 
          beroende på erfarenhet, utbildning och arbetsplats.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm">
            Utvecklare: ~45 000 kr/mån
          </span>
          <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm">
            Sjuksköterska: ~38 000 kr/mån
          </span>
          <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm">
            Lärare: ~35 000 kr/mån
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-slate-500">
        <p>Data från Arbetsförmedlingen och SCB • Uppdateras dagligen</p>
      </div>
    </div>
  )
}
