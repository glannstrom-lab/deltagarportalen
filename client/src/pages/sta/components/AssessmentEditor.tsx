/**
 * AssessmentEditor — generisk editor för STA-skattningar.
 *
 * Stödjer alla 5 instrument (DOA, WRI, MOHOST, AWP, AWC) baserat på
 * instrument-definitionerna i assessmentInstruments.ts.
 *
 * DOA är hybrid: deltagaren självskattar (person-värde) + AT bedömer
 * (bedomare-värde). Övriga instrument har bara ett värde per item.
 *
 * JSONB-format för sta_assessments.scores (per research §7.2):
 *   DOA:       { item_1: { person: 4, bedomare: 3, comment: "..." }, ... }
 *   Övriga:    { item_1: { value: 3, comment: "..." }, ... }
 *
 * Per-item kommentar är valfri. Sammanfattande kommentar sparas i
 * sta_assessments.summary (separat kolumn).
 */

import { useEffect, useState } from 'react'
import { X, Save, Info, CheckCircle, AlertTriangle, Download, Sparkles, Loader2 } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { staAssessmentsApi, type StaAssessment, type StaEnrollment } from '@/services/staApi'
import { generateDoaSummary, type DoaSummaryResult } from '@/services/aiApi'
import { resolveParticipantName } from '../enrollmentDisplay'
import {
  getInstrument,
  type InstrumentDefinition,
  type InstrumentScale,
} from '../assessmentInstruments'
import {
  fillAwpPdf,
  fillAwcPdf,
  fillMohostPdf,
  fillDoaPdf,
  downloadPdf,
  suggestPdfFilename,
} from '../assessmentPdfExport'

interface AssessmentEditorProps {
  assessment: StaAssessment
  enrollment?: StaEnrollment
  /** Konsulent-namn för PDF-export (Bedömare-fältet) */
  consultantName?: string
  /** Föreslagen läge: 'at' (default) eller 'deltagare' för självskattning */
  mode?: 'at' | 'deltagare'
  onClose: () => void
  onSaved?: (updated: StaAssessment) => void
}

type ItemValue = number | string | null

interface HybridItemEntry {
  person?: ItemValue
  bedomare?: ItemValue
  comment?: string
}

interface SingleItemEntry {
  value?: ItemValue
  comment?: string
}

type ItemEntry = HybridItemEntry | SingleItemEntry

interface BedomningMeta {
  id: string // 'b1', 'b2', ..
  datum?: string // ISO YYYY-MM-DD
  arbetsuppgift?: string
}

// JSONB-format i sta_assessments.scores:
//   {
//     _bedomningar: [{ id: 'b1', datum, arbetsuppgift }, ...],
//     b1_c0_i0: { value, comment },
//     b1_c0_i1: { value, ... },
//     b2_c0_i0: { ... },
//     ...
//   }
// För instrument utan multi-bedömning (DOA, WRI, MOHOST) används bara 'b1'.
// Bakåtkompatibilitet: gammal flat-format ({ c0_i0: {...} }) tolkas som 'b1'.
interface DoaSummaryStored extends DoaSummaryResult {
  /** ISO-tidpunkt när AI senast genererade. Hjälper AT veta om utkastet är gammalt. */
  generatedAt?: string
  /** True om AT redigerat efter AI-generering. */
  editedByAt?: boolean
}

interface ScoresJsonb {
  _bedomningar?: BedomningMeta[]
  _ai_summary?: DoaSummaryStored
  [key: string]: ItemEntry | BedomningMeta[] | DoaSummaryStored | undefined
}

const MULTI_INSTRUMENTS = new Set(['AWP', 'AWC'])
const MAX_BEDOMNINGAR = 4

function isHybridInstrument(instrument: InstrumentDefinition): boolean {
  return instrument.hasSelfRating
}

function isMultiInstrument(code: string): boolean {
  return MULTI_INSTRUMENTS.has(code)
}

function itemKey(bedomningId: string, catIndex: number, itemIndex: number): string {
  return `${bedomningId}_c${catIndex}_i${itemIndex}`
}


/**
 * Normaliserar scores-JSONB till multi-bedömning-format.
 * - Om _bedomningar finns: returnera som-är
 * - Om flat (c0_i0-keys utan prefix): wrappa i b1
 */
