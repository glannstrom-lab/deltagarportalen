/**
 * Supportive Messages Utility
 * Empatiska och stödjande felmeddelanden som minskar skam och stress
 * Används i hela applikationen för att skapa en mer mänsklig upplevelse
 */

export type ErrorContext = 
  | 'network'
  | 'save'
  | 'load'
  | 'validation'
  | 'auth'
  | 'timeout'
  | 'unknown'
  | 'cv_export'
  | 'job_search'
  | 'file_upload'

interface SupportiveMessage {
  title: string
  message: string
  action?: string
  icon?: string
}

// Empatiska felmeddelanden som förklarar och stöttar istället för att skuldbelägga
const supportiveErrorMessages: Record<ErrorContext, SupportiveMessage[]> = {
  network: [
    {
      title: 'Vi har lite tekniska problem just nu',
      message: 'Ditt arbete är säkert sparat lokalt. Vi försöker igen automatiskt när du är tillbaka online.',
      action: 'Försök igen',
      icon: '🌐'
    },
    {
      title: 'Ingen fara – vi har sparat det viktigaste',
      message: 'Det verkar som anslutningen är instabil. Allt du gjort finns kvar på din enhet.',
      action: 'Försök igen',
      icon: '💾'
    },
    {
      title: 'Vi är snart tillbaka',
      message: 'Det är ett tillfälligt nätverksproblem. Ta en liten paus så löser det sig snart.',
      action: 'Försök igen',
      icon: '⏳'
    }
  ],
  
  save: [
    {
      title: 'Ingen fara! Vi har sparat det viktigaste',
      message: 'Det gick inte att spara just nu, men ditt arbete finns kvar. Vi försöker igen om en stund.',
      action: 'Spara igen',
      icon: '💙'
    },
    {
      title: 'Dina ändringar är säkra',
      message: 'Vi kunde inte synka med servern just nu, men allt är sparat lokalt. Prova igen senare.',
      action: 'Försök igen',
      icon: '🔒'
    },
    {
      title: 'Det är inte ditt fel',
      message: 'Det uppstod ett tekniskt problem vid sparning. Ditt arbete är kvar och du kan fortsätta.',
      action: 'Försök spara igen',
      icon: '🤗'
    }
  ],
  
  load: [
    {
      title: 'Det tar lite längre tid än vanligt',
      message: 'Vi jobbar på att ladda din information. Tack för ditt tålamod.',
      action: 'Ladda om',
      icon: '⏳'
    },
    {
      title: 'Vi hämtar dina uppgifter',
      message: 'Det verkar ta lite tid just nu. Vill du vänta eller försöka igen?',
      action: 'Försök igen',
      icon: '📦'
    },
    {
      title: 'Strulet med tekniken idag',
      message: 'Vi har svårt att hämta informationen just nu. Det löser sig snart!',
      action: 'Försök igen',
      icon: '🛠️'
    }
  ],
  
  validation: [
    {
      title: 'Ta den tid du behöver',
      message: 'Du kan alltid komma tillbaka och fylla i mer information senare. Det behöver inte vara perfekt.',
      action: 'Fortsätt',
      icon: '💙'
    },
    {
      title: 'När du är redo',
      message: 'Detta fält är viktigt, men det är okej att vänta tills du känner dig redo att fylla i det.',
      action: 'Jag förstår',
      icon: '🌱'
    },
    {
      title: 'Varje steg räknas',
      message: 'Det behöver inte vara komplett på en gång. Spara det du har så långt och fortsätt senare.',
      action: 'Spara vad jag har',
      icon: '✨'
    }
  ],
  
  auth: [
    {
      title: 'Din session har gått ut',
      message: 'Av säkerhetsskäl behöver du logga in igen. Ditt arbete är sparat!',
      action: 'Logga in',
      icon: '🔐'
    },
    {
      title: 'Välkommen tillbaka!',
      message: 'Det verkar som du varit borta en stund. Logga in igen för att fortsätta där du slutade.',
      action: 'Logga in',
      icon: '👋'
    },
    {
      title: 'Inloggningen behövs igen',
      message: 'Inga problem – detta händer ibland för att skydda dina uppgifter.',
      action: 'Logga in',
      icon: '🛡️'
    }
  ],
  
  timeout: [
    {
      title: 'Det tog längre tid än väntat',
      message: 'Ibland behöver saker lite extra tid. Vi har sparat det vi kunde – vill du försöka igen?',
      action: 'Försök igen',
      icon: '⏱️'
    },
    {
      title: 'Tiden gick ut',
      message: 'Detta kan hända när många använder tjänsten samtidigt. Ditt arbete är säkert – prova igen!',
      action: 'Försök igen',
      icon: '🕐'
    }
  ],
  
  cv_export: [
    {
      title: 'PDF:en ville inte skapas just nu',
      message: 'Det är ett tillfälligt tekniskt problem. Ditt CV är sparat och du kan försöka exportera igen om en stund.',
      action: 'Försök igen',
      icon: '📄'
    },
    {
      title: 'Exporten strulade',
      message: 'Vi kunde inte skapa PDF:en just nu. Prova att uppdatera sidan och försök igen. Ditt CV är säkert!',
      action: 'Försök igen',
      icon: '📋'
    }
  ],
  
  job_search: [
    {
      title: 'Vi har svårt att hämta jobben just nu',
      message: 'Det är problem med anslutningen till Arbetsförmedlingen. Försök igen om en liten stund.',
      action: 'Försök igen',
      icon: '🔍'
    },
    {
      title: 'Jobbsökningen är tillfälligt avbruten',
      message: 'Vi kan inte nå jobbdatabasen just nu. Detta brukar lösa sig snabbt!',
      action: 'Försök igen',
      icon: '💼'
    }
  ],
  
  file_upload: [
    {
      title: 'Filen kunde inte laddas upp',
      message: 'Det kan bero på filstorleken eller formatet. Kontrollera att filen är mindre än 10MB och försök igen.',
      action: 'Välj annan fil',
      icon: '📎'
    },
    {
      title: 'Uppladdningen avbröts',
      message: 'Det uppstod ett problem vid uppladdning. Kontrollera din internetanslutning och försök igen.',
      action: 'Försök igen',
      icon: '☁️'
    }
  ],
  
  unknown: [
    {
      title: 'Något oväntat hände',
      message: 'Det är inte ditt fel – det är ett tekniskt problem på vår sida. Vi jobbar på att fixa det!',
      action: 'Ladda om sidan',
      icon: '🛠️'
    },
    {
      title: 'Oj, här gick något snett',
      message: 'Vi ber om ursäkt för besväret. Prova att ladda om sidan eller kom tillbaka om en stund.',
      action: 'Ladda om',
      icon: '🔧'
    },
    {
      title: 'Vi har stött på ett problem',
      message: 'Detta är inte meningen att hända. Ditt arbete är förhoppningsvis sparat – prova att ladda om sidan.',
      action: 'Ladda om',
      icon: '🤔'
    }
  ]
}

