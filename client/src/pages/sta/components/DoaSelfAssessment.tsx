/**
 * DoaSelfAssessment — deltagarens egen DOA-skattning, kategorivis wizard.
 *
 * AF:s DOA 4.2/2017 är ett hybridinstrument: deltagaren skattar 1-5 på 34 items,
 * och AT skattar samma items. Båda kolumnerna visas sedan i AF-blanketten (PDF).
 *
 * Denna komponent låter deltagaren göra sin del av skattningen i ett lugnt
 * tempo: 5 kategorier, en i taget, med autosparande mellan klick. AT:s
 * skattning rörs aldrig — server-RPC validerar exakt vilka fält som kan ändras.
 */

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, ChevronRight, ChevronLeft, CheckCircle2, Save, AlertTriangle, Info } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { staAssessmentsApi, type StaAssessment } from '@/services/staApi'
import { DOA } from '../assessmentInstruments'

interface Props {
  enrollmentId: string
  /** Befintlig assessment (om finns), används för att förladda skattningar. */
  existing?: StaAssessment | null
  onClose: () => void
  /** Callback när något sparats — så förälder kan reload:a och uppdatera progress-räkning. */
  onSaved?: (updated: StaAssessment) => void
}

type Step = number | 'intro' | 'done'

interface ItemEntry {
  person?: number | null
  bedomare?: number | string | null
  comment?: string
}

interface ScoresShape {
  _bedomningar?: Array<{ id: string }>
  _participant_completed_at?: string
  [key: string]: ItemEntry | Array<{ id: string }> | string | undefined
}

function itemKey(catIdx: number, itemIdx: number): string {
  return `b1_c${catIdx}_i${itemIdx}`
}

function readEntry(scores: ScoresShape | undefined, catIdx: number, itemIdx: number): ItemEntry {
  const raw = scores?.[itemKey(catIdx, itemIdx)] as ItemEntry | undefined
  return raw ?? {}
}

