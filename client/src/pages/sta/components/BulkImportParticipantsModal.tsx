import { useCallback, useMemo, useRef, useState } from 'react'
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  Info,
  Link as LinkIcon,
  Mail,
} from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'
import { staEnrollmentsApi } from '@/services/staApi'
import { cn } from '@/lib/utils'
import { STA_CONSENT_TEXT, STA_CONSENT_SCOPE } from './staConsentText'
import {
  parseCSV,
  parseExcel,
  generateCSVTemplate,
  generateExcelTemplate,
  downloadBlob,
  isCSV,
  isExcel,
  type ParsedRow,
} from './bulkImportParser'

interface BulkImportParticipantsModalProps {
  onClose: () => void
  onCreated: (createdCount: number) => void
}

type ResultRow = {
  email: string
  status: 'linked' | 'invited' | 'email_failed' | 'error'
  error: string | null
}

type Stage = 'upload' | 'preview' | 'submitting' | 'result'

export function BulkImportParticipantsModal({ onClose, onCreated }: BulkImportParticipantsModalProps) {
  const [stage, setStage] = useState<Stage>('upload')
  const [fileName, setFileName] = useState<string>('')
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [globalStartedAt, setGlobalStartedAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [currentPart, setCurrentPart] = useState<1 | 2 | 3 | 4>(1)
  const [parseError, setParseError] = useState<string | null>(null)
  const [results, setResults] = useState<ResultRow[] | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ===========================================================================
  // FILE HANDLING
  // ===========================================================================

  const handleFile = useCallback(async (file: File) => {
    setParseError(null)
    setFileName(file.name)
    try {
      let parsed: ParsedRow[]
      if (isCSV(file)) {
        parsed = await parseCSV(file)
      } else if (isExcel(file)) {
        parsed = await parseExcel(file)
      } else {
        setParseError('Filtypen stöds inte. Använd .csv eller .xlsx.')
        return
      }

      if (parsed.length === 0) {
        setParseError('Filen innehåller inga rader. Använd mallen som utgångspunkt.')
        return
      }

      setRows(parsed)
      setStage('preview')
    } catch (err) {
      setParseError(
        `Kunde inte läsa filen: ${err instanceof Error ? err.message : 'okänt fel'}`,
      )
    }
  }, [])

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
    if (inputRef.current) inputRef.current.value = ''
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  // ===========================================================================
  // TEMPLATES
  // ===========================================================================

  const downloadCSV = () => {
    downloadBlob(generateCSVTemplate(), 'jobin-deltagare-mall.csv')
  }
  const downloadXLSX = async () => {
    const blob = await generateExcelTemplate()
    downloadBlob(blob, 'jobin-deltagare-mall.xlsx')
  }

  // ===========================================================================
  // PREVIEW STATS
  // ===========================================================================

  const stats = useMemo(() => {
    const valid = rows.filter((r) => !r.error)
    const errored = rows.filter((r) => r.error)
    const seen = new Map<string, number>()
    valid.forEach((r) => seen.set(r.email, (seen.get(r.email) ?? 0) + 1))
    const dupes = new Set([...seen.entries()].filter(([, c]) => c > 1).map(([e]) => e))
    return {
      total: rows.length,
      valid: valid.length - dupes.size,
      errored: errored.length,
      duplicates: dupes,
    }
  }, [rows])

  // ===========================================================================
  // SUBMIT
  // ===========================================================================

  const handleSubmit = async () => {
    setStage('submitting')
    try {
      const validRows = rows.filter((r) => !r.error && !stats.duplicates.has(r.email))

      const rpcResult = await staEnrollmentsApi.bulkSmartAdd({
        rows: validRows.map((r) => ({
          email: r.email,
          first_name: r.first_name,
          last_name: r.last_name,
          started_at: r.started_at,
        })),
        defaultStartedAt: globalStartedAt,
        currentPart,
        consentText: STA_CONSENT_TEXT,
        consentScope: STA_CONSENT_SCOPE as unknown as Record<string, unknown>,
      })

      // Skicka mail för 'invited' rader
      const invitationIds = rpcResult
        .filter((r) => r.status === 'invited' && r.invitation_id)
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

      const merged: ResultRow[] = rpcResult.map((r) => {
        if (r.status === 'error') {
          return { email: r.email, status: 'error', error: r.error }
        }
        if (r.status === 'linked') {
          return { email: r.email, status: 'linked', error: null }
        }
        // invited
        const emailResult = r.invitation_id ? emailResults.get(r.invitation_id) : null
        if (emailResult && !emailResult.success) {
          return {
            email: r.email,
            status: 'email_failed',
            error: emailResult.error ?? 'Mail-utskick misslyckades',
          }
        }
        return { email: r.email, status: 'invited', error: null }
      })

      setResults(merged)
      const createdCount = merged.filter(
        (m) => m.status === 'linked' || m.status === 'invited' || m.status === 'email_failed',
      ).length
      if (createdCount > 0) {
        onCreated(createdCount)
      }
      setStage('result')
    } catch (err) {
      console.error('Bulk-smart-add error:', err)
      setResults([
        {
          email: '(generellt fel)',
          status: 'error',
          error: err instanceof Error ? err.message : 'Okänt fel',
        },
      ])
      setStage('result')
    }
  }

  // ===========================================================================
  // RENDER
  // ===========================================================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/40"
        onClick={onClose}
        aria-label="Stäng"
      />
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        data-domain="action"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-100 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-stone-900 flex items-center gap-2">
              <FileSpreadsheet size={20} />
              Importera deltagare från fil
            </h2>
            <p className="text-sm text-stone-600 mt-1">
              Ladda upp en CSV- eller Excel-fil med dina deltagare. Importen
              hittar befintliga Jobin-användare automatiskt och kopplar dem direkt
              — övriga får en inbjudan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-stone-100"
            aria-label="Stäng"
          >
            <X size={18} className="text-stone-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {stage === 'upload' && (
            <>
              <Card variant="flat" padding="md" style={{ background: 'var(--c-bg)' }}>
                <div className="flex items-start gap-2 text-sm text-stone-800">
                  <Info size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--c-text)' }} />
                  <div>
                    <p className="font-medium mb-1">Förväntade kolumner</p>
                    <ul className="text-xs space-y-0.5 list-disc list-inside text-stone-700">
                      <li><code>email</code> — obligatorisk</li>
                      <li><code>fornamn</code> / <code>first_name</code> — valfri</li>
                      <li><code>efternamn</code> / <code>last_name</code> — valfri</li>
                      <li><code>startdatum</code> / <code>started_at</code> (YYYY-MM-DD) — valfri, default sätts globalt</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <div>
                <p className="text-sm font-medium text-stone-700 mb-2">
                  Ladda ner en mall som utgångspunkt
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="secondary"
                    onClick={downloadCSV}
                    icon={<Download size={14} />}
                  >
                    CSV-mall
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={downloadXLSX}
                    icon={<Download size={14} />}
                  >
                    Excel-mall (.xlsx)
                  </Button>
                </div>
              </div>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                className={cn(
                  'border-2 border-dashed border-stone-300 rounded-xl',
                  'px-6 py-10 text-center bg-stone-50 hover:bg-stone-100 transition-colors',
                  'cursor-pointer',
                )}
                onClick={() => inputRef.current?.click()}
              >
                <Upload size={32} className="mx-auto text-stone-400 mb-2" />
                <p className="text-sm text-stone-700 font-medium mb-1">
                  Dra och släpp filen här, eller klicka för att välja
                </p>
                <p className="text-xs text-stone-500">
                  .csv eller .xlsx, första bladet läses
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={onPickFile}
                  className="hidden"
                />
              </div>

              {parseError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-900 flex items-start gap-2">
                  <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                  {parseError}
                </div>
              )}
            </>
          )}

          {stage === 'preview' && (
            <>
              <div className="flex items-center justify-between text-sm text-stone-700">
                <div>
                  Fil: <code className="text-xs">{fileName}</code>
                </div>
                <button
                  type="button"
                  className="text-xs text-stone-500 underline hover:text-stone-700"
                  onClick={() => {
                    setStage('upload')
                    setRows([])
                    setFileName('')
                  }}
                >
                  Välj annan fil
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg bg-emerald-50 p-3">
                  <div className="text-emerald-900 font-semibold text-lg">{stats.valid}</div>
                  <div className="text-emerald-800">giltiga rader</div>
                </div>
                <div className="rounded-lg bg-rose-50 p-3">
                  <div className="text-rose-900 font-semibold text-lg">{stats.errored}</div>
                  <div className="text-rose-800">rader med fel</div>
                </div>
                <div className="rounded-lg bg-amber-50 p-3">
                  <div className="text-amber-900 font-semibold text-lg">{stats.duplicates.size}</div>
                  <div className="text-amber-800">dubletter (ignoreras)</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="bulk-import-start-date" className="block text-sm font-medium text-stone-700 mb-1">
                    Startdatum (om saknas i filen)
                  </label>
                  <input
                    id="bulk-import-start-date"
                    type="date"
                    value={globalStartedAt}
                    onChange={(e) => setGlobalStartedAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200"
                  />
                </div>
                <div>
                  <label htmlFor="bulk-import-current-part" className="block text-sm font-medium text-stone-700 mb-1">
                    Nuvarande del
                  </label>
                  <select
                    id="bulk-import-current-part"
                    value={currentPart}
                    onChange={(e) => setCurrentPart(Number(e.target.value) as 1 | 2 | 3 | 4)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200"
                  >
                    <option value={1}>Del 1 (3 veckor) — default för nya</option>
                    <option value={2}>Del 2 (5 veckor)</option>
                    <option value={3}>Del 3 (max 6 mån)</option>
                    <option value={4}>Del 4 (max 6 mån)</option>
                  </select>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Välj rätt del om deltagaren redan är längre fram i programmet.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-stone-200 overflow-hidden">
                <div className="max-h-[280px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-stone-50 sticky top-0">
                      <tr className="text-stone-600">
                        <th className="px-3 py-2 text-left font-medium">#</th>
                        <th className="px-3 py-2 text-left font-medium">E-post</th>
                        <th className="px-3 py-2 text-left font-medium">Namn</th>
                        <th className="px-3 py-2 text-left font-medium">Startdatum</th>
                        <th className="px-3 py-2 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => {
                        const isDupe = stats.duplicates.has(r.email)
                        const issue = r.error ?? (isDupe ? 'Dublett — ignoreras' : null)
                        return (
                          <tr
                            key={i}
                            className={cn(
                              'border-t border-stone-100',
                              issue && 'bg-rose-50/40',
                            )}
                          >
                            <td className="px-3 py-2 text-stone-500">{r.rowIndex}</td>
                            <td className="px-3 py-2 font-mono text-stone-800">{r.email || '—'}</td>
                            <td className="px-3 py-2 text-stone-700">
                              {[r.first_name, r.last_name].filter(Boolean).join(' ') || '—'}
                            </td>
                            <td className="px-3 py-2 text-stone-700">
                              {r.started_at || <span className="text-stone-400">{globalStartedAt}</span>}
                            </td>
                            <td className="px-3 py-2">
                              {issue ? (
                                <span className="text-rose-700">{issue}</span>
                              ) : (
                                <span className="text-emerald-700">Klar</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <Card variant="flat" padding="md" style={{ background: 'var(--amber-50, #fef3c7)' }}>
                <div className="flex items-start gap-2 text-sm">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-amber-700" />
                  <div className="text-amber-900">
                    <p className="font-medium mb-1">Om matchning av befintliga användare</p>
                    <p className="text-xs">
                      Rader där e-postadressen matchar en befintlig Jobin-användare
                      kopplas direkt till dig som konsulent — utan e-postutskick.
                      Du måste själv få deltagarens samtycke i annan kanal innan
                      du behandlar deras data.
                    </p>
                  </div>
                </div>
              </Card>
            </>
          )}

          {stage === 'submitting' && (
            <div className="py-10 text-center text-sm text-stone-600">
              <div className="inline-block w-8 h-8 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin mb-3" />
              <p>Importerar deltagare…</p>
            </div>
          )}

          {stage === 'result' && results && (() => {
            const ok = results.filter((r) => r.status === 'linked' || r.status === 'invited').length
            const linked = results.filter((r) => r.status === 'linked').length
            const invited = results.filter((r) => r.status === 'invited').length
            const emailFailed = results.filter((r) => r.status === 'email_failed').length
            const failed = results.filter((r) => r.status === 'error').length

            return (
              <>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <CheckCircle size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-emerald-900 mb-1">
                      {ok} av {results.length} deltagare importerades
                    </p>
                    <p className="text-emerald-800 text-xs">
                      {linked > 0 && `${linked} kopplades direkt (redan Jobin-användare). `}
                      {invited > 0 && `${invited} fick en inbjudan via e-post. `}
                      {emailFailed > 0 && `${emailFailed} skapades men mail misslyckades. `}
                      {failed > 0 && `${failed} kunde inte hanteras.`}
                    </p>
                  </div>
                </div>

                <ul className="space-y-1.5">
                  {results.map((r, i) => (
                    <li
                      key={`${r.email}-${i}`}
                      className={cn(
                        'flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm',
                        r.status === 'linked' && 'bg-sky-50 text-sky-900',
                        r.status === 'invited' && 'bg-emerald-50 text-emerald-900',
                        r.status === 'email_failed' && 'bg-amber-50 text-amber-900',
                        r.status === 'error' && 'bg-rose-50 text-rose-900',
                      )}
                    >
                      <span className="font-mono text-xs">{r.email}</span>
                      <span className="text-xs flex items-center gap-1.5">
                        {r.status === 'linked' && (
                          <>
                            <LinkIcon size={12} /> Kopplad — väntar på samtycke
                          </>
                        )}
                        {r.status === 'invited' && (
                          <>
                            <Mail size={12} /> Inbjuden via mail
                          </>
                        )}
                        {r.status === 'email_failed' && `Skapad — mail misslyckades`}
                        {r.status === 'error' && `Fel: ${r.error}`}
                      </span>
                    </li>
                  ))}
                </ul>

                {linked > 0 && (
                  <div className="p-3 rounded-lg bg-sky-50 border border-sky-200 text-xs text-sky-900 flex items-start gap-2">
                    <Info size={14} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>{linked} deltagare kopplades direkt utan inbjudan.</strong>{' '}
                      De är nu i din lista men har inte godkänt samtycke via Jobin —
                      kontakta dem och säkerställ skriftligt samtycke innan du
                      behandlar deras data.
                    </div>
                  </div>
                )}
              </>
            )
          })()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-end gap-2 bg-stone-50">
          {stage === 'preview' && (
            <>
              <Button variant="ghost" onClick={onClose}>
                Avbryt
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={stats.valid === 0}
              >
                Importera {stats.valid} {stats.valid === 1 ? 'deltagare' : 'deltagare'}
              </Button>
            </>
          )}
          {stage === 'result' && (
            <Button variant="primary" onClick={onClose}>
              Klar
            </Button>
          )}
          {stage === 'upload' && (
            <Button variant="ghost" onClick={onClose}>
              Avbryt
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
