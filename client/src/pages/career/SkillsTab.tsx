/**
 * Skills Tab - Skills gap analysis (redirects to SkillsGapAnalysis)
 */
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Target, Search, CheckCircle, AlertCircle, BookOpen,
  Sparkles, TrendingUp, Award
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'

interface Skill {
  name: string
  current: number
  target: number
  gap: 'none' | 'small' | 'medium' | 'large'
}

interface Course {
  title: string
  provider: string
  duration: string
  type: string
  cost: string
}

export default function SkillsTab() {
  const { t, i18n } = useTranslation()
  const [cvText, setCvText] = useState('')
  const [dreamJob, setDreamJob] = useState('')
  const [showResults, setShowResults] = useState(false)

  const analyze = () => {
    if (!cvText.trim() || !dreamJob.trim()) return
    setShowResults(true)
  }

  // Translated mock skills
  const skills = useMemo((): Skill[] => [
    { name: i18n.language === 'en' ? 'Project Management' : 'Projektledning', current: 3, target: 5, gap: 'medium' },
    { name: i18n.language === 'en' ? 'Agile Methods' : 'Agila metoder', current: 2, target: 4, gap: 'medium' },
    { name: i18n.language === 'en' ? 'Communication' : 'Kommunikation', current: 4, target: 5, gap: 'small' },
    { name: i18n.language === 'en' ? 'Data Analysis' : 'Dataanalys', current: 1, target: 3, gap: 'large' },
  ], [i18n.language])

  // Translated mock courses
  const courses = useMemo((): Course[] => [
    {
      title: i18n.language === 'en' ? 'Certified Project Manager' : 'Certifierad Projektledare',
      provider: 'Komvux',
      duration: i18n.language === 'en' ? '6 months' : '6 månader',
      type: i18n.language === 'en' ? 'classroom' : 'classroom',
      cost: i18n.language === 'en' ? 'Free' : 'Gratis'
    },
    {
      title: i18n.language === 'en' ? 'Agile Project Management' : 'Agil Projektledning',
      provider: 'LinkedIn Learning',
      duration: i18n.language === 'en' ? '20 hours' : '20 timmar',
      type: 'online',
      cost: i18n.language === 'en' ? 'Included in Premium' : 'Ingår i Premium'
    },
    {
      title: i18n.language === 'en' ? 'Data Analysis for Beginners' : 'Dataanalys för nybörjare',
      provider: 'Coursera',
      duration: i18n.language === 'en' ? '8 weeks' : '8 veckor',
      type: 'online',
      cost: i18n.language === 'en' ? 'Free to audit' : 'Gratis att granska'
    },
  ], [i18n.language])

  const getGapColor = (gap: string) => {
    switch (gap) {
      case 'none': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
      case 'small': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30'
      case 'medium': return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30'
      case 'large': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
      default: return 'text-gray-600 dark:text-gray-400 bg-stone-100 dark:bg-stone-700'
    }
  }

  if (!showResults) {
    return (
      <div className="space-y-6">
        <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('career.skills.skillsGapAnalysis')}</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              {t('career.skills.compareSkills')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <CheckCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                {t('career.skills.yourProfile')}
              </label>
              <textarea
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                placeholder={t('career.skills.profilePlaceholder')}
                rows={8}
                className="w-full px-4 py-3 rounded-lg border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-800 resize-y text-gray-800 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Search className="w-4 h-4 text-teal-500 dark:text-teal-400" />
                {t('career.skills.dreamJob')}
              </label>
              <textarea
                value={dreamJob}
                onChange={(e) => setDreamJob(e.target.value)}
                placeholder={t('career.skills.dreamJobPlaceholder')}
                rows={8}
                className="w-full px-4 py-3 rounded-lg border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-800 resize-y text-gray-800 dark:text-gray-100"
              />
            </div>
          </div>

          <Button
            onClick={analyze}
            disabled={!cvText.trim() || !dreamJob.trim()}
            className="w-full mt-6"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {t('career.skills.analyzeGap')}
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('career.skills.analysisResults')}</h3>
            <p className="text-gray-600 dark:text-gray-300">{t('career.skills.matching')}: 65%</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-400 dark:to-teal-500 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">65%</span>
          </div>
        </div>

        <div className="h-3 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-gradient-to-r from-teal-500 to-teal-600 dark:from-teal-400 dark:to-teal-500" style={{ width: '65%' }} />
        </div>

        <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            {t('career.skills.goodFoundation')}
          </p>
        </div>
      </Card>

      {/* Skills Gap */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('career.skills.skillsComparison')}</h3>
        <div className="space-y-4">
          {skills.map((skill) => (
            <div key={skill.name} className="p-4 rounded-xl bg-stone-50 dark:bg-stone-700">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-800 dark:text-gray-100">{skill.name}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${getGapColor(skill.gap)}`}>
                  {t('career.skills.gap')}: {skill.target - skill.current} {t('career.skills.levels')}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 mb-1">
                    <span>{t('career.skills.current')}: {skill.current}/5</span>
                    <span>{t('career.skills.target')}: {skill.target}/5</span>
                  </div>
                  <div className="h-2 bg-stone-200 dark:bg-stone-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 dark:bg-teal-400 rounded-full"
                      style={{ width: `${(skill.current / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Course Recommendations */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          {t('career.skills.recommendedCourses')}
        </h3>
        <div className="space-y-3">
          {courses.map((course, index) => (
            <div key={index} className="flex items-center justify-between p-4 rounded-xl border border-stone-200 dark:border-stone-600 hover:border-teal-300 dark:hover:border-teal-600 transition-colors bg-white dark:bg-stone-700">
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-100">{course.title}</h4>
                <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 mt-1">
                  <span>{course.provider}</span>
                  <span>-</span>
                  <span>{course.duration}</span>
                  <span>-</span>
                  <span className="capitalize">{course.type}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-green-600 dark:text-green-400">{course.cost}</span>
                <Button size="sm" variant="outline" className="mt-1 block">
                  {t('common.learnMore')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Action Plan */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          {t('career.skills.yourActionPlan')}
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-700">
            <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400">1</span>
            </div>
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-100">
                {i18n.language === 'en' ? 'Prioritize project management' : 'Prioritera projektledning'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {i18n.language === 'en' ? 'Start certification within 2 weeks' : 'Påbörja certifiering inom 2 veckor'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-700">
            <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400">2</span>
            </div>
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-100">
                {i18n.language === 'en' ? 'Learn agile methods' : 'Lär dig agila metoder'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {i18n.language === 'en' ? 'Online course, 20 hours' : 'Online-kurs, 20 timmar'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-700">
            <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400">3</span>
            </div>
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-100">
                {i18n.language === 'en' ? 'Build portfolio' : 'Bygg portfolio'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {i18n.language === 'en' ? 'Showcase your new skills' : 'Visa upp dina nya kompetenser'}
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={() => setShowResults(false)}
        >
          {t('career.skills.newAnalysis')}
        </Button>
      </Card>
    </div>
  )
}
