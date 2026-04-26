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
  Compass,
  ClipboardList,
  Target,
  Briefcase,
  Award,
  Megaphone,
  Shield,
  Smile,
  Zap,
  TrendingUp,
  GraduationCap,
  Calendar,
  MessageCircle,
  Phone,
  UserPlus,
  AlertCircle,
  FileBadge,
  Monitor,
  RefreshCw,
  Brain,
  Rocket,
  Scale,
  Building2,
  Gavel,
  BookOpen,
  Handshake,
  Coins,
  LineChart,
  Lightbulb,
  Landmark,
  BriefcaseBusiness,
  FileSearch,
  Laptop,
  UserCheck,
  ShieldCheck,
  HeartPulse,
  Coffee,
  Activity,
  UsersRound,
  AlertTriangle,
  Leaf,
  Pill,
  Stethoscope,
  Building,
  Accessibility,
  HelpingHand,
  Sparkles,
  type LucideIcon 
} from '@/components/ui/icons'

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
  },
  {
    id: 'jobb-jag',
    title: 'Hitta ditt jobb-jag',
    description: 'Upptäck vilken personlighetstyp du är och vilka yrken som passar dig bäst. Baserad på Arbetsförmedlingens modell med fyra profiler.',
    icon: Compass,
    category: 'Självkännedom',
    duration: '20-30 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Vilken personlighetstyp är du?',
        description: 'Svara på frågorna för att identifiera din dominerande profil.',
        questions: [
          { id: 'jj1-q1', text: 'När jag arbetar med något vill jag helst... (A) Använda mina händer och se konkreta resultat / (B) Lösa problem och analysera information / (C) Hjälpa och samarbeta med andra människor / (D) Skapa, designa eller uttrycka mig fritt', placeholder: 'Välj den bokstav som stämmer bäst: A, B, C eller D' },
          { id: 'jj1-q2', text: 'Jag blir mest engagerad när jag får... (A) Jobba med teknik, maskiner eller naturen / (B) Fördjupa mig i fakta, siffror eller forskning / (C) Stötta, undervisa eller påverka andra / (D) Komma på nya idéer eller skapa något unikt', placeholder: 'Välj den bokstav som stämmer bäst: A, B, C eller D' },
          { id: 'jj1-q3', text: 'Min idealiska arbetsplats skulle vara... (A) Verkstad, ute i naturen eller på en byggarbetsplats / (B) Laboratorium, kontor eller bibliotek / (C) Skola, vårdcentral eller i ett team / (D) Studio, designbyrå eller på scen', placeholder: 'Välj den bokstav som stämmer bäst: A, B, C eller D' },
          { id: 'jj1-q4', text: 'Jag är stolt över min förmåga att... (A) Laga, bygga eller reparera saker / (B) Tänka logiskt och förstå komplexa samband / (C) Lyssna, kommunicera och bygga relationer / (D) Tänka kreativt och se nya möjligheter', placeholder: 'Välj den bokstav som stämmer bäst: A, B, C eller D' },
          { id: 'jj1-q5', text: 'Jag föredrar att lära mig genom... (A) Göra och pröva själv praktiskt / (B) Läsa, studera och analysera / (C) Diskutera och samarbeta med andra / (D) Experimentera och uttrycka mig', placeholder: 'Välj den bokstav som stämmer bäst: A, B, C eller D' },
          { id: 'jj1-q6', text: 'Ett jobb som skulle passa mig ska vara... (A) Hands-on, konkret och resultatinriktat / (B) Intellektuellt utmanande och självständigt / (C) Meningsfullt genom att hjälpa andra / (D) Kreativt, varierande och inspirerande', placeholder: 'Välj den bokstav som stämmer bäst: A, B, C eller D' }
        ]
      },
      {
        id: 2,
        title: 'Din profil och passande yrken',
        description: 'Räkna dina svar och utforska yrken som matchar din profil.',
        questions: [
          { id: 'jj2-q1', text: 'Räkna dina svar: A (Praktisk) = __ st, B (Analytisk) = __ st, C (Social) = __ st, D (Kreativ) = __ st. Vilken bokstav har flest?', placeholder: 'Min dominerande profil är...' },
          { id: 'jj2-q2', text: 'Läs om din profil: Praktisk = Realistisk, teknisk, resultatinriktad / Analytisk = Investigativ, logisk, problemlösare / Social = Omtänksam, kommunikativ, samarbetar gärna / Kreativ = Originell, innovativ, uttrycker sig gärna. Stämmer beskrivningen överens med hur du ser på dig själv?', placeholder: 'Beskrivningen stämmer/delvis stämmer/inte stämmer för att...' },
          { id: 'jj2-q3', text: 'Lista 5 yrken inom din dominerande kategori som väcker ditt intresse.', placeholder: '1. ...\n2. ...\n3. ...\n4. ...\n5. ...' },
          { id: 'jj2-q4', text: 'Har du en sekundär profil (den näst högst räknade bokstaven)? Vilka yrken kombinerar båda profiler?', placeholder: 'Min sekundära profil är... Yrken som kombinerar båda är t.ex...' }
        ]
      },
      {
        id: 3,
        title: 'Handlingsplan för vidare utforskning',
        description: 'Skapa en plan för att utforska dina intresseområden vidare.',
        questions: [
          { id: 'jj3-q1', text: 'Välj ut 2-3 yrken du vill undersöka närmare. Vad behöver du veta om dem?', placeholder: 'Jag vill veta mer om lön, utbildningskrav, arbetsuppgifter...' },
          { id: 'jj3-q2', text: 'Hur kan du få mer information om dessa yrken? (Arbetsförmedlingen, informationsintervjuer, praktik)', placeholder: 'Jag ska börja med att...' },
          { id: 'jj3-q3', text: 'Vilka är dina nästa steg? Sätt konkreta datum för dina åtgärder.', placeholder: 'Vecka 1:... Vecka 2:... Vecka 3:...' }
        ]
      }
    ]
  },
  {
    id: 'kompetensinventering',
    title: 'Kompetensinventering',
    description: 'Kartlägg alla dina kompetenser - inte bara de formella. Upptäck dolda styrkor du kan lyfta i jobbsökningen.',
    icon: ClipboardList,
    category: 'Självkännedom',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Formella kompetenser',
        description: 'Lista dina utbildningar, certifikat och formella meriter.',
        questions: [
          { id: 'ki1-q1', text: 'Vilken utbildning har du? (Gymnasium, universitet, yrkeshögskola, komvux)', placeholder: 'Jag har utbildning inom...' },
          { id: 'ki1-q2', text: 'Har du några certifikat eller behörigheter? (Körkort, truckkort, språkcertifikat, säkerhetsutbildningar)', placeholder: 'Jag har certifikat för...' },
          { id: 'ki1-q3', text: 'Vilka kurser eller vidareutbildningar har du genomfört?', placeholder: 'Jag har gått kurser i...' }
        ]
      },
      {
        id: 2,
        title: 'Praktiska erfarenheter',
        description: 'Dokumentera all arbetslivserfarenhet - även informell.',
        questions: [
          { id: 'ki2-q1', text: 'Lista dina tidigare anställningar och vad du gjorde i dem.', placeholder: 'Jag har arbetat som... där jag...' },
          { id: 'ki2-q2', text: 'Har du erfarenhet från ideellt arbete, föreningsliv eller praktik?', placeholder: 'Jag har varit engagerad i...' },
          { id: 'ki2-q3', text: 'Vad kan du göra i hemmet eller på fritiden som är relevant för arbete? (Tech-support för familj, organisera evenemang, renovering)', placeholder: 'På fritiden har jag lärt mig att...' }
        ]
      },
      {
        id: 3,
        title: 'Personliga egenskaper och mjuka kompetenser',
        description: 'Identifiera dina personliga styrkor och sociala färdigheter.',
        questions: [
          { id: 'ki3-q1', text: 'Vad säger andra att du är bra på? (Be familj eller vänner om input)', placeholder: 'Min chef sa att jag... Mina vänner säger att jag...' },
          { id: 'ki3-q2', text: 'Vilka situationer klarar du av som andra kanske tycker är svåra?', placeholder: 'Jag är bra på att hantera...' },
          { id: 'ki3-q3', text: 'Vilka tre ord skulle du använda för att beskriva dig själv?', placeholder: 'Jag är...' },
          { id: 'ki3-q4', text: 'Sammanfatta dina 5 starkaste kompetenser som du kan lyfta i en intervju.', placeholder: 'Mina topp 5 kompetenser är: 1... 2... 3... 4... 5...' }
        ]
      }
    ]
  },
  {
    id: 'dromjobb',
    title: 'Drömjobbsanalys',
    description: 'Definiera ditt drömjobb och skapa en konkret handlingsplan för att nå dit. Från vision till verklighet.',
    icon: Target,
    category: 'Karriärutveckling',
    duration: '30-45 min',
    difficulty: 'Utmanande',
    steps: [
      {
        id: 1,
        title: 'Definiera ditt drömjobb',
        description: 'Beskriv din ideala arbetssituation utan begränsningar.',
        questions: [
          { id: 'dj1-q1', text: 'Om du kunde välja helt fritt - vad skulle du arbeta med?', placeholder: 'Mitt drömjobb skulle vara att...' },
          { id: 'dj1-q2', text: 'Beskriv en perfekt arbetsdag. Vad gör du? Vem jobbar du med? Var befinner du dig?', placeholder: 'En perfekt arbetsdag börjar med...' },
          { id: 'dj1-q3', text: 'Vad är viktigast för dig i ett jobb? (Lön, arbetsmiljö, utveckling, mening, flexibilitet)', placeholder: 'Det viktigaste är att...' },
          { id: 'dj1-q4', text: 'Vilka värderingar ska ett företag ha för att du ska trivas där?', placeholder: 'Jag vill arbeta på ett ställe där...' }
        ]
      },
      {
        id: 2,
        title: 'Gap-analys',
        description: 'Identifiera vad som saknas för att nå dit.',
        questions: [
          { id: 'dj2-q1', text: 'Vilka krav ställs normalt för detta jobb? (Utbildning, erfarenhet, kompetenser)', placeholder: 'För att få detta jobb behöver man...' },
          { id: 'dj2-q2', text: 'Vad har du redan som matchar kraven?', placeholder: 'Jag har redan...' },
          { id: 'dj2-q3', text: 'Vad saknar du och behöver skaffa?', placeholder: 'Det jag behöver skaffa är...' },
          { id: 'dj2-q4', text: 'Vilka är de tre största hindren? Hur kan du övervinna dem?', placeholder: 'Hinder 1:... Lösning:...' }
        ]
      },
      {
        id: 3,
        title: 'Väg dit och milstolpar',
        description: 'Bryt ner resan till hanterbara steg.',
        questions: [
          { id: 'dj3-q1', text: 'Vad kan du göra redan denna vecka för att komma närmare?', placeholder: 'Denna vecka ska jag...' },
          { id: 'dj3-q2', text: 'Vad ska du ha åstadkommit om 3 månader?', placeholder: 'Om 3 månader ska jag ha...' },
          { id: 'dj3-q3', text: 'Vad ska vara på plats om 1 år?', placeholder: 'Om ett år ska jag...' },
          { id: 'dj3-q4', text: 'Vem kan du be om stöd eller mentorskap?', placeholder: 'Jag kan prata med... om hjälp med...' }
        ]
      }
    ]
  },
  {
    id: 'kontaktstrategi',
    title: 'Kontaktstrategi för arbetsgivare',
    description: 'Planera och genomför kontakt med potentiella arbetsgivare på ett professionellt sätt som ger resultat.',
    icon: Briefcase,
    category: 'Jobbsökning',
    duration: '20-30 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Identifiera målföretag',
        description: 'Skapa en lista över företag du vill kontakta.',
        questions: [
          { id: 'ks1-q1', text: 'Vilka företag i din region anställer inom din bransch?', placeholder: 'Jag har hittat företagen...' },
          { id: 'ks1-q2', text: 'Vad kan du ta reda på om varje företag? (Storlek, kultur, nyheter, kontaktpersoner)', placeholder: 'Om Företag A vet jag att...' },
          { id: 'ks1-q3', text: 'Vem är den bästa personen att kontakta på varje företag?', placeholder: 'På Företag A ska jag kontakta...' }
        ]
      },
      {
        id: 2,
        title: 'Förbered ditt pitch',
        description: 'Förbered vad du ska säga eller skriva.',
        questions: [
          { id: 'ks2-q1', text: 'Skriv en kort presentation av dig själv (max 30 sekunder).', placeholder: 'Hej, jag heter... och jag söker...' },
          { id: 'ks2-q2', text: 'Varför är du intresserad av just detta företag?', placeholder: 'Jag är intresserad av ert företag för att...' },
          { id: 'ks2-q3', text: 'Vad kan du erbjuda dem? (Ditt värdeerbjudande)', placeholder: 'Jag kan bidra med...' },
          { id: 'ks2-q4', text: 'Skriv ett utkast till ett mejl eller telefonmanus.', placeholder: 'Ämnesrad:... \nHej [Namn],...' }
        ]
      },
      {
        id: 3,
        title: 'Uppföljningsplan',
        description: 'Planera hur du ska följa upp dina kontakter.',
        questions: [
          { id: 'ks3-q1', text: 'När ska du följa upp om du inte fått svar?', placeholder: 'Jag ska följa upp efter...' },
          { id: 'ks3-q2', text: 'Vad ska du säga vid uppföljning?', placeholder: 'Jag tänkte höra om...' },
          { id: 'ks3-q3', text: 'Hur ska du hålla koll på dina kontakter? (Excel, anteckningar)', placeholder: 'Jag ska dokumentera i...' }
        ]
      }
    ]
  },
  {
    id: 'intervju-traning',
    title: 'Intervjuträning med STAR',
    description: 'Öva på att besvara vanliga intervjufrågor med STAR-metoden. Förbered dig på att ge konkreta, övertygande svar.',
    icon: Users,
    category: 'Jobbsökning',
    duration: '25-35 min',
    difficulty: 'Utmanande',
    steps: [
      {
        id: 1,
        title: 'Beskriv en utmaning du övervann',
        description: 'Använd STAR för att strukturera ditt svar.',
        questions: [
          { id: 'it1-q1', text: 'Situation: Vilken svår situation stod du inför?', placeholder: 'Jag arbetade på... när vi fick problem med...' },
          { id: 'it1-q2', text: 'Task: Vilken var din uppgift/roll i situationen?', placeholder: 'Min uppgift var att...' },
          { id: 'it1-q3', text: 'Action: Vilka konkreta steg tog du?', placeholder: 'Jag började med att... Sedan...' },
          { id: 'it1-q4', text: 'Result: Vad blev resultatet? (Använd gärna siffror)', placeholder: 'Resultatet blev att...' }
        ]
      },
      {
        id: 2,
        title: 'Beskriv ett samarbete',
        description: 'Ge ett exempel på när du samarbetade framgångsrikt.',
        questions: [
          { id: 'it2-q1', text: 'Situation: Beskriv ett projekt där du samarbetade med andra.', placeholder: 'Vi arbetade med...' },
          { id: 'it2-q2', text: 'Task: Vilken var din roll i teamet?', placeholder: 'Jag ansvarade för...' },
          { id: 'it2-q3', text: 'Action: Hur bidrog du till teamets framgång?', placeholder: 'Jag hjälpte teamet genom att...' },
          { id: 'it2-q4', text: 'Result: Vad uppnådde teamet tack vare samarbetet?', placeholder: 'Tillsammans lyckades vi...' }
        ]
      },
      {
        id: 3,
        title: 'Hantera konflikter och kritik',
        description: 'Beskriv hur du hanterat svåra situationer.',
        questions: [
          { id: 'it3-q1', text: 'Situation: Beskriv en konflikt eller ett tillfälle då du fick kritik.', placeholder: 'Det var när...' },
          { id: 'it3-q2', text: 'Task: Vad behövde du hantera?', placeholder: 'Jag behövde...' },
          { id: 'it3-q3', text: 'Action: Hur hanterade du situationen?', placeholder: 'Jag valde att...' },
          { id: 'it3-q4', text: 'Result: Vad lärde du dig? Hur slutade det?', placeholder: 'Jag lärde mig att...' }
        ]
      }
    ]
  },
  {
    id: 'cv-masterclass',
    title: 'Bygg ett CV som sticker ut',
    description: 'Skapa ett professionellt CV som lyfter dina styrkor, anpassas för ATS-system och fångar rekryterarens intresse på 6 sekunder.',
    icon: Award,
    category: 'Jobbsökning',
    duration: '30-40 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Struktur och layout',
        description: 'Skapa en tydlig struktur som är lätt att scanna.',
        questions: [
          { id: 'cv1-q1', text: 'Vilken är din professionella titel? (Den roll du söker eller har)', placeholder: 'T.ex. Erfaren kundtjänstmedarbetare...' },
          { id: 'cv1-q2', text: 'Skriv en kort sammanfattning (max 3 meningar) som beskriver vem du är och vad du erbjuder.', placeholder: 'Resultatorienterad säljare med 5 års erfarenhet av...' },
          { id: 'cv1-q3', text: 'Vilka är dina 5-8 viktigaste kompetenser? (Använd nyckelord från annonser i din bransch)', placeholder: '1. Projektledning\n2. Kundrelationer...' }
        ]
      },
      {
        id: 2,
        title: 'Arbetslivserfarenhet',
        description: 'Beskriv dina tidigare roller med fokus på resultat.',
        questions: [
          { id: 'cv2-q1', text: 'Lista dina senaste 3 anställningar. För varje: Titel, företag, period.', placeholder: 'Säljare, Företag AB, 2020-2023' },
          { id: 'cv2-q2', text: 'För den senaste rollen: Vilka var dina huvudsakliga arbetsuppgifter? (3-5 punkter)', placeholder: '• Ansvarade för...\n• Hanterade...' },
          { id: 'cv2-q3', text: 'Vilka konkreta resultat uppnådde du? Använd siffror när det är möjligt (% ökning, antal, besparingar)', placeholder: '• Ökade försäljningen med 25%\n• Hanterade 50+ kundärenden dagligen' },
          { id: 'cv2-q4', text: 'Vilka branschspecifika nyckelord bör finnas med för att passera ATS-filter?', placeholder: 'Jag ska inkludera: Salesforce, B2B-försäljning, KPI...' }
        ]
      },
      {
        id: 3,
        title: 'Utbildning och övrigt',
        description: 'Komplettera med utbildning, certifikat och volontärarbete.',
        questions: [
          { id: 'cv3-q1', text: 'Lista din utbildning (högst relevant först).', placeholder: 'Yrkeshögskola, Digital Marknadsföring, 2019-2021' },
          { id: 'cv3-q2', text: 'Har du några certifikat, licenser eller pågående kurser?', placeholder: 'Google Analytics-certifiering, 2023' },
          { id: 'cv3-q3', text: 'Vad gör du på fritiden som är relevant? (Språk, ideellt arbete, hobbyprojekt)', placeholder: 'Volontärarbete på...', },
          { id: 'cv3-q4', text: 'Vad behöver du justera eller lägga till för att matcha ett specifikt jobb du söker?', placeholder: 'För rollen på [Företag] behöver jag lyfta...' }
        ]
      }
    ]
  },
  {
    id: 'personligt-varumarke',
    title: 'Ditt personliga varumärke',
    description: 'Definiera vad du vill vara känd för och skapa en genomgående röd tråd i all din kommunikation.',
    icon: Megaphone,
    category: 'Digital närvaro',
    duration: '25-35 min',
    difficulty: 'Utmanande',
    steps: [
      {
        id: 1,
        title: 'Hitta din unika vinkel',
        description: 'Vad skiljer dig från andra med liknande bakgrund?',
        questions: [
          { id: 'pv1-q1', text: 'Vad är den röda tråden genom din karriär? Vad har alla dina val gemensamt?', placeholder: 'Genom alla mina roller har jag alltid...' },
          { id: 'pv1-q2', text: 'Vilken kombination av kompetenser är unik för dig?', placeholder: 'Jag kombinerar teknisk kunskap med...' },
          { id: 'pv1-q3', text: 'Om tre kollegor skulle beskriva dig med ett ord - vad skulle de säga?', placeholder: 'De skulle säga att jag är...' }
        ]
      },
      {
        id: 2,
        title: 'Din berättelse',
        description: 'Skapa en personlig historia som engagerar.',
        questions: [
          { id: 'pv2-q1', text: 'Vad fick dig att välja din yrkesväg? Berätta om ett ögonblick eller en inspiration.', placeholder: 'Det började när jag...' },
          { id: 'pv2-q2', text: 'Vad brinner du för i ditt arbete?', placeholder: 'Det jag älskar mest är när...' },
          { id: 'pv2-q3', text: 'Vad vill du att folk ska komma ihåg efter att ha träffat dig?', placeholder: 'Jag vill att de ska minnas att jag...' }
        ]
      },
      {
        id: 3,
        title: 'Synlighet och konsekvens',
        description: 'Förankra ditt varumärke i all kommunikation.',
        questions: [
          { id: 'pv3-q1', text: 'Skriv en "elevator pitch" (30 sekunder) som sammanfattar vem du är.', placeholder: 'Hej, jag heter... Jag hjälper företag att...' },
          { id: 'pv3-q2', text: 'Hur kan du kommunicera ditt varumärke visuellt? (Färger, stil, bilder)', placeholder: 'Jag vill att min profil ska kännas...' },
          { id: 'pv3-q3', text: 'Var ska du vara synlig för att nå din målgrupp? (LinkedIn, branschevent, Instagram)', placeholder: 'Jag ska fokusera på...' }
        ]
      }
    ]
  },
  {
    id: 'hantera-avslag',
    title: 'Hantera avslag och motgångar',
    description: 'Utveckla mental styrka och strategier för att hantera avslag och behålla motivationen i jobbsökningen.',
    icon: Shield,
    category: 'Välmående',
    duration: '20-25 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Omvärdera avslag',
        description: 'Ändra ditt perspektiv på vad avslag betyder.',
        questions: [
          { id: 'ha1-q1', text: 'Hur ser du på avslag idag? Vilka känslor väcker det?', placeholder: 'När jag får avslag känner jag...' },
          { id: 'ha1-q2', text: 'Kan du se avslag som ett steg närmare ja? Varför är det inte personligt?', placeholder: 'Ett avslag betyder egentligen att...' },
          { id: 'ha1-q3', text: 'Vad kan du lära dig av ett avslag? Vilken information kan du be om?', placeholder: 'Jag kan fråga rekryteraren om...' }
        ]
      },
      {
        id: 2,
        title: 'Bygg motståndskraft',
        description: 'Skapa strategier för att återhämta dig snabbt.',
        questions: [
          { id: 'ha2-q1', text: 'Vilka aktiviteter hjälper dig att må bättre efter ett bakslag?', placeholder: 'Jag mår bättre när jag...' },
          { id: 'ha2-q2', text: 'Vem kan du prata med när det känns tufft? Hur kan de stötta dig?', placeholder: 'Jag kan ringa [namn] som...' },
          { id: 'ha2-q3', text: 'Skriv en påminnelse till dig själv om vad du är bra på.', placeholder: 'Kom ihåg att jag är duktig på...' }
        ]
      },
      {
        id: 3,
        title: 'Nästa steg efter avslag',
        description: 'Gör avslag till en möjlighet.',
        questions: [
          { id: 'ha3-q1', text: 'Hur ska du hantera ett avslag praktiskt? (Svara artigt, be om feedback)', placeholder: 'Jag ska alltid svara...' },
          { id: 'ha3-q2', text: 'Vad kan du göra för att förbättra chanserna till nästa ansökan?', placeholder: 'Till nästa gång ska jag...' },
          { id: 'ha3-q3', text: 'Sätt upp ett belöningssystem för dig själv - inte bara för resultat, utan för ansträngning.', placeholder: 'När jag skickat 5 ansökningar ska jag...' }
        ]
      }
    ]
  },
  {
    id: 'forsta-dagen',
    title: 'Förberedelser inför första dagen',
    description: 'Säkerställ en smidig start på nya jobbet genom att förbereda dig praktiskt och mentalt.',
    icon: Smile,
    category: 'Karriärutveckling',
    duration: '20-30 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Praktiska förberedelser',
        description: 'Få ordning på logistiken innan första dagen.',
        questions: [
          { id: 'fd1-q1', text: 'Hur tar du dig till jobbet? Testa resvägen i förväg.', placeholder: 'Jag ska åka... Det tar ungefär...' },
          { id: 'fd1-q2', text: 'Vad ska du ha på dig? Är det formellt, business casual eller casual?', placeholder: 'Jag har förstått att klädseln är...' },
          { id: 'fd1-q3', text: 'Vad behöver du ta med? (ID, lunch, anteckningsblock, pennor)', placeholder: 'Jag ska packa...' },
          { id: 'fd1-q4', text: 'Vem ska du anmäla dig till vid ankomst?', placeholder: 'Jag ska fråga efter...' }
        ]
      },
      {
        id: 2,
        title: 'Mentalt förberedd',
        description: 'Gå in med rätt inställning.',
        questions: [
          { id: 'fd2-q1', text: 'Vad vill du lära dig den första veckan?', placeholder: 'Jag vill förstå...' },
          { id: 'fd2-q2', text: 'Vilka frågor är det OK att ställa? (Rutiner, förväntningar, kollegor)', placeholder: 'Jag ska fråga om...' },
          { id: 'fd2-q3', text: 'Hur kan du göra ett gott första intryck?', placeholder: 'Jag ska vara...' }
        ]
      },
      {
        id: 3,
        title: 'De första 90 dagarna',
        description: 'Planera din introduktion och etablering.',
        questions: [
          { id: 'fd3-q1', text: 'Vem är de viktigaste personerna att bygga relation med?', placeholder: 'Jag ska prioritera att lära känna...' },
          { id: 'fd3-q2', text: 'Vilka mål ska du uppnå de första 30/60/90 dagarna?', placeholder: 'Dag 30:... Dag 60:... Dag 90:...' },
          { id: 'fd3-q3', text: 'När ska du be om feedback på hur du presterar?', placeholder: 'Jag ska be om ett möte efter...' }
        ]
      }
    ]
  },
  {
    id: 'motivationsboost',
    title: 'Motivationsboost för jobbsökaren',
    description: 'Fyll på energidepåerna och hitta tillbaka till motivationen när jobbsökningen känns tung.',
    icon: Zap,
    category: 'Välmående',
    duration: '15-20 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Påminn dig om dina framgångar',
        description: 'Se tillbaka på vad du redan åstadkommit.',
        questions: [
          { id: 'mb1-q1', text: 'Lista 5 saker du är stolt över i din karriär eller utbildning.', placeholder: '1. Jag tog examen i...\n2. Jag fick jobbet som...' },
          { id: 'mb1-q2', text: 'Vilka utmaningar har du redan övervunnit?', placeholder: 'Jag har klarat av...' },
          { id: 'mb1-q3', text: 'Vad har du lärt dig om dig själv under denna jobbsökningsperiod?', placeholder: 'Jag har upptäckt att jag...' }
        ]
      },
      {
        id: 2,
        title: 'Visualisera framtiden',
        description: 'Skapa en tydlig bild av vad du strävar mot.',
        questions: [
          { id: 'mb2-q1', text: 'Hur kommer det att kännas när du får det där samtalet om jobbet?', placeholder: 'Jag kommer att känna...' },
          { id: 'mb2-q2', text: 'Beskriv din första dag på det nya jobbet.', placeholder: 'Jag vaknar och...' },
          { id: 'mb2-q3', text: 'Vad kommer du att säga till dig själv när du ser tillbaka på denna period?', placeholder: 'Jag är så glad att jag...' }
        ]
      },
      {
        id: 3,
        title: 'Dagens handling',
        description: 'Gör en sak idag som tar dig närmare målet.',
        questions: [
          { id: 'mb3-q1', text: 'Vad är en sak du kan göra idag, även om du har låg energi?', placeholder: 'Idag ska jag bara...' },
          { id: 'mb3-q2', text: 'Vem kan du kontakta för att bryta isoleringen?', placeholder: 'Jag ska höra av mig till...' },
          { id: 'mb3-q3', text: 'Skriv ett peppande meddelande till dig själv.', placeholder: 'Hej du, kom ihåg att...' }
        ]
      }
    ]
  },
  {
    id: 'karriarskifte',
    title: 'Planera ett karriärskifte',
    description: 'Funderar du på att byta bransch eller roll? Skapa en strategisk plan för en lyckad övergång.',
    icon: TrendingUp,
    category: 'Karriärutveckling',
    duration: '30-40 min',
    difficulty: 'Utmanande',
    steps: [
      {
        id: 1,
        title: 'Definiera övergången',
        description: 'Bli tydlig med vad du vill förändra och varför.',
        questions: [
          { id: 'ks1-q1', text: 'Vad vill du förändra? (Bransch, roll, arbetsmiljö, något annat?)', placeholder: 'Jag vill byta från... till...' },
          { id: 'ks1-q2', text: 'Varför är detta viktigt för dig? Vad driver dig?', placeholder: 'Det viktigaste är att...' },
          { id: 'ks1-q3', text: 'Vad är du villig att offra eller investera för detta?', placeholder: 'Jag kan tänka mig att...' }
        ]
      },
      {
        id: 2,
        title: 'Överförbara kompetenser',
        description: 'Identifiera vad du redan har som är värdefullt i den nya rollen.',
        questions: [
          { id: 'ks2-q1', text: 'Vilka av dina nuvarande kompetenser är överförbara till den nya branschen/rollen?', placeholder: 'Jag kan ta med mig...' },
          { id: 'ks2-q2', text: 'Vad behöver du lära dig eller komplettera?', placeholder: 'Jag behöver skaffa...' },
          { id: 'ks2-q3', text: 'Hur kan du få erfarenhet i den nya rollen innan du byter? (Volontärarbete, sidoprojekt, praktik)', placeholder: 'Jag skulle kunna...' }
        ]
      },
      {
        id: 3,
        title: 'Övergångsstrategi',
        description: 'Planera stegen för att komma från A till B.',
        questions: [
          { id: 'ks3-q1', text: 'Ska du byta direkt eller stegvis? Beskriv din strategi.', placeholder: 'Jag planerar att...' },
          { id: 'ks3-q2', text: 'Vem kan du lära av som redan gjort denna övergång?', placeholder: 'Jag ska kontakta...' },
          { id: 'ks3-q3', text: 'Vad är din plan B om det tar längre tid än väntat?', placeholder: 'Om det inte går som planerat...' }
        ]
      }
    ]
  },
  {
    id: 'vidareutbildning',
    title: 'Planera vidareutbildning',
    description: 'Avgör om du behöver kompetensutveckla dig och hitta rätt utbildningsväg för dina karriärmål.',
    icon: GraduationCap,
    category: 'Karriärutveckling',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Kompetensgap-analys',
        description: 'Identifiera vilken kompetens du behöver skaffa.',
        questions: [
          { id: 'vu1-q1', text: 'Vilka krav ställs på rollerna du söker?', placeholder: 'De flesta jobb jag söker kräver...' },
          { id: 'vu1-q2', text: 'Vad saknar du jämfört med de kraven?', placeholder: 'Jag har inte...' },
          { id: 'vu1-q3', text: 'Är det formell utbildning som krävs, eller kan du lära dig på annat sätt?', placeholder: 'Jag tror jag kan...' }
        ]
      },
      {
        id: 2,
        title: 'Utbildningsalternativ',
        description: 'Utforska olika sätt att lära sig.',
        questions: [
          { id: 'vu2-q1', text: 'Vilka utbildningsalternativ finns? (Universitet, YH, kurser, online, självlärning)', placeholder: 'Jag har hittat...' },
          { id: 'vu2-q2', text: 'Vad kostar olika alternativ? Vilka finansieringsmöjligheter finns?', placeholder: 'Kostnaden är... Jag skulle kunna söka...' },
          { id: 'vu2-q3', text: 'Hur lång tid tar olika alternativ? Passar det med ditt liv?', placeholder: 'Jag har tid att...' }
        ]
      },
      {
        id: 3,
        title: 'Handlingsplan för lärande',
        description: 'Gör en konkret plan för din utveckling.',
        questions: [
          { id: 'vu3-q1', text: 'Vilket alternativ väljer du? Varför?', placeholder: 'Jag väljer... för att...' },
          { id: 'vu3-q2', text: 'När ska du börja? Sätt ett konkret datum.', placeholder: 'Jag ska börja...' },
          { id: 'vu3-q3', text: 'Hur ska du få tiden att räcka till? Planera din studiesituation.', placeholder: 'Jag ska lägga... timmar per vecka...' }
        ]
      }
    ]
  },
  {
    id: 'tidsplanering',
    title: 'Strukturera din jobbsökarvecka',
    description: 'Skapa en hållbar veckostruktur som balanserar jobbsökning, återhämtning och andra åtaganden.',
    icon: Calendar,
    category: 'Välmående',
    duration: '20-25 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Din nuvarande vecka',
        description: 'Kartlägg hur du använder din tid idag.',
        questions: [
          { id: 'tp1-q1', text: 'Hur många timmar lägger du på jobbsökning just nu?', placeholder: 'Jag lägger ungefär... timmar per vecka' },
          { id: 'tp1-q2', text: 'Vilka tider på dagen har du mest energi och fokus?', placeholder: 'Jag är som piggast...' },
          { id: 'tp1-q3', text: 'Vad tar mest tid som egentligen inte behövs? (Scrolla, prokrastinera)', placeholder: 'Jag lägger för mycket tid på...' }
        ]
      },
      {
        id: 2,
        title: 'Skapa struktur',
        description: 'Bygg en veckoplan som fungerar.',
        questions: [
          { id: 'tp2-q1', text: 'Vilka dagar och tider ska du ägna åt jobbsökning? (Var realistisk)', placeholder: 'Måndag: 9-12, Onsdag: 13-15...' },
          { id: 'tp2-q2', text: 'Vilka aktiviteter ska prioriteras? (Ansökningar, nätverkande, intervjuförberedelse)', placeholder: 'Måndagar: Skicka ansökningar...' },
          { id: 'tp2-q3', text: 'När ska du ha återhämtning och annat?', placeholder: 'Jag ska ha ledigt på...' }
        ]
      },
      {
        id: 3,
        title: 'Uppföljning och justering',
        description: 'Gör planen levande.',
        questions: [
          { id: 'tp3-q1', text: 'Hur ska du hålla koll på vad du gjort? (Kalender, att-göra-lista)', placeholder: 'Jag ska använda...' },
          { id: 'tp3-q2', text: 'När ska du utvärdera och justera planen?', placeholder: 'Jag ska kolla tillbaka varje...' },
          { id: 'tp3-q3', text: 'Vad är ditt belöningssystem för att följa planen?', placeholder: 'När jag klarat veckan ska jag...' }
        ]
      }
    ]
  },
  {
    id: 'informationsintervju',
    title: 'Genomför informationsintervjuer',
    description: 'Lär dig av personer i din målbransch genom strategiska informationsintervjuer. Bygg nätverk och få insikter.',
    icon: MessageCircle,
    category: 'Nätverkande',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Hitta rätt personer',
        description: 'Identifiera vem du vill prata med.',
        questions: [
          { id: 'ii1-q1', text: 'Vem skulle du vilja lära dig av? (Roll, företag, erfarenhetsnivå)', placeholder: 'Jag vill prata med...' },
          { id: 'ii1-q2', text: 'Hur kan du hitta dessa personer? (LinkedIn, nätverk, events)', placeholder: 'Jag kan hitta dem genom...' },
          { id: 'ii1-q3', text: 'Vad kan du erbjuda i utbyte? (Tacksamhet, dela med dig av din kunskap)', placeholder: 'Jag kan erbjuda...' }
        ]
      },
      {
        id: 2,
        title: 'Förbered intervjun',
        description: 'Planera vad du ska fråga om.',
        questions: [
          { id: 'ii2-q1', text: 'Skriv ett kort, artigt förfrågan-meddelande (max 5 meningar).', placeholder: 'Hej [Namn], Jag heter... Jag skulle uppskatta...' },
          { id: 'ii2-q2', text: 'Förbered 5 frågor om yrket/branschen.', placeholder: '1. Hur ser en typisk dag ut?\n2. Vad är mest utmanande?\n3...' },
          { id: 'ii2-q3', text: 'Vad vill du att de ska komma ihåg om dig?', placeholder: 'Jag vill att de ska veta att jag...' }
        ]
      },
      {
        id: 3,
        title: 'Efter intervjun',
        description: 'Följ upp och bygg relationen.',
        questions: [
          { id: 'ii3-q1', text: 'Vad ska du skriva i ditt tack-meddelande?', placeholder: 'Tack för att du tog dig tid...' },
          { id: 'ii3-q2', text: 'Vad lärde du dig av samtalet? Vilka insikter fick du?', placeholder: 'Det viktigaste jag lärde mig var...' },
          { id: 'ii3-q3', text: 'Hur ska du hålla kontakten? (LinkedIn, uppföljning om 3 månader)', placeholder: 'Jag ska...' }
        ]
      }
    ]
  },
  {
    id: 'telefonintervju',
    title: 'Masterclass: Telefonintervju',
    description: 'Förbered dig för telefonintervjuer. Lär dig kommunicera effektivt utan kroppsspråk och skapa ett starkt intryck med din röst.',
    icon: Phone,
    category: 'Jobbsökning',
    duration: '20-30 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Förberedelse och miljö',
        description: 'Skapa optimala förutsättningar för samtalet.',
        questions: [
          { id: 'ti1-q1', text: 'Vart ska du ta samtalet? Beskriv en lugn plats utan störningar.', placeholder: 'Jag ska sitta i...' },
          { id: 'ti1-q2', text: 'Vad behöver du ha redo framför dig? (CV, jobbannons, anteckningar, kalender)', placeholder: 'Jag ska ha... inom räckhåll' },
          { id: 'ti1-q3', text: 'Vilka tekniska kontroller ska du göra i förväg? (Laddning, täckning, hörlurar)', placeholder: 'Jag ska kontrollera att...' }
        ]
      },
      {
        id: 2,
        title: 'Röst och kommunikation',
        description: 'Öva på att kommunicera tydligt och engagerat per telefon.',
        questions: [
          { id: 'ti2-q1', text: 'Hur kan du låta positiv och engagerad när de inte ser dig? (Le när du pratar, gestikulera)', placeholder: 'Jag ska komma ihåg att...' },
          { id: 'ti2-q2', text: 'Skriv ett öppningssvar på "Berätta om dig själv" som fungerar per telefon (max 1 minut).', placeholder: 'Absolut! Jag är...' },
          { id: 'ti2-q3', text: 'Hur hanterar du det om du tappar tråden eller missar en fråga?', placeholder: 'Om jag inte hör ska jag säga...' }
        ]
      },
      {
        id: 3,
        title: 'Vanliga frågor och avslut',
        description: 'Förbered svar på typiska telefonintervjufrågor.',
        questions: [
          { id: 'ti3-q1', text: 'Varför söker du detta jobb? Förbered ett kortfattat svar.', placeholder: 'Jag söker detta jobb för att...' },
          { id: 'ti3-q2', text: 'Vad har du för löneanspråk? (Förbered ett svar även om du vill undvika det)', placeholder: 'Jag ligger på... / Jag vill veta mer om...' },
          { id: 'ti3-q3', text: 'Vilka frågor ska du ställa? Vilken information behöver du?', placeholder: 'Jag vill veta mer om...' },
          { id: 'ti3-q4', text: 'Hur avslutar du samtalet på ett professionellt sätt?', placeholder: 'Tack för samtalet, jag ser fram emot...' }
        ]
      }
    ]
  },
  {
    id: 'gruppinervju',
    title: 'Hantera gruppinervjuer',
    description: 'Strategier för att sticka ut i en gruppinervju där du tävlar mot andra kandidater samtidigt.',
    icon: UserPlus,
    category: 'Jobbsökning',
    duration: '25-35 min',
    difficulty: 'Utmanande',
    steps: [
      {
        id: 1,
        title: 'Förstå gruppdynamiken',
        description: 'Analysera hur gruppinervjuer fungerar.',
        questions: [
          { id: 'gi1-q1', text: 'Vad är syftet med en gruppinervju ur arbetsgivarens perspektiv?', placeholder: 'De vill se hur jag...' },
          { id: 'gi1-q2', text: 'Vilka beteenden premieras i grupp? (Samarbete, initiativ, lyhördhet)', placeholder: 'Jag ska visa att jag kan...' },
          { id: 'gi1-q3', text: 'Vilka fallgropar ska du undvika? (Dominera, vara för tyst, konkurrera öppet)', placeholder: 'Jag ska undvika att...' }
        ]
      },
      {
        id: 2,
        title: 'Balansera synlighet och samarbete',
        description: 'Hitta rätt nivå av engagemang.',
        questions: [
          { id: 'gi2-q1', text: 'Hur kan du bidra utan att ta över? Formulera 3 strategier.', placeholder: '1. Jag kan bygga vidare på andras idéer...' },
          { id: 'gi2-q2', text: 'Hur inkluderar du tystare deltagare i diskussionen?', placeholder: 'Jag kan säga något i stil med...' },
          { id: 'gi2-q3', text: 'Hur hanterar du det om någon dominerar samtalet?', placeholder: 'Om någon tar för mycket plats...' },
          { id: 'gi2-q4', text: 'Vad kan du säga för att sammanfatta gruppens diskussion?', placeholder: 'Om jag får sammanfatta: Vi verkar vara överens om...' }
        ]
      },
      {
        id: 3,
        title: 'Praktisk övning',
        description: 'Förbered dig för vanliga gruppinervjuövningar.',
        questions: [
          { id: 'gi3-q1', text: 'Hur skulle du introducera dig själv på 30 sekunder i en grupp?', placeholder: 'Hej alla, jag heter... och jag...' },
          { id: 'gi3-q2', text: 'Öva på case: "Prioritera bland 5 uppgifter med begränsad tid." Hur skulle du angripa det?', placeholder: 'Jag skulle föreslå att vi först...' },
          { id: 'gi3-q3', text: 'Vad ska du tänka på för att vara den de kommer ihåg positivt efteråt?', placeholder: 'Jag vill att de ska minnas mig som...' }
        ]
      }
    ]
  },
  {
    id: 'prestationsangest',
    title: 'Hantera nervositet och prestationsångest',
    description: 'Konkreta tekniker för att hantera nervositet inför intervjuer och prestationer. Gå in med självförtroende.',
    icon: AlertCircle,
    category: 'Välmående',
    duration: '20-25 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Förstå din nervositet',
        description: 'Bli medveten om vad som triggar din ångest.',
        questions: [
          { id: 'pa1-q1', text: 'När känner du dig mest nervös? (Dagen innan, på platsen, under intervjun)', placeholder: 'Det värsta är när...' },
          { id: 'pa1-q2', text: 'Vilka kroppsliga signaler får du? (Hjärtklappning, svettningar, torr mun)', placeholder: 'Jag märker att jag...' },
          { id: 'pa1-q3', text: 'Vad tänker du i dessa stunder? ("Jag kommer misslyckas", "De kommer genomskåda mig")', placeholder: 'Jag tänker att...' }
        ]
      },
      {
        id: 2,
        title: 'Andnings- och avslappningstekniker',
        description: 'Lär dig tekniker för att lugna kroppen och sinnet.',
        questions: [
          { id: 'pa2-q1', text: 'Öva på 4-7-8-andning: Andas in 4 sek, håll 7 sek, andas ut 8 sek. Hur känns det?', placeholder: 'När jag provade kände jag...' },
          { id: 'pa2-q2', text: 'Progressiv avslappning: Spänn och slappna av olika muskelgrupper. Vilken hjälper dig mest?', placeholder: 'Att spänna och slappna av... hjälpte mest' },
          { id: 'pa2-q3', text: 'Vad kan du göra 5 minuter innan intervjun för att lugna dig?', placeholder: 'Precis innan ska jag...' }
        ]
      },
      {
        id: 3,
        title: 'Mentala strategier',
        description: 'Bygg mental styrka och omforma tankarna.',
        questions: [
          { id: 'pa3-q1', text: 'Omformulera din nervositet: "Jag är inte nervös, jag är..." (engagerad, taggad, redo)', placeholder: 'Jag är inte nervös, jag är...' },
          { id: 'pa3-q2', text: 'Visualisering: Beskriv hur du ser dig själv gå in med självförtroende och göra ett bra intryck.', placeholder: 'Jag ser mig själv...' },
          { id: 'pa3-q3', text: 'Förbered en "nervositetspåse" - vad ska du ha med dig? (Vatten, anteckningar, lucky charm)', placeholder: 'Jag ska ha med mig...' },
          { id: 'pa3-q4', text: 'Skriv ett mantra eller en påminnelse du kan säga till dig själv.', placeholder: 'Jag kan påminna mig om att...' }
        ]
      }
    ]
  },
  {
    id: 'anstallningsformer',
    title: 'Förstå olika anställningsformer',
    description: 'Lär dig skillnaden mellan tillsvidare, visstid, projektanställning, bemanning och konsultuppdrag. Välj rätt för dig.',
    icon: FileBadge,
    category: 'Arbetsrätt',
    duration: '20-30 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Kartlägg anställningsformer',
        description: 'Lär dig om olika typer av anställningar.',
        questions: [
          { id: 'af1-q1', text: 'Vad är skillnaden mellan tillsvidareanställning och visstidsanställning? När passar var och en?', placeholder: 'Tillsvidare passar när... Visstid när...' },
          { id: 'af1-q2', text: 'Vad innebär det att vara konsult eller inhyrd via bemanningsföretag?', placeholder: 'Som konsult är skillnaden att...' },
          { id: 'af1-q3', text: 'Vad är en projektanställning? Vilka är för- och nackdelarna?', placeholder: 'Projektanställning innebär att...' }
        ]
      },
      {
        id: 2,
        title: 'Rättigheter och trygghet',
        description: 'Förstå vad olika former innebär för din trygghet.',
        questions: [
          { id: 'af2-q1', text: 'Vilken anställningsform ger mest trygghet? Vilken ger mest flexibilitet?', placeholder: 'Mest trygghet:... Mest flexibilitet:...' },
          { id: 'af2-q2', text: 'Vad innebär LAS (Lagen om anställningsskydd) för dig i olika former?', placeholder: 'LAS innebär att...' },
          { id: 'af2-q3', text: 'Vad är viktigt att tänka på när du skriver på ett tidsbegränsat kontrakt?', placeholder: 'Jag ska kontrollera att...' }
        ]
      },
      {
        id: 3,
        title: 'Vad passar dig?',
        description: 'Avgör vilken anställningsform som passar din situation.',
        questions: [
          { id: 'af3-q1', text: 'Vad prioriterar du just nu? (Trygghet, flexibilitet, variation, hög lön)', placeholder: 'Just nu är viktigast att...' },
          { id: 'af3-q2', text: 'Vilka risker är du villig att ta? Vilka vill du undvika?', placeholder: 'Jag kan acceptera... men inte...' },
          { id: 'af3-q3', text: 'Kan en kombination fungera? (T.ex. deltidsanställning + frilans)', placeholder: 'Jag skulle kunna tänka mig...' }
        ]
      }
    ]
  },
  {
    id: 'digital-kompetens',
    title: 'Kartlägg din digitala kompetens',
    description: 'Identifiera vilka digitala verktyg och färdigheter du har, och vilka du behöver utveckla för dagens arbetsmarknad.',
    icon: Monitor,
    category: 'Självkännedom',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Digital självskattning',
        description: 'Utvärdera dina nuvarande digitala färdigheter.',
        questions: [
          { id: 'dk1-q1', text: 'Grundläggande digital kompetens: Vilka program hanterar du bra? (Word, Excel, PowerPoint)', placeholder: 'Jag är bekväm med...' },
          { id: 'dk1-q2', text: 'Kommunikationsverktyg: Vilka plattformar har du erfarenhet av? (Teams, Zoom, Slack, Meet)', placeholder: 'Jag har använt...' },
          { id: 'dk1-q3', text: 'Molntjänster: Har du erfarenhet av att arbeta i molnet? (Google Drive, Dropbox, OneDrive, SharePoint)', placeholder: 'Jag har arbetat med...' }
        ]
      },
      {
        id: 2,
        title: 'Branschspecifika verktyg',
        description: 'Identifiera specialiserade verktyg i din bransch.',
        questions: [
          { id: 'dk2-q1', text: 'Vilka branschspecifika system eller program används i din målbransch?', placeholder: 'Inom [bransch] används ofta...' },
          { id: 'dk2-q2', text: 'Vilka av dessa kan du redan? Vilka behöver du lära dig?', placeholder: 'Jag kan:... Jag behöver lära mig:...' },
          { id: 'dk2-q3', text: 'Finns det AI-verktyg som blir vanliga i din bransch? (ChatGPT, Midjourney, specifika verktyg)', placeholder: 'Jag har hört talas om...' }
        ]
      },
      {
        id: 3,
        title: 'Digital utvecklingsplan',
        description: 'Skapa en plan för att stärka din digitala kompetens.',
        questions: [
          { id: 'dk3-q1', text: 'Vilka 3 digitala färdigheter skulle göra dig mest attraktiv på arbetsmarknaden?', placeholder: '1. Att bli bättre på...\n2. Att lära mig...\n3. Att förstå...' },
          { id: 'dk3-q2', text: 'Hur kan du lära dig detta? (Onlinekurser, YouTube, praktik, komvux)', placeholder: 'Jag ska gå en kurs på...' },
          { id: 'dk3-q3', text: 'Hur kan du visa upp dina digitala färdigheter i CV eller intervju?', placeholder: 'Jag kan nämna att jag...' }
        ]
      }
    ]
  },
  {
    id: 'aterintrade',
    title: 'Återinträde efter lång frånvaro',
    description: 'Strategier för att komma tillbaka till arbetslivet efter sjukskrivning, föräldraledighet, arbetslöshet eller studier.',
    icon: RefreshCw,
    category: 'Karriärutveckling',
    duration: '30-40 min',
    difficulty: 'Utmanande',
    steps: [
      {
        id: 1,
        title: 'Bearbeta frånvaron',
        description: 'Hantera frågan om din frånvaro på ett konstruktivt sätt.',
        questions: [
          { id: 'ai1-q1', text: 'Hur ska du förklara din frånvaro kortfattat och positivt? (Utan ursäkter, utan för mycket info)', placeholder: 'Jag har varit [sjukskriven/föräldraledig] och är nu redo att...' },
          { id: 'ai1-q2', text: 'Vad har du lärt dig eller utvecklat under tiden borta?', placeholder: 'Under denna tid har jag lärt mig...' },
          { id: 'ai1-q3', text: 'Hur ska du svara om de frågar om din frånvaro i en intervju?', placeholder: 'Jag ska säga att...' }
        ]
      },
      {
        id: 2,
        title: 'Uppdatera din kompetens',
        description: 'Säkerställ att dina kunskaper är aktuella.',
        questions: [
          { id: 'ai2-q1', text: 'Vad har förändrats i din bransch under din frånvaro?', placeholder: 'Jag har märkt att...' },
          { id: 'ai2-q2', text: 'Vilken kompetens behöver du uppdatera eller skaffa?', placeholder: 'Jag behöver komma ikapp med...' },
          { id: 'ai2-q3', text: 'Hur kan du visa att du är uppdaterad trots frånvaron?', placeholder: 'Jag kan nämna att jag läst...' }
        ]
      },
      {
        id: 3,
        title: 'Smidig övergång',
        description: 'Skapa en plan för att komma in i rutinerna igen.',
        questions: [
          { id: 'ai3-q1', text: 'Vilka praktiska förberedelser behöver du göra? (Sömnrutiner, barnomsorg, pendling)', placeholder: 'Jag behöver ordna...' },
          { id: 'ai3-q2', text: 'Ska du börja heltid direkt eller föredrar du att trappa upp?', placeholder: 'Jag skulle helst vilja...' },
          { id: 'ai3-q3', text: 'Vem i ditt nätverk kan stötta dig under övergången?', placeholder: 'Jag kan be [namn] om hjälp med...' }
        ]
      }
    ]
  },
  {
    id: 'samarbetsformaga',
    title: 'Demonstera samarbetsförmåga',
    description: 'Lär dig visa upp din förmåga att arbeta i team - en av de mest efterfrågade egenskaperna hos arbetsgivare.',
    icon: Users,
    category: 'Självkännedom',
    duration: '20-30 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Identifiera din samarbetsstil',
        description: 'Förstå hur du fungerar i team.',
        questions: [
          { id: 'sf1-q1', text: 'Vilken roll tar du oftast i ett team? (Ledare, idéspruta, genomförare, medlare, analytiker)', placeholder: 'Jag brukar ofta bli den som...' },
          { id: 'sf1-q2', text: 'Beskriv ett lyckat samarbete. Vad gjorde det framgångsrikt?', placeholder: 'Vi lyckades för att jag...' },
          { id: 'sf1-q3', text: 'Hur hanterar du konflikter i ett team?', placeholder: 'När det uppstår oenighet brukar jag...' }
        ]
      },
      {
        id: 2,
        title: 'Formulera samarbetsexempel',
        description: 'Förbered konkreta exempel för intervjun.',
        questions: [
          { id: 'sf2-q1', text: 'Använd STAR-metoden: Beskriv en situation där du samarbetade för att nå ett gemensamt mål.', placeholder: 'Vi hade ett projekt där...' },
          { id: 'sf2-q2', text: 'Hur har du hjälpt en kollega eller bett om hjälp när det behövdes?', placeholder: 'En gång hjälpte jag en kollega genom att...' },
          { id: 'sf2-q3', text: 'Hur har du bidragit till en positiv teamkultur?', placeholder: 'Jag bidrog till stämningen genom att...' }
        ]
      },
      {
        id: 3,
        title: 'Synliggöra i ansökan',
        description: 'Lyft samarbete i dina dokument.',
        questions: [
          { id: 'sf3-q1', text: 'Vilka ord kan du använda i CV:t för att signalera samarbetsförmåga?', placeholder: 'Jag kan använda ord som...' },
          { id: 'sf3-q2', text: 'Hur kan du visa samarbete i ditt personliga brev?', placeholder: 'Jag kan skriva att...' },
          { id: 'sf3-q3', text: 'Förbered ett svar på: "Beskriv hur du arbetar i team"', placeholder: 'Jag arbetar bäst i team när...' }
        ]
      }
    ]
  },
  {
    id: 'framtidens-yrken',
    title: 'Utforska framtidens yrken',
    description: 'Titta framåt och utforska vilka jobb som växer, vilka som försvinner, och hur du kan positionera dig för framtiden.',
    icon: Rocket,
    category: 'Karriärutveckling',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Trender på arbetsmarknaden',
        description: 'Utforska vilka förändringar som pågår.',
        questions: [
          { id: 'fy1-q1', text: 'Vilka trender ser du i din bransch? (Digitalisering, hållbarhet, automatisering)', placeholder: 'Jag ser att...' },
          { id: 'fy1-q2', text: 'Vilka yrken växer just nu? Vilka minskar?', placeholder: 'Yrken som växer är...' },
          { id: 'fy1-q3', text: 'Hur påverkas din målroll av AI och automatisering?', placeholder: 'AI kommer troligen att...' }
        ]
      },
      {
        id: 2,
        title: 'Framtidskompetenser',
        description: 'Identifiera vilka kompetenser som blir viktiga.',
        questions: [
          { id: 'fy2-q1', text: 'Vilka färdigheter kommer vara mest efterfrågade om 5 år?', placeholder: 'Jag tror att... kommer bli viktigt' },
          { id: 'fy2-q2', text: 'Vilka av dessa framtidskompetenser har du redan?', placeholder: 'Jag har redan...' },
          { id: 'fy2-q3', text: 'Vilka nya kompetenser behöver du utveckla för att vara relevant?', placeholder: 'Jag behöver lära mig...' }
        ]
      },
      {
        id: 3,
        title: 'Positionera dig för framtiden',
        description: 'Skapa en strategi för långsiktig relevans.',
        questions: [
          { id: 'fy3-q1', text: 'Vilka steg kan du ta redan i år för att vara förberedd?', placeholder: 'Jag ska börja med att...' },
          { id: 'fy3-q2', text: 'Hur kan du bygga ett nätverk som håller dig uppdaterad om trender?', placeholder: 'Jag ska följa...' },
          { id: 'fy3-q3', text: 'Är du öppen för att byta bransch eller roll om din nuvarande förändras?', placeholder: 'Jag skulle kunna tänka mig att...' }
        ]
      }
    ]
  },
  {
    id: 'problem-solving',
    title: 'Visa problemlösningsförmåga',
    description: 'Lär dig kommunicera din förmåga att identifiera problem, analysera och hitta lösningar - en nyckelkompetens på arbetsmarknaden.',
    icon: Brain,
    category: 'Självkännedom',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Identifiera ditt problem-lösningsmönster',
        description: 'Förstå hur du angriper problem.',
        questions: [
          { id: 'ps1-q1', text: 'Hur går du tillväga när du stöter på ett problem? Beskriv din process.', placeholder: 'Först brukar jag... Sedan...' },
          { id: 'ps1-q2', text: 'Föredrar du att lösa problem själv eller i grupp? När?', placeholder: 'Jag föredrar att... när...' },
          { id: 'ps1-q3', text: 'Vilken typ av problem är du särskilt bra på att lösa?', placeholder: 'Jag är bra på problem som involverar...' }
        ]
      },
      {
        id: 2,
        title: 'Samla bevis',
        description: 'Förbered konkreta exempel på dina problemlösningsfärdigheter.',
        questions: [
          { id: 'ps2-q1', text: 'Beskriv ett komplext problem du löst. Vad var utmaningen?', placeholder: 'Problemet var att...' },
          { id: 'ps2-q2', text: 'Hur identifierade du roten till problemet?', placeholder: 'Jag insåg att den egentliga orsaken var...' },
          { id: 'ps2-q3', text: 'Vilken lösning implementerade du? Vad blev resultatet?', placeholder: 'Jag beslutade att... Resultatet blev...' }
        ]
      },
      {
        id: 3,
        title: 'Kommunicera förmågan',
        description: 'Förbered hur du pratar om problemlösning.',
        questions: [
          { id: 'ps3-q1', text: 'Hur skulle du svara på: "Beskriv hur du hanterar utmaningar"?', placeholder: 'När jag möter en utmaning börjar jag med att...' },
          { id: 'ps3-q2', text: 'Vilka ord och fraser signalerar problemlösningsförmåga?', placeholder: 'Jag kan använda ord som...' },
          { id: 'ps3-q3', text: 'Förbered ett case-baserat svar för en intervju.', placeholder: 'Om de ger mig ett hypotetiskt problem ska jag...' }
        ]
      }
    ]
  },
  // ============================================
  // ARBETSLIVSKUNSKAP (Kategorier 1-10)
  // ============================================
  {
    id: 'arbetsratt-grunder',
    title: 'Arbetsrätt för arbetssökande',
    description: 'Lär dig grunderna i arbetsrätt, LAS och dina rättigheter som arbetstagare. Viktig kunskap innan du skriver på ett anställningsavtal.',
    icon: Scale,
    category: 'Arbetslivskunskap',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Lagen om anställningsskydd (LAS)',
        description: 'Förstå grunderna i LAS och vad det innebär för dig.',
        questions: [
          { id: 'ar1-q1', text: 'Vad är turordningsreglerna vid uppsägning? Varför är de viktiga?', placeholder: 'Turordningsreglerna innebär att...' },
          { id: 'ar1-q2', text: 'Vad innebär "sist in, först ut" och vilka undantag finns?', placeholder: 'Principen betyder att... Undantag kan vara...' },
          { id: 'ar1-q3', text: 'Hur lång är uppsägningstiden om du har jobbat i 6 månader? 2 år?', placeholder: 'Efter 6 månader:... Efter 2 år:...' }
        ]
      },
      {
        id: 2,
        title: 'Din arbetstid och raster',
        description: 'Lär dig om arbetstidslagstiftning och vad du har rätt till.',
        questions: [
          { id: 'ar2-q1', text: 'Hur många timmar får du maximalt arbeta per vecka enligt lag?', placeholder: 'Enligt arbetstidslagen får man arbeta max...' },
          { id: 'ar2-q2', text: 'Vilka rättigheter har du när det gäller raster och pauser?', placeholder: 'Jag har rätt till...' },
          { id: 'ar2-q3', text: 'Vad gäller för övertid? Måste du arbeta övertid när arbetsgivaren ber om det?', placeholder: 'Övertid innebär att... Jag måste/måste inte...' }
        ]
      },
      {
        id: 3,
        title: 'Semester och ledighet',
        description: 'Förstå dina rättigheter kring semester och annan ledighet.',
        questions: [
          { id: 'ar3-q1', text: 'Hur många semesterdagar har du rätt till per år?', placeholder: 'Enligt semesterlagen har man rätt till...' },
          { id: 'ar3-q2', text: 'Vad är skillnaden mellan betald och obetald semester?', placeholder: 'Betald semester innebär... Obetald innebär...' },
          { id: 'ar3-q3', text: 'Vilken annan ledighet kan du ha rätt till? (Föräldraledighet, vab, etc.)', placeholder: 'Andra typer av ledighet inkluderar...' }
        ]
      }
    ]
  },
  {
    id: 'anstallningsformer',
    title: 'Anställningsformer och avtal',
    description: 'Lär dig skillnaden mellan olika anställningsformer, vad som bör stå i ditt anställningsavtal och vad du ska tänka på innan du skriver på.',
    icon: FileBadge,
    category: 'Arbetslivskunskap',
    duration: '20-30 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Olika typer av anställningar',
        description: 'Förstå skillnaderna mellan olika anställningsformer.',
        questions: [
          { id: 'af1-q1', text: 'Vad är skillnaden mellan tillsvidareanställning och visstidsanställning?', placeholder: 'Tillsvidare innebär att... Visstid innebär att...' },
          { id: 'af1-q2', text: 'Vad är en provanställning och hur länge får den pågå?', placeholder: 'En provanställning är... Den får pågå i...' },
          { id: 'af1-q3', text: 'Vad innebär det att vara inhyrd via bemanningsföretag?', placeholder: 'Att vara inhyrd innebär att...' }
        ]
      },
      {
        id: 2,
        title: 'Ditt anställningsavtal',
        description: 'Lär dig vad som bör stå i ditt anställningsavtal.',
        questions: [
          { id: 'af2-q1', text: 'Vilka 5 saker MÅSTE stå i ett anställningsavtal enligt lag?', placeholder: '1. Anställningsform... 2. Lön... 3...' },
          { id: 'af2-q2', text: 'Vad bör du tänka på när du läser igenom ett anställningsavtal?', placeholder: 'Jag bör kontrollera...' },
          { id: 'af2-q3', text: 'Är det okej att be om att få avtalet på förhand för att läsa i lugn och ro?', placeholder: 'Ja/Nej, för att...' }
        ]
      },
      {
        id: 3,
        title: 'Viktiga frågor att ställa',
        description: 'Förbered frågor om anställningsvillkoren.',
        questions: [
          { id: 'af3-q1', text: 'Vilka 3 frågor om lön och förmåner ska du ställa?', placeholder: '1. Vilken är grundlönen? 2... 3...' },
          { id: 'af3-q2', text: 'Vilka frågor om arbetstid och flexibilitet är viktiga för dig?', placeholder: 'Jag vill veta om...' },
          { id: 'af3-q3', text: 'Vad vill du veta om uppsägningstid och villkor för avslut?', placeholder: 'Jag undrar över...' }
        ]
      }
    ]
  },
  {
    id: 'arbetsmiljo-psykosocial',
    title: 'Arbetsmiljö – fysisk och psykosocial',
    description: 'Lär dig om arbetsmiljöansvar, psykisk hälsa på jobbet och vad du kan göra om arbetsmiljön inte är bra.',
    icon: Building2,
    category: 'Arbetslivskunskap',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Fysisk arbetsmiljö',
        description: 'Förstå vad som ingår i den fysiska arbetsmiljön.',
        questions: [
          { id: 'am1-q1', text: 'Vad ingår i begreppet fysisk arbetsmiljö? Ge 5 exempel.', placeholder: '1. Belysning... 2. Ljud... 3...' },
          { id: 'am1-q2', text: 'Vad kan du göra om du upplever att din fysiska arbetsmiljö inte är bra?', placeholder: 'Jag kan...' },
          { id: 'am1-q3', text: 'Vem har ansvaret för arbetsmiljön på din arbetsplats?', placeholder: 'Ansvaret ligger på...' }
        ]
      },
      {
        id: 2,
        title: 'Psykosocial arbetsmiljö',
        description: 'Lär dig om den psykosociala arbetsmiljön och vad den innebär.',
        questions: [
          { id: 'am2-q1', text: 'Vad menas med psykosocial arbetsmiljö? Ge exempel på faktorer.', placeholder: 'Psykosocial arbetsmiljö handlar om...' },
          { id: 'am2-q2', text: 'Vilka faktorer påverkar den psykosociala arbetsmiljön negativt?', placeholder: 'Negativa faktorer inkluderar...' },
          { id: 'am2-q3', text: 'Vad kan du själv göra för att bidra till en bättre psykosocial miljö?', placeholder: 'Jag kan bidra genom att...' }
        ]
      },
      {
        id: 3,
        title: 'Arbetsmiljöproblem – vad gör du?',
        description: 'Lär dig vilka steg du kan ta om arbetsmiljön inte är bra.',
        questions: [
          { id: 'am3-q1', text: 'Vad ska du göra först om du upplever problem med arbetsmiljön?', placeholder: 'Det första steget är att...' },
          { id: 'am3-q2', text: 'Vilka kanaler finns för att få hjälp? (Skyddsombud, fack, Arbetsmiljöverket)', placeholder: 'Jag kan vända mig till...' },
          { id: 'am3-q3', text: 'Vad skyddar dig mot repressalier om du lyfter arbetsmiljöproblem?', placeholder: 'Jag är skyddad av...' }
        ]
      }
    ]
  },
  {
    id: 'arbetsmarknad-trender',
    title: 'Arbetsmarknadens struktur och trender',
    description: 'Få överblick över arbetsmarknaden, vilka branscher som växer och hur trender påverkar dina möjligheter.',
    icon: LineChart,
    category: 'Arbetslivskunskap',
    duration: '30-40 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Branscher som växer och krymper',
        description: 'Utforska vilka branscher som har goda framtidsutsikter.',
        questions: [
          { id: 'amt1-q1', text: 'Vilka 5 branscher växer mest just nu? Varför?', placeholder: '1. Vård och omsorg, för att... 2...' },
          { id: 'amt1-q2', text: 'Vilka branscher krymper eller förändras mycket?', placeholder: 'Branscher som krymper är...' },
          { id: 'amt1-q3', text: 'Hur kan du ta reda på vilka trender som påverkar din bransch?', placeholder: 'Jag kan hitta information på...' }
        ]
      },
      {
        id: 2,
        title: 'Digitalisering och automatisering',
        description: 'Förstå hur digitalisering påverkar arbetsmarknaden.',
        questions: [
          { id: 'amt2-q1', text: 'Hur påverkar AI och automatisering olika yrken?', placeholder: 'AI påverkar yrken genom att...' },
          { id: 'amt2-q2', text: 'Vilka kompetenser blir viktigare i en digital värld?', placeholder: 'Kompetenser som blir viktigare är...' },
          { id: 'amt2-q3', text: 'Hur kan du rusta dig för förändringarna?', placeholder: 'Jag kan rusta mig genom att...' }
        ]
      },
      {
        id: 3,
        title: 'Din plats på arbetsmarknaden',
        description: 'Analysera var du passar in på arbetsmarknaden.',
        questions: [
          { id: 'amt3-q1', text: 'Vilka är dina starkaste kompetenser i förhållande till dagens arbetsmarknad?', placeholder: 'Mina starkaste kompetenser är...' },
          { id: 'amt3-q2', text: 'Vilka kompetenser behöver du utveckla för att vara attraktiv framöver?', placeholder: 'Jag behöver utveckla...' },
          { id: 'amt3-q3', text: 'Hur kan du följa med i trenderna i din bransch?', placeholder: 'Jag kan hålla mig uppdaterad genom...' }
        ]
      }
    ]
  },
  {
    id: 'facklig-kunskap',
    title: 'Facklig verksamhet och kollektivavtal',
    description: 'Lär dig om fackförbund, kollektivavtal och vad facket kan hjälpa dig med i arbetslivet.',
    icon: Handshake,
    category: 'Arbetslivskunskap',
    duration: '20-30 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Vad är ett fackförbund?',
        description: 'Förstå grunderna i facklig verksamhet.',
        questions: [
          { id: 'fk1-q1', text: 'Vad gör ett fackförbund? Vilken är dess huvuduppgift?', placeholder: 'Ett fackförbund arbetar för att...' },
          { id: 'fk1-q2', text: 'Vilka fördelar kan det finnas med att vara medlem i facket?', placeholder: 'Fördelar inkluderar...' },
          { id: 'fk1-q3', text: 'Vilket fackförbund passar för ditt yrkesområde?', placeholder: 'För mitt yrke är... aktuellt' }
        ]
      },
      {
        id: 2,
        title: 'Kollektivavtal – vad innebär det?',
        description: 'Lär dig vad kollektivavtal är och vad de reglerar.',
        questions: [
          { id: 'fk2-q1', text: 'Vad är ett kollektivavtal och vem förhandlar fram det?', placeholder: 'Ett kollektivavtal är...' },
          { id: 'fk2-q2', text: 'Vad regleras vanligtvis i ett kollektivavtal? Ge 5 exempel.', placeholder: '1. Löner... 2. Arbetstider... 3...' },
          { id: 'fk2-q3', text: 'Vad är skillnaden mellan ett företag med och utan kollektivavtal?', placeholder: 'Skillnaden är att...' }
        ]
      },
      {
        id: 3,
        title: 'När kan facket hjälpa dig?',
        description: 'Förstå när det är lämpligt att kontakta ditt fackförbund.',
        questions: [
          { id: 'fk3-q1', text: 'I vilka situationer kan det vara bra att kontakta facket?', placeholder: 'Jag bör kontakta facket om...' },
          { id: 'fk3-q2', text: 'Vad kan facket hjälpa dig med om du blir uppsagd?', placeholder: 'Facket kan hjälpa mig genom att...' },
          { id: 'fk3-q3', text: 'Hur hittar du kontaktuppgifter till ditt lokala fackombud?', placeholder: 'Jag kan hitta kontaktinfo genom...' }
        ]
      }
    ]
  },
  {
    id: 'lonebildning',
    title: 'Lönebildning och förmåner',
    description: 'Förstå hur löner sätts, vad som påverkar din lön och vilka förmåner du kan förhandla om.',
    icon: Coins,
    category: 'Arbetslivskunskap',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Hur sätts löner?',
        description: 'Förstå mekanismerna bakom lönebildning.',
        questions: [
          { id: 'lb1-q1', text: 'Vilka faktorer påverkar hur din lön sätts?', placeholder: 'Faktorer som påverkar är...' },
          { id: 'lb1-q2', text: 'Vad menas med "individuell och differentierad lönesättning"?', placeholder: 'Det innebär att...' },
          { id: 'lb1-q3', text: 'Hur kan du ta reda på vad som är en rimlig lön för din roll?', placeholder: 'Jag kan undersöka det genom...' }
        ]
      },
      {
        id: 2,
        title: 'Förhandla lön',
        description: 'Lär dig strategier för löneförhandling.',
        questions: [
          { id: 'lb2-q1', text: 'När är bästa tiden att förhandla lön?', placeholder: 'Bästa tiden är...' },
          { id: 'lb2-q2', text: 'Vilka argument kan du använda för att motivera en högre lön?', placeholder: 'Jag kan argumentera med...' },
          { id: 'lb2-q3', text: 'Vad kan du göra om arbetsgivaren säger nej till löneförhöjning?', placeholder: 'Jag kan då...' }
        ]
      },
      {
        id: 3,
        title: 'Andra förmåner att förhandla om',
        description: 'Utforska vilka andra förmåner som kan vara värdefulla.',
        questions: [
          { id: 'lb3-q1', text: 'Vilka andra förmåner än lön kan vara värdefulla?', placeholder: 'Andra förmåner är t.ex...' },
          { id: 'lb3-q2', text: 'Hur väger du lön mot andra förmåner?', placeholder: 'Jag väger det genom att...' },
          { id: 'lb3-q3', text: 'Vilka förmåner är viktigast för dig personligen?', placeholder: 'För mig är det viktigast med...' }
        ]
      }
    ]
  },
  {
    id: 'kompetensutveckling-livslangt',
    title: 'Kompetensutveckling och livslångt lärande',
    description: 'Lär dig vikten av kontinuerlig kompetensutveckling och hur du håller dig anställningsbar genom hela karriären.',
    icon: Lightbulb,
    category: 'Arbetslivskunskap',
    duration: '20-30 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Varför livslångt lärande?',
        description: 'Förstå varför kontinuerlig utveckling är viktigt.',
        questions: [
          { id: 'kl1-q1', text: 'Varför är det viktigt att kontinuerligt utveckla nya kompetenser?', placeholder: 'Det är viktigt för att...' },
          { id: 'kl1-q2', text: 'Hur förändras kompetensbehovet på arbetsmarknaden över tid?', placeholder: 'Kompetensbehovet förändras genom att...' },
          { id: 'kl1-q3', text: 'Vad kan hända om man inte håller sig uppdaterad i sin bransch?', placeholder: 'Om man inte håller sig uppdaterad...' }
        ]
      },
      {
        id: 2,
        title: 'Sätt upp en utvecklingsplan',
        description: 'Skapa en struktur för din kompetensutveckling.',
        questions: [
          { id: 'kl2-q1', text: 'Vilka kompetenser vill du utveckla det närmaste året?', placeholder: 'Jag vill utveckla...' },
          { id: 'kl2-q2', text: 'Hur kan du lära dig detta? (Formell utbildning, onlinekurser, praktik)', placeholder: 'Jag kan lära mig genom...' },
          { id: 'kl2-q3', text: 'Hur mycket tid kan du avsätta för kompetensutveckling varje vecka?', placeholder: 'Jag kan avsätta... timmar/vecka' }
        ]
      },
      {
        id: 3,
        title: 'Finansiering av kompetensutveckling',
        description: 'Lär dig vilka stöd som finns för utbildning.',
        questions: [
          { id: 'kl3-q1', text: 'Vilka möjligheter finns att få utbildning betald av arbetsgivaren?', placeholder: 'Möjligheter inkluderar...' },
          { id: 'kl3-q2', text: 'Vad är kompetensutvecklingsbidrag och vem kan få det?', placeholder: 'Det är... och man kan få det om...' },
          { id: 'kl3-q3', text: 'Vilka andra finansieringsmöjligheter finns för vuxenstuderande?', placeholder: 'Andra möjligheter är...' }
        ]
      }
    ]
  },
  {
    id: 'organisationskultur',
    title: 'Organisationskultur och ledarskap',
    description: 'Lär dig läsa av olika organisationskulturer och förstå olika ledarstilar. Viktigt för att hitta rätt arbetsplats.',
    icon: Landmark,
    category: 'Arbetslivskunskap',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Förstå organisationskultur',
        description: 'Lär dig vad organisationskultur är och hur den påverkar dig.',
        questions: [
          { id: 'ok1-q1', text: 'Vad menas med organisationskultur? Ge exempel på vad som formar den.', placeholder: 'Organisationskultur är... Den formas av...' },
          { id: 'ok1-q2', text: 'Hur kan man få en känsla för en organisations kultur innan man börjar jobba där?', placeholder: 'Man kan få en känsla genom att...' },
          { id: 'ok1-q3', text: 'Varför är det viktigt att hitta en organisationskultur som passar dig?', placeholder: 'Det är viktigt för att...' }
        ]
      },
      {
        id: 2,
        title: 'Olika typer av ledarskap',
        description: 'Förstå olika ledarstilar och vad de innebär för dig.',
        questions: [
          { id: 'ok2-q1', text: 'Beskriv 3 olika ledarstilar. Vilka för- och nackdelar har de?', placeholder: '1. Auktoritärt ledarskap... 2... 3...' },
          { id: 'ok2-q2', text: 'Vilken typ av ledarskap passar dig bäst? Varför?', placeholder: 'Jag fungerar bäst under ledarskap som är...' },
          { id: 'ok2-q3', text: 'Hur kan du anpassa dig till olika ledarstilar?', placeholder: 'Jag kan anpassa mig genom att...' }
        ]
      },
      {
        id: 3,
        title: 'Hitta din plats',
        description: 'Analysera vilken typ av kultur som passar dig.',
        questions: [
          { id: 'ok3-q1', text: 'Beskriv din ideala arbetsplatskultur.', placeholder: 'Min ideala kultur skulle vara...' },
          { id: 'ok3-q2', text: 'Vilka frågor kan du ställa i en intervju för att lära känna kulturen?', placeholder: 'Jag kan fråga...' },
          { id: 'ok3-q3', text: 'Vad kan du göra om du hamnar i en kultur som inte passar dig?', placeholder: 'Jag kan...' }
        ]
      }
    ]
  },
  {
    id: 'rattigheter-skyldigheter',
    title: 'Arbetsgivarens och arbetstagarens rättigheter och skyldigheter',
    description: 'Få klarhet i vad som förväntas av båda parter i en anställning. Viktig kunskap för en god arbetsrelation.',
    icon: Gavel,
    category: 'Arbetslivskunskap',
    duration: '20-30 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Dina rättigheter som arbetstagare',
        description: 'Lär dig vilka grundläggande rättigheter du har.',
        questions: [
          { id: 'rs1-q1', text: 'Vilka är dina 5 viktigaste rättigheter som arbetstagare?', placeholder: '1. Rätt till lön... 2... 3...' },
          { id: 'rs1-q2', text: 'Vad innebär rätten till en säker arbetsmiljö?', placeholder: 'Det innebär att...' },
          { id: 'rs1-q3', text: 'Vad har du för rättigheter om du blir sjuk?', placeholder: 'Om jag blir sjuk har jag rätt till...' }
        ]
      },
      {
        id: 2,
        title: 'Dina skyldigheter som arbetstagare',
        description: 'Förstå vad som förväntas av dig.',
        questions: [
          { id: 'rs2-q1', text: 'Vilka är dina huvudsakliga skyldigheter mot din arbetsgivare?', placeholder: 'Mina skyldigheter inkluderar...' },
          { id: 'rs2-q2', text: 'Vad innebär lojalitetsplikten i praktiken?', placeholder: 'Lojalitetsplikten innebär att...' },
          { id: 'rs2-q3', text: 'Vad gäller kring sekretess och tystnadsplikt?', placeholder: 'Jag måste hålla tyst om...' }
        ]
      },
      {
        id: 3,
        title: 'Arbetsgivarens ansvar',
        description: 'Lär dig vad arbetsgivaren är skyldig att göra.',
        questions: [
          { id: 'rs3-q1', text: 'Vilka är arbetsgivarens huvudsakliga skyldigheter?', placeholder: 'Arbetsgivaren måste...' },
          { id: 'rs3-q2', text: 'Vad kan du göra om arbetsgivaren inte uppfyller sina skyldigheter?', placeholder: 'Jag kan då...' },
          { id: 'rs3-q3', text: 'Hur skapar man en god relation baserad på ömsesidig respekt?', placeholder: 'En god relation bygger på...' }
        ]
      }
    ]
  },
  {
    id: 'egenforetagande',
    title: 'Egenföretagande och entreprenörskap',
    description: 'Utforska om egenföretagande kan vara något för dig. Lär dig om för- och nackdelar samt vad som krävs.',
    icon: BriefcaseBusiness,
    category: 'Arbetslivskunskap',
    duration: '30-40 min',
    difficulty: 'Utmanande',
    steps: [
      {
        id: 1,
        title: 'Är egenföretagande rätt för dig?',
        description: 'Utvärdera om du har vad som krävs för att starta eget.',
        questions: [
          { id: 'ef1-q1', text: 'Vilka egenskaper är viktiga för en entreprenör? Hur många stämmer in på dig?', placeholder: 'Viktiga egenskaper är... Jag har...' },
          { id: 'ef1-q2', text: 'Vad skulle du vilja göra om du startade eget företag?', placeholder: 'Jag skulle vilja arbeta med...' },
          { id: 'ef1-q3', text: 'Vilka är de största riskerna med egenföretagande?', placeholder: 'Största riskerna är...' }
        ]
      },
      {
        id: 2,
        title: 'Praktiska steg att starta eget',
        description: 'Lär dig vad som krävs praktiskt för att starta företag.',
        questions: [
          { id: 'ef2-q1', text: 'Vilka olika företagsformer finns och vilken skulle passa dig?', placeholder: 'Företagsformer är... Jag skulle välja...' },
          { id: 'ef2-q2', text: 'Vilka myndigheter måste du registrera dig hos?', placeholder: 'Jag måste registrera mig hos...' },
          { id: 'ef2-q3', text: 'Vilka stöd finns för den som vill starta eget?', placeholder: 'Stöd inkluderar...' }
        ]
      },
      {
        id: 3,
        title: 'Ekonomi och planering',
        description: 'Förstå de ekonomiska aspekterna av egenföretagande.',
        questions: [
          { id: 'ef3-q1', text: 'Hur skulle du finansiera ditt företagande de första månaderna?', placeholder: 'Jag skulle finansiera det genom...' },
          { id: 'ef3-q2', text: 'Vad behöver du ha koll på när det gäller skatter och moms?', placeholder: 'Jag behöver veta...' },
          { id: 'ef3-q3', text: 'Vad är viktigast att tänka på innan du tar steget?', placeholder: 'Det viktigaste är...' }
        ]
      }
    ]
  },
  // ============================================
  // ARBETSSÖKANDE (Kategorier 11-20)
  // ============================================
  {
    id: 'cv-masterclass-2024',
    title: 'CV-masterclass: Skriv ett CV som får dig på intervju',
    description: 'Djupgående guide till CV-skrivning. Lär dig struktur, innehåll och hur du anpassar ditt CV för olika jobb.',
    icon: FileText,
    category: 'Arbetssökande',
    duration: '30-40 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'CV-struktur som fungerar',
        description: 'Lär dig den optimala strukturen för ditt CV.',
        questions: [
          { id: 'cv24-1-q1', text: 'Vilka sektioner bör finnas med i ett CV och i vilken ordning?', placeholder: '1. Kontaktuppgifter... 2. Profil... 3...' },
          { id: 'cv24-1-q2', text: 'Hur långt bör ett CV vara för någon med din erfarenhetsnivå?', placeholder: 'Ett CV bör vara... sidor' },
          { id: 'cv24-1-q3', text: 'Vad är viktigt att tänka på när det gäller design och layout?', placeholder: 'Viktigt att tänka på är...' }
        ]
      },
      {
        id: 2,
        title: 'Skriva om din erfarenhet',
        description: 'Lär dig formulera dina erfarenheter på ett säljande sätt.',
        questions: [
          { id: 'cv24-2-q1', text: 'Skriv 3 punkter om din senaste anställning som fokuserar på resultat.', placeholder: '• Ledde projekt X som ökade försäljningen med 20%...' },
          { id: 'cv24-2-q2', text: 'Hur kan du beskriva "mjuka" erfarenheter (t.ex. föräldraledighet) positivt?', placeholder: 'Jag kan formulera det som...' },
          { id: 'cv24-2-q3', text: 'Vilka kraftfulla verb kan du använda för att beskriva dina arbetsuppgifter?', placeholder: 'Kraftfulla verb är t.ex...' }
        ]
      },
      {
        id: 3,
        title: 'Anpassa för varje jobb',
        description: 'Lär dig skräddarsy ditt CV för specifika jobb.',
        questions: [
          { id: 'cv24-3-q1', text: 'Välj en jobbannons. Vilka 5 nyckelord bör du inkludera i ditt CV?', placeholder: 'Nyckelorden är...' },
          { id: 'cv24-3-q2', text: 'Hur kan du anpassa din profiltext för olika typer av jobb?', placeholder: 'Jag anpassar texten genom att...' },
          { id: 'cv24-3-q3', text: 'Gör en snabbkoll: Vilka 3 saker måste du ändra i ditt CV för detta jobb?', placeholder: 'Jag måste ändra...' }
        ]
      }
    ]
  },
  {
    id: 'jobbsokarstrategier',
    title: 'Jobbsökarstrategier och kanaler',
    description: 'Lär dig olika strategier för att hitta jobb. Gå från passivt sökande till proaktivt nätverkande.',
    icon: FileSearch,
    category: 'Arbetssökande',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Kartlägg dina kanaler',
        description: 'Identifiera var ditt drömjobb annonseras.',
        questions: [
          { id: 'js1-q1', text: 'Vilka 5 jobbsöksajter är mest relevanta för din bransch?', placeholder: '1. LinkedIn... 2. Indeed... 3...' },
          { id: 'js1-q2', text: 'Vilka företag i din region skulle du vilja jobba på?', placeholder: 'Företag jag är intresserad av är...' },
          { id: 'js1-q3', text: 'Hur kan du hitta jobb som inte annonseras öppet?', placeholder: 'Jag kan hitta dolda jobb genom...' }
        ]
      },
      {
        id: 2,
        title: 'Från passiv till aktiv',
        description: 'Utveckla en proaktiv jobbsökarstrategi.',
        questions: [
          { id: 'js2-q1', text: 'Hur kan du använda LinkedIn för att hitta jobb utan att ansöka direkt?', placeholder: 'Jag kan...' },
          { id: 'js2-q2', text: 'Skriv ett upplägg för en informationsintervju med ett företag du är intresserad av.', placeholder: 'Hej, jag heter... och skulle vilja...' },
          { id: 'js2-q3', text: 'Hur kan rekryteringsföretag och bemanningsföretag hjälpa dig?', placeholder: 'De kan hjälpa mig genom att...' }
        ]
      },
      {
        id: 3,
        title: 'Organisera ditt sökande',
        description: 'Skapa system för att hålla koll på dina ansökningar.',
        questions: [
          { id: 'js3-q1', text: 'Vilket system kan du använda för att tracka dina ansökningar?', placeholder: 'Jag kan använda...' },
          { id: 'js3-q2', text: 'Hur ofta bör du söka jobb för att ha en chans att få napp?', placeholder: 'Jag bör söka...' },
          { id: 'js3-q3', text: 'Hur följer du upp ansökningar utan att verka desperat?', placeholder: 'Jag kan följa upp genom att...' }
        ]
      }
    ]
  },
  {
    id: 'intervju-masterclass',
    title: 'Intervjumasterclass: Från nervös till säker',
    description: 'Omfattande förberedelse för anställningsintervjun. Lär dig tekniker, vanliga frågor och hur du sticker ut.',
    icon: UserCheck,
    category: 'Arbetssökande',
    duration: '35-45 min',
    difficulty: 'Utmanande',
    steps: [
      {
        id: 1,
        title: 'Förberedelser före intervjun',
        description: 'Gör din research och förbered dig mentalt.',
        questions: [
          { id: 'im1-q1', text: 'Vad ska du veta om företaget innan intervjun? Lista 5 saker.', placeholder: '1. Företagets produkter/tjänster... 2...' },
          { id: 'im1-q2', text: 'Vem ska du träffa? Vad kan du ta reda på om dem i förväg?', placeholder: 'Jag kan undersöka...' },
          { id: 'im1-q3', text: 'Vilka kläder ska du ha på dig? Hur hittar du rätt klädsel?', placeholder: 'Jag ska ha... för att passa in i kulturen' }
        ]
      },
      {
        id: 2,
        title: 'Vanliga frågor och svaren',
        description: 'Öva på de vanligaste intervjufrågorna.',
        questions: [
          { id: 'im2-q1', text: '"Berätta om dig själv" - skriv ett 1-minuters svar.', placeholder: 'Jag är en person som...' },
          { id: 'im2-q2', text: '"Vad är din största svaghet?" - formulera ett ärligt men strategiskt svar.', placeholder: 'En utmaning jag har är... men jag arbetar med det genom...' },
          { id: 'im2-q3', text: '"Varför ska vi anställa just dig?" - vad är ditt unika värdeerbjudande?', placeholder: 'Du bör anställa mig för att...' }
        ]
      },
      {
        id: 3,
        title: 'Dina frågor och avslutning',
        description: 'Förbered frågor som visar ditt engagemang.',
        questions: [
          { id: 'im3-q1', text: 'Vilka 5 frågor ska du förbereda att ställa till arbetsgivaren?', placeholder: '1. Hur ser en typisk dag ut? 2...' },
          { id: 'im3-q2', text: 'Hur hanterar du svåra frågor om tidigare konflikter eller uppsägningar?', placeholder: 'Jag ska vara ärlig men professionell genom att...' },
          { id: 'im3-q3', text: 'Vad gör du efter intervjun för att maximera dina chanser?', placeholder: 'Efter intervjun ska jag...' }
        ]
      }
    ]
  },
  {
    id: 'natverkande-proffs',
    title: 'Nätverkande och kontaktbyggande som ger resultat',
    description: 'Lär dig konsten att nätverka effektivt. Bygg relationer som leder till jobbmöjligheter.',
    icon: Network,
    category: 'Arbetssökande',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Kartlägg ditt nätverk',
        description: 'Upptäck vilka kontakter du redan har.',
        questions: [
          { id: 'np1-q1', text: 'Lista 10 personer i ditt nätverk som kan ha koppling till jobbmöjligheter.', placeholder: '1. Anna (jobbar på...) 2...' },
          { id: 'np1-q2', text: 'Vilka personer skulle du vilja lägga till i ditt nätverk?', placeholder: 'Jag skulle vilja lära känna...' },
          { id: 'np1-q3', text: 'Hur kan du återknyta kontakt med personer du tappat kontakten med?', placeholder: 'Jag kan kontakta dem genom...' }
        ]
      },
      {
        id: 2,
        title: 'Nätverka på LinkedIn',
        description: 'Använd LinkedIn strategiskt för att bygga relationer.',
        questions: [
          { id: 'np2-q1', text: 'Skriv ett personligt meddelande för att skicka med en kontaktförfrågan.', placeholder: 'Hej [namn], jag såg att vi båda...' },
          { id: 'np2-q2', text: 'Vilken typ av innehåll kan du dela för att bygga ditt varumärke?', placeholder: 'Jag kan dela...' },
          { id: 'np2-q3', text: 'Hur kan du be om hjälp utan att verka behövande?', placeholder: 'Jag kan formulera det som...' }
        ]
      },
      {
        id: 3,
        title: 'Informationsintervjuer',
        description: 'Lär dig genomföra effektiva informationsintervjuer.',
        questions: [
          { id: 'np3-q1', text: 'Skriv ett mejl där du ber om en informationsintervju.', placeholder: 'Ämne: Informationsintervju om [bransch]...' },
          { id: 'np3-q2', text: 'Vilka 5 frågor är viktiga att ställa under en informationsintervju?', placeholder: '1. Hur ser en typisk dag ut? 2...' },
          { id: 'np3-q3', text: 'Hur håller du kontakten efter intervjun?', placeholder: 'Jag kan hålla kontakten genom...' }
        ]
      }
    ]
  },
  {
    id: 'karriarplanering',
    title: 'Karriärplanering och vägledning',
    description: 'Skapa en långsiktig karriärplan och sätt mål för din yrkesmässiga utveckling.',
    icon: MapPin,
    category: 'Arbetssökande',
    duration: '30-40 min',
    difficulty: 'Utmanande',
    steps: [
      {
        id: 1,
        title: 'Din nuvarande position',
        description: 'Analysera var du är idag.',
        questions: [
          { id: 'kp1-q1', text: 'Beskriv din nuvarande situation utbildnings- och erfarenhetsmässigt.', placeholder: 'Jag har...' },
          { id: 'kp1-q2', text: 'Vad är du nöjd med i din karriär hittills?', placeholder: 'Jag är nöjd med...' },
          { id: 'kp1-q3', text: 'Vad saknar du eller vill förändra?', placeholder: 'Jag vill förändra...' }
        ]
      },
      {
        id: 2,
        title: 'Din vision',
        description: 'Definiera vart du vill komma.',
        questions: [
          { id: 'kp2-q1', text: 'Var vill du vara om 5 år? Beskriv din ideala arbetssituation.', placeholder: 'Om 5 år ser jag mig själv som...' },
          { id: 'kp2-q2', text: 'Vilka värderingar ska genomsyra ditt framtida arbetsliv?', placeholder: 'Det viktigaste för mig är...' },
          { id: 'kp2-q3', text: 'Vilka olika vägar kan leda till ditt mål?', placeholder: 'Jag kan nå dit genom att...' }
        ]
      },
      {
        id: 3,
        title: 'Handlingsplan',
        description: 'Bryt ner dina mål till konkreta steg.',
        questions: [
          { id: 'kp3-q1', text: 'Vad ska du uppnå det kommande året?', placeholder: 'Detta år ska jag...' },
          { id: 'kp3-q2', text: 'Vilka är de tre första stegen du behöver ta?', placeholder: '1. Jag ska... 2... 3...' },
          { id: 'kp3-q3', text: 'Hur ska du hålla dig ansvarig för dina mål?', placeholder: 'Jag ska hålla mig ansvarig genom...' }
        ]
      }
    ]
  },
  {
    id: 'kompetenskartlaggning',
    title: 'Kompetenskartläggning och validering',
    description: 'Identifiera alla dina kompetenser - formella och informella. Lär dig hur du kan få dem validerade.',
    icon: ClipboardList,
    category: 'Arbetssökande',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Dolda kompetenser',
        description: 'Upptäck kompetenser du kanske inte tänkt på.',
        questions: [
          { id: 'kk1-q1', text: 'Vilka kompetenser har du från tidigare jobb som du kan överföra till nya roller?', placeholder: 'Jag kan... från mitt tidigare jobb' },
          { id: 'kk1-q2', text: 'Vad har du lärt dig genom fritidsintressen och ideellt arbete?', placeholder: 'Genom mina intressen har jag lärt mig...' },
          { id: 'kk1-q3', text: 'Vilka livserfarenheter har gett dig värdefulla färdigheter?', placeholder: 'Jag har utvecklat... genom...' }
        ]
      },
      {
        id: 2,
        title: 'Dokumentera kompetenser',
        description: 'Skapa en tydlig bild av vad du kan.',
        questions: [
          { id: 'kk2-q1', text: 'Lista dina 10 starkaste kompetenser.', placeholder: '1. Kommunikation... 2... 3...' },
          { id: 'kk2-q2', text: 'Ge konkreta exempel på när du använt varje kompetens.', placeholder: 'Jag visade kommunikation när...' },
          { id: 'kk2-q3', text: 'Hur kan du bevisa dessa kompetenser för en arbetsgivare?', placeholder: 'Jag kan bevisa det genom...' }
        ]
      },
      {
        id: 3,
        title: 'Validering av kompetenser',
        description: 'Lär dig om validering och hur du kan få dina kunskaper erkända.',
        questions: [
          { id: 'kk3-q1', text: 'Vad är validering och varför kan det vara viktigt för dig?', placeholder: 'Validering innebär att...' },
          { id: 'kk3-q2', text: 'Vilka kompetenser skulle du vilja få validerade?', placeholder: 'Jag skulle vilja validera...' },
          { id: 'kk3-q3', text: 'Hur går du tillväga för att validera dina kompetenser?', placeholder: 'Jag kan kontakta...' }
        ]
      }
    ]
  },
  {
    id: 'digital-kompetens-jobb',
    title: 'Digital kompetens och jobbsökning online',
    description: 'Stärk dina digitala färdigheter och lär dig navigera i den digitala arbetsmarknaden.',
    icon: Laptop,
    category: 'Arbetssökande',
    duration: '20-30 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Digital självskattning',
        description: 'Utvärdera dina nuvarande digitala färdigheter.',
        questions: [
          { id: 'dkj1-q1', text: 'Vilka digitala verktyg behöver du kunna i din bransch?', placeholder: 'Jag behöver kunna...' },
          { id: 'dkj1-q2', text: 'Hur bekväm är du med olika digitala plattformar? (1-10)', placeholder: 'Jag skulle säga...' },
          { id: 'dkj1-q3', text: 'Vilka digitala färdigheter vill du utveckla?', placeholder: 'Jag vill bli bättre på...' }
        ]
      },
      {
        id: 2,
        title: 'Digital närvaro',
        description: 'Bygg en stark digital profil.',
        questions: [
          { id: 'dkj2-q1', text: 'Hur ser din digitala fotavtryck ut idag? Googla dig själv.', placeholder: 'När jag googlar mig själv hittar jag...' },
          { id: 'dkj2-q2', text: 'Vad kan du göra för att förbättra din synlighet online?', placeholder: 'Jag kan...' },
          { id: 'dkj2-q3', text: 'Hur kan du använda sociala medier för att hitta jobb?', placeholder: 'Jag kan använda...' }
        ]
      },
      {
        id: 3,
        title: 'Digitala jobbsökarverktyg',
        description: 'Maximera användningen av digitala verktyg.',
        questions: [
          { id: 'dkj3-q1', text: 'Vilka digitala verktyg kan hjälpa dig att organisera ditt jobbsökande?', placeholder: 'Verktyg som kan hjälpa är...' },
          { id: 'dkj3-q2', text: 'Hur kan du använda AI och automatiserade sökningar?', placeholder: 'Jag kan använda AI för att...' },
          { id: 'dkj3-q3', text: 'Vilka säkerhetsaspekter bör du tänka på när du söker jobb online?', placeholder: 'Jag bör vara försiktig med...' }
        ]
      }
    ]
  },
  {
    id: 'praktik-provanställning',
    title: 'Praktik, provanställning och instegsjobb',
    description: 'Lär dig hur du kan använda praktik och provanställning som vägar in i arbetslivet.',
    icon: UserCheck,
    category: 'Arbetssökande',
    duration: '20-30 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Typer av instegsmöjligheter',
        description: 'Förstå olika sätt att komma in på arbetsmarknaden.',
        questions: [
          { id: 'ppi1-q1', text: 'Vad är skillnaden mellan praktik, prao, provanställning och instegsjobb?', placeholder: 'Skillnaden är...' },
          { id: 'ppi1-q2', text: 'Vilka fördelar finns med att börja med en praktik eller provanställning?', placeholder: 'Fördelar är...' },
          { id: 'ppi1-q3', text: 'Vilka nackdelar bör du vara medveten om?', placeholder: 'Nackdelar kan vara...' }
        ]
      },
      {
        id: 2,
        title: 'Hitta och söka praktik',
        description: 'Strategier för att hitta praktikplatser.',
        questions: [
          { id: 'ppi2-q1', text: 'Var kan du hitta praktikplatser inom din bransch?', placeholder: 'Jag kan hitta praktik på...' },
          { id: 'ppi2-q2', text: 'Hur skriver du en ansökan om praktik?', placeholder: 'Jag ska fokusera på...' },
          { id: 'ppi2-q3', text: 'Vad vill du få ut av en praktik?', placeholder: 'Jag vill lära mig...' }
        ]
      },
      {
        id: 3,
        title: 'Från praktik till jobb',
        description: 'Maximera chansen att få anställning efter praktik.',
        questions: [
          { id: 'ppi3-q1', text: 'Hur kan du göra ett gott intryck under praktiken?', placeholder: 'Jag kan göra ett gott intryck genom att...' },
          { id: 'ppi3-q2', text: 'Vad kan du göra för att öka chansen till anställning efteråt?', placeholder: 'Jag kan...' },
          { id: 'ppi3-q3', text: 'Hur hanterar du det om det inte blir något jobb efter praktiken?', placeholder: 'Jag ska tänka på att...' }
        ]
      }
    ]
  },
  {
    id: 'a-kassa-guide',
    title: 'A-kassa och arbetslöshetsförsäkring',
    description: 'Förstå hur A-kassan fungerar, vad du behöver för att få ersättning och hur du maximerar din inkomst.',
    icon: ShieldCheck,
    category: 'Arbetssökande',
    duration: '20-30 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Grunderna i A-kassan',
        description: 'Lär dig hur A-kassan fungerar.',
        questions: [
          { id: 'ak1-q1', text: 'Vad är A-kassa och vem kan få det?', placeholder: 'A-kassa är... och man kan få det om...' },
          { id: 'ak1-q2', text: 'Vad är skillnaden mellan medlem i A-kassa och medlem i fackförbund?', placeholder: 'Skillnaden är...' },
          { id: 'ak1-q3', text: 'Hur länge måste du ha varit medlem för att få ersättning?', placeholder: 'Jag måste ha varit medlem i...' }
        ]
      },
      {
        id: 2,
        title: 'Ersättningsnivåer och villkor',
        description: 'Förstå hur mycket du kan få och vad som krävs.',
        questions: [
          { id: 'ak2-q1', text: 'Hur mycket kan du få i ersättning från A-kassan?', placeholder: 'Man kan få upp till...' },
          { id: 'ak2-q2', text: 'Vad krävs för att behålla ersättningen? (aktivitetskrav)', placeholder: 'Jag måste... för att behålla ersättningen' },
          { id: 'ak2-q3', text: 'Vad händer om du tackar nej till ett jobb eller en aktivitet?', placeholder: 'Om jag tackar nej...' }
        ]
      },
      {
        id: 3,
        title: 'Planera din ekonomi',
        description: 'Hantera ekonomin under arbetslöshet.',
        questions: [
          { id: 'ak3-q1', text: 'Hur påverkas din ekonomi av arbetslöshet?', placeholder: 'Min ekonomi påverkas genom att...' },
          { id: 'ak3-q2', text: 'Vilka andra stöd kan du söka om A-kassan inte räcker?', placeholder: 'Jag kan söka...' },
          { id: 'ak3-q3', text: 'Hur kan du förbereda dig ekonomiskt inför en eventuell arbetslöshet?', placeholder: 'Jag kan förbereda mig genom att...' }
        ]
      }
    ]
  },
  {
    id: 'arbetsformedlingen-stod',
    title: 'Arbetsförmedlingens stödinsatser och program',
    description: 'Få koll på vilka stödinsatser Arbetsförmedlingen erbjuder och hur du kan använda dem i din jobbsökning.',
    icon: Building,
    category: 'Arbetssökande',
    duration: '25-35 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Kartlägg stödinsatser',
        description: 'Lär dig vilka stödinsatser som finns tillgängliga.',
        questions: [
          { id: 'as1-q1', text: 'Vilka stödinsatser kan Arbetsförmedlingen erbjuda? Lista 5 exempel.', placeholder: '1. Stöd och matchning... 2... 3...' },
          { id: 'as1-q2', text: 'Vad är nystartsjobb och vem kan få det?', placeholder: 'Nystartsjobb är... och man kan få det om...' },
          { id: 'as1-q3', text: 'Vad är arbetsmarknadsutbildning och hur ansöker man?', placeholder: 'Det är... och man ansöker genom...' }
        ]
      },
      {
        id: 2,
        title: 'Arbeta med din handläggare',
        description: 'Maximera nyttan av din kontakt med Arbetsförmedlingen.',
        questions: [
          { id: 'as2-q1', text: 'Hur förbereder du dig inför ett möte med din handläggare?', placeholder: 'Jag förbereder mig genom att...' },
          { id: 'as2-q2', text: 'Vilka frågor bör du ställa till din handläggare?', placeholder: 'Jag ska fråga om...' },
          { id: 'as2-q3', text: 'Hur håller du dig aktiv mellan mötena?', placeholder: 'Jag kan hålla mig aktiv genom att...' }
        ]
      },
      {
        id: 3,
        title: 'Etableringsprogrammet och andra program',
        description: 'Förstå olika program för olika grupper.',
        questions: [
          { id: 'as3-q1', text: 'Vad ingår i etableringsprogrammet för nyanlända?', placeholder: 'I etableringsprogrammet ingår...' },
          { id: 'as3-q2', text: 'Vilka särskilda insatser finns för unga arbetslösa?', placeholder: 'För unga finns...' },
          { id: 'as3-q3', text: 'Hur kan du påverka vilka insatser du får?', placeholder: 'Jag kan påverka genom att...' }
        ]
      }
    ]
  },
  // ============================================
  // VÄLMÅENDE (Kategorier 21-28)
  // ============================================
  {
    id: 'stresshantering-avancerad',
    title: 'Stresshantering för arbetssökande',
    description: 'Lär dig identifiera, hantera och förebygga stress under jobbsökningsprocessen. Konkreta verktyg och strategier.',
    icon: HeartPulse,
    category: 'Välmående',
    duration: '25-35 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Identifiera din stress',
        description: 'Bli medveten om vad som stressar dig.',
        questions: [
          { id: 'sa1-q1', text: 'Vilka situationer i jobbsökningen stressar dig mest?', placeholder: 'Jag blir mest stressad av...' },
          { id: 'sa1-q2', text: 'Hur känner du av stress i kroppen?', placeholder: 'Jag känner stress genom...' },
          { id: 'sa1-q3', text: 'Vad är varningssignaler på att du har för mycket stress?', placeholder: 'Varningssignaler är...' }
        ]
      },
      {
        id: 2,
        title: 'Akuta stresshanteringsverktyg',
        description: 'Tekniker för att hantera stress i stunden.',
        questions: [
          { id: 'sa2-q1', text: 'Vilken andningsteknik kan du använda när du känner dig stressad?', placeholder: 'Jag kan använda...' },
          { id: 'sa2-q2', text: 'Hur kan du pausa och återhämta dig under en jobbsökarvecka?', placeholder: 'Jag kan pausa genom att...' },
          { id: 'sa2-q3', text: 'Vilka aktiviteter lugnar dig ner snabbt?', placeholder: 'Aktiviteter som lugnar mig är...' }
        ]
      },
      {
        id: 3,
        title: 'Långsiktig stressförebyggande',
        description: 'Bygg en hållbar livsstil som motverkar stress.',
        questions: [
          { id: 'sa3-q1', text: 'Hur kan du skapa bättre struktur på din jobbsökning?', placeholder: 'Jag kan strukturera genom...' },
          { id: 'sa3-q2', text: 'Vilka gränser behöver du sätta för att må bra?', placeholder: 'Jag behöver sätta gränser kring...' },
          { id: 'sa3-q3', text: 'Vem kan du prata med när stressen blir för mycket?', placeholder: 'Jag kan prata med...' }
        ]
      }
    ]
  },
  {
    id: 'psykisk-halsa-arbete',
    title: 'Psykisk hälsa på arbetsplatsen',
    description: 'Lär dig om psykisk hälsa i arbetslivet, hur du tar hand om dig själv och vad du kan göra om du mår dåligt.',
    icon: Brain,
    category: 'Välmående',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Förstå psykisk hälsa',
        description: 'Lär dig vad psykisk hälsa innebär.',
        questions: [
          { id: 'pha1-q1', text: 'Vad innebär det att ha god psykisk hälsa på jobbet?', placeholder: 'God psykisk hälsa innebär...' },
          { id: 'pha1-q2', text: 'Vilka faktorer på jobbet påverkar den psykiska hälsan?', placeholder: 'Faktorer som påverkar är...' },
          { id: 'pha1-q3', text: 'Vad är tecken på att den psykiska hälsan påverkas negativt?', placeholder: 'Tecken är...' }
        ]
      },
      {
        id: 2,
        title: 'Förebyggande strategier',
        description: 'Lär dig att ta hand om din psykiska hälsa.',
        questions: [
          { id: 'pha2-q1', text: 'Vad kan du göra för att stärka din psykiska hälsa?', placeholder: 'Jag kan stärka den genom...' },
          { id: 'pha2-q2', text: 'Hur viktig är sömn för din psykiska hälsa?', placeholder: 'Sömnen är viktig för...' },
          { id: 'pha2-q3', text: 'Vilka copingstrategier fungerar för dig?', placeholder: 'Strategier som fungerar är...' }
        ]
      },
      {
        id: 3,
        title: 'När det inte räcker',
        description: 'Vet när och hur du ska söka hjälp.',
        questions: [
          { id: 'pha3-q1', text: 'När bör du söka professionell hjälp för din psykiska hälsa?', placeholder: 'Jag bör söka hjälp när...' },
          { id: 'pha3-q2', text: 'Vilka instanser kan du vända dig till?', placeholder: 'Jag kan vända mig till...' },
          { id: 'pha3-q3', text: 'Hur kan du prata med din arbetsgivare om psykisk ohälsa?', placeholder: 'Jag kan formulera det som...' }
        ]
      }
    ]
  },
  {
    id: 'work-life-balance',
    title: 'Work-Life Balance – balans i livet',
    description: 'Skapa en hälsosam balans mellan arbete, jobbsökning och fritid. Prioritering och gränssättning.',
    icon: Coffee,
    category: 'Välmående',
    duration: '20-30 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Kartlägg din tid',
        description: 'Se hur du använder din tid idag.',
        questions: [
          { id: 'wlb1-q1', text: 'Hur fördelas din tid idag mellan jobbsökning, återhämtning och andra aktiviteter?', placeholder: 'Min tid fördelas som...' },
          { id: 'wlb1-q2', text: 'Vilka områden i livet får för lite tid just nu?', placeholder: 'Jag prioriterar bort...' },
          { id: 'wlb1-q3', text: 'Vad ger dig energi respektive tar energi?', placeholder: 'Energi ger mig... Energi tar...' }
        ]
      },
      {
        id: 2,
        title: 'Sätt gränser',
        description: 'Lär dig att sätta hälsosamma gränser.',
        questions: [
          { id: 'wlb2-q1', text: 'Vilka gränser behöver du sätta kring din jobbsökning?', placeholder: 'Jag behöver sätta gränser för...' },
          { id: 'wlb2-q2', text: 'Hur kan du kommunicera dina gränser till andra?', placeholder: 'Jag kan säga...' },
          { id: 'wlb2-q3', text: 'Vad kan du göra för att skydda din fritid?', placeholder: 'Jag kan skydda den genom...' }
        ]
      },
      {
        id: 3,
        title: 'Skapa hållbar balans',
        description: 'Bygg en struktur som fungerar långsiktigt.',
        questions: [
          { id: 'wlb3-q1', text: 'Hur ska en ideal vecka se ut för dig?', placeholder: 'Min idealvecka innehåller...' },
          { id: 'wlb3-q2', text: 'Vilka aktiviteter ska du prioritera för att må bra?', placeholder: 'Jag måste prioritera...' },
          { id: 'wlb3-q3', text: 'Hur kan du göra jobbsökningen till en del av livet, inte hela livet?', placeholder: 'Jag kan tänka på det som...' }
        ]
      }
    ]
  },
  {
    id: 'ergonomi-fysisk-halsa',
    title: 'Ergonomi och fysisk hälsa',
    description: 'Lär dig om ergonomi, fysisk hälsa och hur du tar hand om din kropp under jobbsökning och arbete.',
    icon: Activity,
    category: 'Välmående',
    duration: '20-30 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Ergonomi vid skrivbordet',
        description: 'Skapa en ergonomisk arbetsplats hemma.',
        questions: [
          { id: 'efh1-q1', text: 'Hur ska din skrivbordsstol vara inställd för bästa ergonomi?', placeholder: 'Stolen ska...' },
          { id: 'efh1-q2', text: 'Hur ska bildskärmen placeras?', placeholder: 'Bildskärmen ska placeras...' },
          { id: 'efh1-q3', text: 'Hur ofta bör du ta pauser från skärmen?', placeholder: 'Jag bör ta paus var...' }
        ]
      },
      {
        id: 2,
        title: 'Fysisk aktivitet',
        description: 'Integrera rörelse i din vardag.',
        questions: [
          { id: 'efh2-q1', text: 'Hur mycket motion behöver du enligt rekommendationerna?', placeholder: 'Rekommendationen är...' },
          { id: 'efh2-q2', text: 'Vilka enkla sätt kan du röra dig mer på under dagen?', placeholder: 'Jag kan röra mig mer genom att...' },
          { id: 'efh2-q3', text: 'Vilken typ av träning tycker du om och kan göra regelbundet?', placeholder: 'Jag tycker om att...' }
        ]
      },
      {
        id: 3,
        title: 'Sömn och återhämtning',
        description: 'Prioritera vila för bättre hälsa.',
        questions: [
          { id: 'efh3-q1', text: 'Hur många timmar sömn behöver du för att fungera bra?', placeholder: 'Jag behöver... timmar' },
          { id: 'efh3-q2', text: 'Vad kan du göra för att förbättra din sömnkvalitet?', placeholder: 'Jag kan förbättra den genom att...' },
          { id: 'efh3-q3', text: 'Hur skiljer du på jobbsökningstid och återhämtningstid?', placeholder: 'Jag skiljer dem genom...' }
        ]
      }
    ]
  },
  {
    id: 'socialt-stod',
    title: 'Socialt stöd och kollegiala relationer',
    description: 'Bygg och underhåll relationer som stöttar dig i ditt arbetsliv. Vikten av socialt nätverk.',
    icon: UsersRound,
    category: 'Välmående',
    duration: '20-30 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Kartlägg ditt stödnätverk',
        description: 'Se vilka som stöttar dig.',
        questions: [
          { id: 'ss1-q1', text: 'Vilka 5 personer stöttar dig mest i din situation?', placeholder: '1. Min partner... 2... 3...' },
          { id: 'ss1-q2', text: 'Vilken typ av stöd behöver du just nu?', placeholder: 'Jag behöver stöd med...' },
          { id: 'ss1-q3', text: 'Finns det personer som tar mer energi än de ger? Hur hanterar du det?', placeholder: 'Jag hanterar det genom att...' }
        ]
      },
      {
        id: 2,
        title: 'Be om hjälp',
        description: 'Lär dig att be om det stöd du behöver.',
        questions: [
          { id: 'ss2-q1', text: 'Vilken typ av hjälp skulle du behöva just nu?', placeholder: 'Jag skulle behöva hjälp med...' },
          { id: 'ss2-q2', text: 'Vem kan du be om den hjälpen?', placeholder: 'Jag kan be... om hjälp' },
          { id: 'ss2-q3', text: 'Hur kan du formulera dig när du ber om hjälp?', placeholder: 'Jag kan säga...' }
        ]
      },
      {
        id: 3,
        title: 'Bygga kollegiala relationer',
        description: 'Skapa goda relationer på jobbet.',
        questions: [
          { id: 'ss3-q1', text: 'Vad är viktigt för att bygga goda relationer med kollegor?', placeholder: 'Viktigt är att...' },
          { id: 'ss3-q2', text: 'Hur kan du bidra till en god stämning på arbetsplatsen?', placeholder: 'Jag kan bidra genom att...' },
          { id: 'ss3-q3', text: 'Vad kan du göra om du har svårt att komma överens med en kollega?', placeholder: 'Jag kan...' }
        ]
      }
    ]
  },
  {
    id: 'mobbing-krankande',
    title: 'Mobbning och kränkande särbehandling',
    description: 'Lär dig identifiera, hantera och förebygga mobbning och kränkande behandling på arbetsplatsen.',
    icon: AlertTriangle,
    category: 'Välmående',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Identifiera kränkande behandling',
        description: 'Lär dig känna igen olika former av kränkningar.',
        questions: [
          { id: 'mk1-q1', text: 'Vad är kränkande särbehandling? Ge 3 exempel.', placeholder: 'Kränkande särbehandling är... Exempel:...' },
          { id: 'mk1-q2', text: 'Vad är skillnaden mellan konflikt och mobbning?', placeholder: 'Skillnaden är att...' },
          { id: 'mk1-q3', text: 'Vilka är varningstecken på att något inte står rätt till på jobbet?', placeholder: 'Varningstecken är...' }
        ]
      },
      {
        id: 2,
        title: 'Hantera situationen',
        description: 'Strategier för att hantera kränkande behandling.',
        questions: [
          { id: 'mk2-q1', text: 'Vad kan du göra om du upplever kränkande behandling?', placeholder: 'Jag kan...' },
          { id: 'mk2-q2', text: 'Vem kan du vända dig till för att få hjälp?', placeholder: 'Jag kan vända mig till...' },
          { id: 'mk2-q3', text: 'Hur dokumenterar du vad som händer?', placeholder: 'Jag dokumenterar genom att...' }
        ]
      },
      {
        id: 3,
        title: 'Förebyggande åtgärder',
        description: 'Skapa en arbetsplats utan kränkningar.',
        questions: [
          { id: 'mk3-q1', text: 'Vad kan arbetsgivaren göra för att förebygga kränkande behandling?', placeholder: 'Arbetsgivaren kan...' },
          { id: 'mk3-q2', text: 'Vad kan du själv göra för att bidra till en god arbetsmiljö?', placeholder: 'Jag kan bidra genom att...' },
          { id: 'mk3-q3', text: 'Varför är det viktigt att agera mot mobbning även om man inte själv är drabbad?', placeholder: 'Det är viktigt för att...' }
        ]
      }
    ]
  },
  {
    id: 'hallsoframjande-arbetsplats',
    title: 'Hälsofrämjande arbetsplatser',
    description: 'Lär dig känna igen och bidra till en hälsofrämjande arbetsplats som stöttar välmående.',
    icon: Leaf,
    category: 'Välmående',
    duration: '20-30 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Kännetecken på hälsofrämjande arbetsplatser',
        description: 'Identifiera vad som gör en arbetsplats hälsosam.',
        questions: [
          { id: 'ha1-q1', text: 'Vilka 5 kännetecken har en hälsofrämjande arbetsplats?', placeholder: '1. Stödjande ledarskap... 2... 3...' },
          { id: 'ha1-q2', text: 'Hur kan du se redan vid intervjun om en arbetsplats värderar välmående?', placeholder: 'Jag kan se det genom...' },
          { id: 'ha1-q3', text: 'Vilka frågor kan du ställa för att utvärdera arbetsplatsens inställning till hälsa?', placeholder: 'Jag kan fråga om...' }
        ]
      },
      {
        id: 2,
        title: 'Friskvårdsförmåner',
        description: 'Förstå vilka förmåner som kan finnas.',
        questions: [
          { id: 'ha2-q1', text: 'Vilka friskvårdsförmåner är vanliga på arbetsplatser?', placeholder: 'Vanliga förmåner är...' },
          { id: 'ha2-q2', text: 'Hur kan du använda friskvårdsbidraget på bästa sätt?', placeholder: 'Jag kan använda det för...' },
          { id: 'ha2-q3', text: 'Vad kan du göra om din arbetsplats saknar friskvårdsförmåner?', placeholder: 'Jag kan då...' }
        ]
      },
      {
        id: 3,
        title: 'Ditt ansvar för välmående',
        description: 'Ta ansvar för din egen hälsa på jobbet.',
        questions: [
          { id: 'ha3-q1', text: 'Vad kan du göra för att må bra på jobbet, oavsett arbetsplatsens insatser?', placeholder: 'Jag kan...' },
          { id: 'ha3-q2', text: 'Hur kan du kommunicera dina behov till arbetsgivaren?', placeholder: 'Jag kan säga...' },
          { id: 'ha3-q3', text: 'Vad är viktigast för dig för att må bra på jobbet?', placeholder: 'Det viktigaste är...' }
        ]
      }
    ]
  },
  {
    id: 'missbruk-beroende',
    title: 'Missbruk och beroende i arbetslivet',
    description: 'Få kunskap om missbruk och beroende, hur det påverkar arbetslivet och var du kan få hjälp.',
    icon: Pill,
    category: 'Välmående',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Förstå missbruk och beroende',
        description: 'Lär dig om olika typer av beroenden.',
        questions: [
          { id: 'mb1-q1', text: 'Vad är skillnaden mellan bruk, missbruk och beroende?', placeholder: 'Skillnaden är att...' },
          { id: 'mb1-q2', text: 'Hur kan beroende påverka arbetslivet?', placeholder: 'Det kan påverka genom att...' },
          { id: 'mb1-q3', text: 'Vilka är varningstecken på att någon har problem med alkohol eller droger?', placeholder: 'Varningstecken är...' }
        ]
      },
      {
        id: 2,
        title: 'När du behöver hjälp',
        description: 'Lär dig om stöd och behandling.',
        questions: [
          { id: 'mb2-q1', text: 'När bör man söka hjälp för sitt drickande eller användande?', placeholder: 'Man bör söka hjälp när...' },
          { id: 'mb2-q2', text: 'Vilka stöd finns tillgängliga för den som har beroendeproblem?', placeholder: 'Stöd som finns är...' },
          { id: 'mb2-q3', text: 'Hur kan du be om hjälp utan att skämmas?', placeholder: 'Jag kan tänka på att...' }
        ]
      },
      {
        id: 3,
        title: 'Återgång till arbete',
        description: 'Förstå processen efter behandling.',
        questions: [
          { id: 'mb3-q1', text: 'Vad är viktigt att tänka på vid återgång till arbete efter behandling?', placeholder: 'Viktigt är att...' },
          { id: 'mb3-q2', text: 'Vilka rättigheter har du som arbetstagare?', placeholder: 'Jag har rätt till...' },
          { id: 'mb3-q3', text: 'Vilken stöd kan arbetsgivaren erbjuda?', placeholder: 'Arbetsgivaren kan...' }
        ]
      }
    ]
  },
  // ============================================
  // REHABILITERING OCH SYSSELSÄTTNING (Kategorier 29-38)
  // ============================================
  {
    id: 'sjukskrivning-atergang',
    title: 'Sjukskrivning och återgångsprocess',
    description: 'Förstå sjukskrivningsprocessen, rehabiliteringskedjan och hur du kommer tillbaka till arbete.',
    icon: Stethoscope,
    category: 'Rehabilitering',
    duration: '30-40 min',
    difficulty: 'Utmanande',
    steps: [
      {
        id: 1,
        title: 'Sjukskrivningsprocessen',
        description: 'Lär dig hur sjukskrivning fungerar.',
        questions: [
          { id: 'sa1-q1', text: 'Vem kan sjukskriva dig och hur länge kan olika instanser sjukskriva?', placeholder: 'Läkare kan sjukskriva i... Försäkringskassan i...' },
          { id: 'sa1-q2', text: 'Vad är rehabiliteringskedjan och vilka steg innehåller den?', placeholder: 'Rehabiliteringskedjan innebär att...' },
          { id: 'sa1-q3', text: 'Vad är dina rättigheter och skyldigheter som sjukskriven?', placeholder: 'Jag har rätt till... och skyldighet att...' }
        ]
      },
      {
        id: 2,
        title: 'Planera återgången',
        description: 'Förbered dig för att komma tillbaka till arbete.',
        questions: [
          { id: 'sa2-q1', text: 'Vad är en återgångsplan och vem ska göra den?', placeholder: 'En återgångsplan är...' },
          { id: 'sa2-q2', text: 'Vad är gradvis återgång och hur fungerar det praktiskt?', placeholder: 'Gradvis återgång innebär att...' },
          { id: 'sa2-q3', text: 'Vad kan du göra för att underlätta din återgång?', placeholder: 'Jag kan underlätta genom att...' }
        ]
      },
      {
        id: 3,
        title: 'Samverkan i processen',
        description: 'Förstå vilka som är inblandade.',
        questions: [
          { id: 'sa3-q1', text: 'Vilka olika aktörer kan vara inblandade i din rehabilitering?', placeholder: 'Aktörer är t.ex....' },
          { id: 'sa3-q2', text: 'Vad är en rehabiliteringskoordinators roll?', placeholder: 'Koordinatorn hjälper till med...' },
          { id: 'sa3-q3', text: 'Hur kan du själv påverka din rehabilitering?', placeholder: 'Jag kan påverka genom att...' }
        ]
      }
    ]
  },
  {
    id: 'arbetslivsinriktad-rehab',
    title: 'Arbetslivsinriktad rehabilitering',
    description: 'Lär dig om arbetslivsinriktad rehabilitering, vad det innebär och hur du kan få stöd.',
    icon: HelpingHand,
    category: 'Rehabilitering',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Vad är arbetslivsinriktad rehabilitering?',
        description: 'Förstå begreppet och vad det innebär.',
        questions: [
          { id: 'ar1-q1', text: 'Vad innebär arbetslivsinriktad rehabilitering (ALR)?', placeholder: 'Det innebär att...' },
          { id: 'ar1-q2', text: 'Vem kan få ALR och vem bestämmer det?', placeholder: 'Man kan få det om... och det bestämmer...' },
          { id: 'ar1-q3', text: 'Vad kan ALR innehålla för olika insatser?', placeholder: 'Det kan innehålla...' }
        ]
      },
      {
        id: 2,
        title: 'Egen försörjning',
        description: 'Förstå vägen till egen försörjning.',
        questions: [
          { id: 'ar2-q1', text: 'Vad innebär det att vara i behov av arbetslivsinriktad rehabilitering?', placeholder: 'Det innebär att...' },
          { id: 'ar2-q2', text: 'Vad är viktigt för att nå egen försörjning?', placeholder: 'Viktigt är att...' },
          { id: 'ar2-q3', text: 'Hur kan du förbereda dig under rehabiliteringen?', placeholder: 'Jag kan förbereda mig genom att...' }
        ]
      },
      {
        id: 3,
        title: 'Stöd längs vägen',
        description: 'Lär dig vilka stöd som finns.',
        questions: [
          { id: 'ar3-q1', text: 'Vilka ekonomiska stöd kan du få under rehabiliteringen?', placeholder: 'Jag kan få...' },
          { id: 'ar3-q2', text: 'Vad är aktivitetsstöd och när får man det?', placeholder: 'Aktivitetsstöd är...' },
          { id: 'ar3-q3', text: 'Hur länge kan rehabiliteringen pågå?', placeholder: 'Den kan pågå i...' }
        ]
      }
    ]
  },
  {
    id: 'samverkan-vard-fk',
    title: 'Samverkan mellan vård, arbetsgivare och Försäkringskassan',
    description: 'Förstå hur samverkan fungerar mellan olika aktörer och hur du navigerar i systemet.',
    icon: Building,
    category: 'Rehabilitering',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'De olika aktörerna',
        description: 'Lär dig vem som gör vad.',
        questions: [
          { id: 'svf1-q1', text: 'Vilken roll har respektive aktör: vården, arbetsgivaren, Försäkringskassan och Arbetsförmedlingen?', placeholder: 'Vården... Arbetsgivaren... FK... AF...' },
          { id: 'svf1-q2', text: 'Vad är en rehabiliteringsutredning och vem gör den?', placeholder: 'Det är... och den görs av...' },
          { id: 'svf1-q3', text: 'När samverkar aktörerna med varandra?', placeholder: 'De samverkar när...' }
        ]
      },
      {
        id: 2,
        title: 'Din roll i samverkan',
        description: 'Förstå ditt ansvar och dina möjligheter.',
        questions: [
          { id: 'svf2-q1', text: 'Vad kan du göra för att underlätta samverkan mellan aktörerna?', placeholder: 'Jag kan...' },
          { id: 'svf2-q2', text: 'Hur kan du få information om vad som händer i processen?', placeholder: 'Jag kan fråga om...' },
          { id: 'svf2-q3', text: 'Vad kan du göra om samverkan inte fungerar bra?', placeholder: 'Jag kan då...' }
        ]
      },
      {
        id: 3,
        title: 'Praktisk navigering',
        description: 'Lär dig hantera olika kontakter.',
        questions: [
          { id: 'svf3-q1', text: 'Hur förbereder du dig inför möten med olika aktörer?', placeholder: 'Jag förbereder mig genom att...' },
          { id: 'svf3-q2', text: 'Vilka frågor bör du ställa till respektive aktör?', placeholder: 'Till vården:... Till FK:... Till AF:...' },
          { id: 'svf3-q3', text: 'Hur dokumenterar du vad som sagts och beslutats?', placeholder: 'Jag dokumenterar genom att...' }
        ]
      }
    ]
  },
  {
    id: 'anpassning-arbetsuppgifter',
    title: 'Anpassning av arbetsuppgifter och arbetsplats',
    description: 'Lär dig om olika typer av anpassningar som kan hjälpa dig att arbeta trott funktionsnedsättning eller hälsoproblem.',
    icon: Accessibility,
    category: 'Rehabilitering',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Typer av anpassningar',
        description: 'Lär dig vilka anpassningar som finns.',
        questions: [
          { id: 'aa1-q1', text: 'Vilka fysiska anpassningar kan göras på en arbetsplats?', placeholder: 'Fysiska anpassningar är t.ex...' },
          { id: 'aa1-q2', text: 'Vilka organisatoriska anpassningar kan göras?', placeholder: 'Organisatoriska anpassningar är...' },
          { id: 'aa1-q3', text: 'Vad är arbetsassistans och när kan det beviljas?', placeholder: 'Arbetsassistans är...' }
        ]
      },
      {
        id: 2,
        title: 'Få anpassningar på plats',
        description: 'Lär dig processen för att få anpassningar.',
        questions: [
          { id: 'aa2-q1', text: 'Hur ansöker du om stöd för arbetsplatsanpassning?', placeholder: 'Jag ansöker genom att...' },
          { id: 'aa2-q2', text: 'Vem betalar för anpassningarna?', placeholder: 'Det betalas av...' },
          { id: 'aa2-q3', text: 'Vad kan du göra om arbetsgivaren är ovillig att anpassa?', placeholder: 'Jag kan då...' }
        ]
      },
      {
        id: 3,
        title: 'Din egen utrustning',
        description: 'Förstå hjälpmedel och tekniska lösningar.',
        questions: [
          { id: 'aa3-q1', text: 'Vilka hjälpmedel kan underlätta ditt arbete?', placeholder: 'Hjälpmedel som kan hjälpa är...' },
          { id: 'aa3-q2', text: 'Hur ansöker du om personliga hjälpmedel?', placeholder: 'Jag ansöker hos...' },
          { id: 'aa3-q3', text: 'Vad är viktigt att tänka på vid val av hjälpmedel?', placeholder: 'Viktigt är att...' }
        ]
      }
    ]
  },
  {
    id: 'supported-employment',
    title: 'Supported Employment och arbetsträning',
    description: 'Lär dig om Supported Employment-modellen och hur arbetsträning kan hjälpa dig in på arbetsmarknaden.',
    icon: HelpingHand,
    category: 'Rehabilitering',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Supported Employment',
        description: 'Förstå SE-modellen.',
        questions: [
          { id: 'se1-q1', text: 'Vad är Supported Employment och vilka principer bygger det på?', placeholder: 'SE är... och bygger på...' },
          { id: 'se1-q2', text: 'Vem kan få stöd enligt SE-modellen?', placeholder: 'Man kan få det om...' },
          { id: 'se1-q3', text: 'Vad är skillnaden mellan SE och traditionell arbetsträning?', placeholder: 'Skillnaden är att...' }
        ]
      },
      {
        id: 2,
        title: 'Processen',
        description: 'Lär dig stegen i SE-processen.',
        questions: [
          { id: 'se2-q1', text: 'Vilka är de olika stegen i Supported Employment?', placeholder: 'Stegen är: 1... 2... 3...' },
          { id: 'se2-q2', text: 'Vad gör en jobbcoach?', placeholder: 'En jobbcoach hjälper till med...' },
          { id: 'se2-q3', text: 'Hur länge får du stöd av en jobbcoach?', placeholder: 'Stödet ges under...' }
        ]
      },
      {
        id: 3,
        title: 'Arbetsträning',
        description: 'Förstå arbetsträning och dess mål.',
        questions: [
          { id: 'se3-q1', text: 'Vad är skillnaden mellan arbetsträning och praktik?', placeholder: 'Skillnaden är att...' },
          { id: 'se3-q2', text: 'Vad är målet med arbetsträning?', placeholder: 'Målet är att...' },
          { id: 'se3-q3', text: 'Hur kan du få ut maximalt av din arbetsträning?', placeholder: 'Jag kan maximera den genom att...' }
        ]
      }
    ]
  },
  {
    id: 'funktionsnedsattning-tillganglighet',
    title: 'Funktionsnedsättning och tillgänglighet',
    description: 'Lär dig om rättigheter, stöd och möjligheter när du har en funktionsnedsättning.',
    icon: Accessibility,
    category: 'Rehabilitering',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Dina rättigheter',
        description: 'Förstå vad lagen säger.',
        questions: [
          { id: 'ft1-q1', text: 'Vad säger diskrimineringslagen om funktionsnedsättning i arbetslivet?', placeholder: 'Lagen säger att...' },
          { id: 'ft1-q2', text: 'Vad är arbetsgivarens skyldigheter vid anpassningar?', placeholder: 'Arbetsgivaren måste...' },
          { id: 'ft1-q3', text: 'Vad kan du göra om du upplever diskriminering?', placeholder: 'Jag kan anmäla till...' }
        ]
      },
      {
        id: 2,
        title: 'När ska du berätta?',
        description: 'Fundera över öppenhet om din funktionsnedsättning.',
        questions: [
          { id: 'ft2-q1', text: 'Vilka är för- och nackdelarna med att berätta om funktionsnedsättning i ansökan?', placeholder: 'Fördelar:... Nackdelar:...' },
          { id: 'ft2-q2', text: 'När är det lämpligt att berätta i processen?', placeholder: 'Det kan vara lämpligt att...' },
          { id: 'ft2-q3', text: 'Hur kan du formulera dig om du väljer att berätta?', placeholder: 'Jag kan säga...' }
        ]
      },
      {
        id: 3,
        title: 'Stödinsatser',
        description: 'Lär dig vilka stöd som finns.',
        questions: [
          { id: 'ft3-q1', text: 'Vilka specifika stöd finns för personer med funktionsnedsättning?', placeholder: 'Stöd som finns är...' },
          { id: 'ft3-q2', text: 'Vad är lönebidrag och när kan det beviljas?', placeholder: 'Lönebidrag är...' },
          { id: 'ft3-q3', text: 'Hur ansöker du om stödinsatser?', placeholder: 'Jag ansöker genom att...' }
        ]
      }
    ]
  },
  {
    id: 'aktivitetsersattning-sjukersattning',
    title: 'Aktivitetsersättning och sjukersättning',
    description: 'Förstå skillnaden mellan olika typer av ersättning och vad de innebär för din vardag och dina möjligheter.',
    icon: Shield,
    category: 'Rehabilitering',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Aktivitetsersättning',
        description: 'Lär dig om aktivitetsersättning för unga.',
        questions: [
          { id: 'aes1-q1', text: 'Vad är aktivitetsersättning och vem kan få det?', placeholder: 'Det är... och man kan få det om...' },
          { id: 'aes1-q2', text: 'Vad får du göra samtidigt som du har aktivitetsersättning?', placeholder: 'Jag får...' },
          { id: 'aes1-q3', text: 'Hur påverkas ersättningen om du börjar arbeta eller studera?', placeholder: 'Ersättningen påverkas genom att...' }
        ]
      },
      {
        id: 2,
        title: 'Sjukersättning',
        description: 'Förstå sjukersättning.',
        questions: [
          { id: 'aes2-q1', text: 'Vad är skillnaden mellan sjukpenning, sjukersättning och aktivitetsersättning?', placeholder: 'Skillnaden är att...' },
          { id: 'aes2-q2', text: 'Vem kan få sjukersättning?', placeholder: 'Man kan få det om...' },
          { id: 'aes2-q3', text: 'Kan du arbeta samtidigt som du har sjukersättning?', placeholder: 'Ja/Nej, och det beror på...' }
        ]
      },
      {
        id: 3,
        title: 'Vägen vidare',
        description: 'Fundera över framtiden.',
        questions: [
          { id: 'aes3-q1', text: 'Vad är dina mål för framtiden - arbete, studier eller annat?', placeholder: 'Mina mål är...' },
          { id: 'aes3-q2', text: 'Vilka möjligheter finns att pröva på arbete utan att förlora ersättningen?', placeholder: 'Möjligheter är...' },
          { id: 'aes3-q3', text: 'Vem kan du prata med om dina framtidsplaner?', placeholder: 'Jag kan prata med...' }
        ]
      }
    ]
  },
  {
    id: 'daglig-verksamhet',
    title: 'Daglig verksamhet och sysselsättningsalternativ',
    description: 'Lär dig om daglig verksamhet, samt andra alternativ för meningsfull sysselsättning.',
    icon: Building,
    category: 'Rehabilitering',
    duration: '25-35 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Daglig verksamhet',
        description: 'Förstå vad daglig verksamhet innebär.',
        questions: [
          { id: 'dv1-q1', text: 'Vad är daglig verksamhet och vem kan få det?', placeholder: 'Det är... och man kan få det om...' },
          { id: 'dv1-q2', text: 'Vilka aktiviteter kan daglig verksamhet innehålla?', placeholder: 'Det kan innehålla...' },
          { id: 'dv1-q3', text: 'Vad är syftet med daglig verksamhet?', placeholder: 'Syftet är att...' }
        ]
      },
      {
        id: 2,
        title: 'Andra alternativ',
        description: 'Lär dig om andra sysselsättningsformer.',
        questions: [
          { id: 'dv2-q1', text: 'Vilka andra alternativ till daglig verksamhet finns det?', placeholder: 'Andra alternativ är...' },
          { id: 'dv2-q2', text: 'Vad är skillnaden mellan daglig verksamhet och arbetsträning?', placeholder: 'Skillnaden är att...' },
          { id: 'dv2-q3', text: 'Hur kan du hitta rätt sysselsättningsform för dig?', placeholder: 'Jag kan hitta den genom att...' }
        ]
      },
      {
        id: 3,
        title: 'Meningsfull sysselsättning',
        description: 'Fundera över vad som ger mening för dig.',
        questions: [
          { id: 'dv3-q1', text: 'Vad skulle ge dig mening och syfte i en sysselsättning?', placeholder: 'För mig skulle... ge mening' },
          { id: 'dv3-q2', text: 'Hur kan du påverka innehållet i din sysselsättning?', placeholder: 'Jag kan påverka genom att...' },
          { id: 'dv3-q3', text: 'Vad är viktigt för dig att utveckla i din sysselsättning?', placeholder: 'Jag vill utveckla...' }
        ]
      }
    ]
  },
  {
    id: 'stigma-delaktighet',
    title: 'Stigma, delaktighet och återintegration',
    description: 'Hantera stigma, bygg delaktighet och hitta vägen tillbaka till arbete och samhälle.',
    icon: Sparkles,
    category: 'Rehabilitering',
    duration: '30-40 min',
    difficulty: 'Utmanande',
    steps: [
      {
        id: 1,
        title: 'Hantera stigma',
        description: 'Lär dig hantera och motverka stigma.',
        questions: [
          { id: 'sd1-q1', text: 'Vad är stigma och hur kan det påverka dig som arbetssökande?', placeholder: 'Stigma är... och det påverkar genom att...' },
          { id: 'sd1-q2', text: 'Hur kan du hantera egna tankar om skam eller mindervärdighet?', placeholder: 'Jag kan hantera det genom att...' },
          { id: 'sd1-q3', text: 'Hur kan du bemöta fördomar från andra?', placeholder: 'Jag kan bemöta dem genom att...' }
        ]
      },
      {
        id: 2,
        title: 'Bygga delaktighet',
        description: 'Skapa känsla av tillhörighet och delaktighet.',
        questions: [
          { id: 'sd2-q1', text: 'Vad innebär det att vara delaktig i samhället?', placeholder: 'Att vara delaktig innebär att...' },
          { id: 'sd2-q2', text: 'Vad kan du göra för att känna dig mer delaktig?', placeholder: 'Jag kan bli mer delaktig genom att...' },
          { id: 'sd2-q3', text: 'Vilka grupper eller sammanhang kan ge dig känsla av tillhörighet?', placeholder: 'Jag kan söka mig till...' }
        ]
      },
      {
        id: 3,
        title: 'Återintegration',
        description: 'Hitta vägen tillbaka till arbetslivet.',
        questions: [
          { id: 'sd3-q1', text: 'Vilka steg kan du ta för att närma dig arbetslivet igen?', placeholder: 'Jag kan börja med att...' },
          { id: 'sd3-q2', text: 'Vad behöver du för stöd i din återintegration?', placeholder: 'Jag behöver stöd med...' },
          { id: 'sd3-q3', text: 'Hur kan du förbereda dig mentalt för att gå tillbaka till arbete?', placeholder: 'Jag kan förbereda mig genom att...' }
        ]
      }
    ]
  },
  {
    id: 'motivation-meningsfullhet',
    title: 'Motivation, meningsfullhet och självledarskap',
    description: 'Hitta din inre drivkraft, skapa mening och ta ledningen över ditt eget liv och din egen utveckling.',
    icon: Sparkles,
    category: 'Rehabilitering',
    duration: '30-40 min',
    difficulty: 'Utmanande',
    steps: [
      {
        id: 1,
        title: 'Hitta din motivation',
        description: 'Upptäck vad som driver dig.',
        questions: [
          { id: 'mm1-q1', text: 'Vad är du motiverad av? Lista 5 saker som ger dig energi.', placeholder: 'Jag blir motiverad av...' },
          { id: 'mm1-q2', text: 'Vad är dina kärnvärden och hur kan de styra dina val?', placeholder: 'Mina kärnvärden är...' },
          { id: 'mm1-q3', text: 'Hur kan du öka din inre motivation när det känns tungt?', placeholder: 'Jag kan öka den genom att...' }
        ]
      },
      {
        id: 2,
        title: 'Skapa mening',
        description: 'Hitta mening i det du gör.',
        questions: [
          { id: 'mm2-q1', text: 'Vad ger mening åt ditt liv just nu?', placeholder: 'Mening får jag från...' },
          { id: 'mm2-q2', text: 'Hur kan du skapa mer mening i din vardag?', placeholder: 'Jag kan skapa mening genom att...' },
          { id: 'mm2-q3', text: 'Vad är viktigt för dig att bidra med till samhället eller andra?', placeholder: 'Jag vill bidra med...' }
        ]
      },
      {
        id: 3,
        title: 'Självledarskap',
        description: 'Ta kontroll över ditt eget liv.',
        questions: [
          { id: 'mm3-q1', text: 'Vad innebär självledarskap för dig?', placeholder: 'För mig innebär det att...' },
          { id: 'mm3-q2', text: 'Hur kan du bli mer proaktiv och mindre reaktiv i ditt liv?', placeholder: 'Jag kan bli mer proaktiv genom att...' },
          { id: 'mm3-q3', text: 'Vad är ditt nästa steg för att ta mer ansvar för ditt eget välmående och din utveckling?', placeholder: 'Mitt nästa steg är att...' }
        ]
      }
    ]
  },
  // === NYA ÖVNINGAR 2026 ===
  {
    id: 'references-prep',
    title: 'Förbered dina referenser',
    description: 'Välj rätt personer, förbered dem ordentligt och se till att dina referenser stärker din ansökan.',
    icon: UserCheck,
    category: 'Jobbsökning',
    duration: '20-25 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Välj rätt referenser',
        description: 'Identifiera de bästa personerna att använda som referenser.',
        questions: [
          { id: 'ref1-q1', text: 'Lista 5 personer som skulle kunna vara en bra referens för dig (tidigare chefer, kollegor, lärare).', placeholder: '1. Min tidigare chef på...\n2. Min kollega som...' },
          { id: 'ref1-q2', text: 'För varje person: Vad kan de berätta positivt om dig?', placeholder: 'Min chef kan berätta om min förmåga att...' },
          { id: 'ref1-q3', text: 'Vilka av dessa har du bäst relation med och senast varit i kontakt med?', placeholder: 'Jag har bäst kontakt med...' }
        ]
      },
      {
        id: 2,
        title: 'Kontakta och förbered',
        description: 'Be om tillstånd och ge dem information.',
        questions: [
          { id: 'ref2-q1', text: 'Skriv ett meddelande där du frågar om någon kan vara din referens.', placeholder: 'Hej [namn], jag hoppas allt är bra med dig...' },
          { id: 'ref2-q2', text: 'Vilken information bör du ge till din referens om jobbet du söker?', placeholder: 'Jag ska berätta om jobbets krav, företaget och...' },
          { id: 'ref2-q3', text: 'Vilka av dina styrkor och erfarenheter vill du att de lyfter fram?', placeholder: 'Jag vill att de lyfter fram min...' }
        ]
      },
      {
        id: 3,
        title: 'Referenslistans utformning',
        description: 'Skapa en professionell referenslista.',
        questions: [
          { id: 'ref3-q1', text: 'Hur ska din referenslista se ut? Vilken information ska finnas med?', placeholder: 'Namn, titel, företag, relation till mig, kontaktuppgifter...' },
          { id: 'ref3-q2', text: 'När ska du ge din referenslista till arbetsgivaren?', placeholder: 'Jag ger den när de ber om det, vanligtvis...' },
          { id: 'ref3-q3', text: 'Hur ska du tacka dina referenser efter att de hjälpt dig?', placeholder: 'Jag ska skicka ett tack-meddelande där jag...' }
        ]
      }
    ]
  },
  {
    id: 'feedback-request',
    title: 'Be om feedback efter avslag',
    description: 'Lär dig be om konstruktiv feedback från arbetsgivare för att förbättra dina chanser vid nästa ansökan.',
    icon: MessageCircle,
    category: 'Jobbsökning',
    duration: '15-20 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Förstå värdet av feedback',
        description: 'Varför feedback efter avslag är guld värt.',
        questions: [
          { id: 'fb1-q1', text: 'Vad kan du lära dig av feedback efter ett avslag?', placeholder: 'Jag kan lära mig vad jag kan förbättra...' },
          { id: 'fb1-q2', text: 'Varför är det viktigt att be om feedback på ett professionellt sätt?', placeholder: 'Det är viktigt eftersom...' },
          { id: 'fb1-q3', text: 'Hur kan feedback hjälpa dig i din nästa ansökan?', placeholder: 'Feedback kan hjälpa mig att...' }
        ]
      },
      {
        id: 2,
        title: 'Formulera din förfrågan',
        description: 'Skriv ett professionellt mejl som ökar chansen att få svar.',
        questions: [
          { id: 'fb2-q1', text: 'Skriv ett kort, artigt mejl där du ber om feedback efter ett avslag.', placeholder: 'Hej [namn],\n\nTack för att ni meddelade mig om ert beslut...' },
          { id: 'fb2-q2', text: 'Vilka specifika frågor kan du ställa för att få användbar feedback?', placeholder: '1. Vad kunde jag ha gjort annorlunda?\n2. Vilka kompetenser saknades?' },
          { id: 'fb2-q3', text: 'Hur visar du att du uppskattar deras tid och svar?', placeholder: 'Jag avslutar med att tacka och...' }
        ]
      },
      {
        id: 3,
        title: 'Använd feedbacken',
        description: 'Omvandla feedback till konkreta förbättringar.',
        questions: [
          { id: 'fb3-q1', text: 'Hur ska du dokumentera och komma ihåg feedback du får?', placeholder: 'Jag ska skriva ner det i...' },
          { id: 'fb3-q2', text: 'Hur kan du göra om feedback till konkreta åtgärder?', placeholder: 'Om de säger att jag saknar X, ska jag...' },
          { id: 'fb3-q3', text: 'När ska du granska och använda din samlade feedback?', placeholder: 'Innan varje ny ansökan ska jag...' }
        ]
      }
    ]
  },
  {
    id: 'work-life-balance-plan',
    title: 'Skapa balans mellan jobb och fritid',
    description: 'Planera en hållbar balans mellan arbete och privatliv för långsiktigt välmående och produktivitet.',
    icon: HeartPulse,
    category: 'Välmående',
    duration: '25-30 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Din nuvarande situation',
        description: 'Utvärdera hur din balans ser ut idag.',
        questions: [
          { id: 'wlb1-q1', text: 'Hur ser din typiska vecka ut? Hur mycket tid går till jobb vs fritid?', placeholder: 'En vanlig vecka lägger jag... timmar på jobb...' },
          { id: 'wlb1-q2', text: 'Vilka aktiviteter utanför jobbet ger dig energi?', placeholder: 'Jag får energi av...' },
          { id: 'wlb1-q3', text: 'Vad fungerar bra med din nuvarande balans? Vad fungerar dåligt?', placeholder: 'Det som fungerar är... Det som inte fungerar är...' }
        ]
      },
      {
        id: 2,
        title: 'Definiera din ideala balans',
        description: 'Skapa en vision för hur du vill ha det.',
        questions: [
          { id: 'wlb2-q1', text: 'Hur skulle en perfekt vecka med god balans se ut för dig?', placeholder: 'En ideal vecka skulle innefatta...' },
          { id: 'wlb2-q2', text: 'Vilka gränser behöver du sätta för ditt arbete?', placeholder: 'Jag behöver sätta gränser kring...' },
          { id: 'wlb2-q3', text: 'Vilka fasta aktiviteter vill du prioritera varje vecka?', placeholder: 'Jag vill prioritera träning på..., tid med familjen...' }
        ]
      },
      {
        id: 3,
        title: 'Handlingsplan för balans',
        description: 'Skapa konkreta förändringar.',
        questions: [
          { id: 'wlb3-q1', text: 'Vilka 3 förändringar ska du göra för att förbättra din balans?', placeholder: '1. Jag ska sluta kolla jobbmejl efter kl 18\n2. Jag ska...' },
          { id: 'wlb3-q2', text: 'Hur ska du kommunicera dina gränser till arbetsgivare/kollegor?', placeholder: 'Jag kommer att säga...' },
          { id: 'wlb3-q3', text: 'Hur ska du utvärdera om din nya balans fungerar?', placeholder: 'Jag ska checka in med mig själv varje...' }
        ]
      }
    ]
  },
  {
    id: 'salary-negotiation-practice',
    title: 'Öva löneförhandling',
    description: 'Träna på att förhandla lön genom rollspel och scenarioövningar. Bygg självförtroende inför det viktiga samtalet.',
    icon: Coins,
    category: 'Arbetsrätt',
    duration: '30-40 min',
    difficulty: 'Utmanande',
    steps: [
      {
        id: 1,
        title: 'Förberedelse och research',
        description: 'Samla fakta och argument.',
        questions: [
          { id: 'sn1-q1', text: 'Vad är marknadslönen för den roll och bransch du söker? Ange ett spann.', placeholder: 'Enligt mina efterforskningar ligger lönen på...' },
          { id: 'sn1-q2', text: 'Lista 5 konkreta argument för varför du är värd den lönen du vill ha.', placeholder: '1. Jag har X års erfarenhet av...\n2. Jag har uppnått...' },
          { id: 'sn1-q3', text: 'Vad är ditt ideallön, din målsättning och din lägsta acceptabla nivå?', placeholder: 'Ideal: X kr, Mål: Y kr, Minimum: Z kr' }
        ]
      },
      {
        id: 2,
        title: 'Scenarioövningar',
        description: 'Öva på vanliga situationer i löneförhandlingen.',
        questions: [
          { id: 'sn2-q1', text: 'Arbetsgivaren frågar: "Vad har du för löneanspråk?" Skriv ditt svar.', placeholder: 'Baserat på min erfarenhet och marknadslönen...' },
          { id: 'sn2-q2', text: 'Arbetsgivaren säger: "Vi kan tyvärr inte gå så högt." Hur svarar du?', placeholder: 'Jag förstår, men jag undrar om vi kan diskutera...' },
          { id: 'sn2-q3', text: 'Om lönen inte går att förhandla – vilka andra förmåner kan du be om?', placeholder: 'Jag skulle vilja diskutera flexibilitet, semester...' }
        ]
      },
      {
        id: 3,
        title: 'Rollspel och avslut',
        description: 'Simulera hela samtalet.',
        questions: [
          { id: 'sn3-q1', text: 'Skriv ett manus för hur du inleder löneförhandlingen.', placeholder: 'Tack för erbjudandet. Jag är mycket intresserad av rollen...' },
          { id: 'sn3-q2', text: 'Hur ska du avsluta förhandlingen om ni når en överenskommelse?', placeholder: 'Jag är nöjd med detta och ser fram emot att...' },
          { id: 'sn3-q3', text: 'Vem kan du öva denna förhandling med innan det riktiga samtalet?', placeholder: 'Jag ska be [namn] att rollspela med mig...' }
        ]
      }
    ]
  },
  {
    id: 'digital-cleanup',
    title: 'Rensa din digitala närvaro',
    description: 'Gå igenom och uppdatera dina sociala medier och digitala fotspår så att du gör ett bra intryck på potentiella arbetsgivare.',
    icon: Monitor,
    category: 'Digital närvaro',
    duration: '30-40 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Googla dig själv',
        description: 'Se vad arbetsgivare hittar när de söker på dig.',
        questions: [
          { id: 'dc1-q1', text: 'Googla ditt namn. Vad dyker upp på första sidan?', placeholder: 'När jag söker på mitt namn ser jag...' },
          { id: 'dc1-q2', text: 'Finns det något i sökresultaten som kan ge ett negativt intryck?', placeholder: 'Jag hittade... som kanske inte är bra...' },
          { id: 'dc1-q3', text: 'Vilka av dina sociala medier-profiler syns i sökningen?', placeholder: 'LinkedIn syns, Instagram syns...' }
        ]
      },
      {
        id: 2,
        title: 'Granska dina profiler',
        description: 'Gå igenom varje plattform.',
        questions: [
          { id: 'dc2-q1', text: 'Facebook: Vad behöver tas bort, döljas eller uppdateras?', placeholder: 'Jag ska ta bort gamla foton som..., uppdatera min...' },
          { id: 'dc2-q2', text: 'Instagram: Är ditt konto privat? Behöver du rensa gamla inlägg?', placeholder: 'Mitt konto är offentligt/privat. Jag ska...' },
          { id: 'dc2-q3', text: 'LinkedIn: Är profilen komplett och uppdaterad? Har du en bra profilbild?', placeholder: 'Min LinkedIn behöver uppdateras med...' }
        ]
      },
      {
        id: 3,
        title: 'Bygg en positiv närvaro',
        description: 'Skapa innehåll som stärker ditt professionella varumärke.',
        questions: [
          { id: 'dc3-q1', text: 'Vilket positivt innehåll kan du lägga upp för att förbättra sökresultaten?', placeholder: 'Jag kan lägga upp artiklar om..., projekt jag gjort...' },
          { id: 'dc3-q2', text: 'Hur kan du använda LinkedIn mer aktivt för att synas positivt?', placeholder: 'Jag kan dela inlägg om..., kommentera på...' },
          { id: 'dc3-q3', text: 'Hur ofta ska du se över din digitala närvaro framöver?', placeholder: 'Jag ska göra en genomgång varje...' }
        ]
      }
    ]
  },
  {
    id: 'remote-work-prep',
    title: 'Förbereda för distansarbete',
    description: 'Skapa förutsättningar för framgångsrikt distansarbete – från hemmakontor till kommunikation och rutiner.',
    icon: Laptop,
    category: 'Karriärutveckling',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Hemmakontor och utrustning',
        description: 'Skapa en produktiv arbetsmiljö hemma.',
        questions: [
          { id: 'rw1-q1', text: 'Var i ditt hem kan du skapa en arbetsplats? Vad behöver du?', placeholder: 'Jag kan sitta i... Jag behöver ett skrivbord, bra stol...' },
          { id: 'rw1-q2', text: 'Vilken teknisk utrustning behöver du för distansarbete?', placeholder: 'Jag behöver dator, headset, webbkamera, bra wifi...' },
          { id: 'rw1-q3', text: 'Hur kan du minimera störningar under arbetstid?', placeholder: 'Jag kan stänga dörren, använda hörlurar...' }
        ]
      },
      {
        id: 2,
        title: 'Rutiner och struktur',
        description: 'Bygg hållbara arbetsdagsrutiner.',
        questions: [
          { id: 'rw2-q1', text: 'Hur ska en typisk distansarbetsdag se ut för dig?', placeholder: 'Jag börjar kl 8 med... Lunch 12-13... Slutar 17...' },
          { id: 'rw2-q2', text: 'Hur ska du markera början och slutet av arbetsdagen?', placeholder: 'Jag startar dagen med kaffe vid skrivbordet...' },
          { id: 'rw2-q3', text: 'Hur ofta ska du ta pauser? Vad gör du på pauserna?', placeholder: 'Jag tar en kort paus var 90:e minut...' }
        ]
      },
      {
        id: 3,
        title: 'Kommunikation och synlighet',
        description: 'Håll kontakten med kollegor och chef.',
        questions: [
          { id: 'rw3-q1', text: 'Hur ska du hålla regelbunden kontakt med chefen och teamet?', placeholder: 'Dagliga standups, veckomöten, check-ins...' },
          { id: 'rw3-q2', text: 'Hur visar du att du är tillgänglig och produktiv?', placeholder: 'Jag svarar snabbt på meddelanden, uppdaterar i...' },
          { id: 'rw3-q3', text: 'Vilka kommunikationsverktyg behöver du behärska?', placeholder: 'Teams, Slack, Zoom... Jag ska lära mig...' }
        ]
      }
    ]
  },
  {
    id: 'onboarding-success',
    title: 'Lyckas med din onboarding',
    description: 'Maximera dina första 90 dagar på nya jobbet genom att planera din introduktion och bygga relationer.',
    icon: Rocket,
    category: 'Karriärutveckling',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Första veckan',
        description: 'Fokus på lärande och observation.',
        questions: [
          { id: 'ob1-q1', text: 'Vilka frågor vill du få svar på under din första vecka?', placeholder: 'Jag vill veta hur teamet fungerar, vilka verktygen är...' },
          { id: 'ob1-q2', text: 'Hur ska du presentera dig för dina nya kollegor?', placeholder: 'Jag ska berätta kort om min bakgrund och vad jag...' },
          { id: 'ob1-q3', text: 'Vilken information behöver du samla in? (System, rutiner, kontaktpersoner)', placeholder: 'Jag behöver lära mig systemen för..., vem jag ska...' }
        ]
      },
      {
        id: 2,
        title: 'Första månaden',
        description: 'Börja bidra och bygga relationer.',
        questions: [
          { id: 'ob2-q1', text: 'Vilka nyckelpersoner behöver du bygga relation med?', placeholder: 'Min chef, teamkollegor, personer i andra avdelningar...' },
          { id: 'ob2-q2', text: 'Vilka "quick wins" kan du åstadkomma tidigt?', placeholder: 'Jag kan föreslå en förbättring av..., hjälpa till med...' },
          { id: 'ob2-q3', text: 'Hur ska du be om och ta emot feedback?', placeholder: 'Jag ska boka ett möte efter 2 veckor för att...' }
        ]
      },
      {
        id: 3,
        title: '90-dagarsplanen',
        description: 'Sätt upp mål för första kvartalet.',
        questions: [
          { id: 'ob3-q1', text: 'Vad ska du ha uppnått efter 90 dagar?', placeholder: 'Jag ska kunna jobba självständigt med..., ha byggt relation med...' },
          { id: 'ob3-q2', text: 'Hur ska du mäta din framgång under introduktionen?', placeholder: 'Jag vet att det går bra om jag...' },
          { id: 'ob3-q3', text: 'Vilka utmaningar förväntar du dig och hur ska du hantera dem?', placeholder: 'Jag tror det kan vara svårt att... Jag ska hantera det genom att...' }
        ]
      }
    ]
  },
  // === NYA ÖVNINGAR - APRIL 2026 ===
  {
    id: 'ai-jobbsokning',
    title: 'Använd AI smart i jobbsökningen',
    description: 'Lär dig använda AI-verktyg som ChatGPT för att förbättra CV, personliga brev och intervjuförberedelser.',
    icon: Brain,
    category: 'Digital närvaro',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'AI för CV och personligt brev',
        description: 'Använd AI för att förbättra dina ansökningshandlingar.',
        questions: [
          { id: 'ai1-q1', text: 'Vilka delar av ditt CV skulle du vilja ha hjälp att förbättra? (Sammanfattning, formuleringar, nyckelord)', placeholder: 'Jag skulle vilja förbättra...' },
          { id: 'ai1-q2', text: 'Skriv en prompt till AI för att få hjälp med din profiltext. Inkludera din bakgrund och vilken roll du söker.', placeholder: 'Hjälp mig skriva en profiltext för mitt CV. Jag har erfarenhet av... och söker jobb som...' },
          { id: 'ai1-q3', text: 'Hur kan du säkerställa att texten fortfarande låter som dig och inte som en robot?', placeholder: 'Jag ska anpassa genom att...' }
        ]
      },
      {
        id: 2,
        title: 'AI för intervjuförberedelser',
        description: 'Öva intervjufrågor med AI.',
        questions: [
          { id: 'ai2-q1', text: 'Vilka intervjufrågor vill du öva på? Lista 5 frågor du är osäker på.', placeholder: '1. Berätta om dig själv\n2. Varför ska vi anställa dig?\n3...' },
          { id: 'ai2-q2', text: 'Skriv en prompt för att få AI att agera som intervjuare för en specifik roll.', placeholder: 'Agera som en rekryterare som intervjuar mig för en tjänst som...' },
          { id: 'ai2-q3', text: 'Hur kan du använda AI för att researcha företaget du ska på intervju hos?', placeholder: 'Jag kan be AI sammanfatta...' }
        ]
      },
      {
        id: 3,
        title: 'AI-etik och begränsningar',
        description: 'Förstå när AI hjälper och när du bör vara försiktig.',
        questions: [
          { id: 'ai3-q1', text: 'Vilka risker finns med att använda AI i jobbsökningen? (Plagiering, opersonligt, fel information)', placeholder: 'Riskerna inkluderar...' },
          { id: 'ai3-q2', text: 'Hur ska du granska och verifiera det AI producerar?', placeholder: 'Jag ska alltid...' },
          { id: 'ai3-q3', text: 'Vilka delar av jobbsökningen bör du INTE lämna till AI?', placeholder: 'Jag ska inte låta AI...' }
        ]
      }
    ]
  },
  {
    id: 'bemanningsforetag',
    title: 'Jobba med bemanningsföretag',
    description: 'Förstå hur bemanningsbranschen fungerar och maximera dina chanser att få uppdrag.',
    icon: Building2,
    category: 'Jobbsökning',
    duration: '20-30 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Förstå bemanningsbranschen',
        description: 'Lär dig hur bemanningsföretag fungerar.',
        questions: [
          { id: 'bem1-q1', text: 'Vilka bemanningsföretag finns inom din bransch? Lista minst 5 stycken.', placeholder: '1. Manpower\n2. Adecco\n3. Academic Work\n4...' },
          { id: 'bem1-q2', text: 'Vilka fördelar och nackdelar ser du med att jobba via bemanning?', placeholder: 'Fördelar: Snabbt in på arbetsmarknaden, prova olika arbetsplatser...\nNackdelar:...' },
          { id: 'bem1-q3', text: 'Vilken typ av uppdrag söker du? (Kortvarigt, långvarigt, heltid, deltid)', placeholder: 'Jag söker främst...' }
        ]
      },
      {
        id: 2,
        title: 'Registrera dig rätt',
        description: 'Optimera din profil hos bemanningsföretag.',
        questions: [
          { id: 'bem2-q1', text: 'Vilken information behöver du ha redo när du registrerar dig?', placeholder: 'CV, intyg, referensers kontaktuppgifter, körkort...' },
          { id: 'bem2-q2', text: 'Hur ska du beskriva din tillgänglighet och flexibilitet?', placeholder: 'Jag är tillgänglig för arbete... Jag kan börja med kort varsel...' },
          { id: 'bem2-q3', text: 'Vilka kompetenser ska du lyfta fram för att vara attraktiv för flera typer av uppdrag?', placeholder: 'Jag ska framhäva min...' }
        ]
      },
      {
        id: 3,
        title: 'Bli vald för uppdrag',
        description: 'Öka dina chanser att bli utvald.',
        questions: [
          { id: 'bem3-q1', text: 'Hur ska du hålla kontakten med bemanningsföretagen?', placeholder: 'Jag ska höra av mig regelbundet genom att...' },
          { id: 'bem3-q2', text: 'Vad kan du göra för att sticka ut bland andra kandidater?', placeholder: 'Jag kan sticka ut genom att...' },
          { id: 'bem3-q3', text: 'Hur kan ett bemanningsuppdrag leda till fast anställning?', placeholder: 'Om jag gör ett bra jobb kan det leda till...' }
        ]
      }
    ]
  },
  {
    id: 'alder-jobbsokning',
    title: 'Jobbsökning för 50+',
    description: 'Strategier för dig som är lite äldre på arbetsmarknaden. Vänd erfarenhet till din största fördel.',
    icon: Award,
    category: 'Jobbsökning',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Vänd ålder till fördel',
        description: 'Identifiera och kommunicera dina styrkor.',
        questions: [
          { id: 'ald1-q1', text: 'Vilka unika styrkor har du tack vare din erfarenhet? Lista minst 5.', placeholder: '1. Mognad och stabilitet\n2. Brett kontaktnät\n3. Erfarenhet av många situationer...' },
          { id: 'ald1-q2', text: 'Hur kan du visa att du är uppdaterad och lär dig nya saker?', placeholder: 'Jag kan visa det genom att nämna kurser jag tagit, nya verktyg jag lärt mig...' },
          { id: 'ald1-q3', text: 'Vilka fördomar kan arbetsgivare ha om äldre kandidater och hur bemöter du dem?', placeholder: 'De kan tro att... Jag bemöter det genom att visa...' }
        ]
      },
      {
        id: 2,
        title: 'Anpassa ditt CV',
        description: 'Modernisera utan att dölja din erfarenhet.',
        questions: [
          { id: 'ald2-q1', text: 'Hur långt tillbaka ska du lista arbetslivserfarenhet? Vilka jobb är mest relevanta?', placeholder: 'Jag fokuserar på de senaste 15 åren och lyfter fram...' },
          { id: 'ald2-q2', text: 'Behöver du uppdatera din digitala kompetens? Vilka verktyg bör du lära dig?', placeholder: 'Jag borde lära mig mer om...' },
          { id: 'ald2-q3', text: 'Hur ska du beskriva gammal erfarenhet på ett modernt sätt?', placeholder: 'Istället för att skriva... skriver jag...' }
        ]
      },
      {
        id: 3,
        title: 'Nätverk och strategi',
        description: 'Använd ditt nätverk strategiskt.',
        questions: [
          { id: 'ald3-q1', text: 'Vilka i ditt nätverk kan hjälpa dig hitta jobb? Lista minst 10 kontakter.', placeholder: '1. Gamla kollegor\n2. Branschbekanta\n3...' },
          { id: 'ald3-q2', text: 'Vilka branscher eller företag värdesätter erfarenhet extra högt?', placeholder: 'Jag tror att...' },
          { id: 'ald3-q3', text: 'Är du öppen för mentorskap, konsultuppdrag eller deltid som väg in?', placeholder: 'Ja, jag skulle kunna tänka mig...' }
        ]
      }
    ]
  },
  {
    id: 'konflikthantering',
    title: 'Hantera konflikter på arbetsplatsen',
    description: 'Lär dig förebygga, hantera och lösa konflikter på jobbet på ett konstruktivt sätt.',
    icon: Handshake,
    category: 'Karriärutveckling',
    duration: '25-35 min',
    difficulty: 'Utmanande',
    steps: [
      {
        id: 1,
        title: 'Förstå konflikter',
        description: 'Identifiera olika typer av konflikter och deras orsaker.',
        questions: [
          { id: 'kon1-q1', text: 'Beskriv en konflikt du upplevt på en arbetsplats. Vad handlade den om?', placeholder: 'Det var en situation där...' },
          { id: 'kon1-q2', text: 'Vilka var de underliggande orsakerna till konflikten?', placeholder: 'Orsakerna var troligen...' },
          { id: 'kon1-q3', text: 'Hur brukar du reagera när det uppstår konflikter? (Undvika, konfrontera, kompromissa)', placeholder: 'Jag brukar...' }
        ]
      },
      {
        id: 2,
        title: 'Kommunikation i konflikt',
        description: 'Lär dig kommunicera konstruktivt.',
        questions: [
          { id: 'kon2-q1', text: 'Hur kan du framföra kritik utan att den andra personen blir defensiv?', placeholder: 'Jag kan använda jag-budskap som...' },
          { id: 'kon2-q2', text: 'Vad innebär aktivt lyssnande och hur kan du öva på det?', placeholder: 'Aktivt lyssnande innebär att...' },
          { id: 'kon2-q3', text: 'Skriv ett exempel på hur du omformulerar en anklagelse till ett konstruktivt samtal.', placeholder: 'Istället för "Du gör alltid fel" kan jag säga...' }
        ]
      },
      {
        id: 3,
        title: 'Lösning och förebyggande',
        description: 'Hitta lösningar och förebygg framtida konflikter.',
        questions: [
          { id: 'kon3-q1', text: 'Vilka strategier finns för att lösa konflikter? (Kompromiss, samarbete, medling)', placeholder: 'Man kan lösa konflikter genom att...' },
          { id: 'kon3-q2', text: 'Hur kan du förebygga konflikter genom tydlig kommunikation?', placeholder: 'Jag kan förebygga genom att...' },
          { id: 'kon3-q3', text: 'När bör du involvera en chef eller HR i en konflikt?', placeholder: 'Jag bör involvera andra när...' }
        ]
      }
    ]
  },
  {
    id: 'eget-foretag-start',
    title: 'Starta eget – är det för dig?',
    description: 'Utforska om egenföretagande passar dig och ta de första stegen mot att starta eget.',
    icon: Lightbulb,
    category: 'Karriärutveckling',
    duration: '30-40 min',
    difficulty: 'Utmanande',
    steps: [
      {
        id: 1,
        title: 'Passar egenföretagande dig?',
        description: 'Utvärdera om du har rätt förutsättningar.',
        questions: [
          { id: 'eg1-q1', text: 'Vilka egenskaper har framgångsrika företagare? Vilka av dessa har du?', placeholder: 'Framgångsrika företagare är... Jag har...' },
          { id: 'eg1-q2', text: 'Vad motiverar dig att vilja starta eget? Vad vill du undvika/uppnå?', placeholder: 'Jag vill starta eget för att...' },
          { id: 'eg1-q3', text: 'Vilka risker ser du med att starta eget? Hur skulle du hantera dem?', placeholder: 'Riskerna är... Jag skulle hantera dem genom...' }
        ]
      },
      {
        id: 2,
        title: 'Din affärsidé',
        description: 'Utveckla och testa din idé.',
        questions: [
          { id: 'eg2-q1', text: 'Vad skulle du erbjuda? Beskriv din produkt eller tjänst.', placeholder: 'Jag skulle erbjuda...' },
          { id: 'eg2-q2', text: 'Vem är din målgrupp? Vilka behov löser du för dem?', placeholder: 'Min målgrupp är... De behöver...' },
          { id: 'eg2-q3', text: 'Finns det konkurrenter? Vad skulle skilja dig från dem?', placeholder: 'Mina konkurrenter är... Jag skulle skilja mig genom...' }
        ]
      },
      {
        id: 3,
        title: 'Praktiska steg',
        description: 'Vad behöver du göra för att komma igång?',
        questions: [
          { id: 'eg3-q1', text: 'Vilken företagsform passar dig? (Enskild firma, AB, handelsbolag)', placeholder: 'Jag tror att... passar mig för att...' },
          { id: 'eg3-q2', text: 'Hur ska du finansiera starten? Vilka kostnader förväntar du dig?', placeholder: 'Jag planerar att finansiera genom... Kostnaderna inkluderar...' },
          { id: 'eg3-q3', text: 'Vilka resurser och stöd finns för dig som vill starta eget?', placeholder: 'Jag kan få hjälp från Nyföretagarcentrum, Almi...' }
        ]
      }
    ]
  },
  {
    id: 'kommunikation-arbetsplats',
    title: 'Professionell kommunikation',
    description: 'Förbättra din skriftliga och muntliga kommunikation på arbetsplatsen.',
    icon: MessageCircle,
    category: 'Karriärutveckling',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Skriftlig kommunikation',
        description: 'Skriv tydliga och professionella meddelanden.',
        questions: [
          { id: 'kom1-q1', text: 'Hur strukturerar du ett professionellt e-postmeddelande? Vilka delar ska ingå?', placeholder: 'Ett bra mejl innehåller: tydlig ämnesrad, hälsning, syfte...' },
          { id: 'kom1-q2', text: 'Skriv ett exempel på ett mejl där du ber om hjälp med något.', placeholder: 'Hej [namn],\n\nJag hoppas du har det bra...' },
          { id: 'kom1-q3', text: 'Vilka vanliga misstag bör du undvika i skriftlig kommunikation?', placeholder: 'Jag bör undvika...' }
        ]
      },
      {
        id: 2,
        title: 'Muntlig kommunikation',
        description: 'Kommunicera tydligt i samtal och möten.',
        questions: [
          { id: 'kom2-q1', text: 'Hur förbereder du dig inför ett viktigt samtal eller möte?', placeholder: 'Jag förbereder mig genom att...' },
          { id: 'kom2-q2', text: 'Hur kan du vara tydlig utan att vara otrevlig när du har en avvikande åsikt?', placeholder: 'Jag kan säga något som...' },
          { id: 'kom2-q3', text: 'Hur ger du och tar emot feedback på ett konstruktivt sätt?', placeholder: 'När jag ger feedback säger jag... När jag får feedback...' }
        ]
      },
      {
        id: 3,
        title: 'Digital kommunikation',
        description: 'Navigera kommunikation i digitala kanaler.',
        questions: [
          { id: 'kom3-q1', text: 'Vilka regler gäller för chattverktyg som Slack/Teams på jobbet?', placeholder: 'I arbetsrelaterade chattar bör man...' },
          { id: 'kom3-q2', text: 'Hur balanserar du snabbhet med eftertänksamhet i digital kommunikation?', placeholder: 'Jag balanserar genom att...' },
          { id: 'kom3-q3', text: 'När är det bättre att ringa eller ha ett möte istället för att skriva?', placeholder: 'Det är bättre att prata när...' }
        ]
      }
    ]
  },
  {
    id: 'kreativt-jobbsokande',
    title: 'Kreativa metoder för jobbsökning',
    description: 'Tänk utanför boxen och hitta jobb på okonventionella sätt.',
    icon: Sparkles,
    category: 'Jobbsökning',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Hitta dolda jobb',
        description: 'De flesta jobb annonseras aldrig – så hittar du dem.',
        questions: [
          { id: 'kre1-q1', text: 'Vad är den "dolda arbetsmarknaden" och varför finns den?', placeholder: 'Den dolda arbetsmarknaden är...' },
          { id: 'kre1-q2', text: 'Hur kan du ta kontakt med företag som inte annonserar just nu?', placeholder: 'Jag kan kontakta dem genom att...' },
          { id: 'kre1-q3', text: 'Skriv ett utkast till ett "spontanansökan"-mejl till ett företag du är intresserad av.', placeholder: 'Hej,\n\nJag skriver till er för att...' }
        ]
      },
      {
        id: 2,
        title: 'Stick ut från mängden',
        description: 'Kreativa sätt att få uppmärksamhet.',
        questions: [
          { id: 'kre2-q1', text: 'Vilka kreativa metoder har du hört talas om? (Video-CV, projekt, annonskampanj)', placeholder: 'Jag har hört om...' },
          { id: 'kre2-q2', text: 'Vad skulle du kunna skapa för att visa din kompetens? (Portfolio, demo, case study)', placeholder: 'Jag skulle kunna skapa...' },
          { id: 'kre2-q3', text: 'Finns det något unikt med dig som du kan använda för att sticka ut?', placeholder: 'Det unika med mig är...' }
        ]
      },
      {
        id: 3,
        title: 'Bygg ditt varumärke',
        description: 'Bli känd för det du kan.',
        questions: [
          { id: 'kre3-q1', text: 'Hur kan du dela med dig av din kunskap online? (Blogg, LinkedIn, podcast)', placeholder: 'Jag kan dela kunskap genom att...' },
          { id: 'kre3-q2', text: 'Vilka evenemang eller communities kan du engagera dig i för att synas?', placeholder: 'Jag kan delta i...' },
          { id: 'kre3-q3', text: 'Vad vill du att folk ska tänka när de hör ditt namn?', placeholder: 'Jag vill att de ska tänka...' }
        ]
      }
    ]
  },
  {
    id: 'sasongsjobb',
    title: 'Hitta och lyckas med säsongsjobb',
    description: 'Strategier för att hitta säsongsarbete och använda det som språngbräda i karriären.',
    icon: Calendar,
    category: 'Jobbsökning',
    duration: '20-25 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Hitta säsongsjobb',
        description: 'Var finns jobben och när ska du söka?',
        questions: [
          { id: 'sas1-q1', text: 'Vilka branscher har säsongsjobb? Lista minst 5 exempel.', placeholder: '1. Turism (sommar)\n2. Detaljhandel (jul)\n3. Jordbruk...' },
          { id: 'sas1-q2', text: 'När bör du börja söka säsongsjobb? (Hur långt innan säsongen)', placeholder: 'För sommarjobb bör jag söka redan i...' },
          { id: 'sas1-q3', text: 'Vilka säsongsjobb skulle passa dig och din situation?', placeholder: 'Jag skulle passa för...' }
        ]
      },
      {
        id: 2,
        title: 'Ansökan och intervju',
        description: 'Sälj in dig för tillfälliga tjänster.',
        questions: [
          { id: 'sas2-q1', text: 'Vilka egenskaper värderas extra högt för säsongsjobb?', placeholder: 'Flexibilitet, snabbhet att lära, uthållighet...' },
          { id: 'sas2-q2', text: 'Hur visar du att du är pålitlig och kommer att stanna hela säsongen?', placeholder: 'Jag kan visa det genom att...' },
          { id: 'sas2-q3', text: 'Hur hanterar du frågan om vad du ska göra efter säsongen?', placeholder: 'Jag säger att...' }
        ]
      },
      {
        id: 3,
        title: 'Säsongsjobb som karriärsteg',
        description: 'Använd säsongsjobb strategiskt.',
        questions: [
          { id: 'sas3-q1', text: 'Hur kan ett säsongsjobb leda till fast anställning?', placeholder: 'Genom att göra ett bra jobb kan jag...' },
          { id: 'sas3-q2', text: 'Vilka kontakter och erfarenheter kan du få under säsongen?', placeholder: 'Jag kan få erfarenhet av... och kontakt med...' },
          { id: 'sas3-q3', text: 'Hur ska du dokumentera din erfarenhet för framtida jobbsökningar?', placeholder: 'Jag ska spara...' }
        ]
      }
    ]
  },

  // === NYA ÖVNINGAR: SJÄLVKÄNNEDOM ===
  {
    id: 'vardegrunder',
    title: 'Upptäck dina värderingar',
    description: 'Identifiera och rangordna dina viktigaste värderingar för att hitta en arbetsplats där du trivs.',
    icon: Compass,
    category: 'Självkännedom',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Utforska värderingar',
        description: 'Vad är viktigt för dig i arbetslivet?',
        questions: [
          { id: 'vard1-q1', text: 'Lista 10 saker som är viktiga för dig i ett jobb (t.ex. frihet, trygghet, kreativitet).', placeholder: '1. Trygghet\n2. Flexibilitet\n3. Möjlighet att hjälpa andra...' },
          { id: 'vard1-q2', text: 'Rangordna dina topp 5 värderingar. Vilka kan du absolut inte kompromissa med?', placeholder: '1. (Viktigast)\n2. ...' },
          { id: 'vard1-q3', text: 'Tänk på ditt bästa jobb eller arbetsuppgift. Vilka värderingar uppfylldes där?', placeholder: 'I det jobbet fick jag...' }
        ]
      },
      {
        id: 2,
        title: 'Värderingar i praktiken',
        description: 'Koppla dina värderingar till konkreta jobbval.',
        questions: [
          { id: 'vard2-q1', text: 'Hur kan du undersöka om ett företag delar dina värderingar?', placeholder: 'Jag kan kolla deras webbplats, läsa recensioner...' },
          { id: 'vard2-q2', text: 'Vilka frågor kan du ställa på en intervju för att förstå arbetsplatsens kultur?', placeholder: '1. Hur ser en typisk dag ut?\n2. Hur hanterar ni...' },
          { id: 'vard2-q3', text: 'Om du måste välja mellan två jobb – hur avgör dina värderingar valet?', placeholder: 'Jag skulle välja det jobb som...' }
        ]
      },
      {
        id: 3,
        title: 'Värderingskarta',
        description: 'Skapa din personliga värderingskarta.',
        questions: [
          { id: 'vard3-q1', text: 'Sammanfatta dina topp 3 värderingar i en mening var. Varför är de viktiga?', placeholder: '1. Frihet: Jag behöver kunna påverka mitt schema...' },
          { id: 'vard3-q2', text: 'Vilka yrken eller branscher matchar dina värderingar?', placeholder: 'Med mina värderingar passar jag bra inom...' },
          { id: 'vard3-q3', text: 'Vad är ditt icke-förhandlingsbara minimum? Vad måste ett jobb erbjuda?', placeholder: 'Jag måste ha...' }
        ]
      }
    ]
  },
  {
    id: 'feedbackhantering',
    title: 'Ta emot och ge feedback',
    description: 'Utveckla din förmåga att hantera kritik konstruktivt och ge feedback som hjälper andra.',
    icon: MessageCircle,
    category: 'Självkännedom',
    duration: '20-30 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Ta emot feedback',
        description: 'Lär dig hantera kritik utan att gå i försvar.',
        questions: [
          { id: 'feed1-q1', text: 'Hur reagerar du vanligtvis när du får kritik? Beskriv dina känslor och beteende.', placeholder: 'När jag får kritik brukar jag känna...' },
          { id: 'feed1-q2', text: 'Tänk på senaste gången du fick negativ feedback. Vad kunde du lära dig av den?', placeholder: 'Jag fick höra att... och jag lärde mig...' },
          { id: 'feed1-q3', text: 'Hur kan du träna på att se feedback som en gåva istället för ett angrepp?', placeholder: 'Jag kan påminna mig om att...' }
        ]
      },
      {
        id: 2,
        title: 'Ge konstruktiv feedback',
        description: 'Öva på att ge feedback som hjälper andra växa.',
        questions: [
          { id: 'feed2-q1', text: 'Vad är skillnaden mellan kritik och konstruktiv feedback? Ge exempel.', placeholder: 'Kritik: "Du gjorde fel"\nKonstruktiv: "Nästa gång kan du..."' },
          { id: 'feed2-q2', text: 'Använd "sandwich-metoden" – positiv-negativ-positiv. Skriv ett exempel.', placeholder: 'Du är bra på X. En förbättring vore Y. Jag uppskattar Z.' },
          { id: 'feed2-q3', text: 'Hur kan du säkerställa att din feedback tas emot väl?', placeholder: 'Jag kan välja rätt tillfälle, vara specifik...' }
        ]
      },
      {
        id: 3,
        title: 'Feedback i jobbsökning',
        description: 'Använd feedback för att förbättra dina chanser.',
        questions: [
          { id: 'feed3-q1', text: 'Hur kan du be om feedback efter ett avslag på jobbansökan?', placeholder: 'Hej, tack för besked. Jag undrar om ni har möjlighet att...' },
          { id: 'feed3-q2', text: 'Vem i ditt nätverk kan ge dig ärlig feedback på ditt CV eller ansökningar?', placeholder: 'Jag kan fråga...' },
          { id: 'feed3-q3', text: 'Hur ska du använda feedbacken för att förbättra din nästa ansökan?', placeholder: 'Jag kommer att...' }
        ]
      }
    ]
  },
  {
    id: 'drivkrafter',
    title: 'Hitta din inre motivation',
    description: 'Utforska vad som verkligen driver dig och hur du kan använda det i din karriär.',
    icon: Rocket,
    category: 'Självkännedom',
    duration: '25-35 min',
    difficulty: 'Utmanande',
    steps: [
      {
        id: 1,
        title: 'Identifiera dina drivkrafter',
        description: 'Vad får dig att vilja prestera och utvecklas?',
        questions: [
          { id: 'driv1-q1', text: 'När känner du dig mest motiverad? Beskriv situationen i detalj.', placeholder: 'Jag känner mig mest motiverad när...' },
          { id: 'driv1-q2', text: 'Är du mest driven av yttre belöningar (lön, status) eller inre (mening, lärande)?', placeholder: 'Jag drivs mest av... för att...' },
          { id: 'driv1-q3', text: 'Vad skulle du göra om pengar inte spelade roll? Vad säger det om dina drivkrafter?', placeholder: 'Om jag inte behövde tänka på pengar skulle jag...' }
        ]
      },
      {
        id: 2,
        title: 'Drivkrafter och energi',
        description: 'Förstå kopplingen mellan motivation och energi.',
        questions: [
          { id: 'driv2-q1', text: 'Vilka arbetsuppgifter ger dig energi? Vilka dränerar dig?', placeholder: 'Ger energi: ...\nDränerar: ...' },
          { id: 'driv2-q2', text: 'Hur kan du få mer av det som motiverar dig i ditt framtida jobb?', placeholder: 'Jag kan söka roller där...' },
          { id: 'driv2-q3', text: 'Vad behöver du för att hålla motivationen uppe under motgångar?', placeholder: 'Jag behöver...' }
        ]
      },
      {
        id: 3,
        title: 'Använd dina drivkrafter',
        description: 'Kommunicera din motivation till arbetsgivare.',
        questions: [
          { id: 'driv3-q1', text: 'Hur kan du visa din motivation i en jobbansökan?', placeholder: 'Jag kan skriva om...' },
          { id: 'driv3-q2', text: 'Skriv ett svar på frågan "Vad motiverar dig i ditt arbete?"', placeholder: 'Det som driver mig är...' },
          { id: 'driv3-q3', text: 'Hur hittar du jobb som matchar dina drivkrafter?', placeholder: 'Jag letar efter företag som...' }
        ]
      }
    ]
  },

  // === NYA ÖVNINGAR: JOBBSÖKNING ===
  {
    id: 'spontanansokningar',
    title: 'Spontanansökningar som fungerar',
    description: 'Lär dig skriva spontanansökningar som öppnar dörrar till den dolda jobbmarknaden.',
    icon: FileSearch,
    category: 'Jobbsökning',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Hitta rätt företag',
        description: 'Identifiera företag värda en spontanansökan.',
        questions: [
          { id: 'spon1-q1', text: 'Lista 5 företag du skulle vilja jobba på som inte har utannonserade tjänster.', placeholder: '1. [Företag A] - passar för att...\n2. ...' },
          { id: 'spon1-q2', text: 'Hur kan du ta reda på vem som är rätt person att kontakta?', placeholder: 'Jag kan söka på LinkedIn efter...' },
          { id: 'spon1-q3', text: 'Vad kan du ta reda på om företagets utmaningar eller tillväxtplaner?', placeholder: 'På deras webbplats/nyheter ser jag att...' }
        ]
      },
      {
        id: 2,
        title: 'Skriva spontanansökan',
        description: 'Formulera en ansökan som sticker ut.',
        questions: [
          { id: 'spon2-q1', text: 'Skriv en öppningsrad som väcker intresse (undvik "Jag vill jobba hos er").', placeholder: 'Er satsning på [X] inspirerade mig att skriva...' },
          { id: 'spon2-q2', text: 'Vilket specifikt problem kan du lösa för företaget? Hur kan du bidra?', placeholder: 'Med min erfarenhet av [X] kan jag hjälpa er att...' },
          { id: 'spon2-q3', text: 'Avsluta med en tydlig call-to-action. Vad vill du att de gör?', placeholder: 'Jag skulle gärna träffas för ett kort samtal...' }
        ]
      },
      {
        id: 3,
        title: 'Följa upp',
        description: 'Öka dina chanser genom strategisk uppföljning.',
        questions: [
          { id: 'spon3-q1', text: 'Hur lång tid bör du vänta innan du följer upp? Hur gör du det?', placeholder: 'Efter [X] dagar ringer/mailar jag...' },
          { id: 'spon3-q2', text: 'Skriv ett kort uppföljningsmeddelande.', placeholder: 'Hej! Jag skrev till er förra veckan om...' },
          { id: 'spon3-q3', text: 'Om du inte får svar – vad gör du då?', placeholder: 'Jag kan försöka en annan kanal, t.ex...' }
        ]
      }
    ]
  },
  {
    id: 'jobbportaler',
    title: 'Maximera jobbportaler',
    description: 'Använd Platsbanken, LinkedIn Jobs och Indeed effektivt för att hitta fler relevanta jobb.',
    icon: Monitor,
    category: 'Jobbsökning',
    duration: '20-30 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Optimera dina sökningar',
        description: 'Hitta fler jobb med bättre sökord.',
        questions: [
          { id: 'port1-q1', text: 'Vilka jobbportaler använder du? Vilka saknas?', placeholder: 'Jag använder: Platsbanken, LinkedIn...\nJag saknar: ...' },
          { id: 'port1-q2', text: 'Lista 5 olika titlar/sökord för din typ av jobb.', placeholder: '1. Kundtjänstmedarbetare\n2. Customer Service\n3. Support...' },
          { id: 'port1-q3', text: 'Hur kan du använda filter för att hitta mer relevanta jobb?', placeholder: 'Jag filtrerar på: plats, heltid/deltid...' }
        ]
      },
      {
        id: 2,
        title: 'Skapa bevakningar',
        description: 'Låt jobben komma till dig.',
        questions: [
          { id: 'port2-q1', text: 'Vilka bevakningar (job alerts) har du satt upp? Lista dem.', placeholder: 'På Platsbanken: [sökord]\nPå LinkedIn: ...' },
          { id: 'port2-q2', text: 'Hur ofta vill du få notiser? Dagligen, veckovis?', placeholder: 'Jag vill ha dagliga mail för...' },
          { id: 'port2-q3', text: 'Sätt upp 3 nya bevakningar nu – vilka blir det?', placeholder: '1. [Portal]: [Sökord]\n2. ...' }
        ]
      },
      {
        id: 3,
        title: 'Sök smart',
        description: 'Tips för att sticka ut bland alla sökande.',
        questions: [
          { id: 'port3-q1', text: 'Varför är det viktigt att söka tidigt när annonser publiceras?', placeholder: 'För att...' },
          { id: 'port3-q2', text: 'Hur kan du se om ett företag ofta annonserar liknande tjänster?', placeholder: 'Jag kan söka på företagsnamnet och se...' },
          { id: 'port3-q3', text: 'Skapa en rutin: när och hur ofta ska du kolla jobbportaler?', placeholder: 'Varje morgon klockan X ska jag...' }
        ]
      }
    ]
  },
  {
    id: 'referenshantering',
    title: 'Förbered dina referenser',
    description: 'Välj rätt referenser och förbered dem så de stärker din ansökan.',
    icon: UserCheck,
    category: 'Jobbsökning',
    duration: '20-25 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Välj dina referenser',
        description: 'Vilka personer stärker din ansökan?',
        questions: [
          { id: 'ref1-q1', text: 'Lista 3-5 personer som kan vara dina referenser. Hur känner du dem?', placeholder: '1. [Namn] - tidigare chef på...\n2. ...' },
          { id: 'ref1-q2', text: 'Vad kan varje person berätta om dig? Vilka styrkor kan de bekräfta?', placeholder: '[Namn 1] kan berätta om min förmåga att...' },
          { id: 'ref1-q3', text: 'Om du saknar arbetsreferenser – vilka andra kan du använda?', placeholder: 'Lärare, volontärarbete, föreningar...' }
        ]
      },
      {
        id: 2,
        title: 'Förbered referenserna',
        description: 'Ge dina referenser de bästa förutsättningarna.',
        questions: [
          { id: 'ref2-q1', text: 'Hur ska du be om lov att använda någon som referens?', placeholder: 'Hej [Namn], jag söker jobb och undrar om...' },
          { id: 'ref2-q2', text: 'Vilken information ska du ge dina referenser inför att de blir kontaktade?', placeholder: 'Jobbet jag söker, mina styrkor att lyfta...' },
          { id: 'ref2-q3', text: 'Hur tackar du dina referenser efteråt?', placeholder: 'Jag skickar ett tack och berättar hur det gick...' }
        ]
      },
      {
        id: 3,
        title: 'Hantera utmanande situationer',
        description: 'Vad gör du om referenserna är svåra?',
        questions: [
          { id: 'ref3-q1', text: 'Om du slutat på dåliga termer med en chef – hur hanterar du det?', placeholder: 'Jag kan använda en kollega istället, eller förklara...' },
          { id: 'ref3-q2', text: 'Vad gör du om en referens säger nej?', placeholder: 'Jag tackar och frågar om de kan rekommendera någon annan...' },
          { id: 'ref3-q3', text: 'Hur kan du stärka svaga eller få referenser?', placeholder: 'Jag kan ta volontärjobb, praktik...' }
        ]
      }
    ]
  },

  // === NYA ÖVNINGAR: NÄTVERKANDE ===
  {
    id: 'informationsintervjuer',
    title: 'Boka informationsintervjuer',
    description: 'Lär dig kontakta yrkesverksamma för att få insider-kunskap om branscher och yrken.',
    icon: Phone,
    category: 'Nätverkande',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Hitta rätt personer',
        description: 'Vem kan ge dig värdefull information?',
        questions: [
          { id: 'info1-q1', text: 'Vilka yrken eller branscher vill du lära dig mer om?', placeholder: 'Jag är nyfiken på...' },
          { id: 'info1-q2', text: 'Hur kan du hitta personer som jobbar med detta? (LinkedIn, nätverk, etc.)', placeholder: 'Jag kan söka på LinkedIn efter...' },
          { id: 'info1-q3', text: 'Lista 3 specifika personer du skulle vilja prata med.', placeholder: '1. [Namn] på [Företag]\n2. ...' }
        ]
      },
      {
        id: 2,
        title: 'Boka mötet',
        description: 'Skriv ett meddelande som får svar.',
        questions: [
          { id: 'info2-q1', text: 'Skriv ett kort meddelande där du ber om 20 minuter av deras tid.', placeholder: 'Hej [Namn]! Jag utforskar karriärvägar inom...' },
          { id: 'info2-q2', text: 'Varför ska de vilja prata med dig? Vad kan du erbjuda?', placeholder: 'Jag kan erbjuda ett nytt perspektiv, dela min resa...' },
          { id: 'info2-q3', text: 'Hur följer du upp om du inte får svar?', placeholder: 'Efter en vecka skickar jag...' }
        ]
      },
      {
        id: 3,
        title: 'Genomför intervjun',
        description: 'Förbered frågor och gör ett bra intryck.',
        questions: [
          { id: 'info3-q1', text: 'Lista 5 frågor du vill ställa under mötet.', placeholder: '1. Hur ser en typisk arbetsdag ut?\n2. Vad önskar du att du visste innan du började?' },
          { id: 'info3-q2', text: 'Hur kan du avsluta mötet på ett sätt som öppnar för framtida kontakt?', placeholder: 'Jag tackar och frågar om jag får höra av mig igen...' },
          { id: 'info3-q3', text: 'Vad gör du efter mötet för att bibehålla relationen?', placeholder: 'Jag skickar ett tack inom 24 timmar och...' }
        ]
      }
    ]
  },
  {
    id: 'alumnnatverk',
    title: 'Aktivera ditt alumnnätverk',
    description: 'Använd dina tidigare skolor, kurser och arbetsplatser för att hitta kontakter och möjligheter.',
    icon: GraduationCap,
    category: 'Nätverkande',
    duration: '20-25 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Kartlägg dina alumnnätverk',
        description: 'Vilka nätverk har du tillgång till?',
        questions: [
          { id: 'alum1-q1', text: 'Lista alla skolor, utbildningar och arbetsplatser du har tillhört.', placeholder: '1. Universitet/Högskola: ...\n2. Gymnasium: ...\n3. Tidigare arbetsgivare: ...' },
          { id: 'alum1-q2', text: 'Finns det Facebook-grupper, LinkedIn-grupper eller föreningar för dessa?', placeholder: 'Ja, det finns en alumngrupp för...' },
          { id: 'alum1-q3', text: 'Vilka personer kommer du ihåg som du tappat kontakten med?', placeholder: 'Klasskamrat: [Namn], kollega: [Namn]...' }
        ]
      },
      {
        id: 2,
        title: 'Återknyt kontakten',
        description: 'Hitta och kontakta gamla bekanta.',
        questions: [
          { id: 'alum2-q1', text: 'Skriv ett meddelande för att återknyta kontakten med en gammal bekant.', placeholder: 'Hej [Namn]! Det var länge sen. Jag såg att du numera jobbar med...' },
          { id: 'alum2-q2', text: 'Vad kan ni ha gemensamt att prata om? Hur gör du det naturligt?', placeholder: 'Vi kan prata om tiden vi jobbade/studerade ihop...' },
          { id: 'alum2-q3', text: 'Hur kan du hjälpa dem, inte bara be om hjälp?', placeholder: 'Jag kan dela en artikel om..., tipsa om...' }
        ]
      },
      {
        id: 3,
        title: 'Aktivera nätverket',
        description: 'Använd ditt alumnnätverk strategiskt.',
        questions: [
          { id: 'alum3-q1', text: 'Vilka 3 personer från ditt alumnnätverk ska du kontakta denna månad?', placeholder: '1. [Namn] - jobbar på [Företag]\n2. ...' },
          { id: 'alum3-q2', text: 'Hur kan du delta mer aktivt i alumngrupper och evenemang?', placeholder: 'Jag kan gå på träffar, kommentera i grupper...' },
          { id: 'alum3-q3', text: 'Vad vill du att ditt alumnnätverk ska veta om din jobbsökning?', placeholder: 'Jag söker jobb inom... och är öppen för...' }
        ]
      }
    ]
  },
  {
    id: 'digitalt-natverkande',
    title: 'Nätverka online effektivt',
    description: 'Bygg relationer och hitta möjligheter genom sociala medier och digitala communities.',
    icon: UsersRound,
    category: 'Nätverkande',
    duration: '25-30 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Hitta relevanta communities',
        description: 'Var finns dina framtida kollegor och arbetsgivare online?',
        questions: [
          { id: 'dnat1-q1', text: 'Vilka online-communities finns för din bransch? (Facebook, Discord, Slack, etc.)', placeholder: 'Facebook-grupper: ...\nDiscord-servrar: ...\nSlack: ...' },
          { id: 'dnat1-q2', text: 'Vilka hashtags eller konton på X/Twitter bör du följa?', placeholder: '#jobbsökning #karriär ...' },
          { id: 'dnat1-q3', text: 'Finns det branschforum eller nyhetsbrev du bör prenumerera på?', placeholder: 'Forum: ...\nNyhetsbrev: ...' }
        ]
      },
      {
        id: 2,
        title: 'Bygg din närvaro',
        description: 'Bli synlig och bidra till communityn.',
        questions: [
          { id: 'dnat2-q1', text: 'Hur kan du bidra med värde i dessa communities? (Tips, frågor, erfarenheter)', placeholder: 'Jag kan dela mina erfarenheter av...' },
          { id: 'dnat2-q2', text: 'Skriv ett intro-inlägg för en ny grupp du vill gå med i.', placeholder: 'Hej alla! Jag heter... och jag är här för att...' },
          { id: 'dnat2-q3', text: 'Hur ofta ska du vara aktiv för att bygga synlighet?', placeholder: 'Jag ska kommentera/posta X gånger per vecka...' }
        ]
      },
      {
        id: 3,
        title: 'Flytta relationer offline',
        description: 'Gå från digital kontakt till verklig relation.',
        questions: [
          { id: 'dnat3-q1', text: 'Hur kan du ta steget från kommentarer till direktmeddelande?', placeholder: 'Efter att ha interagerat några gånger kan jag skriva...' },
          { id: 'dnat3-q2', text: 'Hur föreslår du ett videosamtal eller fysiskt möte?', placeholder: 'Det vore kul att höras mer. Har du tid för en fika/samtal?' },
          { id: 'dnat3-q3', text: 'Vilka digitala kontakter ska du försöka träffa personligen?', placeholder: '1. [Namn] som jag pratat med i [Grupp]\n2. ...' }
        ]
      }
    ]
  },

  // === NYA ÖVNINGAR: DIGITAL NÄRVARO ===
  {
    id: 'portfolio',
    title: 'Skapa en digital portfolio',
    description: 'Visa upp ditt arbete och dina projekt på ett professionellt sätt online.',
    icon: Laptop,
    category: 'Digital närvaro',
    duration: '30-40 min',
    difficulty: 'Utmanande',
    steps: [
      {
        id: 1,
        title: 'Samla dina projekt',
        description: 'Vad ska du visa upp?',
        questions: [
          { id: 'port1-q1', text: 'Lista 5-10 projekt, arbeten eller prestationer du vill visa upp.', placeholder: '1. Projekt X där jag...\n2. Rapport jag skrev om...\n3. Kampanj jag drev...' },
          { id: 'port1-q2', text: 'Vilka bilder, dokument eller länkar har du som visar resultatet?', placeholder: 'Skärmdumpar, PDF:er, länkar...' },
          { id: 'port1-q3', text: 'Vad vill du att besökare ska förstå om dig efter att ha sett din portfolio?', placeholder: 'Att jag är kreativ, strukturerad, resultatorienterad...' }
        ]
      },
      {
        id: 2,
        title: 'Välj plattform',
        description: 'Var ska din portfolio finnas?',
        questions: [
          { id: 'port2-q1', text: 'Vilka portfolioplattformar känner du till? (Notion, Wix, GitHub Pages, Behance)', placeholder: 'Jag vet om...' },
          { id: 'port2-q2', text: 'Vilken plattform passar dina behov bäst? Varför?', placeholder: 'Jag väljer [plattform] för att...' },
          { id: 'port2-q3', text: 'Vad behöver du lära dig för att skapa din portfolio?', placeholder: 'Jag behöver lära mig hur man...' }
        ]
      },
      {
        id: 3,
        title: 'Strukturera innehållet',
        description: 'Planera portfolions upplägg.',
        questions: [
          { id: 'port3-q1', text: 'Vilka sektioner ska din portfolio ha? (Om mig, Projekt, Kontakt, etc.)', placeholder: '1. Startsida med intro\n2. Projekt\n3. Om mig\n4. Kontakt' },
          { id: 'port3-q2', text: 'Skriv en kort "Om mig"-text för din portfolio.', placeholder: 'Jag är en [titel] med passion för...' },
          { id: 'port3-q3', text: 'Hur ska du länka till din portfolio? (CV, LinkedIn, signatur)', placeholder: 'Jag lägger länken i mitt CV, LinkedIn...' }
        ]
      }
    ]
  },
  {
    id: 'googla-mig',
    title: 'Rensa och förbättra dina sökresultat',
    description: 'Kontrollera vad arbetsgivare ser när de googlar ditt namn och förbättra ditt digitala fotavtryck.',
    icon: FileSearch,
    category: 'Digital närvaro',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Googla dig själv',
        description: 'Vad ser arbetsgivare när de söker på dig?',
        questions: [
          { id: 'goog1-q1', text: 'Googla ditt namn i ett privat fönster. Vad kommer upp på första sidan?', placeholder: 'LinkedIn-profil, Facebook, gamla artiklar...' },
          { id: 'goog1-q2', text: 'Finns det något negativt eller oprofessionellt? Vad?', placeholder: 'Ja/Nej. Om ja: ...' },
          { id: 'goog1-q3', text: 'Sök även på bilder – hittar du något olämpligt?', placeholder: 'Ja/Nej. Om ja: ...' }
        ]
      },
      {
        id: 2,
        title: 'Rensa upp',
        description: 'Ta bort eller dölj oönskat innehåll.',
        questions: [
          { id: 'goog2-q1', text: 'Vilka sociala medier har du? Är de inställda på privat?', placeholder: 'Facebook: privat/offentlig\nInstagram: ...' },
          { id: 'goog2-q2', text: 'Vilka gamla inlägg eller bilder bör du ta bort?', placeholder: 'Jag bör ta bort...' },
          { id: 'goog2-q3', text: 'Hur kan du be om att få bort innehåll från andras sidor?', placeholder: 'Jag kontaktar sidan och ber om...' }
        ]
      },
      {
        id: 3,
        title: 'Bygg positiva resultat',
        description: 'Skapa innehåll som rankar bra.',
        questions: [
          { id: 'goog3-q1', text: 'Vilka professionella profiler vill du ska synas? (LinkedIn, portfolio, etc.)', placeholder: 'LinkedIn, min portfolio på...' },
          { id: 'goog3-q2', text: 'Hur kan du förbättra dessa profilers SEO (sökoptimering)?', placeholder: 'Använda hela mitt namn, fylla i all info...' },
          { id: 'goog3-q3', text: 'Kan du publicera något positivt (blogg, artikel, kommentar) som kan ranka?', placeholder: 'Jag kan skriva en artikel på LinkedIn om...' }
        ]
      }
    ]
  },
  {
    id: 'digitalt-personmarke',
    title: 'Bygg ditt digitala personliga varumärke',
    description: 'Skapa en konsekvent och professionell digital identitet som stärker din karriär.',
    icon: Sparkles,
    category: 'Digital närvaro',
    duration: '30-40 min',
    difficulty: 'Utmanande',
    steps: [
      {
        id: 1,
        title: 'Definiera ditt varumärke',
        description: 'Vem är du professionellt?',
        questions: [
          { id: 'dpm1-q1', text: 'Vilka 3 ord vill du att folk associerar med dig professionellt?', placeholder: '1. Pålitlig\n2. Kreativ\n3. Analytisk' },
          { id: 'dpm1-q2', text: 'Vad är din nisch? Vad gör dig unik i din bransch?', placeholder: 'Jag kombinerar X med Y på ett sätt som...' },
          { id: 'dpm1-q3', text: 'Skriv din "personal brand statement" i en mening.', placeholder: 'Jag hjälper [målgrupp] att [uppnå resultat] genom [metod].' }
        ]
      },
      {
        id: 2,
        title: 'Konsekvent närvaro',
        description: 'Samma budskap överallt.',
        questions: [
          { id: 'dpm2-q1', text: 'Vilka plattformar ska du vara aktiv på? Prioritera 2-3.', placeholder: '1. LinkedIn - för nätverkande\n2. X/Twitter - för branschdiskussioner' },
          { id: 'dpm2-q2', text: 'Hur säkerställer du att din bio/beskrivning är konsekvent på alla plattformar?', placeholder: 'Jag kopierar samma grundtext och anpassar längden...' },
          { id: 'dpm2-q3', text: 'Vilken typ av innehåll ska du dela för att stärka ditt varumärke?', placeholder: 'Tips inom mitt område, reflektioner, branschnyheter...' }
        ]
      },
      {
        id: 3,
        title: 'Mät och justera',
        description: 'Följ upp och förbättra.',
        questions: [
          { id: 'dpm3-q1', text: 'Hur kan du mäta om ditt varumärke når fram? (Profilvisningar, kontakter, etc.)', placeholder: 'Jag kollar LinkedIn-statistik varje vecka...' },
          { id: 'dpm3-q2', text: 'Vad ska du posta de närmaste 2 veckorna?', placeholder: 'Vecka 1: Artikel om...\nVecka 2: Tips om...' },
          { id: 'dpm3-q3', text: 'Hur ber du om feedback på din digitala närvaro?', placeholder: 'Jag frågar en kollega/vän om de kan kolla...' }
        ]
      }
    ]
  },

  // === NYA ÖVNINGAR: ARBETSRÄTT ===
  {
    id: 'rattigheter-skyldigheter',
    title: 'Dina rättigheter som arbetssökande',
    description: 'Lär dig om dina rättigheter i rekryteringsprocessen och hur du skyddar dig mot diskriminering.',
    icon: ShieldCheck,
    category: 'Arbetsrätt',
    duration: '20-30 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Grundläggande rättigheter',
        description: 'Vad får och får inte arbetsgivare göra?',
        questions: [
          { id: 'ratt1-q1', text: 'Vilka diskrimineringsgrunder skyddas av svensk lag? Lista dem.', placeholder: 'Kön, ålder, etnicitet, funktionsnedsättning...' },
          { id: 'ratt1-q2', text: 'Vad innebär det att en arbetsgivare bryter mot diskrimineringslagen?', placeholder: 'Det betyder att de inte får fråga om/behandla...' },
          { id: 'ratt1-q3', text: 'Har du upplevt att en arbetsgivare ställt olämpliga frågor? Vad hände?', placeholder: 'Ja/Nej. Om ja: ...' }
        ]
      },
      {
        id: 2,
        title: 'Hantera olämpliga frågor',
        description: 'Vad gör du om intervjuaren frågar något de inte får?',
        questions: [
          { id: 'ratt2-q1', text: 'Vilka frågor FÅR INTE en arbetsgivare ställa? Lista exempel.', placeholder: 'Planerar du att skaffa barn? Vilken religion...' },
          { id: 'ratt2-q2', text: 'Hur kan du svara diplomatiskt om du får en olämplig fråga?', placeholder: 'Jag kan säga: "Jag föredrar att fokusera på..."' },
          { id: 'ratt2-q3', text: 'Vart kan du anmäla diskriminering? Vilka instanser finns?', placeholder: 'Diskrimineringsombudsmannen (DO), facket...' }
        ]
      },
      {
        id: 3,
        title: 'Skydda din information',
        description: 'Vad ska du dela – och vad inte?',
        questions: [
          { id: 'ratt3-q1', text: 'Vilken personlig information behöver du INTE ge i en första ansökan?', placeholder: 'Personnummer, foto, familjeförhållanden...' },
          { id: 'ratt3-q2', text: 'När är det okej att fråga om bakgrundskontroll görs?', placeholder: 'Jag kan fråga om de planerar göra det och varför...' },
          { id: 'ratt3-q3', text: 'Hur skyddar GDPR dig som jobbsökare?', placeholder: 'Företag måste ha mitt samtycke för att...' }
        ]
      }
    ]
  },
  {
    id: 'anstallningsavtal',
    title: 'Förstå ditt anställningsavtal',
    description: 'Lär dig läsa och förstå villkoren i ett anställningsavtal innan du skriver under.',
    icon: Gavel,
    category: 'Arbetsrätt',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Viktiga klausuler',
        description: 'Vad ska du alltid kolla i ett avtal?',
        questions: [
          { id: 'avta1-q1', text: 'Vilka grundläggande villkor ska alltid stå i ett anställningsavtal?', placeholder: 'Lön, arbetstid, uppsägningstid, semester...' },
          { id: 'avta1-q2', text: 'Vad är skillnaden mellan tillsvidareanställning och tidsbegränsad anställning?', placeholder: 'Tillsvidare innebär... Tidsbegränsad betyder...' },
          { id: 'avta1-q3', text: 'Vad innebär en provanställning och hur länge får den vara?', placeholder: 'Provanställning innebär... och får vara max...' }
        ]
      },
      {
        id: 2,
        title: 'Förstå finstilt',
        description: 'Var ligger fällorna?',
        questions: [
          { id: 'avta2-q1', text: 'Vad är en konkurrensklausul? Hur kan den påverka dig?', placeholder: 'Det innebär att jag inte får...' },
          { id: 'avta2-q2', text: 'Vad ska du tänka på gällande övertid och OB-tillägg?', placeholder: 'Jag bör kolla om övertid är inkluderad i lönen...' },
          { id: 'avta2-q3', text: 'Hur fungerar uppsägningstid och vad är rimligt?', placeholder: 'Vanlig uppsägningstid är... och jag bör vara uppmärksam på...' }
        ]
      },
      {
        id: 3,
        title: 'Förhandla villkor',
        description: 'Du kan förhandla mer än du tror.',
        questions: [
          { id: 'avta3-q1', text: 'Vilka villkor är ofta förhandlingsbara?', placeholder: 'Lön, flexibilitet, startdatum, friskvård...' },
          { id: 'avta3-q2', text: 'Hur kan du be om ändringar utan att verka krävande?', placeholder: 'Jag kan säga: "Jag är jätteintresserad, men undrar om..."' },
          { id: 'avta3-q3', text: 'Vem kan hjälpa dig granska ett avtal? (Fack, jurist, etc.)', placeholder: 'Jag kan kontakta mitt fackförbund, Unionen/Kommunal...' }
        ]
      }
    ]
  },
  {
    id: 'fackmedlemskap',
    title: 'Förstå fackets roll',
    description: 'Lär dig vad ett fackförbund kan hjälpa dig med som arbetssökande och anställd.',
    icon: Handshake,
    category: 'Arbetsrätt',
    duration: '15-25 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Vad gör facket?',
        description: 'Grundläggande om fackförbund.',
        questions: [
          { id: 'fack1-q1', text: 'Vad är ett fackförbunds huvudsakliga uppgifter?', placeholder: 'Förhandla löner, stödja medlemmar vid konflikter...' },
          { id: 'fack1-q2', text: 'Vilka förmåner kan du få som fackmedlem?', placeholder: 'A-kassa, juridisk hjälp, försäkringar...' },
          { id: 'fack1-q3', text: 'Vilket fackförbund passar för din bransch?', placeholder: 'Inom min bransch finns...' }
        ]
      },
      {
        id: 2,
        title: 'Facket för arbetssökande',
        description: 'Hur kan facket hjälpa dig nu?',
        questions: [
          { id: 'fack2-q1', text: 'Kan du vara fackmedlem när du är arbetslös? Hur fungerar det?', placeholder: 'Ja, jag kan vara med och betalar då...' },
          { id: 'fack2-q2', text: 'Hur hänger facket ihop med a-kassan?', placeholder: 'A-kassan är separat men facket kan...' },
          { id: 'fack2-q3', text: 'Vilka karriärstöd erbjuder fackförbund? (CV-hjälp, kurser)', placeholder: 'Mitt fackförbund erbjuder...' }
        ]
      },
      {
        id: 3,
        title: 'Ta beslutet',
        description: 'Är fackmedlemskap rätt för dig?',
        questions: [
          { id: 'fack3-q1', text: 'Vad kostar fackmedlemskap och är det värt det för dig?', placeholder: 'Det kostar ca X kr/månad och ger mig...' },
          { id: 'fack3-q2', text: 'Hur ansöker du om medlemskap?', placeholder: 'Jag kan ansöka på deras hemsida...' },
          { id: 'fack3-q3', text: 'Vilka frågor har du om fackförbund som du vill ha svar på?', placeholder: 'Jag undrar om...' }
        ]
      }
    ]
  },

  // === NYA ÖVNINGAR: KARRIÄRUTVECKLING ===
  {
    id: 'karriarskifte',
    title: 'Planera ett karriärskifte',
    description: 'Utforska möjligheten att byta bransch eller yrke och lägg en plan för förändringen.',
    icon: RefreshCw,
    category: 'Karriärutveckling',
    duration: '35-45 min',
    difficulty: 'Utmanande',
    steps: [
      {
        id: 1,
        title: 'Varför byta?',
        description: 'Utforska dina motiv för karriärskifte.',
        questions: [
          { id: 'kars1-q1', text: 'Vad är det du vill bort FRÅN i din nuvarande karriärinriktning?', placeholder: 'Jag vill bort från...' },
          { id: 'kars1-q2', text: 'Vad vill du TILL? Vad lockar dig med den nya riktningen?', placeholder: 'Jag dras till...' },
          { id: 'kars1-q3', text: 'Är det en tillfällig känsla eller ett långvarigt behov? Hur vet du?', placeholder: 'Jag har känt så här i... och det beror på...' }
        ]
      },
      {
        id: 2,
        title: 'Överförbar kompetens',
        description: 'Vad tar du med dig?',
        questions: [
          { id: 'kars2-q1', text: 'Vilka av dina färdigheter är relevanta i den nya branschen?', placeholder: 'Ledarskap, projektledning, kundkontakt...' },
          { id: 'kars2-q2', text: 'Vilka nya färdigheter behöver du skaffa? Hur kan du göra det?', placeholder: 'Jag behöver lära mig... genom kurser/praktik...' },
          { id: 'kars2-q3', text: 'Hur kan du rama in din erfarenhet så att den blir relevant?', placeholder: 'Jag kan beskriva min erfarenhet som...' }
        ]
      },
      {
        id: 3,
        title: 'Skapa en plan',
        description: 'Konkreta steg mot karriärskiftet.',
        questions: [
          { id: 'kars3-q1', text: 'Vilka steg behöver du ta de närmaste 6 månaderna?', placeholder: '1. Undersöka branschen\n2. Ta kontakt med personer som bytt\n3. Börja kurs/utbildning' },
          { id: 'kars3-q2', text: 'Hur hanterar du ekonomin under övergången?', placeholder: 'Jag kan spara X kr, söka CSN, jobba deltid...' },
          { id: 'kars3-q3', text: 'Vem kan stötta dig i processen?', placeholder: 'Min partner/vän/mentor...' }
        ]
      }
    ]
  },
  {
    id: 'sidoprojekt',
    title: 'Starta ett sidoprojekt',
    description: 'Bygg erfarenhet och portfolio genom att driva ett eget projekt vid sidan av jobbsökningen.',
    icon: Lightbulb,
    category: 'Karriärutveckling',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Hitta din projektidé',
        description: 'Vad kan du skapa som visar din kompetens?',
        questions: [
          { id: 'sido1-q1', text: 'Vilka problem kan du lösa med dina färdigheter?', placeholder: 'Jag kan skapa en app/webbsida/tjänst som...' },
          { id: 'sido1-q2', text: 'Vad skulle du VILJA lära dig genom projektet?', placeholder: 'Jag vill lära mig...' },
          { id: 'sido1-q3', text: 'Lista 3 projektidéer du kan börja med.', placeholder: '1. En blogg om...\n2. En app som...\n3. Volontärarbete där...' }
        ]
      },
      {
        id: 2,
        title: 'Planera projektet',
        description: 'Gör det genomförbart.',
        questions: [
          { id: 'sido2-q1', text: 'Hur mycket tid kan du lägga på projektet varje vecka?', placeholder: 'X timmar per vecka, helst på [dagar]...' },
          { id: 'sido2-q2', text: 'Vad är en rimlig första milstolpe att nå inom 2 veckor?', placeholder: 'Jag ska ha skapat/gjort/lärt mig...' },
          { id: 'sido2-q3', text: 'Vilka resurser behöver du? (Verktyg, kunskap, kontakter)', placeholder: 'Jag behöver...' }
        ]
      },
      {
        id: 3,
        title: 'Visa upp projektet',
        description: 'Använd projektet i din jobbsökning.',
        questions: [
          { id: 'sido3-q1', text: 'Hur kan du dokumentera projektet för din portfolio?', placeholder: 'Skärmdumpar, beskrivning av process och resultat...' },
          { id: 'sido3-q2', text: 'Hur tar du upp projektet i intervjuer och ansökningar?', placeholder: 'Jag kan säga: "Jag drev ett sidoprojekt där jag..."' },
          { id: 'sido3-q3', text: 'Vad lärde du dig och vad säger det om dig som kandidat?', placeholder: 'Jag lärde mig... vilket visar att jag är...' }
        ]
      }
    ]
  },
  {
    id: 'mentorskap',
    title: 'Hitta en mentor',
    description: 'Lär dig identifiera och bygga en relation med någon som kan vägleda din karriär.',
    icon: UserPlus,
    category: 'Karriärutveckling',
    duration: '20-30 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Definiera dina behov',
        description: 'Vad behöver du hjälp med?',
        questions: [
          { id: 'ment1-q1', text: 'Vilka områden i din karriär vill du ha vägledning inom?', placeholder: 'Jag vill ha hjälp med...' },
          { id: 'ment1-q2', text: 'Vad har du att erbjuda en mentor i utbyte?', placeholder: 'Jag kan erbjuda mitt perspektiv, min tid...' },
          { id: 'ment1-q3', text: 'Hur mycket tid kan du investera i en mentorrelation?', placeholder: 'Jag kan träffas X gånger per månad i Y minuter...' }
        ]
      },
      {
        id: 2,
        title: 'Hitta rätt mentor',
        description: 'Vem kan hjälpa dig?',
        questions: [
          { id: 'ment2-q1', text: 'Lista 5 personer som har den karriär eller kunskap du eftersträvar.', placeholder: '1. [Namn] - har lyckats med...\n2. ...' },
          { id: 'ment2-q2', text: 'Var kan du hitta mentorer? (LinkedIn, branschorganisationer, etc.)', placeholder: 'Jag kan leta på...' },
          { id: 'ment2-q3', text: 'Finns det formella mentorprogram du kan ansöka till?', placeholder: 'Ja, jag har hittat... / Nej, men jag kan söka...' }
        ]
      },
      {
        id: 3,
        title: 'Bygg relationen',
        description: 'Kontakta och behåll en mentor.',
        questions: [
          { id: 'ment3-q1', text: 'Skriv ett meddelande där du ber någon bli din mentor.', placeholder: 'Hej [Namn], jag beundrar din karriär och undrar om...' },
          { id: 'ment3-q2', text: 'Vad vill du diskutera i ert första möte?', placeholder: 'Jag vill fråga om deras resa, be om råd om...' },
          { id: 'ment3-q3', text: 'Hur visar du uppskattning och håller relationen vid liv?', placeholder: 'Jag tackar alltid, följer upp på råd, delar framsteg...' }
        ]
      }
    ]
  },

  // === NYA ÖVNINGAR: VÄLMÅENDE ===
  {
    id: 'hantara-avslag',
    title: 'Hantera avslag och besvikelse',
    description: 'Utveckla strategier för att hantera avslag och vända besvikelse till lärdomar.',
    icon: HeartPulse,
    category: 'Välmående',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Förstå dina känslor',
        description: 'Hur reagerar du på avslag?',
        questions: [
          { id: 'avsl1-q1', text: 'Hur känns det när du får ett avslag på en jobbansökan? Beskriv känslan.', placeholder: 'Jag känner mig...' },
          { id: 'avsl1-q2', text: 'Vad brukar du göra direkt efter ett avslag? Är det hjälpsamt?', placeholder: 'Jag brukar... Det är/är inte hjälpsamt för att...' },
          { id: 'avsl1-q3', text: 'Hur länge påverkar ett avslag dig vanligtvis?', placeholder: 'Det brukar ta... innan jag känner mig bättre.' }
        ]
      },
      {
        id: 2,
        title: 'Omrama upplevelsen',
        description: 'Hitta lärdomarna i avslaget.',
        questions: [
          { id: 'avsl2-q1', text: 'Tänk på ett tidigare avslag. Vad kunde du ha lärt dig av det?', placeholder: 'Jag kunde ha lärt mig att...' },
          { id: 'avsl2-q2', text: 'Hur kan du se avslag som information istället för personlig kritik?', placeholder: 'Ett avslag betyder inte att jag är dålig, utan att...' },
          { id: 'avsl2-q3', text: 'Skriv ner 3 påminnelser att läsa när du får nästa avslag.', placeholder: '1. Ett nej betyder inte att jag är dålig\n2. Det fanns kanske interna kandidater\n3. ...' }
        ]
      },
      {
        id: 3,
        title: 'Gå vidare konstruktivt',
        description: 'Vad gör du efter avslaget?',
        questions: [
          { id: 'avsl3-q1', text: 'Vilka aktiviteter hjälper dig att bearbeta besvikelse?', placeholder: 'Träning, prata med vän, skriva dagbok...' },
          { id: 'avsl3-q2', text: 'Hur snart efter ett avslag bör du söka nästa jobb?', placeholder: 'Jag behöver [X tid] för att återhämta mig, sedan...' },
          { id: 'avsl3-q3', text: 'Vem kan stötta dig emotionellt under jobbsökningen?', placeholder: 'Jag kan prata med...' }
        ]
      }
    ]
  },
  {
    id: 'morgonrutin',
    title: 'Skapa en produktiv morgonrutin',
    description: 'Bygg en morgonrutin som ger dig energi och fokus för jobbsökningen.',
    icon: Coffee,
    category: 'Välmående',
    duration: '15-25 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Din nuvarande morgon',
        description: 'Hur ser din morgon ut idag?',
        questions: [
          { id: 'morg1-q1', text: 'Beskriv din typiska morgon nu. Vad gör du från att du vaknar?', placeholder: 'Jag vaknar klockan... sedan...' },
          { id: 'morg1-q2', text: 'Vad fungerar bra med din nuvarande rutin?', placeholder: 'Det som fungerar är...' },
          { id: 'morg1-q3', text: 'Vad vill du förändra eller lägga till?', placeholder: 'Jag skulle vilja...' }
        ]
      },
      {
        id: 2,
        title: 'Designa din idealrutin',
        description: 'Hur vill du börja dagen?',
        questions: [
          { id: 'morg2-q1', text: 'Vilka 3 saker vill du alltid hinna med på morgonen?', placeholder: '1. Rörelse/stretching\n2. Frukost\n3. Planera dagen' },
          { id: 'morg2-q2', text: 'Hur mycket tid behöver din idealiska morgonrutin?', placeholder: 'Jag behöver ca X minuter för att...' },
          { id: 'morg2-q3', text: 'Vad måste du undvika för att hålla rutinen? (T.ex. telefonen)', placeholder: 'Jag ska undvika att...' }
        ]
      },
      {
        id: 3,
        title: 'Implementera',
        description: 'Gör rutinen till verklighet.',
        questions: [
          { id: 'morg3-q1', text: 'Skriv ner din nya morgonrutin steg för steg med tider.', placeholder: '07:00 - Vakna\n07:05 - Stretching\n07:15 - Frukost...' },
          { id: 'morg3-q2', text: 'Vad behöver du förbereda kvällen innan?', placeholder: 'Jag ska lägga fram kläder, förbereda frukost...' },
          { id: 'morg3-q3', text: 'Hur belönar du dig själv när du håller rutinen en vecka?', placeholder: 'Jag unnar mig...' }
        ]
      }
    ]
  },
  {
    id: 'tacksamhet',
    title: 'Tacksamhet under jobbsökningen',
    description: 'Använd tacksamhet som verktyg för att hålla motivationen uppe under jobbsökningsprocessen.',
    icon: Heart,
    category: 'Välmående',
    duration: '15-20 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Hitta det positiva',
        description: 'Vad kan du vara tacksam för just nu?',
        questions: [
          { id: 'tack1-q1', text: 'Lista 5 saker du är tacksam för idag, stora som små.', placeholder: '1. Min hälsa\n2. Stöd från familjen\n3. Tillgång till internet...' },
          { id: 'tack1-q2', text: 'Vilka möjligheter har jobbsökartiden gett dig?', placeholder: 'Tid att reflektera, lära mig nya saker...' },
          { id: 'tack1-q3', text: 'Vem i ditt liv uppskattar du extra mycket just nu?', placeholder: 'Jag uppskattar [person] för att...' }
        ]
      },
      {
        id: 2,
        title: 'Tacksamhet i vardagen',
        description: 'Bygg in tacksamhet i din rutin.',
        questions: [
          { id: 'tack2-q1', text: 'När på dagen kan du ta 2 minuter för att reflektera över tacksamhet?', placeholder: 'På morgonen när jag dricker kaffe...' },
          { id: 'tack2-q2', text: 'Hur kan du dokumentera det? (Dagbok, app, mentalt)', placeholder: 'Jag kan skriva i en dagbok...' },
          { id: 'tack2-q3', text: 'Vem kan du visa tacksamhet mot idag?', placeholder: 'Jag kan tacka [person] för...' }
        ]
      },
      {
        id: 3,
        title: 'Tacksamhet som superkraft',
        description: 'Använd tacksamhet när det är svårt.',
        questions: [
          { id: 'tack3-q1', text: 'Hur kan tacksamhet hjälpa dig hantera stress och oro?', placeholder: 'När jag fokuserar på vad jag har istället för vad jag saknar...' },
          { id: 'tack3-q2', text: 'Skriv ner 3 saker du kan påminna dig om när det känns tungt.', placeholder: '1. Jag har kommit långt\n2. Det finns folk som bryr sig\n3. ...' },
          { id: 'tack3-q3', text: 'Hur ska du hålla tacksamhetspraktiken levande de närmaste veckorna?', placeholder: 'Jag sätter en påminnelse varje kväll att...' }
        ]
      }
    ]
  },

  // === NYA ÖVNINGAR: ARBETSLIVSKUNSKAP ===
  {
    id: 'forstadagen',
    title: 'Förbered dig för första dagen',
    description: 'Strategier för att göra ett starkt intryck och komma igång snabbt på ett nytt jobb.',
    icon: Rocket,
    category: 'Arbetslivskunskap',
    duration: '20-30 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Innan första dagen',
        description: 'Vad kan du förbereda?',
        questions: [
          { id: 'fors1-q1', text: 'Vilken information bör du ta reda på innan första arbetsdagen?', placeholder: 'Klädkod, starttid, vem jag ska fråga efter...' },
          { id: 'fors1-q2', text: 'Vad ska du ha med dig? Gör en packlista.', placeholder: 'ID, anteckningsblock, lunch, laddat telefon...' },
          { id: 'fors1-q3', text: 'Hur kan du förbereda dig mentalt för att känna dig trygg?', placeholder: 'Jag kan visualisera dagen, påminna mig om att...' }
        ]
      },
      {
        id: 2,
        title: 'Under första dagen',
        description: 'Gör ett bra intryck.',
        questions: [
          { id: 'fors2-q1', text: 'Vilka frågor bör du ställa den första dagen?', placeholder: 'Vad förväntas av mig? Vem vänder jag mig till om...?' },
          { id: 'fors2-q2', text: 'Hur kan du visa entusiasm utan att verka överdriven?', placeholder: 'Jag kan lyssna aktivt, ställa frågor, erbjuda hjälp...' },
          { id: 'fors2-q3', text: 'Hur hanterar du om du inte förstår något?', placeholder: 'Jag ber om förtydligande, säger "Kan du visa mig..."' }
        ]
      },
      {
        id: 3,
        title: 'De första veckorna',
        description: 'Bygg relationer och lär dig snabbt.',
        questions: [
          { id: 'fors3-q1', text: 'Hur ska du presentera dig för nya kollegor?', placeholder: 'Hej, jag heter [Namn] och ska jobba med [X]...' },
          { id: 'fors3-q2', text: 'Hur kan du visa initiativ utan att trampa någon på tårna?', placeholder: 'Jag kan fråga om det finns något jag kan hjälpa till med...' },
          { id: 'fors3-q3', text: 'Vem bör du försöka bygga en relation med först?', placeholder: 'Min närmaste chef, kollegor i teamet, receptionist...' }
        ]
      }
    ]
  },
  {
    id: 'arbetsplatskultur',
    title: 'Navigera arbetsplatskultur',
    description: 'Lär dig läsa av och anpassa dig till olika arbetsplatskulturer.',
    icon: Building,
    category: 'Arbetslivskunskap',
    duration: '20-25 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Läsa av kulturen',
        description: 'Hur förstår du en arbetsplats kultur?',
        questions: [
          { id: 'arku1-q1', text: 'Vilka tecken visar på en arbetsplats kultur? (Klädkod, möten, kommunikation)', placeholder: 'Formella/informella möten, dusar/niar...' },
          { id: 'arku1-q2', text: 'Hur kan du ta reda på kulturen innan du börjar jobba?', placeholder: 'Fråga på intervjun, kolla Glassdoor, prata med anställda...' },
          { id: 'arku1-q3', text: 'Vilken typ av arbetsplatskultur passar dig bäst? Varför?', placeholder: 'Jag trivs bäst i miljöer som är...' }
        ]
      },
      {
        id: 2,
        title: 'Anpassa dig smart',
        description: 'Smält in utan att tappa dig själv.',
        questions: [
          { id: 'arku2-q1', text: 'Hur kan du anpassa din kommunikationsstil till olika kulturer?', placeholder: 'I formella miljöer: ... I informella: ...' },
          { id: 'arku2-q2', text: 'Vilka av dina beteenden kan du behöva justera?', placeholder: 'Kanske hur jag tar pauser, hur jag ger feedback...' },
          { id: 'arku2-q3', text: 'Var går gränsen för anpassning vs. att vara dig själv?', placeholder: 'Jag anpassar ytan men behåller mina värderingar om...' }
        ]
      },
      {
        id: 3,
        title: 'Hantera kulturkrockar',
        description: 'När kulturen inte passar.',
        questions: [
          { id: 'arku3-q1', text: 'Vilka varningssignaler visar att en kultur inte passar dig?', placeholder: 'Om jag känner mig konstant stressad, osynlig...' },
          { id: 'arku3-q2', text: 'Hur kan du hantera om du hamnar i en obekväm kultur?', placeholder: 'Jag kan prata med chefen, hitta likasinnade...' },
          { id: 'arku3-q3', text: 'När är det dags att söka sig vidare?', placeholder: 'Om mina värderingar krockar, om jag mår dåligt...' }
        ]
      }
    ]
  },
  {
    id: 'moten-effektivt',
    title: 'Delta effektivt i möten',
    description: 'Lär dig förbereda dig inför möten, bidra konstruktivt och följa upp.',
    icon: Users,
    category: 'Arbetslivskunskap',
    duration: '15-25 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Förbered dig',
        description: 'Hur kommer du förberedd till möten?',
        questions: [
          { id: 'mote1-q1', text: 'Vad bör du göra innan ett möte? Gör en checklista.', placeholder: '1. Läs agendan\n2. Förbered frågor\n3. Ha material redo...' },
          { id: 'mote1-q2', text: 'Hur tar du reda på vad som förväntas av dig under mötet?', placeholder: 'Jag kollar om jag ska presentera, besluta, informera...' },
          { id: 'mote1-q3', text: 'Vilka frågor vill du ha svar på efter mötet?', placeholder: 'Jag vill veta vad nästa steg är, vem som gör vad...' }
        ]
      },
      {
        id: 2,
        title: 'Under mötet',
        description: 'Bidra och gör dig hörd.',
        questions: [
          { id: 'mote2-q1', text: 'Hur kan du bidra konstruktivt utan att dominera?', placeholder: 'Jag lyssnar först, bygger på andras idéer, ställer frågor...' },
          { id: 'mote2-q2', text: 'Hur säger du emot om du inte håller med?', placeholder: 'Jag kan säga: "Intressant perspektiv. Jag tänker att..."' },
          { id: 'mote2-q3', text: 'Hur antecknar du effektivt utan att missa diskussionen?', placeholder: 'Jag skriver nyckelord och fyller i efteråt...' }
        ]
      },
      {
        id: 3,
        title: 'Efter mötet',
        description: 'Förvalta det som bestämts.',
        questions: [
          { id: 'mote3-q1', text: 'Hur sammanfattar du vad som beslutades?', placeholder: 'Jag skriver ner: beslut, ansvarig, deadline...' },
          { id: 'mote3-q2', text: 'Hur håller du koll på dina action points?', placeholder: 'Jag lägger in i min kalender/todo-lista...' },
          { id: 'mote3-q3', text: 'Hur följer du upp med kollegor efter mötet?', placeholder: 'Jag skickar ett mail med sammanfattning, frågar om oklarheter...' }
        ]
      }
    ]
  },

  // === NYA ÖVNINGAR: ARBETSSÖKANDE ===
  {
    id: 'jobbsokarschema',
    title: 'Skapa ett jobbsökarschema',
    description: 'Strukturera din jobbsökning med ett effektivt schema som ger resultat.',
    icon: Calendar,
    category: 'Arbetssökande',
    duration: '20-30 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Nuläge och mål',
        description: 'Hur mycket tid har du att lägga på jobbsökning?',
        questions: [
          { id: 'jsch1-q1', text: 'Hur många timmar per vecka kan du lägga på jobbsökning realistiskt?', placeholder: 'Jag kan lägga ca X timmar per vecka...' },
          { id: 'jsch1-q2', text: 'Vilka dagar och tider fungerar bäst för dig?', placeholder: 'Förmiddagar på vardagar, kvällar på söndagar...' },
          { id: 'jsch1-q3', text: 'Hur många ansökningar vill du skicka per vecka?', placeholder: 'Mitt mål är X ansökningar per vecka...' }
        ]
      },
      {
        id: 2,
        title: 'Dela upp aktiviteterna',
        description: 'Vilka aktiviteter behöver du göra?',
        questions: [
          { id: 'jsch2-q1', text: 'Lista alla aktiviteter du gör under jobbsökningen.', placeholder: 'Söka jobb, skriva ansökningar, nätverka, uppdatera CV...' },
          { id: 'jsch2-q2', text: 'Vilka aktiviteter kräver mest energi? När ska du göra dem?', placeholder: 'Skriva ansökningar kräver mycket - gör det på morgonen...' },
          { id: 'jsch2-q3', text: 'Vilka aktiviteter kan du göra när du är trött?', placeholder: 'Söka jobb, läsa artiklar, kolla LinkedIn...' }
        ]
      },
      {
        id: 3,
        title: 'Skapa schemat',
        description: 'Planera din vecka.',
        questions: [
          { id: 'jsch3-q1', text: 'Skriv ner ett veckoschema för din jobbsökning.', placeholder: 'Måndag 9-11: Söka jobb\nTisdag 10-12: Skriva ansökningar...' },
          { id: 'jsch3-q2', text: 'Vilka pauser och belöningar bygger du in?', placeholder: 'Paus var 45 min, fika efter 2 ansökningar...' },
          { id: 'jsch3-q3', text: 'Hur ska du utvärdera och justera schemat?', placeholder: 'Varje fredag kollar jag vad som fungerade...' }
        ]
      }
    ]
  },
  {
    id: 'jobbdagbok',
    title: 'Föra jobbsökardagbok',
    description: 'Dokumentera din jobbsökning för att spåra framsteg och se mönster.',
    icon: BookOpen,
    category: 'Arbetssökande',
    duration: '15-25 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Varför dagbok?',
        description: 'Förstå nyttan med dokumentation.',
        questions: [
          { id: 'jdag1-q1', text: 'Vilka fördelar kan det finnas med att föra dagbok över jobbsökningen?', placeholder: 'Hålla koll på vad jag sökt, se mönster...' },
          { id: 'jdag1-q2', text: 'Vad vill du kunna se tillbaka på om en månad?', placeholder: 'Hur många jag sökt, vad som fungerat...' },
          { id: 'jdag1-q3', text: 'Hur har du dokumenterat tidigare jobbsökningar?', placeholder: 'Jag har/har inte fört anteckningar om...' }
        ]
      },
      {
        id: 2,
        title: 'Vad ska du spåra?',
        description: 'Bestäm vad du ska dokumentera.',
        questions: [
          { id: 'jdag2-q1', text: 'Vilken information är viktigast att spara för varje ansökan?', placeholder: 'Företag, tjänst, datum, kontaktperson...' },
          { id: 'jdag2-q2', text: 'Hur ska du kategorisera dina ansökningar? (Status, bransch, etc.)', placeholder: 'Skickad, Intervju, Avslag, Väntar...' },
          { id: 'jdag2-q3', text: 'Vilka reflektioner vill du skriva ner regelbundet?', placeholder: 'Vad jag lärt mig, vad jag kan förbättra...' }
        ]
      },
      {
        id: 3,
        title: 'Kom igång',
        description: 'Sätt upp din dagbok.',
        questions: [
          { id: 'jdag3-q1', text: 'Var ska du föra din dagbok? (App, excel, anteckningsbok)', placeholder: 'Jag ska använda...' },
          { id: 'jdag3-q2', text: 'Hur ofta ska du uppdatera den?', placeholder: 'Efter varje ansökan, varje dag, varje vecka...' },
          { id: 'jdag3-q3', text: 'Skriv in din första post i dagboken nu – vad sökte du senast?', placeholder: 'Senast sökte jag [tjänst] på [företag] den [datum]...' }
        ]
      }
    ]
  },
  {
    id: 'motivationsbrev-varianter',
    title: 'Anpassa motivationsbrev snabbt',
    description: 'Lär dig skapa en mall som snabbt kan anpassas till olika jobb.',
    icon: PenTool,
    category: 'Arbetssökande',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Skapa din grundmall',
        description: 'Bygg en bas att utgå ifrån.',
        questions: [
          { id: 'motv1-q1', text: 'Skriv ett öppningsstycke som fungerar för flera olika jobb.', placeholder: 'Med min bakgrund inom [X] och erfarenhet av [Y]...' },
          { id: 'motv1-q2', text: 'Vilka 3-5 styrkor vill du alltid lyfta fram?', placeholder: '1. Problemlösning\n2. Kommunikation\n3. Anpassningsförmåga...' },
          { id: 'motv1-q3', text: 'Skriv ett avslutningsstycke som fungerar generellt.', placeholder: 'Jag ser fram emot att bidra till er verksamhet och...' }
        ]
      },
      {
        id: 2,
        title: 'Identifiera anpassningspunkter',
        description: 'Var ska du ändra för varje ansökan?',
        questions: [
          { id: 'motv2-q1', text: 'Vilka delar av brevet MÅSTE anpassas för varje jobb?', placeholder: 'Företagsnamn, specifik tjänst, matchande erfarenhet...' },
          { id: 'motv2-q2', text: 'Hur kan du snabbt identifiera nyckelord i en jobbannons?', placeholder: 'Jag läser annonsen och markerar upprepade ord...' },
          { id: 'motv2-q3', text: 'Gör en checklista för anpassningar du gör varje gång.', placeholder: '1. Ändra företagsnamn\n2. Matcha nyckelord\n3. Lägg till specifikt exempel...' }
        ]
      },
      {
        id: 3,
        title: 'Öva snabba anpassningar',
        description: 'Träna på att anpassa snabbt.',
        questions: [
          { id: 'motv3-q1', text: 'Välj en jobbannons och identifiera 3 nyckelkrav på 2 minuter.', placeholder: 'Krav 1: ...\nKrav 2: ...\nKrav 3: ...' },
          { id: 'motv3-q2', text: 'Skriv en mening som kopplar din erfarenhet till varje krav.', placeholder: 'Krav 1: Min erfarenhet av X gör mig...' },
          { id: 'motv3-q3', text: 'Sätt ett tidsmål: hur lång tid ska en anpassning ta?', placeholder: 'Jag siktar på att kunna anpassa ett brev på X minuter.' }
        ]
      }
    ]
  },

  // === NYA ÖVNINGAR: REHABILITERING ===
  {
    id: 'anpassningar-arbetsplats',
    title: 'Be om anpassningar på arbetsplatsen',
    description: 'Lär dig kommunicera dina behov och be om rimliga anpassningar.',
    icon: Accessibility,
    category: 'Rehabilitering',
    duration: '25-35 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Identifiera dina behov',
        description: 'Vad behöver du för att fungera optimalt?',
        questions: [
          { id: 'anpa1-q1', text: 'Vilka utmaningar har du som kan kräva anpassningar på en arbetsplats?', placeholder: 'Jag behöver pauser, tyst miljö, flexibla tider...' },
          { id: 'anpa1-q2', text: 'Vilka anpassningar har hjälpt dig tidigare?', placeholder: 'Tidigare har jag haft nytta av...' },
          { id: 'anpa1-q3', text: 'Vilka anpassningar skulle göra störst skillnad för din arbetsförmåga?', placeholder: 'Det viktigaste vore...' }
        ]
      },
      {
        id: 2,
        title: 'Förbered samtalet',
        description: 'Hur tar du upp dina behov?',
        questions: [
          { id: 'anpa2-q1', text: 'När i rekryteringsprocessen bör du ta upp behov av anpassningar?', placeholder: 'Efter att jag fått erbjudande, när de frågar om behov...' },
          { id: 'anpa2-q2', text: 'Hur mycket behöver arbetsgivaren veta om din situation?', placeholder: 'De behöver veta vad jag behöver, inte nödvändigtvis varför...' },
          { id: 'anpa2-q3', text: 'Skriv ett utkast till hur du kan formulera ditt behov.', placeholder: 'För att prestera optimalt behöver jag...' }
        ]
      },
      {
        id: 3,
        title: 'Dina rättigheter',
        description: 'Vad säger lagen?',
        questions: [
          { id: 'anpa3-q1', text: 'Vad innebär arbetsgivarens anpassningsskyldighet?', placeholder: 'Arbetsgivare måste göra rimliga anpassningar för...' },
          { id: 'anpa3-q2', text: 'Vilka anpassningar är rimliga att be om vs. orimliga?', placeholder: 'Rimligt: flexibel arbetstid. Orimligt: ...' },
          { id: 'anpa3-q3', text: 'Vart kan du vända dig om arbetsgivaren vägrar anpassa?', placeholder: 'DO, facket, Försäkringskassan...' }
        ]
      }
    ]
  },
  {
    id: 'gradvis-atergang',
    title: 'Planera gradvis återgång till arbete',
    description: 'Strategier för att gå från sjukskrivning eller frånvaro tillbaka till arbetslivet.',
    icon: Activity,
    category: 'Rehabilitering',
    duration: '30-40 min',
    difficulty: 'Medel',
    steps: [
      {
        id: 1,
        title: 'Bedöm din situation',
        description: 'Var står du idag?',
        questions: [
          { id: 'grad1-q1', text: 'Hur länge har du varit borta från arbetslivet?', placeholder: 'Jag har varit borta i [tid] på grund av...' },
          { id: 'grad1-q2', text: 'Vad känner du dig redo att göra just nu?', placeholder: 'Jag kan hantera X timmar/aktiviteter per dag...' },
          { id: 'grad1-q3', text: 'Vilka orosmoment har du inför återgång?', placeholder: 'Jag oroar mig för att...' }
        ]
      },
      {
        id: 2,
        title: 'Planera stegen',
        description: 'Hur ser vägen tillbaka ut?',
        questions: [
          { id: 'grad2-q1', text: 'Vad skulle ett realistiskt första steg vara?', placeholder: 'Börja med 25%, enklare uppgifter...' },
          { id: 'grad2-q2', text: 'Hur kan du öka gradvis? Skriv en tidslinje.', placeholder: 'Vecka 1-2: 25%\nVecka 3-4: 50%...' },
          { id: 'grad2-q3', text: 'Vilka varningssignaler ska du vara uppmärksam på?', placeholder: 'Om jag börjar sova dåligt, känner mig överväldigad...' }
        ]
      },
      {
        id: 3,
        title: 'Stöd och resurser',
        description: 'Vem kan hjälpa dig?',
        questions: [
          { id: 'grad3-q1', text: 'Vilka professionella stöd har du tillgång till?', placeholder: 'Rehabiliteringskoordinator, läkare, psykolog...' },
          { id: 'grad3-q2', text: 'Vad behöver du från din arbetsgivare för att lyckas?', placeholder: 'Förståelse, flexibilitet, regelbundna avstämningar...' },
          { id: 'grad3-q3', text: 'Hur ska du fira framsteg längs vägen?', placeholder: 'Efter varje vecka ska jag...' }
        ]
      }
    ]
  },
  {
    id: 'energihantering',
    title: 'Hantera begränsad energi',
    description: 'Strategier för att prioritera och hushålla med energin när den är begränsad.',
    icon: Leaf,
    category: 'Rehabilitering',
    duration: '25-35 min',
    difficulty: 'Lätt',
    steps: [
      {
        id: 1,
        title: 'Förstå din energi',
        description: 'Hur fungerar din energi?',
        questions: [
          { id: 'ener1-q1', text: 'När på dygnet har du mest energi?', placeholder: 'Jag har mest energi på förmiddagen/eftermiddagen...' },
          { id: 'ener1-q2', text: 'Vilka aktiviteter dränerar dig mest?', placeholder: 'Sociala situationer, beslut, fysisk aktivitet...' },
          { id: 'ener1-q3', text: 'Vilka aktiviteter ger dig energi?', placeholder: 'Vila, natur, kreativitet...' }
        ]
      },
      {
        id: 2,
        title: 'Prioritera smart',
        description: 'Vad är viktigast?',
        questions: [
          { id: 'ener2-q1', text: 'Vilka jobbsökaraktiviteter är viktigast att prioritera?', placeholder: 'Skriva ansökningar, intervjuer, nätverkande...' },
          { id: 'ener2-q2', text: 'Vad kan du skippa eller förenkla?', placeholder: 'Läsa alla jobb (kan filtrera mer), perfekta varje brev...' },
          { id: 'ener2-q3', text: 'Hur kan du planera så att krävande aktiviteter hamnar när du har energi?', placeholder: 'Jag lägger intervjuer på förmiddagar, ansökningar...' }
        ]
      },
      {
        id: 3,
        title: 'Hushåll och återhämta',
        description: 'Bygg in vila.',
        questions: [
          { id: 'ener3-q1', text: 'Vilka pausstrategier fungerar för dig?', placeholder: '10 min vila mellan aktiviteter, gå ut...' },
          { id: 'ener3-q2', text: 'Hur vet du att du behöver pausa?', placeholder: 'Varningssignaler: irritation, koncentrationssvårigheter...' },
          { id: 'ener3-q3', text: 'Skapa en realistisk jobbsökarplan som tar hänsyn till din energi.', placeholder: 'Måndag: 2h på morgonen\nTisdag: Vila...' }
        ]
      }
    ]
  }
]
