/**
 * ParticipantJournal
 *
 * Strukturerad journal för konsulentens anteckningar om en deltagare.
 * Kopplades in 2026-08-31 (beslut Mikael) — komponenten låg tidigare
 * 389 rader färdig men helt oanvänd (noll importörer), medan
 * ParticipantDetailPage skrev fritext till `consultant_journal` med
 * `category` hårdkodad till 'GENERAL'. Effekten: `ReportDraftDialog`
 * filtrerar medvetet bort kategorin "Oro" ur AI-rapportutkast, men
 * gränssnittet gick aldrig att sätta den — skyddet i datamodellen var
 * verkningslöst tills den här komponenten kopplades in.
 *
 * Rättade antaganden mot den ursprungliga, aldrig körda koden (verifierat
 * mot prod-schemat, `information_schema.columns` för `consultant_journal`):
 * - Tabellen har INGA kolumner `is_goal`, `goal_deadline`, `is_completed`
 *   eller `updated_at`. Originalets mål-specifika fält (deadline, "markera
 *   som uppnått") gick alltså aldrig att spara — det hade sett ut att
 *   fungera i minnet och sedan tappat allt vid omladdning. Mål har redan
 *   en egen, fullständig väg (`consultant_goals` + GoalCreationDialog);
 *   GOAL här är enbart en journal-KATEGORI (samma som CHECK-constrainten
 *   `consultant_journal_category_check` tillåter: GENERAL/PROGRESS/
 *   CONCERN/GOAL), inte ett andra ställe att spåra deadlines på.
 * - Originalet hade noll `dark:`-klasser (skrivet före mörkt tema fanns).
 * - `consultant_id`/`participant_id` sattes av komponenten själv via
 *   `useAuthStore` — de skickas nu inte med alls. Föräldern
 *   (ParticipantDetailPage) äger supabase-anropen och känner redan båda
 *   id:na, samma mönster som sidans befintliga `handleAddNote`.
 *
 * RLS (migration 20260831140000_ks_consultant_rls.sql, körd mot prod
 * 2026-08-31): en konsulent utan aktiv rad i `consultant_participants` för
 * deltagaren nekas INSERT/UPDATE/DELETE. INSERT ger ett synligt fel
 * (42501, WITH CHECK). UPDATE/DELETE ger däremot INGET fel från Postgrest
 * när USING-villkoret filtrerar bort raden — bara ett tomt svar. Föräldern
 * (`onUpdateEntry`/`onDeleteEntry`) räknar därför ett tomt returnerat
 * `data`-set som ett fel, inte som "inget att göra" — annars ser en nekad
 * ändring exakt ut som en lyckad.
 *
 * Synlighet (produktbeslut Mikael 2026-08-31): deltagaren har SELECT på
 * sina egna journalrader, UTAN undantag för kategori — "Oro" inkluderad.
 * Bannern nedan är därför sanning, inte en gissning: en konsulent som tror
 * att "Oro" är dold för deltagaren har fel, och gränssnittet ska inte låta
 * det antagandet stå okorrigerat.
 *
 * RK38 (rollspelet 2026-09-27) — journal enligt SoL: varje rad visar
 * klockslag och författare. Efter PENDING_20260927d (services/journalSol.ts)
 * också när kontakten skedde, kontaktform och en ändringslogg där originalet
 * bevaras — en ändring eller radering sparar den tidigare versionen i
 * databasen (trigger), inte bara i gränssnittet. Före migrationen döljs de
 * fälten; ingenting skickas som databasen inte har kolumner för.
 *
 * Konsulentvyn är medvetet oöversatt (DESIGN.md §2) — samma linje som
 * grannkomponenterna i den här mappen (ReportDraftDialog, GoalCreationDialog
 * m.fl.): svensk text rakt av, ingen `t()`.
 */

