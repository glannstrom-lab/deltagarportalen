/**
 * Help content for all pages
 * FAQ and tips for each section of the application
 * Updated to reflect actual implemented features
 */

import { HelpContent } from '@/components/HelpButton'

export const helpContent: Record<string, HelpContent> = {
  dashboard: {
    title: 'Hjälp - Översikt',
    description: 'Din startpunkt för jobbsökandet',
    tips: [
      'Följ de 6 stegen i ordning för bästa resultat',
      'Grön bock visar att ett steg är klart',
      'Klicka på ett steg för att gå direkt dit'
    ],
    faqs: [
      {
        question: 'Vad är de 6 onboarding-stegen?',
        answer: '1. Profil - fyll i dina uppgifter. 2. Intresseguide - upptäck vilka yrken som passar dig. 3. CV - skapa ett professionellt CV. 4. Karriär - utforska karriärvägar. 5. Jobbsök - hitta lediga jobb. 6. Personligt brev - skriv ansökningar.'
      },
      {
        question: 'Hur markeras ett steg som klart?',
        answer: 'Stegen markeras automatiskt när du har genomfört dem. T.ex. markeras CV-steget när du har fyllt i grundläggande CV-information, och Intresseguide när du har slutfört testet.'
      },
      {
        question: 'Måste jag göra stegen i ordning?',
        answer: 'Nej, du kan hoppa mellan stegen som du vill. Men vi rekommenderar att börja med Profil och Intresseguiden för att få bättre matchningar senare.'
      },
      {
        question: 'Vad händer när alla steg är klara?',
        answer: 'När alla 6 steg är klara får du tillgång till "Min Jobbresa" där du kan följa hela din jobbsökningsprocess.'
      }
    ]
  },

  profile: {
    title: 'Hjälp - Min Profil',
    description: 'Hantera dina uppgifter och preferenser',
    tips: [
      'Alla ändringar sparas automatiskt till molnet',
      'Se "Sparat" i grönt när dina ändringar har synkats',
      'Fyll i så mycket som möjligt för bättre jobbmatchningar'
    ],
    faqs: [
      {
        question: 'Vilka sektioner finns i profilen?',
        answer: 'Det finns 10 sektioner: Kontaktuppgifter, Önskade jobb, Intressen, Intresseprofil (RIASEC), Tillgänglighet, Mobilitet & Körkort, Lön & Förmåner, Arbetsmarknadsstatus, Arbetspreferenser och Fysiska förutsättningar.'
      },
      {
        question: 'Sparas mina uppgifter automatiskt?',
        answer: 'Ja! Alla ändringar sparas automatiskt till molnet efter 1-2 sekunder. Du ser en grön "Sparat"-indikator när ändringarna är synkade.'
      },
      {
        question: 'Vad är "Önskade jobb"?',
        answer: 'Här kan du lägga till upp till 3 jobbroller du är intresserad av, t.ex. "Projektledare" eller "UX-designer". Detta hjälper oss ge dig bättre jobbförslag.'
      },
      {
        question: 'Vad är intresseprofilen (RIASEC)?',
        answer: 'Om du har gjort Intresseguiden visas dina resultat här. Det visar vilka personlighetstyper som passar dig bäst enligt RIASEC-modellen.'
      },
      {
        question: 'Måste jag fylla i allt?',
        answer: 'Nej, fyll i det som känns relevant för dig. Kontaktuppgifter och Önskade jobb är mest viktiga. Sektionen "Fysiska förutsättningar" är helt frivillig.'
      },
      {
        question: 'Kan jag ändra min e-postadress?',
        answer: 'E-postadressen är kopplad till ditt konto och kan inte ändras direkt. Kontakta din handledare om du behöver byta.'
      }
    ]
  },

  cv: {
    title: 'Hjälp - CV-byggaren',
    description: 'Skapa ett professionellt CV',
    tips: [
      'Följ de 5 stegen för att bygga ditt CV',
      'Förhandsgranska ditt CV i realtid till höger',
      'Använd AI-assistenten för att förbättra din sammanfattning',
      'Spara olika versioner för olika jobbtyper'
    ],
    faqs: [
      {
        question: 'Vilka steg finns i CV-byggaren?',
        answer: '1. Design - välj bland 6 mallar. 2. Om dig - namn, titel, kontaktuppgifter. 3. Profil - sammanfattning med AI-hjälp. 4. Erfarenhet - jobb och utbildning. 5. Kompetenser - färdigheter, språk, certifikat.'
      },
      {
        question: 'Vilka CV-mallar finns?',
        answer: 'Det finns 6 mallar: Sidebar (sidopanel), Centered (centrerad), Minimal (enkel), Creative (kreativ), Executive (professionell) och Nordic (nordisk design).'
      },
      {
        question: 'Hur använder jag AI-assistenten?',
        answer: 'I steg 3 (Profil) finns en AI-knapp som hjälper dig skriva eller förbättra din sammanfattning baserat på din erfarenhet.'
      },
      {
        question: 'Hur exporterar jag mitt CV som PDF?',
        answer: 'Klicka på "Ladda ner PDF" knappen. Du kan välja vilken mall du vill använda innan du laddar ner.'
      },
      {
        question: 'Kan jag ha flera CV-versioner?',
        answer: 'Ja! Använd versionshanteringen för att spara olika versioner av ditt CV. Du kan t.ex. ha ett för teknikjobb och ett för ledarroller.'
      },
      {
        question: 'Sparas mitt CV automatiskt?',
        answer: 'Ja, alla ändringar sparas automatiskt. Om du stänger webbläsaren kan du fortsätta där du slutade.'
      },
      {
        question: 'Vad är "Fyll med demodata"?',
        answer: 'Det fyller CV:t med exempeldata så du kan se hur det ser ut. Bra för att testa mallar innan du fyller i din egen information.'
      }
    ]
  },

  jobSearch: {
    title: 'Hjälp - Jobbsök',
    description: 'Hitta och sök lediga tjänster',
    tips: [
      'Använd filter för att hitta jobb som matchar dina preferenser',
      'Spara intressanta jobb med hjärt-ikonen',
      'Klicka på ett jobb för att se hela annonsen'
    ],
    faqs: [
      {
        question: 'Varifrån kommer jobbannonser?',
        answer: 'Jobben hämtas från Arbetsförmedlingens Platsbanken som samlar annonser från hela Sverige.'
      },
      {
        question: 'Hur söker jag jobb?',
        answer: 'Skriv in sökord (t.ex. "utvecklare" eller "säljare") och välj eventuellt ort. Klicka på Sök eller tryck Enter.'
      },
      {
        question: 'Vilka filter finns?',
        answer: 'Du kan filtrera på: Kommun/region, anställningstyp (heltid, deltid, etc.) och publiceringsdatum.'
      },
      {
        question: 'Hur sparar jag ett jobb?',
        answer: 'Klicka på hjärt-ikonen på ett jobb. Sparade jobb hittar du under fliken "Sparade".'
      },
      {
        question: 'Hur söker jag ett jobb?',
        answer: 'Klicka på jobbet för att läsa mer, sedan på "Till annonsen" för att komma till ansökningssidan hos arbetsgivaren eller Arbetsförmedlingen.'
      },
      {
        question: 'Vad är flikarna "Ansökningar" och "Varningar"?',
        answer: 'Under "Ansökningar" kan du hålla koll på jobb du har sökt. "Varningar" låter dig ställa in jobbnotiser för nya jobb som matchar dina kriterier.'
      }
    ]
  },

  applications: {
    title: 'Hjälp - Mina Ansökningar',
    description: 'Följ dina jobbansökningar genom hela processen',
    tips: [
      'Använd Pipeline-vyn för att se alla ansökningar i olika stadier',
      'Sätt påminnelser för att följa upp ansökningar',
      'Lägg till kontaktpersoner för varje ansökan'
    ],
    faqs: [
      {
        question: 'Hur lägger jag till en ansökan?',
        answer: 'Klicka på "Ny ansökan" i övre högra hörnet. Du kan också spara jobb från Jobbsökningen som automatiskt läggs till här.'
      },
      {
        question: 'Vad är de olika statusarna?',
        answer: 'Intresserad → Sparad → Ansökt → Screening → Telefonintervju → Intervju → Arbetsprov → Erbjudande → Accepterad/Avslag. Flytta ansökningar genom att klicka på statusknappen.'
      },
      {
        question: 'Vad betyder "Behöver uppföljning"?',
        answer: 'Ansökningar som inte uppdaterats på 7+ dagar markeras med orange. Det är en påminnelse att följa upp eller uppdatera statusen.'
      },
      {
        question: 'Hur sätter jag en påminnelse?',
        answer: 'Öppna en ansökan och gå till fliken "Påminnelser". Där kan du lägga till datum och tid för uppföljning.'
      },
      {
        question: 'Kan jag koppla CV och personligt brev?',
        answer: 'Ja! Öppna en ansökan och under "Dokument" kan du länka CV-versioner och personliga brev du skapat i portalen.'
      },
      {
        question: 'Vad visar Statistik-fliken?',
        answer: 'Där ser du översikt över dina ansökningar: totalt antal, aktiva, intervjufrekvens och vilka stadier dina ansökningar befinner sig i.'
      }
    ]
  },

  education: {
    title: 'Hjälp - Utbildningar',
    description: 'Hitta utbildningar som passar dig',
    tips: [
      'Använd snabbsökningarna för att komma igång',
      'Filtrera på utbildningstyp för att hitta rätt nivå',
      'Kolla ansökningsdeadlines - de varierar!'
    ],
    faqs: [
      {
        question: 'Vilka utbildningar visas här?',
        answer: 'Utbildningar från Yrkeshögskolan (YH), Högskolor/Universitet, Komvux och Folkhögskolor i hela Sverige via JobTech/Arbetsförmedlingen.'
      },
      {
        question: 'Vad är skillnaden mellan utbildningstyperna?',
        answer: 'Yrkeshögskola (YH) = praktiska utbildningar 1-2 år. Högskola = akademisk examen. Komvux = vuxenutbildning på gymnasienivå. Folkhögskola = allmänna och yrkesinriktade kurser.'
      },
      {
        question: 'Vad är snabbsökningarna?',
        answer: 'De 6 korten (YH-utbildningar, Universitet, IT & Tech, Vård & Omsorg, Ekonomi, Kreativa yrken) är förvalda sökningar som snabbt visar populära utbildningsområden.'
      },
      {
        question: 'Hur ansöker jag till en utbildning?',
        answer: 'Klicka på utbildningen och sedan "Till utbildningen" för att komma till anordnarens hemsida där du ansöker.'
      },
      {
        question: 'Vad betyder distansikonen?',
        answer: 'Utbildningar med laptop-ikonen kan läsas på distans, helt eller delvis. Bra om du inte kan pendla.'
      },
      {
        question: 'Kostar utbildningarna pengar?',
        answer: 'De flesta utbildningar i Sverige är kostnadsfria. CSN (studiemedel) kan sökas för godkända utbildningar.'
      }
    ]
  },

  interestGuide: {
    title: 'Hjälp - Intresseguiden',
    description: 'Upptäck yrken som passar dig',
    tips: [
      'Svara ärligt - det finns inga rätt eller fel svar',
      'Testet tar ca 10-15 minuter',
      'Ditt resultat sparas och visas i din profil'
    ],
    faqs: [
      {
        question: 'Vad är intresseguiden?',
        answer: 'Ett vetenskapligt baserat test som matchar dina intressen med olika yrkesområden. Det bygger på Hollands RIASEC-modell som används världen över.'
      },
      {
        question: 'Vilka flikar finns?',
        answer: 'Test (gör testet), Resultat (se dina resultat), Yrken (matchande yrken), Utforska (läs mer om yrkestyper), Historik (tidigare testresultat).'
      },
      {
        question: 'Vad betyder RIASEC?',
        answer: 'Sex personlighetstyper: Realistisk (praktisk), Investigativ (utforskande), Artistisk (kreativ), Social (hjälpande), Enterprising (företagsam), Konventionell (strukturerad).'
      },
      {
        question: 'Kan jag göra om testet?',
        answer: 'Ja! Du kan göra testet flera gånger. Alla resultat sparas under Historik så du kan jämföra.'
      },
      {
        question: 'Hur används mitt resultat?',
        answer: 'Resultatet visas i din profil och kan användas för att få bättre jobbmatchningar och utbildningsförslag.'
      }
    ]
  },

  career: {
    title: 'Hjälp - Karriär',
    description: 'Utforska karriärvägar',
    tips: [
      'Börja med "Utforska" för att läsa om olika yrken',
      'Använd "Kompetens" för att se vad du behöver lära dig',
      'Skapa en karriärplan under "Karriärplan"'
    ],
    faqs: [
      {
        question: 'Vilka flikar finns?',
        answer: 'Utforska (yrkesbeskrivningar), Nätverk (nätverkstips), Anpassning (karriärbyte), Företag (arbetsgivare), Credentials (certifieringar), Flytta (jobba utomlands), Karriärplan (din plan), Kompetens (kompetensgap).'
      },
      {
        question: 'Vad är kompetensgap-analysen?',
        answer: 'Under fliken "Kompetens" kan du jämföra dina nuvarande kompetenser med vad som krävs för ett yrke. Den visar vad du behöver lära dig.'
      },
      {
        question: 'Hur skapar jag en karriärplan?',
        answer: 'Gå till fliken "Karriärplan" och sätt upp mål och delmål för din karriärutveckling.'
      },
      {
        question: 'Var kommer yrkesinformationen ifrån?',
        answer: 'Information hämtas från Arbetsförmedlingen och SCB som har data om yrken, löner och arbetsmarknadstrender.'
      }
    ]
  },

  coverLetter: {
    title: 'Hjälp - Personligt brev',
    description: 'Skriv övertygande ansökningar',
    tips: [
      'Anpassa brevet för varje jobb du söker',
      'Använd AI-hjälpen för att komma igång',
      'Spara brev som mallar för liknande jobb'
    ],
    faqs: [
      {
        question: 'Vilka flikar finns?',
        answer: 'Skriv brev (skapa nytt), Mina brev (sparade brev), Ansökningar (skickade ansökningar), Mallar (färdiga mallar), Statistik (din ansökningsstatistik).'
      },
      {
        question: 'Hur använder jag AI-hjälpen?',
        answer: 'Under "Skriv brev" kan du klistra in en jobbannons. AI:n skapar ett utkast baserat på ditt CV och jobbet. Redigera sedan för att göra det personligt.'
      },
      {
        question: 'Hur långt ska ett personligt brev vara?',
        answer: 'Cirka en halv till en A4-sida. Håll det koncist och fokusera på varför du passar just det jobbet.'
      },
      {
        question: 'Kan jag spara mina brev?',
        answer: 'Ja! Alla brev du skriver sparas under "Mina brev". Du kan återanvända och redigera dem för nya ansökningar.'
      }
    ]
  },

  settings: {
    title: 'Hjälp - Inställningar',
    description: 'Anpassa din upplevelse',
    tips: [
      'Aktivera mörkt läge för att minska ögonbelastning',
      'Använd tillgänglighetsalternativen om du behöver',
      'Välj vilka notiser du vill få'
    ],
    faqs: [
      {
        question: 'Vilka inställningar finns?',
        answer: 'Profil (grundinfo), Tillgänglighet (hög kontrast, stor text, lugnt läge), Notiser (e-post, push), Utseende (ljust/mörkt tema), Sekretess och Säkerhet.'
      },
      {
        question: 'Hur byter jag till mörkt läge?',
        answer: 'Under "Utseende" kan du välja mellan Ljust, Mörkt eller System (följer din dators inställning).'
      },
      {
        question: 'Vad är "Lugnt läge"?',
        answer: 'Lugnt läge minskar animationer och rörliga element för en lugnare upplevelse. Bra om du är känslig för rörelse.'
      },
      {
        question: 'Kan jag stänga av notiser?',
        answer: 'Ja, under "Notiser" kan du välja exakt vilka typer av meddelanden du vill få.'
      }
    ]
  },

  diary: {
    title: 'Hjälp - Dagbok',
    description: 'Reflektera över din jobbsökning',
    tips: [
      'Skriv regelbundet för att bygga en streak',
      'Logga ditt humör dagligen för att se mönster',
      'Sätt veckans mål och bocka av dem'
    ],
    faqs: [
      {
        question: 'Vilka flikar finns?',
        answer: 'Dagbok (skriv dagboksinlägg), Humör (logga hur du mår), Mål (sätt och följ veckans mål), Tacksamhet (skriv vad du är tacksam för).'
      },
      {
        question: 'Vad är streaks?',
        answer: 'En streak räknar hur många dagar i rad du har skrivit i dagboken. Håll den vid liv för motivation!'
      },
      {
        question: 'Hur fungerar humörloggningen?',
        answer: 'Varje dag kan du snabbt logga hur du mår. Över tid ser du mönster som kan hjälpa dig förstå vad som påverkar ditt välmående.'
      },
      {
        question: 'Vad är veckans mål?',
        answer: 'Under "Mål" kan du sätta upp mål för veckan, t.ex. "Söka 5 jobb" eller "Uppdatera CV". Bocka av när du är klar.'
      },
      {
        question: 'Sparas allt automatiskt?',
        answer: 'Ja! Alla dagboksinlägg, humörloggar och mål sparas automatiskt till molnet.'
      }
    ]
  },

  wellness: {
    title: 'Hjälp - Välmående',
    description: 'Ta hand om dig själv',
    tips: [
      'Jobbsökning kan vara stressande - ta pauser',
      'Använd övningarna för att hantera stress',
      'Akut stöd finns om du behöver prata med någon'
    ],
    faqs: [
      {
        question: 'Vilka flikar finns?',
        answer: 'Hälsa (hälsotips), Energi (energihantering), Rutiner (skapa rutiner), Kognitiv träning (hjärnövningar), Akut stöd (krisstöd och hjälplinjer).'
      },
      {
        question: 'Vad är "Kognitiv träning"?',
        answer: 'Övningar för att träna koncentration, minne och fokus. Bra för att hålla hjärnan aktiv under jobbsökningen.'
      },
      {
        question: 'Vad finns under "Akut stöd"?',
        answer: 'Kontaktuppgifter till hjälplinjer och resurser om du mår dåligt och behöver prata med någon. T.ex. Mind, Jourhavande präst, etc.'
      },
      {
        question: 'Varför finns välmåendesektionen?',
        answer: 'Jobbsökning kan vara mentalt krävande. Den här sektionen hjälper dig ta hand om ditt välmående under processen.'
      }
    ]
  },

  calendar: {
    title: 'Hjälp - Kalender',
    description: 'Planera dina aktiviteter',
    tips: [
      'Byt mellan månad, vecka och dag-vy',
      'Lägg in intervjuer och möten',
      'Håll koll på dina ansökningsdeadlines'
    ],
    faqs: [
      {
        question: 'Vilka vyer finns?',
        answer: 'Månadsvy (översikt), Veckovy (detaljerad) och Dagvy (fokus på en dag). Byt med knapparna i övre högra hörnet.'
      },
      {
        question: 'Hur lägger jag till en händelse?',
        answer: 'Klicka på ett datum eller på plus-knappen. Fyll i titel, tid, typ (intervju, möte, deadline, förberedelse) och spara.'
      },
      {
        question: 'Vilka händelsetyper finns?',
        answer: 'Intervju (med förberedelsefrågor), Möte, Deadline och Förberedelse. Varje typ har olika färg och ikon.'
      },
      {
        question: 'Vad är mål-trackern?',
        answer: 'I kalendervyn ser du veckans mål för antal ansökningar, intervjuer och uppgifter. Bra för att hålla tempot uppe.'
      }
    ]
  },

  default: {
    title: 'Hjälp',
    description: 'Vägledning och support',
    tips: [
      'Följ onboarding-stegen på översiktssidan',
      'Dina framsteg sparas automatiskt till molnet',
      'Kontakta din handledare om du har frågor'
    ],
    faqs: [
      {
        question: 'Hur kommer jag igång?',
        answer: 'Börja på Översiktssidan och följ de 6 onboarding-stegen: Profil → Intresseguide → CV → Karriär → Jobbsök → Personligt brev.'
      },
      {
        question: 'Sparas min information automatiskt?',
        answer: 'Ja! Allt du fyller i sparas automatiskt till molnet. Du kan logga in från vilken enhet som helst och fortsätta där du slutade.'
      },
      {
        question: 'Vem kan se min information?',
        answer: 'Din information är privat. Handledare kan se viss övergripande information för att hjälpa dig bättre.'
      },
      {
        question: 'Hur loggar jag ut?',
        answer: 'Klicka på din profilbild eller namn i menyn och välj "Logga ut".'
      }
    ]
  }
}

export default helpContent
