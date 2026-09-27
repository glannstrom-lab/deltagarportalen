/**
 * orgApi — kolleginbjudan via mejl (2026-09-27).
 *
 * Det som vaktas är kontraktet mot tabellen invitations och edge-funktionen,
 * inte Supabase-klienten:
 *  - INSERT skickar BARA e-post, organisation och roll (metadata.kind 'kollega');
 *    rollen CONSULTANT, consultant_id och token sätts av triggern — klienten
 *    skickar dem inte, så ingen klient kan "råka" ge sig själv något
 *  - databasens nej KASTAS (då finns ingen inbjudan)
 *  - ett mejlfel kastas INTE: inbjudan finns, och utfallet säger ej_skickat
 *  - "skickat" ges BARA när raden läses tillbaka med email_sent = true —
 *    ett 200-svar från edge-funktionen räcker inte
 *  - saknarKonto känner igen triggerns P0002-text
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

type Svar = { data: unknown; error: unknown }

const kedjor: Array<{ tabell: string; steg: Array<[string, unknown[]]> }> = []
let svarKo: Svar[] = []
const getUser = vi.fn()
const getSession = vi.fn()

function byggKedja(tabell: string) {
  const post = { tabell, steg: [] as Array<[string, unknown[]]> }
  kedjor.push(post)
  const handler: ProxyHandler<object> = {
    get(_t, prop: string) {
      if (prop === 'then') {
        return (res: (v: Svar) => void) => res(svarKo.shift() ?? { data: null, error: null })
      }
      return (...args: unknown[]) => {
        post.steg.push([prop, args])
        return proxy
      }
    },
  }
  const proxy: unknown = new Proxy({}, handler)
  return proxy
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: (...a: unknown[]) => getUser(...a),
      getSession: (...a: unknown[]) => getSession(...a),
    },
    from: (tabell: string) => byggKedja(tabell),
  },
}))

import { orgApi, saknarKonto } from './orgApi'

const steg = (i: number, namn: string) => kedjor[i].steg.find(([s]) => s === namn)?.[1]

describe('orgApi.inviteColleagueByEmail', () => {
  beforeEach(() => {
    kedjor.length = 0
    svarKo = []
    getUser.mockReset().mockResolvedValue({ data: { user: { id: 'chef-1' } }, error: null })
    getSession.mockReset().mockResolvedValue({ data: { session: { access_token: 'tok' } } })
    vi.stubEnv('VITE_SUPABASE_URL', 'https://x.supabase.co')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }))
  })

  it('INSERT i invitations med bara e-post, organisation och roll — sedan send-invite-email med invitationId', async () => {
    svarKo = [
      { data: { id: 'inv-1', email: 'ny@example.com' }, error: null },
      { data: { email_sent: true }, error: null },
    ]
    const u = await orgApi.inviteColleagueByEmail('org-1', '  Ny@Example.com ', 'chef')

    expect(kedjor[0].tabell).toBe('invitations')
    const [rad] = steg(0, 'insert') as [Record<string, unknown>]
    expect(rad).toEqual({
      email: 'ny@example.com',
      role: 'USER',
      invited_by: 'chef-1',
      metadata: { kind: 'kollega', kollega_org_id: 'org-1', org_role: 'chef' },
    })
    // Det triggern bestämmer skickas inte från klienten.
    expect(rad).not.toHaveProperty('consultant_id')
    expect(rad).not.toHaveProperty('token')
    expect(rad).not.toHaveProperty('email_sent')

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://x.supabase.co/functions/v1/send-invite-email')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok')
    expect(JSON.parse(init.body as string)).toEqual({ invitationId: 'inv-1' })

    // Bekräftelsen läses ur databasen
    expect(kedjor[1].tabell).toBe('invitations')
    expect(steg(1, 'select')).toEqual(['email_sent'])
    expect(steg(1, 'eq')).toEqual(['id', 'inv-1'])
    expect(u).toEqual({ id: 'inv-1', email: 'ny@example.com', mejl: 'skickat' })
  })

  it('200 från edge-funktionen men email_sent är false → obekraftat, aldrig "skickat"', async () => {
    svarKo = [
      { data: { id: 'inv-1', email: 'ny@example.com' }, error: null },
      { data: { email_sent: false }, error: null },
    ]
    const u = await orgApi.inviteColleagueByEmail('org-1', 'ny@example.com', 'konsulent')
    expect(u.mejl).toBe('obekraftat')

    // null (kolumnens default före utskick) och en rad som inte går att läsa är inte heller "skickat"
    for (const kontroll of [{ data: { email_sent: null }, error: null }, { data: null, error: null }]) {
      kedjor.length = 0
      svarKo = [{ data: { id: 'inv-1', email: 'ny@example.com' }, error: null }, kontroll]
      expect((await orgApi.inviteColleagueByEmail('org-1', 'ny@example.com', 'konsulent')).mejl).toBe('obekraftat')
    }
  })

  it('mejlfel (HTTP 500 med svensk text) → ej_skickat med detaljen, och inget kast', async () => {
    svarKo = [{ data: { id: 'inv-1', email: 'ny@example.com' }, error: null }]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Could not send email automatically', details: 'Resend 422' }),
    }))
    const u = await orgApi.inviteColleagueByEmail('org-1', 'ny@example.com', 'konsulent')
    expect(u).toEqual({
      id: 'inv-1',
      email: 'ny@example.com',
      mejl: 'ej_skickat',
      detalj: 'Could not send email automatically — Resend 422',
    })
    expect(kedjor).toHaveLength(1) // ingen bekräftelseläsning när utskicket föll
  })

  it('demokontot (403 från edge-funktionen) → ej_skickat med funktionens text', async () => {
    svarKo = [{ data: { id: 'inv-1', email: 'ny@example.com' }, error: null }]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Demokontot kan inte skicka inbjudningar. Personerna i demot är påhittade.' }),
    }))
    const u = await orgApi.inviteColleagueByEmail('org-1', 'ny@example.com', 'konsulent')
    expect(u.mejl).toBe('ej_skickat')
    expect(u.detalj).toMatch(/Demokontot/)
  })

  it('nätverksfel → ej_skickat', async () => {
    svarKo = [{ data: { id: 'inv-1', email: 'ny@example.com' }, error: null }]
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')))
    const u = await orgApi.inviteColleagueByEmail('org-1', 'ny@example.com', 'konsulent')
    expect(u).toMatchObject({ mejl: 'ej_skickat', detalj: 'Failed to fetch' })
  })

  it('databasens nej kastas med sin svenska text, och inget mejl skickas', async () => {
    svarKo = [{ data: null, error: { message: 'Bara chef eller administratör i organisationen får bjuda in kollegor', code: '42501' } }]
    await expect(orgApi.inviteColleagueByEmail('org-1', 'ny@example.com', 'konsulent'))
      .rejects.toThrow('Bara chef eller administratör i organisationen får bjuda in kollegor')
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('orgApi.pendingColleagueInvites', () => {
  beforeEach(() => {
    kedjor.length = 0
    svarKo = []
    getUser.mockReset().mockResolvedValue({ data: { user: { id: 'chef-1' } }, error: null })
  })

  it('filtrerar på kind kollega, organisationen och obesvarade — och läser email_sent strikt', async () => {
    svarKo = [{
      data: [
        { id: 'a', email: 'a@example.com', email_sent: true, expires_at: null, created_at: '', metadata: { org_role: 'chef' } },
        { id: 'b', email: 'b@example.com', email_sent: null, expires_at: null, created_at: '', metadata: null },
      ],
      error: null,
    }]
    const rader = await orgApi.pendingColleagueInvites('org-1')
    const eqs = kedjor[0].steg.filter(([s]) => s === 'eq').map(([, a]) => a)
    expect(eqs).toEqual([['metadata->>kind', 'kollega'], ['metadata->>kollega_org_id', 'org-1']])
    expect(steg(0, 'is')).toEqual(['used_at', null])
    expect(rader.map((r) => [r.email, r.email_sent, r.org_role])).toEqual([
      ['a@example.com', true, 'chef'],
      ['b@example.com', false, null], // null är inte "skickat"
    ])
  })

  it('kastar vid fel i stället för att svälja till []', async () => {
    svarKo = [{ data: null, error: { message: 'permission denied' } }]
    await expect(orgApi.pendingColleagueInvites('org-1')).rejects.toBeTruthy()
  })
})

describe('saknarKonto', () => {
  it('känner igen triggerns P0002-text och inget annat', () => {
    expect(saknarKonto('Ingen användare med e-posten x@y.se. Personen behöver skapa ett konto på jobin.se först.')).toBe(true)
    expect(saknarKonto('Personen är redan medlem i organisationen')).toBe(false)
    expect(saknarKonto('Bara chef eller administratör i organisationen får ändra medlemmar')).toBe(false)
  })
})
