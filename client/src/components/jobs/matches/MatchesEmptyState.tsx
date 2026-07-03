/**
 * MatchesEmptyState - Tomtillstånd för matchningsfliken (ingen profildata
 * respektive inga träffar). Utbruten ur components/jobs/MatchesTab.tsx
 * (2026-07-03); omdöpt från EmptyState för att inte krocka med ui/EmptyState.
 */

import { Link } from 'react-router-dom'
import { Sparkles, Target, FileText, Compass } from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'

export function MatchesEmptyState({ type, labels }: {
  type: 'no-data' | 'no-results'
  labels: {
    createProfileFirst: string
    createProfileDesc: string
    createCV: string
    takeInterestGuide: string
    setCareerGoals: string
    noJobsFound: string
  }
}) {
  if (type === 'no-data') {
    return (
      <Card className="p-12 text-center">
        <img
          src="/illustrations/empty-jobb.webp"
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="w-28 h-28 mx-auto mb-6 select-none"
        />
        <h3 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-3">
          {labels.createProfileFirst}
        </h3>
        <p className="text-stone-700 dark:text-stone-300 mb-8 max-w-md mx-auto">
          {labels.createProfileDesc}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/cv">
            <Button size="lg">
              <FileText className="w-5 h-5 mr-2" />
              {labels.createCV}
            </Button>
          </Link>
          <Link to="/interest-guide">
            <Button variant="outline" size="lg">
              <Compass className="w-5 h-5 mr-2" />
              {labels.takeInterestGuide}
            </Button>
          </Link>
          <Link to="/profile">
            <Button variant="outline" size="lg">
              <Target className="w-5 h-5 mr-2" />
              {labels.setCareerGoals}
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-8 text-center">
      <Sparkles className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
      <p className="text-stone-700 dark:text-stone-300">
        {labels.noJobsFound}
      </p>
    </Card>
  )
}
