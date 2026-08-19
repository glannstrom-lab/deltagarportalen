/**
 * Interview Preparation Service
 * Evidensbaserad intervjuförberedelse och mock-intervjuer
 * 
 * Baserat på: 
 * - Behavioral Interviewing (STAR-metoden)
 * - Mastery experiences (Bandura's Self-Efficacy Theory)
 * - Spaced repetition för inlärning
 * 
 * NU I MOLNET! Alla sessioner sparas i Supabase.
 */

import { interviewSessionsApi } from './cloudStorage'

export interface InterviewQuestion {
  id: string;
  category: 'behavioral' | 'technical' | 'situational' | 'motivation' | 'strengths';
  question: string;
  purpose: string;
  tips: string[];
  starFormat?: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  commonMistakes: string[];
  followUpQuestions?: string[];
}

export interface MockInterview {
  id: string;
  title: string;
  description: string;
  duration: number; // minuter
  difficulty: 'easy' | 'medium' | 'hard';
  questions: InterviewQuestion[];
  category: string;
}

export interface InterviewSession {
  mockInterviewId: string;
  startTime: string;
  endTime?: string;
  answers: Array<{
    questionId: string;
    notes: string;
    confidence: number; // 1-5
  }>;
  completed: boolean;
  /**
   * Rolltiteln. `interview_sessions.job_title` är NOT NULL utan default, så
   * raden avvisas utan den — `tillDbRad` faller tillbaka på en generisk text
   * hellre än att låta insertet dö.
   */
  jobTitle?: string;
  company?: string | null;
  questions?: unknown;
}

// Vanliga intervjufrågor baserat på forskning
export const COMMON_INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'behavioral-1',
    category: 'behavioral',
    question: 'Berätta om en situation då du hanterade en konflikt med en kollega.',
    purpose: 'Bedömer konflikthantering och kommunikationsförmåga',
    tips: [
      'Använd STAR-metoden: Situation, Uppgift, Handling, Resultat',
      'Fokusera på lösningen, inte problemet',
      'Var ärlig men professionell',
      'Visa att du kan ta ansvar för din del',
    ],
    starFormat: {
      situation: 'Beskriv situationen kort och koncist',
      task: 'Vad var ditt ansvar?',
      action: 'Vad gjorde du konkret? (Fokusera på "jag", inte "vi")',
      result: 'Vad blev resultatet? Kvantifiera om möjligt.',
    },
    commonMistakes: [
      'Att skylla på andra',
      'Att välja en för personlig konflikt',
      'Att inte ha en tydlig lösning',
      'Att prata för länge',
    ],
    followUpQuestions: [
      'Vad skulle du gjort annorlunda?',
      'Hur påverkade detta er relation framöver?',
    ],
  },
  {
    id: 'behavioral-2',
    category: 'behavioral',
    question: 'Ge ett exempel på när du misslyckades med något och vad du lärde dig.',
    purpose: 'Bedömer självinsikt och förmåga att växa av motgångar',
    tips: [
      'Välj ett reellt misslyckande (inte en "styrka i förklädnad")',
      'Fokusera på vad du lärde dig',
      'Visa hur du tillämpat lärdomen sedan dess',
      'Var ödmjuk men inte självkritisk',
    ],
    starFormat: {
      situation: 'Beskriv projektet/situationen',
      task: 'Vad skulle du åstadkomma?',
      action: 'Vad gjorde du som ledde till misslyckandet?',
      result: 'Vad lärde du dig? Hur har du använt detta?',
    },
    commonMistakes: [
      'Att välja något som inte var ett verkligt misslyckande',
      'Att skylla på yttre omständigheter',
      'Att inte visa lärdomar',
      'Att vara för hård mot sig själv',
    ],
  },
  {
    id: 'strengths-1',
    category: 'strengths',
    question: 'Vad är din största styrka och hur har den hjälpt dig i arbetet?',
    purpose: 'Bedömer självkännedom och förmåga att applicera styrkor',
    tips: [
      'Välj en styrka relevant för rollen',
      'Ge konkreta exempel, inte bara påståenden',
      'Koppla till hur det gynnar arbetsgivaren',
      'Var specifik - undvik generella ord som "hårt arbetande"',
    ],
    commonMistakes: [
      'Att välja något som inte är relevant för rollen',
      'Att vara för ödmjuk',
      'Att inte ha exempel som stöd',
      'Att nämna för många styrkor (fokusera på en)',
    ],
  },
  {
    id: 'motivation-1',
    category: 'motivation',
    question: 'Varför vill du jobba hos oss?',
    purpose: 'Bedömer motivation och engagemang för företaget',
    tips: [
      'Forskning om företaget är avgörande',
      'Koppla dina värderingar till företagets',
      'Nämn specifika projekt eller aspekter som lockar',
      'Visa att du förstår företagets utmaningar',
    ],
    commonMistakes: [
      'Att fokusera på vad de kan ge dig (lön, förmåner)',
      'Att ha gjort för lite research',
      'Generiska svar som kan ges till vilket företag som helst',
      'Att vara för floskulös',
    ],
  },
  {
    id: 'situational-1',
    category: 'situational',
    question: 'Du har fått för mycket att göra och deadlines närmar sig. Vad gör du?',
    purpose: 'Bedömer prioritering och stresshantering',
    tips: [
      'Visa att du kan prioritera',
      'Nämn kommunikation med chefen/kollegor',
      'Fokusera på lösningar, inte problem',
      'Visa att du kan be om hjälp när det behövs',
    ],
    commonMistakes: [
      'Att säga att man arbetar över utan att nämna kommunikation',
      'Att inte ha en strukturerad approach',
      'Att ignorera problemet',
      'Att skylla på andra',
    ],
  },
  {
    id: 'technical-1',
    category: 'technical',
    question: 'Förklara [relevant teknik/kompetens] för någon utan teknisk bakgrund.',
    purpose: 'Bedömer förmåga att kommunicera komplex information',
    tips: [
      'Använd analogier och exempel',
      'Undvik jargong',
      'Kolla förståelse under tiden',
      'Anpassa efter lyssnarens intresse',
    ],
    commonMistakes: [
      'Att använda för mycket fackspråk',
      'Att vara för teknisk',
      'Att inte anpassa efter målgruppen',
      'Att prata för länge utan att kolla förståelse',
    ],
  },
];

