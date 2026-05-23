/**
 * Definitioner av AF:s skattningsinstrument för STA.
 *
 * Frågor och kategorier hämtade från:
 *   sta/Del 1/Skattningar + RD Del 1/DOA - WRI - MOHOST Skattningar del 1.pdf
 *   sta/Del 2/Skattningar + DR del 2/AWP x3 -MOHOST Skattningar del 2.pdf
 *
 * Källa: AF:s officiella sammanställningsblanketter (DOA 4.2/2017,
 * AWP 2.0, WRI-S 4.0, MOHOST, AWC).
 */

export type InstrumentCode = 'DOA' | 'WRI' | 'MOHOST' | 'AWP' | 'AWC'

export interface InstrumentScale {
  /** Numeriskt värde i datan */
  value: number | string
  /** Kort etikett — visas i PDF-tabell */
  shortLabel: string
  /** Längre beskrivning — visas i PDF:s skala-förklaring */
  description: string
}

export interface InstrumentCategory {
  title: string
  /** Items i ordning, första item är 1-indexerat itemNr */
  items: string[]
}

export interface InstrumentDefinition {
  code: InstrumentCode
  title: string
  version: string
  /** För progress-beräkning */
  itemCount: number
  /** Värden 1-N + ev. extras (SI, EA) */
  scale: InstrumentScale[]
  /** True om instrumentet har både "person-skattning" och "bedömar-skattning" */
  hasSelfRating: boolean
  /** Kategorier med items */
  categories: InstrumentCategory[]
}

// ===========================================================================
// DOA — Dialog om arbetsförmåga 4.2/2017 (34 items, 5 kategorier, skala 1-5)
// ===========================================================================

const DOA_ITEMS_SELVFKANNEDOM = [
  'Har förmåga att utföra de uppgifter han/hon vill utföra',
  'Har förmåga att säga ifrån när det är något han/hon inte vill utföra',
  'Har förmåga att utföra anvisade uppgifter',
  'Har intresse av att lära sig nya saker',
  'Har förmåga att ta egna initiativ vid utförande av uppgifter',
  'Har förmåga att ta till sig andras uppskattning för en uppgift som utförts',
  'Har förmåga att använda andras kritik för att förbättra sin förmåga',
  'Har förmåga att arbeta självständigt',
  'Har förmåga att samarbeta med andra',
]

const DOA_ITEMS_ROLLER = [
  'Visar att han/hon värdesätter god hygien hos sig själv och andra',
  'Visar noggrannhet vid utförande av uppgifter',
  'Accepterar de krav som ställs vid utförande av uppgifter',
  'Har förmåga att ta till sig och använda andras kunskaper',
  'Brukar ta ansvar över uppgifter som förväntas bli utförda',
  'Tar på sig ledarskapet i en grupp om det behövs',
  'Brukar kunna avgöra vilka uppgifter som är viktigast att utföra',
  'Brukar anpassa sig till överenskomna tider',
]

const DOA_ITEMS_FYSISK = [
  'Kan utföra uppgifter som kräver små, preciserade handrörelser',
  'Kan utföra uppgifter som kräver kraft och rörlighet i arm och hand',
  'Kan utföra uppgifter som kräver samordning av kroppens rörelser',
  'Kan utföra uppgifter som kräver fysisk uthållighet',
]

const DOA_ITEMS_ORG = [
  'Kan koncentrera sig vid genomförandet av uppgifter',
  'Kan utifrån instruktion planera och genomföra uppgifter',
  'Kan arbeta under tidspress',
  'Kan anpassa sig till nya sätt att utföra en uppgift på',
  'Kan själv avgöra om resultatet av en uppgift är godtagbart',
  'Kan själv hitta lösningar på en uppgift om problem uppstår',
]

const DOA_ITEMS_SAMSPEL = [
  'Tar själv kontakt med andra personer om det behövs',
  'Har förmåga att genomföra ett samtal med andra personer',
  'Kan göra sig förstådd gentemot andra personer',
  'Visar lyhördhet för andra personers synpunkter',
  'Erbjuder sin hjälp till andra personer när det behövs',
  'Tar emot erbjudande om hjälp från andra personer när det behövs',
  'Visar delaktighet i den grupp han/hon ingår i',
]

