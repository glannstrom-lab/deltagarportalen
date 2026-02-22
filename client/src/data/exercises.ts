import { 
  Star, 
  FileText, 
  Users, 
  Network, 
  Linkedin, 
  Wallet, 
  MapPin, 
  Heart,
  PenTool,
  type LucideIcon 
} from 'lucide-react'

export interface ExerciseQuestion {
  id: string
  text: string
  placeholder?: string
}

export interface ExerciseStep {
  id: number
  title: string
  description: string
  questions: ExerciseQuestion[]
}

export interface Exercise {
  id: string
  title: string
  description: string
  icon: LucideIcon
  category: string
  duration: string
  difficulty: 'Lätt' | 'Medel' | 'Utmanande'
  steps: ExerciseStep[]
}

export const exercises: Exercise[] = [
  {
    id: 'strengths',
    title: 'Dina starkaste egenskaper',
    description: 'Analysera och utveckla dina starkaste egenskaper för att bättre förstå hur du kan använda dem i arbetslivet.',
    icon: Star,
    category: 'Självkännedom',
    duration: '20-30 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Dina bästa stunder',
        description: 'Tänk på situationer där du varit nöjd och kanske fått beröm.',
        questions: [
          { id: 's1-q1', text: 'Beskriv en situation där du kände dig riktigt nöjd med dig själv. Vad hände?', placeholder: 'T.ex. När jag ledde projektet som...' },
          { id: 's1-q2', text: 'Vilka av dina egenskaper och kompetenser använde du i den situationen?', placeholder: 'T.ex. Jag använde min förmåga att...' },
          { id: 's1-q3', text: 'Hur fungerade du med andra personer i denna situation?', placeholder: 'T.ex. Jag lyssnade aktivt och...' },
          { id: 's1-q4', text: 'Vilka känslor upplevde du? Hur påverkade de din motivation?', placeholder: 'T.ex. Jag kände stolthet och...' }
        ]
      },
      {
        id: 2,
        title: 'Utforska arbetsrelaterade egenskaper',
        description: 'Välj en av dina starka arbetsrelaterade egenskaper.',
        questions: [
          { id: 's2-q1', text: 'Välj en av dina starka egenskaper. Ge ett konkret exempel på hur den har hjälpt dig tidigare.', placeholder: 'T.ex. Min problemlösningsförmåga hjälpte mig när...' },
          { id: 's2-q2', text: 'Hur kan denna egenskap användas i olika yrkesroller och arbetsuppgifter?', placeholder: 'T.ex. Denna egenskap är värdefull inom...' },
          { id: 's2-q3', text: 'Fundera på yrken där denna kompetens kan komma till nytta. Lista 3-5 exempel.', placeholder: '1. Projektledare\n2. Kundtjänstmedarbetare\n3. ...' }
        ]
      },
      {
        id: 3,
        title: 'Sammanfattning och mål',
        description: 'Skriv ner mål för att utveckla dina starkaste egenskaper.',
        questions: [
          { id: 's3-q1', text: 'Skriv ner 1-3 konkreta mål för att utveckla och använda dina starkaste egenskaper i framtiden.', placeholder: 'Mål 1: Jag ska aktivt söka roller där...' },
          { id: 's3-q2', text: 'Sammanfatta vad du lärt dig om dina styrkor genom denna övning.', placeholder: 'Det viktigaste jag lärt mig är...' },
          { id: 's3-q3', text: 'Hur kan du använda dessa insikter i din jobbsökning eller karriär?', placeholder: 'Jag kommer att...' }
        ]
      }
    ]
  },
  {
    id: 'application',
    title: 'Skriva en vinnande ansökan',
    description: 'Lär dig skriva en arbetsansökan som fångar rekryterarens uppmärksamhet och visar varför just du är rätt person.',
    icon: FileText,
    category: 'Jobbsökning',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Analysera jobbannonsen',
        description: 'Börja med att förstå vad arbetsgivaren söker.',
        questions: [
          { id: 'a1-q1', text: 'Välj en jobbannons som intresserar dig. Vilka är de tre viktigaste kraven?', placeholder: '1. Erfarenhet av...\n2. Kunskap inom...\n3. Förmåga att...' },
          { id: 'a1-q2', text: 'Vilka nyckelord återkommer i annonsen? Vad signalerar de om företagets kultur?', placeholder: 'Nyckelord: "teamspelare", "självgående"...' },
          { id: 'a1-q3', text: 'Vad kan du ta reda på om företaget? Besök deras webbplats och sociala medier.', placeholder: 'Företaget verkar vara...' }
        ]
      },
      {
        id: 2,
        title: 'Koppla dina erfarenheter',
        description: 'Matcha dina kompetenser med arbetsgivarens behov.',
        questions: [
          { id: 'a2-q1', text: 'Vilka av dina erfarenheter matchar de tre viktigaste kraven?', placeholder: 'Krav 1 matchar min erfarenhet som...' },
          { id: 'a2-q2', text: 'Beskriv en konkret situation där du visat en förmåga som efterfrågas.', placeholder: 'I mitt tidigare jobb...' },
          { id: 'a2-q3', text: 'Vad skiljer dig från andra sökande? Vad är din unika vinkel?', placeholder: 'Till skillnad från många andra har jag...' }
        ]
      },
      {
        id: 3,
        title: 'Skriv din ansökan',
        description: 'Formulera en övertygande ansökan.',
        questions: [
          { id: 'a3-q1', text: 'Skriv ett öppnande stycke som fångar intresset och förklarar varför du söker jobbet.', placeholder: 'Hej, jag skriver för att...' },
          { id: 'a3-q2', text: 'Skriv huvuddelen där du kopplar dina erfarenheter till kraven (3-5 meningar).', placeholder: 'Med min bakgrund inom...' },
          { id: 'a3-q3', text: 'Skriv ett avslutande stycke med call-to-action.', placeholder: 'Jag ser fram emot...' }
        ]
      }
    ]
  },
  {
    id: 'interview',
    title: 'Förberedelser inför intervju',
    description: 'Förbered dig inför anställningsintervjun med strukturerade övningar och vanliga frågor.',
    icon: Users,
    category: 'Jobbsökning',
    duration: '30-40 min',
    difficulty: 'Utmanande',
    steps: [
      {
        id: 1,
        title: 'Vanliga intervjufrågor',
        description: 'Förbered svar på klassiska intervjufrågor.',
        questions: [
          { id: 'i1-q1', text: '"Berätta om dig själv" - Skriv ett 1-minuts svar som fokuserar på det yrkesmässiga.', placeholder: 'Jag är en person som...' },
          { id: 'i1-q2', text: '"Vad är din största svaghet?" - Formulera ett ärligt men konstruktivt svar.', placeholder: 'En utmaning jag arbetat med är...' },
          { id: 'i1-q3', text: '"Varför ska vi anställa just dig?" - Beskriv ditt unika värde.', placeholder: 'Du bör anställa mig för att...' }
        ]
      },
      {
        id: 2,
        title: 'STAR-metoden',
        description: 'Öva på att strukturera dina svar med STAR-metoden.',
        questions: [
          { id: 'i2-q1', text: 'Beskriv en Situation där du stod inför en utmaning.', placeholder: 'Situation: Jag arbetade som...' },
          { id: 'i2-q2', text: 'Vilken Uppgift behövde du utföra?', placeholder: 'Uppgiften var att...' },
          { id: 'i2-q3', text: 'Vilken Handling tog du?', placeholder: 'Jag beslutade att...' },
          { id: 'i2-q4', text: 'Vad blev Resultatet?', placeholder: 'Resultatet blev att...' }
        ]
      },
      {
        id: 3,
        title: 'Dina frågor till arbetsgivaren',
        description: 'Förbered frågor som visar ditt engagemang.',
        questions: [
          { id: 'i3-q1', text: 'Vad vill du veta om arbetsuppgifterna? Formulera 2 frågor.', placeholder: '1. Kan du beskriva en typisk arbetsdag?\n2. ...' },
          { id: 'i3-q2', text: 'Vad vill du veta om teamet och arbetsplatskulturen?', placeholder: '1. Hur skulle du beskriva teamets dynamik?\n2. ...' },
          { id: 'i3-q3', text: 'Vad vill du veta om utvecklingsmöjligheter?', placeholder: '1. Vilka möjligheter finns det till...' }
        ]
      }
    ]
  },
  {
    id: 'networking',
    title: 'Nätverka för att hitta jobb',
    description: 'Lär dig hitta dolda jobb och bygga ett professionellt nätverk som stöttar din karriär.',
    icon: Network,
    category: 'Nätverkande',
    duration: '20-30 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Kartlägg ditt nuvarande nätverk',
        description: 'Identifiera vilka kontakter du redan har.',
        questions: [
          { id: 'n1-q1', text: 'Lista 5 personer i din omgivning som arbetar inom olika branscher.', placeholder: '1. Anna - sjukvård\n2. Erik - IT...' },
          { id: 'n1-q2', text: 'Vilka tidigare kollegor eller klasskamrater har du förlorat kontakten med?', placeholder: 'Från mitt förra jobb:...' },
          { id: 'n1-q3', text: 'Vilka personer skulle du vilja ha som mentor eller rådgivare?', placeholder: 'Jag skulle vilja prata med...' }
        ]
      },
      {
        id: 2,
        title: 'Nätverksstrategi',
        description: 'Planera hur du ska nätverka effektivt.',
        questions: [
          { id: 'n2-q1', text: 'Vilka evenemang eller mässor inom din bransch finns det?', placeholder: 'Jag skulle kunna gå på...' },
          { id: 'n2-q2', text: 'Hur kan du ge värde till ditt nätverk innan du ber om hjälp?', placeholder: 'Jag kan erbjuda...' },
          { id: 'n2-q3', text: 'Skriv ett utkast till ett meddelande där du ber om ett informationsmöte.', placeholder: 'Hej! Jag heter...' }
        ]
      },
      {
        id: 3,
        title: 'Underhålla relationer',
        description: 'Planera hur du ska hålla kontakten.',
        questions: [
          { id: 'n3-q1', text: 'Vilka 3 personer ska du kontakta denna vecka?', placeholder: '1. Maria från...\n2. ...' },
          { id: 'n3-q2', text: 'Hur kan du regelbundet dela med dig av intressant information?', placeholder: 'Jag kan dela artiklar om...' },
          { id: 'n3-q3', text: 'Skriv ner datum för att följa upp med nya kontakter.', placeholder: 'Uppföljning den:...' }
        ]
      }
    ]
  },
  {
    id: 'linkedin',
    title: 'LinkedIn som jobbsökarverktyg',
    description: 'Optimera din LinkedIn-profil och använd plattformen effektivt för att synas för arbetsgivare.',
    icon: Linkedin,
    category: 'Digital närvaro',
    duration: '25-35 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Optimera din profil',
        description: 'Gör din profil attraktiv för rekryterare.',
        questions: [
          { id: 'l1-q1', text: 'Skriv en catchy headline som beskriver vem du är (max 120 tecken).', placeholder: 'T.ex. Projektledare som skapar...' },
          { id: 'l1-q2', text: 'Skriv ett kort "Om"-avsnitt som berättar din historia.', placeholder: 'Jag brinner för att...' },
          { id: 'l1-q3', text: 'Vilka 5-10 färdigheter (skills) vill du framhäva?', placeholder: '1. Projektledning\n2. Kommunikation...' }
        ]
      },
      {
        id: 2,
        title: 'Nätverka på LinkedIn',
        description: 'Bygg relationer strategiskt.',
        questions: [
          { id: 'l2-q1', text: 'Identifiera 5 företag du vill jobba på. Följ dem!', placeholder: '1. Spotify\n2. Volvo...' },
          { id: 'l2-q2', text: 'Vilka personer skulle du vilja connecta med? Varför?', placeholder: 'Jag vill connecta med...' },
          { id: 'l2-q3', text: 'Skriv ett personligt meddelande för att skicka med din connect-förfrågan.', placeholder: 'Hej [Namn], jag såg att...' }
        ]
      },
      {
        id: 3,
        title: 'Innehållsstrategi',
        description: 'Bli synlig genom att dela innehåll.',
        questions: [
          { id: 'l3-q1', text: 'Vilka ämnen inom din bransch kan du dela insikter om?', placeholder: 'Jag kan skriva om...' },
          { id: 'l3-q2', text: 'Skriv ett utkast till ett inlägg om något du lärt dig nyligen.', placeholder: 'Nyligen insåg jag att...' },
          { id: 'l3-q3', text: 'Hur ofta ska du vara aktiv på LinkedIn? Sätt ett realistiskt mål.', placeholder: 'Jag ska posta...' }
        ]
      }
    ]
  },
  {
    id: 'salary',
    title: 'Förstå lön och förmåner',
    description: 'Lär dig förhandla lön och förstå olika typer av ersättning och förmåner i anställningen.',
    icon: Wallet,
    category: 'Arbetsrätt',
    duration: '20-30 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Marknadsundersökning',
        description: 'Ta reda på vad din kompetens är värd.',
        questions: [
          { id: 'sa1-q1', text: 'Vilka lönekällor kan du använda? (Lönestatistik, fack, kollegor)', placeholder: 'Jag kan kolla...' },
          { id: 'sa1-q2', text: 'Vad är ett realistiskt lönespann för din roll och erfarenhet?', placeholder: 'Enligt mina efterforskningar...' },
          { id: 'sa1-q3', text: 'Hur skiljer sig lönerna mellan olika städer/branscher?', placeholder: 'I Stockholm verkar...' }
        ]
      },
      {
        id: 2,
        title: 'Förbered löneförhandlingen',
        description: 'Bygg dina argument.',
        questions: [
          { id: 'sa2-q1', text: 'Vilka är dina starkaste argument för en högre lön?', placeholder: 'Jag kan peka på...' },
          { id: 'sa2-q2', text: 'Vad är din "walk-away"-punkt? (Minimum du accepterar)', placeholder: 'Jag kan inte gå under...' },
          { id: 'sa2-q3', text: 'Hur ska du formulera din lönebegäran?', placeholder: 'Baserat på min erfarenhet och...' }
        ]
      },
      {
        id: 3,
        title: 'Förmåner och villkor',
        description: 'Se hela paketet, inte bara lönen.',
        questions: [
          { id: 'sa3-q1', text: 'Vilka förmåner är viktiga för dig? (flextid, distansarbete, friskvård)', placeholder: 'Det viktigaste för mig är...' },
          { id: 'sa3-q2', text: 'Hur väger du lön mot andra förmåner?', placeholder: 'Jag skulle kunna tänka mig lägre lön om...' },
          { id: 'sa3-q3', text: 'Vilka frågor ska du ställa om pensionsavsättning och semester?', placeholder: 'Jag vill veta...' }
        ]
      }
    ]
  },
  {
    id: 'careerpath',
    title: 'Planera din karriärväg',
    description: 'Skapa en strukturerad plan för din yrkesmässiga utveckling med kortsiktiga och långsiktiga mål.',
    icon: MapPin,
    category: 'Karriärutveckling',
    duration: '30-40 min',
    difficulty: 'Utmanande',
    steps: [
      {
        id: 1,
        title: 'Din nuvarande position',
        description: 'Analysera var du är idag.',
        questions: [
          { id: 'c1-q1', text: 'Beskriv din nuvarande situation - vad arbetar du med och hur trivs du?', placeholder: 'Just nu arbetar jag med...' },
          { id: 'c1-q2', text: 'Vad är du nöjd med i ditt nuvarande läge?', placeholder: 'Det jag uppskattar mest är...' },
          { id: 'c1-q3', text: 'Vad saknar du eller vill förändra?', placeholder: 'Jag skulle vilja ha mer...' }
        ]
      },
      {
        id: 2,
        title: 'Din vision',
        description: 'Definiera vart du vill komma.',
        questions: [
          { id: 'c2-q1', text: 'Var vill du vara om 5 år? Beskriv din ideala arbetssituation.', placeholder: 'Om 5 år ser jag mig själv...' },
          { id: 'c2-q2', text: 'Vilka värderingar är viktigast för dig i ett jobb?', placeholder: 'Det viktigaste för mig är...' },
          { id: 'c2-q3', text: 'Vilken kompetens behöver du utveckla för att nå dit?', placeholder: 'Jag behöver bli bättre på...' }
        ]
      },
      {
        id: 3,
        title: 'Handlingsplan',
        description: 'Bryt ner målen till konkreta steg.',
        questions: [
          { id: 'c3-q1', text: 'Vad ska du åstadkomma det kommande året?', placeholder: 'Det närmaste året ska jag...' },
          { id: 'c3-q2', text: 'Vilka är de tre första stegen du behöver ta?', placeholder: '1. Jag ska börja...\n2. Sedan...' },
          { id: 'c3-q3', text: 'Vem kan hjälpa dig? Vilka ska du be om stöd/råd?', placeholder: 'Jag kan prata med...' }
        ]
      }
    ]
  },
  {
    id: 'wellbeing',
    title: 'Hantera stress i jobbsökning',
    description: 'Strategier för att må bra och bibehålla motivation under jobbsökningsprocessen.',
    icon: Heart,
    category: 'Välmående',
    duration: '20-25 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Identifiera stressorer',
        description: 'Bli medveten om vad som skapar stress.',
        questions: [
          { id: 'w1-q1', text: 'Vad är mest stressande med din nuvarande jobbsökningssituation?', placeholder: 'Det som tynger mig mest är...' },
          { id: 'w1-q2', text: 'Hur märker du att du är stressad? Vilka kroppsliga signaler får du?', placeholder: 'Jag märker att jag...' },
          { id: 'w1-q3', text: 'När känner du dig mest sårbar eller orolig?', placeholder: 'Det värsta är när...' }
        ]
      },
      {
        id: 2,
        title: 'Skapa en hållbar rutin',
        description: 'Bygg strukturer som stöttar dig.',
        questions: [
          { id: 'w2-q1', text: 'Hur ska en balanserad jobbsökarvecka se ut? (inklusive återhämtning)', placeholder: 'Måndag: Söka jobb 2h...' },
          { id: 'w2-q2', text: 'Vilka aktiviteter ger dig energi och laddar batterierna?', placeholder: 'Jag mår bra av att...' },
          { id: 'w2-q3', text: 'Vem kan du prata med när det känns tufft?', placeholder: 'Jag kan vända mig till...' }
        ]
      },
      {
        id: 3,
        title: 'Motivation och perspektiv',
        description: 'Behåll hoppet under processen.',
        questions: [
          { id: 'w3-q1', text: 'Vad har du åstadkommit tidigare som du är stolt över?', placeholder: 'En sak jag är stolt över är...' },
          { id: 'w3-q2', text: 'Hur kan du fira framsteg, även små?', placeholder: 'När jag skickar en ansökan ska jag...' },
          { id: 'w3-q3', text: 'Skriv ett peppande brev till dig själv för svåra dagar.', placeholder: 'Kära jag, kom ihåg att...' }
        ]
      }
    ]
  },
  {
    id: 'coverletter',
    title: 'Personligt brev som sticker ut',
    description: 'Skapa ett personligt brev som berättar din unika historia och fångar arbetsgivarens intresse.',
    icon: PenTool,
    category: 'Jobbsökning',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Hitta din story',
        description: 'Identifiera vad som gör dig unik.',
        questions: [
          { id: 'cl1-q1', text: 'Vad är den röda tråden i din karriär? Vad driver dig?', placeholder: 'Genom hela min karriär har jag...' },
          { id: 'cl1-q2', text: 'Beskriv ett ögonblick som definierat ditt yrkesmässiga jag.', placeholder: 'Det var när jag...' },
          { id: 'cl1-q3', text: 'Vilka värderingar delar du med det företag du söker till?', placeholder: 'Jag uppskattar att företaget...' }
        ]
      },
      {
        id: 2,
        title: 'Kroppen på brevet',
        description: 'Skriv huvuddelarna.',
        questions: [
          { id: 'cl2-q1', text: 'Skriv en gripande inledning som väcker nyfikenhet.', placeholder: 'När jag såg er annons...' },
          { id: 'cl2-q2', text: 'Beskriv en konkret erfarenhet som visar varför du passar för rollen.', placeholder: 'I min roll som...' },
          { id: 'cl2-q3', text: 'Förklara varför just detta företag och denna roll lockar dig.', placeholder: 'Det som lockar mig med er är...' }
        ]
      },
      {
        id: 3,
        title: 'Avslut och call-to-action',
        description: 'Runda av övertygande.',
        questions: [
          { id: 'cl3-q1', text: 'Skriv ett avslutande stycke som sammanfattar ditt värde.', placeholder: 'Med min kombination av...' },
          { id: 'cl3-q2', text: 'Formulera en call-to-action som uppmuntrar till intervju.', placeholder: 'Jag ser fram emot...' },
          { id: 'cl3-q3', text: 'Gå igenom brevet - är det autentiskt och personligt?', placeholder: 'Brevet känns...' }
        ]
      }
    ]
  }
]
