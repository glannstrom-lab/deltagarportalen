/**
 * Relativ tid som en vän säger den — delad av Översiktens tre nivåer.
 *
 *   i dag · i går · 3 dagar sedan · 2 veckor sedan · i maj · maj 2025
 *
 * Aldrig "för länge sedan". Det stod tre gånger på samma skärm fram till
 * 2026-09-10, i monospace, och läses som en förebråelse: en tidsstämpel i
 * skamform hjälper ingen att öppna sitt CV. Ett månadsnamn är lika sant och
 * lämnar personen i fred.
 */

import type { TFunction } from 'i18next'

export function dagarSedan(iso: string | null | undefined, nu: Date = new Date()): number | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return Math.floor((nu.getTime() - d.getTime()) / 86_400_000)
}

/** "i maj" i år, annars "maj 2025". Tom sträng utan giltigt datum. */
export function manadsText(
  iso: string | null | undefined,
  t: TFunction,
  sprak: string,
  nu: Date = new Date()
): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const manad = d.toLocaleDateString(sprak, { month: 'long' })
  return d.getFullYear() === nu.getFullYear()
    ? t('hubOverview.panel.inMonth', { defaultValue: 'i {{manad}}', manad })
    : t('hubOverview.panel.inMonthYear', { defaultValue: '{{manad}} {{ar}}', manad, ar: d.getFullYear() })
}

/** Hela skalan. `null` utan giltigt datum, så raden kan visa en invit i stället. */
export function narText(
  iso: string | null | undefined,
  t: TFunction,
  sprak: string,
  nu: Date = new Date()
): string | null {
  const d = dagarSedan(iso, nu)
  if (d === null) return null
  if (d <= 0) return t('hubOverview.panel.today', 'i dag')
  if (d === 1) return t('hubOverview.panel.yesterday', 'i går')
  if (d < 7) return t('hubOverview.panel.daysAgo', { defaultValue: '{{count}} dagar sedan', count: d })
  if (d < 30) return t('hubOverview.panel.weeksAgo', { defaultValue: '{{count}} veckor sedan', count: Math.floor(d / 7) })
  return manadsText(iso, t, sprak, nu) || null
}
