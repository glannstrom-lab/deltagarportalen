/**
 * FokusVaxel — växlar mellan normalvy och fokusläge UTAN att riva normalvyn.
 *
 * ## Varför den finns
 *
 * `PageFocusShell` rekommenderade i sin egen docstring det här mönstret:
 *
 * ```tsx
 * if (isFocusMode) {
 *   return <PageFocusShell …><FocusNågotWizard /></PageFocusShell>
 * }
 * // normalvy nedan — orörd
 * ```
 *
 * Kommentaren "orörd" är fel, och det är hela problemet. En tidig `return`
 * gör att React **avmonterar** normalvyn. Allt tillstånd som bodde där —
 * textfält, halvifyllda formulär, vald flik, pågående timer — försvinner i
 * samma ögonblick, och kommer inte tillbaka när användaren slår av
 * fokusläget igen. Ingen varning, inget felmeddelande.
 *
 * Det är extra illa just här, av två skäl:
 *
 * 1. **Växeln är global.** Den sitter i toppnaven (`TopBar`) och i
 *    Lugnare läge-panelen (`LugnarePanel`), alltså nåbar från vilken sida
 *    som helst — även mitt i ett halvskrivet personligt brev.
 * 2. **Målgruppen.** Fokusläget finns för den som behöver göra en sak i
 *    taget. Att just den användaren tappar sitt arbete när hon ber om en
 *    lugnare vy är motsatsen till vad funktionen är till för. Shellens eget
 *    kontrakt, punkt 8, säger: *"Spara automatiskt vid varje 'Nästa' så
 *    användaren aldrig tappar arbete om de avbryter."*
 *
 * Samma bugg har lagats en sida i taget fem gånger — intervjusimulatorn
 * (`b93be382`), lönesidan (`00d8be26`), Karriär, Kompetensanalysen och
 * Personligt varumärke. Den här komponenten finns för att sluta laga den en
 * sida i taget.
 *
 * ## Hur den används
 *
 * ```tsx
 * return (
 *   <FokusVaxel
 *     title={t('diary.title')}
 *     icon={NotebookPen}
 *     domain="wellbeing"
 *     guide={<FocusDiaryWizard onExit={leaveWizard} />}
 *   >
 *     <PageLayout …>…hela normalvyn…</PageLayout>
 *   </FokusVaxel>
 * )
 * ```
 *
 * Normalvyn ligger kvar monterad bakom `display: none`, vilket också tar
 * bort den ur tillgänglighetsträdet och ur tabbordningen — en skärmläsare
 * eller tangentbordsanvändare når alltså inte den dolda vyn.
 *
 * ## Vad du behöver veta
 *
 * Normalvyn är dold, inte avstängd. Effekter, intervall och pågående
 * hämtningar fortsätter köra bakom fokusläget. Det är önskat i de flesta
 * fall (data hinner bli klar medan användaren är i guiden), men en sida med
 * något som **hörs eller mäter tid** — inspelning, uppläsning, en
 * nedräkning — bör pausa det själv när `isFocusMode` slår om. Använd
 * `useFocusMode()` i den komponenten för det.
 */
import { type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { ColorDomain } from '@/components/layout/PageLayout'
import { useFocusMode } from '@/components/FocusModeProvider'
import { PageFocusShell } from './PageFocusShell'

interface FokusVaxelProps {
  /** Rubrik i fokuslägets header. */
  title: string
  icon?: LucideIcon
  domain?: ColorDomain
  /** Guiden som visas i fokusläget. */
  guide: ReactNode
  /** Normalvyn. Ligger kvar monterad, dold. */
  children: ReactNode
  /** Override av "Avsluta fokus". Default: `toggleFocusMode()`. */
  onExit?: () => void
}

export function FokusVaxel({ title, icon, domain, guide, children, onExit }: FokusVaxelProps) {
  const { isFocusMode } = useFocusMode()

  return (
    <>
      <div style={isFocusMode ? { display: 'none' } : undefined}>{children}</div>

      {isFocusMode && (
        <PageFocusShell title={title} icon={icon} domain={domain} onExit={onExit}>
          {guide}
        </PageFocusShell>
      )}
    </>
  )
}

export default FokusVaxel
