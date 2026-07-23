/**
 * Tester för consultantService — låser tabellnamn/skrivvägar efter B3
 * (tyst prod-bugg: tidigare skrevs mot obefintlig `participant_consultants`
 * i stället för `consultant_participants`). Verifierar auth-guards,
 * felpropagering/-svaljning och kolumnmappning. Mockar Supabase.
 *
 * D11 (2026-07-23): getAnalytics kastar nu vidare DB-fel i participants-
 * queryn (kastade tidigare tysta nollor), och 7 mutationsmetoder
 * (updateMeeting, cancelMeeting, updateGoal, completeGoal, deleteGoal,
 * deleteJournalEntry, updatePlacementFollowup) har fått auth-guards
 * tillagda för konsekvens med övriga metoder i filen.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- supabase-builder-mock kräver any-typad chainable */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { consultantService } from './consultantService'

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

// Kö av resultat för kedjor som awaitas direkt (utan .single()), t.ex.
// `await supabase.from(...).select(...).eq(...)`. Varje await konsumerar
// nästa post i kön i anropsordning. { __reject } gör att kedjan kastar
// (simulerar nätverksfel snarare än ett normalt {error}-svar).
type ThenResult = { data?: unknown; error?: unknown; count?: number | null } | { __reject: unknown }
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
  mockFromBuilder.in = vi.fn(() => mockFromBuilder)
  mockFromBuilder.or = vi.fn(() => mockFromBuilder)
  mockFromBuilder.gte = vi.fn(() => mockFromBuilder)
  mockFromBuilder.order = vi.fn(() => mockFromBuilder)
  mockFromBuilder.single = vi.fn()
  mockFromBuilder.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => {
    const next = thenQueue.shift() ?? { data: null, error: null }
    if (next && '__reject' in next) {
      return Promise.reject(next.__reject).then(resolve, reject)
    }
    return Promise.resolve(next).then(resolve, reject)
  }

  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
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

// ==================== MESSAGES ====================

describe('consultantService.getMessages', () => {
  it('kastar om ingen user är inloggad', async () => {
    loggedOut()
    await expect(consultantService.getMessages()).rejects.toThrow('Not authenticated')
  })

  it('hämtar meddelanden för/från inloggad konsulent, sorterat nyast först', async () => {
    loggedIn()
    queueResult({ data: [{ id: 'm1' }], error: null })
    const result = await consultantService.getMessages()
    expect(mockFrom).toHaveBeenCalledWith('consultant_messages')
    expect(mockFromBuilder.or).toHaveBeenCalledWith(
      'sender_id.eq.consultant-1,receiver_id.eq.consultant-1'
    )
    expect(mockFromBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result).toEqual([{ id: 'm1' }])
  })

  it('returnerar tom array om data är null', async () => {
    loggedIn()
    queueResult({ data: null, error: null })
    expect(await consultantService.getMessages()).toEqual([])
  })

  it('kastar vidare supabase-fel', async () => {
    loggedIn()
    queueResult({ data: null, error: new Error('db-fel') })
    await expect(consultantService.getMessages()).rejects.toThrow('db-fel')
  })
})

describe('consultantService.getMessagesWithParticipant', () => {
  it('kastar om ingen user är inloggad', async () => {
    loggedOut()
    await expect(consultantService.getMessagesWithParticipant('p1')).rejects.toThrow(
      'Not authenticated'
    )
  })

  it('bygger dubbelriktat or-filter och sorterar äldst först', async () => {
    loggedIn()
    queueResult({ data: [], error: null })
    await consultantService.getMessagesWithParticipant('p1')
    expect(mockFromBuilder.or).toHaveBeenCalledWith(
      'and(sender_id.eq.consultant-1,receiver_id.eq.p1),and(sender_id.eq.p1,receiver_id.eq.consultant-1)'
    )
    expect(mockFromBuilder.order).toHaveBeenCalledWith('created_at', { ascending: true })
  })
})

