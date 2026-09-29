import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { JobMatch } from '@/services/interestGuideData'
import { 
  ChevronDown, 
  ChevronUp, 
  GraduationCap, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  CheckCircle2,
  Briefcase
} from '@/components/ui/icons'


interface JobCardProps {
  match: JobMatch
  isSelected?: boolean
  onSelect?: (selected: boolean) => void
  showCompare?: boolean
  /** Platsen i rangordningen (1 = närmast dina svar) och antal yrken totalt. */
  place?: number
  total?: number
}

export function JobCard({ 
  match, 
  isSelected, 
  onSelect, 
  showCompare = false,
  place,
  total,
}: JobCardProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const { occupation, isSuitable, needsAdaptation, adaptations, warnings } = match

  const getPrognosisIcon = (prognosis: string) => {
    switch (prognosis) {
      case 'growing':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      default:
        return <Minus className="w-4 h-4 text-amber-600" />
    }
  }

  const getPrognosisText = (prognosis: string) => {
    switch (prognosis) {
      case 'growing':
        return t('interestGuide.jobCard.prognosis.growing', 'Växande')
      case 'declining':
        return t('interestGuide.jobCard.prognosis.declining', 'Krympande')
      default:
        return t('interestGuide.jobCard.prognosis.stable', 'Stabil')
    }
  }

  return (
    <div 
      className={`rounded-xl border-2 transition-all duration-200 ${
        isSuitable 
          ? 'border-green-200 bg-green-50/30' 
          : needsAdaptation 
          ? 'border-amber-200 bg-amber-50/30'
          : 'border-red-200 bg-red-50/30'
      }`}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Checkbox för jämförelse */}
          {showCompare && (
            <input
              type="checkbox"
              aria-label={t('interestGuide.jobCard.selectForCompare', 'Välj {{name}} för jämförelse', { name: occupation.name })}
              checked={isSelected}
              onChange={(e) => onSelect?.(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          )}

          {/* Plats i rangordningen. Här stod matchPercentage som stort tal med
              färgskala och stapel — otolkbart som lämplighet (en neutral
              svarsprofil får 61–82 % mot varje yrke). Rangordningen är äkta. */}
          {place !== undefined && (
            <div className="flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center text-indigo-700 bg-indigo-50 border border-indigo-200">
              <span className="text-xs">{t('interestGuide.jobCard.placeLabel', 'Nr')}</span>
              <span className="text-2xl font-bold">{place}</span>
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900">
              {occupation.name}
            </h3>
            <p className="text-sm text-gray-500">
              {occupation.description}
            </p>

            {place !== undefined && (
              <p className="mt-1 text-xs text-gray-600">
                {total
                  ? t('interestGuide.results.rankPlace', 'Nr {{place}} av {{total}} utifrån dina svar', { place, total })
                  : t('interestGuide.results.rankPlaceShort', 'Nr {{place}} utifrån dina svar', { place })}
              </p>
            )}

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              {occupation.requiresUniversity ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                  <GraduationCap className="w-3 h-3" />
                  {t('interestGuide.jobCard.university', 'Högskola')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                  <Briefcase className="w-3 h-3" />
                  {t('interestGuide.jobCard.upperSecondary', 'Gymnasium')}
                </span>
              )}
              
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                {getPrognosisIcon(occupation.prognosis)}
                {getPrognosisText(occupation.prognosis)}
              </span>

              {!isSuitable && warnings && warnings.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                  <AlertTriangle className="w-3 h-3" />
                  {t('interestGuide.jobCard.challenges', 'Utmaningar')}
                </span>
              )}
            </div>
          </div>

          {/* Expand-knapp */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {/* Expanderat innehåll */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-200 pt-4 transition-all duration-200">
          {/* Lön och utbildning */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <Wallet className="w-4 h-4" />
                <span>{t('career.explore.salary')}</span>
              </div>
              <p className="font-medium text-gray-900">{occupation.salary}</p>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <GraduationCap className="w-4 h-4" />
                <span>{t('interestGuide.jobCard.education', 'Utbildning')}</span>
              </div>
              <p className="font-medium text-gray-900">{occupation.education.name}</p>
              <p className="text-sm text-gray-500">{occupation.education.length}</p>
            </div>
          </div>

          {/* Karriärväg */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">{t('interestGuide.jobCard.careerPath')}</h4>
            <div className="flex flex-wrap items-center gap-2">
              {occupation.careerPath.map((step, i) => (
                <span key={i} className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm">
                    {step}
                  </span>
                  {i < occupation.careerPath.length - 1 && (
                    <span className="text-gray-400">→</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Relaterade yrken */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">{t('interestGuide.jobCard.relatedJobs', 'Relaterade yrken:')}</h4>
            <div className="flex flex-wrap gap-2">
              {occupation.relatedJobs.map((job) => (
                <span
                  key={job}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  {job}
                </span>
              ))}
            </div>
          </div>

          {/* Matchningsdetaljer */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              {t('interestGuide.jobCard.aboutPlaceTitle', 'Om placeringen')}
            </h4>
            {/* Tre färdiga omdömen efter procentgränser (80/60) stod här. Talet är inte
                tolkbart som lämplighet, så texten säger bara vad platsen betyder. */}
            <p className="text-sm text-blue-700">
              {t('interestGuide.jobCard.aboutPlaceText', 'Platsen visar hur nära yrkets profil ligger dina svar, jämfört med de andra yrkena. Den säger inte hur väl du skulle trivas eller lyckas. Det får du veta genom att utforska yrket och prata med någon som arbetar där.')}
            </p>
          </div>

          {/* Anpassningar */}
          {needsAdaptation && adaptations && adaptations.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <h4 className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {t('interestGuide.jobCard.adaptationsTitle', 'Anpassningar som kan hjälpa dig:')}
              </h4>
              <p className="text-xs text-amber-600 mb-2">
                {t('interestGuide.jobCard.adaptationsLead', 'Baserat på dina svar kan följande anpassningar göra det lättare att arbeta inom detta yrke:')}
              </p>
              <ul className="text-sm text-amber-700 space-y-2">
                {adaptations?.map((adaptation, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>{adaptation}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-amber-600 mt-3 italic">
                {t('interestGuide.jobCard.adaptationsLaw', 'Enligt Arbetsmiljölagen har du rätt till rimliga arbetsanpassningar. Diskutera med en arbetskonsulent eller arbetsgivare.')}
              </p>
            </div>
          )}

          {/* Varningar/Utmaningar */}
          {warnings && warnings.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {t('interestGuide.jobCard.warningsTitle', 'Utmaningar att vara medveten om:')}
              </h4>
              <p className="text-xs text-red-600 mb-2">
                {t('interestGuide.jobCard.warningsLead', 'Detta yrke kan innebära vissa utmaningar baserat på dina angivna förutsättningar:')}
              </p>
              <ul className="text-sm text-red-700 space-y-2">
                {warnings?.map((warning, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-red-600 mt-3">
                {t('interestGuide.jobCard.warningsNote', 'Detta betyder inte att du inte kan arbeta med detta yrke, men det kan krävas extra stöd eller anpassningar.')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
