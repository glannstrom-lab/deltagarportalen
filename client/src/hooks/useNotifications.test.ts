/**
 * Skav (persona 2026-09-12): notiserna sorterades bara på `created_at` —
 * ett pass i morgon (skrivet av `skicka_passpaminnelser()` i går kväll)
 * hamnade under en nyare men helt otidskänslig notis, bara för att den var
 * yngre. `sorteraNotiser` (exporterad ur `useNotifications.ts` just för att
 * kunna testas utan React Query/Supabase) ska lyfta fram morgondagens/dagens
 * `aktivitet_*`-notiser oavsett `created_at`, och falla tillbaka på
 * `created_at` inom varje grupp.
 */
import { describe, it, expect } from 'vitest'
import { sorteraNotiser, type Notification } from './useNotifications'
import { formatLocalDate, addDays } from '@/services/aktivitetSchema'

const idag = formatLocalDate(new Date())
const imorgon = addDays(idag, 1)
const forraVeckan = addDays(idag, -7)

function notis(o: Partial<Notification> & Pick<Notification, 'id'>): Notification {
  return {
    user_id: 'u1',
    type: 'message',
    title: 't',
    message: 'm',
    read: false,
    read_at: null,
    action_url: null,
    data: {},
    created_at: '2026-01-01T00:00:00Z',
    ...o,
  }
}

describe('sorteraNotiser', () => {
  it('lyfter en ÄLDRE men tidskänslig notis (i morgon) över en NYARE, otidskänslig', () => {
    // Mutation: ta bort villkoret `brA !== brB` (sortera bara på created_at) → RÖD.
    const gammalMenBradskande = notis({
      id: 'paminnelse',
      type: 'aktivitet_paminnelse',
      data: { date: imorgon },
      created_at: '2026-01-01T08:00:00Z', // äldst
    })
    const nyMenLugn = notis({
      id: 'chatt',
      type: 'message',
      created_at: '2026-01-05T08:00:00Z', // yngst
    })

    const resultat = sorteraNotiser([nyMenLugn, gammalMenBradskande])
    expect(resultat.map((n) => n.id)).toEqual(['paminnelse', 'chatt'])
  })

  it('en aktivitetsnotis om FÖRRA veckan är inte "nära förestående" och sorteras bara på created_at', () => {
    const gammalAktivitet = notis({
      id: 'gammal-aktivitet',
      type: 'aktivitet_pass',
      data: { date: forraVeckan },
      created_at: '2026-01-01T08:00:00Z',
    })
    const nyChatt = notis({
      id: 'ny-chatt',
      type: 'message',
      created_at: '2026-01-05T08:00:00Z',
    })
    const resultat = sorteraNotiser([gammalAktivitet, nyChatt])
    expect(resultat.map((n) => n.id)).toEqual(['ny-chatt', 'gammal-aktivitet'])
  })

  it('behåller created_at (nyast först) som sekundärsortering inom samma brådska', () => {
    const aldreBradskande = notis({
      id: 'plan-gammal',
      type: 'aktivitet_plan',
      data: { date: idag },
      created_at: '2026-02-01T08:00:00Z',
    })
    const nyareBradskande = notis({
      id: 'plan-ny',
      type: 'aktivitet_plan',
      data: { date: idag },
      created_at: '2026-02-02T08:00:00Z',
    })
    const resultat = sorteraNotiser([aldreBradskande, nyareBradskande])
    expect(resultat.map((n) => n.id)).toEqual(['plan-ny', 'plan-gammal'])
  })

  it('en foretag_*-notis har inget datum och rör sig aldrig i sorteringen', () => {
    const foretagsnotis = notis({
      id: 'foretag',
      type: 'foretag_forslag',
      data: { date: imorgon }, // skulle inte hjälpa ändå — typen ingår inte
      created_at: '2026-01-01T08:00:00Z',
    })
    const nyChatt = notis({ id: 'chatt', type: 'message', created_at: '2026-01-05T08:00:00Z' })
    const resultat = sorteraNotiser([foretagsnotis, nyChatt])
    expect(resultat.map((n) => n.id)).toEqual(['chatt', 'foretag'])
  })
})
