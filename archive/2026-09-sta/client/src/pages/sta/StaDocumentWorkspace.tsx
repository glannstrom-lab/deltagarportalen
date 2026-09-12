/**
 * StaDocumentWorkspace — konsulentens "skapa rapport"-vy
 *
 * Route: /konsulent/steg-till-arbete/dokument/:enrollmentId/:docType
 *
 * Här klickar konsulenten på "Generera AI-utkast", redigerar, sparar och
 * laddar ner PDF. Det är arbetsplatsen för rapport-skapande.
 */

import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { PageLayout } from '@/components/layout/index'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ChevronLeft, AlertTriangle } from '@/components/ui/icons'
import { useAuthStore } from '@/stores/authStore'
import { staEnrollmentsApi, type DocumentType, type StaEnrollment } from '@/services/staApi'
import { resolveParticipantName, deriveCurrentPart } from './enrollmentDisplay'
import { DOC_TYPE_META } from '@/services/staAiApi'
import { DocumentDraftPanel } from './components/DocumentDraftPanel'

const VALID_DOC_TYPES = new Set([
  'initial_planering',
  'delredovisning_1',
  'delredovisning_2',
  'delredovisning_3',
  'delredovisning_4',
  'anmalan_arbetsprovning',
  'information_arbetsprovning',
  'atgardsplan_utebliven_ap',
  'informativ_rapport_hjalpmedel',
])

export default function StaDocumentWorkspace() {
  const { enrollmentId, docType } = useParams<{ enrollmentId: string; docType: string }>()
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const [enrollment, setEnrollment] = useState<StaEnrollment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isValidDocType = docType && VALID_DOC_TYPES.has(docType)
  const typedDocType = isValidDocType ? (docType as DocumentType) : null

  useEffect(() => {
    if (!enrollmentId) return
    let cancelled = false
    setLoading(true)
    staEnrollmentsApi
      .get(enrollmentId)
      .then((e) => {
        if (!cancelled) setEnrollment(e)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Kunde inte hämta deltagare')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [enrollmentId])

  if (!typedDocType) {
    return (
      <PageLayout title="Dokument" domain="action" showTabs={false} showHeader={false}>
        <Card variant="flat" padding="lg">
          <div className="flex items-center gap-2 text-rose-700">
            <AlertTriangle size={18} />
            Ogiltigt dokument-typ: {docType}
          </div>
        </Card>
      </PageLayout>
    )
  }

  const meta = DOC_TYPE_META[typedDocType]
  const consultantName =
    profile?.first_name || profile?.last_name
      ? [profile.first_name, profile.last_name].filter(Boolean).join(' ')
      : undefined

  return (
    <PageLayout title={meta.title} domain="action" showTabs={false} showHeader={false}>
      <div className="space-y-4">
        {/* Back-link + breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900 hover:underline"
          >
            <ChevronLeft size={14} />
            Tillbaka
          </button>
          <span className="text-stone-400">/</span>
          <span className="text-stone-600">Steg till arbete</span>
          <span className="text-stone-400">/</span>
          <span className="text-stone-600">Dokument</span>
          <span className="text-stone-400">/</span>
          <span className="text-stone-900 font-medium">{meta.title}</span>
        </div>

        {loading && (
          <Card variant="flat" padding="lg">
            <p className="text-sm text-stone-600">Laddar deltagardata…</p>
          </Card>
        )}

        {error && (
          <Card variant="flat" padding="lg">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertTriangle size={18} />
              {error}
            </div>
          </Card>
        )}

        {!loading && !error && enrollment && enrollmentId && (
          <>
            <Card variant="flat" padding="md" className="bg-stone-50">
              <div className="text-xs uppercase tracking-wide font-medium text-stone-500">
                Deltagare
              </div>
              <div className="font-semibold text-stone-900 mt-0.5">
                {resolveParticipantName(enrollment)}
              </div>
              <div className="text-xs text-stone-600">
                Del {deriveCurrentPart(enrollment)} · Fokusyrke: {enrollment.focus_occupation ?? 'ej fastställt'}
              </div>
            </Card>

            <DocumentDraftPanel
              enrollmentId={enrollmentId}
              docType={typedDocType}
              consultantName={consultantName}
            />
          </>
        )}

        {!loading && !error && !enrollment && (
          <Card variant="flat" padding="lg">
            <p className="text-sm text-stone-600">
              Ingen enrollment med ID <code>{enrollmentId}</code> hittades.
            </p>
            <Button variant="secondary" className="mt-3" onClick={() => navigate('/konsulent/steg-till-arbete')}>
              Tillbaka till deltagarlistan
            </Button>
          </Card>
        )}
      </div>
    </PageLayout>
  )
}
