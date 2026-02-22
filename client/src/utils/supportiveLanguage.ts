/**
 * Supportive Language Guide - Icke-skuldbeläggande språk
 * 
 * Denna fil innehåller riktlinjer och verktyg för att använda stödjande,
 * icke-skuldbeläggande språk i hela applikationen.
 * 
 * Syfte:
 * - Minska skam och stress hos användare
 * - Förstärka känslan av kapacitet och möjlighet
 * - Undvika pekpinnar och "måsten"
 * - Skapa en trygg och uppmuntrande miljö
 */

// =============================================================================
// ORDLISTA: Skuldbeläggande → Stödjande
// =============================================================================

export const blameToSupportive: Record<string, string> = {
  // Tvång och krav
  'Du måste': 'Du kan',
  'Du behöver': 'Det kan hjälpa att',
  'Du är tvungen att': 'Du har möjlighet att',
  'Det är nödvändigt att': 'Ett förslag är att',
  'Obligatoriskt': 'Rekommenderat',
  'Krävs': 'Rekommenderas',
  
  // Förenklingar som kan känas nedlåtande
  'Det är enkelt att': 'Här är ett sätt att',
  'Det är bara att': 'Du kan prova att',
  'Så enkelt som': 'Ett steg är att',
  'Bara': '', // Ta bort helt
  'Simply': '',
  
  // Råd och pekpinnar
  'Du borde': 'Ett tips är att',
  'Du ska': 'Du kan prova att',
  'Varför har du inte': 'Nästa steg kan vara att',
  'Det är dags att': 'När du känner dig redo kan du',
  'Kom ihåg att': 'Om du vill kan du',
  
  // Negativa bedömningar
  'Felaktig': 'Kan justeras',
  'Fel': 'Kan ändras',
  'Inkomplett': 'Påbörjad',
  'Ofullständig': 'Påbörjad',
  'Dålig': 'Kan utvecklas',
  'Svag': 'Kan stärkas',
  'Dåligt resultat': 'Resultat att bygga vidare på',
  
  // Saknade saker
  'Du har inte': 'Nästa steg är att',
  'Saknas': 'Kan läggas till',
  'Du är inte klar': 'Du är på väg',
  'Inte färdig': 'Pågående',
  
  // Negativa tillstånd
  'Misslyckades': 'Det gick inte denna gång',
  'Fail': 'Lärandeögonblick',
  'Avbröt': 'Pausade',
  'Ignorerade': 'Valde att inte',
  
  // Tidsrelaterat skapande stress
  'Snart': 'När du är redo',
  'Omedelbart': 'När det passar dig',
  'Genast': 'I din egen takt',
  'Senast': 'Gärna före',
}

// =============================================================================
// FÄRDIGA MEDDELANDEN
// =============================================================================

export const messages = {
  // Hälsningar
  greeting: {
    morning: (name: string) => `God morgon, ${name}! ☀️`,
    afternoon: (name: string) => `Hej, ${name}! 👋`,
    evening: (name: string) => `God kväll, ${name}! 🌙`,
  },
  
  // Uppmuntran baserat på framsteg
  encouragement: {
    goodProgress: 'Du är på god väg!',
    buildingTogether: 'Låt oss bygga ditt CV tillsammans, i din takt.',
    smallSteps: 'Varje litet steg räknas.',
    takeYourTime: 'Ta den tid du behöver.',
    proudOfYou: 'Du gör ett fantastiskt jobb!',
    progressNotPerfection: 'Framsteg är viktigare än perfektion.',
  },
  
  // CV-kvalitet
  cvQuality: {
    excellent: 'Mycket bra! 🌟',
    good: 'Bra jobbat! 👍',
    developing: 'Under utveckling 📈',
    started: 'Påbörjad ✍️',
    canBeEnhanced: 'Kan utvecklas vidare',
  },
  
  // Nästa steg
  nextSteps: {
    addExperience: 'Nästa steg kan vara att lägga till en arbetslivserfarenhet',
    addEducation: 'Du kan prova att lägga till din utbildning',
    addSkills: 'Ett tips är att lägga till några kompetenser',
    writeSummary: 'När du vill kan du skriva en kort sammanfattning',
    completeProfile: 'Nästa steg kan vara att komplettera din profil',
  },
  
  // Felmeddelanden (omformulerade)
  errors: {
    generic: 'Något gick inte som förväntat. Vi försöker igen.',
    loadFailed: 'Det gick inte att ladda informationen just nu.',
    saveFailed: 'Sparningen gick inte igenom. Vill du prova igen?',
    networkError: 'Anslutningsproblem. Dina ändringar är sparade lokalt.',
    notFound: 'Informationen kunde inte hittas just nu.',
  },
  
  // Tomma tillstånd
  emptyStates: {
    noCV: 'Ditt CV väntar på att skapas. När du känner dig redo kan du börja.',
    noApplications: 'Inga ansökningar ännu. Nästa steg kan vara att utforska lediga jobb.',
    noLetters: 'Inga sparade brev än. Du kan skapa ett när du hittar ett intressant jobb.',
    noResults: 'Här visas dina resultat när du har kommit igång.',
  },
  
  // Prestationsmeddelanden
  achievements: {
    cvComplete: {
      title: 'CV-mästare!',
      description: 'Du har skapat ett komplett CV. Du är redo att söka jobb!',
    },
    firstApplication: {
      title: 'Första steget!',
      description: 'Du har skickat din första ansökan. Det tar mod att söka jobb!',
    },
    interestComplete: {
      title: 'Självkännare!',
      description: 'Du har upptäckt dina intressen. Det är första steget till rätt karriär!',
    },
    profileStarted: {
      title: 'Bra start!',
      description: 'Du har påbörjat din profil. Varje steg tar dig närmare målet.',
    },
  },
  
  // Knappar och call-to-actions
  cta: {
    startHere: 'Börja här',
    continue: 'Fortsätt där du slutade',
    takeABreak: 'Ta en paus',
    doItLater: 'Gör det senare',
    explore: 'Utforska',
    tryIt: 'Prova',
    maybeLater: 'Kanske senare',
    saveProgress: 'Spara mitt arbete',
    comeBackTo: 'Kom tillbaka till detta',
  },
  
  // Energinivåer
  energy: {
    high: 'Du verkar ha energi idag - passa på att göra det som känns viktigast!',
    medium: 'Ta det i din takt idag. Små steg är också framsteg.',
    low: 'Det är okej att ha en lugn dag. Vad är det minsta du vill göra?',
    veryLow: 'Lyssna på din kropp idag. Vila är också produktivt.',
  },
}