export function DoaSelfAssessment({ enrollmentId, existing, onClose, onSaved }: Props) {
  // Sparad data från servern — fungerar som "source of truth" mellan saves.
  const [assessment, setAssessment] = useState<StaAssessment | null>(existing ?? null)
  // Wizard-position
  const [step, setStep] = useState<Step>('intro')
  // Lokala kommentarutkast (sparas vid blur, så vi inte triggar RPC per tangenttryck)
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  // Spar-status — "saving"-token per item-nyckel
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set())
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [finishing, setFinishing] = useState(false)

  const scores = (assessment?.scores as ScoresShape | undefined) ?? {}
  const participantDone = !!scores._participant_completed_at

  // Räkna ifyllda items (person-värde satt) per kategori och totalt
  const counts = useMemo(() => {
    const perCategory: number[] = DOA.categories.map(() => 0)
    let total = 0
    DOA.categories.forEach((cat, catIdx) => {
      for (let itemIdx = 0; itemIdx < cat.items.length; itemIdx++) {
        const e = readEntry(scores, catIdx, itemIdx)
        if (typeof e.person === 'number' && e.person >= 1 && e.person <= 5) {
          perCategory[catIdx]++
          total++
        }
      }
    })
    return { perCategory, total, max: DOA.itemCount }
  }, [scores])

  const saveItem = async (catIdx: number, itemIdx: number, value: number | null, comment?: string) => {
    const key = itemKey(catIdx, itemIdx)
    setSavingKeys((prev) => new Set(prev).add(key))
    setError(null)
    try {
      const updated = await staAssessmentsApi.participantSaveDoaScore({
        enrollment_id: enrollmentId,
        cat_index: catIdx,
        item_index: itemIdx,
        person_value: value,
        comment: comment ?? null,
      })
      setAssessment(updated)
      setLastSavedAt(new Date())
      onSaved?.(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte spara')
    } finally {
      setSavingKeys((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  const handleValue = (catIdx: number, itemIdx: number, value: number | null) => {
    const currentComment = commentDrafts[itemKey(catIdx, itemIdx)]
    void saveItem(catIdx, itemIdx, value, currentComment)
  }

  const handleCommentBlur = (catIdx: number, itemIdx: number) => {
    const key = itemKey(catIdx, itemIdx)
    const draft = commentDrafts[key]
    const saved = readEntry(scores, catIdx, itemIdx).comment ?? ''
    if (draft === undefined || draft === saved) return
    const currentValue = readEntry(scores, catIdx, itemIdx).person ?? null
    void saveItem(catIdx, itemIdx, currentValue ?? null, draft)
  }

  const handleFinish = async () => {
    setFinishing(true)
    setError(null)
    try {
      const updated = await staAssessmentsApi.participantMarkDoaDone(enrollmentId)
      setAssessment(updated)
      onSaved?.(updated)
      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte markera klar')
    } finally {
      setFinishing(false)
    }
  }

  return (
    <ModalShell onClose={onClose}>
      <Header
        step={step}
        totalCompleted={counts.total}
        totalMax={counts.max}
        onClose={onClose}
        lastSavedAt={lastSavedAt}
        participantDone={participantDone}
      />

      <div className="overflow-y-auto flex-1 px-6 py-5">
        {step === 'intro' && (
          <IntroPanel
            participantDone={participantDone}
            counts={counts}
            onStart={() => setStep(0)}
            onResume={() => {
              // Hoppa till första kategori med ofyllda items
              const firstIncomplete = counts.perCategory.findIndex(
                (c, i) => c < DOA.categories[i].items.length,
              )
              setStep(firstIncomplete === -1 ? 'done' : firstIncomplete)
            }}
          />
        )}

        {typeof step === 'number' && (
          <CategoryStep
            catIdx={step}
            scores={scores}
            commentDrafts={commentDrafts}
            savingKeys={savingKeys}
            participantDone={participantDone}
            onValue={handleValue}
            onCommentChange={(catIdx, itemIdx, value) =>
              setCommentDrafts((prev) => ({ ...prev, [itemKey(catIdx, itemIdx)]: value }))
            }
            onCommentBlur={handleCommentBlur}
            categoryCount={counts.perCategory[step]}
          />
        )}

        {step === 'done' && <DonePanel onClose={onClose} />}

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-900 flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      <Footer
        step={step}
        counts={counts}
        finishing={finishing}
        participantDone={participantDone}
        onPrev={() => {
          if (typeof step === 'number' && step > 0) setStep(step - 1)
          else if (step === 0) setStep('intro')
        }}
        onNext={() => {
          if (step === 'intro') setStep(0)
          else if (typeof step === 'number' && step < DOA.categories.length - 1) setStep(step + 1)
          else if (typeof step === 'number') setStep('done')
        }}
        onPause={onClose}
        onFinish={handleFinish}
      />
    </ModalShell>
  )
}

// ===========================================================================
// HEADER
// ===========================================================================

function Header({
  step,
  totalCompleted,
  totalMax,
  onClose,
  lastSavedAt,
  participantDone,
}: {
  step: Step
  totalCompleted: number
  totalMax: number
  onClose: () => void
  lastSavedAt: Date | null
  participantDone: boolean
}) {
  const { t } = useTranslation()
  const stepLabel =
    step === 'intro'
      ? 'Om självskattningen'
      : step === 'done'
        ? 'Klar'
        : `Del ${(step as number) + 1} av ${DOA.categories.length}`

  return (
    <div
      className="px-6 py-5 border-b border-stone-100 flex items-start justify-between gap-3"
      style={{ background: 'var(--c-bg)' }}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-stone-500 font-medium">
          Min skattning · DOA
        </div>
        <h2 className="text-xl font-semibold text-stone-900">{stepLabel}</h2>
        <div className="mt-2 flex items-center gap-3 flex-wrap">
          <span className="text-xs text-stone-700">
            {totalCompleted} av {totalMax} frågor besvarade
          </span>
          <div className="h-1.5 rounded-full overflow-hidden bg-white w-32">
            <div
              className="h-full transition-all"
              style={{
                width: `${Math.round((totalCompleted / totalMax) * 100)}%`,
                background: 'var(--c-solid)',
              }}
            />
          </div>
          {lastSavedAt && (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
              <CheckCircle2 size={11} />
              Sparat
            </span>
          )}
          {participantDone && (
            <span className="inline-flex items-center gap-1 text-[11px] text-stone-600 px-2 py-0.5 rounded-full bg-white border border-stone-200">
              <CheckCircle2 size={11} />
              Du har markerat klar
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={t('sta.aria.close', 'Stäng')}
        className="flex-shrink-0 p-1.5 rounded-full hover:bg-white/60 transition-colors"
      >
        <X size={18} className="text-stone-600" />
      </button>
    </div>
  )
}

// ===========================================================================
// INTRO PANEL
// ===========================================================================

function IntroPanel({
  participantDone,
  counts,
  onStart,
  onResume,
}: {
  participantDone: boolean
  counts: { total: number; max: number; perCategory: number[] }
  onStart: () => void
  onResume: () => void
}) {
  const hasProgress = counts.total > 0
  return (
    <div className="space-y-4 max-w-2xl">
      <Card variant="flat" padding="md" style={{ background: 'var(--c-bg)' }}>
        <div className="flex items-start gap-2">
          <Info size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--c-text)' }} />
          <div className="text-sm text-stone-800">
            <p className="font-medium mb-1">Det här är din egen skattning</p>
            <p>
              34 frågor om hur du själv ser på din arbetsförmåga. Det finns inga rätta eller fel
              svar — bara din bild just nu. Din arbetsterapeut gör en egen skattning vid sidan
              av din, och sedan pratar ni om vad ni ser tillsammans.
            </p>
          </div>
        </div>
      </Card>

      <div>
        <h3 className="text-sm font-semibold text-stone-900 mb-2">Hur det fungerar</h3>
        <ul className="text-sm text-stone-700 space-y-1.5">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--c-solid)' }} />
            <span>Du går igenom <strong>5 områden</strong> — ett i taget. Det går att pausa när du vill.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--c-solid)' }} />
            <span>Du sätter en siffra <strong>1 (i låg grad)</strong> till <strong>5 (i hög grad)</strong>. Allt sparas direkt.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--c-solid)' }} />
            <span>Du kan skriva en <strong>kommentar</strong> till varje fråga om du vill förklara mer.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--c-solid)' }} />
            <span>Det tar oftast <strong>20-40 minuter</strong> totalt, men det är ingen tävling.</span>
          </li>
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-stone-900 mb-2">De fem områdena</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DOA.categories.map((cat, i) => {
            const done = counts.perCategory[i]
            const total = cat.items.length
            const isDone = done === total
            return (
              <div
                key={cat.title}
                className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 bg-white"
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0',
                    isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600',
                  )}
                >
                  {isDone ? <CheckCircle2 size={14} /> : i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-stone-900 truncate">{cat.title}</div>
                  <div className="text-xs text-stone-500">
                    {done} av {total} besvarade
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        {participantDone ? (
          <Button variant="primary" onClick={onResume}>
            Öppna och se mina svar
          </Button>
        ) : hasProgress ? (
          <>
            <Button variant="primary" onClick={onResume}>
              Fortsätt där du var
            </Button>
            <Button variant="ghost" onClick={onStart}>
              Börja om från första området
            </Button>
          </>
        ) : (
          <Button variant="primary" onClick={onStart}>
            Börja
          </Button>
        )}
      </div>
    </div>
  )
}

// ===========================================================================
// CATEGORY STEP
// ===========================================================================

function CategoryStep({
  catIdx,
  scores,
  commentDrafts,
  savingKeys,
  participantDone,
  onValue,
  onCommentChange,
  onCommentBlur,
  categoryCount,
}: {
  catIdx: number
  scores: ScoresShape
  commentDrafts: Record<string, string>
  savingKeys: Set<string>
  participantDone: boolean
  onValue: (catIdx: number, itemIdx: number, value: number | null) => void
  onCommentChange: (catIdx: number, itemIdx: number, value: string) => void
  onCommentBlur: (catIdx: number, itemIdx: number) => void
  categoryCount: number
}) {
  const cat = DOA.categories[catIdx]
  const items = cat.personItems ?? cat.items
  const totalInCat = cat.items.length

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] uppercase tracking-wide text-stone-500 font-medium">
          Område {catIdx + 1} av {DOA.categories.length}
        </div>
        <h3 className="text-lg font-semibold text-stone-900 mt-0.5">{cat.title}</h3>
        <p className="text-xs text-stone-600 mt-0.5">
          {categoryCount} av {totalInCat} besvarade i det här området
        </p>
      </div>

      <ScaleHint />

      <ul className="space-y-3">
        {items.map((label, itemIdx) => {
          const key = itemKey(catIdx, itemIdx)
          const entry = readEntry(scores, catIdx, itemIdx)
          const currentValue = entry.person ?? null
          const commentValue = commentDrafts[key] ?? entry.comment ?? ''
          const saving = savingKeys.has(key)

          return (
            <li key={key} className="p-3 rounded-xl border border-stone-200 bg-white">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="text-sm text-stone-900">{label}</div>
                {saving && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 flex-shrink-0">
                    <Save size={11} />
                    Sparar…
                  </span>
                )}
              </div>

              {/* 1-5 skala */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[1, 2, 3, 4, 5].map((v) => {
                  const selected = currentValue === v
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => !participantDone && onValue(catIdx, itemIdx, selected ? null : v)}
                      aria-pressed={selected}
                      disabled={participantDone}
                      className={cn(
                        'inline-flex items-center justify-center min-w-[40px] h-9 rounded-lg px-2 text-sm font-semibold transition-all',
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--c-solid)]',
                        selected
                          ? 'text-white shadow-sm'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200',
                        participantDone && 'cursor-not-allowed opacity-75',
                      )}
                      style={selected ? { background: 'var(--c-solid)' } : undefined}
                      title={v === 1 ? 'I låg grad' : v === 5 ? 'I hög grad' : `${v}`}
                    >
                      {v}
                    </button>
                  )
                })}
                <div className="flex items-center gap-1.5 ml-2 text-[11px] text-stone-500">
                  <span>← I låg grad</span>
                  <span className="mx-1">·</span>
                  <span>I hög grad →</span>
                </div>
              </div>

              {/* Kommentar (valfri) */}
              <textarea
                rows={1}
                value={commentValue}
                onChange={(e) => onCommentChange(catIdx, itemIdx, e.target.value)}
                onBlur={() => onCommentBlur(catIdx, itemIdx)}
                disabled={participantDone}
                placeholder="Vill du förklara mer? (frivilligt)"
                className="w-full px-2 py-1.5 rounded border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-stone-200 resize-y disabled:bg-stone-50"
                aria-label={`Kommentar för ${label}`}
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function ScaleHint() {
  return (
    <Card variant="flat" padding="md" className="border border-stone-200">
      <div className="text-xs uppercase tracking-wide text-stone-500 font-medium mb-1">Skala</div>
      <div className="text-xs text-stone-700">
        <strong>1</strong> = jag tycker det stämmer in på mig i låg grad
        <span className="mx-2 text-stone-400">|</span>
        <strong>5</strong> = jag tycker det stämmer in på mig i hög grad
      </div>
    </Card>
  )
}