// Hjälpfunktion för att hämta ett slumpmässigt meddelande
export function getSupportiveMessage(context: ErrorContext): SupportiveMessage {
  const messages = supportiveErrorMessages[context]
  const randomIndex = Math.floor(Math.random() * messages.length)
  return messages[randomIndex]
}

// Hjälpfunktion för att hämta första meddelandet (för konsekventa tester)
export function getFirstSupportiveMessage(context: ErrorContext): SupportiveMessage {
  return supportiveErrorMessages[context][0]
}

// Konvertera tekniska fel till användarvänliga meddelanden
export function getMessageForError(error: Error | string | null, context?: ErrorContext): SupportiveMessage {
  if (!error) {
    return supportiveErrorMessages.unknown[0]
  }
  
  const errorString = typeof error === 'string' ? error : error.message
  const lowerError = errorString.toLowerCase()
  
  // Försök identifiera kontext från felmeddelandet om inte angivet
  if (!context) {
    if (lowerError.includes('network') || lowerError.includes('internet') || lowerError.includes('offline')) {
      context = 'network'
    } else if (lowerError.includes('save') || lowerError.includes('spara')) {
      context = 'save'
    } else if (lowerError.includes('load') || lowerError.includes('ladda')) {
      context = 'load'
    } else if (lowerError.includes('timeout') || lowerError.includes('tid')) {
      context = 'timeout'
    } else if (lowerError.includes('auth') || lowerError.includes('logga') || lowerError.includes('session')) {
      context = 'auth'
    } else if (lowerError.includes('pdf') || lowerError.includes('export')) {
      context = 'cv_export'
    } else if (lowerError.includes('upload') || lowerError.includes('uppladd')) {
      context = 'file_upload'
    } else if (lowerError.includes('jobb') || lowerError.includes('search')) {
      context = 'job_search'
    } else {
      context = 'unknown'
    }
  }
  
  return getSupportiveMessage(context)
}

