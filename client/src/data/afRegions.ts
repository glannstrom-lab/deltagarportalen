/**
 * Sveriges 21 län med NUTS-koder — samma koder som Arbetsförmedlingens
 * JobSearch-API använder som region-parameter.
 *
 * ENDA källan för län i jobbsök-flödet. Tidigare fanns fyra olika listor
 * (JobSearch 19 län, AlertsTab 5, profile/constants 15 ortnamn, plus
 * mappningar i arbetsformedlingenApi) — bevakningar kunde t.ex. bara
 * skapas för 5 län.
 *
 * ## Två kodsystem, inte ett (tillagt 2026-08-26, O8)
 *
 * Arbetsförmedlingen använder **två olika länskoder i två olika API:er**, och
 * det är inte uppenbart förrän man försöker joina dem:
 *
 * - **NUTS-3** (`SE110`) — JobSearch, alltså jobbsöket och bevakningarna.
 * - **SCB:s länskod** (`01`) — Yrkesbarometern på `data.jobtechdev.se`, som är
 *   källan för bristläge och prognos per yrke och län.
 *
 * Utan `lanskod` går det inte att säga "finns det jobb i ditt län" om ett yrke
 * — man har regionen i ett system och prognosen i ett annat. Koderna nedan är
 * **verifierade mot den skarpa filen** (utgåva 2026:1, hämtad 2026-08-26): alla
 * 21 lästes ur `lan`-fältet och stämdes av mot länsnamnet i
 * `text_jobbmojligheter`, inte skrivna ur minnet.
 *
 * SCB:s serie har luckor (02, 11, 15, 16 finns inte) — det är sammanslagna län,
 * inte ett fel i listan. Yrkesbarometern använder dessutom `"00"` för riket;
 * det är ingen region och finns därför inte här.
 */

export interface AfRegion {
  /** NUTS-3-kod, t.ex. 'SE110'. Används av JobSearch-API:et. */
  code: string
  /** Länsnamn för visning, t.ex. 'Stockholms län' */
  name: string
  /** SCB:s länskod, två siffror, t.ex. '01'. Används av Yrkesbarometern. */
  lanskod: string
}

export const AF_REGIONS: AfRegion[] = [
  { code: 'SE110', name: 'Stockholms län', lanskod: '01' },
  { code: 'SE232', name: 'Västra Götalands län', lanskod: '14' },
  { code: 'SE224', name: 'Skåne län', lanskod: '12' },
  { code: 'SE121', name: 'Uppsala län', lanskod: '03' },
  { code: 'SE122', name: 'Södermanlands län', lanskod: '04' },
  { code: 'SE123', name: 'Östergötlands län', lanskod: '05' },
  { code: 'SE211', name: 'Jönköpings län', lanskod: '06' },
  { code: 'SE212', name: 'Kronobergs län', lanskod: '07' },
  { code: 'SE213', name: 'Kalmar län', lanskod: '08' },
  { code: 'SE214', name: 'Gotlands län', lanskod: '09' },
  { code: 'SE221', name: 'Blekinge län', lanskod: '10' },
  { code: 'SE231', name: 'Hallands län', lanskod: '13' },
  { code: 'SE311', name: 'Värmlands län', lanskod: '17' },
  { code: 'SE124', name: 'Örebro län', lanskod: '18' },
  { code: 'SE125', name: 'Västmanlands län', lanskod: '19' },
  { code: 'SE312', name: 'Dalarnas län', lanskod: '20' },
  { code: 'SE313', name: 'Gävleborgs län', lanskod: '21' },
  { code: 'SE321', name: 'Västernorrlands län', lanskod: '22' },
  { code: 'SE322', name: 'Jämtlands län', lanskod: '23' },
  { code: 'SE331', name: 'Västerbottens län', lanskod: '24' },
  { code: 'SE332', name: 'Norrbottens län', lanskod: '25' },
]

/** Länsnamn från NUTS-kod — faller tillbaka till koden om okänd. */
export function getAfRegionName(code: string): string {
  return AF_REGIONS.find((r) => r.code === code)?.name ?? code
}

/**
 * NUTS-3-kod → SCB:s länskod. Bryggan mellan jobbsöket och Yrkesbarometern.
 *
 * Returnerar `null` för okänd kod i stället för att gissa — en felaktig länskod
 * ger tyst fel prognos, vilket är värre än ingen prognos alls.
 */
export function getLanskod(code: string): string | null {
  return AF_REGIONS.find((r) => r.code === code)?.lanskod ?? null
}