// ===========================================================================
// DONE PANEL
// ===========================================================================

function DonePanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-4 max-w-xl">
      <Card variant="flat" padding="lg" style={{ background: 'var(--c-bg)' }}>
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'white', color: 'var(--c-text)' }}
          >
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-stone-900 mb-1">
              Tack — det här är ett viktigt steg
            </h3>
            <p className="text-sm text-stone-700">
              Du har gjort din del av skattningen. Din arbetsterapeut har nu underlag att gå
              igenom — och ni kommer prata om det tillsammans på nästa möte.
            </p>
          </div>
        </div>
      </Card>

      <Card variant="flat" padding="md" className="border border-stone-200">
        <div className="text-xs uppercase tracking-wide text-stone-500 font-medium mb-1">
          Vad händer nu?
        </div>
        <ul className="text-sm text-stone-700 space-y-1.5">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--c-solid)' }} />
            <span>Din arbetsterapeut tittar igenom dina svar.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--c-solid)' }} />
            <span>Ni går igenom det tillsammans på nästa kartläggningssamtal.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--c-solid)' }} />
            <span>Du kan alltid komma tillbaka och titta på dina svar.</span>
          </li>
        </ul>
      </Card>

      <Button variant="primary" onClick={onClose}>
        Stäng
      </Button>
    </div>
  )
}