describe('consultantService.sendMessage', () => {
  it('kastar om ingen user är inloggad', async () => {
    loggedOut()
    await expect(consultantService.sendMessage('p1', 'hej')).rejects.toThrow('Not authenticated')
  })

  it('insertar med sender_id/receiver_id/is_read=false', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'm1' }, error: null })
    const result = await consultantService.sendMessage('p1', 'hej')
    expect(mockFrom).toHaveBeenCalledWith('consultant_messages')
    expect(mockFromBuilder.insert).toHaveBeenCalledWith({
      sender_id: 'consultant-1',
      receiver_id: 'p1',
      content: 'hej',
      is_read: false,
    })
    expect(result).toEqual({ id: 'm1' })
  })

  it('kastar vidare supabase-fel', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValue({ data: null, error: new Error('insert-fel') })
    await expect(consultantService.sendMessage('p1', 'hej')).rejects.toThrow('insert-fel')
  })
})

describe('consultantService.sendBulkMessage', () => {
  it('kastar om ingen user är inloggad', async () => {
    loggedOut()
    await expect(consultantService.sendBulkMessage(['p1', 'p2'], 'hej')).rejects.toThrow(
      'Not authenticated'
    )
  })

  it('insertar en rad per mottagare i consultant_messages', async () => {
    loggedIn()
    queueResult({ data: null, error: null }) // consultant_messages insert
    queueResult({ data: null, error: null }) // audit_logs insert
    await consultantService.sendBulkMessage(['p1', 'p2'], 'hej alla')
    expect(mockFrom).toHaveBeenNthCalledWith(1, 'consultant_messages')
    expect(mockFromBuilder.insert).toHaveBeenNthCalledWith(1, [
      { sender_id: 'consultant-1', receiver_id: 'p1', content: 'hej alla', is_read: false },
      { sender_id: 'consultant-1', receiver_id: 'p2', content: 'hej alla', is_read: false },
    ])
  })

  it('loggar GDPR-metadata (ej innehåll) i audit_logs efter lyckat utskick', async () => {
    loggedIn()
    queueResult({ data: null, error: null })
    queueResult({ data: null, error: null })
    await consultantService.sendBulkMessage(['p1', 'p2'], 'hemligt innehåll')
    expect(mockFrom).toHaveBeenNthCalledWith(2, 'audit_logs')
    const auditArg = mockFromBuilder.insert.mock.calls[1][0]
    expect(auditArg).toMatchObject({
      user_id: 'consultant-1',
      action: 'BULK_MESSAGE_SENT',
      resource_type: 'consultant_messages',
      new_value: {
        recipient_count: 2,
        recipient_ids: ['p1', 'p2'],
        content_length: 'hemligt innehåll'.length,
      },
    })
    // Dataminimering: själva meddelandeinnehållet får inte loggas
    expect(JSON.stringify(auditArg)).not.toContain('hemligt innehåll')
  })

  it('kastar vidare fel från själva utskicket (blockerande)', async () => {
    loggedIn()
    queueResult({ data: null, error: new Error('utskick-fel') })
    await expect(consultantService.sendBulkMessage(['p1'], 'hej')).rejects.toThrow('utskick-fel')
  })

  it('KÄLLKODSOBSERVATION: sväljer fel i audit-loggningen (best-effort, endast console.warn)', async () => {
    loggedIn()
    queueResult({ data: null, error: null }) // consultant_messages insert lyckas
    mockFromBuilder.insert = vi
      .fn()
      .mockImplementationOnce(() => mockFromBuilder) // consultant_messages
      .mockImplementationOnce(() => {
        throw new Error('audit-tabell saknas')
      }) // audit_logs kastar
    await expect(consultantService.sendBulkMessage(['p1'], 'hej')).resolves.toBeUndefined()
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('audit-logg för bulk-utskick misslyckades'),
      expect.any(Error)
    )
  })
})

describe('consultantService.markMessageAsRead', () => {
  it('uppdaterar is_read=true för angivet id (ingen auth-guard i koden)', async () => {
    // KÄLLKODSOBSERVATION: markMessageAsRead anropar aldrig supabase.auth.getUser().
    // Detta test kör MED utloggad mock för att visa faktiskt beteende: anropet
    // går igenom till update() ändå — skyddet vilar helt på RLS server-side.
    loggedOut()
    queueResult({ data: null, error: null })
    await consultantService.markMessageAsRead('m1')
    expect(mockFrom).toHaveBeenCalledWith('consultant_messages')
    expect(mockFromBuilder.update).toHaveBeenCalledWith({ is_read: true })
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('id', 'm1')
  })

  it('kastar vidare supabase-fel', async () => {
    queueResult({ data: null, error: new Error('update-fel') })
    await expect(consultantService.markMessageAsRead('m1')).rejects.toThrow('update-fel')
  })
})

