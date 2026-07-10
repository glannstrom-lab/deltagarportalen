/**
 * Tester för staApi — verifierar STA-modulens kritiska funktioner:
 * deltagar-CRUD (enrollments), skattningar (assessments/DOA), aktiviteter,
 * arbetsprövningsplatser, dokument, puls/vecko-checkins och frånvaro.
 * Mockar Supabase (from-builder + rpc + auth).
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- supabase-builder-mock kräver any-typad chainable */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  staEnrollmentsApi,
  staActivitiesApi,
  staAssessmentsApi,
  staWorkplacesApi,
  staDocumentsApi,
  staQuickNotesApi,
  staPulseChecksApi,
  staWeeklyCheckinsApi,
  staAbsencesApi,
  staProfileApi,
  consultantConsentsApi,
  fetchEnrollmentBundle,
} from './staApi'

// Mock supabase
const mockGetUser = vi.fn()
const mockRpc = vi.fn()
const mockFrom = vi.fn()
const mockFromBuilder: any = {}
// Resultat som returneras när en query-kedja awaitas direkt (utan single/maybeSingle)
let builderResult: { data: unknown; error: unknown } = { data: null, error: null }

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: () => mockGetUser() },
    from: (...args: unknown[]) => {
      mockFrom(...args)
      return mockFromBuilder
    },
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}))

function setBuilderResult(data: unknown, error: unknown = null) {
  builderResult = { data, error }
}

beforeEach(() => {
  mockGetUser.mockReset()
  mockRpc.mockReset()
  mockFrom.mockReset()
  builderResult = { data: null, error: null }
  // Återskapa builder så varje test får färska metoder
  mockFromBuilder.select = vi.fn(() => mockFromBuilder)
  mockFromBuilder.insert = vi.fn(() => mockFromBuilder)
  mockFromBuilder.update = vi.fn(() => mockFromBuilder)
  mockFromBuilder.upsert = vi.fn(() => mockFromBuilder)
  mockFromBuilder.delete = vi.fn(() => mockFromBuilder)
  mockFromBuilder.eq = vi.fn(() => mockFromBuilder)
  mockFromBuilder.is = vi.fn(() => mockFromBuilder)
  mockFromBuilder.gte = vi.fn(() => mockFromBuilder)
  mockFromBuilder.order = vi.fn(() => mockFromBuilder)
  mockFromBuilder.limit = vi.fn(() => mockFromBuilder)
  mockFromBuilder.single = vi.fn()
  mockFromBuilder.maybeSingle = vi.fn()
  // Kedjor som awaitas direkt (t.ex. ...eq().order()) — gör buildern thenable
  mockFromBuilder.then = (onFulfilled: (v: { data: unknown; error: unknown }) => unknown) =>
    Promise.resolve(builderResult).then(onFulfilled)
})

// =============================================================================
// ENROLLMENTS — deltagar-CRUD
// =============================================================================

describe('staEnrollmentsApi.listMine', () => {
  it('kastar UNAUTHORIZED om ingen session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    await expect(staEnrollmentsApi.listMine()).rejects.toThrow('Inte inloggad')
  })

  it('hämtar enrollments för inloggad deltagare, sorterade på startdatum', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    setBuilderResult([{ id: 'enr-1' }, { id: 'enr-2' }])
    const result = await staEnrollmentsApi.listMine()
    expect(mockFrom).toHaveBeenCalledWith('sta_enrollments')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('participant_id', 'user-1')
    expect(mockFromBuilder.order).toHaveBeenCalledWith('started_at', { ascending: false })
    expect(result).toEqual([{ id: 'enr-1' }, { id: 'enr-2' }])
  })

  it('returnerar tom lista när data saknas', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    setBuilderResult(null)
    const result = await staEnrollmentsApi.listMine()
    expect(result).toEqual([])
  })
})

