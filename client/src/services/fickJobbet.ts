/**
 * FN14 — det som händer när deltagaren fått jobbet: pausa jobbevakningen
 * (bara efter att deltagaren sagt ja) och berätta för konsulenten.
 */
import { supabase } from '@/lib/supabase'
import { jobAlertsApi, type JobAlert } from './jobsApi'

/** Slug i kunskapsbanken (finns i prod: "30-60-90-dagarsplan – dina första 90 dagar"). */
export const NITTIODAGARSGUIDE_SLUG = 'forsta-90-dagarna'
export const NITTIODAGARSGUIDE_LANK = `/knowledge-base/article/${NITTIODAGARSGUIDE_SLUG}`

/** Pausar (is_active=false) alla aktiva bevakningar. Raderar inget. Returnerar antal pausade. */
export async function pausaJobbevakningar(alerts: JobAlert[]): Promise<number> {
  const aktiva = alerts.filter((a) => a.is_active)
  await Promise.all(aktiva.map((a) => jobAlertsApi.toggleActive(a.id, false)))
  return aktiva.length
}

export type KonsulentNotisUtfall = 'skickad' | 'ingen_konsulent' | 'hoppad'

/**
 * Skriver en notis till deltagarens konsulent med uppgifter att förifylla en
 * placering med (arbetsgivare, titel, startdatum). Skriver INTE i konsulentens
 * placeringstabell — konsulenten registrerar själv.
 *
 * Kräver migrationen 20261027_fn14_deltagare_fick_jobb_notis.sql. Utan den
 * nekar RLS insertet; då hoppas notisen över (utfall 'hoppad'), inget kastas.
 */
export async function notifieraKonsulent(input: {
  deltagarnamn: string
  foretag: string
  titel: string
  startdatum: string | null
}): Promise<KonsulentNotisUtfall> {
  const { data: konsulent, error } = await supabase.rpc('get_my_consultant')
  const id = (konsulent as { id?: string } | null)?.id
  if (error || !id) return 'ingen_konsulent'

  const nar = input.startdatum ? ` Startdatum: ${input.startdatum}.` : ''
  const { error: insErr } = await supabase.from('notifications').insert({
    user_id: id,
    type: 'deltagare_fick_jobb',
    title: `${input.deltagarnamn} har fått jobb`,
    message: `${input.titel} hos ${input.foretag}.${nar} Du kan registrera placeringen.`,
    action_url: '/consultant',
    data: {
      placering: {
        employer_name: input.foretag,
        job_title: input.titel,
        start_date: input.startdatum,
      },
    },
  })
  return insErr ? 'hoppad' : 'skickad'
}
