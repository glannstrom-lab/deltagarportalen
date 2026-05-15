/* eslint-disable react-refresh/only-export-components -- legitim samexistens av komponent + context/konstant/helper-export */
/**
 * AssessmentForm — generisk skattningsformulär för DOA, MOHOST (Del 1) m.fl.
 *
 * VIKTIGT: Detta är en förenklad version som matchar instrumentens **struktur**
 * men inte ersätter den arbetsterapeutiska bedömningen. Konsulenten/AT ska
 * fortfarande ha relevant utbildning och följa instrumentens riktlinjer.
 *
 * Varje skala är 4-stegs:
 *  - DOA: 1 (Mycket bra) – 2 (Bra) – 3 (Måste skärpas) – 4 (Otillfredsställande)
 *  - MOHOST: F (Fungerar) – I (Ineffektivt) – P (Problem) – H (Hindrar)
 *  + IS/SI för "Information saknas" (per instrumentbeskrivning)
 *
 * Data sparas i `sta_assessments.scores` som ett JSONB-objekt:
 *  { "item_key": { "value": 2, "comment": "..." }, ... }
 */

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CheckCircle2, Save, Info } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { VoiceInput } from './VoiceInput'
import type { StaAssessment, AssessmentInstrument } from '@/services/staApi'

// =============================================================================
// INSTRUMENT-DEFINITIONER
// =============================================================================

export interface AssessmentItem {
  key: string
  label: string
  description?: string
}

export interface InstrumentDef {
  id: AssessmentInstrument
  name: string
  fullName: string
  description: string
  /** Vem skattar */
  performer: 'deltagare' | 'arbetsterapeut' | 'konsulent'
  /** Vilka delar instrumentet används i */
  parts: number[]
  /** Skalan: 1-4 + ev. "information saknas" */
  scale: Array<{ value: number | 'IS'; label: string; shortLabel: string }>
  /** Items att skatta */
  items: AssessmentItem[]
}

const STANDARD_SCALE = [
  { value: 1 as const, label: 'Mycket bra', shortLabel: 'MB' },
  { value: 2 as const, label: 'Bra', shortLabel: 'B' },
  { value: 3 as const, label: 'Måste skärpas', shortLabel: 'MS' },
  { value: 4 as const, label: 'Otillfredsställande', shortLabel: 'O' },
  { value: 'IS' as const, label: 'Information saknas', shortLabel: 'IS' },
]

const MOHOST_SCALE = [
  { value: 1 as const, label: 'Fungerar', shortLabel: 'F' },
  { value: 2 as const, label: 'Ineffektivt', shortLabel: 'I' },
  { value: 3 as const, label: 'Problem', shortLabel: 'P' },
  { value: 4 as const, label: 'Hindrar', shortLabel: 'H' },
  { value: 'IS' as const, label: 'Information saknas', shortLabel: 'IS' },
]

/**
 * DOA (Dialog om arbetsförmåga) — Del 1 självskattning + AT-skattning
 * 13 items över 4 områden enligt instrumentbeskrivning.
 * Förenklad version här — vid implementation behöver kompletteras enligt licensen.
 */
export const DOA_INSTRUMENT: InstrumentDef = {
  id: 'DOA',
  name: 'DOA',
  fullName: 'Dialog om arbetsförmåga',
  description:
    'Självskattning av arbetsförmåga. Deltagaren skattar själv 13 områden; arbetsterapeut diskuterar och kommenterar.',
  performer: 'deltagare',
  parts: [1, 3],
  scale: STANDARD_SCALE,
  items: [
    { key: 'doa-fysisk-styrka', label: 'Fysisk styrka', description: 'Förmåga att lyfta, bära, dra/skjuta' },
    { key: 'doa-uthallighet', label: 'Uthållighet', description: 'Att orka en hel arbetsdag' },
    { key: 'doa-rorlighet', label: 'Rörlighet och balans' },
    { key: 'doa-koordination', label: 'Koordination och fingerfärdighet' },
    { key: 'doa-koncentration', label: 'Koncentrationsförmåga' },
    { key: 'doa-minne', label: 'Minne och inlärning' },
    { key: 'doa-problemlosning', label: 'Problemlösning' },
    { key: 'doa-tidsuppfattning', label: 'Tidsuppfattning och planering' },
    { key: 'doa-stresshantering', label: 'Stresshantering' },
    { key: 'doa-sjalvkansla', label: 'Självkänsla och självförtroende' },
    { key: 'doa-kommunikation', label: 'Kommunikation' },
    { key: 'doa-samarbete', label: 'Samarbete med andra' },
    { key: 'doa-flexibilitet', label: 'Flexibilitet och anpassning' },
  ],
}