describe('staEnrollmentsApi.listForConsultant', () => {
  it('kastar UNAUTHORIZED om ingen session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    await expect(staEnrollmentsApi.listForConsultant()).rejects.toThrow('Inte inloggad')
  })

  it('filtrerar på consultant_id och joinar profiles för deltagarnamn', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'kons-1' } } })
    setBuilderResult([{ id: 'enr-1' }])
    const result = await staEnrollmentsApi.listForConsultant()
    expect(mockFrom).toHaveBeenCalledWith('sta_enrollments')
    expect(mockFromBuilder.select).toHaveBeenCalledWith(
      expect.stringContaining('participant_profile:profiles!sta_enrollments_participant_id_fkey')
    )
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('consultant_id', 'kons-1')
    expect(result).toEqual([{ id: 'enr-1' }])
  })

  it('propagerar databasfel som APIError', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'kons-1' } } })
    setBuilderResult(null, { message: 'DB-fel', code: 'XX000' })
    await expect(staEnrollmentsApi.listForConsultant()).rejects.toThrow('DB-fel')
  })
})

describe('staEnrollmentsApi.get', () => {
  it('hämtar enrollment på id via maybeSingle', async () => {
    mockFromBuilder.maybeSingle.mockResolvedValue({ data: { id: 'enr-1' }, error: null })
    const result = await staEnrollmentsApi.get('enr-1')
    expect(mockFrom).toHaveBeenCalledWith('sta_enrollments')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('id', 'enr-1')
    expect(result).toMatchObject({ id: 'enr-1' })
  })

  it('returnerar null när enrollment saknas', async () => {
    mockFromBuilder.maybeSingle.mockResolvedValue({ data: null, error: null })
    const result = await staEnrollmentsApi.get('finns-inte')
    expect(result).toBeNull()
  })
})

describe('staEnrollmentsApi.create', () => {
  it('sätter defaults: del 1, 25 h/v, unlinked utan participant_id', async () => {
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'enr-ny' }, error: null })
    await staEnrollmentsApi.create({ consultant_id: 'kons-1', started_at: '2026-07-01' })
    expect(mockFrom).toHaveBeenCalledWith('sta_enrollments')
    const payload = mockFromBuilder.insert.mock.calls[0][0]
    expect(payload).toMatchObject({
      consultant_id: 'kons-1',
      started_at: '2026-07-01',
      part_started_at: '2026-07-01',
      current_part: 1,
      weekly_hours: 25,
      link_status: 'unlinked',
      status: 'active',
    })
  })

  it('sätter link_status=linked när participant_id anges', async () => {
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'enr-ny' }, error: null })
    await staEnrollmentsApi.create({
      consultant_id: 'kons-1',
      participant_id: 'user-1',
      started_at: '2026-07-01',
    })
    const payload = mockFromBuilder.insert.mock.calls[0][0]
    expect(payload).toMatchObject({ participant_id: 'user-1', link_status: 'linked' })
  })
})

describe('staEnrollmentsApi.update', () => {
  it('uppdaterar enrollment på id och returnerar resultat', async () => {
    mockFromBuilder.single.mockResolvedValue({
      data: { id: 'enr-1', focus_occupation: 'Snickare' },
      error: null,
    })
    const result = await staEnrollmentsApi.update('enr-1', { focus_occupation: 'Snickare' })
    expect(mockFrom).toHaveBeenCalledWith('sta_enrollments')
    expect(mockFromBuilder.update).toHaveBeenCalledWith({ focus_occupation: 'Snickare' })
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('id', 'enr-1')
    expect(result).toMatchObject({ focus_occupation: 'Snickare' })
  })

  it('mappar PGRST116-fel till "Resursen hittades inte"', async () => {
    mockFromBuilder.single.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'not found' },
    })
    await expect(staEnrollmentsApi.update('enr-x', { status: 'paused' })).rejects.toThrow(
      'Resursen hittades inte'
    )
  })
})

describe('staEnrollmentsApi.setAiWeekSummary', () => {
  it('sparar sammanfattning + genereringstidpunkt via update', async () => {
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'enr-1' }, error: null })
    await staEnrollmentsApi.setAiWeekSummary('enr-1', 'Bra vecka')
    const payload = mockFromBuilder.update.mock.calls[0][0]
    expect(payload.ai_week_summary).toBe('Bra vecka')
    expect(typeof payload.ai_week_summary_generated_at).toBe('string')
  })
})