// ===========================================================================
// FOOTER
// ===========================================================================

function Footer({
  step,
  counts,
  finishing,
  participantDone,
  onPrev,
  onNext,
  onPause,
  onFinish,
}: {
  step: Step
  counts: { total: number; max: number }
  finishing: boolean
  participantDone: boolean
  onPrev: () => void
  onNext: () => void
  onPause: () => void
  onFinish: () => void
}) {
  if (step === 'intro' || step === 'done') {
    return (
      <div className="px-6 py-3 border-t border-stone-100 bg-stone-50 flex items-center justify-end">
        <Button variant="ghost" onClick={onPause}>
          Stäng
        </Button>
      </div>
    )
  }

  const isLastCategory = step === DOA.categories.length - 1
  const allDone = counts.total === counts.max

  return (
    <div className="px-6 py-3 border-t border-stone-100 bg-stone-50 flex items-center justify-between gap-2 flex-wrap">
      <Button
        variant="ghost"
        leftIcon={<ChevronLeft size={14} />}
        onClick={onPrev}
        disabled={finishing}
      >
        {step === 0 ? 'Tillbaka' : 'Föregående område'}
      </Button>

      <div className="flex gap-2 flex-wrap">
        <Button variant="ghost" onClick={onPause} disabled={finishing}>
          Pausa
        </Button>
        {isLastCategory && allDone && !participantDone && (
          <Button
            variant="primary"
            leftIcon={<CheckCircle2 size={14} />}
            onClick={onFinish}
            isLoading={finishing}
          >
            Markera som klar
          </Button>
        )}
        {(!isLastCategory || !allDone) && (
          <Button
            variant="primary"
            onClick={onNext}
            disabled={finishing}
          >
            {isLastCategory ? 'Översikt' : 'Nästa område'} <ChevronRight size={14} className="ml-1" />
          </Button>
        )}
      </div>
    </div>
  )
}

// ===========================================================================
// MODAL SHELL
// ===========================================================================

function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const { t } = useTranslation()
  // ESC stänger
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/40"
        onClick={onClose}
        aria-label={t('sta.aria.close', 'Stäng')}
      />
      <div
        className="relative w-full sm:max-w-3xl bg-white sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-screen sm:max-h-[90vh]"
        data-domain="action"
      >
        {children}
      </div>
    </div>
  )
}
