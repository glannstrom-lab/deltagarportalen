/**
 * journalSol — journalen enligt socialtjänstlagen (RK38, rollspelet 2026-09-27).
 *
 * En journalanteckning om en kontakt ska visa NÄR kontakten skedde (inte bara
 * när raden skrevs), HUR (telefon, besök, video, meddelande, annat), VEM som
 * skrev, och — om den ändrats — vem som ändrade vad och när, med originalet
 * bevarat. Före den här filen skrev en redigering över texten och en radering
 * tog bort den spårlöst.
 *
 * ── PENDING_20260927d ────────────────────────────────────────────────────
 * Kolumnerna occurred_at/contact_form/updated_at/updated_by och tabellen
 * consultant_journal_revisions skapas av
 * `supabase/migrations/PENDING_20260927d_journal_sol.sql`. Med flaggan false:
 *   · skickas de nya kolumnerna aldrig (inga 42703/PGRST204-fel)
 *   · döljer journalen klockslags- och kontaktformsfälten och ändringsloggen
 *   · läses ingen historik
 * Efter körning: `npm run schema:refresh && npm run grants:refresh`, sätt
 * flaggan till true, och byt REVISIONSTABELL mot en literal i `.from()` så
 * lint:schema täcker tabellen. Kolumnerna läses via `select('*')` och skrivs
 * via spridda objekt (`...journalKolumner()`), så lint:schema/lint:kolumner ser
 * dem inte innan de finns i snapshoten.
 *
 * Kvar i spår B (ParticipantDetailPage, som äger journalens skrivningar):
 *   insert: `{ consultant_id, participant_id, content, category, ...journalKolumner(extra) }`
 *   update: `{ content, category, ...journalKolumner(extra) }`
 *   mappning av rader: `{ id, content, ..., ...journalMetaFranRad(j) }`
 *   onAddEntry/onUpdateEntry tar emot `extra` som tredje/fjärde argument.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Ingen AI. Konsulentvyn översätts inte (DESIGN.md §2).
 */
import { supabase } from '@/lib/supabase'

/** PENDING_20260927d — sätts till true när migrationen körts och schema:refresh gjorts. */
export const JOURNAL_SOL_KOLUMNER = true

/**
 * Tabellen finns först efter migrationen. Ett dynamiskt tabellnamn gör att
 * lint:schema inte fäller koden innan dess — byt mot en literal efteråt.
 */

export type Kontaktform = 'telefon' | 'besok' | 'video' | 'meddelande' | 'annat'

export const KONTAKTFORMER: readonly Kontaktform[] = ['telefon', 'besok', 'video', 'meddelande', 'annat'] as const

export const KONTAKTFORM_ETIKETT: Record<Kontaktform, string> = {
  telefon: 'Telefon',
  besok: 'Besök',
  video: 'Video',
  meddelande: 'Meddelande',
  annat: 'Annat',
}

/** Det konsulenten fyller i utöver text och kategori. */
export interface JournalSolFalt {
  /** ISO-tidsstämpel för när kontakten skedde; null = när anteckningen skrivs. */
  occurredAt?: string | null
  /** null = ingen kontakt angiven (en egen anteckning). */
  contactForm?: Kontaktform | null
}

/** Kolumnerna att sprida in i insert/update — tomt före migrationen. */
export function journalKolumner(extra: JournalSolFalt | undefined, finns: boolean = JOURNAL_SOL_KOLUMNER): Record<string, unknown> {
  if (!finns || !extra) return {}
  return {
    occurred_at: extra.occurredAt ?? null,
    contact_form: extra.contactForm ?? null,
  }
}

export interface JournalMeta {
  occurredAt?: string | null
  contactForm?: Kontaktform | null
  updatedAt?: string | null
  updatedBy?: string | null
}

function arKontaktform(v: unknown): v is Kontaktform {
  return typeof v === 'string' && (KONTAKTFORMER as readonly string[]).includes(v)
}

