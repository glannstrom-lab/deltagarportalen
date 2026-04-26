/**
 * Market Data Tab - Salary statistics by industry and region
 * Features: interactive sorting, filtering, visual charts, search, expandable rows
 */
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart3, TrendingUp, MapPin, Building2, Users, ArrowUp, ArrowDown, Search, Filter, ChevronDown, ChevronUp } from '@/components/ui/icons'
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
  const { t } = useTranslation()
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
      <Card className="bg-gradient-to-r from-brand-50 to-brand-100 dark:from-brand-900/20 dark:to-brand-900/20 border-brand-200 dark:border-brand-900">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/30 rounded-xl flex items-center justify-center shrink-0">
            <BarChart3 className="w-6 h-6 text-brand-900 dark:text-brand-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('salary.marketData.title')}</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {t('salary.marketData.description')}
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
                ? "bg-brand-900 dark:bg-brand-700 text-white"
                : "bg-stone-100 dark:bg-stone-700 text-gray-600 dark:text-gray-300 hover:bg-stone-200 dark:hover:bg-stone-600"
            )}
          >
            <Building2 className="w-4 h-4" />
            {t('salary.marketData.byIndustry')}
          </button>
          <button
            onClick={() => setSelectedView('region')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2",
              selectedView === 'region'
                ? "bg-brand-900 dark:bg-brand-700 text-white"
                : "bg-stone-100 dark:bg-stone-700 text-gray-600 dark:text-gray-300 hover:bg-stone-200 dark:hover:bg-stone-600"
            )}
          >
            <MapPin className="w-4 h-4" />
            {t('salary.marketData.byRegion')}
          </button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600 dark:text-gray-400" />
          <input
            type="text"
            placeholder={selectedView === 'industry' ? t('salary.marketData.searchIndustry') : t('salary.marketData.searchRegion')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-brand-700 dark:focus:ring-brand-400 focus:border-brand-700 dark:focus:border-brand-400 text-gray-800 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Industry view */}
      {selectedView === 'industry' && (
        <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-900 dark:text-brand-400" />
              {t('salary.marketData.medianByIndustry')}
            </h3>
            <span className="text-xs text-gray-700 dark:text-gray-300">{filteredAndSortedIndustries.length} {t('salary.marketData.results')}</span>
          </div>

          {/* Sort controls */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => toggleSort('median')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1',
                sortKey === 'median'
                  ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-900 dark:text-brand-300'
                  : 'bg-stone-100 dark:bg-stone-700 text-gray-600 dark:text-gray-400 hover:bg-stone-200 dark:hover:bg-stone-600'
              )}
            >
              {t('salary.marketData.sortSalary')} {sortKey === 'median' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => toggleSort('change')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1',
                sortKey === 'change'
                  ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-900 dark:text-brand-300'
                  : 'bg-stone-100 dark:bg-stone-700 text-gray-600 dark:text-gray-400 hover:bg-stone-200 dark:hover:bg-stone-600'
              )}
            >
              {t('salary.marketData.sortGrowth')} {sortKey === 'change' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => toggleSort('name')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1',
                sortKey === 'name'
                  ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-900 dark:text-brand-300'
                  : 'bg-stone-100 dark:bg-stone-700 text-gray-600 dark:text-gray-400 hover:bg-stone-200 dark:hover:bg-stone-600'
              )}
            >
              {t('salary.marketData.sortName')} {sortKey === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
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
                        className="w-full text-left hover:bg-brand-50/30 dark:hover:bg-brand-900/10 p-3 rounded-xl transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <span className={cn(
                              'transition-transform',
                              isExpanded && 'rotate-180'
                            )}>
                              <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </span>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{industry.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "text-xs flex items-center gap-0.5 font-medium",
                              industry.change >= 3 ? "text-brand-900 dark:text-brand-400" : "text-gray-700 dark:text-gray-400"
                            )}>
                              {industry.change >= 3 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3 opacity-30" />}
                              {industry.change}{t('salary.marketData.perYear')}
                            </span>
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100 min-w-fit">
                              {industry.median.toLocaleString('sv-SE')} kr
                            </span>
                          </div>
                        </div>
                        <div className="h-2 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand-700 to-brand-900 dark:from-brand-400 dark:to-brand-700 rounded-full transition-all group-hover:from-brand-900 group-hover:to-brand-900"
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
                            <div className="px-3 pb-3 pt-1 bg-brand-50/30 dark:bg-brand-900/10 rounded-b-xl border-t border-brand-100/50 dark:border-brand-900/50">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="text-sm">
                                  <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">{t('salary.marketData.employeesInSweden')}</p>
                                  <p className="font-semibold text-gray-900 dark:text-gray-100">~{industry.employees}</p>
                                </div>
                                <div className="text-sm">
                                  <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">{t('salary.marketData.annualGrowth')}</p>
                                  <p className={cn(
                                    'font-semibold',
                                    industry.change >= 3 ? 'text-brand-900 dark:text-brand-400' : 'text-gray-700 dark:text-gray-300'
                                  )}>
                                    +{industry.change}%
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3 p-2 bg-white dark:bg-stone-700 rounded-lg border border-brand-100 dark:border-brand-900">
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{t('salary.marketData.salaryRange')}</p>
                                <div className="flex justify-between text-xs text-gray-700 dark:text-gray-300">
                                  <span>{t('salary.marketData.min')}: ~{Math.round(industry.median * 0.8).toLocaleString('sv-SE')} kr</span>
                                  <span>{t('salary.marketData.max')}: ~{Math.round(industry.median * 1.3).toLocaleString('sv-SE')} kr</span>
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
              <div className="text-center py-8 text-gray-700 dark:text-gray-300">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>{t('salary.marketData.noIndustryFound', { searchTerm })}</p>
              </div>
            )}
          </AnimatePresence>
        </Card>
      )}

      {/* Region view */}
      {selectedView === 'region' && (
        <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-900 dark:text-brand-400" />
              {t('salary.marketData.salaryByRegion')}
            </h3>
            <span className="text-xs text-gray-700 dark:text-gray-300">{filteredRegions.length} {t('salary.marketData.results')}</span>
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
                    className="border border-stone-200 dark:border-stone-600 rounded-xl overflow-hidden hover:border-brand-300 dark:hover:border-brand-900 transition-colors"
                  >
                    <button
                      onClick={() => toggleExpandRow(region.region)}
                      className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-stone-50/50 dark:hover:bg-stone-700/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{region.region}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {region.avgSalary.toLocaleString('sv-SE')} {t('salary.marketData.perMonth')}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap",
                          premiumNum > 0
                            ? "bg-brand-100 dark:bg-brand-900/30 text-brand-900 dark:text-brand-300"
                            : premiumNum < 0
                            ? "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300"
                            : "bg-stone-100 dark:bg-stone-700 text-gray-600 dark:text-gray-400"
                        )}>
                          {region.premium}
                        </span>
                        <span className={cn(
                          'transition-transform',
                          isExpanded && 'rotate-180'
                        )}>
                          <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </span>
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-stone-200 dark:border-stone-600 overflow-hidden"
                        >
                          <div className="px-4 py-3 bg-stone-50/30 dark:bg-stone-700/30 space-y-4">
                            {/* Cost of living */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('salary.marketData.costOfLiving')}</p>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">{region.costOfLiving}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('salary.marketData.averageSalary')}</p>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">{region.avgSalary.toLocaleString('sv-SE')} kr</p>
                              </div>
                            </div>

                            {/* Premium visualization */}
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{t('salary.marketData.salaryPremium')}</p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-stone-200 dark:bg-stone-600 rounded-full overflow-hidden">
                                  <div
                                    className={cn(
                                      'h-full transition-all',
                                      premiumNum > 0 ? 'bg-brand-700 dark:bg-brand-400' : 'bg-rose-500 dark:bg-rose-400'
                                    )}
                                    style={{ width: `${50 + (premiumNum * 2)}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 min-w-fit">{region.premium}</span>
                              </div>
                            </div>

                            {/* Info */}
                            <div className="p-3 bg-white dark:bg-stone-700 rounded-lg border border-stone-200 dark:border-stone-600 text-xs text-gray-600 dark:text-gray-400">
                              <p>
                                {premiumNum > 0
                                  ? t('salary.marketData.premiumHigher')
                                  : premiumNum < 0
                                  ? t('salary.marketData.premiumLower')
                                  : t('salary.marketData.premiumAverage')
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
              <div className="text-center py-8 text-gray-700 dark:text-gray-300">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>{t('salary.marketData.noRegionFound', { searchTerm })}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Hot skills */}
      <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          {t('salary.marketData.highPremiumSkills')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {HOT_SKILLS.map((item) => (
            <div
              key={item.skill}
              className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-100 dark:border-amber-800"
            >
              <p className="font-medium text-gray-800 dark:text-gray-100">{item.skill}</p>
              <p className="text-lg font-bold text-amber-700 dark:text-amber-400 mt-1">{item.premium}</p>
              <p className="text-xs text-gray-700 dark:text-gray-400 mt-1">{t('salary.marketData.demand')}: {item.demand}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Disclaimer */}
      <Card className="bg-stone-50 dark:bg-stone-700 border-stone-200 dark:border-stone-600">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <strong>{t('salary.marketData.disclaimerTitle')}</strong> {t('salary.marketData.disclaimerText')}
        </p>
      </Card>
    </div>
  )
}
