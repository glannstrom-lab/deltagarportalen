/**
 * Journey Data - Phases and Milestones for "Min Jobbresa"
 */

import type { JourneyPhase } from '@/types/journey.types'

export const JOURNEY_PHASES: JourneyPhase[] = [
  {
    id: 1,
    key: 'foundation',
    name: 'Grund',
    description: 'Skapa din profil och utforska portalen',
    icon: 'foundation',
    xpMin: 0,
    xpMax: 100,
    coachingMessage: 'Varje resa börjar med ett första steg. Du har redan tagit det viktigaste beslutet - att börja!',
    milestones: [
      {
        id: 'profile-created',
        phaseId: 1,
        key: 'profile_created',
        name: 'Skapa profil',
        description: 'Registrera dig och fyll i grundläggande information',
        icon: 'user-plus',
        xpReward: 15,
        category: 'profile',
        requirementType: 'profile_complete',
        requirementValue: 1,
        link: '/profile',
        linkLabel: 'Gå till profil'
      },
      {
        id: 'onboarding-complete',
        phaseId: 1,
        key: 'onboarding_complete',
        name: 'Välj din väg',
        description: 'Slutför introduktionen och välj hur du vill börja',
        icon: 'compass',
        xpReward: 20,
        category: 'onboarding',
        requirementType: 'onboarding_complete',
        requirementValue: 1
      },
      {
        id: 'explore-portal',
        phaseId: 1,
        key: 'explore_portal',
        name: 'Utforska portalen',
        description: 'Besök minst 3 olika sidor för att lära känna verktygen',
        icon: 'layout-grid',
        xpReward: 15,
        category: 'engagement',
        requirementType: 'page_visited',
        requirementValue: 3
      }
    ]
  },
  {
    id: 2,
    key: 'preparation',
    name: 'Förberedelse',
    description: 'Bygg ditt CV och upptäck dina styrkor',
    icon: 'file-text',
    xpMin: 100,
    xpMax: 300,
    coachingMessage: 'Du bygger dina verktyg. Ett starkt CV är din biljett till intervjuer.',
    milestones: [
      {
        id: 'cv-started',
        phaseId: 2,
        key: 'cv_started',
        name: 'Starta ditt CV',
        description: 'Lägg till din första sektion i CV-byggaren',
        icon: 'file-plus',
        xpReward: 20,
        category: 'cv',
        requirementType: 'cv_started',
        requirementValue: 1,
        link: '/cv',
        linkLabel: 'Öppna CV-byggaren'
      },
      {
        id: 'cv-halfway',
        phaseId: 2,
        key: 'cv_halfway',
        name: 'Halvvägs med CV',
        description: 'Nå 50% färdigställande av ditt CV',
        icon: 'percent',
        xpReward: 30,
        category: 'cv',
        requirementType: 'cv_progress',
        requirementValue: 50,
        link: '/cv',
        linkLabel: 'Fortsätt med CV'
      },
      {
        id: 'interest-guide',
        phaseId: 2,
        key: 'interest_guide',
        name: 'Upptäck dina intressen',
        description: 'Slutför intresseguiden och få karriärrekommendationer',
        icon: 'sparkles',
        xpReward: 40,
        category: 'knowledge',
        requirementType: 'interest_guide_complete',
        requirementValue: 1,
        link: '/interest-guide',
        linkLabel: 'Starta intresseguiden'
      },
      {
        id: 'cv-complete',
        phaseId: 2,
        key: 'cv_complete',
        name: 'Färdigställ CV',
        description: 'Slutför ditt CV med alla sektioner ifyllda',
        icon: 'check-circle',
        xpReward: 50,
        category: 'cv',
        requirementType: 'cv_complete',
        requirementValue: 1,
        link: '/cv',
        linkLabel: 'Slutför CV'
      }
    ]
  },
  {
    id: 3,
    key: 'active-search',
    name: 'Aktiv sökning',
    description: 'Hitta och sök relevanta jobb',
    icon: 'search',
    xpMin: 300,
    xpMax: 600,
    coachingMessage: 'Nu är du i rörelse! Varje ansökan är en möjlighet. Det behövs bara ett ja.',
    milestones: [
      {
        id: 'first-saved-job',
        phaseId: 3,
        key: 'first_saved_job',
        name: 'Spara första jobbet',
        description: 'Hitta och spara ett intressant jobb',
        icon: 'bookmark',
        xpReward: 15,
        category: 'jobs',
        requirementType: 'jobs_saved',
        requirementValue: 1,
        link: '/job-search',
        linkLabel: 'Sök jobb'
      },
      {
        id: 'five-saved-jobs',
        phaseId: 3,
        key: 'five_saved_jobs',
        name: 'Bygg din jobb-lista',
        description: 'Spara 5 jobb som matchar dina intressen',
        icon: 'list',
        xpReward: 25,
        category: 'jobs',
        requirementType: 'jobs_saved',
        requirementValue: 5,
        link: '/job-search',
        linkLabel: 'Hitta fler jobb'
      },
      {
        id: 'cover-letter',
        phaseId: 3,
        key: 'cover_letter',
        name: 'Skriv personligt brev',
        description: 'Skapa ditt första personliga brev',
        icon: 'mail',
        xpReward: 30,
        category: 'cv',
        requirementType: 'cover_letter_created',
        requirementValue: 1,
        link: '/cover-letter',
        linkLabel: 'Skapa brev'
      },
      {
        id: 'first-application',
        phaseId: 3,
        key: 'first_application',
        name: 'Skicka första ansökan',
        description: 'Ta steget och skicka din första jobbansökan',
        icon: 'send',
        xpReward: 50,
        category: 'jobs',
        requirementType: 'jobs_applied',
        requirementValue: 1,
        link: '/job-search?tab=applications',
        linkLabel: 'Hantera ansökningar'
      },
      {
        id: 'five-applications',
        phaseId: 3,
        key: 'five_applications',
        name: 'Fem ansökningar',
        description: 'Skicka totalt 5 jobbansökningar',
        icon: 'inbox',
        xpReward: 60,
        category: 'jobs',
        requirementType: 'jobs_applied',
        requirementValue: 5
      }
    ]
  },
  {
    id: 4,
    key: 'development',
    name: 'Utveckling',
    description: 'Fortsätt lära och ta hand om dig själv',
    icon: 'trending-up',
    xpMin: 600,
    xpMax: 1000,
    coachingMessage: 'Du investerar i dig själv. Varje ny kunskap stärker din position.',
    milestones: [
      {
        id: 'read-articles',
        phaseId: 4,
        key: 'read_articles',
        name: 'Utforska kunskapsbanken',
        description: 'Läs 5 artiklar i kunskapsbanken',
        icon: 'book-open',
        xpReward: 25,
        category: 'knowledge',
        requirementType: 'articles_read',
        requirementValue: 5,
        link: '/knowledge-base',
        linkLabel: 'Öppna kunskapsbanken'
      },
      {
        id: 'interview-practice',
        phaseId: 4,
        key: 'interview_practice',
        name: 'Träna på intervju',
        description: 'Genomför en intervjusimulering',
        icon: 'mic',
        xpReward: 40,
        category: 'interview',
        requirementType: 'interview_practice',
        requirementValue: 1,
        link: '/exercises',
        linkLabel: 'Starta övningar'
      },
      {
        id: 'diary-writer',
        phaseId: 4,
        key: 'diary_writer',
        name: 'Dagboksskrivare',
        description: 'Skriv 5 dagboksinlägg för att reflektera',
        icon: 'edit-3',
        xpReward: 30,
        category: 'wellness',
        requirementType: 'diary_entries',
        requirementValue: 5,
        link: '/diary',
        linkLabel: 'Öppna dagboken'
      },
      {
        id: 'week-streak',
        phaseId: 4,
        key: 'week_streak',
        name: 'Veckorutinen',
        description: 'Logga in 7 dagar i rad',
        icon: 'flame',
        xpReward: 50,
        category: 'engagement',
        requirementType: 'streak_days',
        requirementValue: 7
      }
    ]
  },
  {
    id: 5,
    key: 'optimization',
    name: 'Optimering',
    description: 'Förfina din profil och strategi',
    icon: 'settings',
    xpMin: 1000,
    xpMax: 2000,
    coachingMessage: 'Du är nu en erfaren jobbsökare. Dina färdigheter syns!',
    milestones: [
      {
        id: 'cv-ats-optimized',
        phaseId: 5,
        key: 'cv_ats_optimized',
        name: 'ATS-optimerat CV',
        description: 'Nå ATS-score över 80 på ditt CV',
        icon: 'target',
        xpReward: 60,
        category: 'cv',
        requirementType: 'cv_ats_score',
        requirementValue: 80,
        link: '/cv?tab=ats',
        linkLabel: 'Analysera CV'
      },
      {
        id: 'linkedin-optimized',
        phaseId: 5,
        key: 'linkedin_optimized',
        name: 'LinkedIn-profil',
        description: 'Analysera och förbättra din LinkedIn-profil',
        icon: 'linkedin',
        xpReward: 50,
        category: 'linkedin',
        requirementType: 'linkedin_analyzed',
        requirementValue: 1,
        link: '/personal-brand',
        linkLabel: 'Öppna personligt varumärke'
      },
      {
        id: 'ten-applications',
        phaseId: 5,
        key: 'ten_applications',
        name: 'Tio ansökningar',
        description: 'Skicka totalt 10 jobbansökningar',
        icon: 'layers',
        xpReward: 80,
        category: 'jobs',
        requirementType: 'jobs_applied',
        requirementValue: 10
      },
      {
        id: 'month-streak',
        phaseId: 5,
        key: 'month_streak',
        name: 'Månadens kämpe',
        description: 'Logga in 30 dagar i rad',
        icon: 'award',
        xpReward: 100,
        category: 'engagement',
        requirementType: 'streak_days',
        requirementValue: 30
      }
    ]
  },
  {
    id: 6,
    key: 'mastery',
    name: 'Mästerskap',
    description: 'Du är på väg mot målet',
    icon: 'trophy',
    xpMin: 2000,
    xpMax: 5000,
    coachingMessage: 'Du har nått en imponerande nivå. Din uthållighet och engagemang är inspirerande!',
    milestones: [
      {
        id: 'interview-booked',
        phaseId: 6,
        key: 'interview_booked',
        name: 'Intervju bokad',
        description: 'Bli kallad till din första intervju',
        icon: 'calendar-check',
        xpReward: 100,
        category: 'interview',
        requirementType: 'interview_practice',
        requirementValue: 3
      },
      {
        id: 'knowledge-master',
        phaseId: 6,
        key: 'knowledge_master',
        name: 'Kunskapsmästare',
        description: 'Läs 25 artiklar i kunskapsbanken',
        icon: 'graduation-cap',
        xpReward: 100,
        category: 'knowledge',
        requirementType: 'articles_read',
        requirementValue: 25
      },
      {
        id: 'twentyfive-applications',
        phaseId: 6,
        key: 'twentyfive_applications',
        name: 'Ansökningsexpert',
        description: 'Skicka totalt 25 jobbansökningar',
        icon: 'briefcase',
        xpReward: 150,
        category: 'jobs',
        requirementType: 'jobs_applied',
        requirementValue: 25
      },
      {
        id: 'journey-master',
        phaseId: 6,
        key: 'journey_master',
        name: 'Jobbkung',
        description: 'Nå nivå 10 - den högsta nivån',
        icon: 'crown',
        xpReward: 500,
        category: 'special',
        requirementType: 'level_reached',
        requirementValue: 10
      }
    ]
  }
]

