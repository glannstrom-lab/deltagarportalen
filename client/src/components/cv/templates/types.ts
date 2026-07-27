/**
 * CV Template Types
 */

import type {
  CVData,
  WorkExperience,
  Education,
  Skill,
  Language,
  Certificate,
  Link,
} from '@/services/supabaseApi'

/**
 * CVData som den ser ut EFTER `sanitizeForTemplate()` — de sex listorna är
 * garanterat arrayer, aldrig `undefined`.
 *
 * Varför en egen typ: `CVData` har alla fält valfria eftersom den speglar en
 * halvifylld databasrad. Mallarna körs alltid på sanerad data (de tre
 * renderarna — CVPreview, CVPrintLayout, PagedCVPrint — sanerar innan de
 * renderar), men eftersom sanitize returnerade `CVData` gick den kunskapen
 * förlorad i typsystemet. Resultatet var ~146 `possibly undefined`-fel spridda
 * över tolv mallfiler för något som aldrig kan inträffa. Typen bär nu
 * garantin i stället.
 */
export type TemplateCVData = Omit<
  CVData,
  'workExperience' | 'education' | 'skills' | 'languages' | 'certificates' | 'links'
> & {
  workExperience: WorkExperience[]
  education: Education[]
  skills: Skill[]
  languages: Language[]
  certificates: Certificate[]
  links: Link[]
}

export interface TemplateProps {
  data: TemplateCVData
  fullName: string
}
