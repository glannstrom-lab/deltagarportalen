/**
 * Snabb-CV:s förifyllda profiltext och kompetenser, framräknade ur yrkestiteln.
 *
 * Bor här (inte i QuickCVMode) så att CV-byggaren kan jämföra det användaren
 * har mot mallens egen text — se `arOredigeradSnabbmall` (EG8).
 *
 * Texten är medvetet saklig och påstår inga meriter (inga truckkort, inga år,
 * inga certifikat): användaren fyller i det som är sant för hen.
 */

import type { CVData } from '@/services/supabaseApi'

const LAGER_ORD = ['lager', 'truck', 'chaufför', 'förare', 'lastbil', 'logistik', 'plockare']

function arLagerYrke(title: string): boolean {
  return LAGER_ORD.some(ord => title.includes(ord))
}

// Generera en grundläggande sammanfattning baserat på jobbtitel
export function generateQuickSummary(jobTitle: string): string {
  const title = jobTitle.toLowerCase()

  // Lager/förare först: "lagerchef" ska inte fångas av "chef" längre ner.
  if (arLagerYrke(title)) {
    return 'Ordningsam och pålitlig med intresse för lager och logistik. Arbetar noggrant, tar ansvar för sina arbetsuppgifter och samarbetar väl med kollegor.'
  }
  if (title.includes('utvecklare') || title.includes('programmerare')) {
    return 'Engagerad utvecklare med passion för att skapa användarvänliga lösningar. Trivs med att lösa komplexa problem och lära mig nya tekniker.'
  }
  if (title.includes('projektledare') || title.includes('chef')) {
    return 'Resultatinriktad ledare med erfarenhet av att driva projekt från idé till leverans. Stark kommunikatör som motiverar team att nå sina mål.'
  }
  if (title.includes('säljare') || title.includes('försäljning')) {
    return 'Driven säljare med passion för att bygga långsiktiga kundrelationer. Motiveras av att överträffa mål och hitta lösningar som skapar värde.'
  }
  if (title.includes('administratör') || title.includes('assistent')) {
    return 'Strukturerad och serviceinriktad med erfarenhet av administrativa uppgifter. Trivs med att skapa ordning och stödja kollegor i deras arbete.'
  }
  if (title.includes('lärare') || title.includes('pedagog')) {
    return 'Engagerad pedagog med passion för att inspirera och stödja lärande. Skapar inkluderande miljöer där alla kan utvecklas.'
  }

  // Default
  return `Motiverad ${jobTitle.toLowerCase()} som söker nya utmaningar. Bidrar med engagemang, pålitlighet och vilja att utvecklas i min roll.`
}

// Generera grundläggande skills baserat på jobbtitel
export function generateQuickSkills(jobTitle: string): CVData['skills'] {
  const title = jobTitle.toLowerCase()
  const baseSkills = [
    { id: '1', name: 'Kommunikation', level: 4, category: 'soft' as const },
    { id: '2', name: 'Samarbete', level: 4, category: 'soft' as const },
    { id: '3', name: 'Problemlösning', level: 3, category: 'soft' as const },
  ]

  if (arLagerYrke(title)) {
    return [
      ...baseSkills,
      { id: '4', name: 'Lager och logistik', level: 3, category: 'technical' as const },
      { id: '5', name: 'Noggrannhet', level: 4, category: 'soft' as const },
    ]
  }
  if (title.includes('utvecklare') || title.includes('programmerare')) {
    return [
      ...baseSkills,
      { id: '4', name: 'Programmering', level: 4, category: 'technical' as const },
      { id: '5', name: 'Felsökning', level: 4, category: 'technical' as const },
    ]
  }
  if (title.includes('projektledare')) {
    return [
      ...baseSkills,
      { id: '4', name: 'Projektledning', level: 4, category: 'technical' as const },
      { id: '5', name: 'Planering', level: 4, category: 'technical' as const },
    ]
  }
  if (title.includes('säljare')) {
    return [
      ...baseSkills,
      { id: '4', name: 'Försäljning', level: 4, category: 'technical' as const },
      { id: '5', name: 'Kundrelationer', level: 4, category: 'technical' as const },
    ]
  }

  return baseSkills
}

const kompetensNyckel = (skills: CVData['skills'] | undefined): string =>
  JSON.stringify((skills || []).map(s => [s.name, s.level, s.category]))

/**
 * EG8: består profiltexten eller kompetenslistan fortfarande av Snabb-CV-mallens
 * egen text, oredigerad? Det finns ingen flagga för autogenererad text i datan,
 * så vi jämför mot vad mallen skulle producera för samma titel. (Id:n jämförs
 * inte — de skrivs om vid sparning — och en redigerad titel ger en annan mall,
 * vilket är konservativt: då tystnar påminnelsen hellre än att den pekar fel.)
 */
export function arOredigeradSnabbmall(
  data: Pick<CVData, 'title' | 'summary' | 'skills'>,
): { profil: boolean; kompetenser: boolean } {
  const title = data.title || ''
  if (!title.trim()) return { profil: false, kompetenser: false }
  const profil = (data.summary || '').trim() === generateQuickSummary(title)
  const kompetenser =
    (data.skills?.length ?? 0) > 0 &&
    kompetensNyckel(data.skills) === kompetensNyckel(generateQuickSkills(title))
  return { profil, kompetenser }
}
