import { memo } from 'react'
import { Mail, FileText, Clock, Plus, Copy, ArrowRight } from 'lucide-react'
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

// SMALL - Enkelt räknare
function CoverLetterWidgetSmall({ count, loading, error, onRetry }: Omit<CoverLetterWidgetProps, 'size' | 'recentLetters'>) {
  const getStatus = (): WidgetStatus => {
    if (count === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  return (
    <DashboardWidget
      title="Personliga brev"
      icon={<Mail size={20} />}
      to="/cover-letter-generator"
      color="rose"
      status={status}
      progress={count > 0 ? 100 : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: count > 0 ? 'Skapa nytt' : 'Skriv brev',
      }}
    >
      <div className="flex flex-col items-center justify-center py-2 text-center">
        <Mail size={28} className="text-rose-500 mb-2" />
        <p className="text-3xl font-bold text-slate-800">{count}</p>
        <p className="text-sm text-slate-500">
          {count === 0 ? 'Inga brev' : count === 1 ? 'sparat brev' : 'sparade brev'}
        </p>
      </div>
    </DashboardWidget>
  )
}

// MEDIUM - Lista över senaste brev
function CoverLetterWidgetMedium({ count, recentLetters = [], loading, error, onRetry }: CoverLetterWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (count === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  // Formatera datum
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Idag'
    if (diffDays === 1) return 'Igår'
    return `${diffDays} dagar sedan`
  }

  return (
    <DashboardWidget
      title="Personliga brev"
      icon={<Mail size={22} />}
      to="/cover-letter-generator"
      color="rose"
      status={status}
      progress={count > 0 ? 100 : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: 'Skapa nytt brev',
      }}
    >
      <div className="space-y-3">
        {/* Antal */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
            <Mail size={24} className="text-rose-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{count}</p>
            <p className="text-xs text-slate-500">{count === 1 ? 'sparat brev' : 'sparade brev'}</p>
          </div>
        </div>

        {/* Senaste brev */}
        {recentLetters.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400">Senaste brev:</p>
            <div className="space-y-1.5">
              {recentLetters.slice(0, 2).map((letter) => (
                <div 
                  key={letter.id}
                  className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg"
                >
                  <FileText size={14} className="text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{letter.title}</p>
                    <p className="text-xs text-slate-500 truncate">{letter.company}</p>
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(letter.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {count === 0 && (
          <div className="p-3 bg-rose-50 rounded-lg">
            <p className="text-sm text-rose-700">Skapa personliga brev</p>
            <p className="text-xs text-rose-600 mt-1">Anpassa för varje jobbansökan</p>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// LARGE - Full brev-hantering
function CoverLetterWidgetLarge({ count, recentLetters = [], loading, error, onRetry }: CoverLetterWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (count === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  // Formatera datum
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Idag'
    if (diffDays === 1) return 'Igår'
    return `${diffDays} dagar sedan`
  }

  return (
    <DashboardWidget
      title="Personliga brev"
      icon={<Mail size={24} />}
      to="/cover-letter-generator"
      color="rose"
      status={status}
      progress={count > 0 ? 100 : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: 'Skapa nytt brev',
      }}
      secondaryAction={count > 0 ? {
        label: 'Se alla',
        onClick: () => {},
      } : undefined}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 bg-rose-50 rounded-xl">
          <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
            <Mail size={28} className="text-rose-600" />
          </div>
          <div>
            <p className="text-3xl font-bold text-rose-700">{count}</p>
            <p className="text-sm text-rose-600">{count === 1 ? 'sparat brev' : 'sparade brev'}</p>
          </div>
        </div>

        {/* Lista över brev */}
        {recentLetters.length > 0 ? (
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-sm font-medium text-slate-700 mb-3">Dina senaste brev:</p>
            <div className="grid grid-cols-2 gap-3">
              {recentLetters.slice(0, 4).map((letter) => (
                <div 
                  key={letter.id}
                  className="flex items-start gap-3 p-3 bg-white rounded-xl hover:shadow-sm transition-shadow cursor-pointer group"
                >
                  <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={18} className="text-rose-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{letter.title}</p>
                    <p className="text-xs text-slate-500 truncate">{letter.company}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <Clock size={10} />
                      {formatDate(letter.createdAt)}
                    </p>
                  </div>
                  <button className="p-1 text-slate-300 hover:text-rose-500 transition-colors" title="Kopiera">
                    <Copy size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl border border-rose-100">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Mail size={32} className="text-rose-600" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-rose-900 mb-2">Skapa personliga brev</p>
                <p className="text-sm text-rose-700 mb-4">
                  Ett välskrivet personligt brev kan vara skillnaden mellan att bli kallad till intervju 
                  eller inte. Skapa anpassade brev för varje jobb du söker.
                </p>
                <div className="flex items-center gap-4 text-sm text-rose-600">
                  <span className="flex items-center gap-1">
                    <Plus size={14} />
                    Skapa nytt
                  </span>
                  <span className="flex items-center gap-1">
                    <Copy size={14} />
                    Kopiera mall
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        {count > 0 && (
          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl">
            <FileText size={18} className="text-amber-500 mt-0.5" />
            <p className="text-sm text-slate-600">
              Tips: Anpassa alltid ditt personliga brev för varje jobb. 
              Nämn specifika detaljer från annonsen som visar att du läst den noggrant.
            </p>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// Huvudkomponent
export const CoverLetterWidget = memo(function CoverLetterWidget(props: CoverLetterWidgetProps) {
  const { size = 'small', ...rest } = props

  switch (size) {
    case 'large':
      return <CoverLetterWidgetLarge {...rest} />
    case 'medium':
      return <CoverLetterWidgetMedium {...rest} />
    case 'small':
    default:
      return <CoverLetterWidgetSmall {...rest} />
  }
})
