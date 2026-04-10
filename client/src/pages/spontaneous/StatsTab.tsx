/**
 * Stats Tab - View statistics and upcoming follow-ups
 */
import {
  Building2,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  Target,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useSpontaneousCompanies } from '@/hooks/useSpontaneousCompanies'
import { formatOrgNumber } from '@/services/bolagsverketApi'
import type { SpontaneousStatus } from '@/services/supabaseApi'

// Stat card component
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
}: {
  label: string
  value: number
  icon: typeof Building2
  color: string
  bgColor: string
}) {
  return (
    <Card className="p-4 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-800 dark:text-stone-100">{value}</p>
          <p className="text-sm text-slate-600 dark:text-stone-400">{label}</p>
        </div>
      </div>
    </Card>
  )
}

export default function StatsTab() {
  const { stats, companies, upcomingFollowups, isLoading } = useSpontaneousCompanies()

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    )
  }

  const totalCompanies = companies.length
  const totalContacted = stats.contacted + stats.waiting + stats.response_positive + stats.response_negative + stats.no_response
  const totalResponses = stats.response_positive + stats.response_negative
  const responseRate = totalContacted > 0 ? Math.round((totalResponses / totalContacted) * 100) : 0
  const positiveRate = totalResponses > 0 ? Math.round((stats.response_positive / totalResponses) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800 dark:text-stone-100">
          <TrendingUp className="w-5 h-5 text-teal-500 dark:text-teal-400" />
          Oversikt
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Totalt sparade"
            value={totalCompanies}
            icon={Building2}
            color="text-slate-600"
            bgColor="bg-slate-100 dark:bg-slate-800"
          />
          <StatCard
            label="Kontaktade"
            value={totalContacted}
            icon={Send}
            color="text-blue-600"
            bgColor="bg-blue-100 dark:bg-blue-900/30"
          />
          <StatCard
            label="Fått svar"
            value={totalResponses}
            icon={CheckCircle}
            color="text-green-600"
            bgColor="bg-green-100 dark:bg-green-900/30"
          />
          <StatCard
            label="Väntar svar"
            value={stats.waiting}
            icon={Clock}
            color="text-amber-600"
            bgColor="bg-amber-100 dark:bg-amber-900/30"
          />
        </div>
      </div>

      {/* Response Rates */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-slate-800 dark:text-stone-100">
            <Target className="w-5 h-5 text-teal-500 dark:text-teal-400" />
            Svarsfrekvens
          </h3>

          {totalContacted > 0 ? (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1 text-slate-700 dark:text-stone-300">
                  <span>Fatt svar</span>
                  <span className="font-medium">{responseRate}%</span>
                </div>
                <div className="h-3 bg-slate-200 dark:bg-stone-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all"
                    style={{ width: `${responseRate}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1 text-slate-700 dark:text-stone-300">
                  <span>Positiva svar</span>
                  <span className="font-medium">{positiveRate}%</span>
                </div>
                <div className="h-3 bg-slate-200 dark:bg-stone-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${positiveRate}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-600 dark:text-stone-400 text-sm">
              Kontakta foretag for att se statistik har.
            </p>
          )}
        </Card>

        <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <h3 className="font-semibold mb-4 text-slate-800 dark:text-stone-100">Status fordelning</h3>
          <div className="space-y-2">
            <StatusRow label="Att kontakta" value={stats.to_contact} color="bg-blue-500" total={totalCompanies} />
            <StatusRow label="Vantar svar" value={stats.waiting} color="bg-amber-500" total={totalCompanies} />
            <StatusRow label="Positivt svar" value={stats.response_positive} color="bg-emerald-500" total={totalCompanies} />
            <StatusRow label="Avslag" value={stats.response_negative} color="bg-red-500" total={totalCompanies} />
            <StatusRow label="Inget svar" value={stats.no_response} color="bg-orange-500" total={totalCompanies} />
          </div>
        </Card>
      </div>

      {/* Upcoming Follow-ups */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="font-semibold mb-4 flex items-center gap-2 text-slate-800 dark:text-stone-100">
          <Calendar className="w-5 h-5 text-teal-500 dark:text-teal-400" />
          Kommande uppfoljningar
        </h3>

        {upcomingFollowups.length > 0 ? (
          <div className="space-y-3">
            {upcomingFollowups.map((company) => (
              <div
                key={company.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-stone-900/50"
              >
                <div>
                  <p className="font-medium text-slate-800 dark:text-stone-100">{company.company_name}</p>
                  <p className="text-sm text-slate-600 dark:text-stone-400">
                    {formatOrgNumber(company.org_number)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    {company.followup_date && new Date(company.followup_date).toLocaleDateString('sv-SE')}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-stone-400">
                    {company.followup_date && getDaysUntil(new Date(company.followup_date))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-600 dark:text-stone-400 text-sm">
            Inga kommande uppfoljningar. Satt paminnelser nar du kontaktar foretag.
          </p>
        )}
      </Card>

      {/* Tips */}
      <Card className="p-6 bg-gradient-to-br from-sky-50 to-teal-50 dark:from-sky-900/20 dark:to-teal-900/20 border-sky-200 dark:border-sky-800">
        <h3 className="font-semibold mb-2 text-slate-800 dark:text-stone-100">Tips for battre resultat</h3>
        <ul className="text-sm text-slate-600 dark:text-stone-400 space-y-1.5">
          <li>Sikta pa att kontakta 5-10 nya foretag per vecka</li>
          <li>Folj alltid upp efter 1-2 veckor om du inte fatt svar</li>
          <li>En svarsfrekvens pa 10-20% ar normalt for spontanansokningar</li>
          <li>Kvalitet gar fore kvantitet - anpassa varje ansokan</li>
        </ul>
      </Card>
    </div>
  )
}

// Helper components
function StatusRow({
  label,
  value,
  color,
  total,
}: {
  label: string
  value: number
  color: string
  total: number
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-28 truncate text-slate-700 dark:text-stone-300">{label}</span>
      <div className="flex-1 h-2 bg-slate-200 dark:bg-stone-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium w-8 text-right text-slate-700 dark:text-stone-300">{value}</span>
    </div>
  )
}

function getDaysUntil(date: Date): string {
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'Försenad'
  if (diffDays === 0) return 'Idag'
  if (diffDays === 1) return 'Imorgon'
  return `Om ${diffDays} dagar`
}