/**
 * MOHOST (Model of Human Occupation Screening Tool) — sammanställning per kategori
 * Förenklad: en skattning per nyckelkategori istället för alla 24 underitems.
 */
export const MOHOST_INSTRUMENT: InstrumentDef = {
  id: 'MOHOST',
  name: 'MOHOST',
  fullName: 'Model of Human Occupation Screening Tool',
  description:
    'Bedömning av deltagarens delaktighet i aktiviteter. Skatta i 6 områden baserat på observation och dialog.',
  performer: 'arbetsterapeut',
  parts: [1, 2, 3, 4],
  scale: MOHOST_SCALE,
  items: [
    {
      key: 'mohost-motivation',
      label: 'Motivation för aktivitet',
      description: 'Engagemang, intresseval, förväntningar på resultat',
    },
    {
      key: 'mohost-vanor',
      label: 'Vanemönster',
      description: 'Rutiner, anpassningsbarhet, vanors stöd för aktivitet',
    },
    {
      key: 'mohost-kommunikation',
      label: 'Kommunikation och interaktion',
      description: 'Verbal/icke-verbal, sociala relationer, samspel',
    },
    {
      key: 'mohost-processfardigheter',
      label: 'Processfärdigheter',
      description: 'Kunskap, val, organisation, problemlösning',
    },
    {
      key: 'mohost-motoriska',
      label: 'Motoriska färdigheter',
      description: 'Kroppshållning, rörlighet, koordination, styrka, uthållighet',
    },
    {
      key: 'mohost-miljo',
      label: 'Miljö',
      description: 'Fysisk miljö, sociala grupper, kulturella förväntningar',
    },
  ],
}

export const INSTRUMENT_MAP: Record<AssessmentInstrument, InstrumentDef | null> = {
  DOA: DOA_INSTRUMENT,
  MOHOST: MOHOST_INSTRUMENT,
  WRI: null,  // Att-göra
  AWP: null,
  AWC: null,
}

// =============================================================================
// FORMULÄR
// =============================================================================

interface AssessmentScores {
  [itemKey: string]: {
    value: number | 'IS' | null
    comment?: string
  }
}

interface AssessmentFormProps {
  assessment: StaAssessment
  instrument: InstrumentDef
  onSave: (scores: Record<string, unknown>, summary?: string) => Promise<unknown>
  onMarkComplete?: () => Promise<unknown>
  /** Visa tidigare delars värden för jämförelse */
  previousScores?: AssessmentScores
}

