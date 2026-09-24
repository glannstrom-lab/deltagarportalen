/**
 * Jobbevakningens cron-väg frågade Arbetsförmedlingen fel (2026-09-24).
 *
 *  1. LÄNET. Bevakningen sparar länet som NUTS-3 (`SE224`) — koden i
 *     data/afRegions.ts. JobSearch förstår inte NUTS: `region=SE224` ger noll
 *     träffar utan felkod, `region=12` ger länets annonser. Klienten skickar
 *     aldrig koden till AF (den filtrerar lokalt på länsnamn); cron-vägen
 *     skickade den rakt av. Uppmätt mot AF 2026-09-24: prodens enda aktiva
 *     bevakning (Skåne) hade 3 matchande annonser under sin livstid och hittade 0.
 *  2. KOMMUNEN är ett namn ("Malmö"), inte en kommunkod. `municipality=Malmö`
 *     ger noll träffar; klienten lägger namnet i fritexten.
 *  3. VECKOBEVAKNINGEN mejlade bara måndagens nya jobb: cron kör dagligen och
 *     flyttar fram `last_checked_at` varje dygn.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { AF_REGIONS } from '@/data/afRegions'

const require = createRequire(import.meta.url)
const MODUL = resolve(__dirname, '../../api/job-alerts.js')

type Modul = ((req: unknown, res: unknown) => Promise<void>) & {
  byggAfSokparametrar: (p: Record<string, unknown>) => URLSearchParams
  NUTS_TILL_LANSKOD: Record<string, string>
}

function ladda(): Modul {
  delete require.cache[require.resolve(MODUL)]
  return require(MODUL) as Modul
}

function makeRes() {
  const captured: { status: number; body: Record<string, unknown> | null } = { status: 200, body: null }
  const res = {
    statusCode: 200,
    setHeader: vi.fn(),
    status(code: number) { captured.status = code; res.statusCode = code; return res },
    json(body: Record<string, unknown>) { captured.body = body; return res },
    end: vi.fn(),
  }
  return { res, captured }
}

const ENV_KEYS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'CRON_SECRET', 'RESEND_API_KEY', 'EMAIL_FROM', 'SENTRY_DSN']
const saved: Record<string, string | undefined> = {}
const originalFetch = global.fetch

beforeEach(() => {
  for (const k of ENV_KEYS) saved[k] = process.env[k]
  process.env.VITE_SUPABASE_URL = 'https://stub.supabase.co'
  process.env.VITE_SUPABASE_ANON_KEY = 'anon-stub'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-stub'
  process.env.CRON_SECRET = 'hemlig'
  process.env.RESEND_API_KEY = 're-stub'
  process.env.EMAIL_FROM = 'Jobin <noreply@jobin.se>'
  delete process.env.SENTRY_DSN
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
  global.fetch = originalFetch
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const jobb = (id: string) => ({ id, headline: `Jobb ${id}`, employer: { name: 'AB' }, workplace_address: { municipality: 'Malmö' }, publication_date: '2026-09-20T08:00:00Z' })

/**
 * AF-stubben svarar som AF: fler träffar ju längre bakåt `published-after`
 * pekar. Ett fönster som börjar för högst två dygn sedan ger dygnets träff;
 * ett längre fönster ger hela veckans tre.
 */
function stubNetwork(alert: Record<string, unknown>) {
  const afUrler: URL[] = []
  const mejl: Array<Record<string, unknown>> = []
  global.fetch = vi.fn(async (input: unknown, init?: { method?: string; body?: string; headers?: Record<string, string> }) => {
    const url = String(typeof input === 'string' ? input : (input as { url: string }).url)
    const method = (init?.method || 'GET').toUpperCase()
    const json = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

    if (url.startsWith('https://jobsearch.api.jobtechdev.se')) {
      const u = new URL(url)
      afUrler.push(u)
      const efter = new Date(u.searchParams.get('published-after') || 0).getTime()
      const dygn = (Date.now() - efter) / 86_400_000
      return json({ hits: dygn > 2 ? [jobb('1'), jobb('2'), jobb('3')] : [jobb('3')] })
    }
    if (url.startsWith('https://api.resend.com')) {
      mejl.push(JSON.parse(init?.body || '{}'))
      return json({ id: 'm1' })
    }
    if (url.includes('/rest/v1/rpc/check_rate_limit')) return json([{ allowed: true, remaining: 4, reset_at: null }])
    if (url.includes('/rest/v1/job_alerts') && method === 'PATCH') return json([])
    if (url.includes('/rest/v1/job_alerts')) return json(url.includes('select=user_id') ? [{ user_id: 'u1' }] : [alert])
    // `.single()`/`.maybeSingle()` — svaret är ett objekt respektive null.
    if (url.includes('/rest/v1/profiles')) return json({ email: 'anna@jobin-test.se' })
    if (url.includes('/rest/v1/user_preferences')) return json(null)
    if (url.includes('/rest/v1/job_notifications') || url.includes('/rest/v1/notifications') || url.includes('/rest/v1/email_notifications')) return json([], 201)
    throw new Error(`Oväntat nätverksanrop i test: ${method} ${url}`)
  }) as unknown as typeof fetch
  return { afUrler, mejl }
}