// Förberedda mock-intervjuer
export const MOCK_INTERVIEWS: MockInterview[] = [
  {
    id: 'general-entry',
    title: 'Introduktion till intervjuer',
    description: 'En mjuk start med vanliga frågor för att bygga självförtroende',
    duration: 15,
    difficulty: 'easy',
    category: 'Allmän',
    questions: [
      COMMON_INTERVIEW_QUESTIONS[2], // Styrka
      COMMON_INTERVIEW_QUESTIONS[3], // Motivation
    ],
  },
  {
    id: 'behavioral-basics',
    title: 'Betéende-baserade frågor',
    description: 'Öva på att använda STAR-metoden för att strukturera dina svar',
    duration: 25,
    difficulty: 'medium',
    category: 'Betéende',
    questions: [
      COMMON_INTERVIEW_QUESTIONS[0], // Konflikt
      COMMON_INTERVIEW_QUESTIONS[1], // Misslyckande
    ],
  },
  {
    id: 'full-interview',
    title: 'Komplett intervju',
    description: 'En realistisk simulering med blandade frågetyper',
    duration: 45,
    difficulty: 'hard',
    category: 'Komplett',
    questions: COMMON_INTERVIEW_QUESTIONS.slice(0, 6),
  },
];

/**
 * Hämta intervjufrågor baserat på yrke
 */
export function getQuestionsForOccupation(_occupation: string): InterviewQuestion[] {
  // I en full implementation skulle detta hämta yrkesspecifika frågor
  // För nu, returnera vanliga frågor
  return COMMON_INTERVIEW_QUESTIONS;
}

/**
 * Ge feedback på ett svar baserat på STAR-metoden
 */
