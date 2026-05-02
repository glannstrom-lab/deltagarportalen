import { useNavigate, useLocation } from 'react-router-dom'
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
        'w-11 h-11', // 44px för att matcha safe area
        'bg-white rounded-full',
        'shadow-lg border border-stone-100',
        'flex items-center justify-center',
        'transition-all duration-200',
        'hover:shadow-xl hover:scale-105',
        'active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2'
      )}
      style={{
        top: 'max(12px, env(safe-area-inset-top))',
        left: '12px'
      }}
      aria-label="Gå tillbaka"
      title="Gå tillbaka"
    >
      <ArrowLeft className="w-5 h-5 text-stone-700" />
    </button>
  )
}

export default MobileBackButton
