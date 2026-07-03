/**
 * Sveriges 21 län med NUTS-koder — samma koder som Arbetsförmedlingens
 * JobSearch-API använder som region-parameter.
 *
 * ENDA källan för län i jobbsök-flödet. Tidigare fanns fyra olika listor
 * (JobSearch 19 län, AlertsTab 5, profile/constants 15 ortnamn, plus
 * mappningar i arbetsformedlingenApi) — bevakningar kunde t.ex. bara
 * skapas för 5 län.
 */

export interface AfRegion {
  /** NUTS-3-kod, t.ex. 'SE110' */
  code: string
  /** Länsnamn för visning, t.ex. 'Stockholms län' */
  name: string
}

export const AF_REGIONS: AfRegion[] = [
  { code: 'SE110', name: 'Stockholms län' },
  { code: 'SE232', name: 'Västra Götalands län' },
  { code: 'SE224', name: 'Skåne län' },
  { code: 'SE121', name: 'Uppsala län' },
  { code: 'SE122', name: 'Södermanlands län' },
  { code: 'SE123', name: 'Östergötlands län' },
  { code: 'SE211', name: 'Jönköpings län' },
  { code: 'SE212', name: 'Kronobergs län' },
  { code: 'SE213', name: 'Kalmar län' },
  { code: 'SE214', name: 'Gotlands län' },
  { code: 'SE221', name: 'Blekinge län' },
  { code: 'SE231', name: 'Hallands län' },
  { code: 'SE311', name: 'Värmlands län' },
  { code: 'SE124', name: 'Örebro län' },
  { code: 'SE125', name: 'Västmanlands län' },
  { code: 'SE312', name: 'Dalarnas län' },
  { code: 'SE313', name: 'Gävleborgs län' },
  { code: 'SE321', name: 'Västernorrlands län' },
  { code: 'SE322', name: 'Jämtlands län' },
  { code: 'SE331', name: 'Västerbottens län' },
  { code: 'SE332', name: 'Norrbottens län' },
]

/** Länsnamn från NUTS-kod — faller tillbaka till koden om okänd. */
export function getAfRegionName(code: string): string {
  return AF_REGIONS.find((r) => r.code === code)?.name ?? code
}