export function analyzeStarAnswer(answer: string): {
  score: number;
  feedback: string[];
  missing: string[];
} {
  const feedback: string[] = [];
  const missing: string[] = [];
  let score = 0;

  // Kolla efter Situation
  if (/när|då|under|förra|tidigare/i.test(answer)) {
    score += 25;
    feedback.push('✓ Du etablerade en tydlig situation');
  } else {
    missing.push('Börja med att ge kontext - när och var hände detta?');
  }

  // Kolla efter Uppgift
  if (/jag skulle|mitt ansvar|min uppgift|jag behövde/i.test(answer)) {
    score += 25;
    feedback.push('✓ Du beskrev ditt ansvar tydligt');
  } else {
    missing.push('Förtydliga vad som var ditt specifika ansvar');
  }

  // Kolla efter Handling
  if (/jag gjorde|jag bestämde|jag tog|jag började/i.test(answer)) {
    score += 25;
    feedback.push('✓ Du beskrev dina handlingar');
  } else {
    missing.push('Beskriv konkret vad DU gjorde (använd "jag", inte "vi")');
  }

  // Kolla efter Resultat
  if (/resultat|blev|slutade|ledde till|förbättrade|öka|minska/i.test(answer)) {
    score += 25;
    feedback.push('✓ Du inkluderade ett resultat');
  } else {
    missing.push('Avsluta alltid med resultatet - vad blev utfallet?');
  }

  return { score, feedback, missing };
}

/**
 * Ge tips inför en specifik intervju
 */
export function getInterviewTips(occupation?: string): string[] {
  const generalTips = [
    'Kom i tid - helst 10-15 minuter tidigt',
    'Klä dig professionellt men bekvämt',
    'Ta med extra CV och anteckningsmaterial',
    'Förbered frågor att ställa till intervjuaren',
    'Öva på STAR-metoden för strukturerade svar',
  ];

  const videoTips = [
    'Testa tekniken i förväg',
    'Se till att ha en neutral bakgrund',
    'Titta i kameran, inte på skärmen',
    'Se till att ha bra belysning',
  ];

  return occupation 
    ? [...generalTips, ...videoTips, `Forskning om ${occupation}-specifika frågor`]
    : [...generalTips, ...videoTips];
}

/**
 * Skapa en personlig intervjuplan
 */
export function createInterviewPlan(
  jobTitle: string,
  weaknesses: string[],
  daysUntilInterview: number
): {
  dailyTasks: Array<{
    day: number;
    task: string;
    duration: number;
  }>;
  focusAreas: string[];
} {
  const dailyTasks = [];
  
  // Dag 1-2: Research och förberedelse
  if (daysUntilInterview >= 2) {
    dailyTasks.push(
      { day: 1, task: 'Forska om företaget och rollen', duration: 60 },
      { day: 2, task: 'Lista dina styrkor och svagheter', duration: 30 }
    );
  }

  // Dag 3-5: Öva på frågor
  if (daysUntilInterview >= 3) {
    dailyTasks.push(
      { day: 3, task: 'Öva på betéende-frågor med STAR-metoden', duration: 45 },
      { day: 4, task: 'Genomför en mock-intervju', duration: 30 },
      { day: 5, task: 'Förbered frågor att ställa', duration: 20 }
    );
  }

  // Sista dagen
  dailyTasks.push({
    day: daysUntilInterview,
    task: 'Genomgång och avslappning',
    duration: 30,
  });

  const focusAreas = [
    'STAR-metoden för strukturerade svar',
    'Förberedda exempel från din erfarenhet',
    'Företagspecifik research',
    ...weaknesses.map(w => `Hantera frågor om: ${w}`),
  ];

  return { dailyTasks, focusAreas };
}

/**
 * Spara intervjusession (i molnet!)
 */
export async function saveInterviewSession(session: InterviewSession): Promise<void> {
  try {
    await interviewSessionsApi.create(tillDbRad(session));
  } catch (error) {
    console.error('Fel vid sparande av intervjusession:', error);
    // Fallback till localStorage
    const sessions = await getInterviewSessions();
    sessions.push(session);
    localStorage.setItem('interview_sessions', JSON.stringify(sessions));
  }
}

/**
 * Översätter en session till en rad `interview_sessions` faktiskt tar emot.
 *
 * ── Varför funktionen finns (rättat 2026-08-18) ────────────────────────────
 *
 * Anropet skickade tidigare `mock_interview_id`, `start_time`, `end_time` och
 * `completed`. **Fyra av fem kolumnnamn finns inte i tabellen**, och det enda
 * NOT NULL-fält utan default — `job_title` — utelämnades. Insertet kunde
 * strukturellt aldrig lyckas. Felet fångades av catch-blocket ovan, som tyst
 * skrev till localStorage i stället, så ingenting larmade.
 *
 * Följden syntes på Översikt: nyckeltalet "Intervjuövning" läser
 * `interview_sessions` med `completed_at IS NOT NULL` och visade därför
 * "Inte provat än" för alla, alltid. Uppmätt 2026-08-18:
 * `SELECT count(*) FROM interview_sessions` → **0 rader i hela prod**, 92 konton.
 *
 * `lint:schema` fångade det inte: grinden kontrollerar tabell- och
 * kolumnREFERENSER, inte kolumnNYCKLAR i `.insert()`. Tredje gången samma
 * lucka bär en skarp bugg — se AI-teamets kalenderuppgift 2026-08-09.
 */
