/**
 * Texterna för ett nästa steg (rubrik, brödtext, knapp, kort form).
 * Utbrutet ur NastaSteg.tsx 2026-10-09 när kortet blev rådgivarens replik i
 * staden (spår JS) — samma texter, nu delade av dialogrutan.
 */
import type { TFunction } from 'i18next'
import type { Steg } from './nastaStegRegler'
import type { CvSektion } from '@/lib/cvSektioner'
import { manadsText } from './oversiktTid'

/**
 * Svenska reservtexter för de två intervjusteg som tillkom 2026-10-24 (FN2/FN3),
 * så att kortet inte visar en rå nyckel om språkfilen ligger efter.
 */
const RESERV: Record<string, string> = {
  'interview.title': 'Du har en intervju: {{titel}}',
  'interview.bodyToday': 'Det är i dag. Du kan öva på några frågor först, i din egen takt.',
  'interview.bodyTomorrow': 'Det är i morgon. Du kan öva på några frågor först, i din egen takt.',
  'interview.cta': 'Öva inför intervjun',
  'interview.short': 'Öva inför intervjun',
  'interviewDone.title': 'Hur gick intervjun?',
  'interviewDone.body': 'Oavsett hur det gick: du tog dig dit. Skriv ner det medan du minns, och lägg in vad du vet i ansökan.',
  'interviewDone.cta': 'Uppdatera ansökan',
  'interviewDone.ctaSecondary': 'Skriv en rad i dagboken',
  'firstStep.title': 'När du vill: börja med ditt CV',
  'firstStep.body': 'Det är ett lugnt första steg. Du kan stanna när du vill, och allt sparas.',
  'firstStep.cta': 'Öppna CV-byggaren',
  'firstStep.short': 'Börja med ditt CV',
  'interviewDone.short': 'Berätta hur intervjun gick',
  'continueCv.title': 'Ditt CV är påbörjat',
  'continueCv.body': 'Det du skrivit är sparat. Fortsätt när du vill, med {{sektion}}.',
  'continueCv.cta': 'Fortsätt med ditt CV',
  'continueCv.short': 'Fortsätt med ditt CV: {{sektion}}',
}

/** Sektionens namn i böjd form efter "med" (erfarenheter, utbildning …). Literala nycklar, så att nyckelsvepet ser dem. */
function sektionsText(sektion: CvSektion, t: TFunction): string {
  switch (sektion) {
    case 'summary': return t('hubOverview.nasta.continueCv.sektion.summary', 'din profiltext')
    case 'work_experience': return t('hubOverview.nasta.continueCv.sektion.work_experience', 'dina erfarenheter')
    case 'education': return t('hubOverview.nasta.continueCv.sektion.education', 'din utbildning')
    case 'skills': return t('hubOverview.nasta.continueCv.sektion.skills', 'dina kompetenser')
  }
}

export function nastaStegTexter(steg: Steg, t: TFunction, sprak: string) {
  const bas = `hubOverview.nasta.${steg.id}`
  const v = steg.varden
  const nar = manadsText(v.datum, t, sprak)
  const sektion = v.sektion ? sektionsText(v.sektion, t) : ''
  const opts = { titel: v.titel ?? '', nar, count: v.dagar ?? 0, sektion }
  const tx = (nyckel: string) => {
    const reserv = RESERV[`${steg.id}.${nyckel}`]
    return reserv ? t(`${bas}.${nyckel}`, { ...opts, defaultValue: reserv }) : t(`${bas}.${nyckel}`, opts)
  }
  const body =
    steg.id === 'event' || steg.id === 'interview'
      ? tx(v.idag ? 'bodyToday' : 'bodyTomorrow')
      : tx('body')
  return {
    rubrik: tx('title'),
    body,
    knapp: tx('cta'),
    kort: tx('short'),
    // FN3: andra knappen, när steget har en (ansökan + dagboken).
    knappSekundar: steg.sekundar ? tx('ctaSecondary') : null,
  }
}
