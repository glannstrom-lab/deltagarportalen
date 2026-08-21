/**
 * Nedladdningen av analysen som textfil.
 *
 * Två saker rättades 2026-08-21:
 *
 * · **Filen bar ingen AI-märkning.** Skärmen har `AIGeneratedWatermark` med
 *   hänvisning till AI Act art. 50.2 — filen som lämnar portalen hade
 *   ingenting. Det är just den som skickas vidare till en handledare eller
 *   arbetsgivare, alltså den där ursprunget spelar mest roll.
 *
 * · **Matchningsprocenten stod som "Matchningsgrad: 22 %".** Samma tal som
 *   togs bort ur gränssnittet, kvar i det dokument användaren kan lämna
 *   ifrån sig. Ersatt av samma räknade mening som skärmen visar.
 */
import type { TFunction } from 'i18next'
import type { SkillsAnalysis } from '@/services/careerApi'
import type { Education } from '@/services/educationApi'
import { antalKlara, kortDromjobb } from './dromjobb'

export function laddaNerAnalys(
  analysis: SkillsAnalysis,
  utbildningar: Education[],
  t: TFunction,
  sprak: string
): void {
  const skills = analysis.skills_comparison || []
  const actionPlan = analysis.action_plan || []
  const dateLocale = sprak === 'sv' ? 'sv-SE' : 'en-US'

  const rader: string[] = [
    t('skillsGapAnalysis.download.title'),
    '',
    t('skillsGapAnalysis.download.aiNotice'),
    '',
    `${t('skillsGapAnalysis.download.date')}: ${new Date(analysis.created_at).toLocaleDateString(dateLocale)}`,
    `${t('skillsGapAnalysis.download.dreamJob')}: ${kortDromjobb(analysis.dream_job) || '—'}`,
    '',
    t('skillsGapAnalysis.result.summary', { klara: antalKlara(skills), totalt: skills.length }),
    '',
    `${t('skillsGapAnalysis.download.skillsOverview')}:`,
  ]

  if (skills.length === 0) {
    rader.push('—')
  } else {
    skills.forEach(s => {
      const skillnad = Math.max(0, s.target - s.current)
      rader.push(
        `- ${s.name}: ${t('skillsGapAnalysis.currentLevel', { niva: s.current })}, ` +
        `${t('skillsGapAnalysis.roleLevel', { niva: s.target })}` +
        (skillnad === 0 ? '' : ` (${t('skillsGapAnalysis.gapSteps', { antal: skillnad })})`)
      )
    })
  }

  rader.push('', `${t('skillsGapAnalysis.educations.title')}:`)
  if (utbildningar.length === 0) {
    // Ett tomt fält är inte en nolla — och en lista vi inte lyckades hämta
    // ska inte se ut som ett besked om att inget finns.
    rader.push('—')
  } else {
    rader.push(t('skillsGapAnalysis.download.educationSource'))
    utbildningar.forEach(u => {
      rader.push(`- ${u.title}${u.formLabel ? ` (${u.formLabel})` : ''}${u.provider ? ` — ${u.provider}` : ''}`)
    })
  }

  rader.push('', `${t('skillsGapAnalysis.download.actionPlan')}:`)
  if (actionPlan.length === 0) {
    rader.push('—')
  } else {
    actionPlan.forEach(a => rader.push(`${a.order}. ${a.title}: ${a.description}`))
  }

  const blob = new Blob([rader.join('\n')], { type: 'text/plain;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${t('skillsGapAnalysis.download.filename')}-${new Date(analysis.created_at).toISOString().split('T')[0]}.txt`
  a.click()
  // URL:en revokades aldrig — varje nedladdning läckte en blob tills fliken
  // stängdes.
  window.URL.revokeObjectURL(url)
}
