/**
 * FN14 — grattiskortet när en ansökan fått statusen "anställd".
 * Allt som rör något utanför kortet (pausa bevakning, berätta för
 * konsulenten) är en knapp deltagaren väljer — inget sker tyst.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PartyPopper, X } from '@/components/ui/icons'
import { Button } from '@/components/ui'
import { useFickJobbetStore } from '@/stores/fickJobbetStore'
import { useAuthStore } from '@/stores/authStore'
import { jobAlertsApi } from '@/services/jobsApi'
import { supabase } from '@/lib/supabase'
import {
  NITTIODAGARSGUIDE_LANK,
  pausaJobbevakningar,
  notifieraKonsulent,
  type KonsulentNotisUtfall,
} from '@/services/fickJobbet'

const CHECKLISTA = [
  ['akassa', 'Hör av dig till din a-kassa och berätta att du börjar jobba'],
  ['af', 'Meddela Arbetsförmedlingen om du har en kontakt där'],
  ['avtal', 'Läs igenom anställningsavtalet innan du skriver under'],
] as const

export function FickJobbetKort() {
  const { t } = useTranslation()
  const ansokan = useFickJobbetStore((s) => s.ansokan)
  const stang = useFickJobbetStore((s) => s.stang)
  const profile = useAuthStore((s) => s.profile)
  const queryClient = useQueryClient()
  const [startdatum, setStartdatum] = useState('')
  const [pausat, setPausat] = useState<number | null>(null)
  const [konsulentSvar, setKonsulentSvar] = useState<KonsulentNotisUtfall | null>(null)
  const [fel, setFel] = useState(false)

  const { data: bevakningar } = useQuery({
    queryKey: ['job-alerts'],
    queryFn: () => jobAlertsApi.getAll(),
    enabled: !!ansokan,
  })
  const { data: harKonsulent } = useQuery({
    queryKey: ['fick-jobbet-konsulent'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_my_consultant')
      return !!(data as { id?: string } | null)?.id
    },
    enabled: !!ansokan,
  })

  if (!ansokan) return null
  const aktiva = (bevakningar ?? []).filter((a) => a.is_active)

  const pausa = async () => {
    setFel(false)
    try {
      setPausat(await pausaJobbevakningar(bevakningar ?? []))
      queryClient.invalidateQueries({ queryKey: ['job-alerts'] })
    } catch {
      setFel(true)
    }
  }

  const berattaForKonsulent = async () => {
    const namn =
      [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
      t('applications.fickJobbet.enDeltagare', 'En deltagare')
    setKonsulentSvar(
      await notifieraKonsulent({
        deltagarnamn: namn,
        foretag: ansokan.foretag,
        titel: ansokan.titel,
        startdatum: startdatum || null,
      }).catch((): KonsulentNotisUtfall => 'hoppad'),
    )
  }

  return (
    <section
      aria-label={t('applications.fickJobbet.region', 'Grattis till jobbet')}
      className="mb-4 rounded-xl border border-[var(--c-text)]/20 bg-[var(--c-bg)] p-5"
      data-testid="fick-jobbet-kort"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--c-text)]">
          <PartyPopper className="h-5 w-5" aria-hidden="true" />
          {t('applications.fickJobbet.rubrik', 'Grattis, du fick jobbet!')}
        </h2>
        <button
          type="button"
          onClick={stang}
          aria-label={t('applications.fickJobbet.stang', 'Stäng')}
          className="rounded p-1 text-[var(--c-text)]"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <p className="mt-1 text-[var(--c-text)]">
        {ansokan.titel} — {ansokan.foretag}
      </p>

      <div className="mt-4">
        <label htmlFor="fick-jobbet-start" className="block text-sm font-medium text-[var(--c-text)]">
          {t('applications.fickJobbet.startdatum', 'När börjar du? (om du vet)')}
        </label>
        <input
          id="fick-jobbet-start"
          type="date"
          value={startdatum}
          onChange={(e) => setStartdatum(e.target.value)}
          className="mt-1 rounded border border-[var(--c-text)]/30 bg-transparent px-2 py-1 text-[var(--c-text)]"
        />
      </div>

      <ul className="mt-4 space-y-1 text-[var(--c-text)]">
        {CHECKLISTA.map(([id, text]) => (
          <li key={id}>
            <label className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" />
              <span>{t(`applications.fickJobbet.checklista.${id}`, text)}</span>
            </label>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          to={NITTIODAGARSGUIDE_LANK}
          className="inline-flex items-center rounded-lg border border-[var(--c-text)]/30 px-3 py-2 text-sm text-[var(--c-text)] underline"
        >
          {t('applications.fickJobbet.guide', 'Läs guiden om dina första 90 dagar')}
        </Link>
        {aktiva.length > 0 && pausat === null && (
          <Button variant="outline" onClick={pausa}>
            {t('applications.fickJobbet.pausa', 'Pausa min jobbevakning')}
          </Button>
        )}
        {harKonsulent && konsulentSvar === null && (
          <Button variant="outline" onClick={berattaForKonsulent}>
            {t('applications.fickJobbet.beratta', 'Berätta för min konsulent')}
          </Button>
        )}
      </div>

      <div role="status" aria-live="polite" className="mt-3 text-sm text-[var(--c-text)]">
        {pausat !== null &&
          t('applications.fickJobbet.pausad', 'Din jobbevakning är pausad. Du kan slå på den igen under Söka jobb.')}
        {fel && t('applications.fickJobbet.pausaFel', 'Det gick inte att pausa bevakningen just nu. Försök igen.')}
        {konsulentSvar === 'skickad' && t('applications.fickJobbet.skickad', 'Din konsulent har fått veta.')}
        {konsulentSvar === 'hoppad' &&
          t('applications.fickJobbet.hoppad', 'Det gick inte att skicka till din konsulent just nu. Berätta gärna själv.')}
      </div>
    </section>
  )
}
