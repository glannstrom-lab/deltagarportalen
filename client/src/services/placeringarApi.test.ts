/**
 * Tester för placeringarApi (spår AG1) — samma mockmönster som
 * consultantService.test.ts: en chainable supabase-builder-mock och en kö av
 * `{data,error}`-svar som konsumeras i anropsordning.
 *
 * Fokus:
 *  - auth-guard ("Not authenticated") på varje publik metod
 *  - att rätt tabell/filter används
 *  - att ett DB-fel KASTAS, aldrig sväljs till `[]`/`null`
 *    (CLAUDE.md: "Ett fel får aldrig se ut som tom data" — KS7)
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- supabase-builder-mock kräver any-typad chainable */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { placeringarApi, type Placering } from './placeringarApi'

const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockFromBuilder: any = {}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: () => mockGetUser() },
    from: (...args: unknown[]) => {
      mockFrom(...args)
      return mockFromBuilder
    },
  },
}))

type ThenResult = { data?: unknown; error?: unknown } | { __reject: unknown }
let thenQueue: ThenResult[] = []

function queueResult(r: ThenResult) {
  thenQueue.push(r)
}

beforeEach(() => {
  mockGetUser.mockReset()
  mockFrom.mockReset()
  thenQueue = []

  mockFromBuilder.select = vi.fn(() => mockFromBuilder)
  mockFromBuilder.insert = vi.fn(() => mockFromBuilder)
  mockFromBuilder.update = vi.fn(() => mockFromBuilder)
  mockFromBuilder.delete = vi.fn(() => mockFromBuilder)
  mockFromBuilder.eq = vi.fn(() => mockFromBuilder)
  mockFromBuilder.order = vi.fn(() => mockFromBuilder)
  mockFromBuilder.single = vi.fn(() => {
    const next = thenQueue.shift() ?? { data: null, error: null }
    if (next && '__reject' in next) return Promise.reject(next.__reject)
    return Promise.resolve(next)
  })
  mockFromBuilder.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => {
    const next = thenQueue.shift() ?? { data: null, error: null }
    if (next && '__reject' in next) {
      return Promise.reject(next.__reject).then(resolve, reject)
    }
    return Promise.resolve(next).then(resolve, reject)
  }

  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

function loggedIn(id = 'consultant-1') {
  mockGetUser.mockResolvedValue({ data: { user: { id } } })
}

function loggedOut() {
  mockGetUser.mockResolvedValue({ data: { user: null } })
}

// ==================== KOPPLINGSBARA DELTAGARE ====================

describe('placeringarApi.getKopplingsbaraDeltagare', () => {
  it('kastar om ingen user är inloggad', async () => {
    loggedOut()
    await expect(placeringarApi.getKopplingsbaraDeltagare()).rejects.toThrow('Not authenticated')
  })

  it('hämtar från consultant_dashboard_participants filtrerat på konsulenten', async () => {
    loggedIn()
    queueResult({ data: [{ participant_id: 'p1', first_name: 'Anna', last_name: 'A', email: 'a@x.se' }], error: null })
    const result = await placeringarApi.getKopplingsbaraDeltagare()
    expect(mockFrom).toHaveBeenCalledWith('consultant_dashboard_participants')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('consultant_id', 'consultant-1')
    expect(result).toEqual([{ participant_id: 'p1', first_name: 'Anna', last_name: 'A', email: 'a@x.se' }])
  })

  it('returnerar tom array om data är null (inte samma som fel)', async () => {
    loggedIn()
    queueResult({ data: null, error: null })
    expect(await placeringarApi.getKopplingsbaraDeltagare()).toEqual([])
  })

  it('kastar vidare supabase-fel — sväljer aldrig till []', async () => {
    loggedIn()
    queueResult({ data: null, error: new Error('db-fel') })
    await expect(placeringarApi.getKopplingsbaraDeltagare()).rejects.toThrow('db-fel')
  })
})

// ==================== PLACERINGAR ====================

describe('placeringarApi.getPlaceringar', () => {
  it('kastar om ingen user är inloggad', async () => {
    loggedOut()
    await expect(placeringarApi.getPlaceringar()).rejects.toThrow('Not authenticated')
  })

  it('hämtar från consultant_work_placements, filtrerat och sorterat nyast först', async () => {
    loggedIn()
    queueResult({ data: [{ id: 'w1' }], error: null })
    const result = await placeringarApi.getPlaceringar()
    expect(mockFrom).toHaveBeenCalledWith('consultant_work_placements')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('consultant_id', 'consultant-1')
    expect(mockFromBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result).toEqual([{ id: 'w1' }])
  })

  it('kastar vidare supabase-fel', async () => {
    loggedIn()
    queueResult({ data: null, error: new Error('boom') })
    await expect(placeringarApi.getPlaceringar()).rejects.toThrow('boom')
  })
})

describe('placeringarApi.getPlaceringarForDeltagare', () => {
  it('filtrerar på både consultant_id och participant_id', async () => {
    loggedIn()
    queueResult({ data: [], error: null })
    await placeringarApi.getPlaceringarForDeltagare('p1')
    expect(mockFromBuilder.eq).toHaveBeenNthCalledWith(1, 'consultant_id', 'consultant-1')
    expect(mockFromBuilder.eq).toHaveBeenNthCalledWith(2, 'participant_id', 'p1')
  })
})

describe('placeringarApi.createPlacering', () => {
  it('kastar om ingen user är inloggad', async () => {
    loggedOut()
    await expect(
      placeringarApi.createPlacering({ participant_id: 'p1', company_name: 'ICA', placement_type: 'praktik' })
    ).rejects.toThrow('Not authenticated')
  })

  it('sätter consultant_id från inloggad användare vid insert', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValueOnce({ data: { id: 'w1' }, error: null })
    const result = await placeringarApi.createPlacering({
      participant_id: 'p1',
      company_name: 'ICA',
      placement_type: 'praktik',
    })
    expect(mockFrom).toHaveBeenCalledWith('consultant_work_placements')
    expect(mockFromBuilder.insert).toHaveBeenCalledWith({
      participant_id: 'p1',
      company_name: 'ICA',
      placement_type: 'praktik',
      consultant_id: 'consultant-1',
    })
    expect(result).toEqual({ id: 'w1' })
  })

  it('kastar vidare supabase-fel i stället för att returnera en tom/påhittad rad', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValueOnce({ data: null, error: new Error('insert-fel') })
    await expect(
      placeringarApi.createPlacering({ participant_id: 'p1', company_name: 'ICA', placement_type: 'praktik' })
    ).rejects.toThrow('insert-fel')
  })
})

