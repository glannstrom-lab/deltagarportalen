/**
 * Externa resurser — datan bakom /externa-resurser.
 *
 * Låg till 2026-08-23 i `pages/ExternalResources.tsx`, som då var 3 580 rader
 * varav 3 216 var den här listan. Sidan är nu ~360 rader och det här är ren
 * data, enligt CLAUDE.md ("Extrahera komponenter över 150 rader till egna
 * filer") och samma uppdelning som `data/artikelkategorier.ts`.
 *
 * Flytten krymper INTE bygget: chunken vägde 19,0 kB brotli före och efter,
 * eftersom bytena är resursernas text och den följer med oavsett vilken fil
 * den bor i. Uppdelningen är en underhållsåtgärd, ingen storleksvinst.
 *
 * ## Redaktionella regler för listan
 *
 * - **Skriv ut vad som krävs av läsaren.** Ett fackförbunds karriärrådgivning
 *   är för medlemmar; omställningsorganisationerna kräver en nyligen uppsagd
 *   anställning med kollektivavtal. Står det inte i beskrivningen läser en
 *   arbetssökande den som en öppen resurs och möter en vägg.
 * - **Skriv ut vad som kostar.** Elva poster säger "gratis". Frånvaron av
 *   prisupplysning på de övriga lästes då som "gratis" — därför är
 *   betaltjänster märkta `(betaltjänst)` eller `(delvis gratis)`.
 * - **Ett värde utan underlag skrivs inte ut.** Se CLAUDE.md 2026-08-09.
 */

import {
  Play,
  BookOpen,
  FileText,
  Users,
  Building2,
  GraduationCap,
  Globe,
  Briefcase,
  Scale,
  Heart,
  Headphones,
  Search,
  Laptop,
  Rocket,
  Wrench,
  Coffee,
  MessageCircle,
  Lightbulb,
  Award,
  Accessibility,
  Handshake,
  MapPin,
  Clock,
  Palette,
  Code,
  Stethoscope,
  Baby,
  Calendar,
  Languages,
  Leaf,
  Shield,
  Home,
  RefreshCw,
  Brain,
  Sparkles,
  Target,
  Landmark,
  Gavel,
  Newspaper,
  PenTool,
  Zap,
  Video,
  Megaphone,
  Lock,
  Coins,
  Hammer,
  Train,
  ShoppingCart,
} from '@/components/ui/icons'
import type { TFunction } from 'i18next'

type Oversattare = TFunction | ((nyckel: string, reserv?: string) => string)

// ── Typer ────────────────────────────────────────────────────────────────

export interface ExternalResource {
  id: string
  name: string
  description: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  category: 'video' | 'guide' | 'organization' | 'learning' | 'support' | 'jobs' | 'startup' | 'niche' | 'networking' | 'accessibility' | 'freelance' | 'youth' | 'regional' | 'staffing' | 'international' | 'language' | 'remote' | 'green' | 'senior' | 'diversity' | 'career-change' | 'certifications' | 'public-sector' | 'assessment' | 'portfolio' | 'creative' | 'science' | 'legal' | 'nonprofit' | 'ai-tools' | 'interview' | 'salary' | 'soft-skills' | 'coworking' | 'podcasts'
  tags?: string[]
}

// ── Resurserna ───────────────────────────────────────────────────────────

