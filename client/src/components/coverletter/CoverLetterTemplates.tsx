/**
 * Industry-specific cover letter templates with Swedish norms
 */

import { 
  FileText, 
  Building2, 
  Palette, 
  Code, 
  Heart, 
  GraduationCap,
  ArrowRight,
  Clock,
  Briefcase
} from '@/components/ui/icons'

export interface CoverLetterTemplate {
  id: string
  label: string
  description: string
  industry: 'general' | 'public' | 'creative' | 'tech' | 'care' | 'graduate'
  icon: React.ReactNode
  promptAddition: string
  tone: 'formal' | 'professional' | 'friendly' | 'creative'
  exampleOpening: string
  exampleClosing: string
  maxLength: number
  tips: string[]
}

export const coverLetterTemplates: CoverLetterTemplate[] = [
  {
    id: 'standard',
    label: 'Standard',
    description: 'Bra för de flesta situationer',
    industry: 'general',
    icon: <FileText className="w-5 h-5" />,
    promptAddition: 'Använd en professionell men personlig ton. Fokusera på relevans och motivation.',
    tone: 'professional',
    exampleOpening: 'Jag skriver med stort intresse för tjänsten som [titel] på [företag].',
    exampleClosing: 'Jag ser fram emot att få berätta mer om hur jag kan bidra till ert team.',
    maxLength: 350,
    tips: [
      'Nämn specifikt varför du söker till just detta företag',
      'Koppla dina erfarenheter till jobbets krav',
      'Avsluta med en positiv och framåtblickande ton'
    ]
  },
  {
    id: 'public-sector',
    label: 'Offentlig sektor',
    description: 'För myndigheter, kommun, region',
    industry: 'public',
    icon: <Building2 className="w-5 h-5" />,
    promptAddition: 'Använd en formell och saklig ton. Fokusera på samhällsnytta, jämställdhet, och hur du bidrar till verksamhetens mål. Undvik överdriven säljande ton.',
    tone: 'formal',
    exampleOpening: 'Jag vill härmed söka tjänsten som [titel] inom [verksamhet].',
    exampleClosing: 'Med intresse för tjänsten ser jag fram emot att få presentera mina meriter vidare.',
    maxLength: 400,
    tips: [
      'Var formell men inte stel',
      'Lyft fram erfarenhet av samarbete och service',
      'Nämna jämställdhet och mångfald om relevant',
      'Fokusera på stabilitet och långsiktighet'
    ]
  },
  {
    id: 'creative',
    label: 'Kreativa yrken',
    description: 'Design, marknadsföring, media',
    industry: 'creative',
    icon: <Palette className="w-5 h-5" />,
    promptAddition: 'Använd en kreativ och personlig ton som visar personlighet. Det är okej att vara lite mer avslappnad och visa passion. Inkludera gärna en kreativ vinkling.',
    tone: 'creative',
    exampleOpening: 'När jag såg er annons kände jag direkt: detta är ett team jag vill vara en del av!',
    exampleClosing: 'Jag ser fram emot att få visa vad jag kan bidra med - både som kollega och kreatör.',
    maxLength: 300,
    tips: [
      'Visa din personlighet och passion',
      'Inkludera länk till portfolio om relevant',
      'Var kreativ men professionell',
      'Visa att du förstår företagets varumärke'
    ]
  },
  {
    id: 'tech',
    label: 'Tech & IT',
    description: 'Utveckling, IT-support, data',
    industry: 'tech',
    icon: <Code className="w-5 h-5" />,
    promptAddition: 'Använd en konkret och kompetensfokuserad ton. Fokusera på tekniska färdigheter, problemlösning, och resultat. Var kortfattad och effektiv.',
    tone: 'professional',
    exampleOpening: 'Som [titel] med erfarenhet inom [område] ser jag med intresse på möjligheten att bidra till [företag].',
    exampleClosing: 'Jag ser fram emot att diskutera hur mina tekniska kompetenser kan komma till nytta i ert team.',
    maxLength: 300,
    tips: [
      'Var konkret om tekniska kompetenser',
      'Nämn specifika verktyg/tekniker ni använder',
      'Fokusera på problemlösning och resultat',
      'Håll det kortfattat - tekniker läser snabbt'
    ]
  },
  {
    id: 'care',
    label: 'Vård & Omsorg',
    description: 'Sjukvård, äldreomsorg, LSS',
    industry: 'care',
    icon: <Heart className="w-5 h-5" />,
    promptAddition: 'Använd en varm och empatisk ton. Fokusera på människosyn, värderingar, och viljan att göra skillnad. Lyft fram empati och samarbetsförmåga.',
    tone: 'friendly',
    exampleOpening: 'Som [titel] drivs jag av önskan att göra skillnad för människor. När jag läste om tjänsten på [företag] kände jag att våra värderingar överensstämmer.',
    exampleClosing: 'Jag ser fram emot att få bidra med mitt engagemang och min omsorg om människor i ert team.',
    maxLength: 350,
    tips: [
      'Visa empati och människosyn',
      'Nämn erfarenhet av utsatta grupper om relevant',
      'Fokusera på samarbete och team',
      'Lyft fram stresshantering och stabilitet'
    ]
  },
  {
    id: 'graduate',
    label: 'Nyexaminerad',
    description: 'Första jobbet, praktik',
    industry: 'graduate',
    icon: <GraduationCap className="w-5 h-5" />,
    promptAddition: 'Använd en entusiastisk och ödmjuk ton. Fokusera på potential, utbildning, praktik, och vilja att lära. Var ärlig om brist på erfarenhet men positiv om möjligheter.',
    tone: 'friendly',
    exampleOpening: 'Som nyexaminerad [utbildning] med stort intresse för [område] söker jag möjligheten att börja min karriär på [företag].',
    exampleClosing: 'Jag är entusiastisk över möjligheten att få lära och utvecklas tillsammans med er.',
    maxLength: 300,
    tips: [
      'Lyft fram utbildning och praktik',
      'Visa vilja att lära och utvecklas',
      'Var ärlig om att du är ny i branschen',
      'Fokusera på personliga egenskaper och potential'
    ]
  },
  {
    id: 'return-to-work',
    label: 'Tillbaka efter paus',
    description: 'Efter föräldraledighet, sjukskrivning',
    industry: 'general',
    icon: <Clock className="w-5 h-5" />,
    promptAddition: 'Använd en positiv och framåtblickande ton. Fokusera på motivation och färdigheter, inte pausen. Var ärlig men professionell om situationen.',
    tone: 'professional',
    exampleOpening: 'Efter en period borta från arbetsmarknaden är jag nu redo och motiverad att återvända till [bransch/yrke].',
    exampleClosing: 'Jag ser fram emot att få bidra med min erfarenhet och mitt engagemang i ert team.',
    maxLength: 350,
    tips: [
      'Var positiv - fokusera på framtiden',
      'Nämn kortfattat att du är redo att arbeta',
      'Lyft fram färdigheter som är aktuella',
      'Undvik att ursäkta eller överförklara'
    ]
  },
  {
    id: 'career-change',
    label: 'Karriärbyte',
    description: 'Byta bransch eller yrke',
    industry: 'general',
    icon: <ArrowRight className="w-5 h-5" />,
    promptAddition: 'Använd en övertygande ton. Fokusera på överförbara färdigheter, motivation för förändring, och vad du tar med dig. Förklara VARFÖR du byter.',
    tone: 'professional',
    exampleOpening: 'Jag står inför en spännande förändring i min karriär och ser möjligheten att ta med mig min erfarenhet från [tidigare bransch] in i [ny bransch].',
    exampleClosing: 'Jag ser fram emot att få utvecklas i denna nya roll och bidra med mina unika perspektiv.',
    maxLength: 350,
    tips: [
      'Förklara tydligt varför du byter karriär',
      'Koppla överförbara färdigheter till nya rollen',
      'Visa att du har gjort research',
      'Var positiv om både tidigare och ny bransch'
    ]
  },
  {
    id: 'short',
    label: 'Kort & Konkret',
    description: 'När du har ont om tid eller energi',
    industry: 'general',
    icon: <Briefcase className="w-5 h-5" />,
    promptAddition: 'Håll brevet maximalt 2-3 korta stycken. Fokusera bara på det absolut viktigaste. Var koncis och direkt.',
    tone: 'professional',
    exampleOpening: 'Jag söker tjänsten som [titel] på [företag].',
    exampleClosing: 'Jag ser fram emot att höra från er.',
    maxLength: 200,
    tips: [
      'Max 2-3 korta stycken',
      'Fokusera bara på det viktigaste',
      'Inga långa förklaringar',
      'Effektivt är bättre än perfekt'
    ]
  }
]