// ==================== MEETINGS ====================

describe('consultantService.getMeetings', () => {
  it('kastar om ingen user är inloggad', async () => {
    loggedOut()
    await expect(consultantService.getMeetings()).rejects.toThrow('Not authenticated')
  })

  it('filtrerar på consultant_id och sorterar tidigast först', async () => {
    loggedIn()
    queueResult({ data: [{ id: 'meet-1' }], error: null })
    const result = await consultantService.getMeetings()
    expect(mockFrom).toHaveBeenCalledWith('consultant_meetings')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('consultant_id', 'consultant-1')
    expect(mockFromBuilder.order).toHaveBeenCalledWith('scheduled_at', { ascending: true })
    expect(result).toEqual([{ id: 'meet-1' }])
  })
})

describe('consultantService.getUpcomingMeetings', () => {
  it('filtrerar status=scheduled och scheduled_at >= nu', async () => {
    loggedIn()
    queueResult({ data: [], error: null })
    await consultantService.getUpcomingMeetings()
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('status', 'scheduled')
    expect(mockFromBuilder.gte).toHaveBeenCalledWith('scheduled_at', expect.any(String))
  })
})

describe('consultantService.createMeeting', () => {
  it('kastar om ingen user är inloggad', async () => {
    loggedOut()
    await expect(
      consultantService.createMeeting({
        participant_id: 'p1',
        scheduled_at: '2026-08-01T10:00:00Z',
        duration_minutes: 30,
        meeting_type: 'video',
        status: 'scheduled',
      })
    ).rejects.toThrow('Not authenticated')
  })

  it('sätter consultant_id från inloggad user vid insert', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'meet-1' }, error: null })
    await consultantService.createMeeting({
      participant_id: 'p1',
      scheduled_at: '2026-08-01T10:00:00Z',
      duration_minutes: 30,
      meeting_type: 'video',
      status: 'scheduled',
    })
    expect(mockFrom).toHaveBeenCalledWith('consultant_meetings')
    expect(mockFromBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ participant_id: 'p1', consultant_id: 'consultant-1' })
    )
  })
})

describe('consultantService.updateMeeting / cancelMeeting', () => {
  it('D11: updateMeeting kastar om ingen user är inloggad (auth-guard tillagd)', async () => {
    loggedOut()
    await expect(
      consultantService.updateMeeting('meet-1', { notes: 'uppdaterad' })
    ).rejects.toThrow('Not authenticated')
  })

  it('updateMeeting uppdaterar mötet när inloggad', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'meet-1' }, error: null })
    const result = await consultantService.updateMeeting('meet-1', { notes: 'uppdaterad' })
    expect(mockFrom).toHaveBeenCalledWith('consultant_meetings')
    expect(mockFromBuilder.update).toHaveBeenCalledWith({ notes: 'uppdaterad' })
    expect(result).toEqual({ id: 'meet-1' })
  })

  it('D11: cancelMeeting kastar om ingen user är inloggad (auth-guard tillagd)', async () => {
    loggedOut()
    await expect(consultantService.cancelMeeting('meet-1')).rejects.toThrow('Not authenticated')
  })

  it('cancelMeeting sätter status=cancelled', async () => {
    loggedIn()
    queueResult({ data: null, error: null })
    await consultantService.cancelMeeting('meet-1')
    expect(mockFromBuilder.update).toHaveBeenCalledWith({ status: 'cancelled' })
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('id', 'meet-1')
  })

  it('cancelMeeting kastar vidare supabase-fel', async () => {
    loggedIn()
    queueResult({ data: null, error: new Error('cancel-fel') })
    await expect(consultantService.cancelMeeting('meet-1')).rejects.toThrow('cancel-fel')
  })
})

// ==================== GOALS ====================

describe('consultantService.getGoalsForParticipant', () => {
  it('kastar om ingen user är inloggad', async () => {
    loggedOut()
    await expect(consultantService.getGoalsForParticipant('p1')).rejects.toThrow(
      'Not authenticated'
    )
  })

  it('filtrerar på både consultant_id och participant_id', async () => {
    loggedIn()
    queueResult({ data: [], error: null })
    await consultantService.getGoalsForParticipant('p1')
    expect(mockFrom).toHaveBeenCalledWith('consultant_goals')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('consultant_id', 'consultant-1')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('participant_id', 'p1')
  })
})

