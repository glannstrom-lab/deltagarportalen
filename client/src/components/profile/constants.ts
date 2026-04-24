/**
 * Profile Constants
 * Centralized constants for the profile page
 * Includes positive language reformulations for better UX
 */

// ============== JOB SUGGESTIONS ==============

export const SUGGESTED_JOBS = [
  'Projektledare', 'Utvecklare', 'Designer', 'Marknadsförare', 'Säljare',
  'Ekonom', 'HR-specialist', 'Lärare', 'Sjuksköterska', 'Ingenjör',
  'Konsult', 'Chef', 'Administratör', 'Analytiker', 'Koordinator'
] as const

export const SUGGESTED_INTERESTS = [
  'Teknik', 'Kreativitet', 'Ledarskap', 'Problemlösning', 'Kommunikation',
  'Analys', 'Teamwork', 'Innovation', 'Strategi', 'Kundkontakt'
] as const

// ============== EMPLOYMENT ==============

export const EMPLOYMENT_STATUSES = [
  { value: 'unemployed', labelKey: 'profile.constants.employment.unemployed' },
  { value: 'employed', labelKey: 'profile.constants.employment.employed' },
  { value: 'student', labelKey: 'profile.constants.employment.student' },
  { value: 'parental_leave', labelKey: 'profile.constants.employment.parentalLeave' },
  { value: 'sick_leave', labelKey: 'profile.constants.employment.sickLeave' },
  { value: 'other', labelKey: 'profile.constants.employment.other' },
] as const

export const EMPLOYMENT_TYPES = [
  { value: 'fulltime', labelKey: 'profile.constants.employmentType.fulltime' },
  { value: 'parttime', labelKey: 'profile.constants.employmentType.parttime' },
  { value: 'freelance', labelKey: 'profile.constants.employmentType.freelance' },
  { value: 'temporary', labelKey: 'profile.constants.employmentType.temporary' },
  { value: 'internship', labelKey: 'profile.constants.employmentType.internship' },
] as const

export const REMOTE_WORK_OPTIONS = [
  { value: 'yes', labelKey: 'profile.constants.remote.yes' },
  { value: 'hybrid', labelKey: 'profile.constants.remote.hybrid' },
  { value: 'no', labelKey: 'profile.constants.remote.no' }
] as const

// ============== MOBILITY ==============

export const DRIVERS_LICENSES = ['B', 'A', 'C', 'D', 'BE', 'CE'] as const

export const SECTORS = [
  { value: 'private', labelKey: 'profile.constants.sector.private' },
  { value: 'public', labelKey: 'profile.constants.sector.public' },
  { value: 'nonprofit', labelKey: 'profile.constants.sector.nonprofit' },
] as const

export const SWEDISH_REGIONS = [
  'Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Linköping',
  'Örebro', 'Västerås', 'Helsingborg', 'Norrköping', 'Jönköping',
  'Umeå', 'Lund', 'Borås', 'Sundsvall', 'Gävle'
] as const

export const INDUSTRIES = [
  { value: 'it_tech', labelKey: 'profile.constants.industry.itTech' },
  { value: 'healthcare', labelKey: 'profile.constants.industry.healthcare' },
  { value: 'construction', labelKey: 'profile.constants.industry.construction' },
  { value: 'transport', labelKey: 'profile.constants.industry.transport' },
  { value: 'retail', labelKey: 'profile.constants.industry.retail' },
  { value: 'education', labelKey: 'profile.constants.industry.education' },
  { value: 'manufacturing', labelKey: 'profile.constants.industry.manufacturing' },
  { value: 'finance', labelKey: 'profile.constants.industry.finance' },
  { value: 'media', labelKey: 'profile.constants.industry.media' },
  { value: 'hospitality', labelKey: 'profile.constants.industry.hospitality' }
] as const

// ============== BENEFITS ==============

