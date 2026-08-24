 
import type { ComponentType, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Accessibility as AccessibilityIcon,
  Eye,
  Keyboard,
  Volume2,
  Mail,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Search,
} from '@/components/ui/icons'

function Section({ icon: Icon, title, children }: { icon: ComponentType<{ className?: string }>; title: string; children: ReactNode }) {
  return (
    <section className="scroll-mt-8">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-3">
        <Icon className="w-5 h-5 text-[var(--c-text)]" />
        {title}
      </h2>
      {children}
    </section>
  )
}

export default function Accessibility() {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 mb-6">
          <ArrowLeft className="w-4 h-4" />
          {t('accessibility.backToHome')}
        </Link>

        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t('accessibility.title')}
          </h1>
          <p className="text-stone-600 dark:text-stone-400">
            {t('accessibility.lastEdited')}
          </p>
          <p className="text-stone-600 dark:text-stone-400">
            {t('accessibility.assessmentDate')}
          </p>
        </header>

        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm p-8 space-y-8">

          <Section icon={AccessibilityIcon} title={t('accessibility.ambition.title')}>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('accessibility.ambition.pre')} <strong>{t('accessibility.ambition.strong')}</strong>{t('accessibility.ambition.post')}
            </p>
          </Section>

          <Section icon={Search} title={t('accessibility.assessment.title')}>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
              {t('accessibility.assessment.p1Pre')} <strong>{t('accessibility.assessment.p1Strong')}</strong>{t('accessibility.assessment.p1Post')} <em>{t('accessibility.assessment.p1Em')}</em> {t('accessibility.assessment.p1Post2')}
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('accessibility.assessment.p2')}
            </p>
          </Section>

          <Section icon={CheckCircle} title={t('accessibility.works.title')}>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 mt-1 text-emerald-600 flex-shrink-0" /><span><strong>{t('accessibility.works.publicPages.label')}</strong> {t('accessibility.works.publicPages.desc')}</span></li>
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 mt-1 text-emerald-600 flex-shrink-0" /><span><strong>{t('accessibility.works.focusIndicator.label')}</strong> {t('accessibility.works.focusIndicator.desc')}</span></li>
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 mt-1 text-emerald-600 flex-shrink-0" /><span><strong>{t('accessibility.works.reducedMotion.label')}</strong> {t('accessibility.works.reducedMotion.desc')}</span></li>
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 mt-1 text-emerald-600 flex-shrink-0" /><span><strong>{t('accessibility.works.noTimeLimits.label')}</strong> {t('accessibility.works.noTimeLimits.desc')}</span></li>
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 mt-1 text-emerald-600 flex-shrink-0" /><span><strong>{t('accessibility.works.calmMode.label')}</strong> {t('accessibility.works.calmMode.desc')}</span></li>
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 mt-1 text-emerald-600 flex-shrink-0" /><span><strong>{t('accessibility.works.focusMode.label')}</strong> {t('accessibility.works.focusMode.desc')}</span></li>
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 mt-1 text-emerald-600 flex-shrink-0" /><span><strong>{t('accessibility.works.energyAdaptation.label')}</strong> {t('accessibility.works.energyAdaptation.desc')}</span></li>
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 mt-1 text-emerald-600 flex-shrink-0" /><span><strong>{t('accessibility.works.twoLanguages.label')}</strong> {t('accessibility.works.twoLanguages.desc')}</span></li>
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 mt-1 text-emerald-600 flex-shrink-0" /><span><strong>{t('accessibility.works.darkMode.label')}</strong> {t('accessibility.works.darkMode.desc')}</span></li>
            </ul>
          </Section>

          <Section icon={AlertTriangle} title={t('accessibility.issues.title')}>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              {t('accessibility.issues.intro')}
            </p>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li className="flex gap-2"><AlertTriangle className="w-4 h-4 mt-1 text-amber-600 flex-shrink-0" /><span><strong>{t('accessibility.issues.buttonLabels.label')}</strong> {t('accessibility.issues.buttonLabels.desc')}</span></li>
              <li className="flex gap-2"><AlertTriangle className="w-4 h-4 mt-1 text-amber-600 flex-shrink-0" /><span><strong>{t('accessibility.issues.jobCards.label')}</strong> {t('accessibility.issues.jobCards.desc')}</span></li>
              <li className="flex gap-2"><AlertTriangle className="w-4 h-4 mt-1 text-amber-600 flex-shrink-0" /><span><strong>{t('accessibility.issues.colorContrast.label')}</strong> {t('accessibility.issues.colorContrast.desc')}</span></li>
              <li className="flex gap-2"><AlertTriangle className="w-4 h-4 mt-1 text-amber-600 flex-shrink-0" /><span><strong>{t('accessibility.issues.headingStructure.label')}</strong> {t('accessibility.issues.headingStructure.desc')}</span></li>
              <li className="flex gap-2"><AlertTriangle className="w-4 h-4 mt-1 text-amber-600 flex-shrink-0" /><span><strong>{t('accessibility.issues.complexVisualization.label')}</strong> {t('accessibility.issues.complexVisualization.desc')}</span></li>
              <li className="flex gap-2"><AlertTriangle className="w-4 h-4 mt-1 text-amber-600 flex-shrink-0" /><span><strong>{t('accessibility.issues.pdfExport.label')}</strong> {t('accessibility.issues.pdfExport.desc')}</span></li>
              <li className="flex gap-2"><AlertTriangle className="w-4 h-4 mt-1 text-amber-600 flex-shrink-0" /><span><strong>{t('accessibility.issues.voiceControl.label')}</strong> {t('accessibility.issues.voiceControl.desc')}</span></li>
              <li className="flex gap-2"><AlertTriangle className="w-4 h-4 mt-1 text-amber-600 flex-shrink-0" /><span><strong>{t('accessibility.issues.plainLanguage.label')}</strong> {t('accessibility.issues.plainLanguage.desc')}</span></li>
              <li className="flex gap-2"><AlertTriangle className="w-4 h-4 mt-1 text-amber-600 flex-shrink-0" /><span><strong>{t('accessibility.issues.screenReaderTesting.label')}</strong> {t('accessibility.issues.screenReaderTesting.desc')}</span></li>
              <li className="flex gap-2"><AlertTriangle className="w-4 h-4 mt-1 text-amber-600 flex-shrink-0" /><span><strong>{t('accessibility.issues.consultantView.label')}</strong> {t('accessibility.issues.consultantView.desc')}</span></li>
            </ul>
          </Section>

          <Section icon={Eye} title={t('accessibility.wcagStatus.title')}>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li><strong>{t('accessibility.wcagStatus.perceivable.label')}</strong> {t('accessibility.wcagStatus.perceivable.desc')}</li>
              <li><strong>{t('accessibility.wcagStatus.operable.label')}</strong> {t('accessibility.wcagStatus.operable.desc')}</li>
              <li><strong>{t('accessibility.wcagStatus.understandable.label')}</strong> {t('accessibility.wcagStatus.understandable.desc')}</li>
              <li><strong>{t('accessibility.wcagStatus.robust.label')}</strong> {t('accessibility.wcagStatus.robust.desc')}</li>
            </ul>
          </Section>

          <Section icon={Keyboard} title={t('accessibility.navigate.title')}>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li><strong>Tab</strong> — {t('accessibility.navigate.tab')}</li>
              <li><strong>Shift + Tab</strong> — {t('accessibility.navigate.shiftTab')}</li>
              <li><strong>Enter / Space</strong> — {t('accessibility.navigate.enterSpace')}</li>
              <li><strong>Esc</strong> — {t('accessibility.navigate.esc')}</li>
              <li><strong>{t('accessibility.navigate.arrowsLabel')}</strong> — {t('accessibility.navigate.arrowsDesc')}</li>
            </ul>
          </Section>

          <Section icon={Volume2} title={t('accessibility.assistiveTech.title')}>
            <p className="text-gray-700 dark:text-gray-300">
              {t('accessibility.assistiveTech.pre')} <strong>{t('accessibility.assistiveTech.strong')}</strong> {t('accessibility.assistiveTech.post')}
            </p>
          </Section>

          <Section icon={ExternalLink} title={t('accessibility.authority.title')}>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              {t('accessibility.authority.description')}
            </p>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mt-3">
              <li><strong>DIGG:</strong> <a href="https://www.digg.se" className="text-[var(--c-text)] underline">digg.se</a></li>
              <li><strong>DO:</strong> <a href="https://www.do.se" className="text-[var(--c-text)] underline">do.se</a></li>
            </ul>
          </Section>

          <Section icon={Mail} title={t('accessibility.contact.title')}>
            <p className="text-gray-700 dark:text-gray-300">
              {t('accessibility.contact.description')}
            </p>
            <p className="mt-3 text-gray-700 dark:text-gray-300">
              {t('accessibility.contact.emailLabel')} <a href="mailto:tillganglighet@jobin.se" className="text-[var(--c-text)] font-medium underline">tillganglighet@jobin.se</a>
            </p>
          </Section>

          <div className="border-t border-stone-200 dark:border-stone-700 pt-4 text-sm text-stone-500 dark:text-stone-400">
            <p>{t('accessibility.footer.text')}</p>
          </div>

        </div>
      </div>
    </div>
  )
}