describe('staEnrollmentsApi.advanceToPart', () => {
  it('sätter ny del och nollställer part_started_at till idag', async () => {
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'enr-1' }, error: null })
    await staEnrollmentsApi.advanceToPart('enr-1', 3)
    const payload = mockFromBuilder.update.mock.calls[0][0]
    expect(payload.current_part).toBe(3)
    expect(payload.part_started_at).toBe(new Date().toISOString().slice(0, 10))
  })
})

describe('staEnrollmentsApi.createSelfTest', () => {
  it('kastar UNAUTHORIZED om ingen session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    await expect(staEnrollmentsApi.createSelfTest()).rejects.toThrow('Inte inloggad')
  })

  it('skapar enrollment där user är både deltagare och konsulent, med profilnamn', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFromBuilder.maybeSingle.mockResolvedValue({
      data: { first_name: 'Anna', last_name: 'Berg' },
      error: null,
    })
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'enr-test' }, error: null })
    const result = await staEnrollmentsApi.createSelfTest()
    // Läser namn från profiles först, skapar sedan enrollment
    expect(mockFrom).toHaveBeenNthCalledWith(1, 'profiles')
    expect(mockFrom).toHaveBeenNthCalledWith(2, 'sta_enrollments')
    const payload = mockFromBuilder.insert.mock.calls[0][0]
    expect(payload).toMatchObject({
      participant_id: 'user-1',
      consultant_id: 'user-1',
      external_name: 'Anna Berg',
      link_status: 'linked',
    })
    expect(result).toMatchObject({ id: 'enr-test' })
  })
})

describe('staEnrollmentsApi.participantUpdateSelf', () => {
  it('anropar RPC med null-defaults för utelämnade fält', async () => {
    mockRpc.mockResolvedValue({ data: { id: 'enr-1', weekly_hours: 30 }, error: null })
    const result = await staEnrollmentsApi.participantUpdateSelf('enr-1', { weeklyHours: 30 })
    expect(mockRpc).toHaveBeenCalledWith('sta_participant_update_self', {
      p_enrollment_id: 'enr-1',
      p_started_at: null,
      p_weekly_hours: 30,
      p_mark_onboarding_done: false,
    })
    expect(result).toMatchObject({ weekly_hours: 30 })
  })

  it('propagerar RPC-fel', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC-fel' } })
    await expect(
      staEnrollmentsApi.participantUpdateSelf('enr-1', { startedAt: '2026-07-01' })
    ).rejects.toThrow('RPC-fel')
  })
})

describe('staEnrollmentsApi.bulkSmartAdd', () => {
  it('anropar RPC med rader, samtycke och includes_part_2-default true', async () => {
    mockRpc.mockResolvedValue({
      data: [{ email: 'a@b.se', status: 'linked' }],
      error: null,
    })
    const result = await staEnrollmentsApi.bulkSmartAdd({
      rows: [{ email: 'a@b.se', first_name: 'Anna' }],
      defaultStartedAt: '2026-07-01',
      consentText: 'Samtycke',
      consentScope: { sta: true },
    })
    expect(mockRpc).toHaveBeenCalledWith('sta_bulk_smart_add', {
      p_rows: [{ email: 'a@b.se', first_name: 'Anna' }],
      p_default_started_at: '2026-07-01',
      p_current_part: 1,
      p_consent_text: 'Samtycke',
      p_consent_scope: { sta: true },
      p_includes_part_2: true,
    })
    expect(result).toEqual([{ email: 'a@b.se', status: 'linked' }])
  })
})

describe('staEnrollmentsApi.bulkInvite', () => {
  it('anropar RPC med invites och samtycke', async () => {
    mockRpc.mockResolvedValue({ data: [{ email: 'a@b.se', status: 'created' }], error: null })
    const result = await staEnrollmentsApi.bulkInvite({
      invites: [{ email: 'a@b.se' }],
      startedAt: '2026-07-01',
      consentText: 'Samtycke',
      consentScope: {},
    })
    expect(mockRpc).toHaveBeenCalledWith('sta_bulk_invite', {
      p_invites: [{ email: 'a@b.se' }],
      p_started_at: '2026-07-01',
      p_consent_text: 'Samtycke',
      p_consent_scope: {},
    })
    expect(result).toEqual([{ email: 'a@b.se', status: 'created' }])
  })
})

