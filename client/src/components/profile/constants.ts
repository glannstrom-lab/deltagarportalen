/**
 * Profile Constants
 * Centralized constants for the profile page
 * Includes positive language reformulations for better UX
 */

// ============== JOB SUGGESTIONS ==============

export const SUGGESTED_JOBS = [
  { value: 'projektledare', labelKey: 'profile.suggestions.jobs.projectManager' },
  { value: 'utvecklare', labelKey: 'profile.suggestions.jobs.developer' },
  { value: 'designer', labelKey: 'profile.suggestions.jobs.designer' },
  { value: 'marknadsforare', labelKey: 'profile.suggestions.jobs.marketer' },
  { value: 'saljare', labelKey: 'profile.suggestions.jobs.salesperson' },
  { value: 'ekonom', labelKey: 'profile.suggestions.jobs.economist' },
  { value: 'hr_specialist', labelKey: 'profile.suggestions.jobs.hrSpecialist' },
  { value: 'larare', labelKey: 'profile.suggestions.jobs.teacher' },
  { value: 'sjukskoterska', labelKey: 'profile.suggestions.jobs.nurse' },
  { value: 'ingenjor', labelKey: 'profile.suggestions.jobs.engineer' },
  { value: 'konsult', labelKey: 'profile.suggestions.jobs.consultant' },
  { value: 'chef', labelKey: 'profile.suggestions.jobs.manager' },
  { value: 'administrator', labelKey: 'profile.suggestions.jobs.administrator' },
  { value: 'analytiker', labelKey: 'profile.suggestions.jobs.analyst' },
  { value: 'koordinator', labelKey: 'profile.suggestions.jobs.coordinator' }
] as const

export const SUGGESTED_INTERESTS = [
  { value: 'teknik', labelKey: 'profile.suggestions.interests.technology' },
  { value: 'kreativitet', labelKey: 'profile.suggestions.interests.creativity' },
  { value: 'ledarskap', labelKey: 'profile.suggestions.interests.leadership' },
  { value: 'problemlosning', labelKey: 'profile.suggestions.interests.problemSolving' },
  { value: 'kommunikation', labelKey: 'profile.suggestions.interests.communication' },
  { value: 'analys', labelKey: 'profile.suggestions.interests.analysis' },
  { value: 'teamwork', labelKey: 'profile.suggestions.interests.teamwork' },
  { value: 'innovation', labelKey: 'profile.suggestions.interests.innovation' },
  { value: 'strategi', labelKey: 'profile.suggestions.interests.strategy' },
  { value: 'kundkontakt', labelKey: 'profile.suggestions.interests.customerContact' }
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
    { key: 'first_name', labelKey: 'profile.completion.fields.firstName', priority: 'high' },
    { key: 'last_name', labelKey: 'profile.completion.fields.lastName', priority: 'high' },
    { key: 'phone', labelKey: 'profile.completion.fields.phone', priority: 'high' },
    { key: 'location', labelKey: 'profile.completion.fields.location', priority: 'high' },
    { key: 'desired_jobs', labelKey: 'profile.completion.fields.desiredJobs', priority: 'high' },
    { key: 'availability_status', labelKey: 'profile.completion.fields.availability', priority: 'medium' },
    { key: 'cv_status', labelKey: 'profile.completion.fields.cvStatus', priority: 'high' },
    { key: 'energy_level', labelKey: 'profile.completion.fields.energyLevel', priority: 'medium' },
    { key: 'short_term_goal', labelKey: 'profile.completion.fields.shortTermGoal', priority: 'medium' },
    { key: 'long_term_goal', labelKey: 'profile.completion.fields.longTermGoal', priority: 'medium' },
    { key: 'registered_af', labelKey: 'profile.completion.fields.registeredAF', priority: 'low' },
    { key: 'sectors', labelKey: 'profile.completion.fields.sectors', priority: 'low' },
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
    0: 'profile.messages.completion.welcome',
    25: 'profile.messages.completion.goodStart',
    50: 'profile.messages.completion.halfway',
    75: 'profile.messages.completion.almostThere',
    100: 'profile.messages.completion.complete'
  },
  ENCOURAGEMENT: [
    'profile.messages.encouragement.everyStep',
    'profile.messages.encouragement.takeYourTime',
    'profile.messages.encouragement.doingGreat',
    'profile.messages.encouragement.pauseIsProgress'
  ]
} as const

// ============== SUGGESTED SKILLS ==============

export const SUGGESTED_SKILLS = [
  { value: 'microsoft_office', labelKey: 'profile.suggestions.skills.microsoftOffice' },
  { value: 'excel', labelKey: 'profile.suggestions.skills.excel' },
  { value: 'word', labelKey: 'profile.suggestions.skills.word' },
  { value: 'powerpoint', labelKey: 'profile.suggestions.skills.powerpoint' },
  { value: 'customer_service', labelKey: 'profile.suggestions.skills.customerService' },
  { value: 'communication', labelKey: 'profile.suggestions.skills.communication' },
  { value: 'teamwork', labelKey: 'profile.suggestions.skills.teamwork' },
  { value: 'leadership', labelKey: 'profile.suggestions.skills.leadership' },
  { value: 'project_management', labelKey: 'profile.suggestions.skills.projectManagement' },
  { value: 'problem_solving', labelKey: 'profile.suggestions.skills.problemSolving' },
  { value: 'time_management', labelKey: 'profile.suggestions.skills.timeManagement' },
  { value: 'organization', labelKey: 'profile.suggestions.skills.organization' },
  { value: 'swedish', labelKey: 'profile.suggestions.skills.swedish' },
  { value: 'english', labelKey: 'profile.suggestions.skills.english' },
  { value: 'drivers_license_b', labelKey: 'profile.suggestions.skills.driversLicenseB' },
  { value: 'javascript', labelKey: 'profile.suggestions.skills.javascript' },
  { value: 'python', labelKey: 'profile.suggestions.skills.python' },
  { value: 'react', labelKey: 'profile.suggestions.skills.react' },
  { value: 'sql', labelKey: 'profile.suggestions.skills.sql' },
  { value: 'sales', labelKey: 'profile.suggestions.skills.sales' },
  { value: 'marketing', labelKey: 'profile.suggestions.skills.marketing' },
  { value: 'economics', labelKey: 'profile.suggestions.skills.economics' },
  { value: 'accounting', labelKey: 'profile.suggestions.skills.accounting' }
] as const
