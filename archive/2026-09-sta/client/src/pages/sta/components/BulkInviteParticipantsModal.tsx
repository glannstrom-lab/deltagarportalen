import { useMemo, useState } from 'react'
import { X, Mail, Users, Send, AlertTriangle, CheckCircle, Info } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'
import { staEnrollmentsApi } from '@/services/staApi'
import { cn } from '@/lib/utils'
import { STA_CONSENT_TEXT, STA_CONSENT_SCOPE } from './staConsentText'

interface ParsedRow {
  email: string
  firstName?: string
  lastName?: string
  raw: string
  error?: string
}

interface BulkInviteParticipantsModalProps {
  onClose: () => void
  onCreated: (createdCount: number) => void
}

// Parsar en rad på formen "email" eller "email, För- och Efternamn"
function parseRow(raw: string): ParsedRow {
  const trimmed = raw.trim()
  if (!trimmed) return { email: '', raw }
  const [emailPart, ...nameParts] = trimmed.split(',').map((s) => s.trim())
  const email = emailPart.toLowerCase()
  const nameRest = nameParts.join(' ').trim()
  let firstName: string | undefined
  let lastName: string | undefined
  if (nameRest) {
    const tokens = nameRest.split(/\s+/)
    firstName = tokens[0]
    lastName = tokens.slice(1).join(' ') || undefined
  }
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  return {
    email,
    firstName,
    lastName,
    raw,
    error: emailValid ? undefined : 'Ogiltig e-postadress',
  }
}