// =============================================================================
// TRANSFORMERINGSFUNKTIONER
// =============================================================================

/**
 * Transformera en text genom att ersätta skuldbeläggande fraser
 */
export function transformToSupportive(text: string): string {
  let transformed = text
  
  for (const [blame, supportive] of Object.entries(blameToSupportive)) {
    const regex = new RegExp(blame, 'gi')
    transformed = transformed.replace(regex, supportive)
  }
  
  return transformed
}

/**
 * Kontrollera om en text innehåller skuldbeläggande språk
 */
export function containsBlameLanguage(text: string): boolean {
  const blameWords = Object.keys(blameToSupportive)
  return blameWords.some(word => 
    text.toLowerCase().includes(word.toLowerCase())
  )
}

/**
 * Föreslå förbättringar för en text
 */
export function suggestImprovements(text: string): string[] {
  const suggestions: string[] = []
  const lowerText = text.toLowerCase()
  
  for (const [blame, supportive] of Object.entries(blameToSupportive)) {
    if (lowerText.includes(blame.toLowerCase()) && supportive) {
      suggestions.push(`"${blame}" kan bytas ut mot "${supportive}"`)
    }
  }
  
  return suggestions
}

// =============================================================================
// KONSTANTER FÖR VANLIGA MEDDELANDEN
// =============================================================================

export const PROGRESS_LABELS = {
  cvStatus: 'CV-status',
  interestGuide: 'Intresseguide',
  cvQuality: 'CV-kvalitet',
  applications: 'Ansökningar',
  savedJobs: 'Sparade jobb',
  lettersWritten: 'Brev skrivna',
  stepsCompleted: 'Steg klara',
  profileCompletion: 'Profilstatus',
} as const

export const FEEDBACK_MESSAGES = {
  // Positiv feedback
  positive: [
    'Bra jobbat! 🌟',
    'Du är på rätt väg! 👍',
    'Fantastiskt! ✨',
    'Så bra! 🎉',
    'Det där gjorde du jättebra! 💪',
  ],
  
  // Konstruktiv feedback (icke-skuldbeläggande)
  constructive: [
    'Här är ett förslag på förbättring...',
    'Den här delen kan utvecklas vidare...',
    'Ett tips är att...',
    'Du kan prova att...',
    'Om du vill kan du...',
  ],
  
  // Motiverande
  motivational: [
    'Varje steg räknas!',
    'Du gör framsteg varje dag.',
    'Du är starkare än du tror.',
    'Det är okej att ta det i din takt.',
    'Du är på väg åt rätt håll.',
  ],
}

// =============================================================================
// TYPER
// =============================================================================

export type SupportiveMessageKey = keyof typeof messages
export type ProgressLabelKey = keyof typeof PROGRESS_LABELS
export type FeedbackType = 'positive' | 'constructive' | 'motivational'

// =============================================================================
// EXPORT AV ALLA FUNKTIONER
// =============================================================================

export default {
  blameToSupportive,
  messages,
  PROGRESS_LABELS,
  FEEDBACK_MESSAGES,
  transformToSupportive,
  containsBlameLanguage,
  suggestImprovements,
}
