/**
 * Slumpjobbet — snurra ett hjul av matchade jobb och få ett slumpmässigt vinnare.
 *
 * Inspirerat av wheelofnames.com. Hämtar upp till 30 jobb baserade på
 * användarens profil (CV-skills + drömjobb från preferences) och renderar
 * dem som segment på ett SVG-hjul. Klick på "Snurra!" animerar 5+ varv
 * med cubic-bezier easing och landar slumpmässigt på ett segment.
 *
 * Varför 30 jobb: tillräckligt många för att kännas "som platsbanken",
 * men inte så många att texten blir oläslig (12° per segment).
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { CreateApplicationModal } from '@/components/workflow'
import {
  Sparkles, RefreshCw, Loader2, MapPin, Building2,
  ExternalLink, Heart, Send, Trophy,
} from '@/components/ui/icons'
import { searchJobs, type PlatsbankenJob } from '@/services/arbetsformedlingenApi'
import { useSavedJobs } from '@/hooks/useSavedJobs'
import { userApi } from '@/services/userApi'
import { cvApi } from '@/services/cvApi'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'

const WHEEL_SIZE = 520 // px (svg viewBox is normalized -1..1 so storlek styrs här)
const TARGET_JOBS = 30 // sikta på 30 jobb i hjulet (12° per segment — läsbar text)
const SPIN_DURATION_MS = 5500
// Hård gräns för profil-hämtning — om Supabase hänger ska vi inte fastna
// i loading. Efter 2.5s fallback:ar vi till en generisk sökning.
const PROFILE_TIMEOUT_MS = 2500

// Färgpalett för segmenten — varma activity-hub-toner (persika/orange/amber)
// + lila/teal för kontrast. 10 färger som roterar.
const SEGMENT_COLORS = [
  '#FB923C', // orange-400
  '#F97316', // orange-500
  '#FBBF24', // amber-400
  '#F59E0B', // amber-500
  '#FCA5A5', // red-300
  '#FDE68A', // amber-200
  '#FED7AA', // orange-200
  '#FCD34D', // amber-300
  '#FB7185', // rose-400
  '#F472B6', // pink-400
]

function colorForIndex(i: number) {
  return SEGMENT_COLORS[i % SEGMENT_COLORS.length]
}

function truncate(s: string, n: number) {
  if (!s) return ''
  return s.length <= n ? s : s.slice(0, n - 1).trim() + '…'
}

interface WinnerPanelProps {
  job: PlatsbankenJob
  saved: boolean
  onSave: () => void
  onSpinAgain: () => void
  onCreateApplication: () => void
}

function WinnerPanel({ job, saved, onSave, onSpinAgain, onCreateApplication }: WinnerPanelProps) {
  const { t } = useTranslation()
  const place =
    job.workplace_address?.municipality ||
    job.workplace_address?.city ||
    job.workplace_address?.region ||
    t('jobSearch.slumpjobbet.allOfSweden')
  const employerName = job.employer?.name || t('jobSearch.slumpjobbet.unknownEmployer')
  // Bygg ansöknings-URL: föredra direktlänk, fallback till AF
  const applyUrl =
    job.application_details?.url ||
    `https://arbetsformedlingen.se/platsbanken/annonser/${job.id}`

  return (
    <Card className="p-6 border-2 border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center flex-shrink-0">
          <Trophy className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wider font-semibold text-orange-700 dark:text-orange-300 mb-1">
            Slumpjobbet
          </p>
          <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 leading-tight">
            {job.headline}
          </h3>
        </div>
      </div>

      <div className="space-y-2 mb-4 text-sm">
        <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
          <Building2 className="w-4 h-4 text-stone-500 flex-shrink-0" />
          <span>{employerName}</span>
        </div>
        <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
          <MapPin className="w-4 h-4 text-stone-500 flex-shrink-0" />
          <span>{place}</span>
        </div>
        {job.employment_type?.label && (
          <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
            <Sparkles className="w-4 h-4 text-stone-500 flex-shrink-0" />
            <span>{job.employment_type.label}</span>
          </div>
        )}
      </div>

      {job.description?.text && (
        <p className="text-sm text-stone-600 dark:text-stone-400 mb-4 line-clamp-4">
          {job.description.text.slice(0, 240)}
          {job.description.text.length > 240 ? '…' : ''}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <a
          href={applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-sm transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          {t('jobSearch.slumpjobbet.openAd')}
        </a>
        <button
          type="button"
          onClick={onSave}
          disabled={saved}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm border transition-colors',
            saved
              ? 'border-stone-300 text-stone-500 cursor-not-allowed'
              : 'border-stone-300 hover:bg-stone-50 dark:border-stone-600 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300',
          )}
        >
          <Heart className={cn('w-4 h-4', saved && 'fill-current text-rose-500')} />
          {saved ? t('jobSearch.slumpjobbet.saved') : t('jobSearch.slumpjobbet.save')}
        </button>
        {/* Öppnar ansökningsmodalen MED jobbet — tidigare länkade knappen
            till /applications utan jobbet, så vinsten tappades på vägen. */}
        <button
          type="button"
          onClick={onCreateApplication}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm border border-stone-300 hover:bg-stone-50 dark:border-stone-600 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
        >
          <Send className="w-4 h-4" />
          {t('jobSearch.slumpjobbet.createApplication')}
        </button>
        <button
          type="button"
          onClick={onSpinAgain}
          className="ml-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {t('jobSearch.slumpjobbet.spinAgain')}
        </button>
      </div>
    </Card>
  )
}

