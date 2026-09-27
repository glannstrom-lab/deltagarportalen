/**
 * MoteKort — ett möte med konsulenten i Min vecka (RD4/RD28, rollspelet
 * 2026-09-27). Samma handlingar som ett pass: lägg i kalendern, och säg till
 * om du inte kan komma. Det sista blir ett meddelande till konsulenten —
 * deltagaren har ingen skrivrätt på mötet, och ska inte ha det.
 *
 * Ett fel behåller texten och pekar på Min konsulent (RD26: inget tyst fel).
 */

import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarPlus, MapPin, Video } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { konsulentMeddelandeApi } from '@/services/konsulentMeddelandeApi'
import { byggIcs, icsFilnamn, laddaNerIcs } from '@/lib/ics'
import { motesDatum, motesSlut, motesStart, type KonsulentMote } from './konsulentMoten'

interface Props {
  mote: KonsulentMote
  /** Datum i läsbar form (samma som dagrubriken i Min vecka). */
  datumText: string
  /** Har mötet redan varit? Då finns inga knappar. */
  passerat: boolean
  onStatus?: (text: string) => void
}

function typNyckel(typ: string | null): string {
  if (typ === 'phone') return 'myConsultant.nextMeeting.meetingTypes.phone'
  if (typ === 'physical' || typ === 'in_person') return 'myConsultant.nextMeeting.meetingTypes.inPerson'
  return 'myConsultant.nextMeeting.meetingTypes.video'
}

export function MoteKort({ mote, datumText, passerat, onStatus }: Props) {
  const { t } = useTranslation()
  const id = useId()
  const start = motesStart(mote)
  const slut = motesSlut(mote)
  const [oppen, setOppen] = useState(false)
  const [rad, setRad] = useState('')
  const [lage, setLage] = useState<'vilar' | 'skickar' | 'skickat' | 'fel'>('vilar')
  const [kalenderFel, setKalenderFel] = useState(false)

  const laggIKalender = () => {
    if (!slut) return
    setKalenderFel(false)
    try {
      const titel = t('minVecka.mote.rubrik', 'Möte med din konsulent')
      laddaNerIcs(
        byggIcs([{ uid: `${mote.id}@jobin.se`, datum: motesDatum(mote), start, slut, titel, plats: mote.location }]),
        icsFilnamn(`${titel} ${motesDatum(mote)}`),
      )
      onStatus?.(t('minVecka.kalender.status', 'Kalenderfilen är nedladdad. Öppna den för att lägga passet i din kalender.'))
    } catch {
      setKalenderFel(true)
    }
  }

  const skicka = async () => {
    setLage('skickar')
    try {
      const inledning = t('minVecka.mote.kanInteMeddelande', {
        defaultValue: 'Hej! Jag kan inte komma till vårt möte {{datum}} kl {{tid}}.',
        datum: datumText,
        tid: start,
      })
      await konsulentMeddelandeApi.skickaTillMinKonsulent(rad.trim() ? `${inledning} ${rad.trim()}` : inledning)
      setLage('skickat')
      setOppen(false)
      onStatus?.(t('minVecka.mote.skickatKort', 'Din konsulent har fått besked om mötet.'))
    } catch {
      setLage('fel')
    }
  }

  return (
    <Card className="p-4 border-l-4 border-l-[var(--c-solid)]">
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-mono text-sm text-stone-600 dark:text-stone-400">{slut ? `${start}–${slut}` : start}</span>
          <span className="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">{t(typNyckel(mote.meeting_type))}</span>
        </div>
        <h3 className="font-medium text-stone-900 dark:text-stone-100">{t('minVecka.mote.rubrik', 'Möte med din konsulent')}</h3>
        {mote.location && (
          <p className="flex items-center gap-1 text-sm text-stone-600 dark:text-stone-400">
            <MapPin className="w-4 h-4" aria-hidden="true" />{mote.location}
          </p>
        )}
        {mote.meeting_link && (
          <a href={mote.meeting_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm underline underline-offset-2 text-[var(--c-text)]">
            <Video className="w-4 h-4" aria-hidden="true" />{t('myConsultant.nextMeeting.joinMeeting')}
          </a>
        )}

        {lage === 'skickat' && (
          <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">
            {t('minVecka.mote.skickatKort', 'Din konsulent har fått besked om mötet.')}
          </p>
        )}

        {!passerat && lage !== 'skickat' && !oppen && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="min-h-12 w-full sm:w-auto" onClick={() => { setOppen(true); setLage('vilar') }}>
              {t('minVecka.mote.kanInte', 'Jag kan inte komma till mötet')}
            </Button>
            {/* Utan känd längd blir kalenderposten en gissning — då ingen knapp */}
            {slut && (
              <Button variant="outline" size="sm" className="w-full sm:w-auto self-start" onClick={laggIKalender}>
                <CalendarPlus className="w-4 h-4 mr-2" aria-hidden="true" />
                {t('minVecka.kalender.knapp', 'Lägg till i kalendern')}
              </Button>
            )}
          </div>
        )}
        {kalenderFel && (
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">
            {t('minVecka.kalender.fel', 'Kalenderfilen kunde inte skapas. Försök igen om en stund.')}
          </p>
        )}

        {oppen && (
          <form className="rounded-lg border border-stone-200 dark:border-stone-700 p-3 space-y-2" onSubmit={(e) => { e.preventDefault(); void skicka() }}>
            <p className="text-sm text-stone-800 dark:text-stone-200">
              {t('minVecka.mote.kanInteRubrik', 'Din konsulent får ett meddelande om att du inte kan komma. Ni hittar en ny tid tillsammans.')}
            </p>
            <label htmlFor={`${id}-rad`} className="block text-xs text-stone-600 dark:text-stone-400">
              {t('minVecka.franvaro.noteringEtikett', 'Vill du säga något mer? (frivilligt)')}
            </label>
            <textarea
              id={`${id}-rad`}
              value={rad}
              onChange={(e) => setRad(e.target.value)}
              maxLength={1000}
              rows={2}
              className="w-full rounded-md border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 px-3 py-2 text-sm text-stone-900 dark:text-stone-100"
            />
            {lage === 'fel' && (
              <p role="alert" className="text-sm text-red-700 dark:text-red-300">
                {t('minVecka.mote.felKort', 'Det gick inte att skicka just nu. Din text är kvar. Du kan också skriva eller ringa till din konsulent från sidan Min konsulent.')}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" className="min-h-11" disabled={lage === 'skickar'}>
                {t('minVecka.franvaro.skicka', 'Skicka till min konsulent')}
              </Button>
              <Button type="button" variant="ghost" className="min-h-11" disabled={lage === 'skickar'} onClick={() => { setOppen(false); setLage('vilar') }}>
                {t('minVecka.franvaro.avbryt', 'Avbryt')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Card>
  )
}
