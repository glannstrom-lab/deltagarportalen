/**
 * JournalHistorik — ändringsloggen för EN journalrad (RK38, rollspelet
 * 2026-09-27). Visar varje tidigare version med vem som ändrade och när;
 * originalet står först. Läses ur consultant_journal_revisions, som bara
 * databastriggern skriver (se PENDING_20260927d_journal_sol.sql).
 *
 * Tre lägen: laddar / fel / klart. Ett fel ser aldrig ut som "aldrig ändrad".
 * Konsulentvyn översätts inte (DESIGN.md §2).
 */
import { useEffect, useState } from 'react'
import { Loader2 } from '@/components/ui/icons'
import {
  hamtaJournalHistorik,
  hamtaNamn,
  journalTid,
  KONTAKTFORM_ETIKETT,
  type JournalVersion,
} from '@/services/journalSol'

type Lage =
  | { status: 'laddar' }
  | { status: 'fel' }
  | { status: 'klart'; versioner: JournalVersion[]; namn: Record<string, string> }

const KATEGORI: Record<string, string> = { GENERAL: 'Anteckning', PROGRESS: 'Framsteg', CONCERN: 'Oro', GOAL: 'Mål' }

export function JournalHistorik({ journalId, finns }: { journalId: string; finns: boolean }) {
  const [lage, setLage] = useState<Lage>({ status: 'laddar' })
  const [omgang, setOmgang] = useState(0)

  useEffect(() => {
    let aktiv = true
    ;(async () => {
      try {
        const versioner = await hamtaJournalHistorik(journalId, finns)
        const ids = versioner.flatMap((v) => [v.changedBy, v.authorId]).filter((x): x is string => !!x)
        // Namnen är inte värda att fälla loggen för — utan dem står "okänd användare".
        const namn = await hamtaNamn(ids).catch(() => ({} as Record<string, string>))
        if (aktiv) setLage({ status: 'klart', versioner, namn })
      } catch {
        if (aktiv) setLage({ status: 'fel' })
      }
    })()
    return () => {
      aktiv = false
    }
  }, [journalId, finns, omgang])

  if (lage.status === 'laddar') {
    return (
      <p role="status" className="mt-2 text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
        <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" /> Hämtar ändringarna…
      </p>
    )
  }
  if (lage.status === 'fel') {
    return (
      <p role="alert" className="mt-2 text-xs text-rose-700 dark:text-rose-300">
        Ändringsloggen kunde inte hämtas.{' '}
        <button type="button" className="underline" onClick={() => { setLage({ status: 'laddar' }); setOmgang((n) => n + 1) }}>
          Försök igen
        </button>
      </p>
    )
  }
  if (lage.versioner.length === 0) {
    return <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">Inga tidigare versioner sparade.</p>
  }
  const vem = (id: string | null) => (id ? lage.namn[id] ?? 'okänd användare' : 'okänd användare')
  return (
    <ol className="mt-2 space-y-2 border-l-2 border-stone-200 dark:border-stone-700 pl-3" aria-label="Tidigare versioner">
      {lage.versioner.map((v, i) => (
        <li key={v.id} className="text-xs text-stone-600 dark:text-stone-300">
          <p className="font-medium text-stone-700 dark:text-stone-200">
            {i === 0 ? 'Original' : `Version ${i + 1}`}
            {v.versionFrom && <> · skriven {journalTid(v.versionFrom)}</>}
            {v.authorId && <> av {vem(v.authorId)}</>}
          </p>
          <p className="text-stone-500 dark:text-stone-400">
            {v.action === 'delete' ? 'Raderad' : 'Ändrad'} {journalTid(v.changedAt)} av {vem(v.changedBy)}
            {v.category && <> · {KATEGORI[v.category] ?? v.category}</>}
            {v.contactForm && <> · {KONTAKTFORM_ETIKETT[v.contactForm]}</>}
            {v.occurredAt && <> · kontakt {journalTid(v.occurredAt)}</>}
          </p>
          <p className="mt-0.5 whitespace-pre-wrap">{v.content}</p>
        </li>
      ))}
    </ol>
  )
}
