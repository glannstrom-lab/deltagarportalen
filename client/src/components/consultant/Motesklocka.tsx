/**
 * Motesklocka — ringen som visar dagar kvar till 14-dagarsgränsen (Rusta och
 * matcha), och datum för nästa fysiska möte. Logiken bor i motesklockaRegel.ts.
 *
 * Ringen är aldrig ensam bärare av beskedet: talet i mitten, rubriken och
 * raden under säger samma sak i ord. Färgerna är statustokens (--s-*).
 */
import { MOTE_GRANS_DAGAR } from '@/services/moteskadens'
import { statusFarg } from '@/components/ui/kvarterStatus'
import { motesklockaText, type Motesklocka as Klocka } from './motesklockaRegel'

const R = 23
const OMKRETS = 2 * Math.PI * R

export function Motesklocka({ klocka }: { klocka: Klocka }) {
  const { rubrik, rad } = motesklockaText(klocka)
  const farg = statusFarg(klocka.status)
  const dagarGatt = klocka.dagarKvar === null ? null : MOTE_GRANS_DAGAR - klocka.dagarKvar
  const ringText = klocka.dagarKvar === null ? '–' : klocka.dagarKvar < 0 ? '!' : String(klocka.dagarKvar)
  const ringEtikett = dagarGatt === null
    ? 'Inget genomfört möte'
    : klocka.dagarKvar !== null && klocka.dagarKvar < 0
      ? `${-klocka.dagarKvar} dagar över ${MOTE_GRANS_DAGAR}-dagarsgränsen`
      : `${dagarGatt} av ${MOTE_GRANS_DAGAR} dagar har gått`
  return (
    <div className="flex items-center gap-4" data-testid="motesklocka" data-status={klocka.status}>
      <svg viewBox="0 0 56 56" width="64" height="64" role="img" aria-label={ringEtikett} className="shrink-0">
        <circle cx="28" cy="28" r={R} fill="none" stroke="var(--j-sankt)" strokeWidth="7" />
        {klocka.andel > 0 && (
          <circle
            cx="28" cy="28" r={R} fill="none" stroke={farg.ikon} strokeWidth="7" strokeLinecap="round"
            strokeDasharray={`${(klocka.andel * OMKRETS).toFixed(1)} ${OMKRETS.toFixed(1)}`}
            transform="rotate(-90 28 28)"
          />
        )}
        <text x="28" y="33" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--j-blak)" className="font-rubrik">
          {ringText}
        </text>
      </svg>
      <div className="grid gap-0.5 min-w-0">
        <p className="m-0 font-semibold text-[var(--j-blak)]">{rubrik}</p>
        <p className="m-0 text-sm leading-5 text-[var(--j-blak-2)]">{rad}</p>
      </div>
    </div>
  )
}
