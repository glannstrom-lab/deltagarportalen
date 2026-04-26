/**
 * External Resources Page - Links to external job seeker resources
 * Arbetsförmedlingen Play, SACO, TCO, etc.
 */
import React from 'react'
import { PageLayout } from '@/components/layout/index'
import { ExternalLink, Play, BookOpen, FileText, Users, Building2, GraduationCap, Globe, Briefcase, Scale, Heart, Headphones, Search, Laptop, Rocket, Wrench, Coffee, MessageCircle, Lightbulb, Award, Accessibility, Handshake, MapPin, Clock, Palette, Code, Stethoscope, Baby, UserPlus, Calendar, Languages, Leaf, Shield, Home, RefreshCw, Brain, Sparkles, Target, Landmark, Camera, Gavel, Newspaper, Database, PenTool, Zap, Video, BookMarked, Megaphone, Lock, Coins, Hammer, Train, ShoppingCart, Network } from '@/components/ui/icons'

interface ExternalResource {
  id: string
  name: string
  description: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  category: 'video' | 'guide' | 'organization' | 'learning' | 'support' | 'jobs' | 'startup' | 'niche' | 'networking' | 'accessibility' | 'freelance' | 'youth' | 'regional' | 'staffing' | 'international' | 'language' | 'remote' | 'green' | 'senior' | 'diversity' | 'career-change' | 'certifications' | 'public-sector' | 'assessment' | 'portfolio' | 'creative' | 'science' | 'legal' | 'nonprofit' | 'ai-tools' | 'interview' | 'salary' | 'soft-skills' | 'coworking' | 'podcasts'
  tags?: string[]
}

