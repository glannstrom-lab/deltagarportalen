/**
 * Tester för foretagApi (AG6/AG8).
 *
 * Det som vaktas här är KONTRAKTET mot vyerna, inte Supabase-klienten:
 *  - markeraOppnad gör en UPDATE på employer_proposals UTAN employer_response
 *    (det är så triggern skiljer "öppnad" från "svar") och kastar databasens
 *    text när visningstaket är nått
 *  - svara skickar employer_response + employer_message via samma vy
 *  - bjudInKollega går INSERT → send-invite-email, och ett mejlfel KASTAS
 *    (inbjudan finns, men personen fick inget — det ska synas)
 *  - inget svälj: varje fel från databasen når anroparen
 *  - den rena logiken (vecka X av Y, dagar sedan) utan nätverk
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

type Svar = { data: unknown; error: unknown; count?: number | null }

const kedjor: Array<{ tabell: string; steg: Array<[string, unknown[]]> }> = []
let nastaSvar: Svar = { data: null, error: null }
const getUser = vi.fn()
const getSession = vi.fn()

function byggKedja(tabell: string) {
  const post = { tabell, steg: [] as Array<[string, unknown[]]> }
  kedjor.push(post)
  const handler: ProxyHandler<object> = {
    get(_t, prop: string) {
      if (prop === 'then') {
        // Kedjan är "awaitbar" i sista ledet — som PostgrestBuilder.
        return (res: (v: Svar) => void) => res(nastaSvar)
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

import { foretagApi, veckaAvTotal, dagarSedan, foretagFelText } from './foretagApi'

function steg(namn: string) {
  const k = kedjor[kedjor.length - 1]
  return k.steg.find(([s]) => s === namn)?.[1]
}

describe('foretagApi', () => {
  beforeEach(() => {
    kedjor.length = 0
    nastaSvar = { data: null, error: null }
    getUser.mockReset()
    getSession.mockReset()
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } })
    vi.stubEnv('VITE_SUPABASE_URL', 'https://x.supabase.co')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }))
  })

  describe('markeraOppnad', () => {
    it('gör en UPDATE på vyn employer_proposals utan employer_response (= "öppnad" för triggern)', async () => {
      await foretagApi.markeraOppnad('f1')
      expect(kedjor[0].tabell).toBe('employer_proposals')
      const [patch] = steg('update') as [Record<string, unknown>]
      expect(patch).not.toHaveProperty('employer_response')
      expect(patch).not.toHaveProperty('employer_message')
      expect(patch).toHaveProperty('last_viewed_at')
      expect(steg('eq')).toEqual(['id', 'f1'])
    })

    it('kastar databasens text när visningstaket är nått — sväljer inte', async () => {
      nastaSvar = { data: null, error: { code: '23514', message: 'Förslaget kan inte visas fler gånger' } }
      await expect(foretagApi.markeraOppnad('f1')).rejects.toThrow('Förslaget kan inte visas fler gånger')
    })
  })

  describe('svara', () => {
    it('skickar employer_response + trimmat meddelande via vyn', async () => {
      await foretagApi.svara('f1', 'interested', '  Vi ringer på måndag  ')
      expect(kedjor[0].tabell).toBe('employer_proposals')
      expect(steg('update')).toEqual([{ employer_response: 'interested', employer_message: 'Vi ringer på måndag' }])
      expect(steg('eq')).toEqual(['id', 'f1'])
    })

    it('tomt meddelande blir null, och ett nej går som declined', async () => {
      await foretagApi.svara('f1', 'declined', '   ')
      expect(steg('update')).toEqual([{ employer_response: 'declined', employer_message: null }])
    })

    it('kastar databasens "Förslaget är redan besvarat"', async () => {
      nastaSvar = { data: null, error: { code: '23514', message: 'Förslaget är redan besvarat' } }
      await expect(foretagApi.svara('f1', 'interested')).rejects.toThrow('Förslaget är redan besvarat')
    })
  })

  describe('listor kastar vid fel', () => {
    it('listaForslag filtrerar på org_id och kastar RLS-fel rakt av', async () => {
      nastaSvar = { data: [{ id: 'f1' }], error: null }
      const r = await foretagApi.listaForslag('org1')
      expect(r).toEqual([{ id: 'f1' }])
      expect(kedjor[0].tabell).toBe('employer_proposals')
      expect(steg('eq')).toEqual(['org_id', 'org1'])

      nastaSvar = { data: null, error: { code: '42501', message: 'nekad' } }
      await expect(foretagApi.listaPlatser('org1')).rejects.toMatchObject({ code: '42501' })
    })

    it('listaPagaende läser vyn employer_placements', async () => {
      nastaSvar = { data: [], error: null }
      expect(await foretagApi.listaPagaende('org1')).toEqual([])
      expect(kedjor[0].tabell).toBe('employer_placements')
    })
  })

  describe('platser', () => {
    it('skapaPlats sätter org_id + created_by och nekar tom rubrik lokalt', async () => {
      nastaSvar = { data: { id: 'p1' }, error: null }
      await foretagApi.skapaPlats('org1', { title: ' Lagerplats ', placement_type: 'praktik' })
      expect(kedjor[0].tabell).toBe('employer_places')
      expect(steg('insert')).toEqual([{ title: 'Lagerplats', placement_type: 'praktik', org_id: 'org1', created_by: 'u1' }])
      await expect(foretagApi.skapaPlats('org1', { title: '  ', placement_type: 'praktik' })).rejects.toThrow(/rubrik/)
    })
  })

  describe('avstämningar', () => {
    it('skapaAvstamning kräver vecka 12 eller 24 och sätter author_id = jag', async () => {
      await expect(
        foretagApi.skapaAvstamning({ placement_id: 'w1', org_id: 'org1', milestone_week: 5 as unknown as 12 }),
      ).rejects.toThrow(/12 eller vecka 24/)
      nastaSvar = { data: { id: 'a1' }, error: null }
      await foretagApi.skapaAvstamning({ placement_id: 'w1', org_id: 'org1', milestone_week: 12, going_well: ' bra ', continue_interest: 'ja' })
      expect(kedjor[0].tabell).toBe('employer_checkins')
      expect(steg('insert')).toEqual([{
        placement_id: 'w1', org_id: 'org1', author_id: 'u1', milestone_week: 12,
        going_well: 'bra', concerns: null, continue_interest: 'ja',
      }])
    })
  })

  describe('bjudInKollega', () => {
    it('INSERT på employer_invitations, sedan send-invite-email med invitationId och Bearer-token', async () => {
      nastaSvar = { data: { id: 'inv1', org_id: 'org1', email: 'k@ex.se', contact_name: 'Kim', existing_account: false }, error: null }
      const r = await foretagApi.bjudInKollega('org1', ' K@Ex.se ', 'Kim')
      expect(kedjor[0].tabell).toBe('employer_invitations')
      expect(steg('insert')).toEqual([{ org_id: 'org1', email: 'k@ex.se', contact_name: 'Kim' }])
      expect(r.id).toBe('inv1')
      const f = fetch as unknown as ReturnType<typeof vi.fn>
      expect(f).toHaveBeenCalledWith(
        'https://x.supabase.co/functions/v1/send-invite-email',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ Authorization: 'Bearer tok' }),
          body: JSON.stringify({ invitationId: 'inv1' }),
        }),
      )
    })

    it('visar databasens svenska text (demokonto, 42501) och skickar då inget mejl', async () => {
      nastaSvar = { data: null, error: { code: '42501', message: 'Demokontot kan inte bjuda in. Personerna i demot är påhittade.' } }
      await expect(foretagApi.bjudInKollega('org1', 'k@ex.se', 'Kim')).rejects.toThrow('Demokontot kan inte bjuda in')
      expect(fetch).not.toHaveBeenCalled()
    })

    it('ett mejlfel KASTAS med förklaring — inbjudan är sparad men personen fick inget', async () => {
      nastaSvar = { data: { id: 'inv1', org_id: 'org1', email: 'k@ex.se', contact_name: null, existing_account: false }, error: null }
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
      await expect(foretagApi.bjudInKollega('org1', 'k@ex.se', '')).rejects.toThrow(/mejlet kunde inte skickas \(HTTP 500\)/)
    })

    it('nekar ogiltig e-post innan något skrivs', async () => {
      await expect(foretagApi.bjudInKollega('org1', 'inte-en-adress', 'Kim')).rejects.toThrow(/giltig e-postadress/)
      expect(kedjor).toHaveLength(0)
    })
  })

  describe('ren logik', () => {
    it('veckaAvTotal räknar vecka X av Y ur start/slut, och ljuger inte utan datum', () => {
      const idag = new Date('2026-09-13T12:00:00Z')
      expect(veckaAvTotal('2026-09-01', '2026-11-24', idag)).toEqual({ vecka: 2, totalt: 12 })
      expect(veckaAvTotal('2026-09-01', null, idag)).toEqual({ vecka: 2, totalt: null })
      expect(veckaAvTotal('2026-10-01', '2026-12-01', idag)?.vecka).toBe(0)
      expect(veckaAvTotal(null, '2026-12-01', idag)).toBeNull()
      expect(veckaAvTotal('ogiltigt', null, idag)).toBeNull()
    })

    it('dagarSedan ger hela dagar och aldrig negativt', () => {
      const idag = new Date('2026-09-13T12:00:00Z')
      expect(dagarSedan('2026-09-10T08:00:00Z', idag)).toBe(3)
      expect(dagarSedan('2026-09-20T08:00:00Z', idag)).toBe(0)
      expect(dagarSedan(null, idag)).toBeNull()
    })

    it('foretagFelText föredrar databasens meddelande', () => {
      expect(foretagFelText({ code: '23505', message: 'Personen är redan med i företagskontot' })).toBe('Personen är redan med i företagskontot')
      expect(foretagFelText(new Error('x'))).toBe('x')
      expect(foretagFelText(null)).toMatch(/gick fel/)
    })
  })
})
