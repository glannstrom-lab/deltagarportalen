/**
 * Del3PortalIntegration — kopplar STA Del 3 till befintliga portalfunktioner.
 *
 * Visar:
 *   - CV-status (komplett-procent, sista uppdatering, länk till /cv)
 *   - Interest Guide-resultat med topp 3 yrken som kan väljas som fokusyrke
 *   - AI-team-länk med kontext-parameter ("Vad har jag gjort denna vecka?")
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  FileUser,
  Target,
  Bot,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
} from '@/components/ui/icons'
import { cvApi } from '@/services/cvApi'
import { interestApi } from '@/services/interestApi'
import { staEnrollmentsApi } from '@/services/staApi'

interface Props {
  enrollmentId: string | null
  currentFocusOccupation: string | null
  onFocusUpdated: () => void
}

interface CvStatus {
  completionPct: number
  updatedAt: string | null
  workExperienceCount: number
  educationCount: number
  hasSummary: boolean
}

interface InterestRecommendation {
  occupation: string
  matchScore?: number
}

export function Del3PortalIntegration({ enrollmentId, currentFocusOccupation, onFocusUpdated }: Props) {
  const navigate = useNavigate()
  const [cv, setCv] = useState<CvStatus | null>(null)
  const [recommendations, setRecommendations] = useState<InterestRecommendation[]>([])
  const [interestCompletedAt, setInterestCompletedAt] = useState<string | null>(null)
  const [savingFocus, setSavingFocus] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Hämta CV och Interest Guide-data parallellt
  useEffect(() => {
    let cancelled = false
    Promise.all([cvApi.getCV(), interestApi.getResult()])
      .then(([cvData, interestResult]) => {
        if (cancelled) return
        if (cvData) {
          const raw = cvData as Record<string, unknown>
          const sectionsFilled = [
            !!String(raw.firstName ?? '').trim(),
            !!String(raw.title ?? '').trim(),
            !!String(raw.email ?? '').trim(),
            !!String(raw.summary ?? '').trim(),
            ((raw.workExperience as unknown[] | undefined)?.length ?? 0) > 0,
            ((raw.education as unknown[] | undefined)?.length ?? 0) > 0,
            ((raw.skills as unknown[] | undefined)?.length ?? 0) > 0,
          ]
          setCv({
            completionPct: Math.round((sectionsFilled.filter(Boolean).length / sectionsFilled.length) * 100),
            updatedAt: (raw.updated_at as string | undefined) ?? (raw.updatedAt as string | undefined) ?? null,
            workExperienceCount: (raw.workExperience as unknown[] | undefined)?.length ?? 0,
            educationCount: (raw.education as unknown[] | undefined)?.length ?? 0,
            hasSummary: !!String(raw.summary ?? '').trim(),
          })
        }
        if (interestResult) {
          // Resultatet kan ha olika shape — vi försöker plocka ut topp 3 yrken
          const rec = interestResult as Record<string, unknown>
          const jobs = (rec.recommended_jobs ?? rec.recommendations ?? rec.top_occupations) as
            | Array<{ occupation?: string; title?: string; name?: string; match_score?: number; score?: number }>
            | undefined
          if (Array.isArray(jobs)) {
            setRecommendations(
              jobs.slice(0, 3).map((j) => ({
                occupation: j.occupation ?? j.title ?? j.name ?? '',
                matchScore: j.match_score ?? j.score,
              })).filter((r) => r.occupation),
            )
          }
          setInterestCompletedAt((rec.completed_at as string | null) ?? null)
        }
      })
      .catch(() => {
        // ignore — vi visar bara det vi har
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handlePickFocus = async (occupation: string) => {
    if (!enrollmentId) return
    setSavingFocus(occupation)
    setSaveError(null)
    try {
      await staEnrollmentsApi.update(enrollmentId, { focus_occupation: occupation })
      onFocusUpdated()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Kunde inte spara fokusyrke')
    } finally {
      setSavingFocus(null)
    }
  }

  const aiTeamPrompt = encodeURIComponent(
    'Jag är i Del 3 av Steg till arbete och jobbar med arbetsprövning. Kan du hjälpa mig reflektera över veckan?',
  )

  return (
    <div className="space-y-4">
      {/* Interest Guide → fokusyrke */}
      {recommendations.length > 0 && (
        <Card variant="flat" padding="lg">
          <div className="flex items-center gap-2 mb-2">
            <Target size={18} style={{ color: 'var(--c-text)' }} />
            <h3 className="text-base font-semibold text-stone-900">
              Förslag på fokusyrke från Intresseguiden
            </h3>
          </div>
          <p className="text-sm text-stone-600 mb-3">
            Du fyllde i intresseguiden{' '}
            {interestCompletedAt
              ? new Date(interestCompletedAt).toLocaleDateString('sv-SE')
              : 'tidigare'}
            . Här är de tre yrken som matchade dig bäst.
          </p>
          <div className="space-y-2">
            {recommendations.map((r) => {
              const isCurrent = currentFocusOccupation === r.occupation
              return (
                <div
                  key={r.occupation}
                  className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 bg-white"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}
                  >
                    <Sparkles size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-stone-900">{r.occupation}</div>
                    {typeof r.matchScore === 'number' && (
                      <div className="text-xs text-stone-500">Matchning {r.matchScore}%</div>
                    )}
                  </div>
                  {isCurrent ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                      <CheckCircle2 size={12} />
                      Ditt fokusyrke
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handlePickFocus(r.occupation)}
                      isLoading={savingFocus === r.occupation}
                    >
                      Välj som fokusyrke
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
          {saveError && (
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-rose-700">
              <AlertCircle size={12} />
              {saveError}
            </p>
          )}
          <Link
            to="/interest-guide"
            className="mt-3 inline-flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 hover:underline"
          >
            Gör om intresseguiden
            <ChevronRight size={12} />
          </Link>
        </Card>
      )}

      {recommendations.length === 0 && (
        <Card variant="flat" padding="md" className="bg-stone-50">
          <EmptyState
            compact
            icon={Target}
            title="Hitta ditt fokusyrke"
            description="Gör intresseguiden så får du yrkesförslag baserat på vad du gillar."
            action={{
              label: 'Öppna intresseguiden',
              onClick: () => navigate('/interest-guide'),
              variant: 'secondary',
            }}
          />
        </Card>
      )}

      {/* CV-status */}
      {cv && (
        <Card variant="flat" padding="md">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
            <div className="flex items-center gap-2">
              <FileUser size={16} style={{ color: 'var(--c-text)' }} />
              <h4 className="text-sm font-semibold text-stone-900">CV-status</h4>
            </div>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                background: cv.completionPct >= 80 ? 'rgb(220 252 231)' : 'var(--c-bg)',
                color: cv.completionPct >= 80 ? 'rgb(21 128 61)' : 'var(--c-text)',
              }}
            >
              {cv.completionPct}% klart
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden bg-stone-100 mb-2">
            <div className="h-full" style={{ width: `${cv.completionPct}%`, background: 'var(--c-solid)' }} />
          </div>
          <div className="text-xs text-stone-600 flex items-center gap-3 flex-wrap">
            <span>{cv.workExperienceCount} jobb</span>
            <span>·</span>
            <span>{cv.educationCount} utbildningar</span>
            {cv.hasSummary && (
              <>
                <span>·</span>
                <span>profilbeskrivning klar</span>
              </>
            )}
            {cv.updatedAt && (
              <>
                <span>·</span>
                <span>Uppdaterat {new Date(cv.updatedAt).toLocaleDateString('sv-SE')}</span>
              </>
            )}
          </div>
          <div className="flex gap-2 mt-3">
            <Link
              to="/cv"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-stone-200 text-stone-700 hover:border-stone-300"
            >
              {cv.completionPct < 80 ? 'Fyll på ditt CV' : 'Öppna CV-byggaren'}
              <ChevronRight size={12} />
            </Link>
          </div>
        </Card>
      )}

      {!cv && (
        <Card variant="flat" padding="md" className="bg-stone-50">
          <EmptyState
            compact
            icon={FileUser}
            title="Här börjar ditt CV"
            description="Det behövs när vi börjar söka arbetsplats — kom igång i lugn takt."
            action={{
              label: 'Skapa CV',
              onClick: () => navigate('/cv'),
              variant: 'secondary',
            }}
          />
        </Card>
      )}

      {/* AI-team-kontext */}
      <Card variant="flat" padding="md" style={{ background: 'var(--c-bg)' }}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Bot size={16} style={{ color: 'var(--c-text)' }} />
            <div>
              <h4 className="text-sm font-semibold text-stone-900">Prata med din AI-coach</h4>
              <p className="text-xs text-stone-700">
                Reflektera över veckan, fråga om jobbsökning, eller bolla en idé.
              </p>
            </div>
          </div>
          <Link
            to={`/ai-team?prompt=${aiTeamPrompt}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-stone-200 text-stone-700 hover:border-stone-300"
          >
            Öppna AI-team
            <ChevronRight size={12} />
          </Link>
        </div>
      </Card>
    </div>
  )
}