export const LEVEL_THRESHOLDS = [
  { level: 1, title: 'Nybörjare', minXP: 0 },
  { level: 2, title: 'Utforskare', minXP: 100 },
  { level: 3, title: 'Jobbsökare', minXP: 250 },
  { level: 4, title: 'Kandidat', minXP: 500 },
  { level: 5, title: 'Professionell', minXP: 800 },
  { level: 6, title: 'Expert', minXP: 1200 },
  { level: 7, title: 'Mästare', minXP: 1800 },
  { level: 8, title: 'Legend', minXP: 2500 },
  { level: 9, title: 'Champion', minXP: 3500 },
  { level: 10, title: 'Jobbkung', minXP: 5000 }
]

export function getLevelFromXP(xp: number): { level: number; title: string; nextLevelXP: number; progress: number } {
  let currentLevel = LEVEL_THRESHOLDS[0]
  let nextLevel = LEVEL_THRESHOLDS[1]

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i].minXP) {
      currentLevel = LEVEL_THRESHOLDS[i]
      nextLevel = LEVEL_THRESHOLDS[i + 1] || LEVEL_THRESHOLDS[i]
      break
    }
  }

  const xpInCurrentLevel = xp - currentLevel.minXP
  const xpNeededForNextLevel = nextLevel.minXP - currentLevel.minXP
  const progress = xpNeededForNextLevel > 0
    ? Math.min(100, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100))
    : 100

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    nextLevelXP: nextLevel.minXP,
    progress
  }
}

export function getPhaseFromXP(xp: number): JourneyPhase {
  for (let i = JOURNEY_PHASES.length - 1; i >= 0; i--) {
    if (xp >= JOURNEY_PHASES[i].xpMin) {
      return JOURNEY_PHASES[i]
    }
  }
  return JOURNEY_PHASES[0]
}