export const BENEFITS = [
  { value: 'wellness', labelKey: 'profile.constants.benefit.wellness' },
  { value: 'pension', labelKey: 'profile.constants.benefit.pension' },
  { value: 'flextime', labelKey: 'profile.constants.benefit.flextime' },
  { value: 'remote', labelKey: 'profile.constants.benefit.remote' },
  { value: 'education', labelKey: 'profile.constants.benefit.education' },
  { value: 'bonus', labelKey: 'profile.constants.benefit.bonus' }
] as const

// ============== AF PROGRAMS ==============

export const AF_PROGRAMS = [
  { value: 'jobbgarantin', labelKey: 'profile.constants.afProgram.jobbgarantin' },
  { value: 'etablering', labelKey: 'profile.constants.afProgram.etablering' },
  { value: 'stod_matchning', labelKey: 'profile.constants.afProgram.stodMatchning' },
  { value: 'praktik', labelKey: 'profile.constants.afProgram.praktik' },
  { value: 'nystartsjobb', labelKey: 'profile.constants.afProgram.nystartsjobb' },
] as const

// ============== SUPPORT NEEDS ==============
// Positive language: "Hinder" → "Stöd jag kan behöva"

export const SUPPORT_NEEDS = [
  { value: 'language', labelKey: 'profile.constants.supportNeed.language' },
  { value: 'license', labelKey: 'profile.constants.supportNeed.license' },
  { value: 'validation', labelKey: 'profile.constants.supportNeed.validation' },
  { value: 'experience', labelKey: 'profile.constants.supportNeed.experience' },
  { value: 'health', labelKey: 'profile.constants.supportNeed.health' },
  { value: 'childcare', labelKey: 'profile.constants.supportNeed.childcare' },
] as const

// Legacy mapping for backwards compatibility
export const WORK_BARRIERS = SUPPORT_NEEDS

// ============== ADAPTATION NEEDS ==============
// Positive language: Focus on "what helps me work best"

export const ADAPTATION_NEEDS = [
  { value: 'ergonomic', labelKey: 'profile.constants.adaptation.ergonomic' },
  { value: 'parttime', labelKey: 'profile.constants.adaptation.parttime' },
  { value: 'breaks', labelKey: 'profile.constants.adaptation.breaks' },
  { value: 'quiet', labelKey: 'profile.constants.adaptation.quiet' },
  { value: 'flexible_hours', labelKey: 'profile.constants.adaptation.flexibleHours' },
  { value: 'remote', labelKey: 'profile.constants.adaptation.remote' },
  { value: 'reduced_pace', labelKey: 'profile.constants.adaptation.reducedPace' },
  { value: 'written_instructions', labelKey: 'profile.constants.adaptation.writtenInstructions' },
] as const

// ============== FUNCTIONAL LEVELS ==============
// Positive language

export const FUNCTIONAL_LEVELS = [
  { value: 'full', labelKey: 'profile.constants.functional.full' },
  { value: 'limited', labelKey: 'profile.constants.functional.limited' },
  { value: 'significantly_limited', labelKey: 'profile.constants.functional.significantlyLimited' }
] as const

// ============== REHABILITATION ==============

export const REHABILITATION_PHASES = [
  { value: 'early', labelKey: 'profile.constants.rehab.early' },
  { value: 'ongoing', labelKey: 'profile.constants.rehab.ongoing' },
  { value: 'late', labelKey: 'profile.constants.rehab.late' },
  { value: 'completed', labelKey: 'profile.constants.rehab.completed' }
] as const

// ============== CV STATUS ==============

export const CV_STATUSES = [
  { value: 'complete', labelKey: 'profile.constants.cvStatus.complete' },
  { value: 'needs_update', labelKey: 'profile.constants.cvStatus.needsUpdate' },
  { value: 'missing', labelKey: 'profile.constants.cvStatus.missing' }
] as const

export const REFERENCE_STATUSES = [
  { value: 'available', labelKey: 'profile.constants.reference.available' },
  { value: 'missing', labelKey: 'profile.constants.reference.missing' },
  { value: 'needs_contact', labelKey: 'profile.constants.reference.needsContact' }
] as const

// ============== TIME OF DAY ==============

