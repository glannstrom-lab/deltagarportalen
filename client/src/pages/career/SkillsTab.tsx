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
      case 'none': return 'text-green-600 bg-green-100'
      case 'small': return 'text-yellow-600 bg-yellow-100'
      case 'medium': return 'text-orange-600 bg-orange-100'
      case 'large': return 'text-red-600 bg-red-100'
      default: return 'text-slate-600 bg-slate-100'
    }
  }

  if (!showResults) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">{t('career.skills.skillsGapAnalysis')}</h3>
            <p className="text-slate-600 mt-2">
              {t('career.skills.compareSkills')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <CheckCircle className="w-4 h-4 text-slate-600" />
                {t('career.skills.yourProfile')}
              </label>
              <textarea
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                placeholder={t('career.skills.profilePlaceholder')}
                rows={8}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 resize-y"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Search className="w-4 h-4 text-purple-500" />
                {t('career.skills.dreamJob')}
              </label>
              <textarea
                value={dreamJob}
                onChange={(e) => setDreamJob(e.target.value)}
                placeholder={t('career.skills.dreamJobPlaceholder')}
                rows={8}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 resize-y"
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
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">{t('career.skills.analysisResults')}</h3>
            <p className="text-slate-600">{t('career.skills.matching')}: 65%</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">65%</span>
          </div>
        </div>

        <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: '65%' }} />
        </div>

        <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            {t('career.skills.goodFoundation')}
          </p>
        </div>
      </Card>

      {/* Skills Gap */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('career.skills.skillsComparison')}</h3>
        <div className="space-y-4">
          {skills.map((skill) => (
            <div key={skill.name} className="p-4 rounded-xl bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-slate-800">{skill.name}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${getGapColor(skill.gap)}`}>
                  {t('career.skills.gap')}: {skill.target - skill.current} {t('career.skills.levels')}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm text-slate-700 mb-1">
                    <span>{t('career.skills.current')}: {skill.current}/5</span>
                    <span>{t('career.skills.target')}: {skill.target}/5</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
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
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-600" />
          {t('career.skills.recommendedCourses')}
        </h3>
        <div className="space-y-3">
          {courses.map((course, index) => (
            <div key={index} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-purple-300 transition-colors">
              <div>
                <h4 className="font-semibold text-slate-800">{course.title}</h4>
                <div className="flex items-center gap-3 text-sm text-slate-700 mt-1">
                  <span>{course.provider}</span>
                  <span>•</span>
                  <span>{course.duration}</span>
                  <span>•</span>
                  <span className="capitalize">{course.type}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-green-600">{course.cost}</span>
                <Button size="sm" variant="outline" className="mt-1 block">
                  {t('common.learnMore')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Action Plan */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          {t('career.skills.yourActionPlan')}
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-purple-600">1</span>
            </div>
            <div>
              <p className="font-medium text-slate-800">
                {i18n.language === 'en' ? 'Prioritize project management' : 'Prioritera projektledning'}
              </p>
              <p className="text-sm text-slate-600">
                {i18n.language === 'en' ? 'Start certification within 2 weeks' : 'Påbörja certifiering inom 2 veckor'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-purple-600">2</span>
            </div>
            <div>
              <p className="font-medium text-slate-800">
                {i18n.language === 'en' ? 'Learn agile methods' : 'Lär dig agila metoder'}
              </p>
              <p className="text-sm text-slate-600">
                {i18n.language === 'en' ? 'Online course, 20 hours' : 'Online-kurs, 20 timmar'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-purple-600">3</span>
            </div>
            <div>
              <p className="font-medium text-slate-800">
                {i18n.language === 'en' ? 'Build portfolio' : 'Bygg portfolio'}
              </p>
              <p className="text-sm text-slate-600">
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