const cronReq = { method: 'GET', headers: { authorization: 'Bearer hemlig' }, query: { action: 'check' } }

describe('byggAfSokparametrar: frågan AF faktiskt förstår', () => {
  it('översätter NUTS-3 till länskod', () => {
    const p = ladda().byggAfSokparametrar({ query: 'VD', region: 'SE224' })
    expect(p.get('region')).toBe('12')
  })

  it('skickar ingen länsparameter för en okänd kod hellre än en som ger noll träffar', () => {
    expect(ladda().byggAfSokparametrar({ region: 'SE999' }).has('region')).toBe(false)
  })

  it('lägger kommunnamnet i fritexten, inte i municipality', () => {
    const p = ladda().byggAfSokparametrar({ query: 'lärare', municipality: 'Malmö' })
    expect(p.has('municipality')).toBe(false)
    expect(p.get('q')).toBe('lärare Malmö')
  })

  it('tabellen är samma som afRegions.ts', () => {
    const tabell = ladda().NUTS_TILL_LANSKOD
    expect(Object.keys(tabell).sort()).toEqual(AF_REGIONS.map((r) => r.code).sort())
    for (const r of AF_REGIONS) expect(tabell[r.code], r.code).toBe(r.lanskod)
  })
})

describe('job-alerts cron: länsbunden bevakning', () => {
  it('frågar AF med länskoden, inte NUTS-koden', async () => {
    const { afUrler } = stubNetwork({ id: 'a1', user_id: 'u1', name: 'Ledare', query: 'VD', region: 'SE224', is_active: true, last_checked_at: new Date(Date.now() - 86_400_000).toISOString(), notification_frequency: 'daily' })
    const { res } = makeRes()

    await ladda()(cronReq, res)

    expect(afUrler.length).toBeGreaterThan(0)
    expect(afUrler[0].searchParams.get('region')).toBe('12')
  })
})

describe('job-alerts cron: veckobevakningen', () => {
  it('måndagens mejl bär hela veckans jobb, inte bara dygnets', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-28T06:00:00Z')) // måndag
    const { mejl } = stubNetwork({ id: 'a1', user_id: 'u1', name: 'Lager', query: 'lager', is_active: true, last_checked_at: '2026-09-27T06:00:00Z', notification_frequency: 'weekly' })
    const { res } = makeRes()

    await ladda()(cronReq, res)

    expect(mejl).toHaveLength(1)
    expect(String(mejl[0].subject)).toContain('3 nya jobb')
  })

  it('veckobevakningen mejlar inte på en tisdag', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-29T06:00:00Z')) // tisdag
    const { mejl } = stubNetwork({ id: 'a1', user_id: 'u1', name: 'Lager', query: 'lager', is_active: true, last_checked_at: '2026-09-28T06:00:00Z', notification_frequency: 'weekly' })
    const { res } = makeRes()

    await ladda()(cronReq, res)

    expect(mejl).toHaveLength(0)
  })

  it('dagliga bevakningen mejlar dygnets jobb som förut', async () => {
    const { mejl } = stubNetwork({ id: 'a1', user_id: 'u1', name: 'Lager', query: 'lager', is_active: true, last_checked_at: new Date(Date.now() - 86_400_000).toISOString(), notification_frequency: 'daily' })
    const { res } = makeRes()

    await ladda()(cronReq, res)

    expect(mejl).toHaveLength(1)
    expect(String(mejl[0].subject)).toContain('1 nya jobb')
  })
})