/**
 * Tar bort items för en bedömning och renumrerar resterande:
 * b1 b2 b3 → ta bort b2 → b1 b2 (gamla b3 blir nya b2).
 * Behåller _bedomningar oförändrat — anroparen ansvarar för det.
 */
function _renumberAfterRemove(scores: ScoresJsonb, removedId: string): ScoresJsonb {
  const out: ScoresJsonb = { _bedomningar: scores._bedomningar }
  const removedIdx = parseInt(removedId.slice(1), 10)
  for (const [key, value] of Object.entries(scores)) {
    if (key === '_bedomningar') continue
    const match = key.match(/^b(\d+)_(.+)$/)
    if (!match) {
      out[key] = value as ItemEntry
      continue
    }
    const bedIdx = parseInt(match[1], 10)
    if (bedIdx === removedIdx) continue // skippa removed
    if (bedIdx > removedIdx) {
      out[`b${bedIdx - 1}_${match[2]}`] = value as ItemEntry
    } else {
      out[key] = value as ItemEntry
    }
  }
  return out
}

function normalizeScores(raw: unknown): ScoresJsonb {
  const src = (raw as Record<string, unknown>) ?? {}
  if (Array.isArray(src._bedomningar)) {
    return src as ScoresJsonb
  }
  // Migrate flat → b1
  const out: ScoresJsonb = { _bedomningar: [{ id: 'b1' }] }
  for (const [key, value] of Object.entries(src)) {
    if (key === '_bedomningar') continue
    if (key === '_ai_summary' || key === '_participant_completed_at') {
      out[key] = value as DoaSummaryStored
      continue
    }
    if (key.match(/^c\d+_i\d+$/)) {
      out[`b1_${key}`] = value as ItemEntry
    } else {
      out[key] = value as ItemEntry
    }
  }
  return out
}

