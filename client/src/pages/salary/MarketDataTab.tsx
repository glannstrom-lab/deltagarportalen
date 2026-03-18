/**
 * Market Data Tab - Salary statistics by industry and region
 */
import { useState } from 'react'
import { BarChart3, TrendingUp, MapPin, Building2, Users, ArrowUp, ArrowDown } from 'lucide-react'
import { Card } from '@/components/ui'
import { cn } from '@/lib/utils'

// Industry salary data (monthly SEK)
const INDUSTRY_DATA = [
  { name: 'IT & Tech', median: 52000, change: 4.2, employees: '320 000' },
  { name: 'Finans & Bank', median: 55000, change: 3.1, employees: '85 000' },
  { name: 'Juridik', median: 55000, change: 3.8, employees: '45 000' },
  { name: 'Teknik & Ingenjör', median: 48000, change: 3.5, employees: '180 000' },
  { name: 'Ekonomi', median: 48000, change: 3.1, employees: '120 000' },
  { name: 'HR & Personal', median: 43000, change: 2.5, employees: '65 000' },
  { name: 'Marknadsföring', median: 42000, change: 2.8, employees: '95 000' },
  { name: 'Hälso- & Sjukvård', median: 40000, change: 2.9, employees: '450 000' },
  { name: 'Försäljning', median: 40000, change: 2.2, employees: '210 000' },
  { name: 'Design & Kreativt', median: 40000, change: 2.6, employees: '55 000' },
  { name: 'Bygg & Hantverk', median: 38000, change: 2.3, employees: '320 000' },
  { name: 'Utbildning', median: 38000, change: 2.0, employees: '280 000' },
  { name: 'Administration', median: 35000, change: 1.8, employees: '180 000' },
]

// Regional data
const REGIONAL_DATA = [
  { region: 'Stockholm', premium: '+15%', avgSalary: 48000, costOfLiving: 'Hög' },
  { region: 'Göteborg', premium: '+8%', avgSalary: 44000, costOfLiving: 'Medel-hög' },
  { region: 'Malmö', premium: '+5%', avgSalary: 42000, costOfLiving: 'Medel' },
  { region: 'Uppsala', premium: '+3%', avgSalary: 41000, costOfLiving: 'Medel-hög' },
  { region: 'Linköping', premium: '0%', avgSalary: 40000, costOfLiving: 'Medel' },
  { region: 'Västerås', premium: '0%', avgSalary: 40000, costOfLiving: 'Medel' },
  { region: 'Umeå', premium: '-3%', avgSalary: 39000, costOfLiving: 'Medel' },
  { region: 'Övriga', premium: '-5%', avgSalary: 38000, costOfLiving: 'Låg-medel' },
]

// Hot skills with salary premiums
const HOT_SKILLS = [
  { skill: 'AI/Machine Learning', premium: '+25-40%', demand: 'Mycket hög' },
  { skill: 'Cloud Architecture', premium: '+20-35%', demand: 'Mycket hög' },
  { skill: 'Cybersecurity', premium: '+20-30%', demand: 'Hög' },
  { skill: 'Data Engineering', premium: '+15-25%', demand: 'Hög' },
  { skill: 'DevOps/SRE', premium: '+15-25%', demand: 'Hög' },
  { skill: 'Product Management', premium: '+10-20%', demand: 'Medel-hög' },
]

export default function MarketDataTab() {
  const [selectedView, setSelectedView] = useState<'industry' | 'region'>('industry')

  const maxMedian = Math.max(...INDUSTRY_DATA.map(d => d.median))

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Marknadsdata</h2>
            <p className="text-slate-600 mt-1">
              Lönestatistik per bransch och region i Sverige. Data uppdateras kvartalsvis.
            </p>
          </div>
        </div>
      </Card>

      {/* View toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedView('industry')}
          className={cn(
            "px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2",
            selectedView === 'industry'
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          <Building2 className="w-4 h-4" />
          Per bransch
        </button>
        <button
          onClick={() => setSelectedView('region')}
          className={cn(
            "px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2",
            selectedView === 'region'
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          <MapPin className="w-4 h-4" />
          Per region
        </button>
      </div>

      {/* Industry view */}
      {selectedView === 'industry' && (
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Medianlön per bransch
          </h3>

          <div className="space-y-3">
            {INDUSTRY_DATA.map((industry) => (
              <div key={industry.name} className="group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700">{industry.name}</span>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-xs flex items-center gap-0.5",
                      industry.change >= 3 ? "text-emerald-600" : "text-slate-500"
                    )}>
                      {industry.change >= 3 ? <ArrowUp className="w-3 h-3" /> : null}
                      {industry.change}%/år
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {industry.median.toLocaleString('sv-SE')} kr
                    </span>
                  </div>
                </div>
                <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all group-hover:from-blue-600 group-hover:to-blue-700"
                    style={{ width: `${(industry.median / maxMedian) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  <Users className="w-3 h-3 inline mr-1" />
                  ~{industry.employees} anställda i Sverige
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Region view */}
      {selectedView === 'region' && (
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Lönenivå per region
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Region</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Lönepremie</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Snittlön</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Levnadskostnad</th>
                </tr>
              </thead>
              <tbody>
                {REGIONAL_DATA.map((region) => (
                  <tr key={region.region} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-800">{region.region}</td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        region.premium.startsWith('+')
                          ? "bg-emerald-100 text-emerald-700"
                          : region.premium.startsWith('-')
                          ? "bg-rose-100 text-rose-700"
                          : "bg-slate-100 text-slate-600"
                      )}>
                        {region.premium}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {region.avgSalary.toLocaleString('sv-SE')} kr
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-500">{region.costOfLiving}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Hot skills */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-600" />
          Kompetenser med hög lönepremie
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {HOT_SKILLS.map((item) => (
            <div
              key={item.skill}
              className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100"
            >
              <p className="font-medium text-slate-800">{item.skill}</p>
              <p className="text-lg font-bold text-amber-700 mt-1">{item.premium}</p>
              <p className="text-xs text-slate-500 mt-1">Efterfrågan: {item.demand}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Disclaimer */}
      <Card className="bg-slate-50 border-slate-200">
        <p className="text-sm text-slate-500">
          <strong>Om statistiken:</strong> Data baseras på branschrapporter, SCB-statistik och löneundersökningar.
          Siffror är uppskattningar och kan variera beroende på specifik roll, företagsstorlek och individuella faktorer.
          Senast uppdaterad: Q1 2026.
        </p>
      </Card>
    </div>
  )
}
