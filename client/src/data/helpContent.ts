/**
 * Help content for all pages
 * FAQ and tips for each section of the application
 * Updated to reflect actual implemented features
 */

import type { HelpContent } from '@/components/HelpButton'

export const helpContent: Record<string, HelpContent> = {
  dashboard: {
    title: 'Hjälp - Översikt',
    description: 'Din startpunkt med alla verktyg samlade',
    tips: [
      'Klicka på en kategori-rubrik för att expandera eller fälla ihop den',
      'Grön bock visar att ett steg i "Kom igång" är klart',
      'Alla tre kategorier är expanderade som standard'
    ],
    faqs: [
      {
        question: 'Vilka kategorier finns på översiktssidan?',
        answer: 'Det finns tre kategorier: 1. Kom igång - dina första steg med profil, CV, jobbsök mm. 2. Kompetensutveckling - karriär, utbildning, LinkedIn mm. 3. Planera och dokumentera - kalender, dagbok, hälsa mm.'
      },
      {
        question: 'Vad innehåller "Kom igång"?',
        answer: 'Min profil, Intresseguiden, Mitt CV, Sök jobb, Personligt brev, Spontanansökningar och Mina ansökningar. Dessa är grunderna för att komma igång med jobbsökningen.'
      },
      {
        question: 'Vad innehåller "Kompetensutveckling"?',
        answer: 'Karriär, Utbildning, Personligt varumärke, Kompetensanalys, LinkedIn, Kunskapsbank och Övningar. Här utvecklar du dina färdigheter och planerar din karriär.'
      },
      {
        question: 'Vad innehåller "Planera och dokumentera"?',
        answer: 'Kalender, Dagbok, Hälsa, Internationell guide och Mina resurser. Här planerar du dina aktiviteter och håller koll på ditt mående.'
      },
      {
        question: 'Hur fungerar progress-indikatorn?',
        answer: 'I kategorin "Kom igång" visas hur många av 5 steg du har klarat. Grön bock på en ruta betyder att steget är klart. Progress sparas automatiskt till molnet.'
      },
      {
        question: 'Kan jag fälla ihop kategorier?',
        answer: 'Ja! Klicka på rubrik-raden för att expandera eller fälla ihop en kategori. Pilen visar om kategorin är öppen eller stängd.'
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

  skillsGapAnalysis: {
    title: 'Hjälp - Kompetensanalys',
    description: 'Jämför dina kompetenser med ditt drömjobb',
    tips: [
      'Din profil hämtas automatiskt från CV och Profil-sidan',
      'Fyll i ditt drömjobb eller klistra in en jobbannons',
      'Uppdatera ditt CV för att få bättre analysresultat'
    ],
    faqs: [
      {
        question: 'Hur fungerar kompetensanalysen?',
        answer: 'Analysen jämför dina nuvarande kompetenser (från ditt CV och profil) med vad som krävs för ditt drömjobb. Du får en matchningsgrad och rekommendationer för utveckling.'
      },
      {
        question: 'Varifrån hämtas min profilinformation?',
        answer: 'Din profil hämtas automatiskt från ditt CV och din Profil-sida. Detta inkluderar arbetslivserfarenhet, utbildning, kompetenser, språk och certifikat.'
      },
      {
        question: 'Vad behöver jag fylla i själv?',
        answer: 'Det enda du behöver fylla i är ditt drömjobb. Beskriv vilket jobb du vill ha eller klistra in en jobbannons för att få en mer detaljerad analys.'
      },
      {
        question: 'Varför visas en varning om otillräcklig data?',
        answer: 'Om du inte har fyllt i tillräckligt med information i ditt CV visas en varning. Gå till CV-sidan och lägg till arbetslivserfarenhet, utbildning och kompetenser för att kunna göra en analys.'
      },
      {
        question: 'Vad betyder matchningsgraden?',
        answer: 'Matchningsgraden visar hur väl dina nuvarande kompetenser matchar kraven för drömjobbet. En högre procent betyder att du redan har många av de färdigheter som krävs.'
      },
      {
        question: 'Hur använder jag rekommendationerna?',
        answer: 'Rekommendationerna visar konkreta steg för att fylla kompetensgapen. Det kan vara kurser, certifieringar, projekt eller andra aktiviteter som hjälper dig nå ditt mål.'
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

  spontaneous: {
    title: 'Hjälp - Spontanansökningar',
    description: 'Hitta och kontakta företag för spontanansökningar',
    tips: [
      'Sök företag med organisationsnummer för att få kontaktuppgifter',
      'Spara företag du är intresserad av i din lista',
      'Uppdatera status när du kontaktar eller ansöker'
    ],
    faqs: [
      {
        question: 'Hur söker jag efter ett företag?',
        answer: 'Ange organisationsnumret (10 siffror) i sökfältet. Systemet hämtar information från Bolagsverket och visar företagets namn, adress och kontaktuppgifter.'
      },
      {
        question: 'Kan jag spara företag jag är intresserad av?',
        answer: 'Ja, klicka på "Spara företag" för att lägga till det i din lista "Mina företag". Du kan sedan hålla koll på din kontakt och uppdatera status.'
      },
      {
        question: 'Vad innebär de olika statusarna?',
        answer: 'Du kan uppdatera status från "Sparad" till "Kontaktad", "Ansökt", "Intervju" eller "Avslag". Detta hjälper dig hålla koll på processen.'
      },
      {
        question: 'Var hittar jag organisationsnumret?',
        answer: 'Du hittar det på företagets webbsida, i deras e-postsignatur eller genom att söka på bolagsverket.se. Det är ofta på formen XXXXXX-XXXX.'
      }
    ]
  },

  linkedinOptimizer: {
    title: 'Hjälp - LinkedIn-optimerare',
    description: 'Optimera din LinkedIn-profil med AI',
    tips: [
      'En bra rubrik ökar din synlighet med upp till 300%',
      'Använd nyckelord som rekryterare söker efter',
      'Håll "Om mig" kort men engagerande'
    ],
    faqs: [
      {
        question: 'Varför är en bra LinkedIn-rubrik viktig?',
        answer: 'Rubriken är det första rekryterare ser. Den bör innehålla din jobbroll, nyckelkompetenser och relevanta sökord. En bra rubrik kan öka din synlighet bland potentiella arbetsgivare.'
      },
      {
        question: 'Hur lång bör min "Om mig"-sektion vara?',
        answer: '2-3 stycken är idealt. Börja med en hook som fångar intresse, visa dina unika värden, och avsluta med en call-to-action. AI:n hjälper dig strukturera detta.'
      },
      {
        question: 'Vad är profilhälsa och hur förbättrar jag den?',
        answer: 'Profilhälsa visar hur komplett och optimerad din profil är. Förbättra genom att lägga till profilbild, fylla alla sektioner, och få rekommendationer från kollegor.'
      },
      {
        question: 'Kan jag generera LinkedIn-inlägg automatiskt?',
        answer: 'Ja, ange ett ämne och välj ton (professionell, personlig, entusiastisk eller formell). AI:n genererar ett inlägg du kan kopiera direkt till LinkedIn.'
      }
    ]
  },

  interviewSimulator: {
    title: 'Hjälp - Intervjusimulator',
    description: 'Öva på intervjuer med AI-feedback',
    tips: [
      'Använd STAR-metoden (Situation, Task, Action, Result)',
      'Spela in dig själv för att se hur du framstår',
      'Öva på minst 5 frågor innan en riktig intervju'
    ],
    faqs: [
      {
        question: 'Hur fungerar inspelningen av intervjun?',
        answer: 'Du kan spela in hela sessionen. Klicka på inspelningsikonen så registreras både dina svar och tiden. Du kan ladda ner inspelningen som en fil efteråt.'
      },
      {
        question: 'Vad är STAR-metoden och varför är den viktig?',
        answer: 'STAR står för Situation, Task, Action, Result. Det är ett strukturerat sätt att besvara intervjufrågor som visar konkreta exempel. AI:n ger feedback baserat på detta.'
      },
      {
        question: 'Fungerar inte mikrofonen?',
        answer: 'Tal-till-text fungerar i moderna webbläsare. Om det inte fungerar kan du skriva ditt svar istället. Systemet stöder både tal och text.'
      },
      {
        question: 'Hur många frågor bör jag öva på?',
        answer: 'Vi rekommenderar minst 5 frågor för god övning. Du kan välja slumpmässiga frågor eller fokusera på en specifik kategori baserat på jobbrollen.'
      }
    ]
  },

  personalBrand: {
    title: 'Hjälp - Personligt varumärke',
    description: 'Bygg och stärk ditt personliga varumärke',
    tips: [
      'Var konsekvent över alla plattformar',
      'Fokusera på dina unika styrkor',
      'Skapa en kort och slagkraftig elevator pitch'
    ],
    faqs: [
      {
        question: 'Vad är en elevator pitch och hur lång bör den vara?',
        answer: 'En elevator pitch är en kort presentation av dig själv som tar 30-60 sekunder. Den bör innehålla vem du är, vad du gör bäst, och vad du söker.'
      },
      {
        question: 'Hur visar jag upp mitt arbete i portfolion?',
        answer: 'Använd konkreta exempel från tidigare projekt. Visa resultat, problem du löste, och ditt bidrag. Bilder, länkar och korta beskrivningar gör det lättare att förstå.'
      },
      {
        question: 'Var är det viktigt att synas digitalt?',
        answer: 'LinkedIn, GitHub (för tekniker), en personlig blogg och eventuellt Twitter är de viktigaste plattformarna. Var konsekvent med samma namn och profilbild.'
      },
      {
        question: 'Vad gör ett bra personligt varumärke?',
        answer: 'Ett starkt varumärke är autentiskt, konsekvent och visar dina unika styrkor. Det bygger förtroende och gör dig minnesvärd för rekryterare.'
      }
    ]
  },

  international: {
    title: 'Hjälp - Internationell guide',
    description: 'Vägledning för att arbeta i Sverige',
    tips: [
      'Skaffa personnummer så snart som möjligt',
      'Börja lära dig svenska tidigt - det öppnar fler möjligheter',
      'Kontakta Arbetsförmedlingen för stöd'
    ],
    faqs: [
      {
        question: 'Vilka är de viktigaste kraven för arbetstillstånd?',
        answer: 'Du behöver ett jobbkontrakt från en svensk arbetsgivare. Processen tar normalt 2-4 veckor. EU-medborgare kan arbeta utan speciellt tillstånd.'
      },
      {
        question: 'Vad bör jag prioritera när jag är ny i Sverige?',
        answer: 'Öppna bankkonto, skaffa personnummer hos Skatteverket, registrera adress och hitta bostad. Integrationsguiden ger en steg-för-steg checklista.'
      },
      {
        question: 'Är det nödvändigt att kunna svenska?',
        answer: 'Det beror på jobbet. Svenska hjälper mycket i arbetslivet och öppnar fler jobbmöjligheter. Vi rekommenderar att börja tidigt med språkstudier.'
      },
      {
        question: 'Vilken support finns för nyanlända?',
        answer: 'Många kommuner erbjuder gratis Svenska för invandrare (SFI), introduktionsprogram och jobbcoachning. Kontakta din lokala arbetsförmedling för mer info.'
      }
    ]
  },

  myConsultant: {
    title: 'Hjälp - Min konsulent',
    description: 'Kontakt med din arbetskonsulentt',
    tips: [
      'Ha regelbundna möten för bäst resultat',
      'Använd meddelanden för snabba frågor',
      'Sätt upp gemensamma mål och följ upp dem'
    ],
    faqs: [
      {
        question: 'Vad kan min konsulent se?',
        answer: 'Din konsulent kan se din aktivitet, sparade jobb, ansökningar, CV-status och ditt aktuella välmående (energi och humör). Du kontrollerar vad som delas.'
      },
      {
        question: 'Hur ofta bör jag ha möten med min konsulent?',
        answer: 'Det beror på ditt behov och er överenskommelse. Normalt är regelbundna möten varje 1-2 veckor bäst för att hålla momenten uppe.'
      },
      {
        question: 'Kan jag skicka meddelanden mellan mötena?',
        answer: 'Ja, använd meddelandefunktionen för dagliga frågor och uppdateringar. Längre diskussioner är bäst att ha under möten.'
      },
      {
        question: 'Hur följer jag mina framsteg?',
        answer: 'Ni sätter överenskomna mål tillsammans som visas här. Uppdateringarna sparas och konsulenten kan följa din utveckling.'
      }
    ]
  },

  salary: {
    title: 'Hjälp - Lön & Förhandling',
    description: 'Beräkna marknadslön och lär dig förhandla',
    tips: [
      'Undersök marknaden innan lönesamtal',
      'Förhandla alltid - det är förväntat',
      'Tänk på hela paketet, inte bara lönen'
    ],
    faqs: [
      {
        question: 'Hur beräknas en rättvis lön?',
        answer: 'Kalkylatorn tar hänsyn till erfarenhet, utbildning, arbetsort och bransch. Den använder aktuell marknadsdata för att ge ett realistiskt löneintervall.'
      },
      {
        question: 'Bör jag acceptera första löneoffertet?',
        answer: 'Nej, det är normalt att förhandla. Undersök marknaden innan och presentera en motiverad motproposition baserad på dina kvalifikationer.'
      },
      {
        question: 'Vad är en rimlig löneökning vid jobbbyte?',
        answer: 'Typiskt 10-20% högre lön vid byte (du tar större risk). Vid befordran inom samma företag är 5-10% rimligt.'
      },
      {
        question: 'Vilka förmåner kan jag förhandla om?',
        answer: 'Flexibel arbetstid, hemarbete, extra semester, fortbildning, försäkringar och pensionsavsättningar är vanliga förhandlingspunkter.'
      }
    ]
  },

  exercises: {
    title: 'Hjälp - Övningar',
    description: 'Praktiska övningar för jobbsökning',
    tips: [
      'Börja med 3-5 övningar inom relevanta områden',
      'Dina svar sparas automatiskt i molnet',
      'Använd AI Coach om du kör fast'
    ],
    faqs: [
      {
        question: 'Sparas mina svar automatiskt?',
        answer: 'Ja, dina svar sparas automatiskt i molnet när du skriver. Du kan fortsätta från vilken enhet som helst.'
      },
      {
        question: 'Hur många övningar bör jag göra?',
        answer: 'Det beror på dina behov. Vi rekommenderar 3-5 övningar inom kategorier som passar din jobbsökning och karriärmål.'
      },
      {
        question: 'Kan jag få hjälp med en övning?',
        answer: 'Ja, varje övning har en AI Coach-knapp. Du kan få vägledning, exempel och följdfrågor för att utveckla bättre svar.'
      },
      {
        question: 'Vad händer när jag slutför en övning?',
        answer: 'Systemet markerar övningen som slutförd och visar en sammanfattning. Du kan skriva ut eller ladda ner resultatet.'
      }
    ]
  },

  resources: {
    title: 'Hjälp - Mina resurser',
    description: 'Samlade dokument och sparade resurser',
    tips: [
      'Exportera CV till PDF eller Word',
      'Håll koll på sparade jobb med statusmarkeringar',
      'Bokmärk artiklar för snabb åtkomst'
    ],
    faqs: [
      {
        question: 'Hur spårar jag mina jobbansökningar?',
        answer: 'Använd statusfälten (Sparad, Ansökt, Intervju, Avslag, Erbjudande) för att hålla koll på din sökprocess. Du ser alla jobb i en översikt.'
      },
      {
        question: 'Kan jag exportera mitt CV?',
        answer: 'Ja, både till PDF och Word-format. Klicka på ladda ner-knappen och välj format. Word-filer kan redigeras vidare.'
      },
      {
        question: 'Varför ska jag bokmärka artiklar?',
        answer: 'Du kan snabbt komma åt innehåll senare utan att söka igen. Alla bokmärken sparas i molnet och synkas på alla enheter.'
      },
      {
        question: 'Hur många CV-versioner kan jag spara?',
        answer: 'Obegränsat! Ha olika versioner för olika branscher eller jobbroller. Varje version visar datum och kan enkelt hämtas.'
      }
    ]
  },

  knowledgeBase: {
    title: 'Hjälp - Kunskapsbank',
    description: 'Artiklar och guider för jobbsökning',
    tips: [
      'Använd sökfunktionen för att hitta specifika ämnen',
      'Bokmärk artiklar du vill läsa igen',
      'Följ lärandevägarna för strukturerad inlärning'
    ],
    faqs: [
      {
        question: 'Hur hittar jag rätt artiklar?',
        answer: 'Använd sökfältet eller bläddra i kategorier. Du kan också filtrera på ämnen som CV, intervju, nätverk med mera.'
      },
      {
        question: 'Vad är lärandevägar?',
        answer: 'Strukturerade samlingar av artiklar för att lära dig ett område steg för steg, t.ex. "Kom igång med jobbsökning" eller "Förbered dig för intervju".'
      },
      {
        question: 'Kan jag spara artiklar?',
        answer: 'Ja, klicka på bokmärkes-ikonen för att spara. Alla bokmärkta artiklar hittar du under "Mina resurser".'
      },
      {
        question: 'Uppdateras innehållet?',
        answer: 'Ja, vi lägger regelbundet till nya artiklar och uppdaterar befintliga med aktuell information om arbetsmarknaden.'
      }
    ]
  },

  default: {
    title: 'Hjälp',
    description: 'Vägledning och support',
    tips: [
      'Börja med "Kom igång" på översiktssidan',
      'Dina framsteg sparas automatiskt till molnet',
      'Kontakta din handledare om du har frågor'
    ],
    faqs: [
      {
        question: 'Hur kommer jag igång?',
        answer: 'Börja på Översiktssidan med kategorin "Kom igång". Där hittar du Profil, Intresseguiden, CV, Jobbsök, Personligt brev, Spontanansökningar och Mina ansökningar.'
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
