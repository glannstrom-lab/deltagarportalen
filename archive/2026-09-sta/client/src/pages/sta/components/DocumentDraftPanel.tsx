/**
 * DocumentDraftPanel — konsulentens rapport-arbetsyta
 *
 * Klick på "Generera utkast" → AI skapar sektioner → konsulent redigerar →
 * "Ladda ner PDF" → fil i webbläsaren.
 */

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  Bot,
  Save,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  Undo,
  FileCheck,
} from '@/components/ui/icons'
import { VoiceInput } from './VoiceInput'
import { generateDocumentDraft, type DocumentDraftSections, DOC_TYPE_META } from '@/services/staAiApi'
import { downloadStaDocumentPdf } from '@/services/staPdfExport'
import { staDocumentsApi, type DocumentType, type StaDocument, type DocumentStatus, type StaPart } from '@/services/staApi'
import { useAuthStore } from '@/stores/authStore'

/** Samma statusetiketter/toner som konsulentens dokumentlista (StaConsultant.tsx). */
function statusMeta(status: DocumentStatus): { label: string; tone: 'stone' | 'amber' | 'emerald' | 'sky' } {
  switch (status) {
    case 'draft':
      return { label: 'Utkast', tone: 'stone' }
    case 'consultant_review':
      return { label: 'Pågående granskning', tone: 'amber' }
    case 'approved':
      return { label: 'Godkänd', tone: 'emerald' }
    case 'submitted':
      return { label: 'Inskickad till AF', tone: 'sky' }
    default:
      return { label: status, tone: 'stone' }
  }
}

const STATUS_TONE_CLASS: Record<'stone' | 'amber' | 'emerald' | 'sky', string> = {
  stone: 'bg-stone-100 text-stone-700',
  amber: 'bg-amber-50 text-amber-800',
  emerald: 'bg-emerald-50 text-emerald-700',
  sky: 'bg-sky-50 text-sky-800',
}

