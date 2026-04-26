/**
 * Cover Letter Statistics Tab
 * Visa statistik om användarens ansökningar
 */

import { useState } from 'react'
import { 
  FileText, 
  Send, 
  MessageCircle, 
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  Lightbulb,
  Award,
  ArrowRight
} from '@/components/ui/icons'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

// Mock data - ska ersättas med riktig data
const mockStats = {
  totalLetters: 12,
  totalSent: 8,
  responses: 3,
  interviews: 1,
  responseRate: 38,
  interviewRate: 13,
  thisMonth: {
    letters: 4,
    sent: 3,
    responses: 1,
  },
  monthlyTrend: [
    { month: 'Nov', sent: 2, responses: 0 },
    { month: 'Dec', sent: 3, responses: 1 },
    { month: 'Jan', sent: 1, responses: 0 },
    { month: 'Feb', sent: 2, responses: 1 },
    { month: 'Mar', sent: 3, responses: 1 },
  ],
  topIndustries: [
    { name: 'IT & Tech', count: 5, responseRate: 60 },
    { name: 'Handel', count: 2, responseRate: 0 },
    { name: 'Vård', count: 1, responseRate: 100 },
  ],
  bestPerformingTemplate: 'Standard',
}

export function CoverLetterStatistics() {
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month')

  const hasData = mockStats.totalLetters > 0

  if (!hasData) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-10 h-10 text-stone-500 dark:text-stone-400" />
        </div>
        <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100 mb-2">
          Din statistik visas här
        </h2>
        <p className="text-stone-600 dark:text-stone-400 max-w-md mx-auto mb-6">
          Här samlas en översikt över dina ansökningar – hur många du skickat,
          vilka som fått svar och var du är i processen.
        </p>
        <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-4 max-w-md mx-auto border border-teal-200 dark:border-teal-800/50">
          <p className="text-sm text-teal-700 dark:text-teal-300">
            💡 <strong>Det börjar här:</strong> När du skickat ditt första personliga
            brev börjar statistiken växa. Tänk på att varje ansökan är ett steg framåt,
            oavsett utfallet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Översiktskort */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={FileText}
          value={mockStats.totalLetters}
          label="Brev skrivna"
          subtext="Totalt antal"
          color="blue"
        />
        <StatCard
          icon={Send}
          value={mockStats.totalSent}
          label="Skickade"
          subtext={`${mockStats.thisMonth.sent} denna månaden`}
          color="sky"
        />
        <StatCard
          icon={MessageCircle}
          value={`${mockStats.responseRate}%`}
          label="Fått svar"
          subtext={`${mockStats.responses} av ${mockStats.totalSent}`}
          color="emerald"
          trend="up"
        />
        <StatCard
          icon={Users}
          value={mockStats.interviews}
          label="Intervjuer"
          subtext={`${mockStats.interviewRate}% av skickade`}
          color="amber"
        />
      </div>

      {/* Main content grid */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Vänster kolumn - Trend och insights */}
        <div className="lg:col-span-2 space-y-6">
          {/* Aktivitet över tid */}
          <Card className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700/50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-stone-800 dark:text-stone-100">Din aktivitet</h3>
                <p className="text-sm text-stone-600 dark:text-stone-400">Antal skickade brev och svar per månad</p>
              </div>
              <div className="flex gap-1 bg-stone-100 dark:bg-stone-800 rounded-lg p-1">
                {(['month', 'quarter', 'year'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={cn(
                      'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                      timeRange === range
                        ? 'bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 shadow-sm'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                    )}
                  >
                    {range === 'month' && 'Månad'}
                    {range === 'quarter' && 'Kvartal'}
                    {range === 'year' && 'År'}
                  </button>
                ))}
              </div>
            </div>

            {/* Enkel barchart */}
            <div className="flex items-end gap-3 h-48">
              {mockStats.monthlyTrend.map((month, index) => {
                const maxSent = Math.max(...mockStats.monthlyTrend.map(m => m.sent))
                const heightPercent = maxSent > 0 ? (month.sent / maxSent) * 100 : 0

                return (
                  <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex gap-1 items-end h-32">
                      {/* Skickade */}
                      <div
                        className="flex-1 bg-teal-500 rounded-t transition-all hover:bg-teal-600 relative group"
                        style={{ height: `${heightPercent}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-stone-800 dark:bg-stone-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {month.sent} skickade
                        </div>
                      </div>
                      {/* Svar */}
                      {month.responses > 0 && (
                        <div
                          className="flex-1 bg-emerald-400 rounded-t transition-all hover:bg-emerald-500"
                          style={{ height: `${(month.responses / month.sent) * heightPercent}%` }}
                        />
                      )}
                    </div>
                    <span className="text-xs text-stone-600 dark:text-stone-400">{month.month}</span>
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-teal-500 rounded" />
                <span className="text-sm text-stone-600 dark:text-stone-400">Skickade brev</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-400 rounded" />
                <span className="text-sm text-stone-600 dark:text-stone-400">Fick svar</span>
              </div>
            </div>
          </Card>

          {/* Top branscher */}
          <Card className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700/50">
            <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-4">Dina branscher</h3>
            <div className="space-y-4">
              {mockStats.topIndustries.map((industry, index) => (
                <div key={industry.name} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-stone-800 dark:text-stone-100">{industry.name}</span>
                      <span className="text-sm text-stone-600 dark:text-stone-400">{industry.count} brev</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${industry.responseRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 w-12 text-right">
                        {industry.responseRate}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Höger kolumn - Insights och tips */}
        <div className="space-y-6">
          {/* Insights */}
          <Card className="p-6 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/50">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h3 className="font-semibold text-stone-800 dark:text-stone-100">Dina styrkor</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckValue value={true} />
                <p className="text-sm text-stone-700 dark:text-stone-300">
                  <strong>Bäst resultat</strong> med "{mockStats.bestPerformingTemplate}"-mallen
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckValue value={true} />
                <p className="text-sm text-stone-700 dark:text-stone-300">
                  <strong>Högst svarsfrekvens</strong> i {mockStats.topIndustries[0].name}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckValue value={mockStats.totalSent >= 5} />
                <p className="text-sm text-stone-700 dark:text-stone-300">
                  {mockStats.totalSent >= 5
                    ? <> <strong>Aktiv jobbsökare</strong> - du är ute och provar! </>
                    : <span className="text-stone-600 dark:text-stone-400">Skicka 5 brev för att låsa upp detta</span>
                  }
                </p>
              </div>
            </div>
          </Card>

          {/* Mål och streak */}
          <Card className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700/50">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-stone-800 dark:text-stone-100">Denna veckan</h3>
            </div>
            <div className="text-center py-4">
              <div className="text-4xl font-bold text-stone-800 dark:text-stone-100 mb-1">
                {mockStats.thisMonth.sent}
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">brev skickade</p>
              <div className="bg-stone-100 dark:bg-stone-800 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (mockStats.thisMonth.sent / 5) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-2">
                {mockStats.thisMonth.sent >= 5
                  ? '🎉 Du har nått veckomålet!'
                  : `${5 - mockStats.thisMonth.sent} till för att nå veckomålet (5)`}
              </p>
            </div>
          </Card>

          {/* Tips */}
          <Card className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700/50">
            <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-4">Tips för bättre resultat</h3>
            <div className="space-y-4">
              <TipCard
                icon={TrendingUp}
                title="Följ upp efter 1 vecka"
                description="Skicka ett vänligt mejl om du inte hört något efter 7 dagar"
              />
              <TipCard
                icon={Calendar}
                title="Tisdag-torsdag är bäst"
                description="De flesta rekryterare läser brev mitt i veckan"
              />
            </div>
            <Button
              variant="outline"
              className="w-full mt-4 gap-2"
              onClick={() => {}}
            >
              Se alla tips
              <ArrowRight size={16} />
            </Button>
          </Card>
        </div>
      </div>

      {/* Uppmuntrande footer */}
      <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/50">
        <p className="text-sm text-emerald-800 dark:text-emerald-200 text-center">
          💚 <strong>Kom ihåg:</strong> Det är inte alltid personligt när man inte får svar.
          Arbetsgivare får ofta väldigt många ansökningar. Fortsätt kämpa!
        </p>
      </div>
    </div>
  )
}

// Hjälpkomponenter

function StatCard({
  icon: Icon,
  value,
  label,
  subtext,
  color,
  trend
}: {
  icon: React.ElementType
  value: string | number
  label: string
  subtext: string
  color: 'blue' | 'sky' | 'emerald' | 'amber'
  trend?: 'up' | 'down'
}) {
  const colors = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', icon: 'text-blue-500 dark:text-blue-400' },
    sky: { bg: 'bg-teal-50 dark:bg-teal-900/30', text: 'text-teal-600 dark:text-teal-400', icon: 'text-teal-500 dark:text-teal-400' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', icon: 'text-emerald-500 dark:text-emerald-400' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', icon: 'text-amber-500 dark:text-amber-400' },
  }

  return (
    <Card className="p-3 sm:p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700/50">
      <div className="flex items-start justify-between">
        <div className={cn('w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center', colors[color].bg)}>
          <Icon className={cn('w-4 h-4 sm:w-5 sm:h-5', colors[color].icon)} />
        </div>
        {trend && (
          <div className={cn(
            'flex items-center gap-0.5 text-xs font-medium',
            trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          )}>
            {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend === 'up' ? '+' : '-'}{Math.floor(Math.random() * 10)}%
          </div>
        )}
      </div>
      <div className="mt-2 sm:mt-3">
        <div className={cn('text-xl sm:text-2xl font-bold', colors[color].text)}>{value}</div>
        <div className="text-xs sm:text-sm font-medium text-stone-700 dark:text-stone-300">{label}</div>
        <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 hidden sm:block">{subtext}</div>
      </div>
    </Card>
  )
}

function CheckValue({ value }: { value: boolean }) {
  return (
    <div className={cn(
      'w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5',
      value ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
    )}>
      {value ? '✓' : '○'}
    </div>
  )
}

function TipCard({
  icon: Icon,
  title,
  description
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0">
        <Icon size={16} />
      </div>
      <div>
        <h4 className="font-medium text-stone-800 dark:text-stone-100 text-sm">{title}</h4>
        <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">{description}</p>
      </div>
    </div>
  )
}
