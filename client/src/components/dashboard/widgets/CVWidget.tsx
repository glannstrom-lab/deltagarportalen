import { memo } from 'react'
import { FileText, CheckCircle2, AlertCircle, Sparkles, TrendingUp, Award } from 'lucide-react'
import { DashboardWidget } from '../DashboardWidget'
import type { WidgetStatus } from '@/types/dashboard'

interface CVWidgetProps {
  hasCV: boolean
  progress: number
  atsScore: number
  missingSections?: string[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

export const CVWidget = memo(function CVWidget({
  hasCV,
  progress,
  atsScore,
  missingSections = [],
  loading,
  error,
  onRetry,
}: CVWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (!hasCV) return 'empty'
    if (progress >= 80) return 'complete'
    return 'in-progress'
  }

  const status = getStatus()

  // Beräkna stjärnor för CV-kvalitet
  const getStars = (score: number) => {
    if (score >= 80) return '⭐⭐⭐⭐⭐'
    if (score >= 60) return '⭐⭐⭐⭐'
    if (score >= 40) return '⭐⭐⭐'
    if (score >= 20) return '⭐⭐'
    return '⭐'
  }

  return (
    <DashboardWidget
      title="Din profil"
      icon={<FileText size={22} />}
      to="/cv"
      color="violet"
      status={status}
      progress={progress}
      loading={loading}
      error={error}
      onRetry={onRetry}
      stats={[
        { 
          label: 'Status', 
          value: hasCV ? 'Påbörjad' : 'Ej påbörjad',
        },
        ...(atsScore > 0 ? [{ 
          label: 'CV-kvalitet', 
          value: getStars(atsScore),
        }] : []),
      ]}
      primaryAction={{
        label: hasCV ? 'Fortsätt bygga' : 'Skapa profil',
      }}
    >
      <div className="mt-3 space-y-3">
        {/* Progress-indikator med större text */}
        {status !== 'empty' && (
          <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-xl">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <TrendingUp size={24} className="text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-violet-700">{progress}%</p>
              <p className="text-sm text-violet-600">
                {progress < 25 && 'Bra start!'}
                {progress >= 25 && progress < 50 && 'Kommer framåt!'}
                {progress >= 50 && progress < 75 && 'Nästan klart!'}
                {progress >= 75 && ' nästan klart!'}
              </p>
            </div>
          </div>
        )}
        
        {/* ATS Score om tillgängligt */}
        {atsScore > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Award size={16} className="text-amber-500" />
            <span className="text-slate-600">ATS-score:</span>
            <span className="font-semibold text-slate-800">{atsScore}/100</span>
            <span className="text-xs text-slate-400">
              ({atsScore >= 70 ? 'Bra' : atsScore >= 50 ? 'Okej' : 'Kan förbättras'})
            </span>
          </div>
        )}
        
        {/* Lista över vad som saknas */}
        {missingSections.length > 0 && status !== 'empty' && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-medium">Du kan lägga till:</p>
            <div className="flex flex-wrap gap-2">
              {missingSections.slice(0, 3).map((section) => (
                <span 
                  key={section}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 text-xs rounded-lg"
                >
                  <AlertCircle size={12} />
                  {section === 'profile' && 'Grundinfo'}
                  {section === 'summary' && 'Sammanfattning'}
                  {section === 'work_experience' && 'Erfarenhet'}
                  {section === 'education' && 'Utbildning'}
                  {section === 'skills' && 'Kompetenser'}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Tom state - uppmuntran */}
        {status === 'empty' && (
          <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-100">
            <div className="flex items-start gap-3">
              <Sparkles size={20} className="text-violet-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-violet-900">Börja bygga din profil</p>
                <p className="text-xs text-violet-700 mt-1">
                  Ett bra CV är nyckeln till jobbintervjuer. 
                  Vi hjälper dig steg för steg.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Complete state */}
        {status === 'complete' && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl">
            <CheckCircle2 size={20} className="text-emerald-500" />
            <span className="text-sm font-medium text-emerald-700">Profil redo för jobbsökning!</span>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
})
