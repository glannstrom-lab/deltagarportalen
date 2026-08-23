/**
 * Coach Widget — datamodell
 *
 * Fem coacher som ger sidkontextuella tips + FAQ på varje sida.
 * Varje sida deklarerar sin `pageKey` i PageLayout; widget plockar
 * relevanta coacher + innehåll härifrån.
 *
 * Tonen per coach:
 *   - jobbcoach        — pragmatisk, "gör det här", konkret
 *   - arbetsterapeut   — varm, energi/anpassningar, hållbarhet
 *   - studievagledare  — strategisk, långsiktig, val + kompetens
 *   - mentalcoach      — empatisk, känsla, motivation, självkänsla
 *   - digitalcoach     — teknisk-pedagogisk, "klicka här", verktyg
 *
 * Varje page→coach-koppling ger tips (snabba uppmaningar) + ev. FAQ
 * (vanliga frågor) + relaterade länkar i appen.
 */


export type CoachId = 'jobbcoach' | 'arbetsterapeut' | 'studievagledare' | 'mentalcoach' | 'digitalcoach'

export interface Coach {
  id: CoachId
  name: string
  role: string
  /** Kort one-liner som visas under namnet i widgeten */
  tagline: string
  avatar: string
  avatarSm: string
  /** CSS-färg-hint (matchas mot DESIGN.md hub-tokens) */
  accent: 'activity' | 'wellbeing' | 'coaching' | 'info' | 'action'
}

export interface CoachFaq {
  question: string
  answer: string
}

export interface CoachLink {
  label: string
  href: string
}

export interface CoachPageContent {
  /** 2-4 korta tips skrivna i coachens röst */
  tips: string[]
  /** 1-3 vanliga frågor med utförliga svar */
  faqs?: CoachFaq[]
  /** Länkar till relevanta sidor/verktyg */
  links?: CoachLink[]
}

export interface PageCoachContent {
  /** Vilka coacher är relevanta för sidan, i visningsordning */
  coachIds: CoachId[]
  /** Innehåll per coach */
  byCoach: Partial<Record<CoachId, CoachPageContent>>
}

// ===========================================================================
// COACH DEFINITIONS
// ===========================================================================

export const COACHES: Record<CoachId, Coach> = {
  jobbcoach: {
    id: 'jobbcoach',
    name: 'Andreas',
    role: 'Jobbcoach',
    tagline: 'Hjälper dig hitta och söka jobb',
    avatar: '/coaches/jobbcoach.webp',
    avatarSm: '/coaches/jobbcoach-128.webp',
    accent: 'activity',
  },
  arbetsterapeut: {
    id: 'arbetsterapeut',
    name: 'Linnea',
    role: 'Arbetsterapeut',
    tagline: 'Anpassningar, energi och hållbarhet',
    avatar: '/coaches/arbetsterapeut.webp',
    avatarSm: '/coaches/arbetsterapeut-128.webp',
    accent: 'wellbeing',
  },
  studievagledare: {
    id: 'studievagledare',
    name: 'Sara',
    role: 'Studievägledare',
    tagline: 'Utbildning, karriär och kompetens',
    avatar: '/coaches/studievagledare.webp',
    avatarSm: '/coaches/studievagledare-128.webp',
    accent: 'coaching',
  },
  mentalcoach: {
    id: 'mentalcoach',
    name: 'Mona',
    role: 'Mental coach',
    tagline: 'Motivation, självkänsla och rutiner',
    avatar: '/coaches/mentalcoach.webp',
    avatarSm: '/coaches/mentalcoach-128.webp',
    accent: 'wellbeing',
  },
  digitalcoach: {
    id: 'digitalcoach',
    name: 'Daniel',
    role: 'Digital coach',
    tagline: 'Tekniken, verktygen och appen',
    avatar: '/coaches/digitalcoach.webp',
    avatarSm: '/coaches/digitalcoach-128.webp',
    accent: 'info',
  },
}

// ===========================================================================
// HJÄLP-LÄNKAR
// ===========================================================================
// AI-team-länken bär en `coach`-parameter — men **den gör ingenting** (verifierat
// 2026-08-17). `pages/AITeam.tsx` anropar aldrig `useSearchParams()`, och
// `useSuggestedAgent` väljer agent utifrån senast besökta rutt i stället.
// Även om parametern lästes skulle den inte matcha: `CoachId` här är
// 'jobbcoach' | 'mentalcoach' | … medan `AgentId` i AgentSelector.tsx är
// 'arbetskonsulent' | 'motivationscoach' | … — två av fem id:n saknar motpart.
//
// Länken tar dig alltså rätt, men löftet att du fortsätter med SAMMA rådgivare
// infrias inte: klickar du från Mona kan du landa hos någon annan utan
// förklaring. Kommentaren beskrev tidigare avsikten som om den vore byggd.
// Att koppla ihop id:na är ett eget beslut — se ROADMAP DS8.
function aiTeam(coach: CoachId): CoachLink {
  return { label: 'Fråga djupare i AI-team', href: `/ai-team?coach=${coach}` }
}

// ===========================================================================
// PER-SIDA CONTENT
// ===========================================================================

