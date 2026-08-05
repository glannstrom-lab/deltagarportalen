import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { logger, apiLogger, createLogger, getErrorQueue, clearErrorQueue } from './logger'

/**
 * logger.ts har 20 importörer och är enda tillåtna vägen till console
 * (no-console-regeln pekar hit). Den intressanta delen är `extractErrorInfo`:
 * Supabase/PostgREST-fel är vanliga objekt, inte Error-instanser, och
 * `String(obj)` ger "[object Object]". Går den avkodningen sönder blir varje
 * databasfel i produktionsloggen oläsbart — samma tysta klass av fel som
 * `if (error) { console.error(...); return [] }`.
 */
describe('logger', () => {
  let spies: Record<string, ReturnType<typeof vi.spyOn>>

  beforeEach(() => {
    spies = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      group: vi.spyOn(console, 'group').mockImplementation(() => {}),
      groupEnd: vi.spyOn(console, 'groupEnd').mockImplementation(() => {}),
      time: vi.spyOn(console, 'time').mockImplementation(() => {}),
      timeEnd: vi.spyOn(console, 'timeEnd').mockImplementation(() => {}),
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('taggar raden med nivå och tidsstämpel', () => {
    logger.info('Deltagare inloggad')

    const [rubrik, meddelande] = spies.info.mock.calls[0]
    expect(rubrik).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3} \[INFO\]$/)
    expect(meddelande).toBe('Deltagare inloggad')
  })

  it('namngivna loggers lägger till sitt prefix', () => {
    apiLogger.warn('Långsamt svar')

    expect(spies.warn.mock.calls[0][0]).toContain('[WARN][API]')
  })

  it('skickar med kontexten som tredje argument', () => {
    logger.info('Sparat', { userId: 'abc' })

    expect(spies.info.mock.calls[0][2]).toEqual({ userId: 'abc' })
  })

  it('utan kontext skickas tom sträng, inte undefined', () => {
    logger.info('Inget extra')

    expect(spies.info.mock.calls[0][2]).toBe('')
  })

  describe('error() — felavkodning', () => {
    it('plockar ut message och stack ur ett Error', () => {
      const err = new Error('Nätverket dog')
      logger.error('Anropet misslyckades', { error: err })

      const kontext = spies.error.mock.calls[0][2] as { errorMessage: string; stack?: string }
      expect(kontext.errorMessage).toBe('Nätverket dog')
      expect(kontext.stack).toContain('Error: Nätverket dog')
    })

    it('avkodar Supabase-fel (vanligt objekt) till läsbar text — inte [object Object]', () => {
      logger.error('RLS-fel', {
        error: {
          message: 'permission denied for table profiles',
          code: '42501',
          details: 'RLS blockerade',
          hint: 'kontrollera policy',
        },
      })

      const kontext = spies.error.mock.calls[0][2] as { errorMessage: string }
      expect(kontext.errorMessage).toBe(
        'permission denied for table profiles | code=42501 | RLS blockerade | hint=kontrollera policy'
      )
      expect(kontext.errorMessage).not.toContain('[object Object]')
    })

    it('klarar Supabase-fel som bara har message', () => {
      logger.error('Fel', { error: { message: 'bara ett meddelande' } })

      const kontext = spies.error.mock.calls[0][2] as { errorMessage: string }
      expect(kontext.errorMessage).toBe('bara ett meddelande')
    })

    it('serialiserar objekt utan message till JSON', () => {
      logger.error('Okänt', { error: { status: 500, body: 'nej' } })

      const kontext = spies.error.mock.calls[0][2] as { errorMessage: string }
      expect(kontext.errorMessage).toBe('{"status":500,"body":"nej"}')
    })

    it('tar strängfel rakt av', () => {
      logger.error('Fel', { error: 'något gick fel' })

      const kontext = spies.error.mock.calls[0][2] as { errorMessage: string }
      expect(kontext.errorMessage).toBe('något gick fel')
    })

    it('lämnar kontexten orörd när ingen error skickats med', () => {
      logger.error('Bara ett meddelande', { userId: 'abc' })

      expect(spies.error.mock.calls[0][2]).toEqual({ userId: 'abc' })
    })
  })

  describe('group / time', () => {
    it('kör callbacken inuti en console-grupp', () => {
      const fn = vi.fn()
      logger.group('Laddar profil', fn)

      expect(spies.group).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledTimes(1)
      expect(spies.groupEnd).toHaveBeenCalledTimes(1)
    })

    it('stänger gruppen även när callbacken kastar', () => {
      expect(() =>
        logger.group('Trasig', () => {
          throw new Error('boom')
        })
      ).toThrow('boom')

      expect(spies.groupEnd).toHaveBeenCalledTimes(1)
    })

    it('kör callbacken ändå när loggern är avstängd', () => {
      const tyst = createLogger({ enabled: false })
      const fn = vi.fn()

      tyst.group('Tyst', fn)

      expect(fn).toHaveBeenCalledTimes(1)
      expect(spies.group).not.toHaveBeenCalled()
    })

    it('time/timeEnd prefixas med loggerns namn', () => {
      const cv = createLogger({ prefix: 'CV' })
      cv.time('render')
      cv.timeEnd('render')

      expect(spies.time).toHaveBeenCalledWith('[CV] render')
      expect(spies.timeEnd).toHaveBeenCalledWith('[CV] render')
    })
  })

  describe('avstängd logger', () => {
    it('tystar debug/info/log men släpper igenom warn och error', () => {
      const tyst = createLogger({ prefix: 'Tyst', enabled: false })

      tyst.debug('a')
      tyst.info('b')
      tyst.log('c')
      tyst.time('d')
      tyst.timeEnd('d')
      expect(spies.debug).not.toHaveBeenCalled()
      expect(spies.info).not.toHaveBeenCalled()
      expect(spies.log).not.toHaveBeenCalled()
      expect(spies.time).not.toHaveBeenCalled()
      expect(spies.timeEnd).not.toHaveBeenCalled()

      tyst.warn('viktigt')
      tyst.error('kritiskt')
      expect(spies.warn).toHaveBeenCalledTimes(1)
      expect(spies.error).toHaveBeenCalledTimes(1)
    })
  })

  describe('felkön', () => {
    it('är tom i test/dev — kön fylls bara i produktion', () => {
      clearErrorQueue()
      logger.error('Ett fel')

      expect(getErrorQueue()).toEqual([])
    })

    it('getErrorQueue returnerar en kopia, inte den interna arrayen', () => {
      clearErrorQueue()
      const a = getErrorQueue()
      const b = getErrorQueue()

      expect(a).not.toBe(b)
    })
  })
})