describe('placeringarApi.updatePlacering', () => {
  it('kastar om ingen user är inloggad', async () => {
    loggedOut()
    await expect(placeringarApi.updatePlacering('w1', { status: 'pagaende' })).rejects.toThrow('Not authenticated')
  })

  it('uppdaterar bara rader som ägs av inloggad konsulent', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValueOnce({ data: { id: 'w1', status: 'pagaende' }, error: null })
    await placeringarApi.updatePlacering('w1', { status: 'pagaende' })
    expect(mockFromBuilder.update).toHaveBeenCalledWith({ status: 'pagaende' })
    expect(mockFromBuilder.eq).toHaveBeenNthCalledWith(1, 'id', 'w1')
    expect(mockFromBuilder.eq).toHaveBeenNthCalledWith(2, 'consultant_id', 'consultant-1')
  })
})

describe('placeringarApi.deletePlacering', () => {
  it('kastar om ingen user är inloggad', async () => {
    loggedOut()
    await expect(placeringarApi.deletePlacering('w1')).rejects.toThrow('Not authenticated')
  })

  it('raderar bara rader som ägs av inloggad konsulent', async () => {
    loggedIn()
    queueResult({ data: null, error: null })
    await placeringarApi.deletePlacering('w1')
    expect(mockFromBuilder.delete).toHaveBeenCalled()
    expect(mockFromBuilder.eq).toHaveBeenNthCalledWith(1, 'id', 'w1')
    expect(mockFromBuilder.eq).toHaveBeenNthCalledWith(2, 'consultant_id', 'consultant-1')
  })

  it('kastar vidare supabase-fel', async () => {
    loggedIn()
    queueResult({ data: null, error: new Error('delete-fel') })
    await expect(placeringarApi.deletePlacering('w1')).rejects.toThrow('delete-fel')
  })
})

