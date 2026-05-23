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

import { useEffect, useMemo, useState } from 'react'
import { X, Save, Info, CheckCircle, AlertTriangle, Download } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { staAssessmentsApi, type StaAssessment, type StaEnrollment } from '@/services/staApi'
import {
  getInstrument,
  type InstrumentDefinition,
  type InstrumentScale,
} from '../assessmentInstruments'
import {
  fillAwpPdf,
  fillAwcPdf,
  fillMohostPdf,
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

type Scores = Record<string, HybridItemEntry | SingleItemEntry>

function isHybridInstrument(instrument: InstrumentDefinition): boolean {
  return instrument.hasSelfRating
}

function itemKey(catIndex: number, itemIndex: number): string {
  return `c${catIndex}_i${itemIndex}`
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

  const [mode, setMode] = useState<'at' | 'deltagare'>(initialMode)
  const [scores, setScores] = useState<Scores>(() => (assessment.scores as Scores) ?? {})
  const [summary, setSummary] = useState(assessment.summary ?? '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)

  // Reset state om assessment ändras
  useEffect(() => {
    setScores((assessment.scores as Scores) ?? {})
    setSummary(assessment.summary ?? '')
    setDirty(false)
  }, [assessment.id])

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
  const completedItems = useMemo(() => {
    let n = 0
    for (const key of Object.keys(scores)) {
      const entry = scores[key]
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
  }, [scores, hybrid, mode])
  const progress = Math.round((completedItems / totalItems) * 100)

  const handleItemValue = (key: string, value: ItemValue) => {
    setScores((prev) => {
      const entry = prev[key] ?? {}
      const updated: HybridItemEntry | SingleItemEntry = hybrid
        ? {
            ...(entry as HybridItemEntry),
            [mode === 'deltagare' ? 'person' : 'bedomare']: value,
          }
        : { ...(entry as SingleItemEntry), value }
      return { ...prev, [key]: updated }
    })
    setDirty(true)
  }

  const handleItemComment = (key: string, comment: string) => {
    setScores((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? {}), comment },
    }))
    setDirty(true)
  }

  const handleSummary = (text: string) => {
    setSummary(text)
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
      assessment.instrument === 'MOHOST')

  const handleDownloadPdf = async () => {
    if (!enrollment) return
    setPdfError(null)
    setDownloadingPdf(true)
    try {
      const ctx = { assessment, enrollment, consultantName }
      let blob: Blob
      if (assessment.instrument === 'AWP') blob = await fillAwpPdf(ctx)
      else if (assessment.instrument === 'AWC') blob = await fillAwcPdf(ctx)
      else if (assessment.instrument === 'MOHOST') blob = await fillMohostPdf(ctx)
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

        {instrument.categories.map((category, catIndex) => (
          <CategorySection
            key={catIndex}
            category={category}
            catIndex={catIndex}
            instrument={instrument}
            scores={scores}
            mode={mode}
            hybrid={hybrid}
            onItemValue={handleItemValue}
            onItemComment={handleItemComment}
          />
        ))}

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

function CategorySection({
  category,
  catIndex,
  instrument,
  scores,
  mode,
  hybrid,
  onItemValue,
  onItemComment,
}: {
  category: { title: string; items: string[] }
  catIndex: number
  instrument: InstrumentDefinition
  scores: Scores
  mode: 'at' | 'deltagare'
  hybrid: boolean
  onItemValue: (key: string, value: ItemValue) => void
  onItemComment: (key: string, comment: string) => void
}) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-stone-900 mb-3">
        {category.title}
      </h3>
      <ul className="space-y-3">
        {category.items.map((label, itemIndex) => {
          const key = itemKey(catIndex, itemIndex)
          const entry = scores[key] ?? {}
          return (
            <ItemRow
              key={key}
              itemKey={key}
              label={label}
              instrument={instrument}
              entry={entry}
              mode={mode}
              hybrid={hybrid}
              onValue={(v) => onItemValue(key, v)}
              onComment={(c) => onItemComment(key, c)}
            />
          )
        })}
      </ul>
    </section>
  )
}

function ItemRow({
  itemKey,
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