const externalResources: ExternalResource[] = [
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
    url: 'https://arbetsformedlingen.se/for-arbetssokande/sa-hittar-du-jobbet/guider-och-tips',
    icon: BookOpen,
    category: 'guide',
    tags: ['CV', 'Personligt brev', 'Intervju']
  },
  {
    id: 'yrkeskollen',
    name: 'Yrkeskollen',
    description: 'Utforska olika yrken, se lönestatistik och framtidsutsikter för olika branscher.',
    url: 'https://arbetsformedlingen.se/yrkeskollen',
    icon: Briefcase,
    category: 'guide',
    tags: ['Yrken', 'Löner', 'Framtidsutsikter']
  },

  // Fackförbund & Organisationer
  {
    id: 'unionen',
    name: 'Unionen Karriärcoaching',
    description: 'Sveriges största fackförbund för tjänstemän. Karriärrådgivning och jobbsökartips.',
    url: 'https://www.unionen.se/karriar',
    icon: Users,
    category: 'organization',
    tags: ['Karriär', 'Fackförbund']
  },
  {
    id: 'saco',
    name: 'Sacos karriärguider',
    description: 'Akademikernas a-kassa och fackförbund. Guider för akademiker på arbetsmarknaden.',
    url: 'https://www.saco.se/karriar/',
    icon: GraduationCap,
    category: 'organization',
    tags: ['Akademiker', 'Karriär']
  },
  {
    id: 'tco',
    name: 'TCO - Karriär & Utveckling',
    description: 'Tjänstemannacentralorganisationen med resurser om arbetsmarknad och karriär.',
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
    url: 'https://www.migrationsverket.se/Privatpersoner/Arbeta-i-Sverige.html',
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
    id: 'jobbpodden',
    name: 'Jobbpodden',
    description: 'Podcast om karriär, jobbsökning och arbetsmarknad från Arbetsförmedlingen.',
    url: 'https://arbetsformedlingen.se/play/jobbpodden',
    icon: Headphones,
    category: 'video',
    tags: ['Podcast', 'Karriär']
  },

  // Jobbsajter & Rekrytering
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
    url: 'https://www.monster.se/',
    icon: Search,
    category: 'jobs',
    tags: ['Jobb', 'Karriär']
  },
  {
    id: 'stepstone',
    name: 'StepStone',
    description: 'Jobbportal med fokus på kvalificerade tjänster och karriärutveckling.',
    url: 'https://www.stepstone.se/',
    icon: Search,
    category: 'jobs',
    tags: ['Kvalificerade jobb']
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
    id: 'akademikerjobb',
    name: 'Akademikerjobb.se',
    description: 'Jobbsajt specialiserad på tjänster för akademiker och högskoleutbildade.',
    url: 'https://www.akademikerjobb.se/',
    icon: GraduationCap,
    category: 'jobs',
    tags: ['Akademiker', 'Kvalificerade jobb']
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
    id: 'blocket-jobb',
    name: 'Blocket Jobb',
    description: 'Jobb- och rekryteringssajt från Sveriges största marknadsplats.',
    url: 'https://jobb.blocket.se/',
    icon: Search,
    category: 'jobs',
    tags: ['Jobb', 'Lokalt']
  },

  // Fler fackförbund
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
    url: 'https://www.nyforetagarcentrum.com/',
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
    url: 'https://www.skatteverket.se/foretag/startaochdrivaforetag.4.2132aba31199telefonservice.html',
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
    id: 'kronofogden',
    name: 'Kronofogden - Budget',
    description: 'Hjälp med budget och ekonomisk planering. Räkna ut dina kostnader.',
    url: 'https://www.kronofogden.se/privatekonomi',
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
    id: 'cv-tips',
    name: 'CVtips.se',
    description: 'Guider och mallar för CV och personligt brev.',
    url: 'https://www.cvtips.se/',
    icon: FileText,
    category: 'guide',
    tags: ['CV', 'Mallar']
  },
  {
    id: 'intervjutips',
    name: 'Intervjutips.nu',
    description: 'Tips och råd inför anställningsintervjun.',
    url: 'https://www.intervjutips.nu/',
    icon: MessageCircle,
    category: 'guide',
    tags: ['Intervju', 'Tips']
  },
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
    id: 'breakit-jobb',
    name: 'Breakit Jobb',
    description: 'Jobb inom startup, tech och innovation från nyhetssajten Breakit.',
    url: 'https://www.breakit.se/jobb',
    icon: Rocket,
    category: 'niche',
    tags: ['Startup', 'Tech']
  },
  {
    id: 'vardforbundet-jobb',
    name: 'Vårdförbundet - Lediga jobb',
    description: 'Jobb för sjuksköterskor, barnmorskor och biomedicinska analytiker.',
    url: 'https://www.vardforbundet.se/din-karriar/',
    icon: Stethoscope,
    category: 'niche',
    tags: ['Vård', 'Sjukvård']
  },
  {
    id: 'lararforbundet',
    name: 'Lärarförbundet - Lärartjänster',
    description: 'Lediga lärartjänster och karriärresurser för pedagoger.',
    url: 'https://www.lararforbundet.se/karriar',
    icon: GraduationCap,
    category: 'niche',
    tags: ['Lärare', 'Skola']
  },
  {
    id: 'byggjobb',
    name: 'Byggjobb.se',
    description: 'Lediga jobb inom bygg och anläggning.',
    url: 'https://www.byggjobb.se/',
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
    id: 'retailjobb',
    name: 'Retailjobb.se',
    description: 'Lediga jobb inom detaljhandel och butiksarbete.',
    url: 'https://www.retailjobb.se/',
    icon: ShoppingCart,
    category: 'niche',
    tags: ['Handel', 'Butik']
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
    id: 'restaurangjobb',
    name: 'Restaurangjobb.se',
    description: 'Lediga jobb för kockar, servitörer och restaurangpersonal.',
    url: 'https://www.restaurangjobb.se/',
    icon: Coffee,
    category: 'niche',
    tags: ['Kock', 'Restaurang']
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
    url: 'https://www.finansjobb.se/',
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
    id: 'gigstr',
    name: 'Gigstr',
    description: 'Svensk plattform för kortare uppdrag och extraarbete.',
    url: 'https://www.gigstr.se/',
    icon: Clock,
    category: 'freelance',
    tags: ['Gig', 'Extra']
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
    id: 'egenforetagare',
    name: 'Egenföretagare.org',
    description: 'Community och resurser för frilansare och egenföretagare.',
    url: 'https://www.egenforetagare.org/',
    icon: Users,
    category: 'freelance',
    tags: ['Community', 'Frilans']
  },

  // ============================================
  // NÄTVERK & MENTORSKAP
  // ============================================
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
    url: 'https://www.nyckeltalsinstitutet.se/',
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
    id: 'handelskammaren',
    name: 'Handelskammaren',
    description: 'Regionala handelskammare med nätverk och affärsmöjligheter.',
    url: 'https://www.handelskammaren.net/',
    icon: Globe,
    category: 'networking',
    tags: ['Affärer', 'Internationellt']
  },
  {
    id: 'bni-sverige',
    name: 'BNI Sverige',
    description: 'Business Network International - strukturerat affärsnätverkande.',
    url: 'https://bni.se/',
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
    id: 'studentjobb',
    name: 'Studentjobb.se',
    description: 'Extrajobb och deltidsjobb för studenter.',
    url: 'https://www.studentjobb.se/',
    icon: GraduationCap,
    category: 'youth',
    tags: ['Student', 'Extrajobb']
  },
  {
    id: 'ungdomsjobb',
    name: 'Ungdomsjobb.se',
    description: 'Jobb för ungdomar och första jobbet.',
    url: 'https://www.ungdomsjobb.se/',
    icon: UserPlus,
    category: 'youth',
    tags: ['Ungdom', 'Första jobbet']
  },
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
    id: 'trainee',
    name: 'Trainee.se',
    description: 'Hitta traineeprogram för nyexaminerade akademiker.',
    url: 'https://www.trainee.se/',
    icon: Award,
    category: 'youth',
    tags: ['Trainee', 'Nyexaminerad']
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
    id: 'dalarna',
    name: 'Jobba i Dalarna',
    description: 'Hitta jobb och flytta till Dalarna.',
    url: 'https://www.dalarna.se/',
    icon: MapPin,
    category: 'regional',
    tags: ['Dalarna', 'Landsbygd']
  },

  // ============================================
  // FLER GUIDER & VERKTYG
  // ============================================
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
    url: 'https://www.konsumentverket.se/for-foretag/regler-per-omrade/budget-och-skuldradgivning/',
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
    url: 'https://www.adecco.se/',
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
    id: 'proffice',
    name: 'Proffice',
    description: 'Bemannings- och rekryteringsföretag med jobb inom industri och kontor.',
    url: 'https://www.proffice.se/',
    icon: Building2,
    category: 'staffing',
    tags: ['Industri', 'Kontor']
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
    url: 'https://europa.eu/europass/',
    icon: Globe,
    category: 'international',
    tags: ['EU', 'CV', 'Utbildning']
  },
  {
    id: 'working-abroad',
    name: 'Working Abroad',
    description: 'Guide till att jobba utomlands med tips och erfarenheter.',
    url: 'https://www.workingabroad.se/',
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
    url: 'https://www.svt.se/larsvenska/',
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
    id: 'lernia-sfi',
    name: 'Lernia SFI',
    description: 'SFI-utbildning med fokus på arbetsmarknaden.',
    url: 'https://www.lernia.se/utbildning/sfi/',
    icon: Languages,
    category: 'language',
    tags: ['SFI', 'Arbetsmarknad']
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
    id: 'remote-europe',
    name: 'Remote Europe',
    description: 'Remote-jobb för europeiska tidszoner.',
    url: 'https://remoteeurope.com/',
    icon: Globe,
    category: 'remote',
    tags: ['Europa', 'Remote']
  },
  {
    id: 'workfrom',
    name: 'Workfrom',
    description: 'Hitta coworking spaces och kaféer att jobba från.',
    url: 'https://workfrom.co/',
    icon: Coffee,
    category: 'remote',
    tags: ['Coworking', 'Kaféer']
  },
  {
    id: 'nomadlist',
    name: 'Nomad List',
    description: 'Bästa städerna för digitala nomader och remote-arbetare.',
    url: 'https://nomadlist.com/',
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
    id: 'hallbarjobb',
    name: 'Hållbart Jobb',
    description: 'Jobb och karriär inom hållbarhetssektorn.',
    url: 'https://www.hallbarjobb.se/',
    icon: Leaf,
    category: 'green',
    tags: ['Hållbarhet', 'CSR']
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
    id: 'pensionarsjobb',
    name: 'Pensionärsjobb.se',
    description: 'Deltidsjobb och extraknäck för pensionärer.',
    url: 'https://www.pensionarsjobb.se/',
    icon: Clock,
    category: 'senior',
    tags: ['Deltid', 'Pensionär']
  },

  // ============================================
  // MÅNGFALD & INKLUDERING
  // ============================================
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
    url: 'https://arbetsformedlingen.se/for-arbetssokande/extra-stod/stod-a-o/korta-vagen',
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
    id: 'diversity-jobs',
    name: 'Diversity Jobs',
    description: 'Jobbplattform med fokus på mångfald och inkludering.',
    url: 'https://www.diversityjobs.se/',
    icon: Users,
    category: 'diversity',
    tags: ['Mångfald', 'Inkludering']
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
    id: 'prideinjobs',
    name: 'Pride in Jobs',
    description: 'Jobbplattform för HBTQ+-vänliga arbetsgivare.',
    url: 'https://www.prideinjobs.se/',
    icon: Heart,
    category: 'diversity',
    tags: ['HBTQ+', 'Inkludering']
  },

  // ============================================
  // KARRIÄRBYTE & OMSTÄLLNING
  // ============================================
  {
    id: 'trr',
    name: 'TRR Trygghetsrådet',
    description: 'Omställningsstöd för tjänstemän som blir uppsagda.',
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
    description: 'Omställningsstöd för arbetare inom privat sektor.',
    url: 'https://www.tsl.se/',
    icon: RefreshCw,
    category: 'career-change',
    tags: ['Omställning', 'Arbetare']
  },
  {
    id: 'omstallningsfonden',
    name: 'Omställningsfonden',
    description: 'Stöd vid uppsägning inom kommun och region.',
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
    id: 'omstart',
    name: 'Omstart.se',
    description: 'Stöd och coachning för karriäromställning.',
    url: 'https://www.omstart.se/',
    icon: Target,
    category: 'career-change',
    tags: ['Coachning', 'Omstart']
  },

  // ============================================
  // CERTIFIERINGAR & TESTER
  // ============================================
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
    url: 'https://www.arbetsgivarverket.se/jobba-statligt/',
    icon: Landmark,
    category: 'public-sector',
    tags: ['Statligt', 'Myndighet']
  },
  {
    id: 'polisen-jobb',
    name: 'Polisen - Jobba hos oss',
    description: 'Bli polis eller jobba civilt inom Polismyndigheten.',
    url: 'https://polisen.se/om-polisen/jobba-hos-oss/',
    icon: Shield,
    category: 'public-sector',
    tags: ['Polis', 'Säkerhet']
  },
  {
    id: 'forsvarsmakten',
    name: 'Försvarsmakten - Karriär',
    description: 'Militära och civila jobb inom Försvarsmakten.',
    url: 'https://jobb.forsvarsmakten.se/',
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
    url: 'https://www.skatteverket.se/omoss/jobbahososs.4.3152d916158c6374840d5.html',
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
    url: 'https://www.riksdagen.se/sv/sa-funkar-riksdagen/jobba-hos-oss/',
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
    url: 'https://www.skolverket.se/om-oss/jobba-hos-oss',
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
    id: 'hollandkoden',
    name: 'Holland-koden (RIASEC)',
    description: 'Hitta yrken som matchar dina intressen.',
    url: 'https://www.arbetsformedlingen.se/for-arbetssokande/yrken-och-framtid/hitta-ratt-yrke',
    icon: Target,
    category: 'assessment',
    tags: ['RIASEC', 'Yrkesintressen']
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
    id: 'iq-test',
    name: 'Mensa IQ Test',
    description: 'Testa din logiska förmåga med Mensas IQ-test.',
    url: 'https://www.mensa.se/bli-medlem/prova-pa-test/',
    icon: Brain,
    category: 'assessment',
    tags: ['IQ', 'Logik']
  },
  {
    id: 'sokrates-test',
    name: 'Arbetsförmedlingen - Självskattning',
    description: 'Självskattningsverktyg för att kartlägga dina kompetenser.',
    url: 'https://arbetsformedlingen.se/for-arbetssokande/yrken-och-framtid/hitta-ratt-yrke/kartlagg-din-kompetens',
    icon: Target,
    category: 'assessment',
    tags: ['Kompetens', 'Självskattning']
  },

  // ============================================
  // PORTFOLIO & KREATIVA PLATTFORMAR
  // ============================================
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
    url: 'https://gitlab.com/',
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
    id: 'kulturjobb',
    name: 'Kulturjobb',
    description: 'Lediga jobb inom kultur, konst och media.',
    url: 'https://www.kulturjobb.se/',
    icon: Palette,
    category: 'creative',
    tags: ['Kultur', 'Konst']
  },
  {
    id: 'teatercentrum',
    name: 'Teatercentrum - Lediga jobb',
    description: 'Jobb inom teater och scenkonst.',
    url: 'https://www.teatercentrum.se/lediga-jobb/',
    icon: Video,
    category: 'creative',
    tags: ['Teater', 'Scenkonst']
  },
  {
    id: 'filmjobb',
    name: 'Filmjobb.se',
    description: 'Jobb inom film- och TV-produktion.',
    url: 'https://www.filmjobb.se/',
    icon: Video,
    category: 'creative',
    tags: ['Film', 'TV']
  },
  {
    id: 'musikerjobb',
    name: 'Musikerjobb',
    description: 'Lediga jobb för musiker och musikbranschen.',
    url: 'https://www.musikerjobb.se/',
    icon: Headphones,
    category: 'creative',
    tags: ['Musik', 'Artist']
  },
  {
    id: 'journalistforbundet',
    name: 'Journalistförbundet - Jobb',
    description: 'Lediga jobb för journalister och mediaarbetare.',
    url: 'https://www.sjf.se/karriar-jobb',
    icon: Newspaper,
    category: 'creative',
    tags: ['Journalistik', 'Media']
  },
  {
    id: 'fotografjobb',
    name: 'Fotosidan - Jobb',
    description: 'Jobb och uppdrag för fotografer.',
    url: 'https://www.fotosidan.se/jobb/',
    icon: Camera,
    category: 'creative',
    tags: ['Foto', 'Fotograf']
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
    id: 'modejobb',
    name: 'Modejobb.se',
    description: 'Jobb inom mode, textil och klädindustrin.',
    url: 'https://www.modejobb.se/',
    icon: Palette,
    category: 'creative',
    tags: ['Mode', 'Textil']
  },

  // ============================================
  // VETENSKAP & FORSKNING
  // ============================================
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
    url: 'https://www.vr.se/om-oss/jobba-hos-oss.html',
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
    url: 'https://ki.se/om-ki/jobba-hos-oss',
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
    id: 'advokatsamfundet',
    name: 'Advokatsamfundet - Lediga jobb',
    description: 'Jobb för jurister och advokater.',
    url: 'https://www.advokatsamfundet.se/karriar/',
    icon: Gavel,
    category: 'legal',
    tags: ['Juridik', 'Advokat']
  },
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
    id: 'compliance-jobs',
    name: 'Compliance Jobs',
    description: 'Jobb inom regelefterlevnad och compliance.',
    url: 'https://www.compliancejobs.se/',
    icon: Shield,
    category: 'legal',
    tags: ['Compliance', 'Regelefterlevnad']
  },

  // ============================================
  // FLER BRANSCHSPECIFIKA
  // ============================================
  {
    id: 'skogsjobb',
    name: 'Skogsjobb.se',
    description: 'Jobb inom skogsbruk och skogsindustri.',
    url: 'https://www.skogsjobb.se/',
    icon: Leaf,
    category: 'niche',
    tags: ['Skog', 'Skogsbruk']
  },
  {
    id: 'lantbruksjobb',
    name: 'Lantbruksjobb',
    description: 'Jobb inom jordbruk och lantbruk.',
    url: 'https://www.lantbruksjobb.se/',
    icon: Wrench,
    category: 'niche',
    tags: ['Lantbruk', 'Jordbruk']
  },
  {
    id: 'sjofartsjobb',
    name: 'Sjöfartsjobb',
    description: 'Jobb inom sjöfart och maritim industri.',
    url: 'https://www.sjofartsjobb.se/',
    icon: Globe,
    category: 'niche',
    tags: ['Sjöfart', 'Marin']
  },
  {
    id: 'flygplatsjobb',
    name: 'Flygplatsjobb',
    description: 'Jobb på flygplatser och inom flygindustrin.',
    url: 'https://www.flygplatsjobb.se/',
    icon: Globe,
    category: 'niche',
    tags: ['Flyg', 'Flygplats']
  },
  {
    id: 'fiskerijobb',
    name: 'Fiskerijobb',
    description: 'Jobb inom fiske och vattenbruk.',
    url: 'https://www.fiskerijobb.se/',
    icon: Globe,
    category: 'niche',
    tags: ['Fiske', 'Vattenbruk']
  },
  {
    id: 'djurjobb',
    name: 'Djurjobb.se',
    description: 'Jobb för veterinärer, djurskötare och djurvänner.',
    url: 'https://www.djurjobb.se/',
    icon: Heart,
    category: 'niche',
    tags: ['Djur', 'Veterinär']
  },
  {
    id: 'apoteksjobb',
    name: 'Apoteksjobb',
    description: 'Jobb för apotekare och farmaceuter.',
    url: 'https://www.apoteksjobb.se/',
    icon: Stethoscope,
    category: 'niche',
    tags: ['Apotek', 'Farmaci']
  },
  {
    id: 'tandvardjobb',
    name: 'Tandvårdjobb',
    description: 'Jobb för tandläkare, tandhygienister och tandskötare.',
    url: 'https://www.tandvardjobb.se/',
    icon: Stethoscope,
    category: 'niche',
    tags: ['Tandvård', 'Tandläkare']
  },
  {
    id: 'idrottsjobb',
    name: 'Idrottsjobb.se',
    description: 'Jobb inom idrott, sport och friskvård.',
    url: 'https://www.idrottsjobb.se/',
    icon: Target,
    category: 'niche',
    tags: ['Idrott', 'Sport']
  },
  {
    id: 'eventjobb',
    name: 'Eventjobb.se',
    description: 'Jobb inom event, mässor och konferenser.',
    url: 'https://www.eventjobb.se/',
    icon: Calendar,
    category: 'niche',
    tags: ['Event', 'Mässa']
  },
  {
    id: 'fastighetsjobb',
    name: 'Fastighetsjobb.se',
    description: 'Jobb inom fastigheter, mäkleri och fastighetsförvaltning.',
    url: 'https://www.fastighetsjobb.se/',
    icon: Home,
    category: 'niche',
    tags: ['Fastighet', 'Mäklare']
  },
  {
    id: 'datajobb',
    name: 'Datajobb.se',
    description: 'IT-jobb och utvecklartjänster i Sverige.',
    url: 'https://www.datajobb.se/',
    icon: Database,
    category: 'niche',
    tags: ['IT', 'Data']
  },

  // ============================================
  // FLER GUIDER & NYHETER
  // ============================================
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
    id: 'di-jobb',
    name: 'Dagens Industri - Karriär',
    description: 'Karriärnyheter och jobbartiklar från DI.',
    url: 'https://www.di.se/nyheter/karriar/',
    icon: Newspaper,
    category: 'guide',
    tags: ['Nyheter', 'Karriär']
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
    url: 'https://shortcut.nu/',
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
    id: 'civilsamhallet',
    name: 'Civilsamhället i siffror',
    description: 'Information om jobb och karriär i civilsamhället.',
    url: 'https://www.civilsamhalletisiffror.se/',
    icon: Users,
    category: 'nonprofit',
    tags: ['Civilsamhälle', 'Statistik']
  },
  {
    id: 'forumsyd-jobb',
    name: 'Forum Syd - Jobb',
    description: 'Jobb inom internationellt bistånd och utveckling.',
    url: 'https://www.forumciv.org/sv/jobb',
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
    url: 'https://www.amnesty.se/om-amnesty/jobba-hos-oss/',
    icon: Scale,
    category: 'nonprofit',
    tags: ['Mänskliga rättigheter']
  },
  {
    id: 'wwf-jobb',
    name: 'WWF Sverige - Jobb',
    description: 'Jobba med naturvård och miljöfrågor.',
    url: 'https://www.wwf.se/om-oss/jobba-hos-oss/',
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
    url: 'https://chat.openai.com/',
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
    description: 'Optimera ditt CV mot specifika jobbannonser med AI.',
    url: 'https://www.jobscan.co/',
    icon: Search,
    category: 'ai-tools',
    tags: ['CV', 'ATS']
  },
  {
    id: 'resumeworded',
    name: 'Resume Worded',
    description: 'AI-driven feedback på ditt CV och LinkedIn-profil.',
    url: 'https://resumeworded.com/',
    icon: FileText,
    category: 'ai-tools',
    tags: ['CV', 'LinkedIn']
  },
  {
    id: 'rezi',
    name: 'Rezi',
    description: 'AI CV-byggare som optimerar för rekryteringssystem (ATS).',
    url: 'https://www.rezi.ai/',
    icon: FileText,
    category: 'ai-tools',
    tags: ['CV', 'ATS', 'AI']
  },
  {
    id: 'teal',
    name: 'Teal',
    description: 'AI-driven jobbsökningsplattform med CV-byggare och jobbspårning.',
    url: 'https://www.tealhq.com/',
    icon: Target,
    category: 'ai-tools',
    tags: ['Jobbsökning', 'AI']
  },
  {
    id: 'copy-ai',
    name: 'Copy.ai',
    description: 'AI för att skriva professionella texter och personliga brev.',
    url: 'https://www.copy.ai/',
    icon: PenTool,
    category: 'ai-tools',
    tags: ['Skrivande', 'AI']
  },
  {
    id: 'grammarly-ai',
    name: 'Grammarly AI',
    description: 'AI-driven skrivassistent för felfria ansökningar.',
    url: 'https://www.grammarly.com/',
    icon: PenTool,
    category: 'ai-tools',
    tags: ['Grammatik', 'Engelska']
  },

  // ============================================
  // INTERVJUFÖRBEREDELSE
  // ============================================
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
    description: 'Videobaserad intervjuträning med AI-feedback.',
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
    url: 'https://www.ekonomifakta.se/Fakta/Skatter/Rakna-pa-dina-skatter/Lonekalkyl/',
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
    url: 'https://www.toastmasters.se/',
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
    id: 'linkedin-learning-soft',
    name: 'LinkedIn Learning - Soft Skills',
    description: 'Kurser i kommunikation, tidhantering och produktivitet.',
    url: 'https://www.linkedin.com/learning/topics/soft-skills',
    icon: Clock,
    category: 'soft-skills',
    tags: ['Kurser', 'Produktivitet']
  },

  // ============================================
  // COWORKING & KONTORSPLATSER
  // ============================================
  {
    id: 'epicenter',
    name: 'Epicenter Stockholm',
    description: 'Innovationshub och coworking i Stockholm.',
    url: 'https://epicenterstockholm.com/',
    icon: Building2,
    category: 'coworking',
    tags: ['Stockholm', 'Innovation']
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
    url: 'https://sup46.com/',
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
    id: 'framgangspodden',
    name: 'Framgångspodden',
    description: 'Intervjuer med framgångsrika entreprenörer och ledare.',
    url: 'https://www.intuitcreative.se/framgangspodden/',
    icon: Headphones,
    category: 'podcasts',
    tags: ['Entreprenör', 'Framgång']
  },
  {
    id: 'chefspodden',
    name: 'Chefspodden',
    description: 'Podcast om ledarskap från tidningen Chef.',
    url: 'https://chef.se/chefspodden/',
    icon: Headphones,
    category: 'podcasts',
    tags: ['Ledarskap', 'Chef']
  },
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
    id: 'digiday-podcast',
    name: 'Digiday Podcast',
    description: 'Digitala trender och karriär inom marknadsföring.',
    url: 'https://digiday.com/podcast/',
    icon: Headphones,
    category: 'podcasts',
    tags: ['Digital', 'Marknadsföring']
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
    id: 'arbetslivspodden',
    name: 'Arbetslivspodden',
    description: 'Prevent och Suntarbetsliv om arbetsmiljö och karriär.',
    url: 'https://www.prevent.se/podcast/',
    icon: Headphones,
    category: 'podcasts',
    tags: ['Arbetsmiljö', 'Hälsa']
  },

  // ============================================
  // FLER STARTUP-RESURSER
  // ============================================
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
    id: 'startup-sweden',
    name: 'Startup Sweden',
    description: 'Nationellt program för svenska startups.',
    url: 'https://startupsweden.com/',
    icon: Globe,
    category: 'startup',
    tags: ['Nationellt', 'Program']
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
    name: 'A-kasseguiden',
    description: 'Jämför a-kassor och hitta rätt för dig.',
    url: 'https://www.akasseguiden.se/',
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
    url: 'https://www.hallakonsument.se/',
    icon: MessageCircle,
    category: 'support',
    tags: ['Konsument', 'Rådgivning']
  },
  {
    id: 'kriscentrum',
    name: 'Kriscentrum för män',
    description: 'Stöd för män i kris, inklusive arbetslöshet.',
    url: 'https://www.kfrm.se/',
    icon: Heart,
    category: 'support',
    tags: ['Kris', 'Stöd']
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
    url: 'https://www.jobbhemifran.se/',
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
  {
    id: 'hrjobb',
    name: 'HR-jobb.se',
    description: 'Lediga tjänster inom HR och personalarbete.',
    url: 'https://www.hr-jobb.se/',
    icon: Users,
    category: 'niche',
    tags: ['HR', 'Personal']
  },
  {
    id: 'marknadsjobb',
    name: 'Marknadsjobb.se',
    description: 'Jobb inom marknadsföring och kommunikation.',
    url: 'https://www.marknadsjobb.se/',
    icon: Megaphone,
    category: 'niche',
    tags: ['Marknadsföring', 'Kommunikation']
  },
  {
    id: 'forsaljningsjobb',
    name: 'Försäljningsjobb.se',
    description: 'Lediga säljjobb och key account-tjänster.',
    url: 'https://www.forsaljningsjobb.se/',
    icon: Handshake,
    category: 'niche',
    tags: ['Försäljning', 'Sälj']
  },
  {
    id: 'kundtjanstjobb',
    name: 'Kundtjänstjobb.se',
    description: 'Jobb inom kundtjänst och kundservice.',
    url: 'https://www.kundtjanstjobb.se/',
    icon: Headphones,
    category: 'niche',
    tags: ['Kundtjänst', 'Service']
  },
  {
    id: 'inkopsjobb',
    name: 'Inköpsjobb.se',
    description: 'Lediga tjänster inom inköp och supply chain.',
    url: 'https://www.inkopsjobb.se/',
    icon: ShoppingCart,
    category: 'niche',
    tags: ['Inköp', 'Supply chain']
  },
]

