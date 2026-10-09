/**
 * Lyktornas logik (spår JS) — se Lyktstig.tsx för reglerna.
 */
import type { TFunction } from 'i18next'
import type { OversiktSummary } from '@/hooks/useOversiktHubSummary'
import { narText } from './oversiktTid'

export interface Lykta {
  id: string
  titel: string
  nar: string | null
  datum: string | null
}

export interface Slackt {
  id: string
  titel: string
  till: string
}

/** Ordningen för nästa släckta lykta — det som brukar komma först i ett jobbsök. */
const NASTA: Array<{ id: string; till: string }> = [
  { id: 'cv', till: '/cv' },
  { id: 'ansokan', till: '/job-search' },
  { id: 'brev', till: '/cover-letter' },
  { id: 'intervju', till: '/interview-simulator' },
  { id: 'mal', till: '/career' },
  { id: 'analys', till: '/skills-gap-analysis' },
  { id: 'ai', till: '/ai-team' },
  { id: 'dagbok', till: '/diary' },
]

const TITLAR: Record<string, string> = {
  cv: 'Du har ett CV',
  ansokan: 'Du har börjat söka jobb',
  brev: 'Du har skrivit ett personligt brev',
  intervju: 'Du har övat på en intervju',
  mal: 'Du har skrivit ett karriärmål',
  analys: 'Du har jämfört ditt CV med ett drömjobb',
  ai: 'Du har pratat med AI-teamet',
  artikel: 'Du har läst en guide klart',
  dagbok: 'Du har skrivit i dagboken',
  maende: 'Du har loggat hur du mår',
}

const NASTA_TITLAR: Record<string, string> = {
  cv: 'Skriv ditt CV',
  ansokan: 'Spara ett jobb du gillar',
  brev: 'Skriv ett personligt brev',
  intervju: 'Öva på en intervju',
  mal: 'Skriv ett karriärmål',
  analys: 'Jämför ditt CV med ett drömjobb',
  ai: 'Prata med AI-teamet',
  dagbok: 'Skriv några rader i dagboken',
}

export function byggLyktor(s: OversiktSummary, t: TFunction, sprak: string): { tanda: Lykta[]; nasta: Slackt | null } {
  const tanda: Lykta[] = []
  const lagg = (id: string, finns: boolean, datum: string | null | undefined) => {
    if (!finns) return
    tanda.push({
      id,
      titel: t(`varld.lykta.${id}`, TITLAR[id]),
      datum: datum ?? null,
      nar: datum ? narText(datum, t, sprak) : null,
    })
  }
  const j = s.jobsok
  const k = s.karriar
  const r = s.resurser
  const v = s.minVardag
  lagg('cv', !!j?.cv, j?.cv?.updated_at)
  lagg('ansokan', (j?.applicationStats?.total ?? 0) > 0, j?.applicationStats?.awaitingSince)
  lagg('brev', (j?.coverLetters?.length ?? 0) > 0, j?.coverLetters?.[0]?.created_at)
  lagg('intervju', (j?.interviewSessions?.length ?? 0) > 0, j?.interviewSessions?.[0]?.created_at)
  const mal = k?.careerGoals
  lagg('mal', !!(mal && (mal.shortTerm || mal.longTerm || mal.preferredRoles?.length)), mal?.updatedAt)
  lagg('analys', !!k?.latestSkillsAnalysis, k?.latestSkillsAnalysis?.created_at)
  lagg('ai', (r?.aiTeamSessionCount ?? 0) > 0, r?.aiTeamSessions?.[0]?.updated_at)
  lagg('artikel', (r?.articleCompletedCount ?? 0) > 0, r?.recentArticles?.find((a) => a.completed_at)?.completed_at)
  lagg('dagbok', (v?.diaryEntryCount ?? 0) > 0, v?.latestDiaryEntry?.created_at)
  lagg('maende', (v?.recentMoodLogs?.length ?? 0) > 0, v?.recentMoodLogs?.[0]?.log_date)

  // Senast först; det som saknar datum sist.
  tanda.sort((a, b) => (b.datum ?? '').localeCompare(a.datum ?? ''))
  const tandId = new Set(tanda.map((l) => l.id))
  const n = NASTA.find((x) => !tandId.has(x.id))
  return {
    tanda: tanda.slice(0, 5),
    nasta: n ? { id: n.id, till: n.till, titel: t(`varld.lykta.nasta.${n.id}`, NASTA_TITLAR[n.id]) } : null,
  }
}