export const EXTERNA_RESURSER: ExternalResource[] = [
  // Video & Utbildning
  {
    id: 'af-play',
    name: 'Arbetsförmedlingen Play',
    description: 'Filmer och webbutbildningar om jobbsökning, CV-skrivning, intervjuteknik och arbetsmarknad.',
    url: 'https://arbetsformedlingen.se/play',
    icon: Play,
    category: 'video',
    tags: ['CV', 'Intervju', 'Jobbsökning']
  },
  {
    id: 'af-guider',
    name: 'Arbetsförmedlingens guider',
    description: 'Steg-för-steg-guider om allt från att skriva CV till att starta eget företag.',
    url: 'https://arbetsformedlingen.se/for-arbetssokande/sa-hittar-du-jobbet',
    icon: BookOpen,
    category: 'guide',
    tags: ['CV', 'Personligt brev', 'Intervju']
  },
  {
    id: 'unionen',
    name: 'Unionen Karriärcoaching',
    description: 'Fackförbund för tjänstemän. Karriärrådgivning och jobbsökartips för medlemmar.',
    url: 'https://www.unionen.se/',
    icon: Users,
    category: 'organization',
    tags: ['Karriär', 'Fackförbund']
  },
  {
    id: 'saco',
    name: 'Sacos karriärguider',
    description: 'Akademikernas centralorganisation. Karriärguider — rådgivningen är för medlemmar i ett Saco-förbund.',
    url: 'https://www.saco.se/karriar/',
    icon: GraduationCap,
    category: 'organization',
    tags: ['Akademiker', 'Karriär']
  },
  {
    id: 'tco',
    name: 'TCO - Karriär & Utveckling',
    description: 'Tjänstemannacentralorganisationen. Fakta om arbetsmarknaden; stödet ges via medlemsförbunden.',
    url: 'https://www.tco.se/',
    icon: Building2,
    category: 'organization',
    tags: ['Arbetsmarknad', 'Facklig']
  },

  // Lärande & Utbildning
  {
    id: 'allastudier',
    name: 'Allastudier.se',
    description: 'Hitta utbildningar i hela Sverige. Kurser, YH-utbildningar och högskolestudier.',
    url: 'https://www.allastudier.se/',
    icon: GraduationCap,
    category: 'learning',
    tags: ['Utbildning', 'Kurser', 'Studier']
  },
  {
    id: 'studera',
    name: 'Studera.nu',
    description: 'Information om högskolestudier i Sverige. Antagning och programval.',
    url: 'https://www.studera.nu/',
    icon: GraduationCap,
    category: 'learning',
    tags: ['Högskola', 'Universitet']
  },
  {
    id: 'csn',
    name: 'CSN - Studiestöd',
    description: 'Information om studiemedel, lån och bidrag för studier.',
    url: 'https://www.csn.se/',
    icon: FileText,
    category: 'learning',
    tags: ['Studiestöd', 'CSN']
  },
  {
    id: 'linkedin-learning',
    name: 'LinkedIn Learning',
    description: 'Onlinekurser inom affär, teknik och kreativitet. Gratis med många bibliotekskort.',
    url: 'https://www.linkedin.com/learning/',
    icon: Play,
    category: 'learning',
    tags: ['Onlinekurser', 'Kompetens']
  },

  // Internationellt
  {
    id: 'migrationsverket',
    name: 'Migrationsverket - Arbeta i Sverige',
    description: 'Information om arbetstillstånd och visum för dig som vill arbeta i Sverige.',
    url: 'https://www.migrationsverket.se/du-vill-ansoka/arbeta/anstalld-eller-egen-foretagare/anstalld.html',
    icon: Globe,
    category: 'guide',
    tags: ['Visum', 'Arbetstillstånd']
  },
  {
    id: 'sweden-se',
    name: 'Sweden.se - Work in Sweden',
    description: 'Officiell guide för internationella arbetssökande om att leva och arbeta i Sverige.',
    url: 'https://sweden.se/work-business/working-in-sweden/',
    icon: Globe,
    category: 'guide',
    tags: ['International', 'Work permit']
  },

  // Arbetsrätt & Stöd
  {
    id: 'arbetsmiljoverket',
    name: 'Arbetsmiljöverket',
    description: 'Information om arbetsmiljö, rättigheter och säkerhet på arbetsplatsen.',
    url: 'https://www.av.se/',
    icon: Scale,
    category: 'support',
    tags: ['Arbetsmiljö', 'Rättigheter']
  },
  {
    id: 'do',
    name: 'Diskrimineringsombudsmannen',
    description: 'Information om diskrimineringsskydd och dina rättigheter i arbetslivet.',
    url: 'https://www.do.se/',
    icon: Scale,
    category: 'support',
    tags: ['Diskriminering', 'Rättigheter']
  },
  {
    id: 'forsakringskassan',
    name: 'Försäkringskassan',
    description: 'Information om sjukpenning, föräldrapenning och andra ersättningar.',
    url: 'https://www.forsakringskassan.se/',
    icon: Heart,
    category: 'support',
    tags: ['Sjukpenning', 'Ersättning']
  },
{
    id: 'ekonomiskt-bistand',
    name: 'Ekonomiskt bistånd (socialtjänsten)',
    description: 'Vad försörjningsstöd är, vem som kan få det och hur du ansöker hos din kommun.',
    url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/ekonomiskt-bistand/',
    icon: Coins,
    category: 'support',
    tags: ['Försörjningsstöd', 'Socialtjänst', 'Ekonomi']
  },
  {
    id: 'krisinformation',
    name: 'Krisinformation.se',
    description: 'Samhällets information vid kriser och viktiga händelser.',
    url: 'https://www.krisinformation.se/',
    icon: Heart,
    category: 'support',
    tags: ['Kris', 'Stöd']
  },

  // Podcasts & Media
  {
    id: 'indeed',
    name: 'Indeed Sverige',
    description: 'En av världens största jobbsökarmotorer med tusentals lediga jobb i Sverige.',
    url: 'https://se.indeed.com/',
    icon: Search,
    category: 'jobs',
    tags: ['Jobb', 'Sökning']
  },
  {
    id: 'linkedin-jobs',
    name: 'LinkedIn Jobs',
    description: 'Hitta jobb och bygg ditt professionella nätverk på världens största karriärsnätverk.',
    url: 'https://www.linkedin.com/jobs/',
    icon: Users,
    category: 'jobs',
    tags: ['Jobb', 'Nätverk']
  },
  {
    id: 'monster',
    name: 'Monster Sverige',
    description: 'Internationell jobbsajt med många lediga tjänster och karriärresurser.',
    url: 'https://www.monster.com/se/',
    icon: Search,
    category: 'jobs',
    tags: ['Jobb', 'Karriär']
  },
  {
    id: 'jobbsafari',
    name: 'Jobbsafari',
    description: 'Svensk jobbsökmotor som samlar lediga jobb från många olika källor.',
    url: 'https://www.jobbsafari.se/',
    icon: Search,
    category: 'jobs',
    tags: ['Jobb', 'Aggregator']
  },
  {
    id: 'offentligajobb',
    name: 'Offentliga Jobb',
    description: 'Lediga tjänster inom offentlig sektor - kommuner, regioner och statliga myndigheter.',
    url: 'https://www.offentligajobb.se/',
    icon: Building2,
    category: 'jobs',
    tags: ['Offentlig sektor', 'Kommun']
  },
  {
    id: 'kommunal',
    name: 'Kommunal',
    description: 'Sveriges största fackförbund för anställda i välfärdssektorn.',
    url: 'https://www.kommunal.se/',
    icon: Users,
    category: 'organization',
    tags: ['Vård', 'Omsorg', 'Fackförbund']
  },
  {
    id: 'if-metall',
    name: 'IF Metall',
    description: 'Fackförbund för industriarbetare med resurser om arbetsrätt och karriär.',
    url: 'https://www.ifmetall.se/',
    icon: Wrench,
    category: 'organization',
    tags: ['Industri', 'Fackförbund']
  },
  {
    id: 'handels',
    name: 'Handelsanställdas förbund',
    description: 'Fackförbund för anställda inom handel och service.',
    url: 'https://handels.se/',
    icon: Users,
    category: 'organization',
    tags: ['Handel', 'Service', 'Fackförbund']
  },
  {
    id: 'vision',
    name: 'Vision',
    description: 'Fackförbund för dig som arbetar inom kommun, region eller kyrka.',
    url: 'https://vision.se/',
    icon: Users,
    category: 'organization',
    tags: ['Kommun', 'Region', 'Fackförbund']
  },
  {
    id: 'jusek',
    name: 'Akavia (f.d. Jusek)',
    description: 'Fackförbund för jurister, ekonomer, systemvetare, personalvetare och samhällsvetare.',
    url: 'https://www.akavia.se/',
    icon: GraduationCap,
    category: 'organization',
    tags: ['Akademiker', 'Juridik', 'Ekonomi']
  },

  // Fler lärandeplattformar
  {
    id: 'coursera',
    name: 'Coursera',
    description: 'Onlinekurser från världens ledande universitet. Många gratis kurser tillgängliga.',
    url: 'https://www.coursera.org/',
    icon: Laptop,
    category: 'learning',
    tags: ['Onlinekurser', 'Certifikat']
  },
  {
    id: 'edx',
    name: 'edX',
    description: 'Gratis kurser från Harvard, MIT och andra toppuniversitet.',
    url: 'https://www.edx.org/',
    icon: Laptop,
    category: 'learning',
    tags: ['Onlinekurser', 'Universitet']
  },
  {
    id: 'udemy',
    name: 'Udemy',
    description: 'Stort utbud av kurser inom teknik, affär, design och personlig utveckling.',
    url: 'https://www.udemy.com/',
    icon: Play,
    category: 'learning',
    tags: ['Onlinekurser', 'Praktiskt']
  },
  {
    id: 'skillshare',
    name: 'Skillshare',
    description: 'Kreativa kurser inom design, foto, video och entreprenörskap.',
    url: 'https://www.skillshare.com/',
    icon: Lightbulb,
    category: 'learning',
    tags: ['Kreativt', 'Design']
  },
  {
    id: 'codecademy',
    name: 'Codecademy',
    description: 'Lär dig programmering interaktivt. Python, JavaScript, SQL och mer.',
    url: 'https://www.codecademy.com/',
    icon: Laptop,
    category: 'learning',
    tags: ['Programmering', 'Tech']
  },
  {
    id: 'freecodecamp',
    name: 'freeCodeCamp',
    description: 'Helt gratis plattform för att lära sig webbutveckling och programmering.',
    url: 'https://www.freecodecamp.org/',
    icon: Laptop,
    category: 'learning',
    tags: ['Gratis', 'Programmering']
  },
  {
    id: 'google-karriar',
    name: 'Google Career Certificates',
    description: 'Professionella certifikat inom IT, data och digital marknadsföring.',
    url: 'https://grow.google/certificates/',
    icon: Award,
    category: 'learning',
    tags: ['Certifikat', 'Google', 'IT']
  },
  {
    id: 'folkuniversitetet',
    name: 'Folkuniversitetet',
    description: 'Kurser och utbildningar för vuxna inom många olika områden.',
    url: 'https://www.folkuniversitetet.se/',
    icon: GraduationCap,
    category: 'learning',
    tags: ['Vuxenutbildning', 'Kurser']
  },
  {
    id: 'komvux',
    name: 'Komvux.se',
    description: 'Information om kommunal vuxenutbildning och hur du söker kurser.',
    url: 'https://www.skolverket.se/undervisning/vuxenutbildningen',
    icon: BookOpen,
    category: 'learning',
    tags: ['Komvux', 'Vuxenutbildning']
  },

  // Starta eget & Entreprenörskap
  {
    id: 'verksamt',
    name: 'Verksamt.se',
    description: 'Myndigheternas gemensamma portal för dig som vill starta och driva företag.',
    url: 'https://www.verksamt.se/',
    icon: Rocket,
    category: 'startup',
    tags: ['Starta företag', 'Guide']
  },
  {
    id: 'almi',
    name: 'Almi',
    description: 'Rådgivning och finansiering för företag och entreprenörer.',
    url: 'https://www.almi.se/',
    icon: Rocket,
    category: 'startup',
    tags: ['Finansiering', 'Rådgivning']
  },
  {
    id: 'nyforetagarcentrum',
    name: 'Nyföretagarcentrum',
    description: 'Gratis rådgivning för dig som vill starta eget företag.',
    url: 'https://nyforetagarcentrum.se/',
    icon: Lightbulb,
    category: 'startup',
    tags: ['Rådgivning', 'Gratis']
  },
  {
    id: 'foretagande',
    name: 'Företagande.se',
    description: 'Tips, råd och inspiration för småföretagare och entreprenörer.',
    url: 'https://www.foretagande.se/',
    icon: Coffee,
    category: 'startup',
    tags: ['Tips', 'Småföretag']
  },
  {
    id: 'bolagsverket',
    name: 'Bolagsverket',
    description: 'Registrera och hantera ditt företag. Information om bolagsformer.',
    url: 'https://bolagsverket.se/',
    icon: FileText,
    category: 'startup',
    tags: ['Registrering', 'Myndighet']
  },
  {
    id: 'skatteverket-foretag',
    name: 'Skatteverket - Starta företag',
    description: 'Information om skatter, moms och F-skatt för nya företagare.',
    url: 'https://www.skatteverket.se/foretag',
    icon: FileText,
    category: 'startup',
    tags: ['Skatt', 'F-skatt']
  },

  // Fler stödresurser
  {
    id: 'mind',
    name: 'Mind - Självmordslinjen',
    description: 'Stöd och hjälp för dig som mår dåligt. Chatt och telefon dygnet runt.',
    url: 'https://mind.se/',
    icon: Heart,
    category: 'support',
    tags: ['Psykisk hälsa', 'Stöd']
  },
  {
    id: 'bris',
    name: 'BRIS Vuxentelefon',
    description: 'Stöd för vuxna som är oroliga för barn. Rådgivning och vägledning.',
    url: 'https://www.bris.se/',
    icon: MessageCircle,
    category: 'support',
    tags: ['Barn', 'Stöd']
  },
  {
    id: '1177',
    name: '1177 Vårdguiden',
    description: 'Information om hälsa, sjukdomar och vård. Hitta vårdcentral.',
    url: 'https://www.1177.se/',
    icon: Heart,
    category: 'support',
    tags: ['Hälsa', 'Vård']
  },
  {
    id: 'afa-forsakring',
    name: 'AFA Försäkring',
    description: 'Information om försäkringar vid sjukdom, arbetsskada och dödsfall.',
    url: 'https://www.afaforsakring.se/',
    icon: FileText,
    category: 'support',
    tags: ['Försäkring', 'Arbetsskada']
  },
  {
    id: 'alfa-kassan',
    name: 'Alfa-kassan',
    description: 'A-kassa för dig som inte tillhör något fackförbund.',
    url: 'https://www.alfakassan.se/',
    icon: FileText,
    category: 'support',
    tags: ['A-kassa', 'Ersättning']
  },
{
    id: 'uhr-validering',
    name: 'Bedömning av utländsk utbildning (UHR)',
    description: 'Få din utländska examen bedömd så att svenska arbetsgivare förstår vad den motsvarar.',
    url: 'https://www.uhr.se/bedomning-av-utlandsk-utbildning/',
    icon: Award,
    category: 'support',
    tags: ['Validering', 'Utländsk utbildning']
  },
  {
    id: 'socialstyrelsen-legitimation',
    name: 'Legitimation för vårdyrken',
    description: 'Har du en vårdutbildning från ett annat land ansöker du om svensk legitimation här.',
    url: 'https://legitimation.socialstyrelsen.se/',
    icon: Stethoscope,
    category: 'support',
    tags: ['Legitimation', 'Vård', 'Validering']
  },
  {
    id: 'informationsverige',
    name: 'Informationsverige.se',
    description: 'Samhällsorientering på lätt svenska och elva andra språk — arbete, bostad, skola och vård.',
    url: 'https://www.informationsverige.se/sv/hem.html',
    icon: Languages,
    category: 'language',
    tags: ['Lätt svenska', 'Samhällsorientering', 'Ny i Sverige']
  },
  {
    id: 'kronofogden',
    name: 'Kronofogden - Budget',
    description: 'Hjälp med budget och ekonomisk planering. Räkna ut dina kostnader.',
    url: 'https://kronofogden.se/',
    icon: FileText,
    category: 'support',
    tags: ['Ekonomi', 'Budget']
  },

  // Mer video & media
  {
    id: 'ted-talks',
    name: 'TED Talks - Karriär',
    description: 'Inspirerande föredrag om karriär, ledarskap och personlig utveckling.',
    url: 'https://www.ted.com/topics/career',
    icon: Play,
    category: 'video',
    tags: ['Inspiration', 'Ledarskap']
  },
  {
    id: 'youtube-karriar',
    name: 'YouTube - Karriärkanaler',
    description: 'Sök efter svenska karriärkanaler med tips om jobbsökning och CV.',
    url: 'https://www.youtube.com/results?search_query=jobbsökning+tips+svenska',
    icon: Play,
    category: 'video',
    tags: ['Video', 'Tips']
  },

  // Fler guider
  {
    id: 'saco-lonekollen',
    name: 'Saco Lönekollen',
    description: 'Se vad du borde tjäna baserat på din utbildning och erfarenhet.',
    url: 'https://www.saco.se/karriar/lon/',
    icon: Briefcase,
    category: 'guide',
    tags: ['Lön', 'Statistik']
  },
  {
    id: 'scb-lon',
    name: 'SCB Lönestatistik',
    description: 'Officiell lönestatistik från Statistiska centralbyrån.',
    url: 'https://www.scb.se/hitta-statistik/sverige-i-siffror/utbildning-jobb-och-pengar/medianloner-i-sverige/',
    icon: Briefcase,
    category: 'guide',
    tags: ['Lön', 'Officiell statistik']
  },

  // ============================================
  // BRANSCHSPECIFIKA JOBBSAJTER
  // ============================================
  {
    id: 'techsverige-jobb',
    name: 'TechSverige Jobs',
    description: 'Lediga IT- och teknikjobb från branschorganisationen TechSverige.',
    url: 'https://www.techsverige.se/karriar/',
    icon: Code,
    category: 'niche',
    tags: ['IT', 'Tech', 'Utvecklare']
  },
  {
    id: 'vardforbundet-jobb',
    name: 'Vårdförbundet - Lediga jobb',
    description: 'Jobb för sjuksköterskor, barnmorskor och biomedicinska analytiker.',
    url: 'https://www.vardforbundet.se/',
    icon: Stethoscope,
    category: 'niche',
    tags: ['Vård', 'Sjukvård']
  },
  {
    id: 'lararforbundet',
    name: 'Sveriges Lärare - Lärartjänster',
    description: 'Lediga lärartjänster och karriärresurser för pedagoger.',
    url: 'https://www.sverigeslarare.se/',
    icon: GraduationCap,
    category: 'niche',
    tags: ['Lärare', 'Skola']
  },
  {
    id: 'byggjobb',
    name: 'Byggjobb.se',
    description: 'Lediga jobb inom bygg och anläggning.',
    url: 'https://byggjobs.app/',
    icon: Hammer,
    category: 'niche',
    tags: ['Bygg', 'Anläggning']
  },
  {
    id: 'transportjobb',
    name: 'Transportjobb.se',
    description: 'Jobb inom transport, logistik och lager.',
    url: 'https://www.transportjobb.se/',
    icon: Train,
    category: 'niche',
    tags: ['Transport', 'Logistik', 'Lager']
  },
  {
    id: 'hotelljobb',
    name: 'Hotelljobb.se',
    description: 'Jobb inom hotell, restaurang och besöksnäring.',
    url: 'https://www.hotelljobb.se/',
    icon: Building2,
    category: 'niche',
    tags: ['Hotell', 'Restaurang']
  },
  {
    id: 'mediajobb',
    name: 'Mediajobb.se',
    description: 'Jobb inom media, kommunikation och journalistik.',
    url: 'https://www.mediajobb.se/',
    icon: MessageCircle,
    category: 'niche',
    tags: ['Media', 'Kommunikation']
  },
  {
    id: 'designjobb',
    name: 'Designjobb.se',
    description: 'Lediga jobb för grafiska designers, UX-designers och kreatörer.',
    url: 'https://www.designjobb.se/',
    icon: Palette,
    category: 'niche',
    tags: ['Design', 'UX', 'Grafisk']
  },
  {
    id: 'finansjobb',
    name: 'Finansjobb.se',
    description: 'Jobb inom finans, bank och försäkring.',
    url: 'https://nyemissioner.se/',
    icon: Briefcase,
    category: 'niche',
    tags: ['Finans', 'Bank']
  },

  // ============================================
  // FRILANS & GIG-EKONOMI
  // ============================================
  {
    id: 'upwork',
    name: 'Upwork',
    description: 'Världens största frilansplattform för digitala tjänster.',
    url: 'https://www.upwork.com/',
    icon: Laptop,
    category: 'freelance',
    tags: ['Frilans', 'Distans']
  },
  {
    id: 'fiverr',
    name: 'Fiverr',
    description: 'Sälj dina tjänster som frilansare inom design, text, programmering och mer.',
    url: 'https://www.fiverr.com/',
    icon: Lightbulb,
    category: 'freelance',
    tags: ['Frilans', 'Gig']
  },
  {
    id: 'toptal',
    name: 'Toptal',
    description: 'Exklusivt frilansnnätverk för utvecklare, designers och finansexperter.',
    url: 'https://www.toptal.com/',
    icon: Award,
    category: 'freelance',
    tags: ['Frilans', 'Senior']
  },
  {
    id: 'freelancer',
    name: 'Freelancer.com',
    description: 'Global plattform för frilansuppdrag inom många branscher.',
    url: 'https://www.freelancer.com/',
    icon: Globe,
    category: 'freelance',
    tags: ['Frilans', 'Global']
  },
  {
    id: 'taskrunner',
    name: 'TaskRunner',
    description: 'Utför småjobb och tjänster i ditt närområde.',
    url: 'https://www.taskrunner.se/',
    icon: Wrench,
    category: 'freelance',
    tags: ['Småjobb', 'Lokalt']
  },
  {
    id: 'mentorsverige',
    name: 'Mentor Sverige',
    description: 'Mentorprogram för unga vuxna som vill utvecklas i karriären.',
    url: 'https://mentor.se/',
    icon: Handshake,
    category: 'networking',
    tags: ['Mentor', 'Ungdom']
  },
  {
    id: 'nyckeltalnatet',
    name: 'Nyckeltalsnätverket',
    description: 'Nätverk för professionella inom HR och ledarskap.',
    url: 'https://nyckeltal.se/',
    icon: Users,
    category: 'networking',
    tags: ['HR', 'Ledarskap']
  },
  {
    id: 'svenskt-naringsliv',
    name: 'Svenskt Näringsliv',
    description: 'Företagens organisation med nätverk och resurser för arbetsmarknad.',
    url: 'https://www.svensktnaringsliv.se/',
    icon: Building2,
    category: 'networking',
    tags: ['Näringsliv', 'Företag']
  },
  {
    id: 'foretagarna',
    name: 'Företagarna',
    description: 'Sveriges största företagarorganisation med lokala nätverk.',
    url: 'https://www.foretagarna.se/',
    icon: Handshake,
    category: 'networking',
    tags: ['Företag', 'Nätverk']
  },
  {
    id: 'bni-sverige',
    name: 'BNI Sverige',
    description: 'Business Network International - strukturerat affärsnätverkande.',
    url: 'https://bni.nu/sv/index',
    icon: Handshake,
    category: 'networking',
    tags: ['Nätverk', 'Affärer']
  },
  {
    id: 'meetup',
    name: 'Meetup',
    description: 'Hitta lokala nätverksträffar och professionella event.',
    url: 'https://www.meetup.com/',
    icon: Users,
    category: 'networking',
    tags: ['Event', 'Lokalt']
  },
  {
    id: 'eventbrite',
    name: 'Eventbrite',
    description: 'Hitta karriärevent, workshops och nätverksträffar.',
    url: 'https://www.eventbrite.se/',
    icon: Calendar,
    category: 'networking',
    tags: ['Event', 'Workshop']
  },

  // ============================================
  // TILLGÄNGLIGHET & FUNKTIONSVARIATION
  // ============================================
  {
    id: 'samhall',
    name: 'Samhall',
    description: 'Jobb för personer med funktionsnedsättning. Sveriges största arbetsgivare för personer med funktionshinder.',
    url: 'https://samhall.se/',
    icon: Accessibility,
    category: 'accessibility',
    tags: ['Funktionsvariation', 'Jobb']
  },
  {
    id: 'misa',
    name: 'Misa',
    description: 'Stöd och arbetsträning för personer med psykisk funktionsnedsättning.',
    url: 'https://www.misa.se/',
    icon: Heart,
    category: 'accessibility',
    tags: ['Psykisk hälsa', 'Stöd']
  },
  {
    id: 'specialpedagogiska',
    name: 'SPSM - Arbete',
    description: 'Specialpedagogiska skolmyndighetens resurser om arbete och funktionsnedsättning.',
    url: 'https://www.spsm.se/',
    icon: BookOpen,
    category: 'accessibility',
    tags: ['Funktionsvariation', 'Guide']
  },
  {
    id: 'funktionsratt',
    name: 'Funktionsrätt Sverige',
    description: 'Paraplyorganisation för funktionsrättsrörelsen med information om rättigheter.',
    url: 'https://funktionsratt.se/',
    icon: Scale,
    category: 'accessibility',
    tags: ['Rättigheter', 'Funktionsvariation']
  },
  {
    id: 'synskadades-riksforbund',
    name: 'Synskadades Riksförbund',
    description: 'Stöd och resurser för synskadade i arbetslivet.',
    url: 'https://www.srf.nu/',
    icon: Accessibility,
    category: 'accessibility',
    tags: ['Synskada', 'Stöd']
  },
  {
    id: 'horselskadades-riksforbund',
    name: 'Hörselskadades Riksförbund',
    description: 'Resurser för hörselskadade om arbete och anpassningar.',
    url: 'https://hrf.se/',
    icon: Accessibility,
    category: 'accessibility',
    tags: ['Hörselskada', 'Stöd']
  },
  {
    id: 'attention',
    name: 'Attention - NPF',
    description: 'Riksförbundet Attention för personer med NPF (ADHD, autism m.m.).',
    url: 'https://attention.se/',
    icon: Heart,
    category: 'accessibility',
    tags: ['ADHD', 'Autism', 'NPF']
  },
  {
    id: 'af-funktionsnedsattning',
    name: 'AF - Stöd vid funktionsnedsättning',
    description: 'Arbetsförmedlingens stöd för arbetssökande med funktionsnedsättning.',
    url: 'https://arbetsformedlingen.se/for-arbetssokande/stod-och-ersattning/stod-a-o/stod-till-dig-som-har-en-funktionsnedsattning',
    icon: Accessibility,
    category: 'accessibility',
    tags: ['Stöd', 'Arbetsförmedlingen']
  },

  // ============================================
  // UNGDOM & STUDENTER
  // ============================================
  {
    id: 'sommarjobb',
    name: 'Sommarjobb.se',
    description: 'Hitta sommarjobb för ungdomar och studenter.',
    url: 'https://www.sommarjobb.se/',
    icon: Clock,
    category: 'youth',
    tags: ['Sommarjobb', 'Ungdom']
  },
  {
    id: 'akademiskkvart',
    name: 'Akademisk Kvart',
    description: 'Karriärresurser för studenter och nyexaminerade.',
    url: 'https://www.akademiskkvart.se/',
    icon: GraduationCap,
    category: 'youth',
    tags: ['Student', 'Karriär']
  },
  {
    id: 'praktikplatsen',
    name: 'Praktikplatsen',
    description: 'Hitta praktikplatser och LIA för studenter.',
    url: 'https://www.praktikplatsen.se/',
    icon: Briefcase,
    category: 'youth',
    tags: ['Praktik', 'LIA']
  },
  {
    id: 'ung-foretag',
    name: 'Ung Företagsamhet',
    description: 'Starta UF-företag som gymnasieelev. Entreprenörskap för unga.',
    url: 'https://ungforetagsamhet.se/',
    icon: Rocket,
    category: 'youth',
    tags: ['UF', 'Entreprenör']
  },
  {
    id: 'volontarbyran',
    name: 'Volontärbyrån',
    description: 'Hitta volontäruppdrag och få erfarenhet samtidigt som du gör gott.',
    url: 'https://www.volontarbyran.org/',
    icon: Heart,
    category: 'youth',
    tags: ['Volontär', 'Erfarenhet']
  },

  // ============================================
  // REGIONALA JOBBRESURSER
  // ============================================
  {
    id: 'stockholm-business-region',
    name: 'Stockholm Business Region',
    description: 'Jobb och näringslivsinformation för Stockholmsregionen.',
    url: 'https://www.stockholmbusinessregion.com/',
    icon: MapPin,
    category: 'regional',
    tags: ['Stockholm', 'Näringsliv']
  },
  {
    id: 'business-region-goteborg',
    name: 'Business Region Göteborg',
    description: 'Karriär och företagande i Göteborgsregionen.',
    url: 'https://www.businessregiongoteborg.se/',
    icon: MapPin,
    category: 'regional',
    tags: ['Göteborg', 'Näringsliv']
  },
  {
    id: 'invest-in-skane',
    name: 'Invest in Skåne',
    description: 'Jobb och företagande i Skåneregionen.',
    url: 'https://www.investinskane.com/',
    icon: MapPin,
    category: 'regional',
    tags: ['Skåne', 'Malmö']
  },
  {
    id: 'regionuppsala',
    name: 'Region Uppsala - Jobb',
    description: 'Lediga jobb inom Region Uppsala.',
    url: 'https://regionuppsala.se/jobba-hos-oss/',
    icon: MapPin,
    category: 'regional',
    tags: ['Uppsala', 'Offentlig']
  },
  {
    id: 'vgregion-jobb',
    name: 'Västra Götalandsregionen - Jobb',
    description: 'Lediga tjänster inom Västra Götalandsregionen.',
    url: 'https://www.vgregion.se/jobba-hos-oss/',
    icon: MapPin,
    category: 'regional',
    tags: ['VGR', 'Offentlig']
  },
  {
    id: 'norrbotten',
    name: 'Norrbotten - Flytta norrut',
    description: 'Jobb och livskvalitet i Norrbotten. Flytta norrut-kampanjen.',
    url: 'https://www.norrbotten.se/',
    icon: MapPin,
    category: 'regional',
    tags: ['Norrbotten', 'Norrland']
  },
  {
    id: 'glassdoor',
    name: 'Glassdoor Sverige',
    description: 'Läs omdömen om arbetsgivare, löner och intervjufrågor.',
    url: 'https://www.glassdoor.se/',
    icon: Building2,
    category: 'guide',
    tags: ['Omdömen', 'Löner']
  },
  {
    id: 'karriarguiden',
    name: 'Karriärguiden',
    description: 'Tips och råd om karriärutveckling och jobbyte.',
    url: 'https://www.karriarguiden.se/',
    icon: BookOpen,
    category: 'guide',
    tags: ['Karriär', 'Tips']
  },
  {
    id: 'foretagsnamn',
    name: 'Företagsnamn.se',
    description: 'Kontrollera och registrera företagsnamn.',
    url: 'https://www.foretagsnamn.se/',
    icon: FileText,
    category: 'guide',
    tags: ['Företag', 'Registrering']
  },
  {
    id: 'canva',
    name: 'Canva',
    description: 'Skapa professionella CV, presentationer och grafik gratis.',
    url: 'https://www.canva.com/',
    icon: Palette,
    category: 'guide',
    tags: ['Design', 'CV']
  },
  {
    id: 'novoresume',
    name: 'Novoresume',
    description: 'CV-byggare med professionella mallar.',
    url: 'https://novoresume.com/',
    icon: FileText,
    category: 'guide',
    tags: ['CV', 'Mallar']
  },
  {
    id: 'europass',
    name: 'Europass CV',
    description: 'EU:s officiella CV-format för jobb i Europa.',
    url: 'https://europass.europa.eu/',
    icon: Globe,
    category: 'guide',
    tags: ['CV', 'EU', 'Europa']
  },
  {
    id: 'grammarly',
    name: 'Grammarly',
    description: 'Förbättra din engelska i CV och ansökningar.',
    url: 'https://www.grammarly.com/',
    icon: FileText,
    category: 'guide',
    tags: ['Engelska', 'Skrivande']
  },

  // ============================================
  // FLER STÖDRESURSER
  // ============================================
  {
    id: 'rodakorset',
    name: 'Röda Korset',
    description: 'Stöd och hjälp för utsatta grupper, inklusive asylsökande.',
    url: 'https://www.rodakorset.se/',
    icon: Heart,
    category: 'support',
    tags: ['Stöd', 'Humanitärt']
  },
  {
    id: 'stadsmissionen',
    name: 'Stadsmissionen',
    description: 'Stöd för hemlösa och personer i utsatthet.',
    url: 'https://www.stadsmissionen.se/',
    icon: Heart,
    category: 'support',
    tags: ['Stöd', 'Utsatthet']
  },
  {
    id: 'jobbcoach',
    name: 'Hitta jobbcoach',
    description: 'Information om hur du kan få en jobbcoach genom Arbetsförmedlingen.',
    url: 'https://arbetsformedlingen.se/for-arbetssokande/stod-och-ersattning/stod-a-o/stod-och-matchning',
    icon: Users,
    category: 'support',
    tags: ['Jobbcoach', 'Stöd']
  },
  {
    id: 'foraldraledighet',
    name: 'Försäkringskassan - Förälder',
    description: 'Information om föräldrapenning och VAB.',
    url: 'https://www.forsakringskassan.se/privatpers/foralder',
    icon: Baby,
    category: 'support',
    tags: ['Föräldraledighet', 'VAB']
  },
  {
    id: 'skuldradgivning',
    name: 'Konsumentverket - Skuldrådgivning',
    description: 'Gratis skuldrådgivning i din kommun.',
    url: 'https://www.konsumentverket.se/konsument/',
    icon: FileText,
    category: 'support',
    tags: ['Skuld', 'Ekonomi']
  },
  {
    id: 'arbetsgivaralliansen',
    name: 'Arbetsgivaralliansen',
    description: 'Arbetsgivarorganisation för kooperativa och ideella organisationer.',
    url: 'https://www.arbetsgivaralliansen.se/',
    icon: Building2,
    category: 'support',
    tags: ['Arbetsgivare', 'Ideell']
  },

  // ============================================
  // BEMANNINGSFÖRETAG & REKRYTERING
  // ============================================
  {
    id: 'manpower',
    name: 'Manpower',
    description: 'Ett av Sveriges största bemanningsföretag med jobb inom många branscher.',
    url: 'https://www.manpower.se/',
    icon: Users,
    category: 'staffing',
    tags: ['Bemanning', 'Rekrytering']
  },
  {
    id: 'adecco',
    name: 'Adecco',
    description: 'Global bemannings- och rekryteringspartner med jobb i hela Sverige.',
    url: 'https://www.adecco.com/sv-se',
    icon: Users,
    category: 'staffing',
    tags: ['Bemanning', 'Rekrytering']
  },
  {
    id: 'randstad',
    name: 'Randstad',
    description: 'Bemannings- och rekryteringsföretag med fokus på matchning.',
    url: 'https://www.randstad.se/',
    icon: Users,
    category: 'staffing',
    tags: ['Bemanning', 'Matchning']
  },
  {
    id: 'academicwork',
    name: 'Academic Work',
    description: 'Rekrytering och bemanning för studenter och young professionals.',
    url: 'https://www.academicwork.se/',
    icon: GraduationCap,
    category: 'staffing',
    tags: ['Student', 'Young professionals']
  },
  {
    id: 'poolia',
    name: 'Poolia',
    description: 'Rekrytering och bemanning inom ekonomi, HR, IT och administration.',
    url: 'https://www.poolia.se/',
    icon: Briefcase,
    category: 'staffing',
    tags: ['Ekonomi', 'HR', 'IT']
  },
  {
    id: 'studentconsulting',
    name: 'StudentConsulting',
    description: 'Rekrytering och bemanning för studenter och nyexaminerade.',
    url: 'https://www.studentconsulting.com/',
    icon: GraduationCap,
    category: 'staffing',
    tags: ['Student', 'Extrajobb']
  },
  {
    id: 'lernia',
    name: 'Lernia',
    description: 'Bemanning, utbildning och matchning. Hjälper arbetssökande till jobb.',
    url: 'https://www.lernia.se/',
    icon: Users,
    category: 'staffing',
    tags: ['Bemanning', 'Utbildning']
  },
  {
    id: 'dedicare',
    name: 'Dedicare',
    description: 'Bemanningsföretag specialiserat på vård och omsorg.',
    url: 'https://www.dedicare.se/',
    icon: Stethoscope,
    category: 'staffing',
    tags: ['Vård', 'Omsorg']
  },
  {
    id: 'jeffersonwells',
    name: 'Jefferson Wells',
    description: 'Executive search och rekrytering av chefer och specialister.',
    url: 'https://www.jeffersonwells.se/',
    icon: Award,
    category: 'staffing',
    tags: ['Chefsrekrytering', 'Executive']
  },

  // ============================================
  // INTERNATIONELLT & EU
  // ============================================
  {
    id: 'eures',
    name: 'EURES - Jobba i EU',
    description: 'EU:s jobbportal för att hitta jobb i hela Europa.',
    url: 'https://eures.europa.eu/',
    icon: Globe,
    category: 'international',
    tags: ['EU', 'Europa', 'Utlandsjobb']
  },
  {
    id: 'europass-portal',
    name: 'Europass Portal',
    description: 'Skapa CV, sök jobb och hitta utbildning i Europa.',
    url: 'https://europass.europa.eu/select-language?destination=/node/1',
    icon: Globe,
    category: 'international',
    tags: ['EU', 'CV', 'Utbildning']
  },
  {
    id: 'working-abroad',
    name: 'Working Abroad',
    description: 'Guide till att jobba utomlands med tips och erfarenheter.',
    url: 'https://eures.europa.eu/index_sv',
    icon: Globe,
    category: 'international',
    tags: ['Utlandsjobb', 'Guide']
  },
  {
    id: 'erasmus-internships',
    name: 'Erasmus+ Praktik',
    description: 'Praktik utomlands genom EU:s Erasmus+ program.',
    url: 'https://erasmus-plus.ec.europa.eu/',
    icon: GraduationCap,
    category: 'international',
    tags: ['Praktik', 'EU', 'Erasmus']
  },
  {
    id: 'nordic-jobs',
    name: 'Nordic Jobs Worldwide',
    description: 'Jobb för skandinaver i hela världen.',
    url: 'https://www.nordicjobsworldwide.com/',
    icon: Globe,
    category: 'international',
    tags: ['Norden', 'Utlandsjobb']
  },
  {
    id: 'new-in-sweden',
    name: 'New in Sweden',
    description: 'Information för nyanlända om att arbeta och leva i Sverige.',
    url: 'https://www.informationsverige.se/',
    icon: Globe,
    category: 'international',
    tags: ['Nyanländ', 'Integration']
  },
  {
    id: 'linkedin-global',
    name: 'LinkedIn - Internationella jobb',
    description: 'Sök jobb globalt på LinkedIn med filtret "Remote" eller specifika länder.',
    url: 'https://www.linkedin.com/jobs/international-jobs/',
    icon: Globe,
    category: 'international',
    tags: ['Globalt', 'Nätverk']
  },

  // ============================================
  // SPRÅKINLÄRNING
  // ============================================
  {
    id: 'sfi',
    name: 'SFI - Svenska för invandrare',
    description: 'Hitta SFI-kurser i din kommun för att lära dig svenska.',
    url: 'https://www.skolverket.se/undervisning/vuxenutbildningen/komvux-svenska-for-invandrare-sfi',
    icon: Languages,
    category: 'language',
    tags: ['Svenska', 'SFI']
  },
  {
    id: 'duolingo',
    name: 'Duolingo',
    description: 'Lär dig svenska och andra språk gratis med gamification.',
    url: 'https://www.duolingo.com/',
    icon: Languages,
    category: 'language',
    tags: ['Språk', 'Gratis', 'App']
  },
  {
    id: 'babbel',
    name: 'Babbel',
    description: 'Språkkurser online med fokus på konversation.',
    url: 'https://www.babbel.com/',
    icon: Languages,
    category: 'language',
    tags: ['Språk', 'Konversation']
  },
  {
    id: 'svenska-nu',
    name: 'SVT Svenska',
    description: 'Lär dig svenska med SVT:s gratis material och program.',
    url: 'https://urplay.se/',
    icon: Play,
    category: 'language',
    tags: ['Svenska', 'Gratis', 'Video']
  },
  {
    id: 'digital-spraktraning',
    name: 'Digitala spårkträning',
    description: 'Arbetsförmedlingens digitala verktyg för språkträning.',
    url: 'https://arbetsformedlingen.se/for-arbetssokande/stod-och-ersattning/stod-a-o/digital-spraktraning',
    icon: Languages,
    category: 'language',
    tags: ['Svenska', 'Arbetsförmedlingen']
  },
  {
    id: 'english-first',
    name: 'EF English Live',
    description: 'Onlinekurser i engelska för karriären.',
    url: 'https://www.ef.se/',
    icon: Languages,
    category: 'language',
    tags: ['Engelska', 'Business']
  },

  // ============================================
  // DISTANSARBETE & REMOTE
  // ============================================
  {
    id: 'remote-ok',
    name: 'RemoteOK',
    description: 'Ledande plattform för remote-jobb globalt.',
    url: 'https://remoteok.com/',
    icon: Globe,
    category: 'remote',
    tags: ['Remote', 'Distans', 'Globalt']
  },
  {
    id: 'weworkremotely',
    name: 'We Work Remotely',
    description: 'Största community för remote-jobb inom tech.',
    url: 'https://weworkremotely.com/',
    icon: Globe,
    category: 'remote',
    tags: ['Remote', 'Tech']
  },
  {
    id: 'flexjobs',
    name: 'FlexJobs',
    description: 'Flexibla jobb och distansarbete med kvalitetsgaranti.',
    url: 'https://www.flexjobs.com/',
    icon: Home,
    category: 'remote',
    tags: ['Flexibelt', 'Remote']
  },
  {
    id: 'nomadlist',
    name: 'Nomad List',
    description: 'Bästa städerna för digitala nomader och remote-arbetare.',
    url: 'https://nomads.com/',
    icon: Globe,
    category: 'remote',
    tags: ['Digital nomad', 'Städer']
  },

  // ============================================
  // GRÖNA JOBB & HÅLLBARHET
  // ============================================
  {
    id: 'gronajobb',
    name: 'Gröna Jobb',
    description: 'Jobb inom miljö, klimat och hållbar utveckling.',
    url: 'https://www.gronajobb.se/',
    icon: Leaf,
    category: 'green',
    tags: ['Miljö', 'Hållbarhet']
  },
  {
    id: 'naturvardsverket-jobb',
    name: 'Naturvårdsverket - Jobb',
    description: 'Jobba med miljöfrågor på Naturvårdsverket.',
    url: 'https://www.naturvardsverket.se/om-oss/jobba-hos-oss/',
    icon: Leaf,
    category: 'green',
    tags: ['Myndighet', 'Miljö']
  },
  {
    id: 'energimyndigheten',
    name: 'Energimyndigheten - Karriär',
    description: 'Jobba med energiomställningen och klimatfrågor.',
    url: 'https://www.energimyndigheten.se/om-oss/jobba-hos-oss/',
    icon: Leaf,
    category: 'green',
    tags: ['Energi', 'Klimat']
  },
  {
    id: 'fossilfritt-sverige',
    name: 'Fossilfritt Sverige',
    description: 'Nätverk av företag som satsar på fossilfrihet och gröna jobb.',
    url: 'https://fossilfrittsverige.se/',
    icon: Leaf,
    category: 'green',
    tags: ['Fossilfritt', 'Nätverk']
  },

  // ============================================
  // SENIORER (55+)
  // ============================================
  {
    id: 'seniorjobb',
    name: 'Seniorjobb.se',
    description: 'Jobbsajt för personer 55+ med erfarenhet.',
    url: 'https://www.seniorjobb.se/',
    icon: Users,
    category: 'senior',
    tags: ['55+', 'Senior', 'Erfarenhet']
  },
  {
    id: 'seniorkraft',
    name: 'Seniorkraft',
    description: 'Uthyrning av pensionärer och seniorer för konsultuppdrag.',
    url: 'https://www.seniorkraft.se/',
    icon: Award,
    category: 'senior',
    tags: ['Konsult', 'Pensionär']
  },
  {
    id: 'af-senior',
    name: 'AF - Stöd för äldre arbetssökande',
    description: 'Arbetsförmedlingens stöd för arbetssökande över 55 år.',
    url: 'https://arbetsformedlingen.se/for-arbetssokande/stod-och-ersattning/stod-a-o/arbete-for-aldre',
    icon: Users,
    category: 'senior',
    tags: ['Stöd', 'Arbetsförmedlingen']
  },
  {
    id: 'mySis',
    name: 'MyDreamNow',
    description: 'Mentorskap och nätverk för unga med utländsk bakgrund.',
    url: 'https://mydreamnow.se/',
    icon: Sparkles,
    category: 'diversity',
    tags: ['Mentor', 'Integration']
  },
  {
    id: 'jobbsprånget',
    name: 'Jobbsprånget',
    description: 'Praktikprogram för nyanlända akademiker hos svenska företag.',
    url: 'https://www.jobbspranget.se/',
    icon: Rocket,
    category: 'diversity',
    tags: ['Praktik', 'Nyanländ', 'Akademiker']
  },
  {
    id: 'korta-vagen',
    name: 'Korta vägen',
    description: 'Snabbspår till jobb för utrikesfödda akademiker.',
    url: 'https://arbetsformedlingen.se/for-arbetssokande/extra-stod',
    icon: Target,
    category: 'diversity',
    tags: ['Snabbspår', 'Akademiker']
  },
  {
    id: 'tech-talents',
    name: 'Techtalents',
    description: 'Program för nyanlända inom tech och IT.',
    url: 'https://techtalents.se/',
    icon: Code,
    category: 'diversity',
    tags: ['Tech', 'Nyanländ']
  },
  {
    id: 'women-in-tech',
    name: 'Women in Tech Sweden',
    description: 'Nätverk för kvinnor inom tech och IT.',
    url: 'https://www.womenintech.se/',
    icon: Code,
    category: 'diversity',
    tags: ['Kvinnor', 'Tech']
  },
  {
    id: 'trr',
    name: 'TRR Trygghetsrådet',
    description: 'Omställningsstöd för tjänstemän — kräver att du sagts upp från en anställning med kollektivavtal.',
    url: 'https://www.trr.se/',
    icon: RefreshCw,
    category: 'career-change',
    tags: ['Omställning', 'Tjänstemän']
  },
  {
    id: 'tsn',
    name: 'TSN - Trygghetsstiftelsen',
    description: 'Omställningsstöd för statligt anställda.',
    url: 'https://www.tsn.se/',
    icon: RefreshCw,
    category: 'career-change',
    tags: ['Omställning', 'Statlig']
  },
  {
    id: 'tsl',
    name: 'TSL - Trygghetsfonden',
    description: 'Omställningsstöd för arbetare — kräver att du sagts upp från en anställning med kollektivavtal.',
    url: 'https://www.tsl.se/',
    icon: RefreshCw,
    category: 'career-change',
    tags: ['Omställning', 'Arbetare']
  },
  {
    id: 'omstallningsfonden',
    name: 'Omställningsfonden',
    description: 'Omställningsstöd i kommun och region — kräver att du sagts upp från en sådan anställning.',
    url: 'https://www.omstallningsfonden.se/',
    icon: RefreshCw,
    category: 'career-change',
    tags: ['Kommun', 'Region', 'Omställning']
  },
  {
    id: 'karriarbyte',
    name: 'Karriärbyte.se',
    description: 'Inspiration och tips för dig som vill byta karriär.',
    url: 'https://www.karriarbyte.se/',
    icon: RefreshCw,
    category: 'career-change',
    tags: ['Karriärbyte', 'Tips']
  },
  {
    id: 'microsoft-certifications',
    name: 'Microsoft Certifications',
    description: 'Officiella Microsoft-certifieringar inom IT och moln.',
    url: 'https://learn.microsoft.com/certifications/',
    icon: Award,
    category: 'certifications',
    tags: ['Microsoft', 'IT', 'Moln']
  },
  {
    id: 'aws-certifications',
    name: 'AWS Certifications',
    description: 'Amazon Web Services certifieringar för molnteknik.',
    url: 'https://aws.amazon.com/certification/',
    icon: Award,
    category: 'certifications',
    tags: ['AWS', 'Moln', 'Cloud']
  },
  {
    id: 'google-cloud',
    name: 'Google Cloud Certifications',
    description: 'Google Cloud Platform certifieringar.',
    url: 'https://cloud.google.com/certification',
    icon: Award,
    category: 'certifications',
    tags: ['Google', 'Cloud']
  },
  {
    id: 'pmi',
    name: 'PMI - Projektledning',
    description: 'PMP och andra projektledarcertifieringar.',
    url: 'https://www.pmi.org/',
    icon: Award,
    category: 'certifications',
    tags: ['Projektledning', 'PMP']
  },
  {
    id: 'scrum-org',
    name: 'Scrum.org',
    description: 'Scrum Master och Product Owner certifieringar.',
    url: 'https://www.scrum.org/',
    icon: Award,
    category: 'certifications',
    tags: ['Scrum', 'Agile']
  },
  {
    id: 'itil',
    name: 'ITIL Certifications',
    description: 'ITIL-certifieringar för IT Service Management.',
    url: 'https://www.axelos.com/certifications/itil-service-management',
    icon: Award,
    category: 'certifications',
    tags: ['ITIL', 'IT-service']
  },
  {
    id: 'salesforce',
    name: 'Salesforce Trailhead',
    description: 'Gratis Salesforce-utbildning och certifieringar.',
    url: 'https://trailhead.salesforce.com/',
    icon: Award,
    category: 'certifications',
    tags: ['Salesforce', 'CRM']
  },
  {
    id: 'hubspot',
    name: 'HubSpot Academy',
    description: 'Gratis certifieringar inom marknadsföring och försäljning.',
    url: 'https://academy.hubspot.com/',
    icon: Award,
    category: 'certifications',
    tags: ['Marknadsföring', 'Försäljning']
  },
  {
    id: 'sixsigma',
    name: 'Six Sigma Certifications',
    description: 'Lean Six Sigma certifieringar för processförbättring.',
    url: 'https://www.sixsigmaonline.org/',
    icon: Award,
    category: 'certifications',
    tags: ['Lean', 'Six Sigma']
  },

  // ============================================
  // OFFENTLIG SEKTOR & MYNDIGHETER
  // ============================================
  {
    id: 'jobba-statligt',
    name: 'Jobba statligt',
    description: 'Samlade lediga jobb hos svenska myndigheter och statliga verk.',
    url: 'https://www.jobbastatligt.se/',
    icon: Landmark,
    category: 'public-sector',
    tags: ['Statligt', 'Myndighet']
  },
  {
    id: 'polisen-jobb',
    name: 'Polisen - Jobba hos oss',
    description: 'Bli polis eller jobba civilt inom Polismyndigheten.',
    url: 'https://polisen.se/jobb-och-utbildning/',
    icon: Shield,
    category: 'public-sector',
    tags: ['Polis', 'Säkerhet']
  },
  {
    id: 'forsvarsmakten',
    name: 'Försvarsmakten - Karriär',
    description: 'Militära och civila jobb inom Försvarsmakten.',
    url: 'https://www.forsvarsmakten.se/varnplikt-och-karriar/',
    icon: Shield,
    category: 'public-sector',
    tags: ['Försvar', 'Militär']
  },
  {
    id: 'kriminalvarden',
    name: 'Kriminalvården - Jobb',
    description: 'Jobba som kriminalvårdare eller i andra roller.',
    url: 'https://www.kriminalvarden.se/jobba-hos-oss/',
    icon: Shield,
    category: 'public-sector',
    tags: ['Kriminalvård', 'Säkerhet']
  },
  {
    id: 'socialstyrelsen',
    name: 'Socialstyrelsen - Karriär',
    description: 'Jobba med hälsa, vård och socialtjänst på Socialstyrelsen.',
    url: 'https://www.socialstyrelsen.se/om-socialstyrelsen/jobba-hos-oss/',
    icon: Heart,
    category: 'public-sector',
    tags: ['Socialt', 'Hälsa']
  },
  {
    id: 'trafikverket',
    name: 'Trafikverket - Lediga jobb',
    description: 'Jobb inom infrastruktur, vägar och järnväg.',
    url: 'https://www.trafikverket.se/om-oss/jobba-hos-oss/',
    icon: Train,
    category: 'public-sector',
    tags: ['Infrastruktur', 'Transport']
  },
  {
    id: 'skatteverket-jobb',
    name: 'Skatteverket - Jobba hos oss',
    description: 'Karriärmöjligheter på Skatteverket.',
    url: 'https://www.skatteverket.se/omoss/jobbahososs',
    icon: FileText,
    category: 'public-sector',
    tags: ['Skatt', 'Ekonomi']
  },
  {
    id: 'lantmateriet',
    name: 'Lantmäteriet - Karriär',
    description: 'Jobb inom kartläggning, geodata och fastigheter.',
    url: 'https://www.lantmateriet.se/sv/om-lantmateriet/Jobba-hos-oss/',
    icon: MapPin,
    category: 'public-sector',
    tags: ['Geodata', 'Fastigheter']
  },
  {
    id: 'riksdagen',
    name: 'Riksdagen - Lediga jobb',
    description: 'Jobba i Sveriges riksdag med demokrati och politik.',
    url: 'https://www.riksdagen.se/sv/',
    icon: Landmark,
    category: 'public-sector',
    tags: ['Politik', 'Demokrati']
  },
  {
    id: 'domstol',
    name: 'Sveriges Domstolar - Karriär',
    description: 'Jobba som domare, notarie eller i andra roller.',
    url: 'https://www.domstol.se/om-sveriges-domstolar/jobba-hos-oss/',
    icon: Gavel,
    category: 'public-sector',
    tags: ['Juridik', 'Domstol']
  },
  {
    id: 'skolverket-jobb',
    name: 'Skolverket - Lediga tjänster',
    description: 'Jobba med utbildningsfrågor på Skolverket.',
    url: 'https://www.skolverket.se/',
    icon: GraduationCap,
    category: 'public-sector',
    tags: ['Utbildning', 'Skola']
  },
  {
    id: 'sj-jobb',
    name: 'SJ - Karriär',
    description: 'Jobb som tågvärd, lokförare och andra roller på SJ.',
    url: 'https://www.sj.se/om-sj/jobba-pa-sj',
    icon: Train,
    category: 'public-sector',
    tags: ['Tåg', 'Transport']
  },

  // ============================================
  // PERSONLIGHETSTESTER & ASSESSMENT
  // ============================================
  {
    id: '16personalities',
    name: '16Personalities',
    description: 'Gratis personlighetstest baserat på MBTI-typologi.',
    url: 'https://www.16personalities.com/sv',
    icon: Brain,
    category: 'assessment',
    tags: ['MBTI', 'Personlighet']
  },
  {
    id: 'big-five',
    name: 'Big Five Test',
    description: 'Vetenskapligt personlighetstest med fem dimensioner.',
    url: 'https://www.truity.com/test/big-five-personality-test',
    icon: Brain,
    category: 'assessment',
    tags: ['Big Five', 'Personlighet']
  },
  {
    id: 'strengthsfinder',
    name: 'Gallup StrengthsFinder',
    description: 'Upptäck dina styrkor och talanger.',
    url: 'https://www.gallup.com/cliftonstrengths/',
    icon: Target,
    category: 'assessment',
    tags: ['Styrkor', 'Talanger']
  },
  {
    id: 'disc-test',
    name: 'DISC Assessment',
    description: 'Förstå din kommunikationsstil och beteende.',
    url: 'https://www.discprofile.com/',
    icon: Brain,
    category: 'assessment',
    tags: ['DISC', 'Kommunikation']
  },
  {
    id: 'behance',
    name: 'Behance',
    description: 'Visa upp ditt kreativa arbete för rekryterare världen över.',
    url: 'https://www.behance.net/',
    icon: Palette,
    category: 'portfolio',
    tags: ['Design', 'Portfolio']
  },
  {
    id: 'dribbble',
    name: 'Dribbble',
    description: 'Community för designers att visa upp sitt arbete och hitta jobb.',
    url: 'https://dribbble.com/',
    icon: Palette,
    category: 'portfolio',
    tags: ['Design', 'UI/UX']
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Visa upp dina kodprojekt och bidra till open source.',
    url: 'https://github.com/',
    icon: Code,
    category: 'portfolio',
    tags: ['Kod', 'Utvecklare']
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    description: 'Alternativ till GitHub för kodportfolio och samarbete.',
    url: 'https://about.gitlab.com/',
    icon: Code,
    category: 'portfolio',
    tags: ['Kod', 'DevOps']
  },
  {
    id: 'codepen',
    name: 'CodePen',
    description: 'Visa upp frontend-projekt och experimentera med kod.',
    url: 'https://codepen.io/',
    icon: Code,
    category: 'portfolio',
    tags: ['Frontend', 'Webb']
  },
  {
    id: 'artstation',
    name: 'ArtStation',
    description: 'Portfolio-plattform för spelgrafiker och 3D-artister.',
    url: 'https://www.artstation.com/',
    icon: Play,
    category: 'portfolio',
    tags: ['Spel', '3D', 'Grafik']
  },
  {
    id: 'vimeo',
    name: 'Vimeo',
    description: 'Visa upp videoproduktioner och filmportfolio.',
    url: 'https://vimeo.com/',
    icon: Video,
    category: 'portfolio',
    tags: ['Video', 'Film']
  },
  {
    id: 'soundcloud',
    name: 'SoundCloud',
    description: 'Portfolio för musiker och ljudproducenter.',
    url: 'https://soundcloud.com/',
    icon: Headphones,
    category: 'portfolio',
    tags: ['Musik', 'Ljud']
  },
  {
    id: 'medium',
    name: 'Medium',
    description: 'Publicera artiklar och bygg din expertprofil.',
    url: 'https://medium.com/',
    icon: PenTool,
    category: 'portfolio',
    tags: ['Skrivande', 'Blogg']
  },
  {
    id: 'wordpress',
    name: 'WordPress',
    description: 'Skapa en egen portfolio-webbplats.',
    url: 'https://wordpress.com/',
    icon: Globe,
    category: 'portfolio',
    tags: ['Webb', 'Portfolio']
  },

  // ============================================
  // KREATIVA & KULTURELLA JOBB
  // ============================================
  {
    id: 'journalistforbundet',
    name: 'Journalistförbundet - Jobb',
    description: 'Lediga jobb för journalister och mediaarbetare.',
    url: 'https://www.sjf.se/',
    icon: Newspaper,
    category: 'creative',
    tags: ['Journalistik', 'Media']
  },
  {
    id: 'arkitektjobb',
    name: 'Sveriges Arkitekter - Karriär',
    description: 'Lediga jobb för arkitekter och planerare.',
    url: 'https://www.arkitekt.se/karriar/',
    icon: Building2,
    category: 'creative',
    tags: ['Arkitektur', 'Design']
  },
  {
    id: 'akademiska-jobb',
    name: 'Akademiska jobb',
    description: 'Lediga tjänster på universitet och högskolor.',
    url: 'https://www.academicpositions.se/',
    icon: Search,
    category: 'science',
    tags: ['Akademi', 'Forskning']
  },
  {
    id: 'euraxess',
    name: 'EURAXESS',
    description: 'Europeiska forskartjänster och mobilitetsprogram.',
    url: 'https://euraxess.ec.europa.eu/',
    icon: Search,
    category: 'science',
    tags: ['Forskning', 'EU']
  },
  {
    id: 'vetenskapsradet',
    name: 'Vetenskapsrådet - Karriär',
    description: 'Jobb och stipendier inom forskning.',
    url: 'https://www.vr.se/',
    icon: Lightbulb,
    category: 'science',
    tags: ['Forskning', 'Stipendier']
  },
  {
    id: 'naturejobs',
    name: 'Nature Careers',
    description: 'Globala jobb inom naturvetenskap och forskning.',
    url: 'https://www.nature.com/naturecareers',
    icon: Search,
    category: 'science',
    tags: ['Vetenskap', 'Globalt']
  },
  {
    id: 'sciencejobs',
    name: 'Science Careers',
    description: 'Karriärresurser och jobb inom vetenskap.',
    url: 'https://jobs.sciencecareers.org/',
    icon: Lightbulb,
    category: 'science',
    tags: ['Vetenskap', 'Karriär']
  },
  {
    id: 'ki-jobb',
    name: 'Karolinska Institutet - Jobb',
    description: 'Lediga tjänster på ett av världens ledande medicinska universitet.',
    url: 'https://ki.se/',
    icon: Stethoscope,
    category: 'science',
    tags: ['Medicin', 'Forskning']
  },
  {
    id: 'rise',
    name: 'RISE - Karriär',
    description: 'Jobb på Sveriges forskningsinstitut.',
    url: 'https://www.ri.se/sv/om-rise/jobba-hos-oss',
    icon: Lightbulb,
    category: 'science',
    tags: ['Innovation', 'Forskning']
  },

  // ============================================
  // JURIDIK & JURIDISKA JOBB
  // ============================================
  {
    id: 'juristjobb',
    name: 'Juristjobb.se',
    description: 'Lediga tjänster för jurister i Sverige.',
    url: 'https://www.juristjobb.se/',
    icon: Gavel,
    category: 'legal',
    tags: ['Jurist', 'Juridik']
  },
  {
    id: 'notarietjanst',
    name: 'Domstolsverket - Notarietjänst',
    description: 'Ansök om notarietjänstgöring vid Sveriges domstolar.',
    url: 'https://www.domstol.se/om-sveriges-domstolar/jobba-hos-oss/notarie/',
    icon: Gavel,
    category: 'legal',
    tags: ['Notarie', 'Domstol']
  },
  {
    id: 'skogsjobb',
    name: 'Skogsjobb.se',
    description: 'Jobb inom skogsbruk och skogsindustri.',
    url: 'https://www.skogen.se/skogsjobb/',
    icon: Leaf,
    category: 'niche',
    tags: ['Skog', 'Skogsbruk']
  },
  {
    id: 'fastighetsjobb',
    name: 'Fastighetsjobb.se',
    description: 'Jobb inom fastigheter, mäkleri och fastighetsförvaltning.',
    url: 'https://www.fastighetsnytt.se/lediga-fastighetsjobb/',
    icon: Home,
    category: 'niche',
    tags: ['Fastighet', 'Mäklare']
  },
  {
    id: 'resume-io',
    name: 'Resume.io',
    description: 'Professionell CV-byggare med moderna mallar.',
    url: 'https://resume.io/',
    icon: FileText,
    category: 'guide',
    tags: ['CV', 'Mallar']
  },
  {
    id: 'kickresume',
    name: 'Kickresume',
    description: 'CV och personligt brev med AI-hjälp.',
    url: 'https://www.kickresume.com/',
    icon: FileText,
    category: 'guide',
    tags: ['CV', 'AI']
  },
  {
    id: 'chef-magazine',
    name: 'Chef - Ledarskap',
    description: 'Artiklar om ledarskap och chefsutveckling.',
    url: 'https://chef.se/',
    icon: Award,
    category: 'guide',
    tags: ['Ledarskap', 'Chef']
  },
  {
    id: 'shortcut',
    name: 'Shortcut - Ekonomi & Karriär',
    description: 'Tips för unga om ekonomi och karriärstart.',
    url: 'https://shortcut.se/',
    icon: Rocket,
    category: 'guide',
    tags: ['Unga', 'Ekonomi']
  },

  // ============================================
  // IDEELLA & NGO-JOBB
  // ============================================
  {
    id: 'ideella-jobb',
    name: 'Ideella jobb',
    description: 'Lediga tjänster inom ideell sektor och civilsamhället.',
    url: 'https://www.ideellajobb.se/',
    icon: Heart,
    category: 'nonprofit',
    tags: ['Ideell', 'NGO']
  },
  {
    id: 'forumsyd-jobb',
    name: 'Forum Syd - Jobb',
    description: 'Jobb inom internationellt bistånd och utveckling.',
    url: 'https://forumciv.org/sv',
    icon: Globe,
    category: 'nonprofit',
    tags: ['Bistånd', 'Utveckling']
  },
  {
    id: 'un-jobs',
    name: 'UN Jobs',
    description: 'Jobb inom FN-systemet och internationella organisationer.',
    url: 'https://unjobs.org/',
    icon: Globe,
    category: 'nonprofit',
    tags: ['FN', 'Internationellt']
  },
  {
    id: 'reliefweb',
    name: 'ReliefWeb Jobs',
    description: 'Jobb inom humanitärt arbete världen över.',
    url: 'https://reliefweb.int/jobs',
    icon: Handshake,
    category: 'nonprofit',
    tags: ['Humanitärt', 'Bistånd']
  },
  {
    id: 'devex',
    name: 'Devex',
    description: 'Karriär inom internationell utveckling och bistånd.',
    url: 'https://www.devex.com/jobs',
    icon: Globe,
    category: 'nonprofit',
    tags: ['Utveckling', 'Global']
  },
  {
    id: 'amnesty-jobb',
    name: 'Amnesty International - Karriär',
    description: 'Jobba för mänskliga rättigheter.',
    url: 'https://www.amnesty.se/',
    icon: Scale,
    category: 'nonprofit',
    tags: ['Mänskliga rättigheter']
  },
  {
    id: 'wwf-jobb',
    name: 'WWF Sverige - Jobb',
    description: 'Jobba med naturvård och miljöfrågor.',
    url: 'https://www.wwf.se/',
    icon: Leaf,
    category: 'nonprofit',
    tags: ['Miljö', 'Naturvård']
  },

  // ============================================
  // AI-VERKTYG FÖR JOBBSÖKANDE
  // ============================================
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    description: 'AI-assistent för att skriva CV, personliga brev och förbereda intervjuer.',
    url: 'https://chatgpt.com/',
    icon: Zap,
    category: 'ai-tools',
    tags: ['AI', 'Skrivhjälp']
  },
  {
    id: 'claude-ai',
    name: 'Claude',
    description: 'AI-assistent för karriärrådgivning och dokumentskrivning.',
    url: 'https://claude.ai/',
    icon: Zap,
    category: 'ai-tools',
    tags: ['AI', 'Karriär']
  },
  {
    id: 'jobscan',
    name: 'Jobscan',
    description: 'Jämför ditt CV mot en jobbannons. Betaltjänst med några gratis jämförelser i månaden.',
    url: 'https://www.jobscan.co/',
    icon: Search,
    category: 'ai-tools',
    tags: ['CV', 'ATS']
  },
  {
    id: 'resumeworded',
    name: 'Resume Worded',
    description: 'Får ditt CV och din LinkedIn-profil poängsatta. Betaltjänst med begränsad gratisnivå.',
    url: 'https://resumeworded.com/',
    icon: FileText,
    category: 'ai-tools',
    tags: ['CV', 'LinkedIn']
  },
  {
    id: 'rezi',
    name: 'Rezi',
    description: 'AI-baserad CV-byggare som anpassar efter rekryteringssystem. Betaltjänst med begränsad gratisnivå.',
    url: 'https://www.rezi.ai/',
    icon: FileText,
    category: 'ai-tools',
    tags: ['CV', 'ATS', 'AI']
  },
  {
    id: 'teal',
    name: 'Teal',
    description: 'Verktyg för att följa dina ansökningar och anpassa ditt CV. Betaltjänst med begränsad gratisnivå.',
    url: 'https://www.tealhq.com/',
    icon: Target,
    category: 'ai-tools',
    tags: ['Jobbsökning', 'AI']
  },
  {
    id: 'copy-ai',
    name: 'Copy.ai',
    description: 'AI som hjälper dig formulera text. Betaltjänst med begränsad gratisnivå.',
    url: 'https://www.copy.ai/',
    icon: PenTool,
    category: 'ai-tools',
    tags: ['Skrivande', 'AI']
  },
  {
    id: 'pramp',
    name: 'Pramp',
    description: 'Öva tekniska intervjuer med andra jobbsökare.',
    url: 'https://www.pramp.com/',
    icon: Video,
    category: 'interview',
    tags: ['Tech', 'Övning']
  },
  {
    id: 'interviewing-io',
    name: 'interviewing.io',
    description: 'Anonym intervjuträning med ingenjörer från toppföretag.',
    url: 'https://interviewing.io/',
    icon: Code,
    category: 'interview',
    tags: ['Tech', 'Anonym']
  },
  {
    id: 'leetcode',
    name: 'LeetCode',
    description: 'Öva kodningsproblem för tekniska intervjuer.',
    url: 'https://leetcode.com/',
    icon: Code,
    category: 'interview',
    tags: ['Kodning', 'Algoritmer']
  },
  {
    id: 'hackerrank',
    name: 'HackerRank',
    description: 'Kodningsutmaningar och intervjuförberedelse för utvecklare.',
    url: 'https://www.hackerrank.com/',
    icon: Code,
    category: 'interview',
    tags: ['Kodning', 'Certifikat']
  },
  {
    id: 'glassdoor-intervju',
    name: 'Glassdoor - Intervjufrågor',
    description: 'Läs verkliga intervjufrågor från tusentals företag.',
    url: 'https://www.glassdoor.com/Interview/',
    icon: MessageCircle,
    category: 'interview',
    tags: ['Intervjufrågor', 'Företag']
  },
  {
    id: 'big-interview',
    name: 'Big Interview',
    description: 'Träna intervju med videoövningar och återkoppling. Betaltjänst.',
    url: 'https://biginterview.com/',
    icon: Video,
    category: 'interview',
    tags: ['Video', 'AI-feedback']
  },
  {
    id: 'interview-cake',
    name: 'Interview Cake',
    description: 'Programmeringsintervjuer med steg-för-steg-förklaringar.',
    url: 'https://www.interviewcake.com/',
    icon: Code,
    category: 'interview',
    tags: ['Programmering', 'Förklaringar']
  },
  {
    id: 'exponent',
    name: 'Exponent',
    description: 'Intervjuförberedelse för produktchefer och designers.',
    url: 'https://www.tryexponent.com/',
    icon: FileText,
    category: 'interview',
    tags: ['Product Manager', 'Design']
  },

  // ============================================
  // LÖNERESURSER
  // ============================================
  {
    id: 'lonestatistik',
    name: 'Lönestatistik.se',
    description: 'Jämför löner för olika yrken i Sverige.',
    url: 'https://www.lonestatistik.se/',
    icon: Coins,
    category: 'salary',
    tags: ['Löner', 'Statistik']
  },
  {
    id: 'allaloner',
    name: 'Alla löner',
    description: 'Detaljerad lönestatistik per yrke och region.',
    url: 'https://www.allaloner.se/',
    icon: Coins,
    category: 'salary',
    tags: ['Löner', 'Yrken']
  },
  {
    id: 'lonekalkyl',
    name: 'Lönekalkyl',
    description: 'Räkna ut din nettolön efter skatt.',
    url: 'https://www.ekonomifakta.se/',
    icon: Coins,
    category: 'salary',
    tags: ['Lön', 'Skatt']
  },
  {
    id: 'levels-fyi',
    name: 'Levels.fyi',
    description: 'Lönedata för tech-jobb globalt, inklusive svenska företag.',
    url: 'https://www.levels.fyi/',
    icon: Coins,
    category: 'salary',
    tags: ['Tech', 'Löner']
  },
  {
    id: 'blind',
    name: 'Blind',
    description: 'Anonym community för lönediskussioner och företagsinsikter.',
    url: 'https://www.teamblind.com/',
    icon: Lock,
    category: 'salary',
    tags: ['Anonym', 'Tech']
  },
  {
    id: 'payscale',
    name: 'PayScale',
    description: 'Global lönedata och löneförhandlingstips.',
    url: 'https://www.payscale.com/',
    icon: Coins,
    category: 'salary',
    tags: ['Löner', 'Globalt']
  },
  {
    id: 'salary-com',
    name: 'Salary.com',
    description: 'Löneverktyg och karriärresurser.',
    url: 'https://www.salary.com/',
    icon: Coins,
    category: 'salary',
    tags: ['Löner', 'Karriär']
  },

  // ============================================
  // MJUKA FÄRDIGHETER
  // ============================================
  {
    id: 'toastmasters',
    name: 'Toastmasters Sverige',
    description: 'Träna presentationsteknik och ledarskap.',
    url: 'https://www.toastmasters.org/find-a-club',
    icon: Megaphone,
    category: 'soft-skills',
    tags: ['Presentation', 'Ledarskap']
  },
  {
    id: 'dale-carnegie',
    name: 'Dale Carnegie Sverige',
    description: 'Kurser i kommunikation, försäljning och ledarskap.',
    url: 'https://www.dalecarnegie.se/',
    icon: Users,
    category: 'soft-skills',
    tags: ['Kommunikation', 'Ledarskap']
  },
  {
    id: 'mindtools',
    name: 'MindTools',
    description: 'Verktyg och artiklar om ledarskap och personlig utveckling.',
    url: 'https://www.mindtools.com/',
    icon: Brain,
    category: 'soft-skills',
    tags: ['Ledarskap', 'Verktyg']
  },
  {
    id: 'skillsoft',
    name: 'Skillsoft',
    description: 'Företagsutbildning inom ledarskap och mjuka färdigheter.',
    url: 'https://www.skillsoft.com/',
    icon: Award,
    category: 'soft-skills',
    tags: ['E-learning', 'Ledarskap']
  },
  {
    id: 'coursera-soft-skills',
    name: 'Coursera - Mjuka färdigheter',
    description: 'Kurser i kommunikation, teamwork och problemlösning.',
    url: 'https://www.coursera.org/browse/personal-development',
    icon: GraduationCap,
    category: 'soft-skills',
    tags: ['Kurser', 'Utveckling']
  },
  {
    id: 'ted-ledarskap',
    name: 'TED - Ledarskap',
    description: 'Inspirerande föredrag om ledarskap och kommunikation.',
    url: 'https://www.ted.com/topics/leadership',
    icon: Play,
    category: 'soft-skills',
    tags: ['TED', 'Inspiration']
  },
  {
    id: 'norrsken-house',
    name: 'Norrsken House',
    description: 'Coworking för impact-startups och entreprenörer.',
    url: 'https://www.norrsken.org/',
    icon: Sparkles,
    category: 'coworking',
    tags: ['Impact', 'Startup']
  },
  {
    id: 'sup46',
    name: 'SUP46',
    description: 'Startup-community och coworking i Stockholm.',
    url: 'https://www.startuppeople.com/',
    icon: Rocket,
    category: 'coworking',
    tags: ['Startup', 'Community']
  },
  {
    id: 'mindpark',
    name: 'Mindpark',
    description: 'Coworking i Malmö och Helsingborg.',
    url: 'https://mindpark.se/',
    icon: Building2,
    category: 'coworking',
    tags: ['Malmö', 'Skåne']
  },
  {
    id: 'regus',
    name: 'Regus',
    description: 'Flexibla kontorslösningar över hela Sverige.',
    url: 'https://www.regus.com/sv-se',
    icon: Building2,
    category: 'coworking',
    tags: ['Kontor', 'Flexibelt']
  },
  {
    id: 'wework',
    name: 'WeWork',
    description: 'Globalt coworking-nätverk med kontor i Stockholm.',
    url: 'https://www.wework.com/',
    icon: Globe,
    category: 'coworking',
    tags: ['Globalt', 'Premium']
  },
  {
    id: 'hetch',
    name: 'Hetch',
    description: 'Coworking i Helsingborg för kreativa företag.',
    url: 'https://hetch.se/',
    icon: Lightbulb,
    category: 'coworking',
    tags: ['Helsingborg', 'Kreativt']
  },
  {
    id: 'things',
    name: 'Things',
    description: 'IoT-fokuserat innovationscenter i Stockholm.',
    url: 'https://thingstockholm.com/',
    icon: Laptop,
    category: 'coworking',
    tags: ['IoT', 'Tech']
  },

  // ============================================
  // PODCASTS OM KARRIÄR
  // ============================================
  {
    id: 'foretagarpodden',
    name: 'Företagarpodden',
    description: 'Tips och inspiration för småföretagare.',
    url: 'https://www.foretagarna.se/foretagarpodden/',
    icon: Headphones,
    category: 'podcasts',
    tags: ['Företagare', 'Tips']
  },
  {
    id: 'tech-karriar',
    name: 'Kodsnack',
    description: 'Svensk podcast för utvecklare om karriär och teknik.',
    url: 'https://kodsnack.se/',
    icon: Code,
    category: 'podcasts',
    tags: ['Utvecklare', 'Tech']
  },
  {
    id: 'how-i-built-this',
    name: 'How I Built This',
    description: 'NPR:s populära podcast om entreprenörer och deras företag.',
    url: 'https://www.npr.org/series/490248027/how-i-built-this',
    icon: Headphones,
    category: 'podcasts',
    tags: ['Entreprenör', 'Inspiration']
  },
  {
    id: 'sting',
    name: 'STING',
    description: 'Stockholms ledande startup-inkubator.',
    url: 'https://www.sting.co/',
    icon: Rocket,
    category: 'startup',
    tags: ['Inkubator', 'Stockholm']
  },
  {
    id: 'minc',
    name: 'Minc',
    description: 'Startup-inkubator i Malmö.',
    url: 'https://www.minc.se/',
    icon: Rocket,
    category: 'startup',
    tags: ['Inkubator', 'Malmö']
  },
  {
    id: 'chalmers-ventures',
    name: 'Chalmers Ventures',
    description: 'Startup-inkubator kopplad till Chalmers.',
    url: 'https://www.chalmersventures.com/',
    icon: GraduationCap,
    category: 'startup',
    tags: ['Inkubator', 'Göteborg']
  },
  {
    id: 'vinnova',
    name: 'Vinnova',
    description: 'Finansiering för innovation och startup.',
    url: 'https://www.vinnova.se/',
    icon: Coins,
    category: 'startup',
    tags: ['Finansiering', 'Innovation']
  },
  {
    id: 'di-digital',
    name: 'DI Digital',
    description: 'Nyheter om startups och tech från Dagens Industri.',
    url: 'https://www.di.se/digital/',
    icon: Newspaper,
    category: 'startup',
    tags: ['Nyheter', 'Tech']
  },
  {
    id: 'breakit-news',
    name: 'Breakit',
    description: 'Nyheter och jobb inom svensk startup-scen.',
    url: 'https://www.breakit.se/',
    icon: Newspaper,
    category: 'startup',
    tags: ['Nyheter', 'Startup']
  },

  // ============================================
  // FLER STÖDRESURSER
  // ============================================
  {
    id: 'arbetsloshetskassan',
    name: 'Sveriges a-kassor',
    description: 'Samlingssidan för alla a-kassor — här ser du vilken kassa som hör till ditt yrke.',
    url: 'https://www.sverigesakassor.se/sv/startsida',
    icon: FileText,
    category: 'support',
    tags: ['A-kassa', 'Jämförelse']
  },
  {
    id: 'pension-myndigheten',
    name: 'Pensionsmyndigheten',
    description: 'Information om pension och pensionssparande.',
    url: 'https://www.pensionsmyndigheten.se/',
    icon: Clock,
    category: 'support',
    tags: ['Pension', 'Sparande']
  },
  {
    id: 'minpension',
    name: 'minPension',
    description: 'Se hela din pension samlad på ett ställe.',
    url: 'https://www.minpension.se/',
    icon: Coins,
    category: 'support',
    tags: ['Pension', 'Överblick']
  },
  {
    id: 'konsumenternas',
    name: 'Konsumenternas.se',
    description: 'Tips om privatekonomi och ekonomisk trygghet.',
    url: 'https://www.konsumenternas.se/',
    icon: Scale,
    category: 'support',
    tags: ['Ekonomi', 'Tips']
  },
  {
    id: 'hallakonsument',
    name: 'Hallå konsument',
    description: 'Vägledning i konsumentfrågor och avtal.',
    url: 'https://www.konsumentverket.se/',
    icon: MessageCircle,
    category: 'support',
    tags: ['Konsument', 'Rådgivning']
  },
  {
    id: 'kvinnofrid',
    name: 'Kvinnofridslinjen',
    description: 'Stöd för kvinnor i utsatta situationer.',
    url: 'https://kvinnofridslinjen.se/',
    icon: Heart,
    category: 'support',
    tags: ['Stöd', 'Trygghet']
  },

  // ============================================
  // FLER NISCHADE JOBBSAJTER
  // ============================================
  {
    id: 'startupjobs',
    name: 'The Hub - Startup Jobs',
    description: 'Jobb hos svenska startups och scale-ups.',
    url: 'https://thehub.io/',
    icon: Rocket,
    category: 'niche',
    tags: ['Startup', 'Scale-up']
  },
  {
    id: 'remote-sweden',
    name: 'Jobb hemifrån',
    description: 'Samling av remote-jobb i Sverige.',
    url: 'https://hittadistansjobb.se/',
    icon: Home,
    category: 'niche',
    tags: ['Remote', 'Sverige']
  },
  {
    id: 'lagerjobb',
    name: 'Lagerjobb.se',
    description: 'Jobb inom lager och logistik.',
    url: 'https://www.lagerjobb.se/',
    icon: ShoppingCart,
    category: 'niche',
    tags: ['Lager', 'Logistik']
  },
  {
    id: 'industrijobb',
    name: 'Industrijobb.se',
    description: 'Lediga jobb inom svensk industri.',
    url: 'https://www.industrijobb.se/',
    icon: Building2,
    category: 'niche',
    tags: ['Industri', 'Produktion']
  },
  {
    id: 'ekonomijobb',
    name: 'Ekonomijobb.se',
    description: 'Jobb för ekonomer, revisorer och controllers.',
    url: 'https://www.ekonomijobb.se/',
    icon: Coins,
    category: 'niche',
    tags: ['Ekonomi', 'Revision']
  },
]