export const DOA: InstrumentDefinition = {
  code: 'DOA',
  title: 'Dialog om arbetsförmåga',
  version: '4.2/2017',
  itemCount:
    DOA_ITEMS_SELVFKANNEDOM.length +
    DOA_ITEMS_ROLLER.length +
    DOA_ITEMS_FYSISK.length +
    DOA_ITEMS_ORG.length +
    DOA_ITEMS_SAMSPEL.length,
  scale: [
    { value: 1, shortLabel: '1', description: 'I låg grad' },
    { value: 2, shortLabel: '2', description: '' },
    { value: 3, shortLabel: '3', description: '' },
    { value: 4, shortLabel: '4', description: '' },
    { value: 5, shortLabel: '5', description: 'I hög grad' },
  ],
  hasSelfRating: true,
  categories: [
    { title: 'Självkännedom, intressen och värderingar', items: DOA_ITEMS_SELVFKANNEDOM },
    { title: 'Roller och vanor', items: DOA_ITEMS_ROLLER },
    { title: 'Fysisk förmåga', items: DOA_ITEMS_FYSISK },
    { title: 'Organisations- och problemlösningsförmåga', items: DOA_ITEMS_ORG },
    { title: 'Förmåga till samspel och kommunikation', items: DOA_ITEMS_SAMSPEL },
  ],
}

// ===========================================================================
// WRI-S 4.0 — Worker Role Interview (17 items, 6 kategorier, skala 1-4 + IA + SI)
// ===========================================================================

const WRI_SCALE: InstrumentScale[] = [
  { value: 4, shortLabel: '4', description: 'Starkt stöd' },
  { value: 3, shortLabel: '3', description: 'Visst stöd' },
  { value: 2, shortLabel: '2', description: 'Visst hinder' },
  { value: 1, shortLabel: '1', description: 'Hindrar' },
  { value: 'IA', shortLabel: 'IA', description: 'Inte aktuellt' },
  { value: 'SI', shortLabel: 'SI', description: 'Saknar information' },
]

export const WRI: InstrumentDefinition = {
  code: 'WRI',
  title: 'Worker Role Interview',
  version: 'S 4.0',
  itemCount: 17,
  scale: WRI_SCALE,
  hasSelfRating: false,
  categories: [
    {
      title: 'Uppfattning om den egna förmågan',
      items: [
        'Förståelse av sina förmågor och begränsningar',
        'Tro på sin arbetsförmåga',
        'Tar ansvar',
      ],
    },
    {
      title: 'Värderingar',
      items: [
        'Engagemang för arbete',
        'Förväntningar på arbete',
      ],
    },
    {
      title: 'Intressen',
      items: [
        'Förmåga att utöka intressen',
      ],
    },
    {
      title: 'Roller',
      items: [
        'Identifierar sig med arbetstagare',
        'Andra roller stödjer arbetstagarrollen',
      ],
    },
    {
      title: 'Vanor',
      items: [
        'Arbetsrutiner',
        'Anpassar dagliga rutiner',
      ],
    },
    {
      title: 'Omgivning',
      items: [
        'Uppfattning om arbetsmiljö',
        'Uppfattning om familj och kamrater',
        'Uppfattning om chef',
        'Uppfattning om arbetskamrater',
        'Uppfattning om arbetskrav',
        'Uppfattning om dagliga rutiner',
        'Uppfattning om fysisk miljö',
      ],
    },
  ],
}

// ===========================================================================
// MOHOST 2.0 — Model of Human Occupation Screening Tool (25 items, 6 kategorier, skala F/I/D/B)
// ===========================================================================

const MOHOST_SCALE: InstrumentScale[] = [
  { value: 'F', shortLabel: 'F', description: 'Fungerar — stödjer delaktighet' },
  { value: 'I', shortLabel: 'I', description: 'Inskränker — tillåter delaktighet' },
  { value: 'D', shortLabel: 'D', description: 'Delvis hindrar — hindrar delaktighet' },
  { value: 'B', shortLabel: 'B', description: 'Begränsar — begränsar delaktighet' },
  { value: 'IS', shortLabel: 'IS', description: 'Information saknas' },
]