interface WheelProps {
  jobs: PlatsbankenJob[]
  rotation: number
  spinning: boolean
}

function Wheel({ jobs, rotation, spinning }: WheelProps) {
  const { t } = useTranslation()
  const segmentAngle = jobs.length > 0 ? 360 / jobs.length : 0

  // Bygg path-data för varje segment via polära koordinater
  // viewBox -1..1, segment är en pizza-slice från origo
  const segments = useMemo(() => {
    return jobs.map((job, i) => {
      const startAngle = (i * segmentAngle - 90) * (Math.PI / 180)
      const endAngle = ((i + 1) * segmentAngle - 90) * (Math.PI / 180)
      const x1 = Math.cos(startAngle)
      const y1 = Math.sin(startAngle)
      const x2 = Math.cos(endAngle)
      const y2 = Math.sin(endAngle)
      const largeArc = segmentAngle > 180 ? 1 : 0
      // Mitten av segmentet för text-position
      const midAngle = ((i + 0.5) * segmentAngle - 90) * (Math.PI / 180)
      const textRadius = 0.66 // 66% ut från center
      const textX = Math.cos(midAngle) * textRadius
      const textY = Math.sin(midAngle) * textRadius
      // Text-rotation: roterad så den läses radiellt utåt
      const textAngle = (i + 0.5) * segmentAngle - 90
      return {
        path: `M 0 0 L ${x1.toFixed(6)} ${y1.toFixed(6)} A 1 1 0 ${largeArc} 1 ${x2.toFixed(6)} ${y2.toFixed(6)} Z`,
        color: colorForIndex(i),
        text: truncate(job.headline || job.occupation?.label || t('jobSearch.slumpjobbet.wheelJobFallback', { number: i + 1 }), 28),
        textX,
        textY,
        textAngle,
      }
    })
  }, [jobs, segmentAngle, t])

  return (
    <div
      className="relative mx-auto"
      style={{ width: WHEEL_SIZE, height: WHEEL_SIZE, maxWidth: '100%' }}
    >
      {/* Pekare (pil) — pekar nedåt från toppen av hjulet */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 -translate-x-1/2 z-10"
        style={{ top: -6 }}
      >
        <svg width="44" height="48" viewBox="0 0 44 48">
          <path
            d="M 22 48 L 6 8 Q 6 4 10 4 L 34 4 Q 38 4 38 8 Z"
            fill="#0F172A"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Hjulet */}
      <svg
        viewBox="-1.05 -1.05 2.1 2.1"
        width="100%"
        height="100%"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning
            ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`
            : 'none',
          filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.18))',
        }}
      >
        {/* Outer ring */}
        <circle
          cx="0"
          cy="0"
          r="1.02"
          fill="#0F172A"
        />
        {/* Segments */}
        {segments.map((s, i) => (
          <g key={i}>
            <path d={s.path} fill={s.color} stroke="#FFFFFF" strokeWidth="0.003" />
            <text
              x={s.textX}
              y={s.textY}
              textAnchor="middle"
              dominantBaseline="middle"
              transform={`rotate(${s.textAngle} ${s.textX} ${s.textY})`}
              fontSize="0.028"
              fontWeight="600"
              fill="#1A1A1A"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {s.text}
            </text>
          </g>
        ))}
        {/* Center hub */}
        <circle cx="0" cy="0" r="0.08" fill="#0F172A" />
        <circle cx="0" cy="0" r="0.04" fill="#FB923C" />
      </svg>
    </div>
  )
}

export function SlumpjobbetTab() {
  const { t } = useTranslation()
  const { saveJob, isSaved } = useSavedJobs()
  const [jobs, setJobs] = useState<PlatsbankenJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [activeSearchTerm, setActiveSearchTerm] = useState<string | null>(null)
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState<PlatsbankenJob | null>(null)
  const [applicationModalJob, setApplicationModalJob] = useState<PlatsbankenJob | null>(null)
  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (spinTimerRef.current) clearTimeout(spinTimerRef.current) }, [])

  // Bygg ett initialt sökord från användarens profil — drömjobb först,
  // fallback till första work-experience-titel, sedan första skill.
  // Race mot en timeout så vi aldrig fastnar om Supabase-anropen hänger.
  const buildInitialSearch = useCallback(async (): Promise<string> => {
    const fetchProfile = (async () => {
      try {
        const [profilePrefs, cv] = await Promise.all([
          userApi.getPreferences().catch(() => null),
          cvApi.getCV().catch(() => null),
        ])
        const desired = profilePrefs?.desired_jobs?.[0]?.label
        if (desired) return desired
        const workExp = cv?.workExperience || cv?.work_experience
        const firstTitle = workExp?.[0]?.title || workExp?.[0]?.position
        if (firstTitle) return firstTitle
        const firstSkill = cv?.skills?.[0]
        if (firstSkill) return typeof firstSkill === 'string' ? firstSkill : firstSkill.name
        return ''
      } catch {
        return ''
      }
    })()
    const timeout = new Promise<string>((resolve) => setTimeout(() => resolve(''), PROFILE_TIMEOUT_MS))
    return Promise.race([fetchProfile, timeout])
  }, [])

  const loadJobs = useCallback(async (query: string) => {
    setLoading(true)
    setError(null)
    setWinner(null)
    try {
      // 10s timeout — om Platsbanken API hänger ska vi inte vänta för evigt
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(t('jobSearch.slumpjobbet.timeoutError'))), 10000),
      )
      const result = await Promise.race([
        searchJobs({
          query: query || 'jobb',
          limit: TARGET_JOBS,
          publishedWithin: 'month',
        }),
        timeoutPromise,
      ])
      // Slumpa ordning så hjulet inte alltid har samma topp-jobb först
      const shuffled = [...result.hits].sort(() => Math.random() - 0.5).slice(0, TARGET_JOBS)
      setJobs(shuffled)
      setActiveSearchTerm(query || 'jobb')
    } catch (e) {
      console.error('[Slumpjobbet] searchJobs failed:', e)
      setError(e instanceof Error ? e.message : t('jobSearch.slumpjobbet.fetchError'))
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [t])

  // Initial load: bygg sökord från profilen
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const initial = await buildInitialSearch()
      if (cancelled) return
      setSearchInput(initial)
      await loadJobs(initial)
    })()
    return () => { cancelled = true }
  }, [buildInitialSearch, loadJobs])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadJobs(searchInput.trim())
  }

  const handleSpin = () => {
    if (spinning || jobs.length === 0) return
    setSpinning(true)
    setWinner(null)
    // Slumpa vinnare
    const winningIndex = Math.floor(Math.random() * jobs.length)
    const segmentAngle = 360 / jobs.length
    // Centrum av segment N landar under pekaren (top = -90°).
    // Aktuell rotation modulo 360 ska bli sådan att segment-mitten är vid -90°.
    // Segment i:s mitt vid rotation 0 är vid vinkel (i + 0.5) * segmentAngle - 90.
    // Vi vill att den vinkeln + nya rotation = 270° (= -90° normaliserat) → så vinkeln pekar uppåt.
    // Förenklat: rotation += 5 fulla varv + offset till winning segment.
    const targetOffset = 360 - ((winningIndex + 0.5) * segmentAngle)
    // Adda 5 fulla varv så det känns som en riktig snurra
    const fullRotations = 5
    setRotation(prev => {
      // Normalisera previous rotation så att additionen alltid landar framåt
      const current = prev % 360
      return prev + (360 - current) + fullRotations * 360 + targetOffset
    })
    spinTimerRef.current = setTimeout(() => {
      setSpinning(false)
      setWinner(jobs[winningIndex])
    }, SPIN_DURATION_MS)
  }

  const handleSaveWinner = () => {
    if (!winner) return
    void saveJob(winner).catch((e) => console.error('Could not save winner:', e))
  }

  return (
    <div className="space-y-6">
      {/* Intro */}
      <Card className="p-5 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800/50">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">
              {t('jobSearch.slumpjobbet.introTitle')}
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {t('jobSearch.slumpjobbet.introText', { count: TARGET_JOBS })}
            </p>
          </div>
        </div>
      </Card>

      {/* Sökfält */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t('jobSearch.slumpjobbet.searchPlaceholder')}
          className="flex-1 px-4 py-2.5 border border-stone-300 dark:border-stone-600 rounded-xl text-sm bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
          disabled={loading || spinning}
        />
        <Button type="submit" variant="outline" disabled={loading || spinning}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {t('jobSearch.slumpjobbet.loadNewJobs')}
        </Button>
      </form>

      {/* Status */}
      {loading && (
        <Card className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-3" />
          <p className="text-stone-700 dark:text-stone-300">{t('jobSearch.slumpjobbet.loadingJobs')}</p>
        </Card>
      )}

      {error && !loading && (
        <Card className="p-6 text-center border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </Card>
      )}

      {/* Hjul */}
      {!loading && !error && jobs.length > 0 && (
        <div className="flex flex-col items-center gap-6">
          <Wheel jobs={jobs} rotation={rotation} spinning={spinning} />

          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleSpin}
              disabled={spinning || jobs.length === 0}
              className={cn(
                'px-10 py-4 rounded-full font-bold text-lg shadow-lg transition-all',
                spinning
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 active:scale-95 text-white shadow-orange-500/30',
              )}
            >
              {spinning ? t('jobSearch.slumpjobbet.spinningButton') : t('jobSearch.slumpjobbet.spinButton')}
            </button>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {t('jobSearch.slumpjobbet.jobsInWheel', { count: jobs.length })}
              {activeSearchTerm && ` ${t('jobSearch.slumpjobbet.forSearchTerm', { term: activeSearchTerm })}`}
            </p>
          </div>
        </div>
      )}

      {/* Vinnare */}
      {winner && (
        <WinnerPanel
          job={winner}
          saved={isSaved(winner.id)}
          onSave={handleSaveWinner}
          onSpinAgain={handleSpin}
          onCreateApplication={() => setApplicationModalJob(winner)}
        />
      )}

      {applicationModalJob && (
        <CreateApplicationModal
          job={applicationModalJob}
          isOpen={!!applicationModalJob}
          onClose={() => setApplicationModalJob(null)}
        />
      )}

      {/* Tom state */}
      {!loading && !error && jobs.length === 0 && (
        <Card className="p-8 text-center">
          <Sparkles className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
          <p className="text-stone-700 dark:text-stone-300 mb-2">
            {t('jobSearch.slumpjobbet.noJobsFound', { term: activeSearchTerm })}
          </p>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {t('jobSearch.slumpjobbet.noJobsHint')}
          </p>
        </Card>
      )}
    </div>
  )
}

export default SlumpjobbetTab