describe('consultantService.createGoal', () => {
  it('sätter consultant_id från inloggad user', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'goal-1' }, error: null })
    await consultantService.createGoal({
      participant_id: 'p1',
      title: 'Mål',
      description: '',
      specific: '',
      measurable: '',
      achievable: '',
      relevant: '',
      time_bound: '',
      priority: 'HIGH',
      status: 'NOT_STARTED',
      progress: 0,
      deadline: '2026-12-31',
    })
    expect(mockFromBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ participant_id: 'p1', consultant_id: 'consultant-1' })
    )
  })
})

describe('consultantService.updateGoal', () => {
  it('D11: kastar om ingen user är inloggad (auth-guard tillagd)', async () => {
    loggedOut()
    await expect(
      consultantService.updateGoal('goal-1', { progress: 50 })
    ).rejects.toThrow('Not authenticated')
  })

  it('uppdaterar målet när inloggad', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'goal-1', progress: 50 }, error: null })
    const result = await consultantService.updateGoal('goal-1', { progress: 50 })
    expect(mockFromBuilder.update).toHaveBeenCalledWith({ progress: 50 })
    expect(result).toEqual({ id: 'goal-1', progress: 50 })
  })
})

describe('consultantService.completeGoal', () => {
  it('D11: kastar om ingen user är inloggad (auth-guard tillagd)', async () => {
    loggedOut()
    await expect(consultantService.completeGoal('goal-1')).rejects.toThrow('Not authenticated')
  })

  it('sätter status/progress/completed_at när inloggad', async () => {
    loggedIn()
    queueResult({ data: null, error: null })
    await consultantService.completeGoal('goal-1')
    expect(mockFromBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'COMPLETED', progress: 100, completed_at: expect.any(String) })
    )
  })
})

describe('consultantService.deleteGoal', () => {
  it('D11: kastar om ingen user är inloggad (auth-guard tillagd)', async () => {
    loggedOut()
    await expect(consultantService.deleteGoal('goal-1')).rejects.toThrow('Not authenticated')
  })

  it('anropar delete().eq(id) på consultant_goals', async () => {
    loggedIn()
    queueResult({ data: null, error: null })
    await consultantService.deleteGoal('goal-1')
    expect(mockFrom).toHaveBeenCalledWith('consultant_goals')
    expect(mockFromBuilder.delete).toHaveBeenCalled()
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('id', 'goal-1')
  })

  it('kastar vidare supabase-fel', async () => {
    loggedIn()
    queueResult({ data: null, error: new Error('delete-fel') })
    await expect(consultantService.deleteGoal('goal-1')).rejects.toThrow('delete-fel')
  })
})

// ==================== JOURNAL ====================

describe('consultantService.getJournalEntries / addJournalEntry / deleteJournalEntry', () => {
  it('getJournalEntries kastar om ingen user är inloggad', async () => {
    loggedOut()
    await expect(consultantService.getJournalEntries('p1')).rejects.toThrow('Not authenticated')
  })

  it('addJournalEntry defaultar category till GENERAL', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'j1', category: 'GENERAL' }, error: null })
    await consultantService.addJournalEntry('p1', 'notering')
    expect(mockFrom).toHaveBeenCalledWith('consultant_journal')
    expect(mockFromBuilder.insert).toHaveBeenCalledWith({
      consultant_id: 'consultant-1',
      participant_id: 'p1',
      content: 'notering',
      category: 'GENERAL',
    })
  })

  it('addJournalEntry respekterar explicit category', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'j1' }, error: null })
    await consultantService.addJournalEntry('p1', 'oro', 'CONCERN')
    expect(mockFromBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'CONCERN' })
    )
  })

  it('D11: deleteJournalEntry kastar om ingen user är inloggad (auth-guard tillagd)', async () => {
    loggedOut()
    await expect(consultantService.deleteJournalEntry('j1')).rejects.toThrow('Not authenticated')
  })

  it('deleteJournalEntry anropar delete().eq(id)', async () => {
    loggedIn()
    queueResult({ data: null, error: null })
    await consultantService.deleteJournalEntry('j1')
    expect(mockFrom).toHaveBeenCalledWith('consultant_journal')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('id', 'j1')
  })
})

