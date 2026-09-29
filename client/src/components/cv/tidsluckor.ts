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

export function harTidslucka(poster: unknown): boolean {
  if (!Array.isArray(poster)) return false
  const perioder = (poster as Post[])
    .map(p => {
      const start = manad(p?.startDate)
      if (start === null) return null
      const slut = p.current ? Infinity : manad(p.endDate)
      return slut === null ? null : { start, slut }
    })
    .filter((p): p is { start: number; slut: number } => p !== null)
    .sort((a, b) => a.start - b.start)
  if (perioder.length < 2) return false
  let tackt = perioder[0].slut
  for (const p of perioder.slice(1)) {
    if (p.start - tackt > LUCKA_MANADER) return true
    tackt = Math.max(tackt, p.slut)
  }
  return false
}