export function AssessmentEditor({
  assessment,
  enrollment,
  consultantName,
  mode: initialMode = 'at',
  onClose,
  onSaved,
}: AssessmentEditorProps) {
  const instrument = getInstrument(assessment.instrument)
  const isMulti = !!instrument && isMultiInstrument(instrument.code)

  const [mode, setMode] = useState<'at' | 'deltagare'>(initialMode)
  const [scores, setScores] = useState<ScoresJsonb>(() => normalizeScores(assessment.scores))
  const [bedomningIndex, setBedomningIndex] = useState(0)
  const [summary, setSummary] = useState(assessment.summary ?? '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  // Reset state om assessment ändras
  useEffect(() => {
    setScores(normalizeScores(assessment.scores))
    setSummary(assessment.summary ?? '')
    setBedomningIndex(0)
    setDirty(false)
  }, [assessment.id])

  const bedomningar: BedomningMeta[] = scores._bedomningar ?? [{ id: 'b1' }]
  const currentBedomning = bedomningar[bedomningIndex] ?? bedomningar[0]
  const currentBedomningId = currentBedomning?.id ?? 'b1'

  if (!instrument) {
    return (
      <ModalShell onClose={onClose}>
        <div className="px-6 py-5">
          <p className="text-sm text-rose-700">
            Okänt instrument: {assessment.instrument}. Kontakta support.
          </p>
        </div>
      </ModalShell>
    )
  }

  const hybrid = isHybridInstrument(instrument)
  const totalItems = instrument.itemCount
  // Räkna ifyllda items för current bedömning (multi-instrument)
  // eller totalt (single-instrument — bara b1)
  // Vanlig beräkning (inte useMemo): låg efter en early return vilket bröt
  // hook-reglerna (rules-of-hooks). Linjär skanning av scores är billig.
  const completedItems = (() => {
    let n = 0
    const prefix = `${currentBedomningId}_`
    for (const [key, raw] of Object.entries(scores)) {
      if (key === '_bedomningar') continue
      if (!key.startsWith(prefix)) continue
      const entry = raw as ItemEntry
      if (hybrid) {
        const e = entry as HybridItemEntry
        if (mode === 'deltagare') {
          if (e.person !== undefined && e.person !== null && e.person !== '') n++
        } else {
          if (e.bedomare !== undefined && e.bedomare !== null && e.bedomare !== '') n++
        }
      } else {
        const e = entry as SingleItemEntry
        if (e.value !== undefined && e.value !== null && e.value !== '') n++
      }
    }
    return n
  })()
  const progress = Math.round((completedItems / totalItems) * 100)

  const handleItemValue = (catIdx: number, itemIdx: number, value: ItemValue) => {
    const key = itemKey(currentBedomningId, catIdx, itemIdx)
    setScores((prev) => {
      const entry = (prev[key] as ItemEntry | undefined) ?? {}
      const updated: ItemEntry = hybrid
        ? {
            ...(entry as HybridItemEntry),
            [mode === 'deltagare' ? 'person' : 'bedomare']: value,
          }
        : { ...(entry as SingleItemEntry), value }
      return { ...prev, [key]: updated }
    })
    setDirty(true)
  }

  const handleItemComment = (catIdx: number, itemIdx: number, comment: string) => {
    const key = itemKey(currentBedomningId, catIdx, itemIdx)
    setScores((prev) => ({
      ...prev,
      [key]: { ...((prev[key] as ItemEntry | undefined) ?? {}), comment },
    }))
    setDirty(true)
  }

  const handleBedomningMetaChange = (field: 'datum' | 'arbetsuppgift', value: string) => {
    setScores((prev) => {
      const updated: BedomningMeta[] = (prev._bedomningar ?? [{ id: 'b1' }]).map((b, i) =>
        i === bedomningIndex ? { ...b, [field]: value } : b,
      )
      return { ...prev, _bedomningar: updated }
    })
    setDirty(true)
  }

  const handleAddBedomning = () => {
    if (bedomningar.length >= MAX_BEDOMNINGAR) return
    const nextId = `b${bedomningar.length + 1}`
    setScores((prev) => ({
      ...prev,
      _bedomningar: [...(prev._bedomningar ?? [{ id: 'b1' }]), { id: nextId }],
    }))
    setBedomningIndex(bedomningar.length) // växla till nya bedömningen
    setDirty(true)
  }

  const handleRemoveBedomning = (index: number) => {
    if (bedomningar.length <= 1) return
    if (!confirm(`Ta bort Bedömning ${index + 1}? Alla skattningar och kommentarer för den raderas.`)) return
    const removedId = bedomningar[index].id
    setScores((prev) => {
      const next: ScoresJsonb = { ..._renumberAfterRemove(prev, removedId) }
      next._bedomningar = (prev._bedomningar ?? []).filter((_, i) => i !== index)
        .map((b, i) => ({ ...b, id: `b${i + 1}` }))
      return next
    })
    setBedomningIndex(Math.min(index, bedomningar.length - 2))
    setDirty(true)
  }

  const handleSummary = (text: string) => {
    setSummary(text)
    setDirty(true)
  }

  // =================================================================
  // DOA-AI-sammanfattning (för AF-blankett sida 4)
  // =================================================================
  const handleGenerateDoaSummary = async () => {
    if (!instrument || instrument.code !== 'DOA') return
    setSummaryError(null)
    setGeneratingSummary(true)
    try {
      // Bygg payload från nuvarande scores (deltagaren + AT-bedömningar + kommentarer)
      const categoriesPayload = instrument.categories.map((cat, catIdx) => ({
        title: cat.title,
        items: cat.items.map((itemText, itemIdx) => {
          const entry = (scores[itemKey('b1', catIdx, itemIdx)] as HybridItemEntry | undefined) ?? {}
          return {
            text: itemText,
            person: typeof entry.person === 'number' ? entry.person : null,
            bedomare: typeof entry.bedomare === 'number' ? entry.bedomare : entry.bedomare ?? null,
            comment: entry.comment ?? null,
          }
        }),
      }))
      const firstName = enrollment ? resolveParticipantName(enrollment, '').split(' ')[0] : undefined
      const result = await generateDoaSummary({ firstName, categories: categoriesPayload })
      const ai = (result as { sammanfattning?: DoaSummaryResult }).sammanfattning
      if (!ai) {
        throw new Error('AI gav inget svar — försök igen om en stund.')
      }
      setScores((prev) => ({
        ...prev,
        _ai_summary: {
          malPlanering: ai.malPlanering ?? '',
          kategorier: Array.isArray(ai.kategorier) ? ai.kategorier : [],
          generatedAt: new Date().toISOString(),
          editedByAt: false,
        },
      }))
      setDirty(true)
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : 'Kunde inte generera sammanfattning')
    } finally {
      setGeneratingSummary(false)
    }
  }

  const handleSummaryFieldChange = (
    field: 'malPlanering' | 'kategori',
    catIdx: number | null,
    value: string,
  ) => {
    setScores((prev) => {
      const existing: DoaSummaryStored = prev._ai_summary ?? {
        malPlanering: '',
        kategorier: instrument
          ? instrument.categories.map((c) => ({ title: c.title, resurserBegransningar: '' }))
          : [],
      }
      const next: DoaSummaryStored = {
        ...existing,
        editedByAt: true,
      }
      if (field === 'malPlanering') {
        next.malPlanering = value
      } else if (field === 'kategori' && catIdx !== null && instrument) {
        const kategorier = [...(existing.kategorier ?? [])]
        // Säkerställ att arrayen har en plats för denna kategori
        while (kategorier.length < instrument.categories.length) {
          const i = kategorier.length
          kategorier.push({ title: instrument.categories[i].title, resurserBegransningar: '' })
        }
        kategorier[catIdx] = {
          title: kategorier[catIdx]?.title ?? instrument.categories[catIdx].title,
          resurserBegransningar: value,
        }
        next.kategorier = kategorier
      }
      return { ...prev, _ai_summary: next }
    })
    setDirty(true)
  }

  const persistDraft = async () => {
    setSaveError(null)
    setSaving(true)
    try {
      const updated = await staAssessmentsApi.update(assessment.id, {
        scores: scores as unknown as Record<string, unknown>,
        summary,
        status: assessment.status === 'complete' ? 'complete' : 'draft',
      })
      setDirty(false)
      onSaved?.(updated as StaAssessment)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Kunde inte spara')
    } finally {
      setSaving(false)
    }
  }

  const persistComplete = async () => {
    if (completedItems < totalItems) {
      setSaveError(
        `Markera alla ${totalItems} items innan du markerar skattningen som klar. ${completedItems} av ${totalItems} är ifyllda.`,
      )
      return
    }
    setSaveError(null)
    setSaving(true)
    try {
      const updated = await staAssessmentsApi.update(assessment.id, {
        scores: scores as unknown as Record<string, unknown>,
        summary,
        status: 'complete',
      })
      setDirty(false)
      onSaved?.(updated as StaAssessment)
      onClose()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Kunde inte spara')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (dirty) {
      const ok = confirm('Du har osparade ändringar. Stänga ändå?')
      if (!ok) return
    }
    onClose()
  }

  const canExportPdf =
    !!enrollment &&
    (assessment.instrument === 'AWP' ||
      assessment.instrument === 'AWC' ||
      assessment.instrument === 'MOHOST' ||
      assessment.instrument === 'DOA')

  const handleDownloadPdf = async () => {
    if (!enrollment) return

    // För DOA: erbjud AI-sammanfattning om sida 4 är tom — annars exporteras en
    // PDF med tomma rutor som AT troligen ville fylla.
    if (assessment.instrument === 'DOA') {
      const ai = scores._ai_summary
      const hasAnySummaryText = !!ai && (
        !!ai.malPlanering ||
        (ai.kategorier ?? []).some((k) => !!k?.resurserBegransningar)
      )
      const hasFallbackSummary = !ai && !!summary
      if (!hasAnySummaryText && !hasFallbackSummary && !generatingSummary) {
        const userChoice = confirm(
          'Sammanfattningen för AF-blankettens sida 4 är tom.\n\n' +
            'Klicka OK för att generera ett utkast med AI nu (du kan redigera innan PDF skapas).\n' +
            'Klicka Avbryt för att exportera ändå med tomma fält.',
        )
        if (userChoice) {
          await handleGenerateDoaSummary()
          // Vänta inte med PDF-export — låt AT redigera utkastet först
          return
        }
        // Fortsätt med tom export
      }
    }

    setPdfError(null)
    setDownloadingPdf(true)
    try {
      const ctx = { assessment, enrollment, consultantName }
      let blob: Blob
      if (assessment.instrument === 'AWP') blob = await fillAwpPdf(ctx)
      else if (assessment.instrument === 'AWC') blob = await fillAwcPdf(ctx)
      else if (assessment.instrument === 'MOHOST') blob = await fillMohostPdf(ctx)
      else if (assessment.instrument === 'DOA') blob = await fillDoaPdf(ctx)
      else throw new Error(`PDF-export ej tillgänglig för ${assessment.instrument}`)
      downloadPdf(blob, suggestPdfFilename(assessment, enrollment))
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'Kunde inte generera PDF')
    } finally {
      setDownloadingPdf(false)
    }
  }

  return (
    <ModalShell onClose={handleClose}>
      <Header
        instrument={instrument}
        mode={mode}
        progress={progress}
        completedItems={completedItems}
        totalItems={totalItems}
        onClose={handleClose}
      />

      <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
        <ScaleExplainer scale={instrument.scale} />

        {hybrid && (
          <Card variant="flat" padding="md" style={{ background: 'var(--c-bg)' }}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-start gap-2 text-sm flex-1 min-w-0">
                <Info size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--c-text)' }} />
                <div>
                  <p className="font-medium text-stone-900 mb-1">
                    {mode === 'deltagare'
                      ? 'Du fyller i personens skattning'
                      : 'Hybridinstrument — både deltagaren och du skattar'}
                  </p>
                  <p className="text-xs text-stone-700">
                    {mode === 'deltagare'
                      ? 'Du skattar nu utifrån deltagarens perspektiv (när deltagaren inte själv kan logga in i Jobin). Växla tillbaka för att skriva din egen bedömning.'
                      : 'Deltagarens skattning visas som referens. Växla till "Personens skattning" om du behöver fylla i den å deltagarens vägnar.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setMode('at')}
                  className={cn(
                    'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                    mode === 'at'
                      ? 'text-white shadow-sm'
                      : 'bg-white text-stone-700 hover:bg-stone-100',
                  )}
                  style={mode === 'at' ? { background: 'var(--c-solid)' } : undefined}
                  aria-pressed={mode === 'at'}
                >
                  AT-bedömning
                </button>
                <button
                  type="button"
                  onClick={() => setMode('deltagare')}
                  className={cn(
                    'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                    mode === 'deltagare'
                      ? 'text-white shadow-sm'
                      : 'bg-white text-stone-700 hover:bg-stone-100',
                  )}
                  style={mode === 'deltagare' ? { background: 'var(--c-solid)' } : undefined}
                  aria-pressed={mode === 'deltagare'}
                >
                  Personens skattning
                </button>
              </div>
            </div>
          </Card>
        )}

        {isMulti && (
          <BedomningTabs
            bedomningar={bedomningar}
            currentIndex={bedomningIndex}
            onSelect={setBedomningIndex}
            onAdd={handleAddBedomning}
            onRemove={handleRemoveBedomning}
            canAdd={bedomningar.length < MAX_BEDOMNINGAR}
          />
        )}

        {isMulti && currentBedomning && (
          <BedomningMetaForm
            bedomning={currentBedomning}
            onChange={handleBedomningMetaChange}
          />
        )}

        {instrument.categories.map((category, catIndex) => (
          <CategorySection
            key={`${currentBedomningId}-${catIndex}`}
            category={category}
            catIndex={catIndex}
            bedomningId={currentBedomningId}
            instrument={instrument}
            scores={scores}
            mode={mode}
            hybrid={hybrid}
            onItemValue={handleItemValue}
            onItemComment={handleItemComment}
          />
        ))}

        {/* DOA: Sammanfattning till AF-blankettens sida 4 (Mål + 5 kategorier).
            AI-utkast som AT redigerar — landar i Text230-Text235 vid PDF-export. */}
        {instrument.code === 'DOA' && (
          <DoaSummaryEditor
            instrument={instrument}
            aiSummary={scores._ai_summary}
            generating={generatingSummary}
            error={summaryError}
            onGenerate={handleGenerateDoaSummary}
            onChange={handleSummaryFieldChange}
          />
        )}

        <div>
          <label
            htmlFor="assessment-summary"
            className="block text-sm font-medium text-stone-800 mb-1"
          >
            Sammanfattande kommentar
          </label>
          <textarea
            id="assessment-summary"
            value={summary}
            onChange={(e) => handleSummary(e.target.value)}
            rows={4}
            placeholder="Övergripande observationer, mönster, nästa steg…"
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200 resize-y"
          />
          {instrument.code === 'DOA' && (
            <p className="text-[11px] text-stone-500 mt-1">
              Den här texten landar i AF-blankettens sammanfattande kommentar (Text236).
              Strukturen ovan landar på sida 4 i kategori-rutorna.
            </p>
          )}
        </div>

        {saveError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-900 flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
            {saveError}
          </div>
        )}

        {pdfError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-900 flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
            PDF-export misslyckades: {pdfError}
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-between gap-2 bg-stone-50 flex-wrap">
        <div className="text-xs text-stone-600">
          {dirty ? 'Osparade ändringar' : 'Allt sparat'}
        </div>
        <div className="flex gap-2 flex-wrap">
          {canExportPdf && (
            <Button
              variant="secondary"
              leftIcon={<Download size={14} />}
              onClick={handleDownloadPdf}
              disabled={downloadingPdf || dirty}
              title={dirty ? 'Spara först innan PDF kan genereras' : 'Ladda ner AF-blankett'}
            >
              {downloadingPdf ? 'Genererar PDF…' : 'AF-blankett (PDF)'}
            </Button>
          )}
          <Button variant="ghost" onClick={handleClose} disabled={saving}>
            Avbryt
          </Button>
          <Button
            variant="secondary"
            leftIcon={<Save size={14} />}
            onClick={persistDraft}
            disabled={saving || !dirty}
          >
            Spara utkast
          </Button>
          <Button
            variant="primary"
            leftIcon={<CheckCircle size={14} />}
            onClick={persistComplete}
            disabled={saving || completedItems < totalItems}
          >
            Markera klar
          </Button>
        </div>
      </div>
    </ModalShell>
  )
}