import { useState } from 'react'
import {
  BookOpen,
  Plus,
  Calendar,
  Target,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  Save,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  RefreshCw,
  X,
  History,
} from '@/components/ui/icons'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { cn } from '@/lib/utils'
import {
  JOURNAL_SOL_KOLUMNER,
  KONTAKTFORMER,
  KONTAKTFORM_ETIKETT,
  franDatetimeLocal,
  journalTid,
  klockslagFel,
  kontaktTid,
  tillDatetimeLocal,
  type JournalMeta,
  type JournalSolFalt,
  type Kontaktform,
} from '@/services/journalSol'
import { JournalHistorik } from './JournalHistorik'

export type NoteCategory = 'GENERAL' | 'PROGRESS' | 'CONCERN' | 'GOAL'

export interface JournalEntry extends JournalMeta {
  id: string
  content: string
  category: NoteCategory
  createdAt: string
  /** Vem som skrev raden. Saknas → behandlas som egen (bakåtkompatibelt). */
  consultantId?: string
  /** Visningsnamn för författaren när det inte är den inloggade (KS2 b). */
  authorName?: string
}

export type JournalMutationResult = { ok: true } | { ok: false; error: string }

interface ParticipantJournalProps {
  participantName: string
  entries: JournalEntry[]
  /** Fel vid HÄMTNING av listan (skilt från fel på en enskild sparning). */
  loadError: string | null
  onRetryLoad: () => void
  /** RK38: `extra` (klockslag, kontaktform) sprids in med journalKolumner() — tomt före migrationen. */
  onAddEntry: (content: string, category: NoteCategory, extra?: JournalSolFalt) => Promise<JournalMutationResult>
  onUpdateEntry: (id: string, content: string, category: NoteCategory, extra?: JournalSolFalt) => Promise<JournalMutationResult>
  onDeleteEntry: (id: string) => Promise<JournalMutationResult>
  /**
   * KS2 = b (2026-09-12): efter en överlämning läser den nya konsulenten
   * företrädarens rader men kan inte ändra dem. En rad vars consultantId
   * skiljer sig från den inloggade visas med "Skriven av …" och utan
   * redigera/ta bort. RLS nekar ändå (UPDATE/DELETE ger 0 rader) — det här
   * gör att gränssnittet inte lovar något som databasen nekar.
   */
  currentConsultantId?: string
  /** RK38: finns SoL-kolumnerna? Standard: JOURNAL_SOL_KOLUMNER. Injicerbar för test. */
  solKolumner?: boolean
  className?: string
}

const categoryConfig: Record<NoteCategory, { label: string; badge: string; border: string; icon: typeof BookOpen }> = {
  GENERAL: {
    label: 'Anteckning',
    badge: 'bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-200',
    border: 'border-stone-200 dark:border-stone-700',
    icon: BookOpen,
  },
  PROGRESS: {
    label: 'Framsteg',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: TrendingUp,
  },
  CONCERN: {
    label: 'Oro',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    icon: AlertCircle,
  },
  GOAL: {
    label: 'Mål',
    badge: 'bg-[var(--c-bg)] text-[var(--c-text)] dark:bg-[var(--c-bg)]/40 dark:text-[var(--c-solid)]',
    border: 'border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50',
    icon: Target,
  },
}