export const MOHOST: InstrumentDefinition = {
  code: 'MOHOST',
  title: 'Model of Human Occupation Screening Tool',
  version: '2.0',
  itemCount: 24, // 6 kategorier × 4 items (Mikael bekräftat 2026-05-23)
  scale: MOHOST_SCALE,
  hasSelfRating: false,
  categories: [
    {
      title: 'Motivation för aktivitet',
      items: [
        'Bedömning av förmåga',
        'Förväntningar på framgång',
        'Intresse',
        'Val',
      ],
    },
    {
      title: 'Aktivitetsmönster',
      items: [
        'Rutiner',
        'Anpassningsförmåga',
        'Roller',
        'Ansvar',
      ],
    },
    {
      title: 'Kommunikations- och interaktionsförmåga',
      items: [
        'Icke-verbal kommunikation',
        'Verbalt uttryck',
        'Konversation',
        'Sociala relationer',
      ],
    },
    {
      title: 'Processfärdigheter',
      items: [
        'Kunskap',
        'Tidsanvändning',
        'Organisering av aktivitet',
        'Problemlösning',
      ],
    },
    {
      title: 'Motoriska färdigheter',
      items: [
        'Hållning och rörlighet',
        'Koordination',
        'Styrka',
        'Energi',
      ],
    },
    {
      title: 'Omgivning',
      items: [
        'Fysiska utrymmen',
        'Fysiska resurser',
        'Sociala grupper',
        'Krav från aktivitet',
      ],
    },
  ],
}

// ===========================================================================
// AWP 2.0 — Assessment of Work Performance (14 items, 3 kategorier, skala 1-4 + SI + EA)
// ===========================================================================

const AWP_AWC_SCALE: InstrumentScale[] = [
  { value: 4, shortLabel: '4', description: 'Kompetent utförande' },
  { value: 3, shortLabel: '3', description: 'Tveksamt utförande' },
  { value: 2, shortLabel: '2', description: 'Begränsat utförande' },
  { value: 1, shortLabel: '1', description: 'Inkompetent utförande' },
  { value: 'SI', shortLabel: 'SI', description: 'Saknar information' },
  { value: 'EA', shortLabel: 'EA', description: 'Ej aktuellt' },
]

const AWP_AWC_CATEGORIES: InstrumentCategory[] = [
  {
    title: 'Motoriska färdigheter',
    items: [
      'Kroppställning (stabilisera, inta position)',
      'Rörlighet (gå, sträcka, böja)',
      'Koordination (koordinera, manipulera, vara följsam)',
      'Styrka (greppa, skjuta, dra, lyfta, transportera, anpassa muskelstyrka/hastighet/rörelseomfång)',
      'Fysisk energi (vara uthållig, bibehålla tempo)',
    ],
  },
  {
    title: 'Processfärdigheter',
    items: [
      'Psykisk energi (vara uthållig, bibehålla uppmärksamhet)',
      'Kunskap (välja, använda, efterfråga information, slutföra)',
      'Tidsorganisation (initiera, fortsätta, utföra i ordningsföljd, avsluta)',
      'Planering av arbetssituationen (planera, iordningställa)',
      'Anpassning (notera/reagera, anpassa beteende, anpassa miljö)',
    ],
  },
  {
    title: 'Kommunikations- och interaktionsfärdigheter',
    items: [
      'Fysisk kommunikation och interaktion (gestikulera, använda ögonkontakt, närma sig, inta kroppställningar, kontakt)',
      'Språk (anpassa språk, anpassa tal, fokusera)',
      'Sociala kontakter (etablera kontakt, bibehålla kontakt, anpassa beteende, samarbeta)',
      'Informationsutbyte (fråga, delge)',
    ],
  },
]

export const AWP: InstrumentDefinition = {
  code: 'AWP',
  title: 'Assessment of Work Performance',
  version: '2.0',
  itemCount: 14,
  scale: AWP_AWC_SCALE,
  hasSelfRating: false,
  categories: AWP_AWC_CATEGORIES,
}

// ===========================================================================
// AWC 2.0 — Assessment of Work Characteristics (samma 14 items som AWP)
// ===========================================================================

export const AWC: InstrumentDefinition = {
  code: 'AWC',
  title: 'Assessment of Work Characteristics',
  version: '2.0',
  itemCount: 14,
  scale: AWP_AWC_SCALE,
  hasSelfRating: false,
  categories: AWP_AWC_CATEGORIES,
}

// ===========================================================================
// Registry
// ===========================================================================

export const INSTRUMENTS: Record<InstrumentCode, InstrumentDefinition> = {
  DOA,
  WRI,
  MOHOST,
  AWP,
  AWC,
}

export function getInstrument(code: string): InstrumentDefinition | null {
  return INSTRUMENTS[code as InstrumentCode] ?? null
}