// =============================================================================
// ACTIVITIES — veckodata / dagsloggar
// =============================================================================

describe('staActivitiesApi.list', () => {
  it('hämtar aktiviteter för enrollment sorterade på scheduled_for', async () => {
    setBuilderResult([{ id: 'act-1' }])
    const result = await staActivitiesApi.list('enr-1')
    expect(mockFrom).toHaveBeenCalledWith('sta_activities')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('enrollment_id', 'enr-1')
    expect(mockFromBuilder.order).toHaveBeenCalledWith('scheduled_for', { ascending: true })
    expect(mockFromBuilder.eq).toHaveBeenCalledTimes(1)
    expect(result).toEqual([{ id: 'act-1' }])
  })

  it('filtrerar även på del när part anges', async () => {
    setBuilderResult([])
    await staActivitiesApi.list('enr-1', 2)
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('enrollment_id', 'enr-1')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('part', 2)
  })
})

describe('staActivitiesApi.upsert', () => {
  it('uppdaterar befintlig aktivitet när id finns', async () => {
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'act-1' }, error: null })
    await staActivitiesApi.upsert({
      id: 'act-1',
      enrollment_id: 'enr-1',
      part: 1,
      activity_type: 'samtal',
    })
    expect(mockFromBuilder.update).toHaveBeenCalled()
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('id', 'act-1')
    expect(mockFromBuilder.insert).not.toHaveBeenCalled()
  })

  it('skapar ny aktivitet när id saknas', async () => {
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'act-ny' }, error: null })
    await staActivitiesApi.upsert({ enrollment_id: 'enr-1', part: 1, activity_type: 'samtal' })
    expect(mockFromBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ enrollment_id: 'enr-1', activity_type: 'samtal' })
    )
    expect(mockFromBuilder.update).not.toHaveBeenCalled()
  })
})

describe('staActivitiesApi.markComplete', () => {
  it('sätter completed_at på befintlig aktivitet och behåller gammal reflektion', async () => {
    mockFromBuilder.maybeSingle.mockResolvedValue({
      data: { id: 'act-1', enrollment_id: 'enr-1', participant_reflection: 'Tidigare' },
      error: null,
    })
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'act-1' }, error: null })
    await staActivitiesApi.markComplete('enr-1', 1, 'dag-1')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('activity_key', 'dag-1')
    const payload = mockFromBuilder.update.mock.calls[0][0]
    expect(typeof payload.completed_at).toBe('string')
    expect(payload.participant_reflection).toBe('Tidigare')
  })

  it('skapar ny dagsslinga-aktivitet när ingen finns', async () => {
    mockFromBuilder.maybeSingle.mockResolvedValue({ data: null, error: null })
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'act-ny' }, error: null })
    await staActivitiesApi.markComplete('enr-1', 2, 'dag-3', 'Min reflektion')
    const payload = mockFromBuilder.insert.mock.calls[0][0]
    expect(payload).toMatchObject({
      enrollment_id: 'enr-1',
      part: 2,
      activity_type: 'dagsslinga',
      activity_key: 'dag-3',
      participant_reflection: 'Min reflektion',
    })
    expect(typeof payload.completed_at).toBe('string')
  })
})

describe('staActivitiesApi.upsertByKey', () => {
  it('mergar metadata istället för att skriva över befintlig', async () => {
    mockFromBuilder.maybeSingle.mockResolvedValue({
      data: {
        id: 'act-1',
        enrollment_id: 'enr-1',
        metadata: { steg1: 'klar' },
        participant_reflection: null,
        completed_at: null,
      },
      error: null,
    })
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'act-1' }, error: null })
    await staActivitiesApi.upsertByKey({
      enrollment_id: 'enr-1',
      part: 1,
      activity_type: 'kompetenskartlaggning',
      activity_key: 'komp-1',
      metadata: { steg2: 'påbörjad' },
    })
    const payload = mockFromBuilder.update.mock.calls[0][0]
    expect(payload.metadata).toEqual({ steg1: 'klar', steg2: 'påbörjad' })
    // Inte markComplete → completed_at förblir null
    expect(payload.completed_at).toBeNull()
  })

  it('skapar ny rad med completed_at när markComplete=true och ingen finns', async () => {
    mockFromBuilder.maybeSingle.mockResolvedValue({ data: null, error: null })
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'act-ny' }, error: null })
    await staActivitiesApi.upsertByKey({
      enrollment_id: 'enr-1',
      part: 1,
      activity_type: 'arbetsstation',
      activity_key: 'station-2',
      markComplete: true,
    })
    const payload = mockFromBuilder.insert.mock.calls[0][0]
    expect(payload.activity_key).toBe('station-2')
    expect(payload.metadata).toEqual({})
    expect(typeof payload.completed_at).toBe('string')
  })
})