/** Läser de nya kolumnerna ur en `select('*')`-rad. Före migrationen saknas de — då tomt. */
export function journalMetaFranRad(row: Record<string, unknown>): JournalMeta {
  const meta: JournalMeta = {}
  if (typeof row.occurred_at === 'string') meta.occurredAt = row.occurred_at
  if (arKontaktform(row.contact_form)) meta.contactForm = row.contact_form
  if (typeof row.updated_at === 'string') meta.updatedAt = row.updated_at
  if (typeof row.updated_by === 'string') meta.updatedBy = row.updated_by
  return meta
}

/** När kontakten skedde — klockslaget om det angetts, annars när anteckningen skrevs. */
export function kontaktTid(e: { createdAt: string; occurredAt?: string | null }): string {
  return e.occurredAt || e.createdAt
}

/** `YYYY-MM-DDTHH:MM` i lokal tid, för `<input type="datetime-local">`. */
export function tillDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

/** Värdet från `datetime-local` (lokal tid) → ISO. Tomt eller ogiltigt → null. */
export function franDatetimeLocal(v: string): string | null {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

/** Ett klockslag i framtiden är ett skrivfel, inte en kontakt. */
export function klockslagFel(v: string, nu: Date = new Date()): string | null {
  if (!v) return null
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return 'Klockslaget går inte att läsa.'
  if (d.getTime() > nu.getTime() + 5 * 60_000) return 'Klockslaget ligger i framtiden.'
  return null
}

/** "27 sep 2026 14:05" i svensk tid. */
export function journalTid(iso: string): string {
  const f = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Stockholm', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  return f.format(new Date(iso)).replace(/[\u00a0\u202f]/g, ' ').replace('.', '')
}

export interface JournalVersion {
  id: string
  journalId: string
  action: 'update' | 'delete'
  content: string
  category: string | null
  occurredAt: string | null
  contactForm: Kontaktform | null
  authorId: string | null
  /** När versionen blev gällande (skapad eller senast ändrad). */
  versionFrom: string | null
  changedBy: string | null
  changedAt: string
}

function tillVersion(r: Record<string, unknown>): JournalVersion {
  return {
    id: String(r.id),
    journalId: String(r.journal_id),
    action: r.action === 'delete' ? 'delete' : 'update',
    content: String(r.content ?? ''),
    category: typeof r.category === 'string' ? r.category : null,
    occurredAt: typeof r.occurred_at === 'string' ? r.occurred_at : null,
    contactForm: arKontaktform(r.contact_form) ? r.contact_form : null,
    authorId: typeof r.author_id === 'string' ? r.author_id : null,
    versionFrom: typeof r.version_from === 'string' ? r.version_from : null,
    changedBy: typeof r.changed_by === 'string' ? r.changed_by : null,
    changedAt: String(r.changed_at),
  }
}

/**
 * Tidigare versioner av EN journalrad, äldst först. Kastar vid fel — ett fel
 * får inte se ut som "aldrig ändrad". Före migrationen: tom lista utan anrop.
 */
export async function hamtaJournalHistorik(journalId: string, finns: boolean = JOURNAL_SOL_KOLUMNER): Promise<JournalVersion[]> {
  if (!finns) return []
  const { data, error } = await supabase
    .from('consultant_journal_revisions')
    .select('*')
    .eq('journal_id', journalId)
    .order('changed_at', { ascending: true })
  if (error) throw error
  return ((data ?? []) as Record<string, unknown>[]).map(tillVersion)
}

/** Namn för en lista användar-id (författare, den som ändrade). Saknat namn sägs rakt ut. */
export async function hamtaNamn(ids: readonly string[]): Promise<Record<string, string>> {
  const unika = [...new Set(ids.filter(Boolean))]
  if (unika.length === 0) return {}
  const { data, error } = await supabase.from('profiles').select('id, first_name, last_name').in('id', unika)
  if (error) throw error
  const ut: Record<string, string> = {}
  for (const p of (data ?? []) as Array<{ id: string; first_name: string | null; last_name: string | null }>) {
    const n = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()
    if (n) ut[p.id] = n
  }
  return ut
}