export function ParticipantJournal({
  participantName,
  entries,
  loadError,
  onRetryLoad,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  currentConsultantId,
  solKolumner = JOURNAL_SOL_KOLUMNER,
  className,
}: ParticipantJournalProps) {
  const { confirm } = useConfirmDialog()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Formulärstate (delas av "ny anteckning" och "redigera" — bara en av dem
  // är öppen åt gången).
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<NoteCategory>('GENERAL')
  // RK38: när kontakten skedde (tomt = när anteckningen sparas) och hur.
  const [klockslag, setKlockslag] = useState('')
  const [kontaktform, setKontaktform] = useState<Kontaktform | ''>('')
  const [historikFor, setHistorikFor] = useState<string | null>(null)

  const resetForm = () => {
    setIsAdding(false)
    setEditingId(null)
    setContent('')
    setCategory('GENERAL')
    setKlockslag('')
    setKontaktform('')
    setFormError(null)
  }

  const extraFalt = (): JournalSolFalt | undefined =>
    solKolumner ? { occurredAt: franDatetimeLocal(klockslag), contactForm: kontaktform || null } : undefined

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return
    const tidFel = solKolumner ? klockslagFel(klockslag) : null
    if (tidFel) {
      setFormError(tidFel)
      return
    }
    setSubmitting(true)
    setFormError(null)
    const extra = extraFalt()
    const result = extra ? await onAddEntry(content.trim(), category, extra) : await onAddEntry(content.trim(), category)
    setSubmitting(false)
    if (result.ok) {
      resetForm()
    } else {
      // Behåll texten användaren skrev — ett fel ska aldrig kosta arbetet.
      setFormError(result.error)
    }
  }

  const handleUpdate = async () => {
    if (!editingId || !content.trim() || submitting) return
    const tidFel = solKolumner ? klockslagFel(klockslag) : null
    if (tidFel) {
      setFormError(tidFel)
      return
    }
    setSubmitting(true)
    setFormError(null)
    const extra = extraFalt()
    const result = extra
      ? await onUpdateEntry(editingId, content.trim(), category, extra)
      : await onUpdateEntry(editingId, content.trim(), category)
    setSubmitting(false)
    if (result.ok) {
      resetForm()
    } else {
      setFormError(result.error)
    }
  }

  const handleEdit = (entry: JournalEntry) => {
    setIsAdding(false)
    setEditingId(entry.id)
    setContent(entry.content)
    setCategory(entry.category)
    setKlockslag(entry.occurredAt ? tillDatetimeLocal(entry.occurredAt) : '')
    setKontaktform(entry.contactForm ?? '')
    setFormError(null)
  }

  const handleDelete = async (entry: JournalEntry) => {
    const confirmed = await confirm({
      title: 'Ta bort anteckningen?',
      message: solKolumner
        ? 'Anteckningen tas bort ur journalen. Originalet sparas i ändringsloggen, där du och deltagaren kan läsa det.'
        : 'Anteckningen går inte att återställa.',
      confirmText: 'Ta bort',
      cancelText: 'Avbryt',
      variant: 'danger',
    })
    if (!confirmed) return

    setFormError(null)
    setDeletingId(entry.id)
    const result = await onDeleteEntry(entry.id)
    setDeletingId(null)
    if (!result.ok) {
      // En nekad radering ska synas där den skedde, inte bara i en toast som
      // kan missas — samma princip som formuläret ovan.
      setFormError(result.error)
    }
  }

  // RK38: ordning och dag efter när kontakten skedde — ett samtal i går som
  // journalförs i dag hör till i går. Före migrationen = när raden skrevs.
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(kontaktTid(b)).getTime() - new Date(kontaktTid(a)).getTime()
  )

  const groupedEntries = sortedEntries.reduce((groups, entry) => {
    const date = new Date(kontaktTid(entry)).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    if (!groups[date]) groups[date] = []
    groups[date].push(entry)
    return groups
  }, {} as Record<string, JournalEntry[]>)

  return (
    <Card padding="none" className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-stone-100 dark:border-stone-700">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-solid)]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-stone-900 dark:text-stone-100">Deltagarjournal</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 truncate">{participantName}</p>
            </div>
          </div>

          {!isAdding && !editingId && (
            <Button size="sm" onClick={() => { setIsAdding(true); setFormError(null) }} leftIcon={<Plus className="w-4 h-4" />}>
              Ny anteckning
            </Button>
          )}
        </div>

        {/* Synlighet — sanning, inte antagande: deltagaren kan läsa ALLT här.
            RR15: "att hon läser" stod också på män — könsneutralt nu. */}
        <div className="mt-4 flex items-start gap-2 text-xs text-stone-500 dark:text-stone-400">
          <Eye className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p>Deltagaren kan läsa alla anteckningar här, inklusive de märkta &quot;Oro&quot;. Skriv inget du inte kan stå för att deltagaren läser.</p>
        </div>
      </div>

      {/* Fel på en sparning/uppdatering/radering — synligt oavsett om
          formuläret är öppet, så en nekad radering (som inte har något
          formulär att visa felet i) inte bara tystnar. */}
      {formError && (
        <div role="alert" className="flex items-start gap-2 p-3 mx-4 sm:mx-6 mt-4 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>{formError}</span>
        </div>
      )}

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="p-4 sm:p-6 bg-stone-50 dark:bg-stone-800/60 border-b border-stone-100 dark:border-stone-700">
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Kategori">
              {(Object.keys(categoryConfig) as NoteCategory[]).map((cat) => {
                const config = categoryConfig[cat]
                const Icon = config.icon
                return (
                  <button
                    key={cat}
                    type="button"
                    role="radio"
                    aria-checked={category === cat}
                    onClick={() => setCategory(cat)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                      category === cat
                        ? config.badge
                        : 'bg-white dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-600'
                    )}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    {config.label}
                  </button>
                )
              })}
            </div>

            {solKolumner && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="text-sm text-stone-700 dark:text-stone-300">
                  <label htmlFor="journal-klockslag" className="block mb-1">När skedde kontakten?</label>
                  <input
                    id="journal-klockslag"
                    type="datetime-local"
                    value={klockslag}
                    onChange={(e) => setKlockslag(e.target.value)}
                    aria-describedby="journal-klockslag-hint"
                    className="w-full px-3 py-2 border border-stone-200 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                  <span id="journal-klockslag-hint" className="block mt-1 text-xs text-stone-500 dark:text-stone-400">Tomt = nu, när du sparar.</span>
                </div>
                <label className="text-sm text-stone-700 dark:text-stone-300">
                  <span className="block mb-1">Kontaktform</span>
                  <select
                    value={kontaktform}
                    onChange={(e) => setKontaktform(e.target.value as Kontaktform | '')}
                    className="w-full px-3 py-2 border border-stone-200 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  >
                    <option value="">Ingen kontakt (egen anteckning)</option>
                    {KONTAKTFORMER.map((k) => (
                      <option key={k} value={k}>{KONTAKTFORM_ETIKETT[k]}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            <textarea
              aria-label="Anteckning"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Skriv din anteckning här..."
              className="w-full p-4 border border-stone-200 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)] resize-none"
              rows={4}
              autoFocus
            />

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={resetForm} disabled={submitting}>
                Avbryt
              </Button>
              <Button
                onClick={() => (editingId ? handleUpdate() : handleSubmit())}
                disabled={!content.trim()}
                isLoading={submitting}
                leftIcon={<Save className="w-4 h-4" />}
              >
                {editingId ? 'Uppdatera' : 'Spara'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Fel vid hämtning — ett eget läge, aldrig tom lista */}
      {loadError && (
        <div role="alert" className="p-6 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto text-rose-500 mb-2" aria-hidden="true" />
          <p className="text-stone-700 dark:text-stone-200 font-medium">{loadError}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={onRetryLoad} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Försök igen
          </Button>
        </div>
      )}

      {/* Entries List */}
      {!loadError && (
        <div className="max-h-[32rem] overflow-y-auto">
          {entries.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Här samlas anteckningarna om deltagaren"
              description="Framsteg, mål och sådant du vill hålla koll på — allt på ett ställe."
              action={{ label: 'Skriv din första anteckning', onClick: () => setIsAdding(true) }}
            />
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-700">
              {Object.entries(groupedEntries).map(([date, dateEntries]) => (
                <div key={date} className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-stone-500 dark:text-stone-400" aria-hidden="true" />
                    <span className="text-sm font-medium text-stone-600 dark:text-stone-300">{date}</span>
                  </div>

                  <div className="space-y-3">
                    {dateEntries.map((entry) => {
                      const config = categoryConfig[entry.category] || categoryConfig.GENERAL
                      const Icon = config.icon
                      const isExpanded = expandedId === entry.id
                      const isEditingThis = editingId === entry.id
                      const arEgen =
                        !entry.consultantId || !currentConsultantId || entry.consultantId === currentConsultantId

                      if (isEditingThis) return null // formuläret ovan ersätter kortet under redigering

                      return (
                        <div
                          key={entry.id}
                          className={cn('p-4 rounded-xl border bg-white dark:bg-stone-800', config.border)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', config.badge)}>
                              <Icon className="w-4 h-4" aria-hidden="true" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <span className={cn('inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-1', config.badge)}>
                                {config.label}
                              </span>
                              {entry.contactForm && (
                                <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-1 ml-2 bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-200">
                                  {KONTAKTFORM_ETIKETT[entry.contactForm]}
                                </span>
                              )}
                              {/* RK38: klockslag och författare på varje rad. */}
                              <span
                                className="inline-block text-xs text-stone-500 dark:text-stone-400 ml-2 mb-1"
                                title={!arEgen ? 'Skrivet före överlämningen — går att läsa men inte ändra' : undefined}
                              >
                                {entry.occurredAt ? 'Kontakt ' : 'Kl. '}
                                {new Date(kontaktTid(entry)).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                                {' · '}
                                {arEgen ? 'skriven av dig' : `skriven av ${entry.authorName ?? 'en tidigare konsulent'}`}
                                {entry.occurredAt && <> · journalförd {journalTid(entry.createdAt)}</>}
                              </span>

                              <p className={cn('text-stone-700 dark:text-stone-200 whitespace-pre-wrap', !isExpanded && 'line-clamp-2')}>
                                {entry.content}
                              </p>

                              {entry.updatedAt && (
                                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                                  Ändrad {journalTid(entry.updatedAt)}
                                  {solKolumner && (
                                    <>
                                      {' · '}
                                      <button
                                        type="button"
                                        onClick={() => setHistorikFor(historikFor === entry.id ? null : entry.id)}
                                        aria-expanded={historikFor === entry.id}
                                        className="inline-flex items-center gap-1 underline hover:opacity-80"
                                      >
                                        <History className="w-3 h-3" aria-hidden="true" />
                                        {historikFor === entry.id ? 'Dölj ändringarna' : 'Visa ändringarna'}
                                      </button>
                                    </>
                                  )}
                                </p>
                              )}
                              {historikFor === entry.id && <JournalHistorik journalId={entry.id} finns={solKolumner} />}

                              {entry.content.length > 150 && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                                  className="text-sm text-[var(--c-text)] dark:text-[var(--c-solid)] hover:opacity-80 mt-1 flex items-center gap-1"
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp className="w-4 h-4" aria-hidden="true" />
                                      Visa mindre
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="w-4 h-4" aria-hidden="true" />
                                      Visa mer
                                    </>
                                  )}
                                </button>
                              )}
                            </div>

                            {arEgen && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => handleEdit(entry)}
                                className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-[var(--c-text)] dark:hover:text-[var(--c-solid)] hover:bg-[var(--c-bg)] dark:hover:bg-[var(--c-bg)]/30 rounded-lg transition-colors"
                                title="Redigera"
                                aria-label={`Redigera anteckningen från ${date}`}
                              >
                                <Edit2 className="w-4 h-4" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(entry)}
                                disabled={deletingId === entry.id}
                                className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors disabled:opacity-50"
                                title="Ta bort"
                                aria-label={`Ta bort anteckningen från ${date}`}
                              >
                                {deletingId === entry.id ? (
                                  <X className="w-4 h-4 animate-pulse" aria-hidden="true" />
                                ) : (
                                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                                )}
                              </button>
                            </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export default ParticipantJournal
