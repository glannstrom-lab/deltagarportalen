/**
 * Lazy-laddat innehåll för GlobalCoachWidget (E10, 2026-07-23).
 * Drar in data/coaches.ts (~36 kB coach-texter) + CoachWidget — tidigare
 * statiskt importerade i Layout och därmed i entry-bundeln för ALLA,
 * även användare med widgeten avstängd.
 */
import { CoachWidget } from './CoachWidget'
import { getPageKeyForPath } from '@/data/coaches'

export default function GlobalCoachWidgetContent({ pathname }: { pathname: string }) {
  const pageKey = getPageKeyForPath(pathname)
  if (!pageKey) return null
  return <CoachWidget pageKey={pageKey} />
}