function tillDbRad(session: InterviewSession) {
  return {
    // NOT NULL utan default. Utan den här raden avvisas hela insertet.
    job_title: session.jobTitle?.trim() || 'Intervjuövning',
    company: session.company ?? null,
    answers: session.answers ?? [],
    questions: session.questions ?? [],
    started_at: session.startTime ?? new Date().toISOString(),
    // Kolumnen heter completed_at och är en tidsstämpel, inte en boolean.
    // Det är också fältet Översiktens nyckeltal filtrerar på.
    completed_at: session.completed ? (session.endTime ?? new Date().toISOString()) : null,
    status: session.completed ? 'completed' : 'in_progress',
  };
}

/**
 * Phase 3 / DATA-01 — save session AND persist its score + breakdown.
 * The score is stored on interview_sessions.score (NUMERIC(4,1)) and
 * score_breakdown (JSONB) — both added by migration 20260429_interview_score.sql.
 *
 * Existing `saveInterviewSession(session)` remains the no-score path for
 * call-sites that have not yet computed a score.
 */
export async function saveInterviewSessionWithScore(
  session: InterviewSession,
  score: number | null,
  breakdown?: Record<string, unknown>
): Promise<void> {
  try {
    const created = await interviewSessionsApi.create(tillDbRad(session))
    // Only persist the score if one was provided — preserves null-default semantics
    if (score !== null && created?.id) {
      await interviewSessionsApi.update(created.id, {
        score,
        score_breakdown: breakdown ?? null,
      })
    }
  } catch (error) {
    console.error('Fel vid sparande av intervjusession med poäng:', error)
    // No localStorage fallback for the scored variant — DB is the source of truth for DATA-01
    throw error
  }
}

/**
 * Hämta alla intervjusessioner (från molnet!)
 */
/**
 * Raden som kommer TILLBAKA ur `interview_sessions`. Fälten speglar prod-
 * schemat; den tidigare versionen läste `mock_interview_id`, `start_time`,
 * `end_time` och `completed`, som inte är kolumner — varje läst session blev
 * ett objekt med bara `undefined` i sig.
 */
interface InterviewSessionDB {
  id: string;
  job_title: string;
  company: string | null;
  answers: InterviewSession['answers'];
  questions: unknown;
  started_at: string | null;
  completed_at: string | null;
}

export async function getInterviewSessions(): Promise<InterviewSession[]> {
  try {
    const data = await interviewSessionsApi.getAll();
    return data.map((s: InterviewSessionDB) => ({
      mockInterviewId: s.id,
      jobTitle: s.job_title,
      company: s.company,
      questions: s.questions,
      startTime: s.started_at ?? '',
      endTime: s.completed_at ?? undefined,
      answers: s.answers ?? [],
      completed: s.completed_at !== null,
    }));
  } catch (error) {
    console.error('Fel vid hämtning av intervjusessioner:', error);
    // Fallback till localStorage
    const stored = localStorage.getItem('interview_sessions');
    return stored ? JSON.parse(stored) : [];
  }
}

// ============================================
// FRI INTERVJUSIMULATOR (UX3)
// ============================================
// InterviewSimulator.tsx kör ett fritt AI-genererat fråga/svar-flöde som
// saknar en referens till någon av MOCK_INTERVIEWS ovan (ingen mockInterviewId
// eller questionId att koppla mot). Det gör att InterviewSession/
// saveInterviewSession (som förväntar sig confidence per fråge-id) inte passar.
// Vi sparar därför denna variant separat, lokalt, under en egen nyckel — så en
// avslutad/avbruten session inte tappar svar, betyg och AI-feedback.
//
// Sedan 2026-08-18 speglas den DESSUTOM till `interview_sessions`, eftersom
// Översiktens nyckeltal läser den tabellen. Lokalt är fortfarande källan för
// sidans egen historik; molnraden finns för att portalen ska kunna säga sant
// om att du har övat. Se sparaSimulatorSessionIMolnet.
export interface SimulatorQA {
  fraga: string;
  svar: string;
  rating?: number;
  /**
   * Varifrån betyget kommer. Fältet fanns i sidans eget tillstånd (B12) men
   * inte här, så det gick förlorat vid sparning — och en historikvy hade
   * därför inte kunnat säga om trean var AI:ns bedömning eller deltagarens
   * egen. Samma påstående som B12 tog bort ur gränssnittet hade återuppstått
   * i den sparade posten.
   */
  ratingSource?: 'ai' | 'user';
  feedback?: string;
}

