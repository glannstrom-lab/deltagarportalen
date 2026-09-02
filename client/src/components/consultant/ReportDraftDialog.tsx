/**
 * ReportDraftDialog
 * AI-utkast till periodrapport från konsulentens journalanteckningar + mål.
 * Anropar /api/ai (funktion: konsulent-rapportutkast). Deltagarens namn
 * skickas aldrig — personen refereras som "deltagaren" (GDPR-minimering).
 *
 * KA3 (2026-09-02): utkastet fanns bara i minnet — `handleClose` nollställde
 * det, och en SPA-navigering bort från sidan (varken `visibilitychange` eller
 * `beforeunload` körs då, bara unmount) tappade en AI-genererad och
 * handredigerad rapport tyst. Samma buggklass som CB1 (CV-utkastet).
 *
 * Lagringen är `sessionStorage`, INTE `localStorage` — en avvikelse från den
 * ursprungliga roadmap-raden, medveten: `includeConcern` kan ta med kategorin
 * "Oro" i utkastet, som enligt journalens egen kod bär interna
 * arbetsanteckningar om just sådant konsulenten oroar sig för (ofta
 * hälso-/livssituationsnära hos en målgrupp som enligt CLAUDE.md inkluderar
 * "långtidsarbetslösa med fysiska/psykologiska utmaningar"). `useCVAutoSave.ts`
 * gjorde exakt samma avvägning 2026-05-09 (GDPR/säkerhet: delade datorer på
 * bibliotek/AF gör att `localStorage` överlever inloggningar och läcker till
 * nästa användare, medan `sessionStorage` är flik-isolerad och rensas när
 * fliken stängs). Samma modell återanvänds här i stället för att uppfinna en
 * ny. Nyckeln är ändå per konsulent+deltagare (kravet i roadmapraden), så en
 * kvarliggande post i samma flik kan aldrig visas för fel konsulent.
 */

import { useEffect, useRef, useState } from 'react'
import { X, Sparkles, Loader2, Copy, Check, AlertTriangle, Trash2 } from '@/components/ui/icons'
import { supabase } from '@/lib/supabase'
import { notifications } from '@/lib/toast'
import { callAI } from '@/services/aiApi'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { cn } from '@/lib/utils'

interface ReportDraftDialogProps {
  isOpen: boolean
  onClose: () => void
  participantId: string
}

type Period = '30' | '90' | 'all'

const PERIOD_LABELS: Record<Period, string> = {
  '30': 'senaste 30 dagarna',
  '90': 'senaste 90 dagarna',
  all: 'hela insatsperioden',
}

/** Utkastlagrets nyckelprefix. Nycklas per konsulent+deltagare — se filhuvudet. */
const DRAFT_STORAGE_PREFIX = 'jobin-rapportutkast:'
/** Debounce-fönster för att skriva till sessionStorage, samma tal som CV-utkastet. */
const DRAFT_DEBOUNCE_MS = 800
/** Ett utkast äldre än så här erbjuds inte längre — samma gräns som CV-utkastet. */
const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

interface StoredDraft {
  text: string
  participantId: string
  savedAt: number
}

function draftStorageKey(consultantId: string, participantId: string): string {
  return `${DRAFT_STORAGE_PREFIX}${consultantId}:${participantId}`
}

function readStoredDraft(key: string): StoredDraft | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredDraft>
    if (typeof parsed.text !== 'string' || !parsed.text.trim() || typeof parsed.savedAt !== 'number') {
      return null
    }
    if (Date.now() - parsed.savedAt > DRAFT_MAX_AGE_MS) {
      sessionStorage.removeItem(key)
      return null
    }
    return { text: parsed.text, participantId: parsed.participantId ?? '', savedAt: parsed.savedAt }
  } catch {
    return null
  }
}

function writeStoredDraft(key: string, text: string, participantId: string) {
  try {
    if (!text.trim()) {
      sessionStorage.removeItem(key)
      return
    }
    const entry: StoredDraft = { text, participantId, savedAt: Date.now() }
    sessionStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // sessionStorage kan vara otillgängligt (privat läge m.m.) — utkastet
    // finns då bara i minnet, precis som innan den här ändringen.
  }
}

function clearStoredDraft(key: string) {
  try {
    sessionStorage.removeItem(key)
  } catch {
    // ignore
  }
}

function formatSavedAt(timestamp: number): string {
  return new Date(timestamp).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' })
}

