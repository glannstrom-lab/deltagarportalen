/**
 * Feature Flags Configuration
 * Controls which AI features are enabled
 *
 * All features default to enabled. Set env vars to 'false' to disable.
 */

export const AI_FEATURES = {
  /** Deep company analysis with news, culture, and trends */
  COMPANY_ANALYSIS: import.meta.env.VITE_AI_COMPANY_ANALYSIS !== 'false',

  /** Industry trends and market radar personalized to user */
  INDUSTRY_RADAR: import.meta.env.VITE_AI_INDUSTRY_RADAR !== 'false',

  /** Interview preparation with company research and question prep */
  INTERVIEW_PREP: import.meta.env.VITE_AI_INTERVIEW_PREP !== 'false',

  /** Salary market data and negotiation insights */
  SALARY_COMPASS: import.meta.env.VITE_AI_SALARY_COMPASS !== 'false',

  /** Networking assistance with message generation */
  NETWORKING_HELP: import.meta.env.VITE_AI_NETWORKING_HELP !== 'false',

  /** Education paths with courses and certifications */
  EDUCATION_GUIDE: import.meta.env.VITE_AI_EDUCATION_GUIDE !== 'false',

  /** Commute planning with travel time and cost estimates */
  COMMUTE_PLANNER: import.meta.env.VITE_AI_COMMUTE_PLANNER !== 'false',
} as const

/** Check if any AI features are enabled */
export function hasAnyAIFeature(): boolean {
  return Object.values(AI_FEATURES).some(Boolean)
}

/** Check if a specific feature is enabled */
export function isFeatureEnabled(feature: keyof typeof AI_FEATURES): boolean {
  return AI_FEATURES[feature]
}

export default AI_FEATURES