// ── Kategorier ───────────────────────────────────────────────────────────

/**
 * Reservtexter. Den visade texten kommer ur i18n
 * (`externalResources.categories.<id>.title`); det här är fallbacken och
 * samtidigt registret över vilka kategorier som finns.
 */
const KATEGORIER: Record<string, { title: string; description: string }> = {
  jobs: {
    title: 'Jobbsajter & Rekrytering',
    description: 'Hitta lediga jobb och tjänster'
  },
  staffing: {
    title: 'Bemanningsföretag',
    description: 'Bemanning, rekrytering och konsultuppdrag'
  },
  'public-sector': {
    title: 'Offentlig sektor',
    description: 'Jobb hos myndigheter och offentliga arbetsgivare'
  },
  niche: {
    title: 'Branschspecifika jobbsajter',
    description: 'Jobb inom specifika branscher och yrken'
  },
  nonprofit: {
    title: 'Ideella & NGO-jobb',
    description: 'Jobb inom ideell sektor och civilsamhälle'
  },
  creative: {
    title: 'Kreativa & Kulturella jobb',
    description: 'Jobb inom konst, kultur och media'
  },
  science: {
    title: 'Vetenskap & Forskning',
    description: 'Akademiska tjänster och forskarjobb'
  },
  legal: {
    title: 'Juridik',
    description: 'Jobb för jurister och advokater'
  },
  youth: {
    title: 'Ungdom & Studenter',
    description: 'Jobb och resurser för unga och studenter'
  },
  senior: {
    title: 'Seniorer (55+)',
    description: 'Jobb och resurser för erfarna yrkespersoner'
  },
  regional: {
    title: 'Regionala resurser',
    description: 'Jobb och näringsliv i olika regioner'
  },
  international: {
    title: 'Internationellt & EU',
    description: 'Jobba utomlands och i Europa'
  },
  remote: {
    title: 'Distansarbete',
    description: 'Remote-jobb och digitalt nomadliv'
  },
  freelance: {
    title: 'Frilans & Gig-ekonomi',
    description: 'Plattformar för frilansare och extrauppdrag'
  },
  green: {
    title: 'Gröna jobb',
    description: 'Karriär inom miljö och hållbarhet'
  },
  video: {
    title: 'Video & Media',
    description: 'Filmer, podcasts och webbutbildningar'
  },
  podcasts: {
    title: 'Karriärpodcasts',
    description: 'Podcasts om karriär, entreprenörskap och ledarskap'
  },
  guide: {
    title: 'Guider & Verktyg',
    description: 'Praktiska guider och verktyg för arbetssökande'
  },
  'ai-tools': {
    title: 'AI-verktyg',
    description: 'AI-hjälp för CV, brev och intervju. Tjänsterna drivs av företag utanför EU — klistra inte in personnummer eller uppgifter om din hälsa.'
  },
  interview: {
    title: 'Intervjuförberedelse',
    description: 'Övning och tips inför anställningsintervjun'
  },
  salary: {
    title: 'Löneresurser',
    description: 'Lönestatistik och förhandlingstips'
  },
  assessment: {
    title: 'Personlighetstester',
    description: 'Tester för självinsikt och karriärvägledning'
  },
  portfolio: {
    title: 'Portfolio-plattformar',
    description: 'Visa upp ditt arbete för arbetsgivare'
  },
  language: {
    title: 'Språkinlärning',
    description: 'Lär dig svenska och andra språk'
  },
  learning: {
    title: 'Lärande & Utbildning',
    description: 'Onlinekurser och vidareutbildning'
  },
  certifications: {
    title: 'Certifieringar',
    description: 'Professionella certifieringar och diplom'
  },
  'soft-skills': {
    title: 'Mjuka färdigheter',
    description: 'Ledarskap, kommunikation och personlig utveckling'
  },
  coworking: {
    title: 'Coworking',
    description: 'Kontorsplatser att hyra. De flesta kostar några tusen kronor i månaden.'
  },
  networking: {
    title: 'Nätverk & Mentorskap',
    description: 'Bygg ditt professionella nätverk'
  },
  startup: {
    title: 'Starta eget',
    description: 'Resurser för dig som vill bli egenföretagare'
  },
  'career-change': {
    title: 'Karriärbyte & Omställning',
    description: 'Stöd vid uppsägning. Omställningsorganisationerna kräver att du sagts upp från en anställning med kollektivavtal.'
  },
  organization: {
    title: 'Fackförbund & Organisationer',
    description: 'Stöd och karriärhjälp från fackliga organisationer'
  },
  diversity: {
    title: 'Mångfald & Inkludering',
    description: 'Resurser för en inkluderande arbetsmarknad'
  },
  accessibility: {
    title: 'Tillgänglighet & Funktionsvariation',
    description: 'Stöd för personer med funktionsnedsättning'
  },
  support: {
    title: 'Stöd & Ersättningar',
    description: 'Rättigheter, ersättningar och hjälp'
  },
}

