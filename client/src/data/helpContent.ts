/**
 * Help content for all pages
 * FAQ and tips for each section of the application
 */

import { HelpContent } from '@/components/HelpButton'

export const helpContent: Record<string, HelpContent> = {
  dashboard: {
    title: 'Hjälp - Översikt',
    description: 'Din startsida för jobbsökandet',
    tips: [
      'Kolla av dina dagliga uppgifter för att hålla momentum',
      'Använd widgetarna för att snabbt se din framsteg',
      'Klicka på korten för att gå direkt till respektive sektion'
    ],
    faqs: [
      {
        question: 'Vad är onboarding-stegen?',
        answer: 'Onboarding-stegen hjälper dig komma igång med de viktigaste delarna av din jobbsökning: skapa profil, göra intresseguiden, bygga CV, utforska karriärvägar och söka jobb.'
      },
      {
        question: 'Hur uppdaterar jag min profil?',
        answer: 'Klicka på "Profil" i menyn eller på profilkortet på översikten. Där kan du lägga till information om dig själv, dina önskemål och intressen.'
      },
      {
        question: 'Vad betyder procenttalet på mitt CV?',
        answer: 'Procenttalet visar hur komplett ditt CV är. Fyll i fler sektioner som arbetslivserfarenhet, utbildning och kompetenser för att öka det.'
      },
      {
        question: 'Hur fungerar poängsystemet?',
        answer: 'Du får poäng (XP) för aktiviteter som att uppdatera din profil, söka jobb, och genomföra övningar. Poängen visar din aktivitetsnivå.'
      }
    ]
  },

  profile: {
    title: 'Hjälp - Min Profil',
    description: 'Hantera dina uppgifter och preferenser',
    tips: [
      'Alla ändringar sparas automatiskt till molnet',
      'Lägg till önskade jobb för att få bättre matchningar',
      'Fyll i tillgänglighet för att visa arbetsgivare när du kan börja'
    ],
    faqs: [
      {
        question: 'Varför ska jag fylla i min profil?',
        answer: 'En komplett profil hjälper oss ge dig bättre jobbmatchningar och rekommendationer. Det gör det också enklare för handledare att hjälpa dig.'
      },
      {
        question: 'Sparas mina uppgifter automatiskt?',
        answer: 'Ja! Alla ändringar du gör sparas automatiskt till molnet. Du ser en grön "Sparat"-indikator när ändringarna är synkade.'
      },
      {
        question: 'Vad är intresseguiden?',
        answer: 'Intresseguiden är ett test som hjälper dig förstå vilka typer av yrken som passar din personlighet. Resultatet visas sedan i din profil.'
      },
      {
        question: 'Kan jag ändra min e-postadress?',
        answer: 'E-postadressen är kopplad till ditt konto och kan inte ändras direkt. Kontakta din handledare om du behöver byta.'
      },
      {
        question: 'Vad betyder "Fysiska förutsättningar"?',
        answer: 'Denna sektion är helt frivillig. Om du har behov av anpassningar på arbetsplatsen kan du ange det här för att få bättre matchningar.'
      }
    ]
  },

  cv: {
    title: 'Hjälp - CV-byggaren',
    description: 'Skapa ett professionellt CV',
    tips: [
      'Börja med att fylla i grundläggande information',
      'Använd konkreta exempel och siffror i dina beskrivningar',
      'Förhandsgranska ofta för att se hur det kommer se ut',
      'Exportera som PDF när du är nöjd'
    ],
    faqs: [
      {
        question: 'Hur skapar jag ett nytt CV?',
        answer: 'Fyll i sektionerna i CV-byggaren: personlig info, arbetslivserfarenhet, utbildning, kompetenser och språk. Allt sparas automatiskt.'
      },
      {
        question: 'Kan jag ha flera CV-versioner?',
        answer: 'Ja! Du kan skapa olika versioner av ditt CV anpassade för olika typer av jobb. Använd versionshanteringen för att spara och växla mellan dem.'
      },
      {
        question: 'Hur exporterar jag mitt CV som PDF?',
        answer: 'Klicka på "Ladda ner PDF" eller "Exportera" knappen. Du kan välja mellan olika mallar och designer innan du laddar ner.'
      },
      {
        question: 'Vad ska jag skriva i sammanfattningen?',
        answer: 'Sammanfattningen ska vara 2-4 meningar som beskriver vem du är, din erfarenhet och vad du söker. Tänk på det som din "elevator pitch".'
      },
      {
        question: 'Hur lägger jag till kompetenser?',
        answer: 'Gå till kompetens-sektionen och lägg till relevanta färdigheter. Du kan ange nivå (nybörjare till expert) för varje kompetens.'
      }
    ]
  },

  jobSearch: {
    title: 'Hjälp - Jobbsök',
    description: 'Hitta och sök lediga tjänster',
    tips: [
      'Använd filter för att hitta jobb som matchar dina preferenser',
      'Spara intressanta jobb för att läsa senare',
      'Ställ in jobbnotiser för att få nya jobb direkt till dig'
    ],
    faqs: [
      {
        question: 'Varifrån kommer jobbannonser?',
        answer: 'Jobben hämtas från Arbetsförmedlingens Platsbanken som samlar annonser från hela Sverige.'
      },
      {
        question: 'Hur sparar jag ett jobb?',
        answer: 'Klicka på hjärt-ikonen eller "Spara" på ett jobb. Du hittar sedan alla sparade jobb under "Sparade jobb".'
      },
      {
        question: 'Hur söker jag ett jobb?',
        answer: 'Klicka på jobbet för att läsa mer, sedan på "Sök jobbet" eller "Till annonsen" för att komma till ansökningssidan.'
      },
      {
        question: 'Vad är jobbnotiser?',
        answer: 'Med jobbnotiser får du automatiskt nya jobb som matchar dina sökkriterier. Ställ in dem under jobbnotis-sektionen.'
      },
      {
        question: 'Hur hittar jag distansjobb?',
        answer: 'Använd filtret "Distans" eller sök på "remote" eller "distans" för att hitta jobb som kan utföras hemifrån.'
      }
    ]
  },

  education: {
    title: 'Hjälp - Utbildningar',
    description: 'Hitta utbildningar som passar dig',
    tips: [
      'Filtrera på utbildningstyp för att hitta rätt nivå',
      'Kolla ansökningsdeadlines - de varierar!',
      'Distansutbildningar ger flexibilitet'
    ],
    faqs: [
      {
        question: 'Vilka utbildningar visas här?',
        answer: 'Vi visar utbildningar från Yrkeshögskolan, Högskolor, Komvux och Folkhögskolor i hela Sverige via JobTech/Arbetsförmedlingen.'
      },
      {
        question: 'Vad är skillnaden mellan utbildningstyperna?',
        answer: 'Yrkeshögskola (YH) är praktiska utbildningar 1-2 år. Högskola ger akademisk examen. Komvux är vuxenutbildning på gymnasienivå. Folkhögskola erbjuder allmänna och yrkesinriktade kurser.'
      },
      {
        question: 'Hur ansöker jag till en utbildning?',
        answer: 'Klicka på utbildningen och sedan "Till utbildningen" för att komma till anordnarens sida där du ansöker.'
      },
      {
        question: 'Kostar utbildningarna pengar?',
        answer: 'De flesta utbildningar i Sverige är kostnadsfria. CSN (studiemedel) kan sökas för godkända utbildningar.'
      },
      {
        question: 'Kan jag studera på distans?',
        answer: 'Ja, många utbildningar erbjuds på distans. Filtrera på "Distans" för att bara se dessa.'
      }
    ]
  },

  interestGuide: {
    title: 'Hjälp - Intresseguiden',
    description: 'Upptäck yrken som passar dig',
    tips: [
      'Svara ärligt - det finns inga rätt eller fel svar',
      'Testet tar ca 10-15 minuter',
      'Resultatet baseras på den etablerade RIASEC-modellen'
    ],
    faqs: [
      {
        question: 'Vad är intresseguiden?',
        answer: 'Intresseguiden är ett vetenskapligt baserat test som matchar dina intressen och personlighet med olika yrkesområden. Det bygger på Hollands RIASEC-modell.'
      },
      {
        question: 'Hur lång tid tar testet?',
        answer: 'Testet tar ungefär 10-15 minuter att genomföra. Du svarar på frågor om vad du tycker om att göra.'
      },
      {
        question: 'Kan jag göra om testet?',
        answer: 'Ja! Du kan göra testet flera gånger. Ditt senaste resultat sparas i din profil.'
      },
      {
        question: 'Vad betyder RIASEC?',
        answer: 'RIASEC står för sex personlighetstyper: Realistisk, Utforskande (Investigative), Konstnärlig (Artistic), Social, Företagsam (Enterprising) och Konventionell. Ditt resultat visar vilka typer som passar dig bäst.'
      },
      {
        question: 'Stämmer resultatet alltid?',
        answer: 'Resultatet är en vägledning baserat på dina svar. Använd det som inspiration, men lita också på din egen magkänsla!'
      }
    ]
  },

  career: {
    title: 'Hjälp - Karriär',
    description: 'Utforska karriärvägar',
    tips: [
      'Läs om olika yrken för att få inspiration',
      'Kolla vilka kompetenser som behövs för ditt drömyrke',
      'Använd kompetensgap-analysen för att se vad du behöver utveckla'
    ],
    faqs: [
      {
        question: 'Vad kan jag göra i karriärsektionen?',
        answer: 'Här kan du utforska olika yrken, se vilka kompetenser de kräver, läsa om arbetsmarknadstrender och planera din karriärväg.'
      },
      {
        question: 'Vad är en kompetensgap-analys?',
        answer: 'Det är en jämförelse mellan dina nuvarande kompetenser och vad som krävs för ett visst yrke. Den visar vad du behöver lära dig.'
      },
      {
        question: 'Hur hittar jag yrken som passar mig?',
        answer: 'Gör intresseguiden först! Sedan kan du utforska yrken som matchar din profil här i karriärsektionen.'
      },
      {
        question: 'Var kommer yrkesinformationen ifrån?',
        answer: 'Information hämtas från Arbetsförmedlingen och SCB som har data om olika yrken, löner och arbetsmarknad.'
      }
    ]
  },

  coverLetter: {
    title: 'Hjälp - Personligt brev',
    description: 'Skriv övertygande ansökningar',
    tips: [
      'Anpassa brevet för varje jobb du söker',
      'Börja med varför du är intresserad av just detta jobb',
      'Använd konkreta exempel från din erfarenhet'
    ],
    faqs: [
      {
        question: 'Hur använder jag AI-hjälpen?',
        answer: 'Klistra in jobbannonsen och klicka på "Generera". AI:n skapar ett utkast baserat på ditt CV och jobbet. Redigera sedan för att göra det personligt.'
      },
      {
        question: 'Hur långt ska ett personligt brev vara?',
        answer: 'Ett personligt brev bör vara cirka en halv till en A4-sida. Håll det koncist och relevant.'
      },
      {
        question: 'Vad ska jag inkludera?',
        answer: 'Inledning (varför du söker), mittdel (dina relevanta erfarenheter och kompetenser), avslutning (sammanfattning och kontaktuppgifter).'
      },
      {
        question: 'Kan jag spara flera brev?',
        answer: 'Ja! Du kan spara olika brev för olika jobb och komma tillbaka till dem senare.'
      }
    ]
  },

  settings: {
    title: 'Hjälp - Inställningar',
    description: 'Anpassa din upplevelse',
    tips: [
      'Aktivera mörkt läge för att minska ögonbelastning',
      'Välj vilka notiser du vill få',
      'Anpassa språk och tillgänglighet efter behov'
    ],
    faqs: [
      {
        question: 'Hur byter jag till mörkt läge?',
        answer: 'Under "Utseende" i inställningarna kan du växla mellan ljust och mörkt tema.'
      },
      {
        question: 'Kan jag ändra språk?',
        answer: 'Ja, under "Språk" kan du välja mellan svenska och engelska.'
      },
      {
        question: 'Hur stänger jag av notiser?',
        answer: 'Under "Notiser" kan du välja vilka typer av meddelanden du vill få.'
      },
      {
        question: 'Hur raderar jag mitt konto?',
        answer: 'Kontakta din handledare för hjälp med att radera ditt konto. All data tas bort permanent.'
      }
    ]
  },

  diary: {
    title: 'Hjälp - Dagbok',
    description: 'Reflektera över din jobbsökning',
    tips: [
      'Skriv regelbundet för att följa din utveckling',
      'Anteckna både framgångar och utmaningar',
      'Använd dagboken inför möten med din handledare'
    ],
    faqs: [
      {
        question: 'Vad ska jag skriva i dagboken?',
        answer: 'Reflektioner om din jobbsökning: vad du gjort, hur du mår, vad du lärt dig, och vad du planerar framöver.'
      },
      {
        question: 'Kan andra se min dagbok?',
        answer: 'Din dagbok är privat som standard. Du kan välja att dela specifika inlägg med din handledare om du vill.'
      },
      {
        question: 'Hur ofta ska jag skriva?',
        answer: 'Det finns inget krav, men att skriva några gånger i veckan hjälper dig följa din progress och förbereda för handledarmöten.'
      }
    ]
  },

  wellness: {
    title: 'Hjälp - Välmående',
    description: 'Ta hand om dig själv',
    tips: [
      'Logga ditt humör dagligen för att se mönster',
      'Ta pauser - jobbsökning kan vara krävande',
      'Använd övningarna för att hantera stress'
    ],
    faqs: [
      {
        question: 'Varför finns välmåendesektionen?',
        answer: 'Jobbsökning kan vara stressande. Den här sektionen hjälper dig ta hand om ditt mentala välmående under processen.'
      },
      {
        question: 'Vad är humörloggning?',
        answer: 'Du kan snabbt logga hur du mår varje dag. Över tid ser du mönster som kan hjälpa dig förstå vad som påverkar ditt välmående.'
      },
      {
        question: 'Vilka övningar finns?',
        answer: 'Andningsövningar, mindfulness, och reflektionsövningar för att hantera stress och hålla motivationen uppe.'
      }
    ]
  },

  calendar: {
    title: 'Hjälp - Kalender',
    description: 'Planera dina aktiviteter',
    tips: [
      'Lägg in alla möten och intervjuer',
      'Sätt påminnelser för ansökningsdeadlines',
      'Schemalägg tid för jobbsökning varje dag'
    ],
    faqs: [
      {
        question: 'Hur lägger jag till en händelse?',
        answer: 'Klicka på ett datum eller på "Lägg till" knappen. Fyll i titel, tid och eventuell beskrivning.'
      },
      {
        question: 'Kan jag få påminnelser?',
        answer: 'Ja! När du skapar en händelse kan du välja att få en påminnelse innan.'
      },
      {
        question: 'Synkas kalendern med andra appar?',
        answer: 'Just nu är kalendern fristående i portalen. Exportfunktion till andra kalendrar kommer snart.'
      }
    ]
  },

  default: {
    title: 'Hjälp',
    description: 'Vägledning och support',
    tips: [
      'Använd menyn för att navigera mellan olika sektioner',
      'Dina framsteg sparas automatiskt',
      'Kontakta din handledare om du har frågor'
    ],
    faqs: [
      {
        question: 'Hur kommer jag igång?',
        answer: 'Börja med att fylla i din profil och göra intresseguiden. Sedan kan du bygga ditt CV och börja söka jobb!'
      },
      {
        question: 'Vem kan se min information?',
        answer: 'Din information är privat. Handledare kan se viss övergripande information för att hjälpa dig bättre.'
      },
      {
        question: 'Var hittar jag min handledare?',
        answer: 'Information om din handledare finns under "Profil" eller "Inställningar".'
      },
      {
        question: 'Hur loggar jag ut?',
        answer: 'Klicka på din profilbild eller namn i menyn och välj "Logga ut".'
      }
    ]
  }
}

export default helpContent