// =============================================================================
// ASSESSMENTS — skattningar/bedömningar (DOA m.fl.)
// =============================================================================

describe('staAssessmentsApi.list', () => {
  it('hämtar skattningar för enrollment, senaste först', async () => {
    setBuilderResult([{ id: 'ass-1' }])
    const result = await staAssessmentsApi.list('enr-1')
    expect(mockFrom).toHaveBeenCalledWith('sta_assessments')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('enrollment_id', 'enr-1')
    expect(mockFromBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result).toEqual([{ id: 'ass-1' }])
  })

  it('propagerar databasfel', async () => {
    setBuilderResult(null, { message: 'DB-fel' })
    await expect(staAssessmentsApi.list('enr-1')).rejects.toThrow('DB-fel')
  })
})

describe('staAssessmentsApi.getOrCreate', () => {
  it('returnerar befintlig skattning utan att skapa ny', async () => {
    mockFromBuilder.maybeSingle.mockResolvedValue({
      data: { id: 'ass-1', instrument: 'DOA' },
      error: null,
    })
    const result = await staAssessmentsApi.getOrCreate('enr-1', 1, 'DOA')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('instrument', 'DOA')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('part', 1)
    expect(mockFromBuilder.insert).not.toHaveBeenCalled()
    expect(result).toMatchObject({ id: 'ass-1' })
  })

  it('skapar draft-skattning när ingen finns', async () => {
    mockFromBuilder.maybeSingle.mockResolvedValue({ data: null, error: null })
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'ass-ny' }, error: null })
    const result = await staAssessmentsApi.getOrCreate('enr-1', 2, 'WRI')
    expect(mockFromBuilder.insert).toHaveBeenCalledWith({
      enrollment_id: 'enr-1',
      part: 2,
      instrument: 'WRI',
      status: 'draft',
    })
    expect(result).toMatchObject({ id: 'ass-ny' })
  })
})

describe('staAssessmentsApi.saveScores', () => {
  it('sparar scores + summary och behåller status draft', async () => {
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'ass-1' }, error: null })
    await staAssessmentsApi.saveScores('ass-1', { fråga1: 3 }, 'Sammanfattning')
    expect(mockFrom).toHaveBeenCalledWith('sta_assessments')
    expect(mockFromBuilder.update).toHaveBeenCalledWith({
      scores: { fråga1: 3 },
      summary: 'Sammanfattning',
      status: 'draft',
    })
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('id', 'ass-1')
  })

  it('sätter summary till null när den utelämnas', async () => {
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'ass-1' }, error: null })
    await staAssessmentsApi.saveScores('ass-1', { fråga1: 2 })
    expect(mockFromBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ summary: null })
    )
  })
})

describe('staAssessmentsApi.markComplete', () => {
  it('sätter status till complete', async () => {
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'ass-1' }, error: null })
    await staAssessmentsApi.markComplete('ass-1')
    expect(mockFromBuilder.update).toHaveBeenCalledWith({ status: 'complete' })
  })
})

describe('staAssessmentsApi.signByArbetsterapeut', () => {
  it('signerar via RPC sta_sign_assessment', async () => {
    mockRpc.mockResolvedValue({ data: { id: 'ass-1', signed_at: '2026-07-10' }, error: null })
    const result = await staAssessmentsApi.signByArbetsterapeut('ass-1')
    expect(mockRpc).toHaveBeenCalledWith('sta_sign_assessment', { p_assessment_id: 'ass-1' })
    expect(result).toMatchObject({ signed_at: '2026-07-10' })
  })

  it('propagerar RPC-fel (t.ex. saknad behörighet)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'forbidden' } })
    await expect(staAssessmentsApi.signByArbetsterapeut('ass-1')).rejects.toThrow('Åtkomst nekad')
  })
})

