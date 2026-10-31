/**
 * UT2: finns det en lucka i erfarenheten? Tipset om tidsluckor får bara visas
 * när användarens egna datum visar en — annars påstår vi något om henne utan
 * underlag. Datum är `YYYY-MM` (input type="month").
 */
interface Post {
  startDate?: string
  endDate?: string
  current?: boolean
}

const LUCKA_MANADER = 3

function manad(d?: string): number | null {
  const m = /^(\d{4})-(\d{2})/.exec(d ?? '')
  return m ? Number(m[1]) * 12 + Number(m[2]) - 1 : null
}

/** En period utan registrerad erfarenhet. `fran`/`till` är `YYYY-MM`, båda inräknade. */
export interface Tidslucka {
  fran: string
  till: string
  manader: number
}

function tillManadstext(index: number): string {
  const ar = Math.floor(index / 12)
  const m = (index % 12) + 1
  return `${ar}-${String(m).padStart(2, '0')}`
}

/**
 * AIX3: själva perioderna, inte bara ja/nej. Samma regel som tidigare — en
 * lucka är mer än tre månader mellan en posts slut och nästa posts start.
 * Perioden börjar månaden efter förra postens slut och slutar månaden före
 * nästa start. Pågående poster har inget slut och skapar aldrig en lucka.
 */
export function hittaTidsluckor(poster: unknown): Tidslucka[] {
  if (!Array.isArray(poster)) return []
  const perioder = (poster as Post[])
    .map(p => {
      const start = manad(p?.startDate)
      if (start === null) return null
      const slut = p.current ? Infinity : manad(p.endDate)
      return slut === null ? null : { start, slut }
    })
    .filter((p): p is { start: number; slut: number } => p !== null)
    .sort((a, b) => a.start - b.start)
  if (perioder.length < 2) return []
  const luckor: Tidslucka[] = []
  let tackt = perioder[0].slut
  for (const p of perioder.slice(1)) {
    if (p.start - tackt > LUCKA_MANADER) {
      luckor.push({
        fran: tillManadstext(tackt + 1),
        till: tillManadstext(p.start - 1),
        manader: p.start - tackt - 1,
      })
    }
    tackt = Math.max(tackt, p.slut)
  }
  return luckor
}

export function harTidslucka(poster: unknown): boolean {
  return hittaTidsluckor(poster).length > 0
}