export function BulkInviteParticipantsModal({ onClose, onCreated }: BulkInviteParticipantsModalProps) {
  const [text, setText] = useState('')
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<Array<{
    email: string
    status: 'created' | 'error' | 'email_failed'
    error: string | null
  }> | null>(null)

  const rows = useMemo(() => {
    return text
      .split('\n')
      .map((line) => parseRow(line))
      .filter((r) => r.raw.trim().length > 0)
  }, [text])

  // Hittar duplicerade e-postadresser inom batchen
  const duplicates = useMemo(() => {
    const seen = new Map<string, number>()
    rows.forEach((r) => {
      if (!r.email || r.error) return
      seen.set(r.email, (seen.get(r.email) ?? 0) + 1)
    })
    return new Set([...seen.entries()].filter(([, count]) => count > 1).map(([email]) => email))
  }, [rows])

  const validRows = rows.filter((r) => !r.error && !duplicates.has(r.email))
  const errorRows = rows.filter((r) => r.error)
  const canSubmit = validRows.length > 0 && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      // 1. Skapa invitations + förskapade sta_enrollments via RPC
      const rpcResult = await staEnrollmentsApi.bulkInvite({
        invites: validRows.map((r) => ({
          email: r.email,
          first_name: r.firstName,
          last_name: r.lastName,
        })),
        startedAt,
        consentText: STA_CONSENT_TEXT,
        consentScope: STA_CONSENT_SCOPE,
      })

      // 2. Skicka mail för de som skapades framgångsrikt
      const invitationIds = rpcResult
        .filter((r) => r.status === 'created' && r.invitation_id)
        .map((r) => r.invitation_id!) as string[]

      const emailResults = new Map<string, { success: boolean; error?: string }>()
      if (invitationIds.length > 0) {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
          const resp = await fetch(`${supabaseUrl}/functions/v1/send-invite-email`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session?.access_token ?? ''}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ invitationIds }),
          })
          if (resp.ok) {
            const body = await resp.json()
            if (Array.isArray(body.results)) {
              body.results.forEach((r: { invitationId: string; success: boolean; error?: string }) => {
                emailResults.set(r.invitationId, { success: r.success, error: r.error })
              })
            }
          }
        } catch (err) {
          console.warn('Bulk email send failed:', err instanceof Error ? err.message : err)
        }
      }

      // 3. Slå ihop till visningsbart resultat
      const merged = rpcResult.map((r) => {
        if (r.status === 'error') {
          return { email: r.email, status: 'error' as const, error: r.error }
        }
        const emailResult = r.invitation_id ? emailResults.get(r.invitation_id) : null
        if (emailResult && !emailResult.success) {
          return {
            email: r.email,
            status: 'email_failed' as const,
            error: emailResult.error ?? 'Mail-utskick misslyckades',
          }
        }
        return { email: r.email, status: 'created' as const, error: null }
      })

      setResults(merged)
      const createdCount = merged.filter((m) => m.status === 'created').length
      if (createdCount > 0) {
        onCreated(createdCount)
      }
    } catch (err) {
      console.error('Bulk-invite error:', err)
      setResults([
        {
          email: '(generellt fel)',
          status: 'error',
          error: err instanceof Error ? err.message : 'Okänt fel',
        },
      ])
    } finally {
      setSubmitting(false)
    }
  }

  // Resultatvy efter inskick
  if (results) {
    const ok = results.filter((r) => r.status === 'created').length
    const emailFailed = results.filter((r) => r.status === 'email_failed').length
    const failed = results.filter((r) => r.status === 'error').length

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <button type="button" className="absolute inset-0 bg-stone-900/40" onClick={onClose} aria-label="Stäng" />
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden" data-domain="action">
          <div className="px-6 py-5 border-b border-stone-100 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-stone-900 flex items-center gap-2">
                <CheckCircle size={20} className="text-emerald-600" />
                Inbjudningar skickade
              </h2>
              <p className="text-sm text-stone-600 mt-1">
                {ok} av {results.length} inbjudningar skapades och e-post skickades.
                {emailFailed > 0 && ` ${emailFailed} skapades men mailet kunde inte skickas.`}
                {failed > 0 && ` ${failed} kunde inte skapas.`}
              </p>
            </div>
            <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-stone-100" aria-label="Stäng">
              <X size={18} className="text-stone-500" />
            </button>
          </div>

          <div className="px-6 py-5 max-h-[400px] overflow-y-auto">
            <ul className="space-y-1.5">
              {results.map((r, i) => (
                <li
                  key={`${r.email}-${i}`}
                  className={cn(
                    'flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm',
                    r.status === 'created' && 'bg-emerald-50 text-emerald-900',
                    r.status === 'email_failed' && 'bg-amber-50 text-amber-900',
                    r.status === 'error' && 'bg-rose-50 text-rose-900',
                  )}
                >
                  <span className="font-mono text-xs">{r.email}</span>
                  <span className="text-xs">
                    {r.status === 'created' && '✓ Inbjuden'}
                    {r.status === 'email_failed' && `Skapad, men mail misslyckades — kopiera länk manuellt`}
                    {r.status === 'error' && `Fel: ${r.error}`}
                  </span>
                </li>
              ))}
            </ul>
            {emailFailed > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                <div>
                  Vissa mail kunde inte skickas. Inbjudningarna finns i systemet —
                  öppna invitations-tabellen och kopiera länken manuellt, eller
                  skicka via en annan kanal.
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-end gap-2 bg-stone-50">
            <Button variant="primary" onClick={onClose}>
              Klar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-stone-900/40" onClick={onClose} aria-label="Stäng" />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" data-domain="action">
        <div className="px-6 py-5 border-b border-stone-100 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-stone-900 flex items-center gap-2">
              <Users size={20} />
              Bjud in flera deltagare till Steg till arbete
            </h2>
            <p className="text-sm text-stone-600 mt-1">
              Klistra in en e-postadress per rad. Steg till arbete aktiveras direkt
              när deltagaren registrerar sig och godkänner samtycket.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-stone-100" aria-label="Stäng">
            <X size={18} className="text-stone-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          <Card variant="flat" padding="md" style={{ background: 'var(--c-bg)' }}>
            <div className="flex items-start gap-2 text-sm text-stone-800">
              <Info size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--c-text)' }} />
              <div>
                <p className="font-medium mb-1">Så fungerar det:</p>
                <ul className="text-xs space-y-0.5 list-disc list-inside text-stone-700">
                  <li>Varje rad blir en deltagare med Steg till arbete redan aktiverat</li>
                  <li>Deltagaren får en mail-länk och måste godkänna samtycke vid registrering</li>
                  <li>Befintliga Jobin-användare hittas <em>inte</em> automatiskt — använd "Lägg till deltagare" för dem</li>
                </ul>
              </div>
            </div>
          </Card>

          <div>
            <label htmlFor="bulk-invite-emails" className="block text-sm font-medium text-stone-700 mb-1">
              E-postadresser (en per rad)
            </label>
            <textarea
              id="bulk-invite-emails"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder={'anna.k@exempel.se, Anna Karlsson\nbjorn.s@exempel.se, Björn Svensson\nkristin.l@exempel.se\nlars.j@exempel.se'}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-stone-200 resize-y"
            />
            <p className="text-xs text-stone-500 mt-1">
              Format: <code>email, För- och efternamn</code>. Namn är valfritt.
              Tomma rader ignoreras.
            </p>
          </div>

          <div>
            <label htmlFor="bulk-invite-start-date" className="block text-sm font-medium text-stone-700 mb-1">
              Startdatum för alla
            </label>
            <input
              id="bulk-invite-start-date"
              type="date"
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
              className="px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200"
            />
            <p className="text-xs text-stone-500 mt-1">
              Deltagaren kan justera sitt eget startdatum efter registrering.
            </p>
          </div>

          {rows.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-wide text-stone-500 font-medium mb-2">
                Förhandsvisning ({validRows.length} giltiga · {errorRows.length} fel · {duplicates.size} dubbletter)
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto rounded-lg border border-stone-200 p-2 bg-stone-50">
                {rows.map((r, i) => {
                  const isDuplicate = !r.error && duplicates.has(r.email)
                  const isOk = !r.error && !isDuplicate
                  return (
                    <div
                      key={`${r.raw}-${i}`}
                      className={cn(
                        'text-xs px-2 py-1 rounded flex items-center justify-between gap-2',
                        isOk && 'text-stone-700',
                        r.error && 'text-rose-700 bg-rose-50',
                        isDuplicate && 'text-amber-700 bg-amber-50',
                      )}
                    >
                      <span className="font-mono truncate">{r.email || '(tom rad)'}</span>
                      <span className="flex items-center gap-1 text-[10px] flex-shrink-0">
                        {r.firstName && (
                          <span className="text-stone-500">→ {[r.firstName, r.lastName].filter(Boolean).join(' ')}</span>
                        )}
                        {r.error && <span>⚠ {r.error}</span>}
                        {isDuplicate && <span>⚠ Dubblett</span>}
                        {isOk && <span className="text-emerald-600">✓</span>}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <details className="text-xs">
            <summary className="cursor-pointer text-stone-700 font-medium">
              Vad samtycker deltagaren till vid registrering?
            </summary>
            <div className="mt-2 p-3 rounded-lg bg-stone-50 text-stone-700 whitespace-pre-line">
              {STA_CONSENT_TEXT}
            </div>
          </details>
        </div>

        <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-between gap-2 bg-stone-50 flex-shrink-0">
          <div className="text-xs text-stone-500 flex items-center gap-1">
            <Mail size={12} />
            {validRows.length} {validRows.length === 1 ? 'inbjudan' : 'inbjudningar'} skickas
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={submitting}>
              Avbryt
            </Button>
            <Button
              variant="primary"
              leftIcon={<Send size={14} />}
              onClick={handleSubmit}
              isLoading={submitting}
              disabled={!canSubmit}
            >
              Skicka {validRows.length > 0 ? validRows.length : ''} inbjudningar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
