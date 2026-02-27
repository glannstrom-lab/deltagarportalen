/**
 * Interview Preparation Service
 * Evidensbaserad intervjuförberedelse och mock-intervjuer
 * 
 * Baserat på: 
 * - Behavioral Interviewing (STAR-metoden)
 * - Mastery experiences (Bandura's Self-Efficacy Theory)
 * - Spaced repetition för inlärning
 */

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
export function getQuestionsForOccupation(occupation: string): InterviewQuestion[] {
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
 * Spara intervjusession
 */
export function saveInterviewSession(session: InterviewSession): void {
  const sessions = getInterviewSessions();
  sessions.push(session);
  localStorage.setItem('interview_sessions', JSON.stringify(sessions));
}

/**
 * Hämta alla intervjusessioner
 */
export function getInterviewSessions(): InterviewSession[] {
  const stored = localStorage.getItem('interview_sessions');
  return stored ? JSON.parse(stored) : [];
}

/**
 * Beräkna framsteg över tid
 */
export function calculateProgress(): {
  totalSessions: number;
  averageConfidence: number;
  improvement: number;
} {
  const sessions = getInterviewSessions();
  
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
