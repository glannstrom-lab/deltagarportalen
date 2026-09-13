import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { useMobileOptimizer } from './MobileOptimizer'
import { navHubs } from './layout/navigation'

/**
 * MobileBackButton - Fast tillbaka-knapp för mobil
 *
 * Visas på alla sidor utom hub-rotsidor (top-level destinations).
 * Ger användare med ångest alltid en synlig väg tillbaka.
 * Placerad i övre vänstra hörnet, utanför scroll.
 */
const HUB_ROOT_PATHS = new Set<string>(['/', ...navHubs.map(h => h.path)])

export function MobileBackButton() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { isMobile } = useMobileOptimizer()

  // Visa inte på hub-rotsidor (Översikt, Söka jobb, Karriär, Resurser, Min vardag)
  // — där fyller bottom-nav redan funktionen och knappen krockar med topbar-loggan.
  if (!isMobile || HUB_ROOT_PATHS.has(location.pathname)) {
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
      onClick={handleBack}
      className={cn(
        'mobile-back-button',
        'fixed z-50',
        'w-11 h-11', // 44px för att matcha safe area — touch-målet får INTE krympas
        'bg-white rounded-full',
        /* Skav (persona 2026-09-12): knappen låg bildmässigt ovanpå
           Jobin-loggan i `MobileTopBar` (`Layout.tsx`) — mätt i prod: knappens
           box tar exakt x:12–60px vid `left:12px`, och loggan börjar på
           x:60px (headerns `pl-[60px]`, satt just för knappen). NOLL marginal
           kvar, så `shadow-lg`s eget blur (~10-15px) målade rakt över loggan.
           Layout.tsx ägs inte härifrån, så fixen sitter i knappen: mindre
           skugga (kortare räckvidd) + två px längre in från kanten. Boxen är
           fortfarande 44×44 — bara positionerad och beskuggad för att rymmas
           inom de 60 pixlarna headern redan reserverar. */
        'shadow-md border border-stone-100',
        'flex items-center justify-center',
        'transition-all duration-200',
        'hover:shadow-lg hover:scale-105',
        'active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2'
      )}
      style={{
        top: 'max(12px, env(safe-area-inset-top))',
        left: 'max(8px, env(safe-area-inset-left))'
      }}
      aria-label={t('common.goBack', 'Gå tillbaka')}
      title={t('common.goBack', 'Gå tillbaka')}
    >
      <ArrowLeft className="w-5 h-5 text-stone-700" />
    </button>
  )
}

export default MobileBackButton
