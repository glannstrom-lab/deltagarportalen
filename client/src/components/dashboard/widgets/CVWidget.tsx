import { memo } from 'react'
import { FileText, CheckCircle2, AlertCircle } from 'lucide-react'
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

  const getStatusMessage = () => {
    if (!hasCV) return 'Ingen profil än'
    if (progress < 25) return 'Bra start! Fortsätt i din takt.'
    if (progress < 75) return 'Du kommer framåt - fortsätt när det passar dig.'
    return 'Bra jobbat! Din profil är nästan klar.'
  }

  const status = getStatus()

  return (
    <DashboardWidget
      title="Din profil"
      icon={<FileText size={20} />}
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
          value: `${atsScore}%`,
          trend: atsScore > 70 ? 'up' : 'neutral' 
        }] : []),
      ]}
      primaryAction={{
        label: hasCV ? 'Fortsätt bygga' : 'Skapa profil',
      }}
    >
      {/* Extra innehåll för tom eller påbörjad state */}
      {status !== 'complete' && (
        <div className="mt-2">
          <p className="text-sm text-slate-600 mb-3">{getStatusMessage()}</p>
          
          {missingSections.length > 0 && status !== 'empty' && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">Du kan lägga till:</p>
              <div className="flex flex-wrap gap-2">
                {missingSections.slice(0, 3).map((section) => (
                  <span 
                    key={section}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md"
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
        </div>
      )}
      
      {/* Complete state */}
      {status === 'complete' && (
        <div className="flex items-center gap-2 text-emerald-600 mt-2">
          <CheckCircle2 size={16} />
          <span className="text-sm font-medium">Profil redo!</span>
        </div>
      )}
    </DashboardWidget>
  )
})