describe('staAssessmentsApi.participantSaveDoaScore', () => {
  it('sparar person-värde via RPC med null-default för kommentar', async () => {
    mockRpc.mockResolvedValue({ data: { id: 'ass-1' }, error: null })
    await staAssessmentsApi.participantSaveDoaScore({
      enrollment_id: 'enr-1',
      cat_index: 0,
      item_index: 2,
      person_value: 4,
    })
    expect(mockRpc).toHaveBeenCalledWith('sta_participant_save_doa_score', {
      p_enrollment_id: 'enr-1',
      p_cat_index: 0,
      p_item_index: 2,
      p_person_value: 4,
      p_comment: null,
    })
  })
})

describe('staAssessmentsApi.participantMarkDoaDone', () => {
  it('markerar DOA-självskattning klar via RPC', async () => {
    mockRpc.mockResolvedValue({ data: { id: 'ass-1' }, error: null })
    await staAssessmentsApi.participantMarkDoaDone('enr-1')
    expect(mockRpc).toHaveBeenCalledWith('sta_participant_mark_doa_done', {
      p_enrollment_id: 'enr-1',
    })
  })
})

// =============================================================================
// WORKPLACES — arbetsprövningsplatser
// =============================================================================

describe('staWorkplacesApi', () => {
  it('create: skapar arbetsplats i sta_workplaces', async () => {
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'wp-1' }, error: null })
    const result = await staWorkplacesApi.create({
      enrollment_id: 'enr-1',
      company_name: 'Bygg AB',
    })
    expect(mockFrom).toHaveBeenCalledWith('sta_workplaces')
    expect(mockFromBuilder.insert).toHaveBeenCalledWith({
      enrollment_id: 'enr-1',
      company_name: 'Bygg AB',
    })
    expect(result).toMatchObject({ id: 'wp-1' })
  })

  it('update: uppdaterar på id', async () => {
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'wp-1' }, error: null })
    await staWorkplacesApi.update('wp-1', { should_extend: true })
    expect(mockFromBuilder.update).toHaveBeenCalledWith({ should_extend: true })
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('id', 'wp-1')
  })

  it('delete: raderar på id', async () => {
    setBuilderResult(null)
    await staWorkplacesApi.delete('wp-1')
    expect(mockFrom).toHaveBeenCalledWith('sta_workplaces')
    expect(mockFromBuilder.delete).toHaveBeenCalled()
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('id', 'wp-1')
  })

  it('listForConsultant: kastar UNAUTHORIZED om ingen session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    await expect(staWorkplacesApi.listForConsultant()).rejects.toThrow('Inte inloggad')
  })

  it('list: propagerar databasfel', async () => {
    setBuilderResult(null, { message: 'DB-fel' })
    await expect(staWorkplacesApi.list('enr-1')).rejects.toThrow('DB-fel')
  })
})

// =============================================================================
// DOCUMENTS — AF-rapporter
// =============================================================================

describe('staDocumentsApi.getOrCreate', () => {
  it('returnerar befintligt dokument utan att skapa nytt', async () => {
    mockFromBuilder.maybeSingle.mockResolvedValue({
      data: { id: 'doc-1', doc_type: 'delredovisning_1' },
      error: null,
    })
    const result = await staDocumentsApi.getOrCreate('enr-1', 'delredovisning_1', 1)
    expect(mockFrom).toHaveBeenCalledWith('sta_documents')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('doc_type', 'delredovisning_1')
    expect(mockFromBuilder.insert).not.toHaveBeenCalled()
    expect(result).toMatchObject({ id: 'doc-1' })
  })

  it('skapar draft-dokument när inget finns', async () => {
    mockFromBuilder.maybeSingle.mockResolvedValue({ data: null, error: null })
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'doc-ny' }, error: null })
    await staDocumentsApi.getOrCreate('enr-1', 'initial_planering', null)
    expect(mockFromBuilder.insert).toHaveBeenCalledWith({
      enrollment_id: 'enr-1',
      doc_type: 'initial_planering',
      part: null,
      status: 'draft',
    })
  })
})

