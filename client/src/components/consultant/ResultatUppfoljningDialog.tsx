/**
 * ResultatUppfoljningDialog — 3- och 6-månadersuppföljning av en placering
 * (RR5, rollspelet 2026-09-27, Rusta och matcha).
 *
 * Ersätter kryssrutan i Rapporter som gick att sätta tio dagar före punkten,
 * i fel ordning och utan datum, utfall eller underlag. Resultatersättningen
 * betalas efter 3 och 6 månader, så det här är ett ekonomiskt underlag.
 *
 * Registreras: dag, utfall, underlag och anteckning. Ordningen spärras; en
 * uppföljning före punkten kräver motivering (kanRegistreraUppfoljning).
 * Journalraden är underlaget — se consultantService.registreraUppfoljning.
 *
 * Svenska literaler: konsulentvyn översätts inte (DESIGN.md §2).
 */
import { useState } from 'react'
import { Loader2 } from '@/components/ui/icons'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { consultantService, type Placement } from '@/services/consultantService'
import { formatLocalDate } from '@/services/aktivitetSchema'
import {
  UNDERLAG_ETIKETT,
  UTFALL_ETIKETT,
  type UppfoljningUnderlag,
  type UppfoljningUtfall,
} from '@/services/placeringUtfall'
import { kanRegistreraUppfoljning, type Uppfoljning } from '@/pages/consultant/placeringsmatt'

interface Props {
  placering: Placement
  vilken: Uppfoljning
  onClose: () => void
  onSparat: () => void
}

const UTFALL_ORDNING: UppfoljningUtfall[] = ['kvar', 'kvar_annan', 'studier', 'slutat', 'ej_nadd']
const UNDERLAG_ORDNING: UppfoljningUnderlag[] = ['anstallningsbevis', 'lonespecifikation', 'studieintyg', 'arbetsgivaren_muntligt', 'deltagaren_muntligt', 'inget']

export function ResultatUppfoljningDialog({ placering, vilken, onClose, onSparat }: Props) {
  const idag = formatLocalDate(new Date())
  const besked = kanRegistreraUppfoljning(
    { startDate: placering.start_date ?? null, followup3m: placering.followup_3m, followup6m: placering.followup_6m },
    vilken,
    idag,
  )
  const [datum, setDatum] = useState(idag)
  const [utfall, setUtfall] = useState<UppfoljningUtfall>('kvar')
  const [underlag, setUnderlag] = useState<UppfoljningUnderlag>('anstallningsbevis')
  const [anteckning, setAnteckning] = useState('')
  const [motivering, setMotivering] = useState('')
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)

  const rubrik = vilken === '3m' ? '3-månadersuppföljning' : '6-månadersuppföljning'
  const kraverMotivering = besked.tillaten && besked.kraverMotivering

  const spara = async () => {
    if (!besked.tillaten) return
    if (!datum || datum > idag) { setFel('Ange den dag uppföljningen gjordes — inte ett datum framåt i tiden.'); return }
    if (placering.start_date && datum < placering.start_date) { setFel('Uppföljningen kan inte vara gjord före placeringens startdatum.'); return }
    if (kraverMotivering && motivering.trim().length < 10) { setFel('Skriv varför uppföljningen görs före uppföljningspunkten (minst några ord).'); return }
    setSparar(true)
    setFel(null)
    try {
      await consultantService.registreraUppfoljning(placering, {
        vilken,
        datum,
        utfall,
        underlag,
        anteckning,
        motivering: kraverMotivering ? motivering : undefined,
      })
      onSparat()
    } catch (err) {
      setFel(err instanceof Error && err.message ? err.message : 'Uppföljningen kunde inte sparas. Försök igen.')
    } finally {
      setSparar(false)
    }
  }

  return (
    <Dialog isOpen onClose={onClose} labelledBy="uppfoljning-titel" className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div className="p-5 border-b border-stone-200 dark:border-stone-700">
        <h2 id="uppfoljning-titel" className="text-lg font-bold text-stone-900 dark:text-stone-100">{rubrik}</h2>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {placering.employer_name}{placering.job_title ? `, ${placering.job_title}` : ''}
          {besked.tillaten && <> · uppföljningspunkt {besked.punkt}</>}
        </p>
      </div>
      <div className="p-5 space-y-4">
        {!besked.tillaten ? (
          <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{besked.skal}</p>
        ) : (
          <>
            {besked.skal && <p className="text-sm rounded-xl bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100 px-3 py-2" role="status">{besked.skal}</p>}
            <Input id="uppf-datum" label="Uppföljningen gjordes" type="date" value={datum} max={idag} min={placering.start_date ?? undefined} onChange={(e) => setDatum(e.target.value)} fullWidth />
            <Select id="uppf-utfall" label="Utfall" options={UTFALL_ORDNING.map((u) => ({ value: u, label: UTFALL_ETIKETT[u] }))} value={utfall} onChange={(e) => setUtfall(e.target.value as UppfoljningUtfall)} />
            <Select id="uppf-underlag" label="Underlag" options={UNDERLAG_ORDNING.map((u) => ({ value: u, label: UNDERLAG_ETIKETT[u] }))} value={underlag} onChange={(e) => setUnderlag(e.target.value as UppfoljningUnderlag)} />
            {kraverMotivering && (
              <Textarea id="uppf-motivering" label="Varför görs uppföljningen i förtid? *" value={motivering} onChange={(e) => setMotivering(e.target.value)} rows={2} fullWidth />
            )}
            <Textarea id="uppf-anteckning" label="Anteckning" value={anteckning} onChange={(e) => setAnteckning(e.target.value)} rows={3} placeholder="Vem du talade med, hur det går, vad som behövs." fullWidth />
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Sparas i journalen med datum och ditt namn, och placeringen markeras. Portalen skickar ingenting till Arbetsförmedlingen — utfallet rapporterar du där.
            </p>
          </>
        )}
        {fel && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{fel}</p>}
      </div>
      <div className="flex justify-end gap-3 p-5 border-t border-stone-200 dark:border-stone-700">
        <Button variant="ghost" onClick={onClose} disabled={sparar}>Avbryt</Button>
        {besked.tillaten && (
          <Button onClick={() => void spara()} disabled={sparar}>
            {sparar ? <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" /> : null}
            Registrera uppföljning
          </Button>
        )}
      </div>
    </Dialog>
  )
}
