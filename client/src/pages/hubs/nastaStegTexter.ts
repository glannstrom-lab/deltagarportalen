/**
 * Texterna för ett nästa steg (rubrik, brödtext, knapp, kort form).
 * Utbrutet ur NastaSteg.tsx 2026-10-09 när kortet blev rådgivarens replik i
 * staden (spår JS) — samma texter, nu delade av dialogrutan.
 */
import type { TFunction } from 'i18next'
import type { Steg } from './nastaStegRegler'
import { manadsText } from './oversiktTid'

export function nastaStegTexter(steg: Steg, t: TFunction, sprak: string) {
  const bas = `hubOverview.nasta.${steg.id}`
  const v = steg.varden
  const nar = manadsText(v.datum, t, sprak)
  const opts = { titel: v.titel ?? '', nar, count: v.dagar ?? 0 }
  const body =
    steg.id === 'event'
      ? t(v.idag ? `${bas}.bodyToday` : `${bas}.bodyTomorrow`, opts)
      : t(`${bas}.body`, opts)
  return {
    rubrik: t(`${bas}.title`, opts),
    body,
    knapp: t(`${bas}.cta`, opts),
    kort: t(`${bas}.short`, opts),
  }
}
