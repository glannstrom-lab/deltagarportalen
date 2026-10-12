/**
 * UT3: sidopanelens tre verktyg (personlighet, svarslängd, snabbfunktioner).
 * När organisationen stängt av AI tar AgentChat emot varje anrop och gör
 * ingenting — då ska verktygen inte stå där och se klickbara ut.
 * `undefined` (inte hämtat än) behandlas som "ingen spärr", som i AgentChat.
 */
import { PersonalityDropdown } from './PersonalityDropdown'
import { ResponseModeSelector } from './ResponseModeSelector'
import { QuickActions } from './QuickActions'
import { useOrgAiSparr } from '@/hooks/useOrgAiSparr'

const RUTA = 'bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700/50 p-4'

export function AITeamVerktyg({ onQuickAction }: { onQuickAction: (prompt: string) => void }) {
  const orgSparr = useOrgAiSparr()
  if (orgSparr) return null
  return (
    <>
      <section className={RUTA}>
        <PersonalityDropdown />
      </section>
      <section className={RUTA}>
        <ResponseModeSelector />
      </section>
      <section className={RUTA}>
        <QuickActions onActionClick={onQuickAction} />
      </section>
    </>
  )
}