export const KATEGORI_IDN = Object.keys(KATEGORIER)

/**
 * Uppslag med reserv. `CollapsibleCategory` destrukturerade tidigare
 * `categoryLabels[category]` rakt av — en kategori utan post kraschade sidan
 * i stället för att bara sakna rubrik.
 */
export function kategoriTitel(t: Oversattare, id: string): string {
  const post = KATEGORIER[id]
  if (!post) return id
  return t(`externalResources.categories.${id}.title`, post.title)
}

export function kategoriBeskrivning(t: Oversattare, id: string): string {
  const post = KATEGORIER[id]
  if (!post) return ''
  return t(`externalResources.categories.${id}.description`, post.description)
}

// ── Flikar ───────────────────────────────────────────────────────────────

/**
 * De fem flikarna, som grupperar de 35 kategorierna.
 *
 * Ändrat 2026-08-23 efter granskningen:
 * - `youth` och `senior` flyttade från "Hitta jobb" till "Stöd". De är
 *   målgruppsstöd, inte jobbannonser, och "Hitta jobb" bar femton kategorier.
 * - `coworking` flyttade från "Karriär" till "Starta eget". En kontorsplats
 *   för 2 000–5 000 kr i månaden är ingen karriärresurs för någon som söker
 *   jobb; den är relevant för den som startar eget.
 * - Fältet `icon` är borta. Det skrevs på alla fem posterna och lästes av
 *   ingen — `sidoflikar` i `SidRail` tar bara `{ id, etikett }`.
 *
 * `etikettNyckel` pekar in i i18n; strängen i `reservEtikett` är fallbacken.
 */
