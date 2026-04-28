/**
 * JourneyWeekSummary - Weekly progress summary widget
 */

import { Calendar, Clock, Zap, Send, BookOpen, Flame, TrendingUp } from '@/components/ui/icons'
import { Card } from '@/components/ui'
import type { WeeklySummary } from '@/types/journey.types'

interface JourneyWeekSummaryProps {
  summary: WeeklySummary
}

export function JourneyWeekSummary({ summary }: JourneyWeekSummaryProps) {
  const activityPercentage = Math.round((summary.daysActive / summary.totalDays) * 100)

  const getMessage = () => {
    if (summary.daysActive === 0) {
      return 'En ny vecka har börjat! Logga in och fortsätt din resa.'
    }
    if (summary.daysActive >= 5) {
      return 'Fantastiskt! Du har varit väldigt aktiv denna vecka. Fortsätt så!'
    }
    if (summary.daysActive >= 3) {
      return 'Bra jobbat! Du gör stadiga framsteg.'
    }
    return 'Du är på rätt väg. Varje steg räknas!'
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-stone-50 to-indigo-50/50">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-stone-900">Denna vecka</h3>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 text-center shadow-sm">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">
            {summary.daysActive}/{summary.totalDays}
          </div>
          <div className="text-xs text-stone-700">dagar aktiv</div>
        </div>

        <div className="bg-white rounded-xl p-4 text-center shadow-sm">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-2">
            <Zap className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">
            {summary.xpEarned}
          </div>
          <div className="text-xs text-stone-700">XP intjänat</div>
        </div>

        <div className="bg-white rounded-xl p-4 text-center shadow-sm">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
            <Send className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">
            {summary.applicationsSubmitted}
          </div>
          <div className="text-xs text-stone-700">ansökningar</div>
        </div>

        <div className="bg-white rounded-xl p-4 text-center shadow-sm">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
            <BookOpen className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">
            {summary.articlesRead}
          </div>
          <div className="text-xs text-stone-700">artiklar lästa</div>
        </div>
      </div>

      {/* Activity Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-stone-600">Veckans aktivitet</span>
          <span className="font-medium text-indigo-600">{activityPercentage}%</span>
        </div>
        <div className="h-3 bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${activityPercentage}%` }}
          />
        </div>
      </div>

      {/* Streak Status */}
      {summary.streakMaintained && (
        <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-100">
          <Flame className="w-5 h-5 text-orange-500" />
          <span className="text-sm text-orange-700">
            Du har bibehållit din streak! Fortsätt så.
          </span>
        </div>
      )}

      {/* Motivational Message */}
      <div className="mt-4 pt-4 border-t border-stone-200">
        <p className="text-sm text-stone-600 italic">
          "{getMessage()}"
        </p>
      </div>
    </Card>
  )
}

export default JourneyWeekSummary
