/**
 * "Idag" är användarens dag, inte UTC:s.
 *
 * Mönstret `new Date().toISOString().split('T')[0]` ger UTC-datumet. I Sverige
 * (UTC+1/+2) betyder det att allt som görs mellan midnatt och kl. 01/02 får
 * GÅRDAGENS datum. Konsekvenserna i services/ före 2026-09-22:
 *
 *  · moodApi.logMood gör upsert på (user_id, log_date) — humöret man loggade
 *    kl. 00:30 skrev ÖVER gårdagens humör, och dagens rad saknades.
 *  · weeklyGoalsApi: ett veckomål skrivet måndag 00:30 sparades med
 *    week_start = söndagen, och "den här veckan" visade det aldrig.
 *  · påminnelser, nätverkskontakter, tacksamhet, streak — samma fel.
 *
 * Testerna låser tidszonen till Europe/Stockholm och systemtiden till
 * 22:30 UTC — alltså 00:30 lokal tid, en ny dag lokalt men inte i UTC.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- supabase-builder-mock kräver any-typad chainable */
process.env.TZ = 'Europe/Stockholm'

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const anrop: { table: string; metod: string; args: any[] }[] = []

function builder(table: string) {
  const b: any = {}
  for (const m of ['select', 'insert', 'update', 'upsert', 'delete', 'eq', 'gte', 'lte', 'order', 'limit', 'range', 'overlaps']) {
    b[m] = vi.fn((...args: any[]) => {
      anrop.push({ table, metod: m, args })
      return b
    })
  }
  b.single = vi.fn(() => Promise.resolve({ data: { id: 'x' }, error: null }))
  b.maybeSingle = vi.fn(() => Promise.resolve({ data: null, error: null }))
  b.then = (res: any, rej: any) => Promise.resolve({ data: [], error: null }).then(res, rej)
  return b
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
    from: (table: string) => builder(table),
  },
}))
vi.mock('@/lib/logger', () => ({
  storageLogger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  jobLogger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  apiLogger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { moodApi } from './cloud/maende'
import { weeklyGoalsApi, gratitudeApi, moodLogsApi } from './diaryApi'
import { applicationRemindersApi } from './applicationsApi'
import { searchJobs } from './arbetsformedlingenApi'

function eqVarde(table: string, kolumn: string): unknown {
  const rad = anrop.find(a => a.table === table && a.metod === 'eq' && a.args[0] === kolumn)
  return rad?.args[1]
}

function skrivet(table: string, metod: 'insert' | 'upsert'): any {
  return anrop.find(a => a.table === table && a.metod === metod)?.args[0]
}

beforeEach(() => {
  anrop.length = 0
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('förutsättning — testet körs verkligen i svensk tid', () => {
  it('22:30 UTC är 00:30 nästa dag lokalt', () => {
    vi.setSystemTime(new Date('2026-09-22T22:30:00Z'))
    expect(new Date().getDate()).toBe(23)
    // Den gamla koden hade sagt 22:
    expect(new Date().toISOString().split('T')[0]).toBe('2026-09-22')
  })
})

describe('moodApi (Hälsa-sidan) — dagens humör', () => {
  it('logMood kl. 00:30 skriver dagens datum, inte gårdagens', async () => {
    vi.setSystemTime(new Date('2026-09-22T22:30:00Z'))
    await moodApi.logMood('good')
    expect(skrivet('mood_logs', 'upsert').log_date).toBe('2026-09-23')
  })

  it('getTodaysMood kl. 00:30 frågar efter dagens rad', async () => {
    vi.setSystemTime(new Date('2026-09-22T22:30:00Z'))
    await moodApi.getTodaysMood()
    expect(eqVarde('mood_logs', 'log_date')).toBe('2026-09-23')
  })
})

describe('diaryApi — dagbokens humör, tacksamhet och veckomål', () => {
  it('moodLogsApi.getToday kl. 00:30 frågar efter dagens rad', async () => {
    vi.setSystemTime(new Date('2026-09-22T22:30:00Z'))
    await moodLogsApi.getToday()
    expect(eqVarde('mood_logs', 'log_date')).toBe('2026-09-23')
  })

  it('gratitudeApi.create kl. 00:30 daterar inlägget till idag', async () => {
    vi.setSystemTime(new Date('2026-09-22T22:30:00Z'))
    await gratitudeApi.create({ item1: 'kaffe' })
    expect(skrivet('gratitude_entries', 'insert').entry_date).toBe('2026-09-23')
  })

  it('ett veckomål skrivet måndag 00:30 hör till den veckan (måndagen), inte till söndagen', async () => {
    // Måndag 2026-09-21 kl. 00:30 svensk tid = söndag 20 sept 22:30 UTC.
    vi.setSystemTime(new Date('2026-09-20T22:30:00Z'))
    await weeklyGoalsApi.create({ goal_text: 'Ring två företag' })
    expect(skrivet('weekly_goals', 'insert').week_start).toBe('2026-09-21')

    anrop.length = 0
    await weeklyGoalsApi.getCurrentWeek()
    expect(eqVarde('weekly_goals', 'week_start')).toBe('2026-09-21')
  })

  it('söndag kväll hör fortfarande till veckan som började måndagen innan', async () => {
    vi.setSystemTime(new Date('2026-09-27T20:00:00Z')) // söndag 22:00 lokalt
    await weeklyGoalsApi.getCurrentWeek()
    expect(eqVarde('weekly_goals', 'week_start')).toBe('2026-09-21')
  })
})

describe('Platsbanken — "Publicerade idag"', () => {
  it('kl. 00:30 skickar published-after = idag, inte gårdagen', async () => {
    vi.setSystemTime(new Date('2026-09-22T22:30:00Z'))
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ hits: [], total: { value: 0 } }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    try {
      await searchJobs({ query: 'lagerarbetare-idag-test', publishedWithin: 'today' })
      const url = new URL(String((fetchMock.mock.calls[0] as unknown[])[0]))
      expect(url.searchParams.get('published-after')).toBe('2026-09-23')
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

describe('grind — inget UTC-datum som "idag" i services/', () => {
  // Kvarvarande träffar är genomgångna och korrekta: de räknar på ett datum
  // som redan är UTC-midnatt (`new Date('YYYY-MM-DD')` eller `T00:00:00Z`)
  // och skriver tillbaka samma dag. Lägg bara till en rad här om samma sak
  // gäller — annars: använd formatLocalDate() ur aktivitetSchema.ts.
  const TILLATNA: Record<string, number> = {
    'aktivitetApi.ts': 1, // listIPeriod: `${datum}T12:00:00Z` ± dygn i UTC
    'placeringarApi.ts': 2, // `${startDate}T00:00:00Z` + veckor/månader i UTC
    'calendarIntegration.ts': 1, // handelseDatum: new Date('YYYY-MM-DD') tur och retur
  }

  it('toISOString().split/slice som datum förekommer bara på granskade ställen', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const rot = path.resolve(__dirname)
    const traffar: Record<string, number> = {}
    const ga = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name)
        if (e.isDirectory()) { ga(p); continue }
        if (!/\.ts$/.test(e.name) || /\.test\.ts$/.test(e.name)) continue
        const kod = fs.readFileSync(p, 'utf8')
          .split('\n')
          .filter(rad => !/^\s*(\*|\/\/|\/\*)/.test(rad))
          .join('\n')
        const n = (kod.match(/toISOString\(\)\.(split\(['"]T['"]\)\[0\]|slice\(0,\s*10\)|substring\(0,\s*10\))/g) || []).length
        if (n > 0) traffar[path.relative(rot, p).replace(/\\/g, '/')] = n
      }
    }
    ga(rot)
    expect(traffar).toEqual(TILLATNA)
  })
})

describe('applicationRemindersApi — dagens påminnelser', () => {
  it('getToday kl. 00:30 visar dagens påminnelser', async () => {
    vi.setSystemTime(new Date('2026-09-22T22:30:00Z'))
    await applicationRemindersApi.getToday()
    expect(eqVarde('application_reminders', 'reminder_date')).toBe('2026-09-23')
  })
})
