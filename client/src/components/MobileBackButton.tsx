import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { navHubs } from './layout/navigation'

/**
 * MobileBackButton - tillbaka-knapp för mobil
 *
 * Visas på alla sidor utom hub-rotsidor (top-level destinations).
 * Ger användare med ångest alltid en synlig väg tillbaka.
 *
 * Sitter i sidhuvudet (`MobileTopBar` i Layout.tsx), inte flytande. Fram till
 * 2026-10-10 var den `position: fixed` 12 px från överkanten — men ovanför
 * sidhuvudet kan det ligga en banner (demoläget, "Visa som"), och då hamnade
 * knappen ovanpå bannerns text i stället för bredvid loggan. I sidhuvudet
 * följer den med dit huvudet hamnar, och huvudet är redan sticky.
 */
const HUB_ROOT_PATHS = new Set<string>(['/', ...navHubs.map(h => h.path)])

export function MobileBackButton({ className }: { className?: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  // Visa inte på hub-rotsidor (Översikt, Söka jobb, Karriär, Resurser, Min vardag)
  // — där fyller bottennavet redan funktionen.
  if (HUB_ROOT_PATHS.has(location.pathname)) {
    return null
  }

  const handleBack = () => {
    // Om vi kan gå tillbaka i historiken, gör det
    if (window.history.length > 2) {
      navigate(-1)
    } else {
      // Annars gå till dashboard
      navigate('/')
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className={cn(
        'shrink-0 w-11 h-11', // 44px — touch-målet får INTE krympas
        'flex items-center justify-center rounded-full',
        'text-stone-700 dark:text-stone-200',
        'hover:bg-stone-100 dark:hover:bg-stone-800 active:scale-95 transition-transform',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]',
        className
      )}
      aria-label={t('common.goBack', 'Gå tillbaka')}
      title={t('common.goBack', 'Gå tillbaka')}
    >
      <ArrowLeft className="w-5 h-5" aria-hidden="true" />
    </button>
  )
}

export default MobileBackButton
