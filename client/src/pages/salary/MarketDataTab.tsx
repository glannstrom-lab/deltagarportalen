/**
 * Market Data Tab - Salary statistics by industry and region
 * Features: interactive sorting, filtering, visual charts, search, expandable rows
 */
import { useState, useMemo } from 'react'
import { BarChart3, TrendingUp, MapPin, Building2, Users, ArrowUp, ArrowDown, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

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

type SortKey = 'name' | 'median' | 'change'
type SortOrder = 'asc' | 'desc'

interface ExpandedRows {
  [key: string]: boolean
}

export default function MarketDataTab() {
  const [selectedView, setSelectedView] = useState<'industry' | 'region'>('industry')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('median')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [expandedRows, setExpandedRows] = useState<ExpandedRows>({})

  const maxMedian = Math.max(...INDUSTRY_DATA.map(d => d.median))

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder('desc')
    }
  }

  const toggleExpandRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const filteredAndSortedIndustries = useMemo(() => {
    let filtered = INDUSTRY_DATA.filter(ind =>
      ind.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    filtered.sort((a, b) => {
      let aVal = a[sortKey] as any
      let bVal = b[sortKey] as any

      if (sortKey === 'median') {
        aVal = parseInt(aVal)
        bVal = parseInt(bVal)
      } else if (sortKey === 'change') {
        aVal = parseFloat(aVal)
        bVal = parseFloat(bVal)
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    return filtered
  }, [searchTerm, sortKey, sortOrder])

  const filteredRegions = useMemo(() => {
    return REGIONAL_DATA.filter(reg =>
      reg.region.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [searchTerm])

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

      {/* View toggle and search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
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

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={selectedView === 'industry' ? 'Sök bransch...' : 'Sök region...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Industry view */}
      {selectedView === 'industry' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Medianlön per bransch
            </h3>
            <span className="text-xs text-slate-500">{filteredAndSortedIndustries.length} resultat</span>
          </div>

          {/* Sort controls */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => toggleSort('median')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1',
                sortKey === 'median'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              Lön {sortKey === 'median' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => toggleSort('change')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1',
                sortKey === 'change'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              Ökning {sortKey === 'change' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => toggleSort('name')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1',
                sortKey === 'name'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              Namn {sortKey === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>

          <AnimatePresence>
            {filteredAndSortedIndustries.length > 0 ? (
              <div className="space-y-2">
                {filteredAndSortedIndustries.map((industry) => {
                  const isExpanded = expandedRows[industry.name]
                  return (
                    <motion.div
                      key={industry.name}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group"
                    >
                      <button
                        onClick={() => toggleExpandRow(industry.name)}
                        className="w-full text-left hover:bg-blue-50/30 p-3 rounded-xl transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <span className={cn(
                              'transition-transform',
                              isExpanded && 'rotate-180'
                            )}>
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            </span>
                            <span className="text-sm font-medium text-slate-700">{industry.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "text-xs flex items-center gap-0.5 font-medium",
                              industry.change >= 3 ? "text-emerald-600" : "text-slate-500"
                            )}>
                              {industry.change >= 3 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3 opacity-30" />}
                              {industry.change}%/år
                            </span>
                            <span className="text-sm font-bold text-slate-900 min-w-fit">
                              {industry.median.toLocaleString('sv-SE')} kr
                            </span>
                          </div>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all group-hover:from-blue-600 group-hover:to-blue-700"
                            style={{ width: `${(industry.median / maxMedian) * 100}%` }}
                          />
                        </div>
                      </button>

                      {/* Expanded detail row */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3 pt-1 bg-blue-50/30 rounded-b-xl border-t border-blue-100/50">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="text-sm">
                                  <p className="text-slate-600 text-xs mb-1">Anställda i Sverige</p>
                                  <p className="font-semibold text-slate-900">~{industry.employees}</p>
                                </div>
                                <div className="text-sm">
                                  <p className="text-slate-600 text-xs mb-1">Årlig tillväxt</p>
                                  <p className={cn(
                                    'font-semibold',
                                    industry.change >= 3 ? 'text-emerald-600' : 'text-slate-500'
                                  )}>
                                    +{industry.change}%
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3 p-2 bg-white rounded-lg border border-blue-100">
                                <p className="text-xs text-slate-600 mb-2">Lönespektrum (uppskattning):</p>
                                <div className="flex justify-between text-xs text-slate-700">
                                  <span>Min: ~{Math.round(industry.median * 0.8).toLocaleString('sv-SE')} kr</span>
                                  <span>Max: ~{Math.round(industry.median * 1.3).toLocaleString('sv-SE')} kr</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Ingen bransch hittad för "{searchTerm}"</p>
              </div>
            )}
          </AnimatePresence>
        </Card>
      )}

      {/* Region view */}
      {selectedView === 'region' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Lönenivå per region
            </h3>
            <span className="text-xs text-slate-500">{filteredRegions.length} resultat</span>
          </div>

          <div className="space-y-3">
            {filteredRegions.length > 0 ? (
              filteredRegions.map((region) => {
                const isExpanded = expandedRows[region.region]
                const premiumNum = parseFloat(region.premium)
                return (
                  <motion.div
                    key={region.region}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border border-slate-200 rounded-xl overflow-hidden hover:border-blue-300 transition-colors"
                  >
                    <button
                      onClick={() => toggleExpandRow(region.region)}
                      className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{region.region}</p>
                        <p className="text-sm text-slate-600 mt-1">
                          {region.avgSalary.toLocaleString('sv-SE')} kr/månad
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap",
                          premiumNum > 0
                            ? "bg-emerald-100 text-emerald-700"
                            : premiumNum < 0
                            ? "bg-rose-100 text-rose-700"
                            : "bg-slate-100 text-slate-600"
                        )}>
                          {region.premium}
                        </span>
                        <span className={cn(
                          'transition-transform',
                          isExpanded && 'rotate-180'
                        )}>
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        </span>
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-slate-200 overflow-hidden"
                        >
                          <div className="px-4 py-3 bg-slate-50/30 space-y-4">
                            {/* Cost of living */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-slate-600 mb-1">Levnadskostnad</p>
                                <p className="font-semibold text-slate-900">{region.costOfLiving}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-600 mb-1">Snittlön</p>
                                <p className="font-semibold text-slate-900">{region.avgSalary.toLocaleString('sv-SE')} kr</p>
                              </div>
                            </div>

                            {/* Premium visualization */}
                            <div>
                              <p className="text-xs text-slate-600 mb-2">Lönepremie relativt genomsnitt</p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={cn(
                                      'h-full transition-all',
                                      premiumNum > 0 ? 'bg-emerald-500' : 'bg-rose-500'
                                    )}
                                    style={{ width: `${50 + (premiumNum * 2)}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-slate-700 min-w-fit">{region.premium}</span>
                              </div>
                            </div>

                            {/* Info */}
                            <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-600">
                              <p>
                                {premiumNum > 0
                                  ? `Högre löner än genomsnitt. Viktigt att väga detta mot levnadskostnaderna.`
                                  : premiumNum < 0
                                  ? `Lägre löner än genomsnitt, men ofta med lägre levnadskostnader.`
                                  : `Genomsnittlig lön för Sverige.`
                                }
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Ingen region hittad för "{searchTerm}"</p>
              </div>
            )}
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