// ==================== PLACEMENTS ====================

describe('consultantService.recordPlacement / updatePlacementFollowup', () => {
  it('recordPlacement kastar om ingen user är inloggad', async () => {
    loggedOut()
    await expect(
      consultantService.recordPlacement({
        participant_id: 'p1',
        employer_name: 'Acme',
        placement_type: 'permanent',
        followup_3m: false,
        followup_6m: false,
      })
    ).rejects.toThrow('Not authenticated')
  })

  it('recordPlacement sätter consultant_id', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'pl1' }, error: null })
    await consultantService.recordPlacement({
      participant_id: 'p1',
      employer_name: 'Acme',
      placement_type: 'permanent',
      followup_3m: false,
      followup_6m: false,
    })
    expect(mockFrom).toHaveBeenCalledWith('consultant_placements')
    expect(mockFromBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ consultant_id: 'consultant-1', employer_name: 'Acme' })
    )
  })

  it('D11: updatePlacementFollowup kastar om ingen user är inloggad (auth-guard tillagd)', async () => {
    loggedOut()
    await expect(
      consultantService.updatePlacementFollowup('pl1', 'followup_3m', true)
    ).rejects.toThrow('Not authenticated')
  })

  it('updatePlacementFollowup skriver dynamiskt fält (followup_3m/6m)', async () => {
    loggedIn()
    queueResult({ data: null, error: null })
    await consultantService.updatePlacementFollowup('pl1', 'followup_3m', true)
    expect(mockFromBuilder.update).toHaveBeenCalledWith({ followup_3m: true })
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('id', 'pl1')
  })
})

// ==================== ANALYTICS ====================

describe('consultantService.getAnalytics', () => {
  it('kastar om ingen user är inloggad', async () => {
    loggedOut()
    await expect(consultantService.getAnalytics()).rejects.toThrow('Not authenticated')
  })

  it('D11: kastar vidare DB-fel i participants-queryn i stället för att returnera tysta nollor', async () => {
    loggedIn()
    // participants-queryn: data null + error satt. Ett riktigt DB-fel (RLS,
    // nätverk) ska nu synas som ett kastat fel — inte tolkas som "inga deltagare".
    queueResult({ data: null, error: new Error('rls-fel') })
    await expect(consultantService.getAnalytics()).rejects.toThrow('rls-fel')
  })

  it('beräknar aggregat från deltagarlistan och hoppar över goals/placements-queries när tom', async () => {
    loggedIn()
    queueResult({ data: [], error: null })
    const result = await consultantService.getAnalytics()
    expect(result.totalParticipants).toBe(0)
    expect(result.cvCompletionRate).toBe(0)
    // Endast ett .from-anrop (participants) — inga goal/placement-queries när participantIds tom
    expect(mockFrom).toHaveBeenCalledTimes(1)
  })

  it('räknar aktiva/completed/CV/ATS samt goals+placements denna månad', async () => {
    loggedIn()
    queueResult({
      data: [
        { user_id: 'p1', status: 'ACTIVE', has_cv: true, ats_score: 80 },
        { user_id: 'p2', status: 'COMPLETED', has_cv: false, ats_score: 60 },
      ],
      error: null,
    })
    queueResult({ count: 3, error: null }) // journey_goals
    queueResult({ count: 1, error: null }) // consultant_placements
    const result = await consultantService.getAnalytics()
    expect(result.totalParticipants).toBe(2)
    expect(result.activeParticipants).toBe(1)
    expect(result.completedParticipants).toBe(1)
    expect(result.cvCompletionRate).toBe(50)
    expect(result.averageAtsScore).toBe(70)
    expect(result.goalsCompletedThisMonth).toBe(3)
    expect(result.placementsThisMonth).toBe(1)
    expect(mockFrom).toHaveBeenCalledWith('journey_goals')
    expect(mockFrom).toHaveBeenCalledWith('consultant_placements')
  })

  it('sväljer fel i goals/placements-deltat (try/catch) och faller tillbaka till 0', async () => {
    loggedIn()
    queueResult({
      data: [{ user_id: 'p1', status: 'ACTIVE', has_cv: true, ats_score: 80 }],
      error: null,
    })
    queueResult({ __reject: new Error('goals-query kraschade') })
    queueResult({ __reject: new Error('placements-query kraschade') })
    const result = await consultantService.getAnalytics()
    expect(result.goalsCompletedThisMonth).toBe(0)
    expect(result.placementsThisMonth).toBe(0)
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('goalsCompletedThisMonth query failed'),
      expect.any(Error)
    )
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('placementsThisMonth query failed'),
      expect.any(Error)
    )
  })
})