describe('staDocumentsApi.markSubmitted', () => {
  it('sätter status submitted med tidpunkt och avsändare', async () => {
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'doc-1' }, error: null })
    await staDocumentsApi.markSubmitted('doc-1', 'kons-1')
    const payload = mockFromBuilder.update.mock.calls[0][0]
    expect(payload.status).toBe('submitted')
    expect(payload.submitted_by).toBe('kons-1')
    expect(typeof payload.submitted_at).toBe('string')
  })
})

// =============================================================================
// QUICK NOTES
// =============================================================================

describe('staQuickNotesApi.create', () => {
  it('kastar UNAUTHORIZED om ingen session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    await expect(staQuickNotesApi.create({ enrollment_id: 'enr-1' })).rejects.toThrow(
      'Inte inloggad'
    )
  })

  it('skapar anteckning med author_id och defaults', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'kons-1' } } })
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'note-1' }, error: null })
    await staQuickNotesApi.create({ enrollment_id: 'enr-1', body: 'Snabbanteckning' })
    expect(mockFrom).toHaveBeenCalledWith('sta_quick_notes')
    expect(mockFromBuilder.insert).toHaveBeenCalledWith({
      enrollment_id: 'enr-1',
      author_id: 'kons-1',
      body: 'Snabbanteckning',
      tags: [],
      voice_transcript: null,
      visibility: 'consultant_only',
    })
  })
})

// =============================================================================
// PULSE CHECKS — daglig energi
// =============================================================================

describe('staPulseChecksApi.submitToday', () => {
  it('upsertar dagens puls med onConflict enrollment_id+check_date', async () => {
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'pulse-1' }, error: null })
    await staPulseChecksApi.submitToday({
      enrollment_id: 'enr-1',
      energy_level: 4,
      mood: 'okay',
    })
    expect(mockFrom).toHaveBeenCalledWith('sta_pulse_checks')
    expect(mockFromBuilder.upsert).toHaveBeenCalledWith(
      {
        enrollment_id: 'enr-1',
        check_date: new Date().toISOString().slice(0, 10),
        energy_level: 4,
        mood: 'okay',
        comment: null,
      },
      { onConflict: 'enrollment_id,check_date' }
    )
  })
})

describe('staPulseChecksApi.hasTodayCheck', () => {
  it('returnerar true när dagens puls finns', async () => {
    mockFromBuilder.maybeSingle.mockResolvedValue({ data: { id: 'pulse-1' }, error: null })
    const result = await staPulseChecksApi.hasTodayCheck('enr-1')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith(
      'check_date',
      new Date().toISOString().slice(0, 10)
    )
    expect(result).toBe(true)
  })

  it('returnerar false när dagens puls saknas', async () => {
    mockFromBuilder.maybeSingle.mockResolvedValue({ data: null, error: null })
    const result = await staPulseChecksApi.hasTodayCheck('enr-1')
    expect(result).toBe(false)
  })
})

// =============================================================================
// WEEKLY CHECKINS — fredagsavslutning
// =============================================================================

describe('staWeeklyCheckinsApi.submitForWeek', () => {
  it('upsertar veckoavslut med onConflict enrollment_id+week_starts', async () => {
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'week-1' }, error: null })
    await staWeeklyCheckinsApi.submitForWeek({
      enrollment_id: 'enr-1',
      week_starts: '2026-07-06',
      overall_mood: 'great',
      best_thing: 'Praktiken',
    })
    expect(mockFrom).toHaveBeenCalledWith('sta_weekly_checkins')
    expect(mockFromBuilder.upsert).toHaveBeenCalledWith(
      {
        enrollment_id: 'enr-1',
        week_starts: '2026-07-06',
        overall_mood: 'great',
        best_thing: 'Praktiken',
        hardest_thing: null,
        question_for_consultant: null,
      },
      { onConflict: 'enrollment_id,week_starts' }
    )
  })

  it('propagerar databasfel', async () => {
    mockFromBuilder.single.mockResolvedValue({ data: null, error: { message: 'DB-fel' } })
    await expect(
      staWeeklyCheckinsApi.submitForWeek({ enrollment_id: 'enr-1', week_starts: '2026-07-06' })
    ).rejects.toThrow('DB-fel')
  })
})

