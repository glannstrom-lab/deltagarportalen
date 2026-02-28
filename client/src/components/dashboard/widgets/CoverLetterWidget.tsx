import { memo } from 'react'
import { Mail, FileText, Clock } from 'lucide-react'
import { DashboardWidget } from '../DashboardWidget'
import type { WidgetStatus } from '@/types/dashboard'

interface CoverLetterWidgetProps {
  count: number
  recentLetters?: { id: string; title: string; company: string; createdAt: string }[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

export const CoverLetterWidget = memo(function CoverLetterWidget({
  count,
  recentLetters = [],
  loading,
  error,
  onRetry,
}: CoverLetterWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (count === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  // Formatera datum
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Idag'
    if (diffDays === 1) return 'Igår'
    return `${diffDays} dagar sedan`
  }

  return (
    <DashboardWidget
      title="Personliga brev"
      icon={<Mail size={20} />}
      to="/cover-letter"
      color="green"
      status={status}
      progress={count > 0 ? 100 : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
      stats={[
        { label: 'Sparade brev', value: count },
      ]}
      primaryAction={{
        label: count > 0 ? 'Skapa nytt brev' : 'Skapa brev',
      }}
    >
      {/* Visa senaste brev om det finns */}
      {recentLetters.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-slate-500 mb-2">Senaste breven:</p>
          <div className="space-y-2">
            {recentLetters.slice(0, 2).map((letter) => (
              <div 
                key={letter.id}
                className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg"
              >
                <FileText size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {letter.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="truncate">{letter.company}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {getTimeAgo(letter.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Tom state med info */}
      {count === 0 && (
        <div className="mt-2 p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-700">
            Ett personligt brev kan göra stor skillnad. Skapa ett som du kan anpassa för varje ansökan.
          </p>
        </div>
      )}
    </DashboardWidget>
  )
})
