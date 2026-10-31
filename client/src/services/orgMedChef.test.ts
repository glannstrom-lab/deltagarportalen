/**
 * FN11 — organisation + första chef i ett steg. Ingen databas: orgApi mockas, och
 * inga mejl skickas. Mutationsprov är gjorda mot rollen, ordningen och
 * personalspärren (se slutrapporten).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./orgApi', () => ({
  orgAdminApi: { createOrganization: vi.fn(), addMember: vi.fn() },
  orgApi: { inviteColleagueByEmail: vi.fn() },
}))

import { orgAdminApi, orgApi } from './orgApi'
import { bjudInMedlem, harRedanKonto, skapaOrgMedChef, utfallText, valideraNyOrg } from './orgMedChef'

const org = { id: 'o1', name: 'Hällefors kommun', kind: 'kommun', org_number: null, ai_enabled: false, created_at: '', updated_at: '' }
const indata = { name: 'Hällefors kommun', kind: 'kommun' as const, orgNumber: '', chefEpost: 'Chef@Kommun.se' }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(orgAdminApi.createOrganization).mockResolvedValue(org as never)
})

describe('valideraNyOrg', () => {
  it('kräver namn', () => {
    expect(valideraNyOrg({ ...indata, name: '  ' })).toMatch(/namn/)
  })
  it('tom e-post är tillåtet (bara organisationen)', () => {
    expect(valideraNyOrg({ ...indata, chefEpost: '' })).toBeNull()
  })
  it('avvisar ogiltig e-post', () => {
    expect(valideraNyOrg({ ...indata, chefEpost: 'chef@' })).toMatch(/e-post/i)
    expect(valideraNyOrg({ ...indata, chefEpost: 'chef kommun.se' })).toMatch(/e-post/i)
  })
  it('avvisar chefsinbjudan till företag', () => {
    expect(valideraNyOrg({ ...indata, kind: 'arbetsgivare' })).toMatch(/Företag/)
    expect(valideraNyOrg({ ...indata, kind: 'arbetsgivare', chefEpost: '' })).toBeNull()
  })
})

describe('skapaOrgMedChef', () => {
  it('skapar organisationen och bjuder in med rollen chef', async () => {
    vi.mocked(orgApi.inviteColleagueByEmail).mockResolvedValue({ id: 'i1', email: 'chef@kommun.se', mejl: 'skickat' })
    const u = await skapaOrgMedChef(indata, [])
    expect(orgAdminApi.createOrganization).toHaveBeenCalledWith({ name: 'Hällefors kommun', kind: 'kommun', org_number: null })
    expect(orgApi.inviteColleagueByEmail).toHaveBeenCalledWith('o1', 'chef@kommun.se', 'chef')
    expect(u.chef).toEqual({ status: 'inbjuden', email: 'chef@kommun.se', mejl: 'skickat', detalj: undefined })
  })

  it('utan e-post skapas bara organisationen och ingen inbjudan görs', async () => {
    const u = await skapaOrgMedChef({ ...indata, chefEpost: '' }, [])
    expect(u.chef).toBeNull()
    expect(orgApi.inviteColleagueByEmail).not.toHaveBeenCalled()
  })

  it('skapar ingen organisation om valideringen faller', async () => {
    await expect(skapaOrgMedChef({ ...indata, chefEpost: 'fel' }, [])).rejects.toThrow(/e-post/i)
    expect(orgAdminApi.createOrganization).not.toHaveBeenCalled()
  })

  it('kastar om organisationen inte kan skapas och bjuder då inte in', async () => {
    vi.mocked(orgAdminApi.createOrganization).mockRejectedValue(new Error('permission denied'))
    await expect(skapaOrgMedChef(indata, [])).rejects.toThrow('permission denied')
    expect(orgApi.inviteColleagueByEmail).not.toHaveBeenCalled()
  })

  it('organisationen finns kvar när inbjudan faller, och utfallet säger vad som återstår', async () => {
    vi.mocked(orgApi.inviteColleagueByEmail).mockRejectedValue(new Error('Okänd roll'))
    const u = await skapaOrgMedChef(indata, [])
    expect(u.org.id).toBe('o1')
    expect(u.chef).toMatchObject({ status: 'misslyckades', fel: 'Okänd roll' })
    expect(utfallText(u)).toMatchObject({ ton: 'varning' })
    expect(utfallText(u).text).toMatch(/utan chef/)
  })
})

describe('bjudInMedlem — konto finns redan', () => {
  const redan = new Error('Det finns redan ett konto med e-posten chef@kommun.se. Lägg till personen direkt i stället.')

  it('lägger till direkt när kontot är personal', async () => {
    vi.mocked(orgApi.inviteColleagueByEmail).mockRejectedValue(redan)
    vi.mocked(orgAdminApi.addMember).mockResolvedValue({} as never)
    const r = await bjudInMedlem('o1', 'chef@kommun.se', 'chef', [{ id: 'u9', email: 'Chef@kommun.se', role: 'CONSULTANT' }])
    expect(orgAdminApi.addMember).toHaveBeenCalledWith('o1', 'u9', 'chef')
    expect(r).toEqual({ status: 'tillagd', email: 'chef@kommun.se' })
  })

  it('gör aldrig en deltagare till personal', async () => {
    vi.mocked(orgApi.inviteColleagueByEmail).mockRejectedValue(redan)
    const r = await bjudInMedlem('o1', 'chef@kommun.se', 'chef', [{ id: 'u9', email: 'chef@kommun.se', role: 'USER' }])
    expect(orgAdminApi.addMember).not.toHaveBeenCalled()
    expect(r.status).toBe('misslyckades')
  })

  it('andra fel än "redan konto" leder aldrig till addMember', async () => {
    vi.mocked(orgApi.inviteColleagueByEmail).mockRejectedValue(new Error('Okänd roll'))
    const r = await bjudInMedlem('o1', 'chef@kommun.se', 'chef', [{ id: 'u9', email: 'chef@kommun.se', role: 'CONSULTANT' }])
    expect(orgAdminApi.addMember).not.toHaveBeenCalled()
    expect(r.status).toBe('misslyckades')
  })

  it('harRedanKonto känner igen triggerns text', () => {
    expect(harRedanKonto(redan.message)).toBe(true)
    expect(harRedanKonto('Okänd roll')).toBe(false)
  })
})

describe('utfallText', () => {
  it('lovar inte medlemskap före kontot: skickat mejl säger att chefen blir medlem när kontot skapats', async () => {
    vi.mocked(orgApi.inviteColleagueByEmail).mockResolvedValue({ id: 'i1', email: 'a@b.se', mejl: 'skickat' })
    const t = utfallText(await skapaOrgMedChef({ ...indata, chefEpost: 'a@b.se' }, []))
    expect(t.ton).toBe('ok')
    expect(t.text).toMatch(/blir medlem när/)
    expect(t.text).toMatch(/Kom igång/)
  })
  it('mejl som inte gått iväg ger varning, inte "skickad"', async () => {
    vi.mocked(orgApi.inviteColleagueByEmail).mockResolvedValue({ id: 'i1', email: 'a@b.se', mejl: 'ej_skickat', detalj: 'HTTP 500' })
    const t = utfallText(await skapaOrgMedChef({ ...indata, chefEpost: 'a@b.se' }, []))
    expect(t.ton).toBe('varning')
    expect(t.text).not.toMatch(/är skickad/)
    expect(t.text).toMatch(/HTTP 500/)
  })
})
