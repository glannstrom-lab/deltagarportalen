/**
 * Vägen tillbaka till arbetsytan för den som har en.  (2026-08-18)
 *
 * **Varför den behövs.** Konsulentvyn (`/consultant`) och adminpanelen
 * (`/admin`) länkades från två ställen: `Sidebar.tsx` och mobilens
 * hamburgermeny i `Layout.tsx`. Sidomenyn renderas inte när toppnaven är på —
 * och den är på som default sedan `c7c11ca2`. Kvar på desktop blev alltså
 * kommandopaletten (Ctrl/⌘ K), som man måste veta finns. En konsulent som
 * loggar in landar på `/oversikt`, deltagarens vy, utan synlig väg till sin
 * egen. Mobilen har fortfarande hamburgermenyn, så felet drabbar just den
 * enhet konsulenter oftast arbetar på.
 *
 * **Varför den ser annorlunda ut.** DESIGN.md §2 säger att konsulent- och
 * adminvyer får ha en annan ton, men att det ska vara "en tydlig switch, inte
 * slumpartat". Bandet lånar därför violett — samma färg som sidomenyns
 * konsulentsektion redan använde — i stället för sidans hubbfärg. Det ska
 * synas att det inte hör till deltagarvyn.
 *
 * **Ingen påhittad status.** Bandet visar vad du har tillgång till, inte hur
 * många deltagare som väntar eller hur mycket som är ogjort. Sådana tal kräver
 * data som den här komponenten inte hämtar, och ett tal utan underlag är
 * precis det ROADMAP B31 förbjuder.
 *
 * Länkarna kommer ur `adminNavItems`/`consultantNavItems` i navigation.ts —
 * samma källa som sidomeny, hamburgermeny och kommandopalett läser, så de fyra
 * kan inte glida isär.
 */

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from '@/components/ui/icons'
import { useAuthStore } from '@/stores/authStore'
import { adminNavItems, consultantNavItems } from '@/components/layout/navigation'

export default function RollGenvag() {
  const { t } = useTranslation()
  const profile = useAuthStore((s) => s.profile)

  const aktivRoll = profile?.activeRole || profile?.role || 'USER'
  const arSuperadmin = aktivRoll === 'SUPERADMIN'
  const arAdmin = aktivRoll === 'ADMIN' || arSuperadmin
  // Arbetsterapeuten når konsulentvyn för att kunna signera skattningar —
  // samma villkor som Sidebar.tsx redan använder. Läs det där innan du ändrar
  // här; två olika svar på "vem är konsulent" är hur behörigheter glider isär.
  const arArbetsterapeut = aktivRoll === 'ARBETSTERAPEUT'
  const arKonsulent = aktivRoll === 'CONSULTANT' || arAdmin || arArbetsterapeut

  if (!arKonsulent && !arAdmin) return null

  const poster = [
    ...(arKonsulent ? consultantNavItems : []),
    ...(arAdmin ? adminNavItems : []),
  ]
  if (poster.length === 0) return null

  // Egna nycklar i stället för `roles.*`: de senare är etiketter med versal
  // ("Konsulent") och hamnar mitt i en mening här.
  const rollnamn = arSuperadmin
    ? t('rollgenvag.superadmin', 'superadmin')
    : arAdmin
      ? t('rollgenvag.admin', 'administratör')
      : arArbetsterapeut
        ? t('rollgenvag.arbetsterapeut', 'arbetsterapeut')
        : t('rollgenvag.konsulent', 'arbetskonsulent')

  return (
    <section
      aria-labelledby="rollgenvag-rubrik"
      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-violet-200 dark:border-violet-800/60 bg-violet-50 dark:bg-violet-900/20 px-4 py-3"
    >
      <p
        id="rollgenvag-rubrik"
        className="m-0 text-[13px] text-violet-900 dark:text-violet-200"
      >
        {t('rollgenvag.text', 'Du är inloggad som {{roll}}. Det här är deltagarvyn.', {
          roll: rollnamn,
        })}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {poster.map((post) => {
          const Ikon = post.icon
          return (
            <Link
              key={post.path}
              to={post.path}
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-[13px] font-medium text-white no-underline transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
            >
              <Ikon className="h-4 w-4" aria-hidden="true" />
              {t(post.labelKey)}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )
        })}
      </div>
    </section>
  )
}