// ==================== VECKOUPPFÖLJNINGAR ====================

describe('placeringarApi.getUppfoljningar', () => {
  it('kastar om ingen user är inloggad', async () => {
    loggedOut()
    await expect(placeringarApi.getUppfoljningar('w1')).rejects.toThrow('Not authenticated')
  })

  it('hämtar från consultant_work_placement_followups sorterat på veckonummer', async () => {
    loggedIn()
    queueResult({ data: [{ id: 'f1', week_number: 1 }], error: null })
    const result = await placeringarApi.getUppfoljningar('w1')
    expect(mockFrom).toHaveBeenCalledWith('consultant_work_placement_followups')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('placement_id', 'w1')
    expect(mockFromBuilder.order).toHaveBeenCalledWith('week_number', { ascending: true })
    expect(result).toEqual([{ id: 'f1', week_number: 1 }])
  })
})

describe('placeringarApi.createUppfoljning', () => {
  it('sätter consultant_id från inloggad användare', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValueOnce({ data: { id: 'f1' }, error: null })
    await placeringarApi.createUppfoljning({
      placement_id: 'w1',
      week_number: 1,
      followup_date: '2026-08-31',
    })
    expect(mockFromBuilder.insert).toHaveBeenCalledWith({
      placement_id: 'w1',
      week_number: 1,
      followup_date: '2026-08-31',
      consultant_id: 'consultant-1',
    })
  })

  it('kastar vidare supabase-fel', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValueOnce({ data: null, error: new Error('unik-krock') })
    await expect(
      placeringarApi.createUppfoljning({ placement_id: 'w1', week_number: 1, followup_date: '2026-08-31' })
    ).rejects.toThrow('unik-krock')
  })
})

describe('placeringarApi.updateUppfoljning / deleteUppfoljning', () => {
  it('updateUppfoljning kastar om ingen user är inloggad', async () => {
    loggedOut()
    await expect(placeringarApi.updateUppfoljning('f1', { notes: 'x' })).rejects.toThrow('Not authenticated')
  })

  it('deleteUppfoljning kastar om ingen user är inloggad', async () => {
    loggedOut()
    await expect(placeringarApi.deleteUppfoljning('f1')).rejects.toThrow('Not authenticated')
  })

  it('deleteUppfoljning raderar bara rader som ägs av inloggad konsulent', async () => {
    loggedIn()
    queueResult({ data: null, error: null })
    await placeringarApi.deleteUppfoljning('f1')
    expect(mockFrom).toHaveBeenCalledWith('consultant_work_placement_followups')
    expect(mockFromBuilder.eq).toHaveBeenNthCalledWith(1, 'id', 'f1')
    expect(mockFromBuilder.eq).toHaveBeenNthCalledWith(2, 'consultant_id', 'consultant-1')
  })
})

// ==================== REN LOGIK (ingen nätverksåtkomst, inget mock behövs) ====================

/**
 * En fullständig Placering med UNIKA sentinelvärden i varje strängfält —
 * så att ett läckande fält upptäcks både på NYCKEL (fel finns i utdatans
 * Object.keys) och på VÄRDE (sentinelen dyker upp i den serialiserade
 * utdatan) oavsett vilket namn ett framtida läckande fält skulle få.
 */
