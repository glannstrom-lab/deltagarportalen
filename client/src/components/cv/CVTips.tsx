/**
 * CV Tips Component
 * Guides and best practices for writing a great CV
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Star,
  AlertTriangle,
  Video,
  FileText,
  Target,
  Award
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface TipSection {
  id: string
  titleKey: string
  icon: typeof BookOpen
  descriptionKey: string
  tips: {
    doKeys: string[]
    dontKeys: string[]
  }
}

// Tip section definitions with translation keys
const tipSectionDefs: TipSection[] = [
  {
    id: 'structure',
    titleKey: 'cv.tips.sections.structure.title',
    icon: FileText,
    descriptionKey: 'cv.tips.sections.structure.description',
    tips: {
      doKeys: [
        'cv.tips.sections.structure.do1',
        'cv.tips.sections.structure.do2',
        'cv.tips.sections.structure.do3',
        'cv.tips.sections.structure.do4',
        'cv.tips.sections.structure.do5'
      ],
      dontKeys: [
        'cv.tips.sections.structure.dont1',
        'cv.tips.sections.structure.dont2',
        'cv.tips.sections.structure.dont3',
        'cv.tips.sections.structure.dont4',
        'cv.tips.sections.structure.dont5'
      ]
    }
  },
  {
    id: 'content',
    titleKey: 'cv.tips.sections.content.title',
    icon: BookOpen,
    descriptionKey: 'cv.tips.sections.content.description',
    tips: {
      doKeys: [
        'cv.tips.sections.content.do1',
        'cv.tips.sections.content.do2',
        'cv.tips.sections.content.do3',
        'cv.tips.sections.content.do4',
        'cv.tips.sections.content.do5'
      ],
      dontKeys: [
        'cv.tips.sections.content.dont1',
        'cv.tips.sections.content.dont2',
        'cv.tips.sections.content.dont3',
        'cv.tips.sections.content.dont4',
        'cv.tips.sections.content.dont5'
      ]
    }
  },
  {
    id: 'sections',
    titleKey: 'cv.tips.sections.important.title',
    icon: Target,
    descriptionKey: 'cv.tips.sections.important.description',
    tips: {
      doKeys: [
        'cv.tips.sections.important.do1',
        'cv.tips.sections.important.do2',
        'cv.tips.sections.important.do3',
        'cv.tips.sections.important.do4',
        'cv.tips.sections.important.do5'
      ],
      dontKeys: [
        'cv.tips.sections.important.dont1',
        'cv.tips.sections.important.dont2',
        'cv.tips.sections.important.dont3',
        'cv.tips.sections.important.dont4',
        'cv.tips.sections.important.dont5'
      ]
    }
  },
  {
    id: 'ats',
    titleKey: 'cv.tips.sections.ats.title',
    icon: Award,
    descriptionKey: 'cv.tips.sections.ats.description',
    tips: {
      doKeys: [
        'cv.tips.sections.ats.do1',
        'cv.tips.sections.ats.do2',
        'cv.tips.sections.ats.do3',
        'cv.tips.sections.ats.do4',
        'cv.tips.sections.ats.do5'
      ],
      dontKeys: [
        'cv.tips.sections.ats.dont1',
        'cv.tips.sections.ats.dont2',
        'cv.tips.sections.ats.dont3',
        'cv.tips.sections.ats.dont4',
        'cv.tips.sections.ats.dont5'
      ]
    }
  },
  {
    id: 'adjustments',
    titleKey: 'cv.tips.sections.adjustments.title',
    icon: Lightbulb,
    descriptionKey: 'cv.tips.sections.adjustments.description',
    tips: {
      doKeys: [
        'cv.tips.sections.adjustments.do1',
        'cv.tips.sections.adjustments.do2',
        'cv.tips.sections.adjustments.do3',
        'cv.tips.sections.adjustments.do4',
        'cv.tips.sections.adjustments.do5'
      ],
      dontKeys: [
        'cv.tips.sections.adjustments.dont1',
        'cv.tips.sections.adjustments.dont2',
        'cv.tips.sections.adjustments.dont3',
        'cv.tips.sections.adjustments.dont4',
        'cv.tips.sections.adjustments.dont5'
      ]
    }
  }
]

// Quick tips with translation keys
const quickTipDefs = [
  { titleKey: 'cv.tips.quick.short.title', contentKey: 'cv.tips.quick.short.content', icon: Target },
  { titleKey: 'cv.tips.quick.customize.title', contentKey: 'cv.tips.quick.customize.content', icon: Star },
  { titleKey: 'cv.tips.quick.feedback.title', contentKey: 'cv.tips.quick.feedback.content', icon: Lightbulb },
  { titleKey: 'cv.tips.quick.pdf.title', contentKey: 'cv.tips.quick.pdf.content', icon: FileText }
]

export function CVTips() {
  const { t } = useTranslation()
  const [expandedSection, setExpandedSection] = useState<string | null>('structure')

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-2">{t('cv.tips.title')}</h2>
        <p className="text-stone-600 dark:text-stone-400">
          {t('cv.tips.description')}
        </p>
      </div>

      {/* Quick Tips Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickTipDefs.map((tip, i) => (
          <div key={i} className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 p-5 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/50 rounded-lg flex items-center justify-center mb-3">
              <tip.icon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-1">{t(tip.titleKey)}</h3>
            <p className="text-sm text-stone-600 dark:text-stone-400">{t(tip.contentKey)}</p>
          </div>
        ))}
      </div>

      {/* Expandable Sections */}
      <div className="space-y-4">
        {tipSectionDefs.map(section => {
          const Icon = section.icon
          const isExpanded = expandedSection === section.id
          const sectionPanelId = `cvtip-${section.id}-content`
          const sectionTitle = t(section.titleKey)

          return (
            <div
              key={section.id}
              className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700/50 overflow-hidden"
            >
              <button
                onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                aria-expanded={isExpanded}
                aria-controls={sectionPanelId}
                className="w-full px-6 py-5 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/50 rounded-xl flex items-center justify-center">
                    <Icon className="w-6 h-6 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-stone-800 dark:text-stone-100">{sectionTitle}</h3>
                    <p className="text-sm text-stone-700 dark:text-stone-300">{t(section.descriptionKey)}</p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-stone-600 dark:text-stone-400" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-stone-600 dark:text-stone-400" aria-hidden="true" />
                )}
              </button>

              {isExpanded && (
                <div id={sectionPanelId} role="region" aria-label={sectionTitle} className="px-6 pb-6 border-t border-stone-100 dark:border-stone-800">
                  <div className="grid md:grid-cols-2 gap-6 pt-6">
                    {/* Do's */}
                    <div>
                      <h4 className="flex items-center gap-2 font-medium text-green-700 dark:text-green-400 mb-4">
                        <CheckCircle2 className="w-5 h-5" />
                        {t('cv.tips.doThis')}
                      </h4>
                      <ul className="space-y-3">
                        {section.tips.doKeys.map((tipKey, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-stone-700 dark:text-stone-300">
                            <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                              ✓
                            </span>
                            {t(tipKey)}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Don'ts */}
                    <div>
                      <h4 className="flex items-center gap-2 font-medium text-red-700 dark:text-red-400 mb-4">
                        <XCircle className="w-5 h-5" />
                        {t('cv.tips.avoidThis')}
                      </h4>
                      <ul className="space-y-3">
                        {section.tips.dontKeys.map((tipKey, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-stone-700 dark:text-stone-300">
                            <span className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                              ✕
                            </span>
                            {t(tipKey)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Common Mistakes */}
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800/50">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-3">{t('cv.tips.mistakes.title')}</h3>
            <ul className="space-y-2 text-amber-800 dark:text-amber-300 text-sm">
              <li>• <strong>{t('cv.tips.mistakes.spelling.title')}</strong> - {t('cv.tips.mistakes.spelling.desc')}</li>
              <li>• <strong>{t('cv.tips.mistakes.generic.title')}</strong> - {t('cv.tips.mistakes.generic.desc')}</li>
              <li>• <strong>{t('cv.tips.mistakes.long.title')}</strong> - {t('cv.tips.mistakes.long.desc')}</li>
              <li>• <strong>{t('cv.tips.mistakes.email.title')}</strong> - {t('cv.tips.mistakes.email.desc')}</li>
              <li>• <strong>{t('cv.tips.mistakes.keywords.title')}</strong> - {t('cv.tips.mistakes.keywords.desc')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-200 dark:border-teal-800/50">
        <div>
          <h3 className="font-semibold text-stone-800 dark:text-stone-100">{t('cv.tips.cta.title')}</h3>
          <p className="text-stone-600 dark:text-stone-400 text-sm">{t('cv.tips.cta.description')}</p>
        </div>
        <a
          href="/cv"
          className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
        >
          <FileText className="w-5 h-5" />
          {t('cv.tips.cta.button')}
        </a>
      </div>

      {/* Additional Resources */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Video className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h4 className="font-semibold text-stone-800 dark:text-stone-100">{t('cv.tips.resources.video.title')}</h4>
          </div>
          <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">
            {t('cv.tips.resources.video.description')}
          </p>
          <button className="text-teal-600 dark:text-teal-400 text-sm font-medium hover:underline">
            {t('cv.tips.resources.video.comingSoon')}
          </button>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Target className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h4 className="font-semibold text-stone-800 dark:text-stone-100">{t('cv.tips.resources.ats.title')}</h4>
          </div>
          <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">
            {t('cv.tips.resources.ats.description')}
          </p>
          <a
            href="/cv/ats"
            className="text-teal-600 dark:text-teal-400 text-sm font-medium hover:underline"
          >
            {t('cv.tips.resources.ats.link')}
          </a>
        </div>
      </div>
    </div>
  )
}

export default CVTips
