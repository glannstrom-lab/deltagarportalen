/**
 * Kompetensnamn och normalisering — EN implementation (KA4, 2026-09-12).
 *
 * Fanns tidigare på tre ställen: `cvOptimizer.skillName/skillText`,
 * `pdfExportService.getSkillName` och en inline-map i `cvWordExport`. Alla
 * gjorde samma sak med små skillnader. Regeln som valdes är den mest använda
 * (cvOptimizer + jobMatching): `trim()` + `toLowerCase()`, diakritik kvar
 * ("Löneadministration" är inte "Loneadministration" för den som söker) och
 * ingen tecken-strippning.
 *
 * Prod-formen på `cvs.skills` är objekt `{id,name,level,category}`; strängform
 * hanteras defensivt eftersom äldre CV-versioner (`cv_versions.data`) kan bära
 * den. `s.name` på en sträng ger `undefined`, inte ett fel — och "undefined"
 * hamnade förr i AI-promptar och UI (CB5). Därför alltid via `skillNamn`.
 */

/** Namnet på en kompetens oavsett form. Tom sträng för allt som inte går att läsa. */
export function skillNamn(skill: unknown): string {
  if (typeof skill === 'string') return skill
  if (skill && typeof skill === 'object') {
    const name = (skill as { name?: unknown }).name
    if (typeof name === 'string') return name
  }
  return ''
}

/** Normaliserad form för sökning och matchning: trimmad, gemener, diakritik kvar. */
export function normaliseraKompetens(skill: unknown): string {
  return skillNamn(skill).trim().toLowerCase()
}

/** Kompetensnamn ur en lista, tomma bortfiltrerade — för visning och export. */
export function skillNamnLista(skills: unknown): string[] {
  if (!Array.isArray(skills)) return []
  return skills.map(skillNamn).map((s) => s.trim()).filter((s) => s.length > 0)
}