function fullPlacering(overrides: Partial<Placering> = {}): Placering {
  return {
    id: 'SENTINEL_id',
    consultant_id: 'SENTINEL_consultant_id',
    participant_id: 'SENTINEL_participant_id',
    company_account_id: 'SENTINEL_company_account_id',

    placement_type: 'praktik',
    status: 'pagaende',

    company_name: 'SENTINEL_company_name',
    org_number: 'SENTINEL_org_number',
    occupation: 'SENTINEL_occupation',
    industry: 'SENTINEL_industry',
    contact_name: 'SENTINEL_contact_name',
    contact_phone: 'SENTINEL_contact_phone',
    contact_email: 'SENTINEL_contact_email',
    address: 'SENTINEL_address',

    start_date: '2026-08-01',
    end_date: '2026-09-01',
    hours_per_week: 20,
    schedule_days: 'SENTINEL_schedule_days',
    can_ramp_up: true,
    ramp_up_plan: 'SENTINEL_ramp_up_plan',

    lifting_required: true,
    standing_required: true,
    temperature_demands: 'kyla',
    // OBS: noise_level/pace_level (ALLOWED) och
    // participant_supervision_need/workplace_supervision_capacity
    // (INTERNAL) delar samma Niva-domän ('lag'|'mellan'|'hog'). Håll de
    // två gruppernas värden disjunkta här, annars ger värde-jämförelsen
    // nedan falska positiva/negativa av ren sammanträffande.
    noise_level: 'mellan',
    pace_level: 'hog',
    shift_work: true,
    physical_notes: 'SENTINEL_physical_notes',

    participant_supervision_need: 'lag',
    workplace_supervision_capacity: 'lag',
    supervision_notes: 'SENTINEL_supervision_notes',

    language_requirements: 'SENTINEL_language_requirements',
    drivers_license_required: true,
    other_requirements: 'SENTINEL_other_requirements',

    sick_call_phone: 'SENTINEL_sick_call_phone',
    sick_call_instructions: 'SENTINEL_sick_call_instructions',

    employer_instructions: 'SENTINEL_employer_instructions',
    internal_adaptation_notes: 'SENTINEL_internal_adaptation_notes',
    work_environment_responsibility: 'SENTINEL_work_environment_responsibility',

    employer_future_needs: 'SENTINEL_employer_future_needs',
    employer_hiring_interest: 'positiv',

    notes: 'SENTINEL_notes',

    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z',
    ...overrides,
  }
}

describe('placeringarApi.byggArbetsgivarUnderlag — vakten mot läckage till arbetsgivaren', () => {
  const ALLOWED_KEYS = [
    'placement_type',
    'company_name',
    'occupation',
    'industry',
    'start_date',
    'end_date',
    'hours_per_week',
    'schedule_days',
    'can_ramp_up',
    'ramp_up_plan',
    'lifting_required',
    'standing_required',
    'temperature_demands',
    'noise_level',
    'pace_level',
    'shift_work',
    'physical_notes',
    'language_requirements',
    'drivers_license_required',
    'other_requirements',
    'sick_call_phone',
    'sick_call_instructions',
    'employer_instructions',
    'work_environment_responsibility',
  ].sort()

  it('innehåller EXAKT allowlisten — inget mer, inget mindre', () => {
    const underlag = placeringarApi.byggArbetsgivarUnderlag(fullPlacering())
    expect(Object.keys(underlag).sort()).toEqual(ALLOWED_KEYS)
  })

  it('fäller för VILKET SOM HELST internt fält som dyker upp i utdatan — inte bara de tre namngivna', () => {
    // En fullständig placering med unika sentinelvärden per fält. Om
    // implementationen någonsin byts mot `{ ...p }` eller en denylist som
    // missar ett fält (nytt ELLER befintligt), läcker sentinelen ut — och
    // den här kontrollen känner inte till fältets namn i förväg, bara att
    // INGET annat än de tillåtna nycklarnas egna värden får finnas kvar.
    const p = fullPlacering()
    const underlag = placeringarApi.byggArbetsgivarUnderlag(p)
    const tillåtnaVärden = new Set(Object.values(underlag as Record<string, unknown>))

    for (const [key, value] of Object.entries(p)) {
      if (ALLOWED_KEYS.includes(key)) continue
      // Ett internt fälts eget värde får aldrig råka matcha ett tillåtet
      // fälts värde av misstag i den här fixturen (alla är unika sentinels
      // eller distinkta datum/tal) — så om värdet finns bland underlagets
      // värden har det läckt.
      expect(tillåtnaVärden.has(value)).toBe(false)
    }
  })

  it('de tre namngivna interna fälten (VARFÖR + arbetsgivarens motivation) finns inte som nycklar', () => {
    const underlag = placeringarApi.byggArbetsgivarUnderlag(fullPlacering())
    expect('internal_adaptation_notes' in underlag).toBe(false)
    expect('employer_future_needs' in underlag).toBe(false)
    expect('employer_hiring_interest' in underlag).toBe(false)
  })

  it('släpper igenom employer_instructions (VAD) — det enda av anpassningsfälten som får delas', () => {
    const underlag = placeringarApi.byggArbetsgivarUnderlag(fullPlacering())
    expect(underlag.employer_instructions).toBe('SENTINEL_employer_instructions')
  })
})

