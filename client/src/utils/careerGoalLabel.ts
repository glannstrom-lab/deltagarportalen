/**
 * Mapping for career goal slugs stored in profiles.career_goals.shortTerm.
 * The DB stores enum slugs from the onboarding flow; widgets render the
 * Swedish label, never the slug.
 *
 * If the value is a known slug → return Swedish label.
 * Otherwise (free-text user input) → return value unchanged.
 *
 * Slugs come from `client/src/components/career/CareerOnboarding.tsx` GOALS array
 * and are mirrored in `client/src/i18n/locales/sv.json` under `onboarding.goals`.
 */

const GOAL_LABELS: Record<string, string> = {
  'find-job': 'Hitta ett jobb',
  'return-to-work': 'Återgå till arbete',
  'career-change': 'Byta karriär',
  'advance': 'Ta nästa steg',
  'find-direction': 'Hitta min riktning',
  'start-fresh': 'Börja om',
}

export function careerGoalLabel(value: string | null | undefined): string | null {
  if (!value) return null
  return GOAL_LABELS[value] ?? value
}