const categoryLabels: Record<string, { title: string; description: string }> = {
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
    description: 'AI-assistenter för CV, brev och intervjuförberedelse'
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
    description: 'Coworking-spaces och kontorsplatser'
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
    description: 'Stöd vid uppsägning och karriärbyte'
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

// Group categories into main tabs
const mainTabs = {
  'hitta-jobb': {
    label: 'Hitta jobb',
    icon: Briefcase,
    categories: ['jobs', 'staffing', 'public-sector', 'niche', 'nonprofit', 'creative', 'science', 'legal', 'youth', 'senior', 'regional', 'international', 'remote', 'freelance', 'green']
  },
  'larande': {
    label: 'Lärande',
    icon: GraduationCap,
    categories: ['learning', 'certifications', 'language', 'video', 'podcasts', 'soft-skills']
  },
  'karriar': {
    label: 'Karriär',
    icon: Target,
    categories: ['guide', 'ai-tools', 'interview', 'salary', 'assessment', 'portfolio', 'networking', 'coworking']
  },
  'stod': {
    label: 'Stöd',
    icon: Heart,
    categories: ['organization', 'career-change', 'diversity', 'accessibility', 'support']
  },
  'starta-eget': {
    label: 'Starta eget',
    icon: Rocket,
    categories: ['startup']
  }
}

// Featured/popular resources (shown at top)
const featuredResourceIds = [
  'af-play', 'indeed', 'linkedin-jobs', 'chatgpt', 'allastudier',
  'unionen', 'trr', 'jobscan'
]

// Compact resource card for grid display
function CompactResourceCard({ resource }: { resource: ExternalResource }) {
  const IconComponent = resource.icon

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 p-3 bg-white dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-md transition-all"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-teal-50 to-sky-50 dark:from-teal-900/30 dark:to-sky-900/30 flex items-center justify-center">
        <IconComponent className="w-5 h-5 text-teal-600 dark:text-teal-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-sm text-stone-900 dark:text-stone-100 truncate group-hover:text-teal-700 dark:group-hover:text-teal-400">
            {resource.name}
          </span>
          <ExternalLink className="w-3 h-3 text-stone-400 flex-shrink-0" />
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
          {resource.description}
        </p>
      </div>
    </a>
  )
}