export const PAGE_COACH_CONTENT: Record<string, PageCoachContent> = {
  // ------------------------------------------------------- DASHBOARD / Översikt
  dashboard: {
    coachIds: ['jobbcoach', 'mentalcoach'],
    byCoach: {
      jobbcoach: {
        tips: [
          'Börja varje dag med en konkret aktivitet — sök ett jobb, uppdatera CV:t, eller hör av dig till en kontakt.',
          'Du behöver inte göra allt på en gång. Tre små steg om dagen är bättre än en stor som aldrig blir av.',
          // Rättad 2026-08-18 i samma commit som layouten ändrades. Meningen
          // beskrev nyckeltalsremsan — fem rutor som inte finns kvar. Ett råd
          // som beskriver ett gränssnitt måste följa gränssnittet, annars blir
          // rådgivaren den som ljuger.
          'Sidan är delad i fyra: söka jobb, karriär, resurser och din vardag. Under varje rubrik står det du redan har gjort där — klicka på en rad för att fortsätta.',
        ],
        faqs: [
          {
            question: 'Var börjar jag om jag är helt ny?',
            answer: 'Börja med profilen — ju mer du fyller i där, desto bättre jobbförslag får du. Sen gör Intresseguiden (10 min), sen bygg ditt CV med mallarna. Allt det här bygger upp underlaget för matchningen i Sök jobb.',
          },
        ],
        links: [
          { label: 'Öppna min profil', href: '/profile' },
          { label: 'Sök jobb nu', href: '/job-search' },
          aiTeam('jobbcoach'),
        ],
      },
      mentalcoach: {
        tips: [
          'En sak åt gången. Stäng allt annat och välj en uppgift idag.',
          'Det är okej att inte göra något jobbsöksrelaterat varje dag. Återhämtning räknas.',
          'Logga hur du mår i dagboken — du ser tydligare vad som ger energi när du har data.',
        ],
        faqs: [
          {
            question: 'Jag känner mig överväldigad av allt här. Vad gör jag?',
            answer: 'Helt normalt. Stäng allt utom Översikt. Välj EN sak idag — bara en. Kanske ringa en kontakt eller läsa en artikel. Bygg tillbaka momentum stegvis. Dagbok-funktionen hjälper dig se mönster i vad som ger energi vs dränerar.',
          },
        ],
        links: [
          { label: 'Skriv i dagboken', href: '/diary' },
          { label: 'Hälsoverktyg', href: '/wellness' },
          aiTeam('mentalcoach'),
        ],
      },
    },
  },

  // ------------------------------------------------------- HUBBARNA (2026-08-18)
  //
  // De fyra hubbsidorna saknade rådgivarinnehåll helt, vilket var skälet till
  // att `Layout` slutade reservera högerkolumnen på dem (324 px tomt vid 1440).
  // Nu har de innehåll, så kolumnen kommer tillbaka — den här gången med något i.
  //
  // Varje tips nedan är kontrollerat mot vad portalen faktiskt gör. Det som inte
  // gick att belägga står inte här. Två påståenden är verifierade i två lager:
  //   · "dagboken ser bara du" — ingen konsulentvy läser `diary_entries`, och
  //     tabellens enda SELECT-policy är `user_id = auth.uid()` (mätt 2026-08-18).
  //   · "personnummer plockas bort" — servern maskerar innan anropet lämnar
  //     portalen, vaktat av `aiHandlerResponse.test.ts` (B29).
  // Se lärdomen 2026-08-17: rådgivarna lovade tjugo saker portalen inte gjorde.

  jobbHub: {
    coachIds: ['jobbcoach', 'mentalcoach'],
    byCoach: {
      jobbcoach: {
        tips: [
          'Börja med CV:t om du är ny här. Både brevgeneratorn och jobbmatchningen läser det, så det du fyller i en gång kommer till användning på flera ställen.',
          'Spontanansökan letar företag, inte annonser. Uppgifterna kommer ur Bolagsverkets register, så adress och organisationsnummer stämmer.',
          'Har du sökt ett jobb någon annanstans: lägg in det under Ansökningar ändå. Det är där du ser vad som väntar på svar.',
        ],
        faqs: [
          {
            question: 'Vilket verktyg ska jag börja med?',
            answer: 'CV först, brev sen, sök jobb efter det. Brevet hämtar uppgifter ur CV:t, och jobbsökningen matchar mot vad du fyllt i. Gör du det i omvänd ordning får du göra samma jobb två gånger.',
          },
          {
            question: 'Söker portalen jobben för mig?',
            answer: 'Nej. Portalen hittar annonser, skriver utkast och håller ordning på vad du sökt — men du skickar in ansökan själv, hos arbetsgivaren. Det finns ingen knapp här som skickar något till ett företag.',
          },
        ],
        links: [
          { label: 'Sök jobb', href: '/job-search' },
          { label: 'Mina ansökningar', href: '/applications' },
          aiTeam('jobbcoach'),
        ],
      },
      mentalcoach: {
        tips: [
          'Bestäm i förväg hur många jobb du söker den här veckan. Ett tal du klarar slår ett ambitiöst du inte gör.',
          'Ett avslag säger ingenting om dig som person. De flesta söker många innan det klickar.',
          'Orkar du inte söka idag? Gör en intervjuövning i stället — den kräver ingen ansökan och du kan avbryta när du vill.',
        ],
        faqs: [
          {
            question: 'Jag har sökt länge utan svar. Vad gör jag?',
            answer: 'Byt en sak, inte allt. Prova spontanansökan i en vecka — att höra av dig till företag som inte annonserat ger ofta fler svar, för då konkurrerar du inte med hundra andra. Och ta upp mönstret med din konsulent; det kan sitta i något litet i CV:t.',
          },
        ],
        links: [
          { label: 'Intervjuträning', href: '/interview-simulator' },
          { label: 'Skriv i dagboken', href: '/diary' },
          aiTeam('mentalcoach'),
        ],
      },
    },
  },

  karriarHub: {
    coachIds: ['studievagledare', 'jobbcoach'],
    byCoach: {
      studievagledare: {
        tips: [
          'Intresseguiden bygger på hur du svarar, inte på ditt CV. Den kan därför föreslå yrken du aldrig tänkt på — fyra korta delar att besvara.',
          'Kompetensanalysen jämför ditt CV mot ett jobb du väljer själv. Klistra in en riktig annons, då blir gapet konkret i stället för allmänt.',
          'Siffrorna under Arbetsmarknad kommer direkt från Arbetsförmedlingen och ändras dagligen.',
        ],
        faqs: [
          {
            question: 'Måste jag veta vad jag vill innan jag börjar?',
            answer: 'Nej — det är hela poängen med Intresseguiden. Den ställer frågor om vad du tycker om att göra och föreslår yrken utifrån svaren. Du kan göra om den senare; svaren är inte huggna i sten.',
          },
          {
            question: 'Visar portalen vad en utbildning kostar?',
            answer: 'Nej. Utbildningssökningen visar vad som finns och var, men inte studiemedel eller avgifter. Det avgörs av CSN och av skolan — fråga dem innan du tackar nej till något.',
          },
        ],
        links: [
          { label: 'Gör Intresseguiden', href: '/interest-guide' },
          { label: 'Sök utbildningar', href: '/education' },
          aiTeam('studievagledare'),
        ],
      },
      jobbcoach: {
        tips: [
          'Ett mål som går att göra i morgon är mer värt än ett som beskriver 2030. Sätt det korta först.',
          'Personligt varumärke är inte en reklamtext. Det är att kunna säga vad du är bra på i två meningar, utan att tveka.',
          'En kompetens du håller på att lära dig är värd att skriva upp. "Pågående: Excel-grund" visar riktning.',
        ],
        faqs: [
          {
            question: 'Är det för sent att byta bana?',
            answer: 'Kartlägg först vad du redan har — kompetensanalysen visar ofta att avståndet till ett nytt yrke är mindre än man trodde. Många byten kräver ingen ny examen, bara att man kan sätta ord på det man redan kan.',
          },
        ],
        links: [
          { label: 'Kompetensanalys', href: '/skills-gap-analysis' },
          { label: 'Karriärplan', href: '/career' },
          aiTeam('jobbcoach'),
        ],
      },
    },
  },

  resurserHub: {
    coachIds: ['digitalcoach', 'studievagledare'],
    byCoach: {
      digitalcoach: {
        tips: [
          'Kunskapsbanken är sökbar. Skriv det du undrar över med egna ord i stället för att bläddra bland kategorierna.',
          'Externa resurser är länkar ut ur portalen — Arbetsförmedlingen, Försäkringskassan och andra. De öppnas i en ny flik, så du tappar inte det du håller på med.',
          'Skriv ut resurser gör en PDF av det du kryssar i. Bra om du hellre läser på papper eller vill ta med något till ett möte.',
          'AI-teamet är fem inriktningar av samma AI. Får du ett svar som inte passar — byt agent och fråga igen.',
        ],
        faqs: [
          {
            question: 'Sparas mina AI-samtal?',
            answer: 'Ja, på ditt konto, så du kan läsa dem igen. Du kan också exportera ett samtal som PDF eller rensa chatten helt, från knapparna längst upp i AI-teamet.',
          },
          {
            question: 'Vart går det jag skriver till AI:n?',
            answer: 'Till en AI-tjänst utanför portalen — det är den som formulerar svaret. Personnummer och kontonummer plockas bort innan texten skickas dit. Resten står i integritetspolicyn, och den är värd att läsa innan du klistrar in något känsligt.',
          },
        ],
        links: [
          { label: 'Sök i Kunskapsbanken', href: '/knowledge-base' },
          { label: 'Integritetspolicy', href: '/privacy' },
          aiTeam('digitalcoach'),
        ],
      },
      studievagledare: {
        tips: [
          'Läs en artikel i taget och gör det den föreslår innan du läser nästa. Tio lästa artiklar utan handling ger mindre än en genomförd.',
          'Bokmärk det du vill komma tillbaka till — bokmärkena samlas under Dina dokument.',
        ],
        faqs: [
          {
            question: 'Var hittar jag mina egna saker?',
            answer: 'Under Dina dokument. Där ligger ditt CV, dina personliga brev, sparade jobb och bokmärkta artiklar — allt på ett ställe.',
          },
        ],
        links: [
          { label: 'Dina dokument', href: '/resources' },
          aiTeam('studievagledare'),
        ],
      },
    },
  },

  vardagHub: {
    coachIds: ['arbetsterapeut', 'mentalcoach'],
    byCoach: {
      arbetsterapeut: {
        tips: [
          'Kalendern här står för sig själv — den synkar inte mot Google eller Outlook. Har du dina möten där också får du lägga in dem på båda ställena.',
          'Övningarna sparas på ditt konto. Du kan börja på en, stänga datorn, och fortsätta en annan dag.',
          'Att logga hur du mår kräver ett samtycke, eftersom det räknas som en hälsouppgift. Du kan ta tillbaka samtycket när du vill.',
        ],
        faqs: [
          {
            question: 'Måste jag logga mitt mående varje dag?',
            answer: 'Nej. Poängen är att se mönster över tid, inte att fylla i en rad. Loggar du några gånger i veckan syns kurvan ändå — och hoppar du en månad händer ingenting.',
          },
          {
            question: 'Hur planerar jag en dag med lite energi?',
            answer: 'Lägg det som kräver mest tankearbete där du historiskt haft mest energi, och lägg bara EN sådan sak per dag. Resten får vara enkla saker. Ser du i måendekurvan att eftermiddagarna är tunga — boka ingenting där.',
          },
        ],
        links: [
          { label: 'Öppna kalendern', href: '/calendar' },
          { label: 'Övningar', href: '/exercises' },
          aiTeam('arbetsterapeut'),
        ],
      },
      mentalcoach: {
        tips: [
          'Dagboken ser bara du. Din konsulent har ingen väg in i den — skriv därför som du faktiskt känner, inte som du tror att någon vill läsa.',
          'Skriv kort. Tre meningar räcker: vad hände, vad kände jag, vad gör jag i morgon.',
          'En dålig dag är information, inte ett misslyckande. Den säger något om vad som tar energi.',
        ],
        faqs: [
          {
            question: 'Vad ser min konsulent av det här?',
            answer: 'Bara det du har delat. Under Min konsulent finns en lista över exakt vilka delar som är synliga och vilka bara du ser, och du ändrar det där. Dagboken finns inte med — den är alltid din.',
          },
        ],
        links: [
          { label: 'Skriv i dagboken', href: '/diary' },
          { label: 'Vad din konsulent ser', href: '/my-consultant' },
          aiTeam('mentalcoach'),
        ],
      },
    },
  },

  // ------------------------------------------------------- PROFIL
  profile: {
    coachIds: ['jobbcoach', 'digitalcoach'],
    byCoach: {
      jobbcoach: {
        tips: [
          'Önskade yrken är guldvärt — fyll i 3-5 yrken du är intresserad av, prioritera dem. Det styr matchningen i Sök jobb.',
          'Var konkret i fältet "ort" — "Stockholm" ger fler träffar än "Stockholmsområdet".',
          'Arbetspreferenser (heltid/deltid, remote) snävar in jobbflödet och visar bara jobb som passar dig.',
        ],
        faqs: [
          {
            question: 'Hur många önskade yrken bör jag lägga till?',
            answer: '2-5 är lagom. Lägg det yrke du helst vill ha överst (prio 1). Bonus om du väljer från listan (med grön bock) — då matchas yrket exakt i AF:s system. Fritext fungerar också men är mindre precis.',
          },
          {
            question: 'Vad gör sektionen "Hur Jag Jobbar Bäst"?',
            answer: 'Det heter "Hur Jag Jobbar Bäst" i din profil — vad du behöver för att ett jobb ska funka: kortare pass, tysta rum, bildstöd osv. Just nu är det bara du som ser det. Varken arbetsgivare, din konsulent eller AF får det automatiskt. Vill du att din konsulent ska känna till något av det, berätta det direkt för dem.',
          },
        ],
        links: [
          { label: 'Sök jobb med dina filter', href: '/job-search' },
          aiTeam('jobbcoach'),
        ],
      },
      digitalcoach: {
        tips: [
          'Allt sparas automatiskt — du behöver inte trycka på en spara-knapp. Grön bock = sparat i molnet.',
          // Rättat 2026-08-17, i två steg — det andra värt att läsa.
          //
          // Rådet löd: "Importera CV från fil för att snabbt fylla i profilen —
          // vi extraherar fält automatiskt." Import FRÅN FIL finns inte:
          // `DocumentsSection.tsx:189` laddar upp och lagrar filen, men
          // ingenting läser innehållet.
          //
          // Första rättelsen sa därför bara "lägg upp filen under Dokument" —
          // och blev för snäv. En skärmbild av sidan visade en knapp
          // "Importera CV" som jag inte hade sett i koden:
          // `ProfileHeader.tsx:197` → `importToProfile()`
          // (`profileEnhancementsApi.ts:773`), som läser ur `cvs`-tabellen och
          // fyller profilen från CV:t du redan byggt här. Den är äkta och
          // fungerar — det är bara vägen från en uppladdad fil som saknas.
          //
          // Lärdomen: att ta bort ett falskt påstående är halva jobbet. Den
          // andra halvan är att kontrollera vad som FAKTISKT finns, annars
          // byter man en överdrift mot en underdrift.
          'Har du byggt ditt CV här kan du fylla profilen från det med knappen "Importera CV". Den hämtar från ditt Jobin-CV — en fil du laddar upp under Dokument läses inte automatiskt.',
          'Profilstatus-mätaren visar vad som saknas — klicka på "Nästa steg" för att gå direkt dit.',
        ],
        faqs: [
          {
            question: 'Var är mina uppgifter sparade?',
            answer: 'I Supabase-molnet. Du kan logga in från valfri enhet och se samma data. Inget sparas bara lokalt i webbläsaren. Om du loggar in på telefon ser du samma profil där.',
          },
          {
            question: 'Vad gör avatar-uppladdningen?',
            answer: 'Den bild du laddar upp visas på din profil-sida och i ditt CV om du väljer en mall som har bild. Den delas inte automatiskt med arbetsgivare — bara om du själv lägger med CV:t i en ansökan.',
          },
        ],
        links: [
          // Hette "Importera CV-fil" och pekade på /cv, som inte har någon
          // sådan knapp. Knappen "Importera CV" sitter på profilsidan och
          // hämtar från Jobin-CV:t, inte från en fil — etiketten säger nu det.
          { label: 'Fyll profilen från ditt CV', href: '/profile' },
          aiTeam('digitalcoach'),
        ],
      },
    },
  },

  // ------------------------------------------------------- CV
  cv: {
    coachIds: ['jobbcoach', 'digitalcoach'],
    byCoach: {
      jobbcoach: {
        tips: [
          'Skriv arbetslivserfarenhet i UPPGIFTER, inte i ANSVAR. "Plockade ihop 80 ordrar/dag" är starkare än "ansvarade för plock".',
          'Lägg till siffror när du kan — "minskade fel med 12%", "höll 5 utbildningar". Konkret = trovärdigt.',
          'En sida är ofta nog. Om CV:t spillrer över på sida 2, korta ner gamla jobb och fokusera på de senaste 5 åren.',
        ],
        faqs: [
          {
            question: 'Behöver jag ha med jobb från innan 2010?',
            answer: 'Bara om de är direkt relevanta för det yrke du söker nu. Annars samlar du dem under "Tidigare erfarenhet: 2003-2010 — diverse arbeten inom service och handel". Spara plats för det som spelar roll.',
          },
          {
            question: 'Hur skriver jag om jag varit borta från arbetsmarknaden ett tag?',
            answer: 'Var öppen och kort. "2022-2024: föräldraledig" eller "2023-2024: rehabilitering — nu redo att börja jobba" räcker. Arbetsgivare uppskattar ärlighet mer än fluffiga formuleringar.',
          },
        ],
        links: [
          { label: 'Mall-galleri', href: '/cv' },
          aiTeam('jobbcoach'),
        ],
      },
      digitalcoach: {
        tips: [
          'Välj mall först — olika mallar passar olika branscher (Berlin = kreativt, Centered = klassiskt).',
          'Förhandsgranskningen uppdateras live när du skriver. Använd Eye-knappen för fullskärm.',
          'Exportera som PDF för ansökningar; Word om arbetsgivaren vill kunna redigera.',
        ],
        faqs: [
          {
            question: 'Vilken mall ska jag välja?',
            answer: 'För vård/skola/offentlig sektor — "Centered" eller "Nordic". För kontor/admin — "Manhattan" eller "Executive". För kreativa yrken — "Berlin" eller "Atelier". Du kan byta mall när som helst utan att tappa data.',
          },
          {
            question: 'Min PDF ser konstig ut — vad gör jag?',
            answer: 'Tryck på Eye-knappen och granska sida för sida. Om text spiller över: korta ner sektioner. Om bilden ser pixlig ut: ladda upp en större avatar i profilen. Kontakta supporten om problemen kvarstår.',
          },
        ],
        links: [
          { label: 'AI-skrivassistent', href: '/cv' },
          aiTeam('digitalcoach'),
        ],
      },
    },
  },

  // ------------------------------------------------------- SÖK JOBB
  jobSearch: {
    coachIds: ['jobbcoach', 'mentalcoach'],
    byCoach: {
      jobbcoach: {
        tips: [
          'Sätt yrkesfiltret innan ortsfiltret — det ger bredare och mer relevanta resultat.',
          'Klicka "Hämta från profil" om du redan lagt önskade yrken där, så slipper du upprepa.',
          'Spara intressanta jobb med bokmärket — så hittar du dem snabbt under Sparade.',
          // Löftet om mejl togs bort 2026-08-18: utskicken är inte igång (se
          // kommentaren i AlertsTab). Tipset beskriver nu vad bevakningen gör.
          'Spara dina favoritsökningar som bevakningar — nästa gång du öppnar sidan står det hur många nya jobb som tillkommit sedan sist.',
        ],
        faqs: [
          {
            question: 'Få träffar — vad gör jag?',
            answer: 'Bredda filtret: ta bort employmentType, släpp orten (eller välj hela regionen), eller välj bredare yrkeskategorier. Använd "Senaste månaden" istället för "Senaste veckan". Du kan också testa fritext-sökning utan yrkesfilter.',
          },
          {
            question: 'Många träffar är ovanliga — kan jag filtrera bort?',
            answer: 'Använd flera yrken samtidigt (OR-matchning) — då snävas resultatet till just dessa. Lägg också till specifik ort. Om jobben fortfarande är irrelevanta, prova att uppdatera CV-skills i profilen så blir matchningen smartare.',
          },
        ],
        links: [
          { label: 'Mina sparade jobb', href: '/job-search/saved' },
          { label: 'Aviseringar', href: '/job-search/alerts' },
          aiTeam('jobbcoach'),
        ],
      },
      mentalcoach: {
        tips: [
          'Sätt en gräns — t.ex. "jag tittar 30 min på morgonen, sen stänger jag". Annars blir det oändligt.',
          'Sortera bort jobb du INTE vill ha lika aktivt som du sparar de du vill ha. Mindre att skrolla genom.',
          'Avslag är inte personliga. Statistiken säger att man söker många jobb innan det klickar — det är normalt.',
        ],
        faqs: [
          {
            question: 'Jag deppar efter avslag — hur hanterar jag det?',
            answer: 'Reaktionen är normal — avslag känns alltid jobbiga. Notera dagen i dagboken så du ser mönster. Återhämtning: gör något fysiskt (promenad), skriv ner en sak du gjorde bra i ansökan, vänta minst 24h innan du söker nästa. Långsiktigt: prata med konsulenten om dina bästa kvalifikationer så återfår du perspektiv.',
          },
        ],
        links: [
          { label: 'Skriv om dagen i dagboken', href: '/diary' },
          aiTeam('mentalcoach'),
        ],
      },
    },
  },

  // ------------------------------------------------------- APPLICATIONS (Mina ansökningar)
  applications: {
    coachIds: ['jobbcoach', 'mentalcoach'],
    byCoach: {
      jobbcoach: {
        tips: [
          'Logga varje ansökan så fort du skickat — då har du underlag för uppföljning och statistik.',
          'Statusen "Intervju bokad" → "Avslag/Erbjudande" — uppdatera så snart något händer.',
          'Anteckna kontaktperson, telefon och deadlines — du tappar inte trådar då.',
        ],
        faqs: [
          {
            question: 'Hur länge bör jag vänta innan jag följer upp?',
            answer: 'Om annonsen säger när beslut väntas — vänta minst 3 dagar efter det. Annars: 7-10 dagar efter att du skickat in. Korta, vänliga uppföljnings-mejl är OK; ring bara om du redan haft kontakt.',
          },
        ],
        links: [
          { label: 'Mina uppföljningar', href: '/applications' },
          aiTeam('jobbcoach'),
        ],
      },
      mentalcoach: {
        tips: [
          'Räkna inte avslag som misslyckanden — räkna SÖKTA jobb som framsteg. Du har gjort jobbet.',
          'Behöver du en paus — pausa. Listan väntar.',
        ],
      },
    },
  },

  // ------------------------------------------------------- COVER LETTER
  coverLetter: {
    coachIds: ['jobbcoach', 'digitalcoach'],
    byCoach: {
      jobbcoach: {
        tips: [
          'Skriv VARFÖR du vill ha just det här jobbet — inte bara att du är intresserad.',
          'Koppla minst en konkret erfarenhet till något i annonsen. "Jag har 2 års lager-erfarenhet — det matchar er kravprofil."',
          'Håll det till 1 sida (3-4 stycken). Längre brev läses inte.',
        ],
        faqs: [
          {
            question: 'Måste jag skriva ett brev till varje ansökan?',
            answer: 'Inte alltid — många jobb tar bara CV. När annonsen ber om brev, anpassa det till just det jobbet. Ett generiskt brev syns på 5 sekunder och hamnar i papperskorgen. Bättre 5 anpassade brev än 50 generiska.',
          },
        ],
        links: [
          { label: 'Spontanansökan', href: '/spontanansökan' },
          aiTeam('jobbcoach'),
        ],
      },
      digitalcoach: {
        tips: [
          'AI-assistenten kan generera ett första utkast — sen redigerar du så det låter som dig.',
          'Klistra in jobbannonsen i fältet "Jobbannons" — då anpassas AI:n efter den specifika rollen.',
          'Spara olika versioner för olika branscher — du behöver inte börja om varje gång.',
        ],
        faqs: [
          {
            question: 'Är AI-genererade brev OK att skicka?',
            answer: 'Som UTKAST, ja. Men läs igenom och anpassa — annars känns det generiskt och alla AI-brev börjar låta likadana. Ändra åtminstone öppningen och en konkret erfarenhet till dina egna ord.',
          },
        ],
        links: [aiTeam('digitalcoach')],
      },
    },
  },

  // ------------------------------------------------------- SPONTANEOUS
  spontaneous: {
    coachIds: ['jobbcoach', 'mentalcoach'],
    byCoach: {
      jobbcoach: {
        tips: [
          'Spontanansökningar har högre svarsfrekvens än annonssvar — företaget vet inte ens att de behöver dig än.',
          'Lägg energi på MOTIVATION (varför ert företag) och VÄRDE (vad jag tillför) — inte CV-detaljer.',
          'Följ upp efter 7-10 dagar med ett kort mejl eller telefon.',
        ],
        faqs: [
          {
            question: 'Vilka företag ska jag rikta in mig på?',
            answer: 'Företag i din pendlingsräckvidd som varken är jättestora eller allra minst är oftast lättast att nå: de största har stela processer, de minsta har ingen som tar hand om ansökningar. Någon exakt bästa storlek har vi inte — men det är där du har störst chans att nå en människa.',
          },
        ],
        links: [aiTeam('jobbcoach')],
      },
      mentalcoach: {
        tips: [
          'En spontanansökan i veckan är mer än de flesta gör. Sätt en realistisk takt.',
          'Avslag på spontanansökningar är ofta tystnad — det betyder inte alltid nej, ibland bara "vi har inget just nu".',
        ],
      },
    },
  },

  // ------------------------------------------------------- INTERVIEW SIMULATOR
  interviewSimulator: {
    coachIds: ['jobbcoach', 'mentalcoach'],
    byCoach: {
      jobbcoach: {
        tips: [
          'Använd STAR-formeln: Situation, Task, Action, Result. Konkret = övertygande.',
          'Förbered 3 berättelser om dig själv — en om en framgång, en om en utmaning, en om ett misstag du lärde dig av.',
          'Ha en fråga redo att ställa — det visar engagemang. "Hur ser ett typiskt arbetsår ut här?" funkar alltid.',
        ],
        faqs: [
          {
            question: 'Vad gör jag om jag blir nervös?',
            answer: 'Övning, övning, övning. Använd simulatorn här minst 5 gånger innan den riktiga intervjun. Andas djupt 4-7-8 (in 4s, håll 7s, ut 8s) i bilen innan. Det är OK att säga "Bra fråga, får jag en sekund att tänka". Tystnad är inte ditt fiende.',
          },
        ],
        links: [aiTeam('jobbcoach')],
      },
      mentalcoach: {
        tips: [
          'Nervositet är inte motsatsen till säkerhet — den är energi. Du kan kanalisera den.',
          'Du intervjuar arbetsgivaren lika mycket som de intervjuar dig. Är det rätt plats för dig?',
        ],
        faqs: [
          {
            question: 'Jag blir helt blockerad i intervjusituationer.',
            answer: 'Du är inte ensam. Träna lågrisksimulation först (med rösten av), sen full simulation. För riktiga intervjuer: be om en telefonintervju först istället för video — mindre stimuli, lättare att fokusera. Och prata med konsulenten om coachning inför stora intervjuer.',
          },
        ],
        links: [aiTeam('mentalcoach')],
      },
    },
  },

  // ------------------------------------------------------- INTEREST GUIDE (RIASEC)
  interestGuide: {
    coachIds: ['studievagledare', 'mentalcoach'],
    byCoach: {
      studievagledare: {
        tips: [
          'Svara intuitivt — första instinkten är oftast rätt. Tänk inte "vad borde jag svara".',
          'Resultatet är ingen dom — bara ett perspektiv. Du kan vara stark på flera typer.',
          'När du fått resultat, kolla yrkesförslagen — vissa kan vara helt nya för dig och värda att undersöka.',
        ],
        faqs: [
          {
            question: 'Vad är RIASEC?',
            answer: 'En psykologisk modell som delar in arbetsintressen i 6 typer: Realistic (praktiskt), Investigative (analytiskt), Artistic (kreativt), Social (människa-fokus), Enterprising (ledarskap/sälj) och Conventional (struktur/data). Den utvecklades av John Holland och används internationellt för karriärvägledning. Resultatet visar dina TRE starkaste typer — inte bara en.',
          },
        ],
        links: [
          { label: 'Kompetensanalys efter guiden', href: '/skills-gap-analysis' },
          aiTeam('studievagledare'),
        ],
      },
      mentalcoach: {
        tips: [
          // Stod tidigare "hoppa över och kom tillbaka" — en knapp som inte
          // finns. TestTab har bara Föregående/Nästa. Det som DÄREMOT är sant
          // är autosparningen, och det är beläggbart. (2026-08-21)
          'Det finns inget "fel" svar. Dina svar sparas efter varje fråga, så du kan lämna sidan och fortsätta senare.',
          'Var snäll mot dig själv — du behöver inte passa in i en låda.',
        ],
      },
    },
  },

  // ------------------------------------------------------- CAREER (Karriär)
  career: {
    coachIds: ['studievagledare', 'jobbcoach'],
    byCoach: {
      studievagledare: {
        tips: [
          'Tänk i etapper, inte slutmål — vad är ditt nästa rimliga steg (6-12 mån)?',
          'Lista 3-5 yrken du är nyfiken på, inte bara ett. Det är OK att ha flera spår.',
          'Karriärplanering är inte en fastlåst karta — det är en kompass. Riktningen viktigare än ruttplaneringen.',
        ],
        faqs: [
          {
            question: 'Jag vet inte vad jag vill bli — var börjar jag?',
            answer: 'Helt vanligt. Gör Intresseguiden först — den ger 3 starka områden. Sen kolla yrkena som förknippas med dina toppar. Ringa in 2-3 som låter spännande, läs om dem, prata med någon som jobbar inom området. Du behöver inte veta exakt vad du vill bli — bara åt vilket håll du går.',
          },
        ],
        links: [
          { label: 'Intresseguiden', href: '/interest-guide' },
          { label: 'Utbildning', href: '/education' },
          aiTeam('studievagledare'),
        ],
      },
      jobbcoach: {
        tips: [
          'Innan du investerar i utbildning — prova praktik/arbetsträning i området. Många yrken ser annorlunda ut i verkligheten än i broschyren.',
          'Vissa yrken kräver inte alls den utbildning du tror. Kolla annonser i området — vad står det faktiskt om krav?',
        ],
      },
    },
  },

  // ------------------------------------------------------- EDUCATION (Utbildning)
  education: {
    coachIds: ['studievagledare'],
    byCoach: {
      studievagledare: {
        tips: [
          'Innan du börjar en lång utbildning — testa kortare kurser i området. Många YH-utbildningar tar in studerande utan formell behörighet om man visat intresse.',
          'CSN och studiestartsstöd finns för olika livssituationer — kontrollera vad du har rätt till INNAN du tackar nej till en utbildning.',
          'Validering av tidigare kunskap (RPL) kan korta utbildningstiden. Fråga skolan om det.',
        ],
        faqs: [
          {
            question: 'Komvux eller YH eller folkhögskola — vad passar mig?',
            answer: 'Komvux: gymnasie-betyg du saknar (1-2 år, CSN). YH-utbildning: yrkesutbildning 1-2 år, ofta med praktik och hög anställningsbarhet (CSN). Folkhögskola: bred allmän/yrkesinriktad, mindre krav, ofta bra för dig som behöver bygga upp självförtroende och studieteknik (CSN för 1-årig + studiestartsstöd ev.).',
          },
          {
            question: 'Jag har svårt att läsa/skriva — kan jag ändå studera?',
            answer: 'Ja. Skolorna har stöd: dyslexi-stöd, anpassad examination, mentor, talsyntes. Vid funktionsnedsättning kan du få ekonomiskt stöd via AF och anpassad studietakt. Berätta för skolan när du söker — de hjälper.',
          },
        ],
        links: [
          { label: 'Kompetensanalys', href: '/skills-gap-analysis' },
          aiTeam('studievagledare'),
        ],
      },
    },
  },

  // ------------------------------------------------------- SKILLS GAP
  skillsGapAnalysis: {
    coachIds: ['studievagledare', 'jobbcoach'],
    byCoach: {
      studievagledare: {
        tips: [
          'Fokusera på 2-3 kompetenser du verkligen saknar — inte 15. Gradvis utveckling slår allt.',
          'Färska kompetenser (senaste 5 åren) väger oftast tyngre än gamla i ansökningar.',
          'Vissa kompetenser lär du dig snabbast genom praktik eller volontärarbete, inte kurser.',
        ],
      },
      jobbcoach: {
        tips: [
          'Sätt en kompetens som mål för 3 månader, en för 6 månader. Det är realistiskt.',
          'Skriv upp kompetenserna i CV:t även medan du lär dig — "pågående: Excel-grund". Visar utveckling.',
        ],
      },
    },
  },

  // ------------------------------------------------------- LINKEDIN OPTIMIZER
  linkedinOptimizer: {
    coachIds: ['digitalcoach', 'jobbcoach'],
    byCoach: {
      digitalcoach: {
        tips: [
          'Profilbilden gör mest skillnad av allt — LinkedIn själva säger att en profil med bild får klart fler visningar. Tydligt ansikte, ljus bakgrund, leende.',
          'Headline-fältet ska INTE bara vara din jobbtitel — skriv "Lagerarbetare som söker nästa steg" eller "Söker arbetsterapeut-roll i Stockholm".',
          'Be om rekommendationer från tidigare kollegor och chefer — 3-5 räcker långt.',
        ],
        faqs: [
          {
            question: 'Hur ofta ska jag posta?',
            answer: 'Du behöver inte posta alls för att hitta jobb via LinkedIn. Men 1-2 inlägg/månad där du kommenterar något i din bransch ökar synlighet. Bättre att kommentera andras inlägg konsekvent än att posta egna sällan.',
          },
        ],
        links: [aiTeam('digitalcoach')],
      },
      jobbcoach: {
        tips: [
          'Aktivera "Open to work"-skylten — rekryterare söker den filtern.',
          'Lista 3-5 jobbroller du är öppen för i "Career interests".',
        ],
      },
    },
  },

  // ------------------------------------------------------- PERSONAL BRAND
  personalBrand: {
    coachIds: ['digitalcoach', 'jobbcoach'],
    byCoach: {
      digitalcoach: {
        tips: [
          'Personligt varumärke handlar inte om Instagram — det handlar om att du är konsekvent. Samma värdeord på CV, LinkedIn och i intervju.',
          'Välj 3 ord som beskriver dig professionellt. Använd dem som tråd genom allt material.',
          'Du behöver inte vara "synlig på sociala medier" för att ha ett tydligt varumärke. Ett tydligt CV räcker.',
        ],
      },
      jobbcoach: {
        tips: [
          'Vad pratar folk om när du inte är i rummet? Det är ditt riktiga varumärke.',
          'Be 3 personer du jobbat med beskriva dig i 3 ord. Mönster = ditt varumärke.',
        ],
      },
    },
  },

  // ------------------------------------------------------- SALARY
  salary: {
    coachIds: ['jobbcoach'],
    byCoach: {
      jobbcoach: {
        tips: [
          'Forska INNAN intervju — kolla Saco/Unionens lönestatistik för din yrkeskod (SSYK).',
          'Säg aldrig första siffran om du kan undvika — fråga "vad har ni budgeterat för rollen?"',
          'Om de pressar dig: ge ett spann ("38-44 tkr beroende på ansvar"), inte en exakt siffra.',
        ],
        faqs: [
          {
            question: 'Är det OK att förhandla även om man saknat jobb länge?',
            answer: 'Ja — du är värd lika mycket oavsett hur länge du sökt. Men förhandla rimligt — kolla statistik först. Att låsa sig på exakt siffra kan bränna erbjudandet; lyssna också på vad jobbet innebär (semester, friskvård, hemkontor) — det är också "lön".',
          },
        ],
        links: [aiTeam('jobbcoach')],
      },
    },
  },

  // ------------------------------------------------------- INTERNATIONAL
  international: {
    coachIds: ['jobbcoach', 'studievagledare'],
    byCoach: {
      jobbcoach: {
        tips: [
          'EU/EES — du kan jobba utan visum. Norge, Danmark och Tyskland har stora arbetsgivare som söker svensk arbetskraft.',
          'Skicka CV på engelska eller landets språk. Översätt inte mekaniskt — anpassa till landets normer.',
          'EURES (Europass) är den officiella EU-jobbportalen — bra startpunkt.',
        ],
      },
      studievagledare: {
        tips: [
          'Vissa svenska utbildningar valideras inte alltid utomlands — kolla EU-NARIC för referensbedömning.',
          'Erasmus+ för utbildning + praktik 2-12 månader är öppet för många yrkesutbildningar.',
        ],
      },
    },
  },

  // ------------------------------------------------------- SETTINGS
  settings: {
    coachIds: ['digitalcoach'],
    byCoach: {
      digitalcoach: {
        tips: [
          'Tema-byte (ljust/mörkt) är personligt — välj det som inte stressar ögonen.',
          'Notiser kan du stänga av per kategori — du missar inte något viktigt om du stänger marknadsföring.',
          'Språkvalet sitter uppe i toppmenyn, inte på den här sidan — byt där om du vill att appen och AI:n ska svara på ett annat språk.',
        ],
        faqs: [
          {
            question: 'Var slår jag av/på coach-tipsen?',
            answer: 'I sektionen "Utseende" på den här sidan finns toggle "Visa coach-tips". Du kan slå av om du upplever det som visuellt brus — alla tips finns kvar i AI-team om du vill nå dem manuellt.',
          },
          {
            question: 'Hur tar jag bort mitt konto?',
            answer: 'Under fliken Integritet, längst ned, finns "Radera konto". Raderingen sker 14 dagar senare — så länge hinner du ångra dig, sen är allt borta permanent. Vill du bara pausa — logga ut och slå av notiser så ligger kontot vilande.',
          },
        ],
        links: [aiTeam('digitalcoach')],
      },
    },
  },

  // ------------------------------------------------------- DIARY
  diary: {
    coachIds: ['mentalcoach', 'arbetsterapeut'],
    byCoach: {
      mentalcoach: {
        tips: [
          'Skriv inte långa inlägg — 3 meningar räcker. "Idag kände jag X. Det utlöstes av Y. Imorgon ska jag Z."',
          'Mönster är intressantare än enskilda dagar — efter 2 veckor ser du vad som ger energi vs dränerar.',
          'Det är OK att inte skriva varje dag. Skriv när det känns viktigt.',
        ],
        faqs: [
          {
            question: 'Vem ser min dagbok?',
            answer: 'Bara du. Inte din konsulent, inte AF, inte Jobin. Dagboken lämnar aldrig ditt konto, oavsett vad du skriver här. Vill du berätta något härifrån för din konsulent får du göra det själv — i ett möte eller ett meddelande. Det finns ingen knapp som delar.',
          },
        ],
        links: [
          { label: 'Hälsoverktyg', href: '/wellness' },
          aiTeam('mentalcoach'),
        ],
      },
      arbetsterapeut: {
        tips: [
          'Notera energinivå (1-5) tillsammans med dagstexten — du ser samband mellan aktivitet och mående.',
          'Veckosammanfattningar (söndag kväll) är guldvärt för att se trender.',
        ],
      },
    },
  },

  // ------------------------------------------------------- WELLNESS
  wellness: {
    coachIds: ['mentalcoach', 'arbetsterapeut'],
    byCoach: {
      mentalcoach: {
        tips: [
          'Konsekvens slår intensitet. 10 min meditation om dagen slår 1 timme en gång i veckan.',
          'Sömn är fundamentet — utan sömn fungerar inget annat. Prioritera den först.',
          'Notera vad som ÅTERHÄMTAR dig (inte bara vad som dränerar) — det är din verktygslåda.',
        ],
        faqs: [
          {
            question: 'Jag mår dåligt — räcker det med övningarna här?',
            answer: 'Övningarna här är stöd, inte behandling. Om du är nedstämd > 2 veckor, sömnen är borta, eller du tappar matlust — sök vård. Ring 1177 eller boka via vårdcentralen. Mår du AKUT dåligt eller har självmordstankar — ring 112 eller 90101 (självmordslinjen).',
          },
        ],
        links: [
          { label: 'Övningar', href: '/exercises' },
          { label: 'Skriv i dagbok', href: '/diary' },
          aiTeam('mentalcoach'),
        ],
      },
      arbetsterapeut: {
        tips: [
          'Energibalans, inte tidsbalans. Vissa aktiviteter ger 100% energi, andra tar 100%. Planera dagen för max balans.',
          'Strukturera DAGEN, inte bara veckan. Morgonrutin + middagsrutin + kvällsrutin.',
          'Bryt långa pass i kortare. 25 min jobb + 5 min paus är ofta effektivare än 1h utan paus.',
        ],
        faqs: [
          {
            question: 'Hur vet jag om jag tar på mig för mycket?',
            answer: 'Tre tecken: 1) Du sover sämre, 2) Du blir lättirriterad, 3) Du orkar inte med roliga saker. Om 2 av 3 stämmer — ta bort något. Du behöver inte fixa allt på samma vecka.',
          },
        ],
        links: [aiTeam('arbetsterapeut')],
      },
    },
  },

  // ------------------------------------------------------- CALENDAR
  calendar: {
    coachIds: ['arbetsterapeut', 'jobbcoach'],
    byCoach: {
      arbetsterapeut: {
        tips: [
          'Boka in återhämtning som möten — annars blir det "ledig tid" som lätt äts upp av andra.',
          'Lägg jobbsökarmöten på dina starkaste tider på dygnet — inte sista timmen.',
          'Buffer mellan möten (15 min) — du behöver omställningstid.',
        ],
      },
      jobbcoach: {
        tips: [
          'Boka in dedikerad "jobbsöks-tid" 2-3 gånger/vecka. Om det inte står i kalendern händer det inte.',
          'Kalendern här står för sig själv — den synkar inte mot Google eller Outlook. Har du dina möten där också får du lägga in dem på båda ställena.',
        ],
      },
    },
  },

  // ------------------------------------------------------- EXERCISES
  exercises: {
    coachIds: ['mentalcoach', 'arbetsterapeut'],
    byCoach: {
      mentalcoach: {
        tips: [
          'En övning gjord slår tre planerade. Börja smått.',
          'Har du börjat på en övning hittar du tillbaka via filtret "Påbörjade" högst upp.',
          'Vissa övningar känns konstiga första gången — ge dem 2-3 försök innan du dömer.',
        ],
      },
      arbetsterapeut: {
        tips: [
          'Andningsövningar funkar fysiologiskt även om de känns krystade. Det är inte placebo.',
          'Grounding-övningar är guld vid akut stress — "5 saker jag ser, 4 jag hör, 3 jag känner".',
        ],
      },
    },
  },

  // ------------------------------------------------------- MY CONSULTANT
  myConsultant: {
    coachIds: ['jobbcoach'],
    byCoach: {
      jobbcoach: {
        tips: [
          'Konsulenten är där för DIG — ställ frågor även om de känns "dumma".',
          'Förbered 2-3 saker du vill prata om innan mötet — annars rinner tiden iväg.',
          'Var ärlig om vad som inte funkar — konsulenten kan inte hjälpa med saker du gömmer.',
        ],
        faqs: [
          {
            question: 'Vad förväntas av mig?',
            answer: 'Att du är aktiv — söker jobb, fyller i planer, kommer till möten. Du behöver inte vara perfekt; bara visa att du försöker. Säg till om något inte funkar (sjuk, nedstämd, någon kris) — konsulenten kan hjälpa anpassa.',
          },
        ],
        links: [aiTeam('jobbcoach')],
      },
    },
  },

  // ------------------------------------------------------- KNOWLEDGE BASE
  knowledgeBase: {
    coachIds: ['studievagledare', 'digitalcoach'],
    byCoach: {
      studievagledare: {
        tips: [
          'Använd sök-funktionen — du hittar snabbare än att skrolla.',
          'Bokmärk artiklar du återkommer till. Du har en personlig läslista.',
          'Längre artiklar har innehållsförteckning — hoppa till det relevanta avsnittet.',
        ],
      },
      digitalcoach: {
        tips: [
          'Den tunna linjen högst upp fylls i medan du läser, så du ser hur långt du kommit.',
          'Vill du ha en artikel på papper använder du webbläsarens utskrift (Ctrl+P) — vi har ingen egen exportknapp.',
        ],
      },
    },
  },

  // ------------------------------------------------------- RESOURCES
  resources: {
    coachIds: ['digitalcoach', 'studievagledare'],
    byCoach: {
      digitalcoach: {
        tips: [
          'Här ligger det du sparat i Jobin: ditt CV, dina personliga brev, sparade jobb och bokmärkta artiklar. Länkar till AF, Försäkringskassan och andra hittar du under Externa resurser.',
          'Bokmärk en artikel med bokmärkesikonen i raden ovanför artikeltexten, så hittar du tillbaka till den här.',
        ],
      },
      studievagledare: {
        tips: [
          'AF, Försäkringskassan och Skatteverket har mycket gratis material — vi länkar till de viktigaste.',
        ],
      },
    },
  },

  // ------------------------------------------------------- AI TEAM
  aiTeam: {
    coachIds: ['digitalcoach'],
    byCoach: {
      digitalcoach: {
        tips: [
          'Välj rätt agent för uppgiften — Jobbcoach för ansökningar, Mental coach för stress, osv.',
          'Var specifik i din fråga — "Hjälp mig formulera om punkt 3 i CV:t" slår "Hjälp mig med CV".',
          'Du kan kopiera AI:ns svar och klistra in i andra verktyg.',
        ],
        faqs: [
          {
            question: 'Är AI-svaren tillförlitliga?',
            answer: 'AI:n är jättebra på att hjälpa formulera, brainstorma och kolla logik. Men den kan ha fel om faktauppgifter (lagar, regler, datum). Verifiera alltid faktauppgifter med officiella källor (AF, Skatteverket, vårdcentralen).',
          },
        ],
      },
    },
  },
}

// ===========================================================================
// HJÄLPFUNKTIONER
// ===========================================================================

/** Säker hämtning — returnerar null om sidan inte har coach-innehåll. */
export function getCoachContentForPage(pageKey: string | undefined): PageCoachContent | null {
  if (!pageKey) return null
  return PAGE_COACH_CONTENT[pageKey] ?? null
}

export function getCoach(id: CoachId): Coach {
  return COACHES[id]
}

// Rutt→pageKey-tabellen bor i `radgivarRutter.ts` sedan 2026-08-18. Skälet är
// bundlestorlek: Layout behöver veta OM en sida har en rådgivare för att inte
// reservera en tom 300 px-kolumn, och den frågan ska inte dra in 43 kB
// rådgivartext i entry-bundlen. Re-exporten står kvar så befintliga
// importörer (GlobalCoachWidgetContent, radgivarData, sokvag.test) är orörda.
export { getPageKeyForPath, harRadgivarinnehall } from './radgivarRutter'
