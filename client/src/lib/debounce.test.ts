import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { debounce, throttle } from './debounce'

/**
 * debounce.ts är inte dekoration — `profileStore._debouncedSavePreferences`
 * bygger på den, och det är den som avgör om en deltagares profiländringar
 * skrivs till Supabase eller inte.
 *
 * ⚠️ FYND (D13, 2026-08-05): implementationen har en skarp bugg. `leadingEdge()`
 * (debounce.ts:44-50) startar ALDRIG någon timer — lodash gör det, den här
 * kopian tappade raden. Följden: det FÖRSTA anropet efter en tyst period
 * schemalägger ingenting och försvinner tyst. Först när ett andra anrop kommer
 * inom fönstret startas en timer. Reproducerat utan vitest, med riktiga timers.
 *
 * Praktisk konsekvens: bockar en deltagare i EN inställning på profilsidan och
 * lämnar sidan, sparas den aldrig till `user_preferences`.
 *
 * ÅTGÄRDAD 2026-08-05: `leadingEdge()` saknade `startTimer(timerExpired, wait)`,
 * så `debounced()` satte `lastArgs` men ingen trailing edge kallades någonsin.
 * De två första testerna nedan är regressionsvakter för just den raden — de var
 * `it.fails` medan buggen fanns och vändes när den lagades.
 */
describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('ett enskilt anrop går fram — regressionsvakt för den tappade timern', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced('en ensam ändring')
    vi.advanceTimersByTime(5000)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('en ensam ändring')
  })

  it('varje anrop efter en tyst period går fram, inte bara det andra', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced('a')
    vi.advanceTimersByTime(5000)
    expect(fn).toHaveBeenCalledTimes(1)

    debounced('b')
    vi.advanceTimersByTime(5000)
    expect(fn).toHaveBeenCalledTimes(2)

    expect(fn).toHaveBeenNthCalledWith(1, 'a')
    expect(fn).toHaveBeenNthCalledWith(2, 'b')
  })

  it('slår ihop en skur av anrop till ETT anrop med de sista argumenten', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced('a')
    vi.advanceTimersByTime(30)
    debounced('b')
    vi.advanceTimersByTime(30)
    debounced('c')
    vi.advanceTimersByTime(200)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('c')
  })

  it('väntar hela fönstret efter det sista anropet, inte det första', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced('a')
    vi.advanceTimersByTime(50)
    debounced('b')
    vi.advanceTimersByTime(80) // 130 ms sedan 'a', bara 80 sedan 'b'
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(40)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('anropar direkt med leading:true och inte igen på trailing-kanten', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100, { leading: true, trailing: false })

    debounced('första')
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('första')

    debounced('andra')
    vi.advanceTimersByTime(500)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('cancel() gör att det uppskjutna anropet aldrig sker', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced('a')
    debounced('förlorad')
    debounced.cancel()
    vi.advanceTimersByTime(500)

    expect(fn).not.toHaveBeenCalled()
  })

  it('flush() kör det väntande anropet omedelbart och bara en gång', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced('a')
    debounced('nu')
    expect(fn).not.toHaveBeenCalled()

    debounced.flush()
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('nu')

    vi.advanceTimersByTime(500)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('flush() utan väntande anrop gör ingenting', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced.flush()
    expect(fn).not.toHaveBeenCalled()
  })

  it('behåller `this` från anropsplatsen', () => {
    const seen: unknown[] = []
    const obj = {
      namn: 'profilen',
      spara: debounce(function (this: unknown) {
        seen.push(this)
      }, 50),
    }

    obj.spara()
    obj.spara()
    vi.advanceTimersByTime(100)

    expect(seen).toHaveLength(1)
    expect((seen[0] as { namn?: string })?.namn).toBe('profilen')
  })
})

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-05T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('kör första anropet direkt', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled('a')

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('a')
  })

  it('släpper igenom max ett anrop per fönster och kör sedan det sista', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled('a')
    vi.advanceTimersByTime(10)
    throttled('b')
    vi.advanceTimersByTime(10)
    throttled('c')

    expect(fn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith('c')
  })

  it('kör direkt igen när fönstret hunnit löpa ut', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled('a')
    vi.advanceTimersByTime(150)
    throttled('b')

    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith('b')
  })

  it('cancel() stoppar det schemalagda efterföljande anropet', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled('a')
    throttled('b')
    throttled.cancel()
    vi.advanceTimersByTime(500)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('a')
  })

  it('behåller `this` från anropsplatsen', () => {
    const seen: unknown[] = []
    const obj = {
      id: 'scroll',
      rapportera: throttle(function (this: unknown) {
        seen.push(this)
      }, 100),
    }

    obj.rapportera()

    expect((seen[0] as { id?: string })?.id).toBe('scroll')
  })
})