// Meddelanden för kunskapsbanken
export const knowledgeBaseMessages = {
  // När användaren sparar för senare
  saveForLater: [
    'Helt okej! Vi har sparat artikeln till när du har mer energi. Din hälsa kommer alltid först. 💙',
    'Ingen stress – artikeln väntar på dig när du är redo. Ta hand om dig! 🤗',
    'Så bra att du lyssnar på kroppen! Vi har sparat den åt dig. 💙',
  ],
  
  // När användaren inte orkar läsa
  cantReadNow: [
    'Det är normalt att inte orka ibland. Det är ingen prestation att läsa allt på en gång.',
    'Din hjärna behöver också vila. Kom tillbaka när du känner dig redo. ☕',
    'Det är helt okej. Du är inte mindre värd för att du behöver pausa. 💙',
  ],
  
  // När artikeln är för lång
  articleTooLong: [
    'Denna artikel är ganska lång. Vill du läsa en kortare version först?',
    'Detta är ett djupgående ämne. Vill du se en sammanfattning först?',
    'Detta tar ungefär {time} minuter att läsa. Vill du fortsätta eller se ett kortare alternativ?',
  ],
  
  // Låg energi-varning
  lowEnergySuggestion: [
    'Du verkar ha låg energi idag. Vill jag visa kortare artiklar istället?',
    'Det märks att du behöver ta det lugnt. Ska vi filtrera efter snabba läsningar?',
    'Hur mår du? Jag kan visa innehåll som matchar din energinivå. 💙',
  ],
  
  // Fortsätt läsa
  continueReading: [
    'Vill du fortsätta där du slutade?',
    'Du har påbörjat denna artikel. Ska vi fortsätta?',
    'Välkommen tillbaka! Vill du fortsätta läsa?',
  ],
  
  // Checklistor
  checklistCompleted: [
    'Bra jobbat med checklistan! Ett steg närmare målet! ✨',
    'Du har gått igenom alla punkter – så duktig! 🎉',
    'Checklistan klar! Du är på rätt väg. 💪',
  ],
}

// Hjälpfunktion för kunskapsbank-meddelanden
export function getKnowledgeBaseMessage(type: keyof typeof knowledgeBaseMessages, params?: Record<string, string>): string {
  const messages = knowledgeBaseMessages[type]
  let message = messages[Math.floor(Math.random() * messages.length)]
  
  // Ersätt parametrar om de finns
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      message = message.replace(`{${key}}`, value)
    })
  }
  
  return message
}

// Uppmuntrande meddelanden för olika situationer
export const encouragingMessages = {
  // När användaren loggar in
  welcomeBack: [
    'Välkommen tillbaka! 💙',
    'Så roligt att se dig igen! 🌟',
    'Hej där! Redo för ett nytt steg? 🚀',
    'Välkommen! Du är på rätt väg. 💪'
  ],
  
  // När användaren slutför något
  completed: [
    'Bra jobbat! Ett steg närmare målet! ✨',
    'Du gör framsteg – fortsätt så! 🌱',
    'Så duktig du är! 💙',
    'Det där gjorde du jättebra! 🎉',
    'Varje steg räknas – och detta var ett stort! 💪'
  ],
  
  // När användaren behöver pausa
  takeBreak: [
    'Det är okej att ta en paus. Att vila är också produktivt. ☕',
    'Lyssna på kroppen. Det är helt okej att göra klart en annan dag. 💙',
    'Du har gjort tillräckligt för idag. Stolt över dig! 🌟',
    'Pausa när du behöver. Vi finns här när du är redo igen. 🤗'
  ],
  
  // Generella uppmuntran
  general: [
    'Du är bra precis som du är! 💙',
    'Detta är inte lätt, men du kämpar på. Det är imponerande! 💪',
    'Kom ihåg: alla små steg leder till stora förändringar. 🌱',
    'Du är modig som tar tag i detta. Fortsätt så! 🚀',
    'Det är okej att ha dåliga dagar. Du är fortfarande på väg framåt. 💙'
  ]
}

// Hämta slumpmässigt uppmuntrande meddelande
export function getRandomEncouragement(type: keyof typeof encouragingMessages): string {
  const messages = encouragingMessages[type]
  return messages[Math.floor(Math.random() * messages.length)]
}

export default {
  getSupportiveMessage,
  getFirstSupportiveMessage,
  getMessageForError,
  getRandomEncouragement,
  encouragingMessages
}
