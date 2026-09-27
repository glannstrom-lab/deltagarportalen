/**
 * OrgUtanAi — AI-teamets läge när deltagarens organisation stängt av AI
 * (RD7/RD32, rollspelet 2026-09-27).
 *
 * Tidigare fick deltagaren skriva, och fick sedan "Godkänn AI-behandling i
 * Inställningar". Hon gjorde det och fick samma besked igen — det var aldrig
 * hennes samtycke som saknades, utan organisationens beslut. Nu säger sidan
 * det direkt, utan skuld och utan något hon måste göra, och ger tre vägar som
 * fungerar utan AI. Ton: lugn vän (DESIGN.md §2).
 */

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MessageCircle, BookOpen, FileText } from '@/components/ui/icons'

interface Props {
  orgName: string
}

const VAGAR = [
  { to: '/my-consultant', ikon: MessageCircle, rubrik: 'aiTeam.orgAv.konsulent', text: 'aiTeam.orgAv.konsulentText' },
  { to: '/knowledge-base', ikon: BookOpen, rubrik: 'aiTeam.orgAv.kunskapsbank', text: 'aiTeam.orgAv.kunskapsbankText' },
  { to: '/cv', ikon: FileText, rubrik: 'aiTeam.orgAv.cv', text: 'aiTeam.orgAv.cvText' },
] as const

export function OrgUtanAi({ orgName }: Props) {
  const { t } = useTranslation()
  return (
    <section aria-labelledby="org-utan-ai-rubrik" className="flex flex-col h-full p-4 sm:p-6">
      <h3 id="org-utan-ai-rubrik" className="text-lg font-semibold text-stone-900 dark:text-stone-100">
        {t('aiTeam.orgAv.rubrik', 'Din organisation har valt att inte använda AI')}
      </h3>
      <p className="mt-2 text-sm text-stone-700 dark:text-stone-300 max-w-prose">
        {t('aiTeam.orgAv.text', {
          defaultValue: '{{orgName}} har stängt av AI-funktionerna i Jobin. Det gäller alla, och du behöver inte göra något. Här är tre saker du kan göra i stället:',
          orgName,
        })}
      </p>
      <ul className="mt-4 grid gap-3">
        {VAGAR.map(({ to, ikon: Ikon, rubrik, text }) => (
          <li key={to}>
            <Link
              to={to}
              className="flex items-start gap-3 rounded-xl border border-stone-200 dark:border-stone-700 p-4 hover:border-[var(--c-solid)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]"
            >
              <Ikon className="w-5 h-5 mt-0.5 text-[var(--c-text)] shrink-0" aria-hidden="true" />
              <span>
                <span className="block font-medium text-stone-900 dark:text-stone-100">{t(rubrik)}</span>
                <span className="block text-sm text-stone-600 dark:text-stone-400">{t(text)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