// Helper function to get template by ID
export function getTemplateById(id: string): CoverLetterTemplate | undefined {
  return coverLetterTemplates.find(t => t.id === id)
}

// Get templates grouped by industry
export function getTemplatesByIndustry() {
  const groups: Record<string, CoverLetterTemplate[]> = {
    'Allmänt': [],
    'Offentlig sektor': [],
    'Kreativa yrken': [],
    'Tech & IT': [],
    'Vård & Omsorg': [],
    'Ny på arbetsmarknaden': [],
  }
  
  coverLetterTemplates.forEach(template => {
    switch (template.industry) {
      case 'general':
        groups['Allmänt'].push(template)
        break
      case 'public':
        groups['Offentlig sektor'].push(template)
        break
      case 'creative':
        groups['Kreativa yrken'].push(template)
        break
      case 'tech':
        groups['Tech & IT'].push(template)
        break
      case 'care':
        groups['Vård & Omsorg'].push(template)
        break
      case 'graduate':
        groups['Ny på arbetsmarknaden'].push(template)
        break
    }
  })
  
  return groups
}

// Swedish norms checker
export function checkSwedishNorms(text: string): { issue: string; suggestion: string; severity: 'warning' | 'info' }[] {
  const issues: { issue: string; suggestion: string; severity: 'warning' | 'info' }[] = []
  
  // Check for overly salesy language
  const salesyPhrases = [
    { phrase: 'jag är den bästa', suggestion: 'Prova: "Jag tror jag kan bidra med..."' },
    { phrase: 'unik kompetens', suggestion: 'Prova: "Erfarenhet inom..."' },
    { phrase: 'perfekt för denna roll', suggestion: 'Prova: "Intresserad av denna roll"' },
    { phrase: 'aldrig sett någon lika bra', suggestion: 'Ta bort - för säljande för Sverige' },
  ]
  
  const lowerText = text.toLowerCase()
  salesyPhrases.forEach(({ phrase, suggestion }) => {
    if (lowerText.includes(phrase)) {
      issues.push({
        issue: `"${phrase}" kan upplevas som för säljande i Sverige`,
        suggestion,
        severity: 'warning'
      })
    }
  })
  
  // Check for missing Swedish formalities
  if (!text.includes('Med vänliga hälsningar') && !text.includes('Vänliga hälsningar')) {
    issues.push({
      issue: 'Saknar formellt avslut',
      suggestion: 'Använd "Med vänliga hälsningar" följt av ditt namn',
      severity: 'info'
    })
  }
  
  // Check for too informal language
  const informalWords = ['hej', 'tjenare', 'hallå', 'mvh']
  informalWords.forEach(word => {
    if (lowerText.includes(word)) {
      issues.push({
        issue: `"${word}" är för informellt för ett personligt brev`,
        suggestion: 'Använd "Hej" endast i inledningen, och skriv ut "Med vänliga hälsningar"',
        severity: 'warning'
      })
    }
  })
  
  return issues
}