function StatusBadge({ status }: { status: DocumentStatus }) {
  const { label, tone } = statusMeta(status)
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_TONE_CLASS[tone]}`}
    >
      {label}
    </span>
  )
}

interface DocumentDraftPanelProps {
  enrollmentId: string
  docType: DocumentType
  consultantName?: string
  organizationName?: string
}

export function DocumentDraftPanel({
  enrollmentId,
  docType,
  consultantName,
  organizationName,
}: DocumentDraftPanelProps) {
  const meta = DOC_TYPE_META[docType]
  const { user } = useAuthStore()
  const { confirm } = useConfirmDialog()
  const [document, setDocument] = useState<StaDocument | null>(null)
  const [sections, setSections] = useState<DocumentDraftSections>({})
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [statusUpdating, setStatusUpdating] = useState(false)

  // Ladda existerande dokument
  useEffect(() => {
    let cancelled = false
    staDocumentsApi
      .getOrCreate(enrollmentId, docType, meta.part)
      .then((doc) => {
        if (cancelled) return
        setDocument(doc)
        if (doc.content_json && typeof doc.content_json === 'object') {
          const stored = (doc.content_json as { sections?: DocumentDraftSections }).sections
          if (stored) setSections(stored)
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Kunde inte ladda dokument'))
    return () => {
      cancelled = true
    }
  }, [enrollmentId, docType, meta.part])

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    try {
      const result = await generateDocumentDraft(enrollmentId, docType)
      if (result) {
        setSections(result)
        // Auto-spara utkastet
        if (document) {
          const updated = await staDocumentsApi.update(document.id, {
            content_json: { sections: result },
            ai_drafted: true,
            ai_model: 'openai/gpt-oss-120b',
          })
          setDocument(updated)
        }
      } else {
        setError('Inget utkast genererades — ingen data hittades.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte generera utkast')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!document) return
    setSaving(true)
    try {
      const updated = await staDocumentsApi.update(document.id, {
        content_json: { sections },
      })
      setDocument(updated)
      setSavedAt(new Date())
      setTimeout(() => setSavedAt(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte spara')
    } finally {
      setSaving(false)
    }
  }

  // Konsekvenscheck: sektioner utan innehåll — blockerar inte, varnar bara
  const emptySectionTitles = Object.values(sections)
    .filter((section) => !section.content || section.content.trim().length === 0)
    .map((section) => section.title)

  const confirmDespiteEmptySections = async (actionLabel: string): Promise<boolean> => {
    if (emptySectionTitles.length === 0) return true
    const count = emptySectionTitles.length
    return confirm({
      title: count === 1 ? 'En sektion är tom' : `${count} sektioner är tomma`,
      message: `${emptySectionTitles.join(', ')}. Vill du ${actionLabel} ändå, eller fylla i mer först?`,
      confirmText: `Ja, ${actionLabel}`,
      cancelText: 'Fyll i mer först',
      variant: 'warning',
    })
  }

  const handleDownload = async () => {
    const proceed = await confirmDespiteEmptySections('ladda ner PDF:en')
    if (!proceed) return
    setDownloading(true)
    setError(null)
    try {
      await downloadStaDocumentPdf({
        enrollmentId,
        docType,
        draft: sections,
        consultantName,
        organizationName,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte ladda ner')
    } finally {
      setDownloading(false)
    }
  }

  const handleSendForReview = async () => {
    if (!document) return
    const proceed = await confirmDespiteEmptySections('skicka till granskning')
    if (!proceed) return
    setStatusUpdating(true)
    setError(null)
    try {
      const updated = await staDocumentsApi.submitForReview(document.id)
      setDocument(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte skicka till granskning')
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleRevertToDraft = async () => {
    if (!document) return
    setStatusUpdating(true)
    setError(null)
    try {
      const updated = await staDocumentsApi.revertToDraft(document.id)
      setDocument(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte gå tillbaka till utkast')
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleApprove = async () => {
    if (!document || !user) return
    setStatusUpdating(true)
    setError(null)
    try {
      const updated = await staDocumentsApi.approve(document.id, user.id)
      setDocument(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte godkänna')
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleMarkSubmitted = async () => {
    if (!document || !user) return
    setStatusUpdating(true)
    setError(null)
    try {
      const updated = await staDocumentsApi.markSubmitted(document.id, user.id)
      setDocument(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte markera som inskickad')
    } finally {
      setStatusUpdating(false)
    }
  }

  const hasContent = Object.keys(sections).length > 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card variant="flat" padding="lg" style={{ background: 'var(--c-bg)' }}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText size={18} style={{ color: 'var(--c-text)' }} />
              <h2 className="text-lg font-semibold text-stone-900">{meta.title}</h2>
              {meta.afBlankett && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white text-stone-700">
                  {meta.afBlankett}
                </span>
              )}
              {document && <StatusBadge status={document.status} />}
            </div>
            <p className="text-sm text-stone-700">
              AI-utkast baseras på all data om deltagaren. Granska alltid innan inskick till AF.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="primary"
              leftIcon={generating ? <RefreshCw size={14} className="animate-spin" /> : <Bot size={14} />}
              onClick={handleGenerate}
              isLoading={generating}
            >
              {hasContent ? 'Regenerera utkast' : 'Generera AI-utkast'}
            </Button>
            <Button
              variant="secondary"
              leftIcon={<FileText size={14} />}
              onClick={handleDownload}
              isLoading={downloading}
              disabled={!hasContent}
            >
              Ladda ner PDF
            </Button>
          </div>
        </div>

        {document && hasContent && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {document.status === 'draft' && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Send size={14} />}
                onClick={handleSendForReview}
                isLoading={statusUpdating}
              >
                Skicka till granskning
              </Button>
            )}
            {document.status === 'consultant_review' && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<CheckCircle2 size={14} />}
                  onClick={handleApprove}
                  isLoading={statusUpdating}
                >
                  Godkänn
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Undo size={14} />}
                  onClick={handleRevertToDraft}
                  isLoading={statusUpdating}
                >
                  Tillbaka till utkast
                </Button>
              </>
            )}
            {document.status === 'approved' && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<FileCheck size={14} />}
                onClick={handleMarkSubmitted}
                isLoading={statusUpdating}
              >
                Markera som inskickad till AF
              </Button>
            )}
            {document.status === 'submitted' && (
              <span className="text-xs text-stone-500">
                Inskickad{' '}
                {document.submitted_at
                  ? new Date(document.submitted_at).toLocaleDateString('sv-SE')
                  : ''}{' '}
                — klart för AF:s bekräftelse.
              </span>
            )}
          </div>
        )}

        {document?.ai_drafted && (
          <div className="mt-3 text-[11px] text-stone-600 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
              style={{ background: 'var(--c-solid)' }}
            >
              <Bot size={10} />
              AI-utkast
            </span>
            Modell: {document.ai_model ?? 'okänd'} · Granska och redigera innan inskick.
          </div>
        )}
      </Card>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800 flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {!hasContent && !generating && (
        <Card variant="flat" padding="lg">
          <p className="text-sm text-stone-600">
            Inget utkast än. Klicka <strong>Generera AI-utkast</strong> ovan för att skapa ett första
            förslag baserat på all data om deltagaren — startsamtal, aktiviteter, skattningar,
            snabbanteckningar och pulse-checks.
          </p>
        </Card>
      )}

      {/* Sektioner */}
      {Object.entries(sections).map(([key, section]) => (
        <Card key={key} variant="flat" padding="lg">
          <h3 className="text-base font-semibold text-stone-900 mb-2">{section.title}</h3>
          <VoiceInput
            value={section.content}
            onChange={(content) =>
              setSections((prev) => ({ ...prev, [key]: { ...prev[key], content } }))
            }
            placeholder="Skriv eller tala in revidering..."
            rows={5}
          />
        </Card>
      ))}

      {/* Spara-bar */}
      {hasContent && (
        <div className="flex items-center justify-between gap-2 flex-wrap p-4 rounded-xl bg-white border border-stone-200 sticky bottom-4">
          <div className="text-xs text-stone-500 flex items-center gap-2">
            {savedAt ? (
              <>
                <CheckCircle2 size={12} className="text-emerald-700" />
                Sparat {savedAt.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
              </>
            ) : (
              <>Glöm inte att spara innan du laddar ner PDF</>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSave}
              isLoading={saving}
              leftIcon={<Save size={14} />}
            >
              Spara utkast
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownload}
              isLoading={downloading}
              leftIcon={<FileText size={14} />}
            >
              Ladda ner PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Snabb-knapp för att starta dokument från en deltagar-rad. */
export function DocumentQuickStart({
  enrollmentId,
  docType,
}: {
  enrollmentId: string
  docType: DocumentType
}) {
  const meta = DOC_TYPE_META[docType]
  return (
    <Button
      variant="primary"
      size="sm"
      leftIcon={<FileText size={14} />}
      onClick={() => {
        // Navigation till dokument-arbetsytan — implementeras när vi har route
        // För nu: triggar bara getOrCreate och visar success
        void staDocumentsApi.getOrCreate(enrollmentId, docType, meta.part as StaPart | null)
      }}
    >
      Skapa {meta.title}
    </Button>
  )
}
