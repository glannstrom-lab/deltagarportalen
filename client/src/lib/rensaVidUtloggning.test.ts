import { describe, it, expect, beforeEach, vi } from 'vitest'
import { registreraRensning, rensaVidUtloggning, _rensaRegisterForTest } from './rensaVidUtloggning'

/**
 * Registrets egen mekanik, isolerad från de riktiga stores. De faktiska
 * stores testas i `src/stores/utloggningNollstaller.test.ts` — den filen
 * importerar de riktiga modulerna och kan därför INTE nollställa registret
 * mellan tester (det skulle radera stores egna rensare). Den här filen kan,
 * eftersom den bara registrerar egna testfunktioner.
 */
describe('rensaVidUtloggning (registret)', () => {
  beforeEach(() => {
    _rensaRegisterForTest()
  })

  it('kör alla registrerade rensare, i registreringsordning', () => {
    const ordning: string[] = []
    registreraRensning(() => ordning.push('a'))
    registreraRensning(() => ordning.push('b'))

    rensaVidUtloggning()

    expect(ordning).toEqual(['a', 'b'])
  })

  it('en rensare som kastar hindrar inte de andra (fail-safe, samma princip som clearUserScopedStorage)', () => {
    const kastar = vi.fn(() => {
      throw new Error('en trasig store')
    })
    const fungerar = vi.fn()
    registreraRensning(kastar)
    registreraRensning(fungerar)
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => rensaVidUtloggning()).not.toThrow()

    expect(kastar).toHaveBeenCalledTimes(1)
    expect(fungerar).toHaveBeenCalledTimes(1)
    consoleSpy.mockRestore()
  })

  it('utan registrerade rensare gör rensaVidUtloggning ingenting — och kraschar inte', () => {
    expect(() => rensaVidUtloggning()).not.toThrow()
  })

  it('_rensaRegisterForTest tömmer registret', () => {
    const fn = vi.fn()
    registreraRensning(fn)
    _rensaRegisterForTest()

    rensaVidUtloggning()

    expect(fn).not.toHaveBeenCalled()
  })
})