describe('placeringarApi.harHandledningsobalans', () => {
  it('sant när arbetsplatsens kapacitet är låg OCH deltagarens behov är högt', () => {
    expect(
      placeringarApi.harHandledningsobalans({
        workplace_supervision_capacity: 'lag',
        participant_supervision_need: 'hog',
      })
    ).toBe(true)
  })

  it('falskt när kapaciteten är hög, även om behovet är högt', () => {
    expect(
      placeringarApi.harHandledningsobalans({
        workplace_supervision_capacity: 'hog',
        participant_supervision_need: 'hog',
      })
    ).toBe(false)
  })

  it('falskt när behovet är lågt, även om kapaciteten är låg', () => {
    expect(
      placeringarApi.harHandledningsobalans({
        workplace_supervision_capacity: 'lag',
        participant_supervision_need: 'lag',
      })
    ).toBe(false)
  })

  it('falskt när något av fälten inte är satt', () => {
    expect(
      placeringarApi.harHandledningsobalans({
        workplace_supervision_capacity: null,
        participant_supervision_need: 'hog',
      })
    ).toBe(false)
  })
})

describe('placeringarApi.berakMilstolpeUppfoljningar', () => {
  it('räknar fram exakt fyra PLANERADE rader på vecka 1, 5, 12 och 24', () => {
    const rader = placeringarApi.berakMilstolpeUppfoljningar('plats-1', '2026-08-01')
    expect(rader.map((r) => r.week_number)).toEqual([1, 5, 12, 24])
    for (const rad of rader) {
      expect(rad.placement_id).toBe('plats-1')
      expect(rad.is_completed).toBe(false)
      expect(rad.status).toBeNull()
    }
  })

  it('räknar ut rätt datum för varje milstolpe (start + N veckor)', () => {
    const rader = placeringarApi.berakMilstolpeUppfoljningar('plats-1', '2026-08-01')
    const datumPerVecka = Object.fromEntries(rader.map((r) => [r.week_number, r.followup_date]))
    expect(datumPerVecka[1]).toBe('2026-08-08')
    expect(datumPerVecka[5]).toBe('2026-09-05')
    expect(datumPerVecka[12]).toBe('2026-10-24')
    expect(datumPerVecka[24]).toBe('2027-01-16')
  })
})

describe('placeringarApi.berakPeriodForslag', () => {
  it('föreslår ett slutdatum en månad efter start för praktik (riktvärde: max ~1 månad)', () => {
    const forslag = placeringarApi.berakPeriodForslag('praktik', '2026-08-01', null)
    expect(forslag.foreslagetSlutdatum).toBe('2026-09-01')
    expect(forslag.avvikerTydligt).toBe(false)
  })

  it('flaggar en TYDLIG avvikelse (praktik som varar långt över riktvärdet) — men blockerar aldrig', () => {
    // Riktvärdet för praktik är en månad (~30 dagar). Ett halvår är en
    // tydlig avvikelse (>1,5x), inte bara "lite längre".
    const forslag = placeringarApi.berakPeriodForslag('praktik', '2026-08-01', '2027-02-01')
    expect(forslag.avvikerTydligt).toBe(true)
    // Ingen spärr — funktionen returnerar bara en signal, den kastar inte
    // och vägrar inte att räkna fram ett resultat.
    expect(forslag.foreslagetSlutdatum).toBe('2026-09-01')
  })

  it('flaggar INTE en period som ligger nära riktvärdet', () => {
    const forslag = placeringarApi.berakPeriodForslag('praktik', '2026-08-01', '2026-09-10')
    expect(forslag.avvikerTydligt).toBe(false)
  })

  it('subventionerad anställning har ingen bortre gräns — inget förslag, aldrig en avvikelse', () => {
    const forslag = placeringarApi.berakPeriodForslag('subventionerad_anstallning', '2026-08-01', '2030-01-01')
    expect(forslag.foreslagetSlutdatum).toBeNull()
    expect(forslag.avvikerTydligt).toBe(false)
  })
})
