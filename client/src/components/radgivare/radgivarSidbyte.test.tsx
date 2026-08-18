/**
 * Rådgivarkolumnen öppnar rätt person när man byter sida.
 *
 * Panelen monteras inte om vid klientnavigering — bara `pathname`-propen
 * ändras. Vilken rådgivare som var utfälld låg därför kvar från förra sidan,
 * och eftersom varje sida har sin egen uppsättning pekade den ofta på någon som
 * inte finns här. Uppmätt i webbläsaren 2026-08-18, navigering /jobb →
 * /karriar → /resurser → /min-vardag:
 *
 *   /jobb        Andreas utfälld     (råkade vara först i listan)
 *   /karriar     ANDRA posten utfälld — 'jobbcoach' låg kvar
 *   /resurser    ingen utfälld       — 'jobbcoach' finns inte där
 *   /min-vardag  ingen utfälld
 *
 * En helt hopfälld kolumn är samma fel som den tomma kolumnen vi tog bort
 * dagen innan: 324 px som ser ut som marginal. Det avgörande med det här
 * testet är att det **byter sida** i stället för att rendera om från noll —
 * direktladdning såg nämligen rätt ut, så felet fanns bara på den väg riktiga
 * användare tar.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import RadgivarPanel from './RadgivarPanel'
import { radgivareForPath } from './radgivarData'
import { COACHES } from '@/data/coaches'

afterEach(cleanup)

/** Namnet på sidans första rådgivare — den som ska stå utfälld i kolumnen. */
function forstaNamnet(path: string): string {
  const innehall = radgivareForPath(path)
  if (!innehall) throw new Error(`Ingen rådgivare för ${path} — testet mäter fel sak`)
  return COACHES[innehall.coachIds[0]].name
}

function utfalldaNamn(): string[] {
  return screen
    .getAllByRole('button', { expanded: true })
    .map((b) => (b.textContent ?? '').trim())
}

describe('rådgivarkolumnen vid sidbyte', () => {
  const SIDOR = ['/jobb', '/karriar', '/resurser', '/min-vardag', '/oversikt']

  it('öppnar sidans egen första rådgivare — även efter att man bytt sida', () => {
    const { rerender } = render(
      <MemoryRouter>
        <RadgivarPanel pathname={SIDOR[0]} iKolumn />
      </MemoryRouter>
    )

    for (const path of SIDOR) {
      // Byt bara propen. Ingen ommontering — precis som vid klientnavigering.
      rerender(
        <MemoryRouter>
          <RadgivarPanel pathname={path} iKolumn />
        </MemoryRouter>
      )
      const utfallda = utfalldaNamn()
      expect(utfallda.length, `${path}: exakt en rådgivare ska vara utfälld`).toBe(1)
      expect(utfallda[0], `${path}: fel rådgivare utfälld`).toContain(forstaNamnet(path))
    }
  })

  it('de fyra hubbarna har rådgivarinnehåll — annars ritas ingen kolumn alls', () => {
    // Fram till 2026-08-18 saknade de det, och `harRadgivarinnehall` gjorde då
    // att Layout inte reserverade kolumnen. Går innehållet förlorat igen
    // försvinner kolumnen tyst i stället för att bli tom — det här testet
    // säger till.
    for (const path of ['/jobb', '/karriar', '/resurser', '/min-vardag']) {
      const innehall = radgivareForPath(path)
      expect(innehall, `${path} saknar rådgivarinnehåll`).not.toBeNull()
      expect(innehall!.coachIds.length, `${path} har ingen rådgivare`).toBeGreaterThan(0)
    }
  })

  it('sist i flödet är allt hopfällt, även efter sidbyte', () => {
    // Under xl faller kolumnen sist på sidan. Där ska ingenting stå utfällt —
    // sidan har oftast redan visat samma råd infogat.
    const { rerender } = render(
      <MemoryRouter>
        <RadgivarPanel pathname="/jobb" iKolumn={false} />
      </MemoryRouter>
    )
    rerender(
      <MemoryRouter>
        <RadgivarPanel pathname="/min-vardag" iKolumn={false} />
      </MemoryRouter>
    )
    expect(screen.queryAllByRole('button', { expanded: true })).toHaveLength(0)
  })
})