export interface Huvudflik {
  id: string
  etikettNyckel: string
  reservEtikett: string
  kategorier: string[]
}

export const HUVUDFLIKAR: Huvudflik[] = [
  {
    id: 'hitta-jobb',
    etikettNyckel: 'externalResources.tabs.findJobs',
    reservEtikett: 'Hitta jobb',
    kategorier: [
      'jobs', 'staffing', 'public-sector', 'niche', 'regional',
      'international', 'remote', 'freelance', 'green',
      'nonprofit', 'creative', 'science', 'legal',
    ],
  },
  {
    id: 'larande',
    etikettNyckel: 'externalResources.tabs.learning',
    reservEtikett: 'Lärande',
    kategorier: ['learning', 'certifications', 'language', 'video', 'podcasts', 'soft-skills'],
  },
  {
    id: 'karriar',
    etikettNyckel: 'externalResources.tabs.career',
    reservEtikett: 'Karriär',
    kategorier: ['guide', 'ai-tools', 'interview', 'salary', 'assessment', 'portfolio', 'networking'],
  },
  {
    id: 'stod',
    etikettNyckel: 'externalResources.tabs.support',
    reservEtikett: 'Stöd',
    kategorier: ['organization', 'career-change', 'support', 'accessibility', 'diversity', 'youth', 'senior'],
  },
  {
    id: 'starta-eget',
    etikettNyckel: 'externalResources.tabs.startBusiness',
    reservEtikett: 'Starta eget',
    kategorier: ['startup', 'coworking'],
  },
]

/**
 * Urvalet som visas högst upp på "Alla".
 *
 * Hette "Populära resurser" till 2026-08-23. Ingenting i portalen loggar klick
 * på en extern länk — varken klienten, edge-funktionerna eller \`client/api\` —
 * så rubriken påstod en mätning som aldrig gjorts. Det är ett urval, och
 * rubriken säger nu det.
 *
 * Kriteriet är skrivet här för att urvalet ska gå att ifrågasätta: **öppet för
 * alla, utan kostnad, och användbart oavsett bransch.** Tre poster föll på det
 * kriteriet och byttes ut: \`trr\` (kräver nyligen uppsagd tjänstemannaanställning
 * med kollektivavtal), \`chatgpt\` och \`jobscan\` (betaltjänster som dessutom
 * begär att man klistrar in sitt CV hos ett amerikanskt bolag).
 */
export const UTVALDA_IDN = [
  'af-play', 'af-guider', 'indeed', 'allastudier',
  'csn', 'arbetsloshetskassan', 'forsakringskassan', 'ekonomiskt-bistand',
]