// Featured resource card (larger, with description)
function FeaturedResourceCard({ resource }: { resource: ExternalResource }) {
  const IconComponent = resource.icon

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block p-4 bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-lg transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-teal-100 to-sky-100 dark:from-teal-900/50 dark:to-sky-900/50 flex items-center justify-center">
          <IconComponent className="w-6 h-6 text-teal-600 dark:text-teal-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 group-hover:text-teal-700 dark:group-hover:text-teal-400">
              {resource.name}
            </h3>
            <ExternalLink className="w-4 h-4 text-stone-400" />
          </div>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400 line-clamp-2">
            {resource.description}
          </p>
        </div>
      </div>
    </a>
  )
}

// Collapsible category section
function CollapsibleCategory({
  category,
  resources,
  isExpanded,
  onToggle
}: {
  category: string
  resources: ExternalResource[]
  isExpanded: boolean
  onToggle: () => void
}) {
  const { title, description } = categoryLabels[category]

  return (
    <div className="border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-white dark:bg-stone-800/50 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-stone-900 dark:text-stone-100">{title}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
            {resources.length}
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-stone-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div className="p-4 pt-0 bg-white dark:bg-stone-800/50">
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">{description}</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map(resource => (
              <CompactResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ExternalResources() {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [activeTab, setActiveTab] = React.useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(new Set())

  // Filter resources based on search
  const filteredResources = React.useMemo(() => {
    if (!searchQuery.trim()) return externalResources
    const query = searchQuery.toLowerCase()
    return externalResources.filter(r =>
      r.name.toLowerCase().includes(query) ||
      r.description.toLowerCase().includes(query) ||
      r.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  }, [searchQuery])

  // Group filtered resources by category
  const resourcesByCategory = React.useMemo(() => {
    return filteredResources.reduce((acc, resource) => {
      if (!acc[resource.category]) acc[resource.category] = []
      acc[resource.category].push(resource)
      return acc
    }, {} as Record<string, ExternalResource[]>)
  }, [filteredResources])

  // Get featured resources
  const featuredResources = React.useMemo(() => {
    return featuredResourceIds
      .map(id => externalResources.find(r => r.id === id))
      .filter((r): r is ExternalResource => r !== undefined)
  }, [])

  // Get categories for active tab
  const activeCategories = activeTab
    ? mainTabs[activeTab as keyof typeof mainTabs]?.categories || []
    : Object.values(mainTabs).flatMap(t => t.categories)

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  // Expand all categories in view
  const expandAll = () => {
    setExpandedCategories(new Set(activeCategories))
  }

  // Collapse all
  const collapseAll = () => {
    setExpandedCategories(new Set())
  }

  const isSearching = searchQuery.trim().length > 0

  return (
    <PageLayout
      title="Externa resurser"
      description={`${externalResources.length} användbara länkar för jobbsökande`}
      icon={ExternalLink}
      domain="info"
      className="space-y-6 bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-950 min-h-screen"
    >
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
        <input
          type="text"
          placeholder="Sök bland resurser..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Search results info */}
      {isSearching && (
        <div className="text-sm text-stone-600 dark:text-stone-400">
          Hittade <span className="font-semibold text-teal-600">{filteredResources.length}</span> resurser för "{searchQuery}"
        </div>
      )}

      {/* Show search results directly if searching */}
      {isSearching ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map(resource => (
            <CompactResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      ) : (
        <>
          {/* Featured resources */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="font-semibold text-stone-900 dark:text-stone-100">Populära resurser</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {featuredResources.map(resource => (
                <FeaturedResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          </section>

          {/* Main tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === null
                  ? 'bg-teal-600 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              Alla
            </button>
            {Object.entries(mainTabs).map(([key, { label, icon: TabIcon }]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeTab === key
                    ? 'bg-teal-600 text-white'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Expand/collapse controls */}
          <div className="flex items-center gap-4 text-sm">
            <button
              onClick={expandAll}
              className="text-teal-600 hover:text-teal-700 dark:text-teal-400"
            >
              Visa alla
            </button>
            <button
              onClick={collapseAll}
              className="text-stone-500 hover:text-stone-600 dark:text-stone-400"
            >
              Dölj alla
            </button>
          </div>

          {/* Category accordions */}
          <div className="space-y-3">
            {activeCategories
              .filter(category => resourcesByCategory[category]?.length > 0)
              .map(category => (
                <CollapsibleCategory
                  key={category}
                  category={category}
                  resources={resourcesByCategory[category]}
                  isExpanded={expandedCategories.has(category)}
                  onToggle={() => toggleCategory(category)}
                />
              ))}
          </div>
        </>
      )}

      {/* Disclaimer */}
      <div className="text-center py-6 text-sm text-stone-500 dark:text-stone-400">
        <p>
          Dessa länkar går till externa webbplatser. Vi ansvarar inte för innehållet på dessa sidor.
        </p>
      </div>
    </PageLayout>
  )
}
