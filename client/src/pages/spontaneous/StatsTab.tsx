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
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-slate-600 dark:text-slate-600">{label}</p>
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
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-500" />
          Översikt
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
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-500" />
            Svarsfrekvens
          </h3>

          {totalContacted > 0 ? (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Fått svar</span>
                  <span className="font-medium">{responseRate}%</span>
                </div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${responseRate}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Positiva svar</span>
                  <span className="font-medium">{positiveRate}%</span>
                </div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${positiveRate}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-700 text-sm">
              Kontakta företag för att se statistik här.
            </p>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Status fördelning</h3>
          <div className="space-y-2">
            <StatusRow label="Att kontakta" value={stats.to_contact} color="bg-blue-500" total={totalCompanies} />
            <StatusRow label="Väntar svar" value={stats.waiting} color="bg-amber-500" total={totalCompanies} />
            <StatusRow label="Positivt svar" value={stats.response_positive} color="bg-green-500" total={totalCompanies} />
            <StatusRow label="Avslag" value={stats.response_negative} color="bg-red-500" total={totalCompanies} />
            <StatusRow label="Inget svar" value={stats.no_response} color="bg-orange-500" total={totalCompanies} />
          </div>
        </Card>
      </div>

      {/* Upcoming Follow-ups */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-500" />
          Kommande uppföljningar
        </h3>

        {upcomingFollowups.length > 0 ? (
          <div className="space-y-3">
            {upcomingFollowups.map((company) => (
              <div
                key={company.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
              >
                <div>
                  <p className="font-medium">{company.company_name}</p>
                  <p className="text-sm text-slate-700">
                    {formatOrgNumber(company.org_number)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-amber-600">
                    {company.followup_date && new Date(company.followup_date).toLocaleDateString('sv-SE')}
                  </p>
                  <p className="text-xs text-slate-700">
                    {company.followup_date && getDaysUntil(new Date(company.followup_date))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-700 text-sm">
            Inga kommande uppföljningar. Sätt påminnelser när du kontaktar företag.
          </p>
        )}
      </Card>

      {/* Tips */}
      <Card className="p-6 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-primary-200 dark:border-primary-800">
        <h3 className="font-semibold mb-2">Tips för bättre resultat</h3>
        <ul className="text-sm text-slate-600 dark:text-slate-600 space-y-1.5">
          <li>• Sikta på att kontakta 5-10 nya företag per vecka</li>
          <li>• Följ alltid upp efter 1-2 veckor om du inte fått svar</li>
          <li>• En svarsfrekvens på 10-20% är normalt för spontanansökningar</li>
          <li>• Kvalitet går före kvantitet – anpassa varje ansökan</li>
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
      <span className="text-sm w-28 truncate">{label}</span>
      <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium w-8 text-right">{value}</span>
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