// ==================== PARTICIPANT-RELATION (B3-låsning) ====================
// consultantService skrev tidigare (B3-buggen) mot en obefintlig tabell
// (`participant_consultants`). Dessa tester låser den KORREKTA tabellen
// `consultant_participants` för alla fem skrivvägarna.

describe('consultantService — participant-relation skriver mot consultant_participants (B3-lås)', () => {
  it('logContact kastar om ingen user är inloggad', async () => {
    loggedOut()
    await expect(consultantService.logContact('p1')).rejects.toThrow('Not authenticated')
  })

  it('logContact uppdaterar last_contact_at i consultant_participants filtrerat på båda id:na', async () => {
    loggedIn()
    queueResult({ data: null, error: null })
    await consultantService.logContact('p1')
    expect(mockFrom).toHaveBeenCalledWith('consultant_participants')
    expect(mockFromBuilder.update).toHaveBeenCalledWith({
      last_contact_at: expect.any(String),
    })
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('consultant_id', 'consultant-1')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('participant_id', 'p1')
  })

  it('updateParticipantPriority skriver mot consultant_participants', async () => {
    loggedIn()
    queueResult({ data: null, error: null })
    await consultantService.updateParticipantPriority('p1', 5)
    expect(mockFrom).toHaveBeenCalledWith('consultant_participants')
    expect(mockFromBuilder.update).toHaveBeenCalledWith({ priority: 5 })
  })

  it('updateParticipantStatus skriver mot consultant_participants', async () => {
    loggedIn()
    queueResult({ data: null, error: null })
    await consultantService.updateParticipantStatus('p1', 'ON_HOLD')
    expect(mockFrom).toHaveBeenCalledWith('consultant_participants')
    expect(mockFromBuilder.update).toHaveBeenCalledWith({ status: 'ON_HOLD' })
  })

  it('setParticipantTags ersätter taggarna helt i consultant_participants', async () => {
    loggedIn()
    queueResult({ data: null, error: null })
    await consultantService.setParticipantTags('p1', ['aktiv', 'prioriterad'])
    expect(mockFrom).toHaveBeenCalledWith('consultant_participants')
    expect(mockFromBuilder.update).toHaveBeenCalledWith({ tags: ['aktiv', 'prioriterad'] })
  })

  it('addParticipantTags läser befintliga taggar, mergar unikt och skriver till consultant_participants', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValue({ data: { tags: ['aktiv'] }, error: null })
    queueResult({ data: null, error: null }) // update-kedjan
    await consultantService.addParticipantTags('p1', ['aktiv', 'ny-tagg'])
    expect(mockFrom).toHaveBeenCalledWith('consultant_participants')
    expect(mockFromBuilder.update).toHaveBeenCalledWith({ tags: ['aktiv', 'ny-tagg'] })
  })

  it('addParticipantTags hanterar null/saknade befintliga taggar', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValue({ data: { tags: null }, error: null })
    queueResult({ data: null, error: null })
    await consultantService.addParticipantTags('p1', ['första-taggen'])
    expect(mockFromBuilder.update).toHaveBeenCalledWith({ tags: ['första-taggen'] })
  })

  it('addParticipantTags kastar vidare läsfel utan att försöka skriva', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValue({ data: null, error: new Error('read-fel') })
    await expect(consultantService.addParticipantTags('p1', ['x'])).rejects.toThrow('read-fel')
    expect(mockFromBuilder.update).not.toHaveBeenCalled()
  })

  it('logContact kastar vidare supabase-fel', async () => {
    loggedIn()
    queueResult({ data: null, error: new Error('write-fel') })
    await expect(consultantService.logContact('p1')).rejects.toThrow('write-fel')
  })
})