export function ReportDraftDialog({ isOpen, onClose, participantId }: ReportDraftDialogProps) {
  const [period, setPeriod] = useState<Period>('30')
  const [includeConcern, setIncludeConcern] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [draft, setDraft] = useState('')
  const [copied, setCopied] = useState(false)

  // 'offer' = ett sparat utkast hittades vid öppning och väntar på ett
  // uttryckligt val (Fortsätt / Börja om) — skriv aldrig över det tyst.
  const [draftDecision, setDraftDecision] = useState<'resolved' | 'offer'>('resolved')
  const [offeredDraft, setOfferedDraft] = useState<StoredDraft | null>(null)

  const consultantIdRef = useRef<string | null>(null)
  // Nyckeln ligger i STATE, inte bara i en ref: den sätts asynkront (efter
  // `supabase.auth.getUser()`), och om en handredigering eller ett nytt
  // AI-utkast hinner ändra `draft` innan den blivit klar, missar en ren
  // ref-lösning skrivningen tyst — write-effekten nedan beror bara på
  // `draft`/`draftDecision` och körs aldrig om igen bara för att nyckeln blir
  // redo. Med nyckeln som state triggar dess ankomst effekten på nytt, och
  // den fångar då upp `draft`s FAKTISKA värde vid den tidpunkten.
  const [storageKey, setStorageKey] = useState<string | null>(null)
  const storageKeyRef = useRef<string | null>(null)
  const draftRef = useRef(draft)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Text som väntar på att skrivas till sessionStorage — läst av unmount-
  // flushen. `null` betyder "inget ändrat sedan senaste lyckade skrivning".
  const pendingText = useRef<string | null>(null)

  useEffect(() => {
    draftRef.current = draft
    // storageKeyRef hålls i synk med state-versionen så unmount-flushen (som
    // måste läsa synkront ur en ref, inte ur state) alltid ser samma nyckel
    // som write-effekten nedan just använde.
    storageKeyRef.current = storageKey
  })

  // Vid öppning: hämta konsulentens id (för nyckeln) och kolla om det finns
  // ett sparat utkast för den här deltagaren. Erbjud det — skriv aldrig över.
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    void (async () => {
      if (!consultantIdRef.current) {
        const { data: { user } } = await supabase.auth.getUser()
        if (cancelled) return
        consultantIdRef.current = user?.id ?? null
      }
      const consultantId = consultantIdRef.current
      if (!consultantId) return
      const key = draftStorageKey(consultantId, participantId)
      setStorageKey(key)

      if (draftRef.current.trim()) {
        // Redan text i minnet (dialogen stängdes och öppnades igen utan att
        // avmonteras) — inget att erbjuda, den är redan här.
        setDraftDecision('resolved')
        return
      }

      const stored = readStoredDraft(key)
      if (stored) {
        setOfferedDraft(stored)
        setDraftDecision('offer')
      } else {
        setDraftDecision('resolved')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isOpen, participantId])

  // Debounce-skriv utkastet till sessionStorage varje gång det ändras —
  // både AI-genererad text och konsulentens handredigering går genom samma
  // `draft`-state och täcks därför båda. Beroendet på `storageKey` (inte bara
  // `draft`) är med flit: annars kan en ändring som hinner ske innan nyckeln
  // är klar aldrig utlösa en skrivning (racet beskrivet ovan).
  useEffect(() => {
    if (draftDecision !== 'resolved') return
    if (!storageKey) return

    pendingText.current = draft
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      debounceTimer.current = null
      if (pendingText.current !== null) {
        writeStoredDraft(storageKey, pendingText.current, participantId)
      }
      pendingText.current = null
    }, DRAFT_DEBOUNCE_MS)
  }, [draft, draftDecision, storageKey, participantId])

  // FLUSHA vid unmount — inte bara rensa timern. Vid SPA-navigering (byta
  // deltagare, klicka vidare i portalen) körs varken `visibilitychange` eller
  // `beforeunload`, bara unmount; allt som låg kvar i debouncen skulle annars
  // kastas tyst. Läser bara ur refs, så closure-versionen spelar ingen roll —
  // ingen ref-indirektion (`flushRef`) behövs som i `useCVAutoSave`.
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
        debounceTimer.current = null
      }
      if (pendingText.current !== null && storageKeyRef.current) {
        writeStoredDraft(storageKeyRef.current, pendingText.current, participantId)
      }
      pendingText.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ska bara köras vid mount/unmount, inte vid varje participantId-byte
  }, [])

  const handleGenerate = async () => {
    setGenerating(true)
    setDraft('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Hämta journalanteckningar för perioden
      let journalQuery = supabase
        .from('consultant_journal')
        .select('content, category, created_at')
        .eq('consultant_id', user.id)
        .eq('participant_id', participantId)
        .order('created_at', { ascending: true })

      if (period !== 'all') {
        const from = new Date(Date.now() - parseInt(period, 10) * 24 * 60 * 60 * 1000)
        journalQuery = journalQuery.gte('created_at', from.toISOString())
      }

      const [{ data: journalData, error: journalError }, { data: goalsData }] = await Promise.all([
        journalQuery,
        supabase
          .from('consultant_goals')
          .select('title, status, deadline, progress')
          .eq('consultant_id', user.id)
          .eq('participant_id', participantId),
      ])

      if (journalError) throw journalError

      // CONCERN-anteckningar är interna arbetsanteckningar — exkluderas som
      // standard så de inte hamnar i rapporter till tredje part av misstag.
      const entries = (journalData || [])
        .filter(e => includeConcern || e.category !== 'CONCERN')
        .map(e => ({
          date: new Date(e.created_at).toLocaleDateString('sv-SE'),
          category: e.category,
          content: e.content,
        }))

      if (entries.length === 0 && (goalsData || []).length === 0) {
        notifications.info('Det finns inga journalanteckningar eller mål att utgå ifrån för den valda perioden.')
        return
      }

      const result = await callAI<string>('konsulent-rapportutkast', {
        periodLabel: PERIOD_LABELS[period],
        entries,
        goals: (goalsData || []).map(g => ({
          title: g.title,
          status: g.status,
          deadline: g.deadline ? new Date(g.deadline).toLocaleDateString('sv-SE') : null,
          progress: g.progress,
        })),
      })

      const text = (result as Record<string, unknown>)?.utkast
      if (typeof text === 'string' && text.trim()) {
        setDraft(text.trim())
      } else {
        throw new Error('Tomt svar från AI')
      }
    } catch (err) {
      console.error('Error generating report draft:', err)
      notifications.error('Utkastet kunde inte skapas. Försök igen om en stund.')
    } finally {
      setGenerating(false)
    }
  }

  // Rensar den väntande debouncen + det sparade utkastet. Används av både
  // "kopiera" (klar — utkastet är hämtat) och den uttryckliga kasseringen.
  const clearPersistedDraft = () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
      debounceTimer.current = null
    }
    pendingText.current = null
    if (storageKeyRef.current) clearStoredDraft(storageKeyRef.current)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draft)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      // Kopierat till urklipp räknas som "klar" (KA3) — utkastet är hämtat ut,
      // den lokala kopian har fyllt sitt syfte.
      clearPersistedDraft()
    } catch {
      notifications.error('Kunde inte kopiera till urklipp.')
    }
  }

  const handleDiscard = () => {
    clearPersistedDraft()
    setDraft('')
    setCopied(false)
  }

  const handleClose = () => {
    // KA3: nollställer INTE längre utkastet — det är hela buggen den här
    // ändringen rättar. Utkastet lever kvar i sessionStorage (debounce redan
    // igång, och unmount-effekten flushar det som ligger kvar) och erbjuds
    // igen nästa gång dialogen öppnas.
    setCopied(false)
    onClose()
  }

  const handleResumeDraft = () => {
    if (offeredDraft) setDraft(offeredDraft.text)
    setOfferedDraft(null)
    setDraftDecision('resolved')
  }

  const handleStartOver = () => {
    if (storageKeyRef.current) clearStoredDraft(storageKeyRef.current)
    setOfferedDraft(null)
    setDraftDecision('resolved')
  }

  const awaitingDecision = draftDecision === 'offer' && offeredDraft !== null

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      labelledBy="report-draft-dialog-title"
      className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
    >
        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <h3 id="report-draft-dialog-title" className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              Rapportutkast från journalen
            </h3>
          </div>
          <button
            onClick={handleClose}
            aria-label="Stäng"
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {awaitingDecision && offeredDraft ? (
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Det finns ett sparat utkast från {formatSavedAt(offeredDraft.savedAt)}. Vill du fortsätta på det, eller börja om?
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleResumeDraft}>Fortsätt på utkastet</Button>
              <Button variant="outline" onClick={handleStartOver}>Börja om</Button>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Inställningar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="report-period" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Period
                </label>
                <select
                  id="report-period"
                  value={period}
                  onChange={e => setPeriod(e.target.value as Period)}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg',
                    'bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600',
                    'text-stone-900 dark:text-stone-100'
                  )}
                >
                  <option value="30">Senaste 30 dagarna</option>
                  <option value="90">Senaste 90 dagarna</option>
                  <option value="all">Hela insatsperioden</option>
                </select>
              </div>
              <label className="flex items-center gap-2 sm:mt-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeConcern}
                  onChange={e => setIncludeConcern(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-stone-700 dark:text-stone-300">
                  Ta med orosanteckningar
                </span>
              </label>
            </div>

            {!includeConcern && (
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Orosanteckningar (kategori "Oro") är interna och tas inte med i utkastet om du inte aktivt väljer det.
              </p>
            )}

            {/* Resultat */}
            {draft && (
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    Detta är ett AI-utkast baserat på dina journalanteckningar. Läs igenom och
                    korrigera innan det används i officiell rapportering.
                  </p>
                </div>
                <textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  rows={14}
                  aria-label="Rapportutkast"
                  data-ai-generated="true"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl text-sm leading-relaxed',
                    'bg-stone-50 dark:bg-stone-800',
                    'border border-stone-200 dark:border-stone-700 focus:border-amber-500 dark:focus:border-amber-400',
                    'text-stone-900 dark:text-stone-100'
                  )}
                />
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 p-4 border-t border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-2">
            {draft && !awaitingDecision && (
              <>
                <Button variant="outline" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4 mr-2 text-emerald-600" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? 'Kopierat' : 'Kopiera'}
                </Button>
                <Button variant="ghost" onClick={handleDiscard}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Kasta utkastet
                </Button>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleClose}>
              Stäng
            </Button>
            {!awaitingDecision && (
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Skriver utkast...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {draft ? 'Skapa nytt utkast' : 'Skapa utkast'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
    </Dialog>
  )
}
