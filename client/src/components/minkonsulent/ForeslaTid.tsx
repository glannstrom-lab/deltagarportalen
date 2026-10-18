/**
 * O13 (2026-10-18): "Föreslå en tid" på Min konsulent — ersätter mejllänken
 * "Bokningsförfrågan". Deltagaren väljer dag, tid och sätt; konsulenten bekräftar
 * eller säger att tiden inte passar. Väntande förslag syns här och kan dras tillbaka.
 *
 * Lätt svenska: Min konsulent är huvudväg — nycklarna finns i sv-latt.json också.
 */
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { kortDatum } from '@/lib/datumsprak'
import { formatLocalDate } from '@/services/aktivitetSchema'
import { motesforslagApi, forslagTidpunkt, type ForslagTyp } from '@/services/motesforslagApi'

const NYCKEL = ['min-konsulent', 'motesforslag'] as const

function klockslag(iso: string, sprak: string) {
  return new Date(iso).toLocaleTimeString(sprak.startsWith('en') ? 'en-GB' : 'sv-SE', { hour: '2-digit', minute: '2-digit' })
}

/** Väntande förslag, med "Dra tillbaka". Visas bara när det finns något. */
export function MinaMotesforslag() {
  const { t, i18n } = useTranslation()
  const qc = useQueryClient()
  const q = useQuery({ queryKey: NYCKEL, queryFn: () => motesforslagApi.minaForslag() })
  const [fel, setFel] = useState<string | null>(null)
  if (!q.data?.length) return null
  const dra = async (id: string) => {
    setFel(null)
    try { await motesforslagApi.dragTillbaka(id); await qc.invalidateQueries({ queryKey: NYCKEL }) }
    catch (e) { setFel(e instanceof Error ? e.message : t('myConsultant.forslag.fel')) }
  }
  return (
    <div className="rounded-j-s border border-j-linje p-3 space-y-2" data-testid="mina-motesforslag">
      <p className="m-0 text-[0.9375rem] font-semibold text-j-blak">{t('myConsultant.forslag.vantar')}</p>
      <ul className="m-0 p-0 list-none space-y-2">
        {q.data.map((f) => (
          <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 text-[0.9375rem] text-j-blak">
            <span>{kortDatum(f.scheduled_at, i18n.language)} {klockslag(f.scheduled_at, i18n.language)} · {t(`myConsultant.forslag.typ.${f.meeting_type}`)}</span>
            <Button ton="kvarter" variant="tertiary" size="sm" onClick={() => void dra(f.id)}>{t('myConsultant.forslag.dragTillbaka')}</Button>
          </li>
        ))}
      </ul>
      {fel && <p role="alert" className="m-0 text-sm text-red-800 dark:text-red-300">{fel}</p>}
    </div>
  )
}

export function ForeslaTidDialog({ consultantId, onStang }: { consultantId: string; onStang: () => void }) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const imorgon = formatLocalDate(new Date(Date.now() + 86_400_000))
  const [datum, setDatum] = useState(imorgon)
  const [tid, setTid] = useState('10:00')
  const [typ, setTyp] = useState<ForslagTyp>('video')
  const [meddelande, setMeddelande] = useState('')
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)
  const [skickat, setSkickat] = useState(false)
  const ref = useFocusTrap<HTMLDivElement>(true, { onEscape: onStang, autoFocus: true, restoreFocus: true })

  const skicka = async (e: FormEvent) => {
    e.preventDefault()
    setFel(null)
    let tidpunkt: string
    try { tidpunkt = forslagTidpunkt(datum, tid) } catch { setFel(t('myConsultant.forslag.passerad')); return }
    setSparar(true)
    try {
      await motesforslagApi.foresla({ consultantId, tidpunkt, typ, meddelande })
      await qc.invalidateQueries({ queryKey: NYCKEL })
      setSkickat(true)
    } catch (err) {
      console.error('Mötesförslaget kunde inte skickas:', err)
      setFel(t('myConsultant.forslag.fel'))
    } finally { setSparar(false) }
  }

  const falt = 'w-full rounded-j-s border border-j-linje-2 bg-j-kort px-3 py-2 text-[0.9375rem] text-j-blak'
  return (
    <div className="fixed inset-0 z-50 bg-stone-900/50 flex items-center justify-center p-4">
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="foresla-tid-rubrik" className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl max-w-md w-full p-5 space-y-4">
        <h2 id="foresla-tid-rubrik" className="m-0 text-lg font-semibold text-j-blak">{t('myConsultant.forslag.rubrik')}</h2>
        {skickat ? (
          <>
            <p className="m-0 text-[0.9375rem] text-j-blak" role="status">{t('myConsultant.forslag.skickat')}</p>
            <Button ton="kvarter" variant="secondary" onClick={onStang}>{t('common.close', 'Stäng')}</Button>
          </>
        ) : (
          <form onSubmit={skicka} className="space-y-3">
            <p className="m-0 text-[0.9375rem] text-j-blak-2">{t('myConsultant.forslag.intro')}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="forslag-datum" className="block text-sm font-medium text-j-blak mb-1">{t('myConsultant.forslag.datum')}</label>
                <input id="forslag-datum" type="date" min={imorgon} value={datum} onChange={(e) => setDatum(e.target.value)} className={falt} required />
              </div>
              <div>
                <label htmlFor="forslag-tid" className="block text-sm font-medium text-j-blak mb-1">{t('myConsultant.forslag.tid')}</label>
                <input id="forslag-tid" type="time" step={900} value={tid} onChange={(e) => setTid(e.target.value)} className={falt} required />
              </div>
            </div>
            <fieldset className="m-0 p-0 border-0">
              <legend className="text-sm font-medium text-j-blak mb-1">{t('myConsultant.forslag.hur')}</legend>
              <div className="flex flex-wrap gap-3">
                {(['video', 'phone', 'physical'] as const).map((v) => (
                  <label key={v} className="inline-flex items-center gap-2 text-[0.9375rem] text-j-blak">
                    <input type="radio" name="forslag-typ" value={v} checked={typ === v} onChange={() => setTyp(v)} />
                    {t(`myConsultant.forslag.typ.${v}`)}
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor="forslag-meddelande" className="block text-sm font-medium text-j-blak mb-1">{t('myConsultant.forslag.meddelande')}</label>
              <textarea id="forslag-meddelande" rows={3} maxLength={500} value={meddelande} onChange={(e) => setMeddelande(e.target.value)} className={falt} />
            </div>
            {fel && <p role="alert" className="m-0 text-sm text-red-800 dark:text-red-300">{fel}</p>}
            <div className="flex flex-wrap gap-3">
              <Button ton="kvarter" type="submit" disabled={sparar}>
                {sparar && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                {t('myConsultant.forslag.skicka')}
              </Button>
              <Button ton="kvarter" type="button" variant="tertiary" onClick={onStang}>{t('common.cancel', 'Avbryt')}</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
