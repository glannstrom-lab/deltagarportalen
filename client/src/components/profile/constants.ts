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
  { value: 'unemployed', label: 'Arbetssökande' },
  { value: 'employed', label: 'Anställd' },
  { value: 'student', label: 'Studerar' },
  { value: 'parental_leave', label: 'Föräldraledig' },
  { value: 'sick_leave', label: 'Sjukskriven' },
  { value: 'other', label: 'Annat' },
] as const

export const EMPLOYMENT_TYPES = [
  { value: 'fulltime', label: 'Heltid' },
  { value: 'parttime', label: 'Deltid' },
  { value: 'freelance', label: 'Frilans' },
  { value: 'temporary', label: 'Vikariat' },
  { value: 'internship', label: 'Praktik' },
] as const

export const REMOTE_WORK_OPTIONS = [
  { value: 'yes', label: 'Ja, helt på distans' },
  { value: 'hybrid', label: 'Hybrid (blandat)' },
  { value: 'no', label: 'På plats' }
] as const

// ============== MOBILITY ==============

export const DRIVERS_LICENSES = ['B', 'A', 'C', 'D', 'BE', 'CE'] as const

export const SECTORS = [
  { value: 'private', label: 'Privat' },
  { value: 'public', label: 'Offentlig' },
  { value: 'nonprofit', label: 'Ideell' },
] as const

export const SWEDISH_REGIONS = [
  'Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Linköping',
  'Örebro', 'Västerås', 'Helsingborg', 'Norrköping', 'Jönköping',
  'Umeå', 'Lund', 'Borås', 'Sundsvall', 'Gävle'
] as const

export const INDUSTRIES = [
  'IT & Tech', 'Vård & omsorg', 'Bygg', 'Transport', 'Handel',
  'Utbildning', 'Industri', 'Bank & finans', 'Media', 'Restaurang'
] as const

// ============== BENEFITS ==============

export const BENEFITS = [
  'Friskvård', 'Pension', 'Flex-tid', 'Distans', 'Utbildning', 'Bonus'
] as const

// ============== AF PROGRAMS ==============

export const AF_PROGRAMS = [
  { value: 'jobbgarantin', label: 'Jobbgarantin' },
  { value: 'etablering', label: 'Etablering' },
  { value: 'stod_matchning', label: 'Stöd & matchning' },
  { value: 'praktik', label: 'Praktik' },
  { value: 'nystartsjobb', label: 'Nystartsjobb' },
] as const

// ============== SUPPORT NEEDS ==============
// Positive language: "Hinder" → "Stöd jag kan behöva"

export const SUPPORT_NEEDS = [
  { value: 'language', label: 'Jag utvecklar mitt svenska' },
  { value: 'license', label: 'Jag tar körkort' },
  { value: 'validation', label: 'Validering av utbildning pågår' },
  { value: 'experience', label: 'Jag är ny inom området' },
  { value: 'health', label: 'Jag behöver hänsyn till min hälsa' },
  { value: 'childcare', label: 'Barnomsorg behöver ordnas' },
] as const

// Legacy mapping for backwards compatibility
export const WORK_BARRIERS = SUPPORT_NEEDS

// ============== ADAPTATION NEEDS ==============
// Positive language: Focus on "what helps me work best"

export const ADAPTATION_NEEDS = [
  { value: 'ergonomic', label: 'Ergonomisk arbetsplats' },
  { value: 'parttime', label: 'Deltidsarbete' },
  { value: 'breaks', label: 'Regelbundna pauser' },
  { value: 'quiet', label: 'Lugn miljö' },
  { value: 'flexible_hours', label: 'Flexibla tider' },
  { value: 'remote', label: 'Distansarbete' },
  { value: 'reduced_pace', label: 'Anpassat tempo' },
  { value: 'written_instructions', label: 'Tydliga skriftliga instruktioner' },
] as const

// ============== FUNCTIONAL LEVELS ==============
// Positive language

export const FUNCTIONAL_LEVELS = [
  { value: 'full', label: 'Full kapacitet' },
  { value: 'limited', label: 'Viss anpassning behövs' },
  { value: 'significantly_limited', label: 'Mer anpassning behövs' }
] as const

// ============== REHABILITATION ==============

export const REHABILITATION_PHASES = [
  { value: 'early', label: 'Tidig fas' },
  { value: 'ongoing', label: 'Pågående' },
  { value: 'late', label: 'Avslutande fas' },
  { value: 'completed', label: 'Avslutad' }
] as const

// ============== CV STATUS ==============

export const CV_STATUSES = [
  { value: 'complete', label: 'Komplett' },
  { value: 'needs_update', label: 'Kan uppdateras' },
  { value: 'missing', label: 'Inte påbörjat ännu' }
] as const

export const REFERENCE_STATUSES = [
  { value: 'available', label: 'Finns tillgängliga' },
  { value: 'missing', label: 'Behöver samla' },
  { value: 'needs_contact', label: 'Behöver kontaktas' }
] as const

// ============== TIME OF DAY ==============

export const BEST_TIME_OPTIONS = [
  { value: 'morning', label: 'Förmiddag' },
  { value: 'afternoon', label: 'Eftermiddag' },
  { value: 'varies', label: 'Varierar' }
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