export function AssessmentForm({
  assessment,
  instrument,
  onSave,
  onMarkComplete,
  previousScores,
}: AssessmentFormProps) {
  const [scores, setScores] = useState<AssessmentScores>(
    (assessment.scores as AssessmentScores) ?? {},
  )
  const [summary, setSummary] = useState(assessment.summary ?? '')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const isComplete = assessment.status === 'complete' || assessment.status === 'submitted_to_af'

  // Auto-save efter 2 sek inaktivitet
  useEffect(() => {
    if (isComplete) return
    const timer = setTimeout(async () => {
      if (Object.keys(scores).length === 0 && !summary) return
      setSaving(true)
      try {
        await onSave(scores, summary)
        setSavedAt(new Date())
      } finally {
        setSaving(false)
      }
    }, 2000)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scores, summary])

  const setItemValue = (key: string, value: number | 'IS') => {
    setScores((prev) => ({ ...prev, [key]: { ...prev[key], value } }))
  }

  const setItemComment = (key: string, comment: string) => {
    setScores((prev) => ({ ...prev, [key]: { ...prev[key], value: prev[key]?.value ?? null, comment } }))
  }

  const itemsAnswered = instrument.items.filter((item) => scores[item.key]?.value !== undefined && scores[item.key]?.value !== null).length
  const progress = Math.round((itemsAnswered / instrument.items.length) * 100)

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card variant="flat" padding="lg" style={{ background: 'var(--c-bg)' }}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--c-text)' }}>
              Skattning · Del {assessment.part}
            </div>
            <h2 className="text-xl font-semibold text-stone-900">
              {instrument.name} — {instrument.fullName}
            </h2>
            <p className="text-sm text-stone-700 mt-1 max-w-2xl">{instrument.description}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-stone-500">Klart</div>
            <div className="text-2xl font-semibold" style={{ color: 'var(--c-text)' }}>
              {progress}%
            </div>
            <div className="text-xs text-stone-500">
              {itemsAnswered} av {instrument.items.length}
            </div>
          </div>
        </div>
      </Card>

      {/* Items */}
      <div className="space-y-3">
        {instrument.items.map((item) => {
          const score = scores[item.key]
          const prev = previousScores?.[item.key]
          return (
            <Card key={item.key} variant="flat" padding="md">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                <div className="min-w-0">
                  <div className="font-medium text-stone-900">{item.label}</div>
                  {item.description && (
                    <div className="text-xs text-stone-500 mt-0.5">{item.description}</div>
                  )}
                  {prev && prev.value !== null && (
                    <div className="text-[11px] mt-1 inline-flex items-center gap-1 text-stone-600">
                      <Info size={10} />
                      Tidigare del: {instrument.scale.find((s) => s.value === prev.value)?.shortLabel ?? prev.value}
                    </div>
                  )}
                </div>
              </div>

              {/* Skala */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {instrument.scale.map((s) => {
                  const isSelected = score?.value === s.value
                  return (
                    <button
                      key={String(s.value)}
                      type="button"
                      onClick={() => setItemValue(item.key, s.value)}
                      disabled={isComplete}
                      title={s.label}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm border-2 transition-colors min-w-[44px]',
                        isSelected
                          ? 'text-white border-transparent'
                          : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300',
                        isComplete && 'opacity-60 cursor-not-allowed',
                      )}
                      style={isSelected ? { background: 'var(--c-solid)' } : undefined}
                    >
                      <span className="font-medium">{s.shortLabel}</span>
                    </button>
                  )
                })}
              </div>

              {score?.value !== undefined && score?.value !== null && (
                <input
                  type="text"
                  value={score.comment ?? ''}
                  onChange={(e) => setItemComment(item.key, e.target.value)}
                  placeholder="Kommentar (frivilligt)..."
                  disabled={isComplete}
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-sm"
                />
              )}
            </Card>
          )
        })}
      </div>

      {/* Sammanfattande kommentar */}
      <Card variant="flat" padding="lg">
        <h3 className="text-base font-semibold text-stone-900 mb-2">Sammanfattande kommentar</h3>
        <p className="text-sm text-stone-600 mb-3">
          Helhetsbild av deltagarens skattning. Det här fältet används som underlag för delredovisningen.
        </p>
        <VoiceInput
          value={summary}
          onChange={setSummary}
          placeholder="T.ex. 'Tydligt mönster: höga värden inom noggrannhet och tålamod. Behov av stöd kring stresshantering.'"
          rows={4}
          disabled={isComplete}
        />
      </Card>

      {/* Status-bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap p-4 rounded-xl bg-white border border-stone-200 sticky bottom-4">
        <div className="text-xs text-stone-500 flex items-center gap-2">
          {saving ? (
            <>Sparar...</>
          ) : savedAt ? (
            <>
              <CheckCircle2 size={12} className="text-emerald-700" />
              Auto-sparat {savedAt.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
            </>
          ) : (
            <>Auto-sparas efter 2 sekunder inaktivitet</>
          )}
        </div>
        <div className="flex gap-2">
          {!isComplete && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  setSaving(true)
                  await onSave(scores, summary)
                  setSavedAt(new Date())
                  setSaving(false)
                }}
                leftIcon={<Save size={14} />}
                isLoading={saving}
              >
                Spara
              </Button>
              {onMarkComplete && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={async () => {
                    setSaving(true)
                    await onSave(scores, summary)
                    await onMarkComplete()
                    setSaving(false)
                  }}
                  disabled={progress < 100}
                  leftIcon={<CheckCircle2 size={14} />}
                >
                  Markera som klar
                </Button>
              )}
            </>
          )}
          {isComplete && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
              <CheckCircle2 size={12} />
              Skattning klar
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
