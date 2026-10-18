/**
 * KF6 (2026-10-18): "Läget just nu" — en AI-sammanfattning av deltagaren för
 * konsulenten inför möte eller överlämning. Workbusters motsvarighet heter
 * deltagarprofil; Jobins version säger var varje påstående kommer ifrån.
 *
 * Inget sparas. Lägesbilden är ett arbetsstöd i stunden, inte en journalrad —
 * vill konsulenten behålla något skriver hon det själv i journalen.
 *
 * Underlaget minimeras i `lagesbildUnderlag.ts` (ingen frånvaroorsak, ingen
 * fritext ur planen, inga CONCERN-anteckningar, inget namn). Servern grindar
 * på personalroll och organisationens AI-brytare (`konsulent-lagesbild` i
 * AI_ENABLED_EXEMPT_FUNCTIONS, client/api/ai.js).
 *
 * Konsulentvyn är inte översatt (DESIGN.md §2), därav svensk text direkt.
 */
import { useState } from 'react'
import { Loader2 } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { SpaltYta } from '@/components/consultant/SpaltYta'
import { supabase } from '@/lib/supabase'
import { anvandareFranSession } from '@/lib/anvandareFranSession'
import { callAI, AiConsentRequiredError } from '@/services/aiApi'
import { formatLocalDate } from '@/services/aktivitetSchema'
import { byggLagesbildUnderlag, harUnderlag } from './lagesbildUnderlag'

type Lage =
  | { status: 'vila' }
  | { status: 'laddar' }
  | { status: 'tomt' }
  | { status: 'fel'; text: string }
  | { status: 'klart'; text: string; tid: string }

export function LagesbildKort({ participantId }: { participantId: string }) {
  const [lage, setLage] = useState<Lage>({ status: 'vila' })

  const hamta = async () => {
    setLage({ status: 'laddar' })
    try {
      const { data: { user } } = await anvandareFranSession()
      if (!user) throw new Error('Inte inloggad')
      const idag = formatLocalDate(new Date())
      const fran = formatLocalDate(new Date(Date.now() - 28 * 86_400_000))
      const fran30 = new Date(Date.now() - 30 * 86_400_000).toISOString()

      const [journal, mal, plan, moten] = await Promise.all([
        supabase.from('consultant_journal').select('content, category, created_at')
          .eq('participant_id', participantId).gte('created_at', fran30).order('created_at', { ascending: false }).limit(40),
        supabase.from('consultant_goals').select('title, status, deadline').eq('participant_id', participantId),
        supabase.from('activity_plans').select('id, status, start_date, end_date, weekly_hours_target, template_name')
          .eq('participant_id', participantId).eq('status', 'active').order('start_date', { ascending: false }).limit(1),
        supabase.from('consultant_meetings').select('scheduled_at, status')
          .eq('participant_id', participantId).gte('scheduled_at', `${idag}T00:00:00`).order('scheduled_at').limit(5),
      ])
      // Ett läsfel är inte tom data: hellre ett fel än en lägesbild som påstår att inget hänt.
      const forstaFel = [journal, mal, plan, moten].find((r) => r.error)?.error
      if (forstaFel) throw forstaFel

      const aktivPlan = plan.data?.[0] ?? null
      const pass = aktivPlan
        ? await supabase.from('activity_sessions').select('date, attendance')
            .eq('plan_id', aktivPlan.id).gte('date', fran).order('date')
        : { data: [], error: null }
      if (pass.error) throw pass.error

      const underlag = byggLagesbildUnderlag({
        idag,
        journal: journal.data ?? [],
        mal: mal.data ?? [],
        plan: aktivPlan,
        pass: pass.data ?? [],
        moten: moten.data ?? [],
      })
      if (!harUnderlag(underlag)) { setLage({ status: 'tomt' }); return }

      const svar = await callAI<string>('konsulent-lagesbild', { underlag })
      const text = (svar as Record<string, unknown>)?.lagesbild
      if (typeof text !== 'string' || !text.trim()) throw new Error('Tomt svar från AI')
      setLage({ status: 'klart', text: text.trim(), tid: new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }) })
    } catch (err) {
      console.error('Lägesbilden kunde inte skapas:', err)
      setLage({
        status: 'fel',
        text: err instanceof AiConsentRequiredError
          ? 'AI-funktionerna är avstängda för din organisation, eller så gick det inte att kontrollera inställningen just nu.'
          : 'Lägesbilden kunde inte skapas. Försök igen om en stund.',
      })
    }
  }

  return (
    <SpaltYta ikon="uppfoljning" rubrik="Läget just nu" testId="lagesbild">
      {lage.status === 'vila' && (
        <div className="grid gap-2 text-sm">
          <p className="m-0 text-[var(--j-blak-3)]">
            En kort sammanfattning ur journal, närvaro, mål och plan — inför ett möte eller en överlämning.
          </p>
          <Button ton="kvarter" variant="secondary" onClick={hamta}>Sammanfatta läget</Button>
        </div>
      )}
      {lage.status === 'laddar' && (
        <p className="m-0 flex items-center gap-2 text-sm" role="status">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Läser underlaget och sammanfattar …
        </p>
      )}
      {lage.status === 'tomt' && (
        <p className="m-0 text-sm">Det finns ingen journal, inga mål, ingen aktiv plan och ingen närvaro de senaste fyra veckorna att sammanfatta.</p>
      )}
      {lage.status === 'fel' && (
        <div className="grid gap-2 text-sm" role="alert">
          <p className="m-0">{lage.text}</p>
          <Button ton="kvarter" variant="tertiary" onClick={hamta}>Försök igen</Button>
        </div>
      )}
      {lage.status === 'klart' && (
        <div className="grid gap-2 text-sm">
          <div className="whitespace-pre-wrap">{lage.text}</div>
          <p className="m-0 text-xs text-[var(--j-blak-3)]">
            AI-utkast kl. {lage.tid}, ur de senaste fyra veckorna. Kontrollera mot källorna innan du använder det. Sparas inte.
          </p>
          <Button ton="kvarter" variant="tertiary" onClick={hamta}>Sammanfatta igen</Button>
        </div>
      )}
    </SpaltYta>
  )
}
