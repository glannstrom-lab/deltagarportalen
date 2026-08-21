/**
 * Underlaget kompetensanalysen vilar på — och vad som saknas i det.
 *
 * Låg tidigare inne i `SkillsGapAnalysis.tsx` och gick därför inte att testa
 * utan att montera hela sidan. Sidan hade noll egna testfiler.
 */
import type { CVData } from '@/services/supabaseApi'

export type Profildel = 'erfarenhet' | 'utbildning' | 'kompetenser'

/** Vilka delar av CV:t som faktiskt har innehåll. */
export interface Profiltackning {
  erfarenhet: boolean
  utbildning: boolean
  kompetenser: boolean
  /** Delar som saknas, i den ordning de bör fyllas i. */
  saknas: Profildel[]
  /** Räcker underlaget för att en analys ska säga något? */
  racker: boolean
}

export function formatProfileSummary(cvData: CVData | null): string {
  if (!cvData) return ''

  const parts: string[] = []

  // Namnet gick tidigare med i prompten. Det behövs inte för att jämföra
  // kompetenser mot ett yrke, och varje personuppgift som lämnar portalen
  // ska ha ett skäl. Titeln är kvar — den säger något om yrkesinriktning.
  const title = cvData.title || ''
  if (title) {
    parts.push(`Nuvarande yrkesroll: ${title}`)
  }

  if (cvData.summary) {
    parts.push(`\nProfil: ${cvData.summary}`)
  }

  const workExp = cvData.workExperience || cvData.work_experience || []
  if (workExp.length > 0) {
    parts.push('\nArbetserfarenhet:')
    workExp.forEach(exp => {
      const period = exp.startDate ? `${exp.startDate} - ${exp.endDate || 'nuvarande'}` : ''
      parts.push(`- ${exp.title} på ${exp.company}${period ? ` (${period})` : ''}`)
      if (exp.description) {
        parts.push(`  ${exp.description.substring(0, 200)}${exp.description.length > 200 ? '...' : ''}`)
      }
    })
  }

  const education = cvData.education || []
  if (education.length > 0) {
    parts.push('\nUtbildning:')
    education.forEach(edu => {
      // Årtalet lästes tidigare ur `edu.year`, ett fält som inte finns i typen
      // och som noll av 26 CV:n i prod bär (mätt 2026-08-21). Utbildningens
      // tid nådde alltså aldrig prompten. Datumen ligger i startDate/endDate.
      const ar = edu.endDate || edu.startDate || ''
      parts.push(`- ${edu.degree || edu.field} på ${edu.school}${ar ? ` (${ar})` : ''}`)
    })
  }

  const skills = cvData.skills || []
  if (skills.length > 0) {
    parts.push('\nKompetenser:')
    parts.push(skills.map(s => typeof s === 'string' ? s : s.name).join(', '))
  }

  const languages = cvData.languages || []
  if (languages.length > 0) {
    parts.push('\nSpråk:')
    // Fältet heter `language`, inte `name`. Koden läste `l.name` och skickade
    // därför "undefined (Flytande)" till modellen — för 15 av de 18 CV:n i prod
    // som har språk ifyllda (mätt 2026-08-21). Fyra rader bär `name`,
    // sannolikt från en äldre import, så båda formerna tas emot.
    parts.push(
      languages
        .map(l => {
          if (typeof l === 'string') return l
          const o = l as { language?: string; name?: string; level?: string }
          const namn = o.language || o.name || ''
          if (!namn) return ''
          return o.level ? `${namn} (${o.level})` : namn
        })
        .filter(Boolean)
        .join(', ')
    )
  }

  const certs = cvData.certificates || []
  if (certs.length > 0) {
    parts.push('\nCertifikat:')
    certs.forEach(cert => {
      parts.push(`- ${cert.name}${cert.issuer ? ` från ${cert.issuer}` : ''}`)
    })
  }

  return parts.join('\n')
}

/**
 * Sidan gick tidigare på `profileSummary.trim().length > 50`. Ett CV med bara
 * namn och titel passerade den tröskeln och gav en analys utan underlag; ett
 * CV med tre kompetenser men inget annat föll under den och fick beskedet
 * "fyll i mer" utan att någonstans få veta VAD som saknades. Ett teckenantal
 * kan inte svara på den frågan — fälten kan.
 */
export function profiltackning(cvData: CVData | null): Profiltackning {
  const workExp = cvData?.workExperience || cvData?.work_experience || []
  const education = cvData?.education || []
  const skills = cvData?.skills || []

  const erfarenhet = workExp.length > 0
  const utbildning = education.length > 0
  const kompetenser = skills.length > 0

  const saknas: Profildel[] = []
  if (!erfarenhet) saknas.push('erfarenhet')
  if (!utbildning) saknas.push('utbildning')
  if (!kompetenser) saknas.push('kompetenser')

  return {
    erfarenhet,
    utbildning,
    kompetenser,
    saknas,
    // Två av tre räcker, eller kompetenser plus något. En jämförelse mot ett
    // yrke behöver veta antingen vad personen gjort eller vad personen kan.
    racker: (erfarenhet || utbildning) && [erfarenhet, utbildning, kompetenser].filter(Boolean).length >= 2,
  }
}
