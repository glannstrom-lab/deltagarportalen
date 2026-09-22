/**
 * Intresseguidens autosparning — senaste vinner (kvalitetsgenomgången 2026-09-22).
 *
 * TestTab anropar `saveProgress` vid varje ändring: 4 516 skrivningar i prod.
 * Upsert:arna gick parallellt, så en äldre som kom fram sist skrev över nyare
 * svar — och en autosparning med `is_completed: false` kunde landa EFTER
 * "Visa resultat" och göra ett klart test oklart igen.
 *
 * Mutationer (kontrollerade): skriv direkt i saveProgress utan kö → test 1–4
 * faller; ta bort `while (spar.pagaende)` → test 2 faller; ta bort
 * `avbrytVantande()` i reset → test 4 faller.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

type Rad = Record<string, unknown>
const skrivet: Rad[] = []
let databasen: Rad | null = null
const svarare: Array<() => void> = []
let manuell = false

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
    from: () => ({
      upsert: (rad: Rad) => {
        skrivet.push(rad)
        const klar = () => { databasen = rad }
        if (!manuell) { klar(); return Promise.resolve({ error: null }) }
        // Långsamt nät: raden landar först när testet släpper den.
        return new Promise(res => svarare.push(() => { klar(); res({ error: null }) }))
      },
      delete: () => ({ eq: async () => { databasen = null; return { error: null } } }),
    }),
  },
}))
vi.mock('@/lib/logger', () => ({
  storageLogger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { interestGuideApi, SPAR_FORDROJNING_MS } from './cloud/intresseguide'

const tick = async () => { for (let i = 0; i < 20; i++) await Promise.resolve() }

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  skrivet.length = 0
  svarare.length = 0
  databasen = null
  manuell = false
})
afterEach(async () => {
  // Kön ligger på modulnivå — släpp allt som hänger så nästa test börjar rent.
  manuell = false
  while (svarare.length) { svarare.shift()!(); await tick() }
  await interestGuideApi.flushProgress()
  await tick()
  while (svarare.length) { svarare.shift()!(); await tick() }
  vi.useRealTimers()
})

describe('interestGuideApi.saveProgress — senaste vinner', () => {
  it('tre snabba ändringar blir EN skrivning med de senaste svaren', async () => {
    const a = interestGuideApi.saveProgress({ current_step: 1, answers: { q1: 1 } })
    const b = interestGuideApi.saveProgress({ current_step: 2, answers: { q1: 1, q2: 2 } })
    const c = interestGuideApi.saveProgress({ current_step: 3, answers: { q1: 1, q2: 2, q3: 3 } })
    await vi.advanceTimersByTimeAsync(SPAR_FORDROJNING_MS)
    await expect(Promise.all([a, b, c])).resolves.toEqual([true, true, true])
    expect(skrivet).toHaveLength(1)
    expect(databasen).toMatchObject({ current_step: 3 })
  })

  it('en äldre skrivning som dröjer kan inte landa efter en nyare', async () => {
    manuell = true
    void interestGuideApi.saveProgress({ current_step: 1 })
    await vi.advanceTimersByTimeAsync(SPAR_FORDROJNING_MS)
    expect(skrivet).toHaveLength(1) // steg 1 är på väg, långsamt

    const nyare = interestGuideApi.saveProgress({ current_step: 2 })
    await vi.advanceTimersByTimeAsync(SPAR_FORDROJNING_MS)
    // Nästa skrivning startar inte förrän den förra landat.
    expect(skrivet).toHaveLength(1)

    svarare.shift()!()
    await vi.advanceTimersByTimeAsync(0)
    await tick()
    expect(skrivet).toHaveLength(2)
    svarare.shift()!()
    await expect(nyare).resolves.toBe(true)
    expect(databasen).toMatchObject({ current_step: 2 })
  })

  it('"Visa resultat" (is_completed) skrivs direkt och kan inte skrivas över av en autosparning', async () => {
    manuell = true
    void interestGuideApi.saveProgress({ current_step: 33, is_completed: false })
    await vi.advanceTimersByTimeAsync(SPAR_FORDROJNING_MS)
    // Autosparningen är på väg när användaren trycker "Visa resultat".
    void interestGuideApi.saveProgress({ current_step: 34, is_completed: false })
    const klar = interestGuideApi.saveProgress({ current_step: 34, is_completed: true })

    svarare.shift()!()
    await vi.advanceTimersByTimeAsync(0)
    await tick()
    svarare.shift()!()
    await expect(klar).resolves.toBe(true)
    await vi.advanceTimersByTimeAsync(SPAR_FORDROJNING_MS * 2)

    expect(databasen).toMatchObject({ is_completed: true })
    expect(skrivet.at(-1)).toMatchObject({ is_completed: true })
  })

  it('"Börja om" avbryter en väntande autosparning — raden återuppstår inte', async () => {
    const vantande = interestGuideApi.saveProgress({ current_step: 5, answers: { q1: 4 } })
    await interestGuideApi.reset()
    await vi.advanceTimersByTimeAsync(SPAR_FORDROJNING_MS * 2)
    await expect(vantande).resolves.toBe(false)
    expect(skrivet).toHaveLength(0)
    expect(databasen).toBeNull()
  })

  it('flushProgress skriver det som väntar direkt (sidbyte, stängd flik)', async () => {
    void interestGuideApi.saveProgress({ current_step: 7 })
    await expect(interestGuideApi.flushProgress()).resolves.toBe(true)
    expect(databasen).toMatchObject({ current_step: 7 })
  })
})
