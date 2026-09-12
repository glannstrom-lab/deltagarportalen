/**
 * Fixturer för företagsvyns tester. Formen följer vyerna i migrationen
 * 20260913100000 (employer_proposals, employer_placements) och tabellerna
 * employer_places/employer_checkins — inte en bekvämare form (CLAUDE.md
 * 2026-08-03: fixturer ska spegla prod-formen).
 */

import type { Organization } from '@/services/orgApi'
import type { Avstamning, Forslag, PagaendePlacering, Plats } from '@/services/foretagApi'

export const ORG: Organization = {
  id: 'org1',
  name: 'Glänne & Söner',
  kind: 'arbetsgivare',
  org_number: '559000-1234',
  ai_enabled: true,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
}

export function forslag(overrides: Partial<Forslag> = {}): Forslag {
  return {
    id: 'f1',
    org_id: 'org1',
    placement_id: 'w1',
    presentation_text: 'Anna är noggrann och vill jobba med händerna.',
    expires_at: '2026-10-01T00:00:00Z',
    max_views: 10,
    view_count: 0,
    last_viewed_at: null,
    decided_at: '2026-09-10T00:00:00Z',
    created_at: '2026-09-08T00:00:00Z',
    employer_response: 'pending',
    employer_message: null,
    employer_responded_at: null,
    show_contact: true,
    show_summary: true,
    show_skills: true,
    show_experience: false,
    show_education: false,
    placement_type: 'praktik',
    occupation: 'Lagerarbetare',
    start_date: '2026-10-05',
    end_date: '2026-11-02',
    hours_per_week: 20,
    schedule_days: 'mån–ons',
    place_id: 'p1',
    place_title: 'Lagerarbete, förmiddagar',
    consultant_first_name: 'Kim',
    consultant_last_name: 'Konsulent',
    consultant_email: 'kim@kommun.se',
    consultant_phone: '070-000 00 00',
    participant_first_name: 'Anna',
    participant_last_name: 'Andersson',
    participant_email: 'anna@example.com',
    participant_phone: null,
    participant_location: 'Borås',
    participant_summary: 'Jag gillar ordning och reda.',
    participant_skills: [{ name: 'Truckkort', category: 'teknik', level: 'intermediate', years_experience: 2 }],
    participant_experience: null,
    participant_education: null,
    ...overrides,
  }
}

export function plats(overrides: Partial<Plats> = {}): Plats {
  return {
    id: 'p1',
    org_id: 'org1',
    title: 'Lagerarbete, förmiddagar',
    placement_type: 'praktik',
    description: 'Plocka och packa.',
    status: 'oppen',
    hours_per_week: 20,
    schedule_days: 'mån–ons 8–12',
    start_from: '2026-10-01',
    address: null,
    lifting_required: true,
    standing_required: true,
    temperature_demands: null,
    noise_level: null,
    pace_level: null,
    shift_work: false,
    physical_notes: null,
    workplace_supervision_capacity: 'hog',
    supervision_notes: 'Lisa går bredvid första veckan.',
    language_requirements: null,
    drivers_license_required: false,
    other_requirements: null,
    contact_name: 'Lisa Lager',
    contact_phone: null,
    contact_email: null,
    sick_call_phone: null,
    sick_call_instructions: null,
    created_by: 'u1',
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
    ...overrides,
  }
}

export function pagaende(overrides: Partial<PagaendePlacering> = {}): PagaendePlacering {
  return {
    id: 'w1',
    org_id: 'org1',
    placement_type: 'arbetstraning',
    status: 'pagaende',
    occupation: 'Lagerarbetare',
    start_date: '2026-09-01',
    end_date: '2026-11-24',
    hours_per_week: 20,
    schedule_days: null,
    can_ramp_up: true,
    ramp_up_plan: 'Börja 2 dagar, öka till 3 efter fyra veckor.',
    employer_instructions: 'Korta, tydliga instruktioner. En sak i taget.',
    work_environment_responsibility: null,
    sick_call_phone: '033-123 45 67',
    sick_call_instructions: 'Ring före 07.00.',
    place_id: 'p1',
    place_title: 'Lagerarbete, förmiddagar',
    participant_first_name: 'Anna',
    participant_last_name: 'Andersson',
    consultant_first_name: 'Kim',
    consultant_last_name: 'Konsulent',
    consultant_email: 'kim@kommun.se',
    consultant_phone: null,
    proposal_id: 'f1',
    employer_response: 'interested',
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
    ...overrides,
  }
}

export function avstamning(overrides: Partial<Avstamning> = {}): Avstamning {
  return {
    id: 'a1',
    placement_id: 'w1',
    org_id: 'org1',
    author_id: 'u1',
    milestone_week: 12,
    going_well: 'Kommer i tid, trivs.',
    concerns: null,
    continue_interest: 'ja',
    created_at: '2026-09-12T00:00:00Z',
    ...overrides,
  }
}
