/**
 * RiasecPersonalizationBanner - Shows that content is personalized based on RIASEC
 */

import { Link } from 'react-router-dom'
import { Compass, Sparkles, ChevronRight } from '@/components/ui/icons'
import { useInterestProfile, RIASEC_TYPES } from '@/hooks/useInterestProfile'
import { cn } from '@/lib/utils'

interface RiasecPersonalizationBannerProps {
  className?: string
  compact?: boolean
}

export function RiasecPersonalizationBanner({ className, compact = false }: RiasecPersonalizationBannerProps) {
  const { profile, isLoading } = useInterestProfile()

  if (isLoading) return null

  // If user has completed the interest guide - show their profile
  if (profile.hasResult && profile.dominantTypes.length > 0) {
    const dominant = profile.dominantTypes[0]
    const riasecType = dominant ? RIASEC_TYPES[dominant.code] : null

    if (compact) {
      return (
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-full border border-amber-200",
          className
        )}>
          <Compass className="w-4 h-4 text-amber-600" />
          <span className="text-sm text-amber-700 font-medium">
            Anpassat efter din profil
          </span>
          <Sparkles className="w-3 h-3 text-amber-500" />
        </div>
      )
    }

    return (
      <div className={cn(
        "bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-4",
        className
      )}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Compass className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-stone-800">Personaliserat innehåll</h4>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-sm text-stone-600">
              Baserat på din intresseprofil: <span className="font-medium text-amber-700">{riasecType?.nameSv}</span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // If user hasn't completed the interest guide - show CTA
  return (
    <Link
      to="/interest-guide"
      className={cn(
        "block bg-gradient-to-r from-[var(--c-bg)] to-sky-50 rounded-xl border border-[var(--c-accent)]/60 p-4 hover:border-[var(--c-accent)] transition-colors",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[var(--c-accent)]/40 rounded-lg flex items-center justify-center flex-shrink-0">
          <Compass className="w-5 h-5 text-[var(--c-text)]" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-stone-800 flex items-center gap-2">
            Få personaliserade rekommendationer
            <Sparkles className="w-4 h-4 text-[var(--c-solid)]" />
          </h4>
          <p className="text-sm text-stone-600">
            Gör intresseguiden för att få innehåll anpassat efter dina intressen
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-[var(--c-solid)]" />
      </div>
    </Link>
  )
}

export default RiasecPersonalizationBanner
