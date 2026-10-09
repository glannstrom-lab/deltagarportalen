/**
 * En scenbild per sida, i båda grafikstilarna.  (2026-10-09)
 *
 * Mikael: portalen kändes fortfarande för texttung. Bilderna kommer ur
 * ElevenLabs (fotorealism, prompterna i docs/BILDPROMPTER-SIDOR.md) och ligger
 * som `public/illustrations/sida-<sidnyckel>-<mjuk|action>.webp`.
 *
 * Var de syns — utan att återinföra hjälten (beslut 2026-08-17: "jag vill inte
 * längre ha någon hero som tar plats på sidorna"):
 *   · hubbkorten     — bilden som omslag överst i kortet, så att hubben blir
 *                      en vägg av platser i stället för en vägg av text
 *   · skenan         — en liten bild ovanför sidans rubrik (desktop)
 *   · mobilrubriken  — en tumnagel bredvid rubriken
 *
 * Nyckeln är samma sidnyckel som rådgivarna använder (`getPageKeyForPath`),
 * så en rutt har en enda sanning om vilken sida den är.
 *
 * Listan är uttömmande med flit: en bildplats ska aldrig peka på en fil som
 * inte finns. `sidbilder.test.ts` kontrollerar att varje nyckel har BÅDA
 * stilarna på disk — en bildplats med bara den ena stilen är förbjuden
 * (feedback 2026-09-10, se oversiktBilder.ts).
 */

import { getPageKeyForPath } from './radgivarRutter'
import { useSettingsStore, type Grafikstil } from '@/stores/settingsStore'

export const SIDBILDER = [
  // Hubbar
  'jobbHub',
  'karriarHub',
  'resurserHub',
  'vardagHub',
  // Söka jobb
  'jobSearch',
  'applications',
  'spontaneous',
  'cv',
  'coverLetter',
  'interviewSimulator',
  'salary',
  'international',
  'linkedinOptimizer',
  // Karriär
  'career',
  'interestGuide',
  'skillsGapAnalysis',
  'personalBrand',
  'education',
  // Resurser
  'knowledgeBase',
  'resources',
  'aiTeam',
  // Min vardag
  'wellness',
  'diary',
  'calendar',
  'exercises',
  'myConsultant',
  'profile',
  'settings',
] as const

export type Sidbildsnyckel = (typeof SIDBILDER)[number]

const FINNS = new Set<string>(SIDBILDER)

export function sidbildSrc(nyckel: string | undefined, stil: Grafikstil): string | null {
  if (!nyckel || !FINNS.has(nyckel)) return null
  return `/illustrations/sida-${nyckel}-${stil}.webp`
}

/** Bilden för en rutt, i användarens valda stil. null om sidan saknar bild. */
export function useSidbild(pathname: string | undefined): string | null {
  const stil = useSettingsStore((s) => s.grafikstil)
  return sidbildSrc(pathname ? getPageKeyForPath(pathname) : undefined, stil)
}
