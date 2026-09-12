/**
 * SprakVal — språk som deltagarens eget val i Inställningar → Tillgänglighet
 * (PG4, 2026-09-12). Persona-genomgången visade att "Välj språk" bara fanns i
 * desktop-toppnaven: på mobilen kunde en nyanländ deltagare inte byta språk alls.
 *
 * Samma tre val som LanguageSwitcher och samma mekanik: 'sv' och 'en' är
 * i18next-språk, 'sv-latt' är KM11:s överlägg på svenskan (lattSvenska.ts) och
 * sparas i localStorage per enhet — kolumnen finns inte i user_preferences.
 */

import { useTranslation } from 'react-i18next'
import { LATT_SVENSKA_KOD, arLattSvenska, sattLattSvenska } from '@/i18n/lattSvenska'
import { Card } from '@/components/ui/Card'

function aktivKod(lng: string): string {
  return lng === 'sv' && arLattSvenska() ? LATT_SVENSKA_KOD : lng
}

export function SprakVal() {
  const { t, i18n } = useTranslation()
  const varde = aktivKod(i18n.language)

  const byt = (kod: string) => {
    if (kod === LATT_SVENSKA_KOD) {
      void sattLattSvenska(true)
      return
    }
    if (kod === 'sv' && arLattSvenska()) void sattLattSvenska(false)
    void i18n.changeLanguage(kod)
  }

  return (
    <Card variant="flat" padding="sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <label htmlFor="sprakval" className="block font-medium text-stone-900 dark:text-stone-100">
            {t('settings.accessibility.language', 'Språk')}
          </label>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            {t('settings.accessibility.languageDesc', 'Välj det språk du läser bäst. Lätt svenska gör de viktigaste texterna enklare.')}
          </p>
        </div>
        <select
          id="sprakval"
          value={varde}
          onChange={(e) => byt(e.target.value)}
          className="min-h-[44px] px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
        >
          <option value="sv">{t('settings.accessibility.languageOptions.sv', 'Svenska')}</option>
          <option value={LATT_SVENSKA_KOD}>{t('settings.accessibility.languageOptions.lattSvenska', 'Lätt svenska')}</option>
          <option value="en">{t('settings.accessibility.languageOptions.en', 'English')}</option>
        </select>
      </div>
    </Card>
  )
}