// ===========================================================================
// SUB-COMPONENTS
// ===========================================================================

function ModalShell({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/40"
        onClick={onClose}
        aria-label="Stäng"
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

function Header({
  instrument,
  mode,
  progress,
  completedItems,
  totalItems,
  onClose,
}: {
  instrument: InstrumentDefinition
  mode: 'at' | 'deltagare'
  progress: number
  completedItems: number
  totalItems: number
  onClose: () => void
}) {
  return (
    <div
      className="px-6 py-5 border-b border-stone-100 flex items-start justify-between gap-3"
      style={{ background: 'var(--c-bg)' }}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-stone-500 font-medium">
          {mode === 'deltagare' ? 'Personens skattning' : 'Bedömning'} · v{instrument.version}
        </div>
        <h2 className="text-xl font-semibold text-stone-900">
          {instrument.title} ({instrument.code})
        </h2>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-xs text-stone-700">
            {completedItems} / {totalItems} ifyllda
          </span>
          <div className="h-1.5 rounded-full overflow-hidden bg-white w-32">
            <div
              className="h-full transition-all"
              style={{ width: `${progress}%`, background: 'var(--c-solid)' }}
            />
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Stäng"
        className="flex-shrink-0 p-1.5 rounded-full hover:bg-white/60 transition-colors"
      >
        <X size={18} className="text-stone-600" />
      </button>
    </div>
  )
}

function ScaleExplainer({ scale }: { scale: InstrumentScale[] }) {
  return (
    <Card variant="flat" padding="md" className="border border-stone-200">
      <div className="text-xs uppercase tracking-wide text-stone-500 font-medium mb-2">
        Skala
      </div>
      <ul className="text-xs text-stone-700 grid grid-cols-2 sm:grid-cols-3 gap-y-1 gap-x-3">
        {scale.map((s) => (
          <li key={String(s.value)} className="flex items-start gap-1.5">
            <span
              className="inline-flex items-center justify-center min-w-[20px] h-5 rounded text-[11px] font-semibold text-white px-1 flex-shrink-0"
              style={{ background: 'var(--c-solid)' }}
            >
              {s.shortLabel}
            </span>
            <span>{s.description || s.shortLabel}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function DoaSummaryEditor({
  instrument,
  aiSummary,
  generating,
  error,
  onGenerate,
  onChange,
}: {
  instrument: InstrumentDefinition
  aiSummary?: DoaSummaryStored
  generating: boolean
  error: string | null
  onGenerate: () => void
  onChange: (field: 'malPlanering' | 'kategori', catIdx: number | null, value: string) => void
}) {
  const malValue = aiSummary?.malPlanering ?? ''
  const generatedAt = aiSummary?.generatedAt
  const generatedLabel = generatedAt
    ? new Date(generatedAt).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' })
    : null
  const hasAnyText = !!aiSummary && (
    !!aiSummary.malPlanering ||
    (aiSummary.kategorier ?? []).some((k) => !!k?.resurserBegransningar)
  )

  return (
    <section className="space-y-3 p-4 rounded-xl border-2 border-dashed border-stone-200" style={{ background: 'var(--header-bg)' }}>
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-stone-500 font-medium">
            Till AF-blankett · sida 4
          </div>
          <h3 className="text-sm font-semibold text-stone-900 mt-0.5 flex items-center gap-2">
            <Sparkles size={14} style={{ color: 'var(--c-solid)' }} />
            Sammanfattning per kategori
          </h3>
          <p className="text-xs text-stone-700 mt-1 max-w-xl">
            Det här hamnar i de stora textrutorna på blankettens sista sida — en mål-och-planering-ruta
            och en kort sammanfattning per kategori. Du kan generera ett utkast med AI och redigera fritt.
          </p>
          {generatedLabel && (
            <div className="text-[11px] text-stone-500 mt-1" data-ai-generated="true" role="note">
              AI-utkast genererat {generatedLabel}
              {aiSummary?.editedByAt ? ' · redigerat av dig' : ''}
            </div>
          )}
        </div>
        <Button
          variant={hasAnyText ? 'secondary' : 'primary'}
          size="sm"
          leftIcon={generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          onClick={onGenerate}
          disabled={generating}
        >
          {generating
            ? 'Genererar…'
            : hasAnyText
              ? 'Regenerera utkast med AI'
              : 'Föreslå med AI'}
        </Button>
      </header>

      {error && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
          <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div>
        <label htmlFor="doa-summary-mal" className="block text-xs font-medium text-stone-700 mb-1">
          Mål och planering
        </label>
        <textarea
          id="doa-summary-mal"
          value={malValue}
          onChange={(e) => onChange('malPlanering', null, e.target.value)}
          data-ai-generated={generatedLabel ? 'true' : undefined}
          rows={4}
          placeholder="2-4 meningar om vart deltagaren är på väg och vad nästa steg är. Lämna tom om AT skriver direkt på blanketten."
          className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200 resize-y bg-white"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {instrument.categories.map((cat, catIdx) => {
          const catValue =
            (aiSummary?.kategorier ?? [])[catIdx]?.resurserBegransningar ?? ''
          return (
            <div key={cat.title}>
              <label
                htmlFor={`doa-summary-cat-${catIdx}`}
                className="block text-xs font-medium text-stone-700 mb-1"
              >
                <span className="text-stone-500 font-normal">Kategori {catIdx + 1}: </span>
                {cat.title}
              </label>
              <textarea
                id={`doa-summary-cat-${catIdx}`}
                value={catValue}
                onChange={(e) => onChange('kategori', catIdx, e.target.value)}
                data-ai-generated={generatedLabel ? 'true' : undefined}
                rows={4}
                placeholder="Resurser och begränsningar som syns i skattningen…"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-stone-200 resize-y bg-white"
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}

function CategorySection({
  category,
  catIndex,
  bedomningId,
  instrument,
  scores,
  mode,
  hybrid,
  onItemValue,
  onItemComment,
}: {
  category: { title: string; items: string[] }
  catIndex: number
  bedomningId: string
  instrument: InstrumentDefinition
  scores: ScoresJsonb
  mode: 'at' | 'deltagare'
  hybrid: boolean
  onItemValue: (catIdx: number, itemIdx: number, value: ItemValue) => void
  onItemComment: (catIdx: number, itemIdx: number, comment: string) => void
}) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-stone-900 mb-3">
        {category.title}
      </h3>
      <ul className="space-y-3">
        {category.items.map((label, itemIndex) => {
          const key = itemKey(bedomningId, catIndex, itemIndex)
          const entry = (scores[key] as ItemEntry | undefined) ?? {}
          return (
            <ItemRow
              key={key}
              itemKey={key}
              label={label}
              instrument={instrument}
              entry={entry}
              mode={mode}
              hybrid={hybrid}
              onValue={(v) => onItemValue(catIndex, itemIndex, v)}
              onComment={(c) => onItemComment(catIndex, itemIndex, c)}
            />
          )
        })}
      </ul>
    </section>
  )
}

function BedomningTabs({
  bedomningar,
  currentIndex,
  onSelect,
  onAdd,
  onRemove,
  canAdd,
}: {
  bedomningar: BedomningMeta[]
  currentIndex: number
  onSelect: (i: number) => void
  onAdd: () => void
  onRemove: (i: number) => void
  canAdd: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 pb-1 border-b border-stone-100">
      {bedomningar.map((b, i) => {
        const isActive = i === currentIndex
        return (
          <button
            key={b.id}
            type="button"
            onClick={() => onSelect(i)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              isActive
                ? 'text-white border-transparent shadow-sm'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50',
            )}
            style={isActive ? { background: 'var(--c-solid)' } : undefined}
            aria-pressed={isActive}
          >
            Bedömning {i + 1}
            {b.arbetsuppgift && <span className="ml-1 opacity-75">— {b.arbetsuppgift}</span>}
          </button>
        )
      })}
      {bedomningar.length > 1 && (
        <button
          type="button"
          onClick={() => onRemove(currentIndex)}
          className="px-2 py-1.5 rounded-lg text-xs text-stone-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
          title={`Ta bort Bedömning ${currentIndex + 1}`}
        >
          ✕
        </button>
      )}
      {canAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
        >
          + Lägg till bedömning
        </button>
      )}
    </div>
  )
}

function BedomningMetaForm({
  bedomning,
  onChange,
}: {
  bedomning: BedomningMeta
  onChange: (field: 'datum' | 'arbetsuppgift', value: string) => void
}) {
  return (
    <Card variant="flat" padding="md" className="border border-stone-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor={`bed-datum-${bedomning.id}`} className="block text-xs uppercase tracking-wide text-stone-500 font-medium mb-1">
            Datum för bedömningen
          </label>
          <input
            id={`bed-datum-${bedomning.id}`}
            type="date"
            value={bedomning.datum ?? ''}
            onChange={(e) => onChange('datum', e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200"
          />
        </div>
        <div>
          <label htmlFor={`bed-arbete-${bedomning.id}`} className="block text-xs uppercase tracking-wide text-stone-500 font-medium mb-1">
            Arbetsuppgift / situation
          </label>
          <input
            id={`bed-arbete-${bedomning.id}`}
            type="text"
            value={bedomning.arbetsuppgift ?? ''}
            onChange={(e) => onChange('arbetsuppgift', e.target.value)}
            placeholder="t.ex. Lager, Kundmottagning"
            className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200"
          />
        </div>
      </div>
    </Card>
  )
}

function ItemRow({
  itemKey: _itemKey,
  label,
  instrument,
  entry,
  mode,
  hybrid,
  onValue,
  onComment,
}: {
  itemKey: string
  label: string
  instrument: InstrumentDefinition
  entry: HybridItemEntry | SingleItemEntry
  mode: 'at' | 'deltagare'
  hybrid: boolean
  onValue: (v: ItemValue) => void
  onComment: (c: string) => void
}) {
  const personValue = hybrid ? (entry as HybridItemEntry).person : undefined
  const bedomareValue = hybrid ? (entry as HybridItemEntry).bedomare : undefined
  const singleValue = !hybrid ? (entry as SingleItemEntry).value : undefined
  const comment = (entry as { comment?: string }).comment ?? ''

  const activeValue = !hybrid
    ? singleValue
    : mode === 'deltagare'
      ? personValue
      : bedomareValue

  return (
    <li className="rounded-lg border border-stone-200 p-3">
      <div className="flex items-start gap-3 flex-wrap mb-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm text-stone-900">{label}</div>
        </div>
      </div>

      {/* Skala-knappar */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {instrument.scale.map((s) => {
          const selected = String(activeValue) === String(s.value)
          return (
            <button
              key={String(s.value)}
              type="button"
              onClick={() => onValue(selected ? null : s.value)}
              aria-pressed={selected}
              className={cn(
                'inline-flex items-center justify-center min-w-[36px] h-8 rounded-lg px-2 text-xs font-semibold transition-all',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--c-solid)]',
                selected
                  ? 'text-white shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200',
              )}
              style={selected ? { background: 'var(--c-solid)' } : undefined}
              title={s.description || s.shortLabel}
            >
              {s.shortLabel}
            </button>
          )
        })}
      </div>

      {/* Hybrid: visa "andra partens" skattning som info */}
      {hybrid && (
        <div className="text-[11px] text-stone-500 mb-2">
          {mode === 'at' && (
            <>Deltagarens skattning: <strong>{personValue ?? '—'}</strong></>
          )}
          {mode === 'deltagare' && bedomareValue !== undefined && (
            <>Arbetsterapeutens skattning: <strong>{bedomareValue}</strong></>
          )}
        </div>
      )}

      {/* Kommentar */}
      <textarea
        value={comment}
        onChange={(e) => onComment(e.target.value)}
        rows={1}
        placeholder="Kommentar (valfri)"
        className="w-full px-2 py-1.5 rounded border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-stone-200 resize-y"
        aria-label={`Kommentar för ${label}`}
      />
    </li>
  )
}
