/**
 * Kanoniska CV-typer (KA4, 2026-09-12). EN `CVData` i hela klienten.
 *
 * Flyttade hit från `services/supabaseApi.ts`, som re-exporterar dem så att
 * befintliga importer fungerar. Grinden `src/test/en-cvdata.test.ts` fäller
 * varje ny `interface CVData`/`type CVData` utanför den här filen (och
 * derivationerna i `types/pdf.types.ts` / `hooks/useDashboardData.ts`).
 *
 * Prod-formen (verifierad mot `supabase/schema-snapshot.json`): kolumnerna i
 * `cvs` är snake_case (`first_name`, `work_experience`, `color_scheme`,
 * `ats_score`, `updated_at` ...) medan UI:t använder camelCase — därför bär
 * typen båda. `cvs.skills` är OBJEKT (`{id,name,level,category}`), inte
 * strängar (lärdomen 2026-08-03 i CLAUDE.md); läs namnet genom
 * `utils/skillText.ts` i stället för `typeof skill === 'string'`-grenar.
 */

// WorkExperience som används i UI-komponenter (camelCase)
export interface WorkExperience {
  id: string
  title: string
  company: string
  location?: string
  startDate: string
  endDate?: string
  current?: boolean
  description?: string
}

// Education som används i UI-komponenter (camelCase)
export interface Education {
  id: string
  degree: string
  school: string
  field?: string
  location?: string
  startDate: string
  endDate?: string
  description?: string
}

// Skill som används i UI-komponenter
export interface Skill {
  id: string
  name: string
  level: number // 1-5
  category: 'technical' | 'soft' | 'tool' | 'language' | 'certification' | 'other'
}

// Language som används i UI-komponenter
export interface Language {
  id: string
  language: string
  level: 'Grundläggande' | 'God' | 'Flytande' | 'Modersmål'
}

// Certificate som används i UI-komponenter
export interface Certificate {
  id: string
  name: string
  issuer?: string
  date?: string
  expiryDate?: string
}

// Link som används i UI-komponenter
export interface Link {
  id: string
  type: 'linkedin' | 'github' | 'portfolio' | 'website' | 'other'
  url: string
  label?: string
}

// Reference som används i UI-komponenter
export interface Reference {
  id: string
  name: string
  title?: string
  company?: string
  relation?: string
  email?: string
  phone?: string
}

// Huvud-CVData interface som används i hela applikationen
export interface CVData {
  id?: string
  user_id?: string
  // Riktiga kolumner i `cvs` (schema-snapshot 2026-09-11); saknades i typen.
  created_at?: string
  updated_at?: string
  // Personlig info (camelCase för UI)
  firstName?: string
  lastName?: string
  first_name?: string
  last_name?: string
  profileImage?: string | null
  profile_image?: string | null
  title?: string | null
  email?: string | null
  phone?: string | null
  location?: string | null
  summary?: string | null
  // Erfarenheter och utbildning
  workExperience?: WorkExperience[]
  work_experience?: WorkExperience[]
  education?: Education[]
  // Kompetenser och andra listor
  skills?: Skill[]
  languages?: Language[]
  certificates?: Certificate[]
  links?: Link[]
  references?: Reference[]
  // Utseende
  template?: string
  colorScheme?: string
  color_scheme?: string
  font?: string
  // ATS-analys
  ats_score?: number | null
  atsScore?: number | null
  ats_feedback?: unknown
  atsFeedback?: unknown
}