// =============================================================================
// ABSENCES — frånvaroanmälan
// =============================================================================

describe('staAbsencesApi.upsert', () => {
  it('kastar UNAUTHORIZED om ingen session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    await expect(
      staAbsencesApi.upsert({ enrollment_id: 'enr-1', absence_date: '2026-07-10', kind: 'sick' })
    ).rejects.toThrow('Inte inloggad')
  })

  it('upsertar frånvaro med reported_by = inloggad user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'abs-1' }, error: null })
    await staAbsencesApi.upsert({
      enrollment_id: 'enr-1',
      absence_date: '2026-07-10',
      kind: 'vab',
    })
    expect(mockFrom).toHaveBeenCalledWith('sta_absences')
    expect(mockFromBuilder.upsert).toHaveBeenCalledWith(
      {
        enrollment_id: 'enr-1',
        absence_date: '2026-07-10',
        kind: 'vab',
        reason: null,
        reported_by: 'user-1',
      },
      { onConflict: 'enrollment_id,absence_date' }
    )
  })
})

// =============================================================================
// PROFILE / CONSENTS
// =============================================================================

describe('staProfileApi.getConsultantForParticipant', () => {
  it('hämtar konsulentprofil via RPC och returnerar första raden', async () => {
    mockRpc.mockResolvedValue({
      data: [{ id: 'kons-1', first_name: 'Karin' }],
      error: null,
    })
    const result = await staProfileApi.getConsultantForParticipant('enr-1')
    expect(mockRpc).toHaveBeenCalledWith('sta_get_consultant_for_participant', {
      p_enrollment_id: 'enr-1',
    })
    expect(result).toMatchObject({ first_name: 'Karin' })
  })

  it('returnerar null när RPC ger tom lista', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })
    const result = await staProfileApi.getConsultantForParticipant('enr-1')
    expect(result).toBeNull()
  })
})

describe('consultantConsentsApi.getActive', () => {
  it('returnerar null utan att kasta när ingen session finns', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await consultantConsentsApi.getActive('kons-1')
    expect(result).toBeNull()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('filtrerar på deltagare, konsulent och ej återkallat samtycke', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFromBuilder.maybeSingle.mockResolvedValue({ data: { id: 'consent-1' }, error: null })
    const result = await consultantConsentsApi.getActive('kons-1')
    expect(mockFrom).toHaveBeenCalledWith('consultant_consents')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('participant_id', 'user-1')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('consultant_id', 'kons-1')
    expect(mockFromBuilder.is).toHaveBeenCalledWith('revoked_at', null)
    expect(result).toMatchObject({ id: 'consent-1' })
  })
})

// =============================================================================
// BUNDLE — rapportunderlag
// =============================================================================

describe('fetchEnrollmentBundle', () => {
  it('returnerar null när enrollment saknas', async () => {
    mockFromBuilder.maybeSingle.mockResolvedValue({ data: null, error: null })
    const result = await fetchEnrollmentBundle('finns-inte')
    expect(result).toBeNull()
  })

  it('samlar enrollment + alla dellistor', async () => {
    mockFromBuilder.maybeSingle.mockResolvedValue({ data: { id: 'enr-1' }, error: null })
    setBuilderResult([])
    const result = await fetchEnrollmentBundle('enr-1')
    expect(result).not.toBeNull()
    expect(result!.enrollment).toMatchObject({ id: 'enr-1' })
    expect(result!.activities).toEqual([])
    expect(result!.assessments).toEqual([])
    expect(result!.quickNotes).toEqual([])
    expect(result!.pulseChecks).toEqual([])
    expect(result!.weeklyCheckins).toEqual([])
    expect(result!.workplaces).toEqual([])
    expect(result!.documents).toEqual([])
    // Alla STA-tabeller ska ha lästs
    const tables = mockFrom.mock.calls.map(c => c[0])
    for (const t of [
      'sta_enrollments',
      'sta_activities',
      'sta_assessments',
      'sta_quick_notes',
      'sta_pulse_checks',
      'sta_weekly_checkins',
      'sta_workplaces',
      'sta_documents',
    ]) {
      expect(tables).toContain(t)
    }
  })
})
