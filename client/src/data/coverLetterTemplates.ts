/**
 * Cover Letter Templates
 * 6 templates for different situations
 */

export interface CoverLetterTemplate {
  id: string
  name: string
  description: string
  category: 'standard' | 'formal' | 'creative' | 'short' | 'career-change' | 'graduate'
  icon: string
  structure: {
    introduction: string
    motivation: string
    experience: string
    closing: string
  }
  example: string
  tips: string[]
}

export const coverLetterTemplates: CoverLetterTemplate[] = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Professionell och balanserad - fungerar för de flesta jobb',
    category: 'standard',
    icon: 'FileText',
    structure: {
      introduction: 'Vilket jobb du söker + var du såg annonsen + kort varför du är intresserad',
      motivation: 'Vad som lockar dig hos arbetsgivaren + varför du passar för rollen',
      experience: '2-3 relevanta erfarenheter med konkreta resultat',
      closing: 'Sammanfatta ditt värde + call-to-action för intervju'
    },
    example: `Hej [Namn],

Jag söker rollen som [Jobbtitel] hos [Företag], som jag hittade på [Plats]. Med min bakgrund inom [område] och ett stort intresse för [företagets bransch] tror jag att jag skulle passa väl in i ert team.

Det som lockar mig särskilt hos [Företag] är [specifikt]. Jag ser fram emot att få bidra med min erfarenhet inom [kompetens] och hjälpa till att [företagets mål].

Under min tid på [Tidigare arbetsplats] arbetade jag med [relevant erfarenhet], vilket gav mig värdefulla kunskaper inom [kompetens]. Jag är van vid att [arbetsuppgift] och trivs i en miljö där [egenskap].

Jag ser fram emot att få berätta mer om hur jag kan bidra till ert team. Jag nås på [telefon] eller [mejl] och finns tillgänglig för intervju med kort varsel.

Med vänliga hälsningar,
[Ditt namn]`,
    tips: [
      'Nämn alltid tydligt vilket jobb du söker',
      'Koppla dina erfarenheter till jobbannonsens krav',
      'Visa att du gjort research om företaget',
      'Håll det under 1 A4-sida'
    ]
  },
  {
    id: 'short',
    name: 'Kort & Koncis',
    description: 'Max 150 ord - för enkla jobb och bemanningsföretag',
    category: 'short',
    icon: 'Minimize2',
    structure: {
      introduction: 'Jobbtitel + referensnummer (1 mening)',
      motivation: 'Kärnan: Vad kan du bidra med? (2-3 meningar)',
      experience: 'En konkret styrka som matchar jobbet',
      closing: 'Tillgänglig för intervju + kontaktuppgifter (1-2 meningar)'
    },
    example: `Hej,

Jag söker tjänsten som [Jobbtitel] (ref. [nummer]) hos [Företag].

Med min erfarenhet inom [område] och [konkret färdighet] kan jag bidra till ert team omgående. Jag är van vid [arbetsuppgift] och trivs med [egenskap hos jobbet].

Jag finns tillgänglig för intervju på era villkor och kan börja inom [tid].

[Telefon] | [Mejl]

Med vänliga hälsningar,
[Ditt namn]`,
    tips: [
      'Max 150 ord - varje mening ska bära',
      'Fokusera på det viktigaste',
      'Använd punktlistor om det passar',
      'Perfekt när energin är låg'
    ]
  },
  {
    id: 'formal',
    name: 'Formell',
    description: 'Traditionell ton för offentlig sektor, bank, försäkring, juridik',
    category: 'formal',
    icon: 'Building2',
    structure: {
      introduction: 'Formell inledning med referensnummer',
      motivation: 'Professionell profil med yrkesroll och specialisering',
      experience: 'Utbildning, certifieringar, relevanta anställningar',
      closing: 'Formellt avslut med erbjudande om kompletterande information'
    },
    example: `Hej,

Jag söker tjänsten som [Jobbtitel] vid [Företag/Myndighet], annonsnr [nummer].

Som [nuvarande yrkesroll] med [X års erfarenhet] inom [bransch] har jag utvecklat bred kompetens inom [områden]. Min bakgrund innefattar [relevanta tidigare roller].

Jag har [utbildning] samt [certifieringar]. Under min anställning på [Tidigare arbetsplats] ansvarade jag för [arbetsuppgifter], vilket gav mig erfarenhet av [kompetenser]. Jag är särskilt erfaren inom [specialisering].

[Arbetsgivarens namn] tilltalar mig särskilt på grund av [specifikt]. Jag delar era värderingar kring [värde] och ser fram emot att bidra till [företagets uppdrag].

Jag återkommer gärna med kompletterande information. Jag nås på [telefon] eller [mejl].

Med vänliga hälsningar,
[Ditt namn]`,
    tips: [
      'Använd formell ton genom hela brevet',
      'Nämn annonsnummer korrekt',
      'Fokusera på utbildning och formell erfarenhet',
      'Undvik för informella uttryck'
    ]
  },
  {
    id: 'creative',
    name: 'Kreativ',
    description: 'Personlig ton för marknadsföring, design, media, startup',
    category: 'creative',
    icon: 'Palette',
    structure: {
      introduction: 'Fångande inledning som visar personlighet',
      motivation: 'Din story - vad som driver dig i ditt yrke',
      experience: 'Ett konkret projekt eller resultat + ditt arbetssätt',
      closing: 'Kreativt avslut som sticker ut (inom rimliga gränser)'
    },
    example: `Hej [Namn],

När jag såg att [Företag] söker en [Jobbtitel] blev jag genuint glad - detta är exakt den typ av utmaning jag letar efter i mitt nästa karriärsteg.

Jag är [yrkesroll] med passion för [område]. Det som driver mig är [motivation]. Ett projekt jag är särskilt stolt över är [projekt], där jag [vad du gjorde] och resultatet blev [resultat].

Det som lockar mig med [Företag] är [specifikt]. Jag ser en stark match mellan er kultur av [kultur] och mitt sätt att arbeta - jag trivs när [arbetssätt]. Tillsammans tror jag vi kan [vision].

Jag skulle älska att få träffas och berätta mer om hur jag kan bidra till ert team. Jag finns tillgänglig på [telefon/mejl] och kan komma på intervju [när].

Ser fram emot att höra från er!

[Ditt namn]

PS. [Valfritt - något personligt som visar att du gjort research]`,
    tips: [
      'Visa personlighet men håll det professionellt',
      'Använd storytelling',
      'Fokusera på kulturell matchning',
      'Inkludera ett konkret projektexempel'
    ]
  },
  {
    id: 'career-change',
    name: 'Karriärbyte',
    description: 'För omställare som byter bransch eller efter lång frånvaro',
    category: 'career-change',
    icon: 'Route',
    structure: {
      introduction: 'Tydlig inledning om att du söker ny riktning',
      motivation: 'Överförbara kompetenser - lista 3-5 skills',
      experience: 'Vad du gjort för att förbereda dig (kurser, praktik)',
      closing: 'Ödmjukt men självsäkert avslut om din potential'
    },
    example: `Hej [Namn],

Efter [antal] framgångsrika år inom [nuvarande bransch] är jag nu redo för en ny utmaning. Jag söker rollen som [Jobbtitel] hos [Företag] eftersom [specifik anledning kopplad till företaget].

Min bakgrund har gett mig flera kompetenser som är direkt överförbara till denna roll:\n• [Kompetens 1] - från [erfarenhet]\n• [Kompetens 2] - utvecklad genom [erfarenhet]\n• [Kompetens 3] - bevisat genom [resultat]

För att förbereda mig för denna övergång har jag [vad du gjort - kurser, praktik, frivilligarbete, egna projekt]. Detta har bekräftat mitt intresse för [ny bransch] och gett mig grundläggande kunskap inom [områden].

Jag är övertygad om att min erfarenhet från [tidigare bransch] ger mig unika perspektiv som kan komplettera ert team. Jag är hungrig att lära, redo att bidra, och ser fram emot att få visa mitt värde.

Jag nås på [telefon/mejl] och skulle gärna komma på ett samtal för att berätta mer.

Med vänliga hälsningar,
[Ditt namn]`,
    tips: [
      'Adressera bytet direkt - var inte defensiv',
      'Fokusera på överförbara skills, inte vad du saknar',
      'Visa att du gjort research och förberedelser',
      'Var positiv om framtiden, inte ursäktande om det förflutna'
    ]
  },
  {
    id: 'graduate',
    name: 'Nyexaminerad',
    description: 'För första jobbet efter utbildning eller praktikplatser',
    category: 'graduate',
    icon: 'GraduationCap',
    structure: {
      introduction: 'Entusiastisk inledning - examen + när',
      motivation: 'Vad du lärt dig som är relevant + examensarbete/praktik',
      experience: 'Sommarjobb, extraknäck, ideellt arbete - fokus på mjuka kompetenser',
      closing: 'Humble avslutning om att få bidra och lära'
    },
    example: `Hej [Namn],

I [månad] tar jag examen som [utbildning] vid [lärosäte], och söker nu min första tjänst inom [bransch]. Ert företag står högst upp på min önskelista eftersom [specifik anledning].

Under min utbildning har jag fått kunskap inom [relevanta områden]. Mitt examensarbete handlade om [ämne], vilket gav mig insikter om [kompetens]. Jag har även [praktik/andra erfarenheter] där jag lärde mig [konkret färdighet].

Parallellt med studierna har jag [sommarjobb/extraknäck/ideellt arbete]. Detta har lärt mig [mjuka kompetenser som arbetsmoral, samarbete, ansvarstagande].

Jag är hungrig att lära mig mer och ser fram emot att få bidra med mitt engagemang och mina färska kunskaper. Jag finns tillgänglig från [datum] och skulle älska att få komma på ett samtal.

Med vänliga hälsningar,
[Ditt namn]`,
    tips: [
      'Var entusiastisk men inte överdriven',
      ' Lyft examensarbete och praktik som relevant erfarenhet',
      'Fokusera på vad du lärt dig, inte bara teori',
      'Var öppen med att du är ny i rollen - men visa på potential'
    ]
  }
]

export const getTemplateById = (id: string): CoverLetterTemplate | undefined => {
  return coverLetterTemplates.find(template => template.id === id)
}

export const getTemplatesByCategory = (category: CoverLetterTemplate['category']): CoverLetterTemplate[] => {
  return coverLetterTemplates.filter(template => template.category === category)
}
