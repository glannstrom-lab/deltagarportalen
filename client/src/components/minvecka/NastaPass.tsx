/**
 * NastaPass — det som står överst i Min vecka (omtaget steg 6, 2026-10-11).
 *
 * Förslagets första princip: "Nästa steg står överst, och det är ett." För
 * deltagaren är det passet i dag och knappen "Jag är här". Vad som är nästa
 * avgörs av samma regler som förut (forvantasRegler.ts → nuSteg):
 *
 *   passIdag  → NastaSteg: rubrik = passet, primärknapp "Jag är här",
 *               sekundär "Jag kan inte komma" om passet inte har börjat.
 *   nastaPass → ett lugnt kort "Nästa pass" — ingen primärknapp, för det
 *               finns inget hon behöver göra i dag.
 *   mote      → "Nästa möte" med konsulenten.
 *   inget     → en mening, och vägen till konsulenten.
 *
 * Incheckningen är den som redan finns (minVeckaApi.checkin → self_checkin_at).
 * Komponenten påstår inget nytt om den: knappen checkar in, konsulenten
 * markerar närvaron.
 */
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { NastaSteg } from '@/components/ui/NastaSteg'
import { KvarterIkon } from '@/components/ui/icons/kvarter/KvarterIkon'
import type { KvarterNamn } from '@/components/ui/icons/kvarter/ritningar'
import { kanAnmalaFranvaro } from '@/services/franvaroApi'
import type { ActivitySession } from '@/services/aktivitetApi'
import { motesDatum, motesSlut, motesStart, type KonsulentMote } from './konsulentMoten'
import { visaTid, type NuSteg } from './forvantasRegler'

interface Props {
  steg: NuSteg
  /** Konsulentens förnamn, eller null när det inte är känt. */
  konsulentNamn: string | null
  /** Datum i läsbar form ("tisdag 14 oktober"). */
  dagText: (datum: string) => string
  /** Id på passet som checkas in just nu. */
  pagar: string | null
  onCheckin: (pass: ActivitySession) => void
  onKanInte: (pass: ActivitySession) => void
}

function motesIkon(typ: string | null): KvarterNamn {
  return typ === 'phone' ? 'samtal' : typ === 'physical' || typ === 'in_person' ? 'fysiskt' : 'digitalt'
}

export function NastaPass({ steg, konsulentNamn, dagText, pagar, onCheckin, onKanInte }: Props) {
  const { t } = useTranslation()

  if (steg.typ === 'passIdag') {
    const p = steg.pass
    return (
      <NastaSteg
        etikett={t('minVecka.nasta.idag', 'I dag')}
        tid={`${visaTid(p.start_time)}–${visaTid(p.end_time)}`}
        rubrik={p.title}
        text={t('minVecka.nasta.idagText', 'Tryck på Jag är här när du är på plats.')}
        handling={{ etikett: t('minVecka.jagArHar', 'Jag är här'), onClick: () => onCheckin(p), disabled: pagar === p.id }}
        sekundar={kanAnmalaFranvaro(p) ? { etikett: t('minVecka.franvaro.knapp', 'Jag kan inte komma'), onClick: () => onKanInte(p) } : undefined}
        className="[&_h2]:text-[1.6rem]"
      >
        {p.location ? <Plats text={p.location} /> : null}
      </NastaSteg>
    )
  }

  if (steg.typ === 'nastaPass') {
    const p = steg.pass
    return (
      <Kort etikett={t('minVecka.nasta.nastaPass', 'Nästa pass')} ikon="kalender" testid="nasta-pass">
        <h2 className="m-0 font-rubrik text-[1.375rem] font-bold leading-tight text-j-blak">{p.title}</h2>
        <p className="m-0 text-base font-semibold text-j-blak first-letter:uppercase">
          {t('minVecka.nasta.nar', {
            defaultValue: '{{dag}} kl {{fran}}–{{till}}',
            dag: dagText(p.date),
            fran: visaTid(p.start_time),
            till: visaTid(p.end_time),
          })}
        </p>
        {p.location ? <Plats text={p.location} /> : null}
        <p className="m-0 text-[0.9375rem] text-j-blak-2">
          {t('minVecka.nasta.nastaPassText', 'Du behöver inte göra något förrän då. Kan du inte komma? Säg till vid passet längre ner.')}
        </p>
      </Kort>
    )
  }

  if (steg.typ === 'mote') {
    const m: KonsulentMote = steg.mote
    const slut = motesSlut(m)
    return (
      <Kort etikett={t('minVecka.nasta.mote', 'Nästa möte')} ikon={motesIkon(m.meeting_type)} testid="nasta-mote">
        <h2 className="m-0 font-rubrik text-[1.375rem] font-bold leading-tight text-j-blak">
          {konsulentNamn
            ? t('minVecka.nasta.moteMed', { defaultValue: 'Möte med {{namn}}', namn: konsulentNamn })
            : t('minVecka.mote.rubrik', 'Möte med din konsulent')}
        </h2>
        <p className="m-0 text-base font-semibold text-j-blak first-letter:uppercase">
          {t('minVecka.nasta.nar', {
            defaultValue: '{{dag}} kl {{fran}}–{{till}}',
            dag: dagText(motesDatum(m)),
            fran: motesStart(m),
            till: slut ?? motesStart(m),
          })}
        </p>
        {m.location ? <Plats text={m.location} /> : null}
      </Kort>
    )
  }

  return (
    <Kort etikett={t('minVecka.nasta.ingetEtikett', 'Den här veckan')} ikon="klart" testid="nasta-inget">
      <p className="m-0 font-rubrik text-xl font-bold leading-snug text-j-blak">
        {t('minVecka.nasta.inget', 'Inget mer är planerat den här veckan.')}
      </p>
      <p className="m-0 text-[0.9375rem] text-j-blak-2">
        {t('minVecka.nasta.ingetText', 'Undrar du något?')}{' '}
        <Link to="/my-consultant" className="font-semibold text-j-gran-text underline underline-offset-2">
          {t('minVecka.forvantas.skriv', 'Skriv till din konsulent')}
        </Link>
      </p>
    </Kort>
  )
}

function Plats({ text }: { text: string }) {
  return (
    <p className="m-0 flex items-center gap-1.5 text-[0.9375rem] text-j-blak-2">
      <KvarterIkon namn="fysiskt" size={18} className="shrink-0" />
      {text}
    </p>
  )
}

function Kort({ etikett, ikon, testid, children }: { etikett: string; ikon: KvarterNamn; testid: string; children: React.ReactNode }) {
  return (
    <section
      data-testid={testid}
      className="grid gap-2.5 rounded-j-m border border-j-linje bg-j-kort p-5 text-j-blak shadow-j sm:p-[22px]"
    >
      <p className="m-0 flex items-center gap-2 text-[0.8125rem] font-bold uppercase tracking-[0.08em] text-j-glod">
        <KvarterIkon namn={ikon} size={18} ton="glod" />
        <span>{etikett}</span>
      </p>
      {children}
    </section>
  )
}
