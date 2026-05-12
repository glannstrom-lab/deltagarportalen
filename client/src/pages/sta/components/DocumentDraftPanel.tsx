/**
 * DocumentDraftPanel — konsulentens rapport-arbetsyta
 *
 * Klick på "Generera utkast" → AI skapar sektioner → konsulent redigerar →
 * "Ladda ner PDF" → fil i webbläsaren.
 */

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  Bot,
  Save,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { VoiceInput } from './VoiceInput'
import { generateDocumentDraft, type DocumentDraftSections, DOC_TYPE_META } from '@/services/staAiApi'
import { downloadStaDocumentPdf } from '@/services/staPdfExport'
import { staDocumentsApi, type DocumentType, type StaDocument, type StaPart } from '@/services/staApi'

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
  const [document, setDocument] = useState<StaDocument | null>(null)
  const [sections, setSections] = useState<DocumentDraftSections>({})
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)

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

  const handleDownload = async () => {
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
