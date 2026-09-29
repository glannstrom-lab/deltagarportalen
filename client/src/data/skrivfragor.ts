/**
 * Dagbokens skrivfrågor på engelska.
 *
 * Frågorna ligger i tabellen `writing_prompts` (15 aktiva rader, mätt
 * 2026-09-29) och som reserv i `diaryApi.ts`. Tabellen har ingen engelsk
 * kolumn, så en engelsk användare fick svenska frågor i sin dagbok. Femton
 * statiska rader motiverar inte en schemaändring: engelskan bor här, nycklad
 * på den svenska texten, och en fråga som saknas här visas på svenska.
 *
 * Lägger du en fråga i tabellen: lägg raden här också. Testet
 * `services/skrivfragor.test.ts` håller de kända frågorna kompletta.
 */
export const SKRIVFRAGOR_EN: Record<string, string> = {
  'Vad är du mest tacksam för idag?': 'What are you most grateful for today?',
  'Beskriv ett ögonblick som gjorde dig glad idag.': 'Describe a moment that made you happy today.',
  'Vilka är dina tre viktigaste mål just nu?': 'What are your three most important goals right now?',
  'Vad har du lärt dig den senaste veckan?': 'What have you learned this past week?',
  'Beskriv din perfekta arbetsdag.': 'Describe your perfect working day.',
  'Vad gör dig unik på arbetsmarknaden?': 'What makes you stand out in the job market?',
  'Vilka framsteg har du gjort mot dina mål?': 'What progress have you made towards your goals?',
  'Hur vill du att din framtid ska se ut?': 'What do you want your future to look like?',
  'Vad skulle du göra om du inte var rädd?': 'What would you do if you were not afraid?',
  'Vilka styrkor har du upptäckt hos dig själv?': 'What strengths have you found in yourself?',
  'Vem inspirerar dig och varför?': 'Who inspires you, and why?',
  'Om du kunde ge ditt yngre jag ett råd, vad skulle det vara?': 'If you could give your younger self one piece of advice, what would it be?',
  'Vad ger dig energi?': 'What gives you energy?',
  'Vad är du stolt över att ha åstadkommit?': 'What are you proud of having done?',
  'Beskriv en utmaning du övervunnit.': 'Describe a challenge you have overcome.',
}

/** Frågan på angivet språk. Svenska (eller okänd fråga) ger texten oförändrad. */
export function skrivfragaText(svenskText: string, sprak: string | undefined): string {
  if (!sprak || sprak.split('-')[0].toLowerCase() !== 'en') return svenskText
  return SKRIVFRAGOR_EN[svenskText] ?? svenskText
}
