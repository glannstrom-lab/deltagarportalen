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
// AI-team-länken kan ta en `coach`-parameter för att förvälja motsvarande agent
// — Jobin har redan AI-team-funktionen och vi vill inte bygga två parallella.
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
          'Använd "Kom igång"-rutorna som en checklista — bocka av i din takt.',
        ],
        faqs: [
          {
            question: 'Var börjar jag om jag är helt ny?',
            answer: 'Börja med profilen — ju mer du fyller i där, desto bättre jobbförslag får du. Sen gör Intresseguiden (10 min), sen bygg/importera ditt CV. Allt det här bygger upp underlaget för matchningen i Sök jobb.',
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
            question: 'Vad gör fältet "anpassningar"?',
            answer: 'Information du och din konsulent har om vad du behöver för att jobb ska funka — kortare pass, tysta rum, bildstöd osv. Detta delas inte med arbetsgivare automatiskt, men det är underlag för konsulent-stöd och rapporter till AF.',
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
          'Importera CV från fil för att snabbt fylla i profilen — vi extraherar fält automatiskt.',
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
          { label: 'Importera CV-fil', href: '/cv' },
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
          'Sätt jobbevakningar (Aviseringar) för dina favorit-yrken — då får du mejl när nya jobb kommer.',
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
          { label: 'AI-uppföljning', href: '/applications' },
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
          { label: 'Spontanansökan', href: '/spontaneous' },
          aiTeam('jobbcoach'),
        ],
      },
      digitalcoach: {
        tips: [
          'AI-assistenten kan generera ett första utkast — sen redigerar du så det låter som dig.',
          'Klistra in jobbannonsen i fältet "Annons" — då anpassas AI:n efter den specifika rollen.',
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
            answer: 'Företag i din pendlingsräckvidd som har 10-200 anställda växer mest och har lättast att anställa "fel" person de senare formar. Stora företag har strikta processer; små företag har inget HR. 50 medarbetare = bra sweet spot.',
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
          'Det finns inget "fel" svar. Om du fastnar på en fråga, hoppa över och kom tillbaka.',
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
          'Profil-bilden är viktigast — 14x fler vyer med bra bild. Tydligt ansikte, ljus bakgrund, leende.',
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
          'Sätt språket först — det styr hur AI:n svarar dig.',
        ],
        faqs: [
          {
            question: 'Var slår jag av/på coach-tipsen?',
            answer: 'I sektionen "Gränssnitt och visning" på den här sidan finns toggle "Visa coach-tips". Du kan slå av om du upplever det som visuellt brus — alla tips finns kvar i AI-team om du vill nå dem manuellt.',
          },
          {
            question: 'Hur tar jag bort mitt konto?',
            answer: 'Längst ned på Settings-sidan finns "Radera konto". Vi raderar all din data inom 30 dagar (GDPR). Vill du bara pausa — logga ut och slå av notiser så ligger kontot vilande.',
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
            answer: 'Bara du. Inte din konsulent, inte AF, inte Jobin. Dagboken är 100% privat och krypterad. Du KAN välja att dela enskilda anteckningar med din konsulent (via Quick Notes-funktionen) men det är aktivt val.',
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
          'Sync med Google/Outlook gör att möten dyker upp överallt — slipper du dubbel-bokningar.',
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
          'Spara dina favoritövningar — så hittar du tillbaka.',
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
          'Läsförloppet längst ned visar hur långt du kommit.',
          'Du kan exportera vissa artiklar som PDF för utskrift.',
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
          'Resurser är externa länkar och dokument — alla går till andra sidor.',
          'Spara länkar du använder ofta som favoriter (hjärta-knappen).',
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

/**
 * Mappar URL-pathname → pageKey i `PAGE_COACH_CONTENT`. Längsta match vinner,
 * så att t.ex. /career/credentials matchar `career` även om /career har en
 * mer specifik pageKey senare.
 */
const ROUTE_TO_PAGE_KEY: Array<[string, string]> = [
  // Hubs
  ['/oversikt', 'dashboard'],
  // Verktygssidor — ordnade alfabetiskt
  ['/ai-team', 'aiTeam'],
  ['/applications', 'applications'],
  ['/calendar', 'calendar'],
  ['/career', 'career'],
  ['/cover-letter', 'coverLetter'],
  ['/cv', 'cv'],
  ['/diary', 'diary'],
  ['/education', 'education'],
  ['/exercises', 'exercises'],
  ['/external-resources', 'resources'],
  ['/externa-resurser', 'resources'],
  ['/interest-guide', 'interestGuide'],
  ['/international', 'international'],
  ['/interview-simulator', 'interviewSimulator'],
  ['/job-search', 'jobSearch'],
  ['/knowledge-base', 'knowledgeBase'],
  ['/linkedin-optimizer', 'linkedinOptimizer'],
  ['/my-consultant', 'myConsultant'],
  ['/personal-brand', 'personalBrand'],
  ['/print-resources', 'resources'],
  ['/profile', 'profile'],
  ['/resources', 'resources'],
  ['/salary', 'salary'],
  ['/settings', 'settings'],
  ['/skills-gap-analysis', 'skillsGapAnalysis'],
  ['/spontanansökan', 'spontaneous'],
  ['/spontaneous', 'spontaneous'],
  ['/wellness', 'wellness'],
]

export function getPageKeyForPath(pathname: string): string | undefined {
  if (!pathname) return undefined
  // Längsta-match-vinner
  let best: [string, string] | null = null
  for (const entry of ROUTE_TO_PAGE_KEY) {
    if (pathname === entry[0] || pathname.startsWith(entry[0] + '/')) {
      if (!best || entry[0].length > best[0].length) best = entry
    }
  }
  return best?.[1]
}