export interface SimulatorSession {
  id: string;
  roll: string;
  foretag: string;
  historik: SimulatorQA[];
  antalFragor: number;
  avgRating: number;
  endedAt: string;
}

const SIMULATOR_SESSIONS_KEY = 'interview_simulator_sessions';
const MAX_STORED_SIMULATOR_SESSIONS = 20;

/**
 * Spara en avslutad (eller i förtid avbruten) fri intervjusession lokalt.
 * Nyast först, äldre sessioner utöver MAX_STORED_SIMULATOR_SESSIONS tas bort.
 */
export function saveSimulatorSession(session: {
  roll: string;
  foretag: string;
  historik: SimulatorQA[];
  antalFragor: number;
  avgRating: number;
}): SimulatorSession {
  const record: SimulatorSession = {
    id: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    endedAt: new Date().toISOString(),
    ...session,
  };
  try {
    const existing = getSimulatorSessions();
    const updated = [record, ...existing].slice(0, MAX_STORED_SIMULATOR_SESSIONS);
    localStorage.setItem(SIMULATOR_SESSIONS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Fel vid sparande av intervjusimulator-session:', error);
  }
  // Skriv också till molnet. Se sparaSimulatorSessionIMolnet nedan för varför.
  void sparaSimulatorSessionIMolnet(record);
  return record;
}

/**
 * Speglar en avslutad simulatorövning till `interview_sessions`.
 *
 * ── Varför (2026-08-18) ────────────────────────────────────────────────────
 *
 * `/interview-simulator` är den enda levande intervjuövningen i portalen, och
 * den sparade **bara i localStorage**. Den andra vägen —
 * `saveInterviewSession` via `MockInterviewSession` — går genom `InterviewPrep`,
 * som ingen sida importerar; den är alltså dödkod, och dess insert var
 * dessutom strukturellt trasig (se `tillDbRad`).
 *
 * Resultatet: `SELECT count(*) FROM interview_sessions` gav **0 rader i hela
 * prod** med 92 konton, medan Översiktens nyckeltal läser just den tabellen.
 * Rutan sa "Inte provat än" till alla, för alltid — även till någon som just
 * kört fem övningar. Ett falskt påstående om användarens egen aktivitet.
 *
 * Skrivningen är avsiktligt **best-effort och icke-blockerande**: localStorage
 * är kvar som källa för sidans egen historik, och en deltagare mitt i en övning
 * ska aldrig få ett felmeddelande för att en spegling misslyckades. Går den
 * fel stannar nyckeltalet på `—`, vilket är sant.
 */
async function sparaSimulatorSessionIMolnet(record: SimulatorSession): Promise<void> {
  try {
    const betygsatta = record.historik.filter(
      (q): q is SimulatorQA & { rating: number } => typeof q.rating === 'number'
    );
    // Inget betyg satt → ingen poäng. Ett snitt över noll bedömningar finns
    // inte, och 0 hade lästs som "underkänt" (B31).
    const snitt =
      betygsatta.length > 0
        ? Number((betygsatta.reduce((n, q) => n + q.rating, 0) / betygsatta.length).toFixed(1))
        : null;

    await interviewSessionsApi.create({
      job_title: record.roll?.trim() || 'Intervjuövning',
      company: record.foretag?.trim() || null,
      questions: record.historik.map((q) => q.fraga),
      answers: record.historik,
      status: 'completed',
      completed_at: record.endedAt,
      ...(snitt !== null ? { score: snitt } : {}),
    });
  } catch (error) {
    // Tyst. Övningen är redan sparad lokalt och användaren är mitt i ett flöde.
    console.error('Kunde inte spegla intervjuövningen till molnet:', error);
  }
}

/* ── Utkast: en PÅGÅENDE övning ─────────────────────────────────────────────
 *
 * Uppmätt 2026-08-19, i prod, med Playwright: ett klick på "Karriär" i
 * toppnaven mitt i en intervju — 1 besvarad fråga och ett halvskrivet svar —
 * gav `/#/karriar` utan dialog, och bakåtknappen kom tillbaka till ett tomt
 * formulär. Samma sak vid omladdning: 3 svar med AI-feedback borta.
 *
 * `beforeunload`-vakten som fanns täckte bara riktig sidladdning. Klient-
 * navigering, HashRouterns bakåtknapp och fokuslägesväxeln passerade den alla,
 * och `grep useBlocker|usePrompt` ger noll träffar i hela client/src.
 *
 * En spärrdialog hade dessutom varit fel medicin för den här målgruppen — den
 * hindrar en från att gå men räddar ingenting. Utkastet gör i stället att
 * övningen finns kvar när man kommer tillbaka, oavsett hur man lämnade.
 */

const SIMULATOR_UTKAST_KEY = 'interview_simulator_utkast';

export interface SimulatorUtkast {
  roll: string;
  foretag: string;
  kategori: string;
  historik: SimulatorQA[];
  nuvarandeFraga: string;
  anvandarSvar: string;
  antalFragor: number;
  sparatVid: string;
}

/** Skriv över utkastet för den pågående övningen. */
export function sparaSimulatorUtkast(utkast: Omit<SimulatorUtkast, 'sparatVid'>): void {
  try {
    localStorage.setItem(
      SIMULATOR_UTKAST_KEY,
      JSON.stringify({ ...utkast, sparatVid: new Date().toISOString() })
    );
  } catch {
    // Full disk eller privat läge. Övningen fungerar ändå — bara utan
    // återställning. Det är inte värt ett felmeddelande mitt i ett flöde.
  }
}

/**
 * Läs utkastet, om det finns och är färskt.
 *
 * Ett dygn är gränsen: äldre än så och man minns inte längre vad man höll på
 * med, och att möta ett halvfärdigt svar från förra veckan är förvirrande
 * snarare än hjälpsamt.
 */
export function lasSimulatorUtkast(): SimulatorUtkast | null {
  try {
    const rå = localStorage.getItem(SIMULATOR_UTKAST_KEY);
    if (!rå) return null;
    const utkast = JSON.parse(rå) as SimulatorUtkast;
    if (!utkast?.roll) return null;
    const alder = Date.now() - new Date(utkast.sparatVid).getTime();
    if (!Number.isFinite(alder) || alder > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(SIMULATOR_UTKAST_KEY);
      return null;
    }
    return utkast;
  } catch {
    return null;
  }
}

/** Ta bort utkastet — övningen är avslutad eller medvetet förkastad. */
export function rensaSimulatorUtkast(): void {
  try {
    localStorage.removeItem(SIMULATOR_UTKAST_KEY);
  } catch {
    // Se sparaSimulatorUtkast.
  }
}

/** Hämta tidigare fria intervjusimulator-sessioner (lokalt lagrade). */
export function getSimulatorSessions(): SimulatorSession[] {
  try {
    const stored = localStorage.getItem(SIMULATOR_SESSIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Beräkna framsteg över tid
 */
export async function calculateProgress(): Promise<{
  totalSessions: number;
  averageConfidence: number;
  improvement: number;
}> {
  const sessions = await getInterviewSessions();
  
  if (sessions.length === 0) {
    return { totalSessions: 0, averageConfidence: 0, improvement: 0 };
  }

  const completedSessions = sessions.filter(s => s.completed);
  const totalConfidence = completedSessions.reduce((sum, s) => {
    const avgConfidence = s.answers.reduce((a, ans) => a + ans.confidence, 0) / s.answers.length;
    return sum + avgConfidence;
  }, 0);

  const averageConfidence = totalConfidence / completedSessions.length;

  // Beräkna förbättring (jämför första och sista sessionen)
  const firstSession = completedSessions[0];
  const lastSession = completedSessions[completedSessions.length - 1];
  
  const firstConfidence = firstSession.answers.reduce((a, ans) => a + ans.confidence, 0) / firstSession.answers.length;
  const lastConfidence = lastSession.answers.reduce((a, ans) => a + ans.confidence, 0) / lastSession.answers.length;
  
  const improvement = lastConfidence - firstConfidence;

  return {
    totalSessions: completedSessions.length,
    averageConfidence,
    improvement,
  };
}
