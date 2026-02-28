import { memo } from 'react'
import { Mail, FileText, Clock, Plus, Edit3, Copy } from 'lucide-react'
import { DashboardWidget } from '../DashboardWidget'
import type { WidgetStatus } from '@/types/dashboard'
import type { WidgetSize } from '../WidgetSizeSelector'

interface CoverLetterWidgetProps {
  count: number
  recentLetters?: { id: string; title: string; company: string; createdAt: string }[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  size?: WidgetSize
}

export const CoverLetterWidget = memo(function CoverLetterWidget({
  count,
  recentLetters = [],
  loading,
  error,
  onRetry,
  size,
}: CoverLetterWidgetProps) {
  // TODO: Implement different layouts based on size
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
      icon={<Mail size={22} />}
      to="/cover-letter"
      color="green"
      status={status}
      progress={count > 0 ? Math.min(100, count * 20) : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
      stats={[
        { label: 'Sparade brev', value: count },
        { label: 'Mallar', value: '5 tillgängliga' },
      ]}
      primaryAction={{
        label: count > 0 ? 'Skapa nytt brev' : 'Skapa ditt första brev',
      }}
    >
      <div className="mt-3 space-y-3">
        {/* Stort nummer med ikon */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
            <FileText size={28} className="text-green-600" />
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-800">{count}</p>
            <p className="text-sm text-slate-500">
              {count === 0 ? 'Inga brev än' : count === 1 ? 'brev skapat' : 'brev skapade'}
            </p>
          </div>
        </div>
        
        {/* Visa senaste brev om det finns */}
        {recentLetters.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-medium">Senaste breven:</p>
            <div className="space-y-2">
              {recentLetters.slice(0, 2).map((letter) => (
                <div 
                  key={letter.id}
                  className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Edit3 size={14} className="text-green-600" />
                  </div>
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
        
        {/* Tom state */}
        {count === 0 && (
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <div className="flex items-start gap-3">
              <Copy size={20} className="text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900">Skapa personliga brev</p>
                <p className="text-xs text-green-700 mt-1">
                  Ett starkt personligt brev kan göra skillnaden. 
                  Välj en mall och anpassa för varje ansökan.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Tips för befintliga brev */}
        {count > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Plus size={14} />
            <span>Skapa nya brev baserat på dina mallar</span>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
})