export const BEST_TIME_OPTIONS = [
  { value: 'morning', labelKey: 'profile.constants.time.morning' },
  { value: 'afternoon', labelKey: 'profile.constants.time.afternoon' },
  { value: 'varies', labelKey: 'profile.constants.time.varies' }
] as const

// ============== TABS ==============

export type TabId = 'overview' | 'jobbsok' | 'kompetens' | 'stod' | 'installningar'

export const TABS = [
  { id: 'overview' as const, labelKey: 'profile.tabs.overview', shortLabelKey: 'profile.tabs.overviewShort' },
  { id: 'jobbsok' as const, labelKey: 'profile.tabs.jobSearch', shortLabelKey: 'profile.tabs.jobSearchShort' },
  { id: 'kompetens' as const, labelKey: 'profile.tabs.skills', shortLabelKey: 'profile.tabs.skillsShort' },
  { id: 'stod' as const, labelKey: 'profile.tabs.support', shortLabelKey: 'profile.tabs.supportShort' },
  { id: 'installningar' as const, labelKey: 'profile.tabs.settings', shortLabelKey: 'profile.tabs.settingsShort' },
] as const

// ============== COMPLETION ==============

export const PROFILE_COMPLETION = {
  TOTAL_FIELDS: 12,
  FIELDS: [
    { key: 'first_name', label: 'Förnamn', priority: 'high' },
    { key: 'last_name', label: 'Efternamn', priority: 'high' },
    { key: 'phone', label: 'Telefon', priority: 'high' },
    { key: 'location', label: 'Ort', priority: 'high' },
    { key: 'desired_jobs', label: 'Önskade jobb', priority: 'high' },
    { key: 'availability_status', label: 'Tillgänglighet', priority: 'medium' },
    { key: 'cv_status', label: 'CV-status', priority: 'high' },
    { key: 'energy_level', label: 'Energinivå', priority: 'medium' },
    { key: 'short_term_goal', label: 'Kortsiktigt mål', priority: 'medium' },
    { key: 'long_term_goal', label: 'Långsiktigt mål', priority: 'medium' },
    { key: 'registered_af', label: 'Registrerad på AF', priority: 'low' },
    { key: 'sectors', label: 'Önskade sektorer', priority: 'low' },
  ]
} as const

// ============== DEBOUNCE TIMES ==============

export const DEBOUNCE_MS = {
  PREFERENCES: 800,
  PROFILE: 1000,
  SEARCH: 300
} as const

// ============== VALIDATION ==============

export const VALIDATION = {
  MAX_TAG_LENGTH: 50,
  MAX_TAGS: 5,
  MAX_TEXTAREA_LENGTH: 2000,
  MAX_INPUT_LENGTH: 200,
  MAX_NAME_LENGTH: 100,
  MAX_PHONE_LENGTH: 20,
  MIN_PHONE_LENGTH: 7,
  MAX_FILE_SIZE_MB: 10,
  MAX_IMAGE_SIZE_MB: 5,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/png']
} as const

// ============== POSITIVE MESSAGES ==============

export const POSITIVE_MESSAGES = {
  COMPLETION: {
    0: 'Välkommen! Låt oss komma igång.',
    25: 'Bra start! Du är på rätt väg.',
    50: 'Halvvägs! Du gör framsteg.',
    75: 'Nästan där! Bara lite kvar.',
    100: 'Fantastiskt! Din profil är komplett.'
  },
  ENCOURAGEMENT: [
    'Varje steg räknas!',
    'Ta den tid du behöver.',
    'Du gör så gott du kan.',
    'Paus är också framsteg.'
  ]
} as const

// ============== SUGGESTED SKILLS ==============

export const SUGGESTED_SKILLS = [
  'Microsoft Office', 'Excel', 'Word', 'PowerPoint',
  'Kundservice', 'Kommunikation', 'Teamwork', 'Ledarskap',
  'Projektledning', 'Problemlösning', 'Tidsstyrning', 'Organisation',
  'Svenska', 'Engelska', 'Körkort B',
  'JavaScript', 'Python', 'React', 'SQL',
  'Försäljning', 'Marknadsföring', 'Ekonomi', 'Bokföring'
] as const
