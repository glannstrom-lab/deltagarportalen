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
import { Button } from '@/components/ui/Button'
import { KvarterIkon } from '@/components/ui/icons/kvarter/KvarterIkon'
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
    <li className="flex gap-3 px-4 py-4 sm:gap-4 sm:px-5" data-testid={`mote-${mote.id}`}>
      <span className="w-12 shrink-0 pt-0.5 text-[0.9375rem] font-semibold leading-5 tabular-nums text-j-blak">
        {start}
        {slut && <span className="block font-normal text-j-blak-3">{slut}</span>}
      </span>
      <div className="min-w-0 flex-1 flex flex-col gap-2">
        <div>
          <h4 className="m-0 flex items-center gap-2 text-base font-semibold leading-6 text-j-blak">
            <KvarterIkon namn="mote" size={20} ton="gran" className="shrink-0" />
            {t('minVecka.mote.rubrik', 'Möte med din konsulent')}
          </h4>
          <p className="m-0 text-[0.9375rem] leading-5 text-j-blak-2">
            {t(typNyckel(mote.meeting_type))} · <span className="tabular-nums">{slut ? `${start}–${slut}` : start}</span>
          </p>
        </div>
        {mote.location && (
          <p className="m-0 flex items-center gap-1.5 text-[0.9375rem] text-j-blak-2">
            <KvarterIkon namn="fysiskt" size={18} className="shrink-0" /><span>{mote.location}</span>
          </p>
        )}
        {mote.meeting_link && (
          <a href={mote.meeting_link} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center gap-1.5 text-[0.9375rem] font-semibold underline underline-offset-2 text-j-gran-text">
            <KvarterIkon namn="digitalt" size={18} />{t('myConsultant.nextMeeting.joinMeeting')}
          </a>
        )}

        {lage === 'skickat' && (
          <p role="status" className="text-[0.9375rem] font-semibold text-s-narvarande">
            {t('minVecka.mote.skickatKort', 'Din konsulent har fått besked om mötet.')}
          </p>
        )}

        {!passerat && lage !== 'skickat' && !oppen && (
          <div className="flex flex-wrap gap-2">
            <Button ton="kvarter" variant="secondary" className="w-full sm:w-auto" onClick={() => { setOppen(true); setLage('vilar') }}
              leftIcon={<KvarterIkon namn="franvaro" size={20} ton="vantar" />}>
              {t('minVecka.mote.kanInte', 'Jag kan inte komma till mötet')}
            </Button>
            {/* Utan känd längd blir kalenderposten en gissning — då ingen knapp */}
            {slut && (
              <Button ton="kvarter" variant="tertiary" size="sm" className="w-full sm:w-auto self-start" onClick={laggIKalender}
                leftIcon={<KvarterIkon namn="kalender" size={18} />}>
                {t('minVecka.kalender.knapp', 'Lägg till i kalendern')}
              </Button>
            )}
          </div>
        )}
        {kalenderFel && (
          <p role="alert" className="text-[0.9375rem] font-semibold text-s-ogiltig">
            {t('minVecka.kalender.fel', 'Kalenderfilen kunde inte skapas. Försök igen om en stund.')}
          </p>
        )}

        {oppen && (
          <form className="rounded-j-s border border-j-linje p-3 space-y-2" onSubmit={(e) => { e.preventDefault(); void skicka() }}>
            <p className="text-[0.9375rem] text-j-blak">
              {t('minVecka.mote.kanInteRubrik', 'Din konsulent får ett meddelande om att du inte kan komma. Ni hittar en ny tid tillsammans.')}
            </p>
            <label htmlFor={`${id}-rad`} className="block text-[0.9375rem] text-j-blak-2">
              {t('minVecka.franvaro.noteringEtikett', 'Vill du säga något mer? (frivilligt)')}
            </label>
            <textarea
              id={`${id}-rad`}
              value={rad}
              onChange={(e) => setRad(e.target.value)}
              maxLength={1000}
              rows={2}
              className="w-full rounded-j-s border border-j-linje-2 bg-j-kort px-3 py-2 text-[0.9375rem] text-j-blak"
            />
            {lage === 'fel' && (
              <p role="alert" className="text-[0.9375rem] font-semibold text-s-ogiltig">
                {t('minVecka.mote.felKort', 'Det gick inte att skicka just nu. Din text är kvar. Du kan också skriva eller ringa till din konsulent från sidan Min konsulent.')}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button ton="kvarter" variant="secondary" type="submit" disabled={lage === 'skickar'}>
                {t('minVecka.franvaro.skicka', 'Skicka till min konsulent')}
              </Button>
              <Button type="button" ton="kvarter" variant="tertiary" disabled={lage === 'skickar'} onClick={() => { setOppen(false); setLage('vilar') }}>
                {t('minVecka.franvaro.avbryt', 'Avbryt')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </li>
  )
}
