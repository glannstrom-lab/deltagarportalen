import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Linkedin, Copy, Check, Sparkles, RefreshCw, User, FileText, Share2, MessageSquare, TrendingUp, Shield, Search, AlertCircle, Eye, EyeOff, ChevronDown, ChevronUp } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { PageLayout } from '@/components/layout/PageLayout'
import { callAI } from '@/services/aiApi'

interface SectionAudit {
  name: string
  score: number
  checklist: { item: string; completed: boolean }[]
  examples: { before: string; after: string }
  keywords: string[]
}

export default function LinkedInOptimizer() {
  const { t } = useTranslation()
  const [aktivTab, setAktivTab] = useState<'headline' | 'about' | 'post' | 'connection' | 'audit'>('headline')
  const [formData, setFormData] = useState({
    headline: { yrke: '', erfarenhet: '' },
    about: { bakgrund: '', styrkor: '', mal: '' },
    post: { amne: '', ton: 'professionell' },
    connection: { namn: '', roll: '', syfte: '' }
  })
  const [resultat, setResultat] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [profileCompleteness, setProfileCompleteness] = useState(0)
  const [auditSections, setAuditSections] = useState<SectionAudit[]>([])
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [showKeywords, setShowKeywords] = useState(false)

  const generera = async () => {
    if (aktivTab === 'audit') return // audit doesn't use the generera function
    setIsLoading(true)
    try {
      const data = await callAI<{ text: string }>('linkedin-optimering', {
        typ: aktivTab,
        data: formData[aktivTab as keyof typeof formData]
      })
      setResultat((data as { text?: string }).text || '')
    } catch (error) {
      const fallbacks: Record<string, string> = {
        headline: `${formData.headline.yrke} | Erfaren specialist inom ${formData.headline.erfarenhet || 'branschen'}`,
        about: `Jag är en driven ${formData.about.bakgrund} med passion för ${formData.about.styrkor}. ${formData.about.mal}`,
        post: `Idag vill jag dela med mig av mina tankar om ${formData.post.amne}. Vad tycker ni?`,
        connection: `Hej ${formData.connection.namn}! Jag såg att du arbetar som ${formData.connection.roll} och skulle gärna vilja connecta. ${formData.connection.syfte}`
      }
      setResultat(fallbacks[aktivTab] || t('linkedInOptimizer.errors.generateFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const startAudit = () => {
    const sections: SectionAudit[] = [
      {
        name: 'Rubrik (Headline)',
        score: 85,
        checklist: [
          { item: 'Innehåller jobbroll', completed: true },
          { item: 'Innehåller nyckelkompetenser', completed: false },
          { item: 'Använder relevanta nyckelord', completed: true },
          { item: 'Under 220 tecken', completed: true }
        ],
        examples: {
          before: 'Senior Developer',
          after: 'Senior Full-Stack Developer | React, Node.js & Cloud Solutions | Building scalable digital products'
        },
        keywords: ['Full-Stack', 'React', 'Node.js', 'Cloud', 'AWS', 'Leadership']
      },
      {
        name: 'Om mig (About Section)',
        score: 72,
        checklist: [
          { item: 'Startar med en hook/engagament', completed: false },
          { item: 'Visar unika värderingar', completed: true },
          { item: 'Inkluderar call-to-action', completed: false },
          { item: 'Personlig men professionell ton', completed: true }
        ],
        examples: {
          before: 'Developer with 5 years experience',
          after: 'Passionate about building solutions that make a difference. 5+ years scaling products, leading teams, and mentoring junior developers.'
        },
        keywords: ['Leadership', 'Innovation', 'Collaboration', 'Problem-solving', 'Mentoring']
      },
      {
        name: 'Erfarenhet (Experience)',
        score: 68,
        checklist: [
          { item: 'Använder STAR-metoden i beskrivningar', completed: false },
          { item: 'Visar mätbara resultat', completed: true },
          { item: 'Inkluderar relevanta nyckelord', completed: true },
          { item: 'Länkat till projekt/portfolio', completed: false }
        ],
        examples: {
          before: 'Worked on web development projects',
          after: 'Led development of e-commerce platform serving 100K+ users, increasing conversion by 34%. Implemented microservices architecture reducing load time by 60%.'
        },
        keywords: ['Leadership', 'Performance', 'Scalability', 'Team Management', 'Innovation']
      },
      {
        name: 'Rekommendationer & Endorsements',
        score: 45,
        checklist: [
          { item: 'Minst 3 rekommendationer', completed: false },
          { item: 'Diverse rekommendatörer', completed: false },
          { item: 'Relevanta färdigheter endorsade', completed: true }
        ],
        examples: {
          before: 'No recommendations',
          after: 'Rekommenderad av managers, kollegor och klienter för leadership och technical excellence'
        },
        keywords: ['Technical Skills', 'Leadership', 'Communication', 'Reliability']
      }
    ]

    setAuditSections(sections)
    setProfileCompleteness(67)
    setAktivTab('audit')
  }

  const kopiera = () => {
    navigator.clipboard.writeText(resultat)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tabs = [
    { id: 'headline', label: t('linkedInOptimizer.tabs.headline.label'), icon: User, beskrivning: t('linkedInOptimizer.tabs.headline.description') },
    { id: 'about', label: t('linkedInOptimizer.tabs.about.label'), icon: FileText, beskrivning: t('linkedInOptimizer.tabs.about.description') },
    { id: 'post', label: t('linkedInOptimizer.tabs.post.label'), icon: Share2, beskrivning: t('linkedInOptimizer.tabs.post.description') },
    { id: 'connection', label: t('linkedInOptimizer.tabs.connection.label'), icon: MessageSquare, beskrivning: t('linkedInOptimizer.tabs.connection.description') },
    { id: 'audit', label: t('linkedInOptimizer.tabs.audit.label'), icon: Shield, beskrivning: t('linkedInOptimizer.tabs.audit.description') }
  ]

  const auditGrade = profileCompleteness >= 80 ? 'A' : profileCompleteness >= 70 ? 'B' : profileCompleteness >= 60 ? 'C' : 'D'

  return (
    <PageLayout
      title={t('linkedInOptimizer.title')}
      subtitle={t('linkedInOptimizer.description')}
      domain="activity"
      showTabs={false}
      className="max-w-7xl mx-auto"
      contentClassName="space-y-6"
    >
      {/* Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setAktivTab(tab.id as any); setResultat(''); }}
            className={`p-3 rounded-xl border-2 text-left transition-all text-sm ${
              aktivTab === tab.id
                ? 'border-[var(--c-solid)] dark:border-[var(--c-solid)]/60 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/20'
                : 'border-stone-200 dark:border-stone-700 hover:border-[var(--c-accent)]/60 dark:hover:border-[var(--c-accent)]/60 bg-white dark:bg-stone-800'
            }`}
          >
            <tab.icon className={`w-5 h-5 mb-1 ${aktivTab === tab.id ? 'text-[var(--c-text)] dark:text-[var(--c-solid)]' : 'text-stone-600 dark:text-stone-400'}`} />
            <div className="font-medium text-stone-800 dark:text-stone-200 text-xs">{tab.label}</div>
          </button>
        ))}
      </div>

      {/* Form or Audit */}
      {aktivTab !== 'audit' ? (
        <>
          <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
            {aktivTab === 'headline' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">{t('linkedInOptimizer.headline.title')}</h2>
                <p className="text-sm text-stone-600 dark:text-stone-400">{t('linkedInOptimizer.headline.description')}</p>
                <input
                  type="text"
                  placeholder={t('linkedInOptimizer.headline.jobTitlePlaceholder')}
                  value={formData.headline.yrke}
                  onChange={(e) => setFormData({ ...formData, headline: { ...formData.headline, yrke: e.target.value } })}
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-600 focus:border-[var(--c-solid)] dark:focus:border-[var(--c-solid)] focus:ring-2 focus:ring-[var(--c-accent)] dark:focus:ring-[var(--c-solid)] outline-none bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                />
                <input
                  type="text"
                  placeholder={t('linkedInOptimizer.headline.specializationPlaceholder')}
                  value={formData.headline.erfarenhet}
                  onChange={(e) => setFormData({ ...formData, headline: { ...formData.headline, erfarenhet: e.target.value } })}
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-600 focus:border-[var(--c-solid)] dark:focus:border-[var(--c-solid)] focus:ring-2 focus:ring-[var(--c-accent)] dark:focus:ring-[var(--c-solid)] outline-none bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                />
                <div className="bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 p-4 rounded-lg border border-[var(--c-accent)] dark:border-[var(--c-accent)]/50">
                  <p className="text-sm text-[var(--c-text)] dark:text-[var(--c-text)]"><strong>{t('linkedInOptimizer.headline.tipLabel')}:</strong> {t('linkedInOptimizer.headline.tipText')}</p>
                </div>
              </div>
            )}

            {aktivTab === 'about' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">{t('linkedInOptimizer.about.title')}</h2>
                <p className="text-sm text-stone-600 dark:text-stone-400">{t('linkedInOptimizer.about.description')}</p>
                <textarea
                  placeholder={t('linkedInOptimizer.about.backgroundPlaceholder')}
                  value={formData.about.bakgrund}
                  onChange={(e) => setFormData({ ...formData, about: { ...formData.about, bakgrund: e.target.value } })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-600 focus:border-[var(--c-solid)] dark:focus:border-[var(--c-solid)] focus:ring-2 focus:ring-[var(--c-accent)] dark:focus:ring-[var(--c-solid)] outline-none resize-y bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                />
                <textarea
                  placeholder={t('linkedInOptimizer.about.strengthsPlaceholder')}
                  value={formData.about.styrkor}
                  onChange={(e) => setFormData({ ...formData, about: { ...formData.about, styrkor: e.target.value } })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-600 focus:border-[var(--c-solid)] dark:focus:border-[var(--c-solid)] focus:ring-2 focus:ring-[var(--c-accent)] dark:focus:ring-[var(--c-solid)] outline-none resize-y bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                />
                <input
                  type="text"
                  placeholder={t('linkedInOptimizer.about.goalsPlaceholder')}
                  value={formData.about.mal}
                  onChange={(e) => setFormData({ ...formData, about: { ...formData.about, mal: e.target.value } })}
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-600 focus:border-[var(--c-solid)] dark:focus:border-[var(--c-solid)] focus:ring-2 focus:ring-[var(--c-accent)] dark:focus:ring-[var(--c-solid)] outline-none bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>
            )}

            {aktivTab === 'post' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">{t('linkedInOptimizer.post.title')}</h2>
                <p className="text-sm text-stone-600 dark:text-stone-400">{t('linkedInOptimizer.post.description')}</p>
                <textarea
                  placeholder={t('linkedInOptimizer.post.topicPlaceholder')}
                  value={formData.post.amne}
                  onChange={(e) => setFormData({ ...formData, post: { ...formData.post, amne: e.target.value } })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-600 focus:border-[var(--c-solid)] dark:focus:border-[var(--c-solid)] focus:ring-2 focus:ring-[var(--c-accent)] dark:focus:ring-[var(--c-solid)] outline-none resize-y bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                />
                <select
                  value={formData.post.ton}
                  onChange={(e) => setFormData({ ...formData, post: { ...formData.post, ton: e.target.value } })}
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-600 focus:border-[var(--c-solid)] dark:focus:border-[var(--c-solid)] focus:ring-2 focus:ring-[var(--c-accent)] dark:focus:ring-[var(--c-solid)] outline-none bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                >
                  <option value="professionell">{t('linkedInOptimizer.post.tones.professional')}</option>
                  <option value="personlig">{t('linkedInOptimizer.post.tones.personal')}</option>
                  <option value="entusiastisk">{t('linkedInOptimizer.post.tones.enthusiastic')}</option>
                  <option value="formell">{t('linkedInOptimizer.post.tones.formal')}</option>
                </select>
              </div>
            )}

            {aktivTab === 'connection' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">{t('linkedInOptimizer.connection.title')}</h2>
                <p className="text-sm text-stone-600 dark:text-stone-400">{t('linkedInOptimizer.connection.description')}</p>
                <input
                  type="text"
                  placeholder={t('linkedInOptimizer.connection.namePlaceholder')}
                  value={formData.connection.namn}
                  onChange={(e) => setFormData({ ...formData, connection: { ...formData.connection, namn: e.target.value } })}
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-600 focus:border-[var(--c-solid)] dark:focus:border-[var(--c-solid)] focus:ring-2 focus:ring-[var(--c-accent)] dark:focus:ring-[var(--c-solid)] outline-none bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                />
                <input
                  type="text"
                  placeholder={t('linkedInOptimizer.connection.rolePlaceholder')}
                  value={formData.connection.roll}
                  onChange={(e) => setFormData({ ...formData, connection: { ...formData.connection, roll: e.target.value } })}
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-600 focus:border-[var(--c-solid)] dark:focus:border-[var(--c-solid)] focus:ring-2 focus:ring-[var(--c-accent)] dark:focus:ring-[var(--c-solid)] outline-none bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                />
                <textarea
                  placeholder={t('linkedInOptimizer.connection.purposePlaceholder')}
                  value={formData.connection.syfte}
                  onChange={(e) => setFormData({ ...formData, connection: { ...formData.connection, syfte: e.target.value } })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-600 focus:border-[var(--c-solid)] dark:focus:border-[var(--c-solid)] focus:ring-2 focus:ring-[var(--c-accent)] dark:focus:ring-[var(--c-solid)] outline-none resize-y bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>
            )}

            <Button
              onClick={generera}
              disabled={isLoading}
              className="w-full mt-6 bg-[var(--c-solid)] hover:bg-[var(--c-solid)] dark:bg-[var(--c-solid)] dark:hover:bg-[var(--c-solid)]"
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  {t('linkedInOptimizer.generate')}
                </>
              )}
            </Button>
          </Card>

          {/* Resultat */}
          {resultat && (
            <Card className="p-6 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border-[var(--c-accent)] dark:border-[var(--c-accent)]/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-stone-800 dark:text-stone-100">{t('linkedInOptimizer.result.title')}</h3>
                <button
                  onClick={kopiera}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--c-text)] dark:text-[var(--c-solid)] hover:bg-[var(--c-accent)]/40 dark:hover:bg-[var(--c-bg)]/40 rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? t('linkedInOptimizer.result.copied') : t('linkedInOptimizer.result.copy')}
                </button>
              </div>
              <div className="bg-white dark:bg-stone-800 p-4 rounded-lg border border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/40">
                <p className="text-stone-700 dark:text-stone-300 whitespace-pre-wrap">{resultat}</p>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-3">
                {t('linkedInOptimizer.result.tip')}
              </p>
            </Card>
          )}
        </>
      ) : (
        /* Audit View */
        <div className="space-y-6">
          {/* Completeness Overview */}
          <Card className="p-6 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border-[var(--c-accent)] dark:border-[var(--c-accent)]/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                <Shield className="w-6 h-6 text-[var(--c-text)] dark:text-[var(--c-solid)]" />
                {t('linkedInOptimizer.audit.profileHealth')}
              </h2>
              <div className="text-right">
                <p className="text-4xl font-bold text-[var(--c-text)] dark:text-[var(--c-solid)]">{auditGrade}</p>
                <p className="text-xs text-stone-600 dark:text-stone-400">{t('linkedInOptimizer.audit.grade')}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{t('linkedInOptimizer.audit.profileCompleted')}</span>
                <span className="text-sm font-bold text-[var(--c-text)] dark:text-[var(--c-solid)]">{profileCompleteness}%</span>
              </div>
              <Progress value={profileCompleteness} className="h-4" />
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-2">{t('linkedInOptimizer.audit.recommendation')}</p>
            </div>
          </Card>

          {/* Audit Sections */}
          <div className="space-y-4">
            {auditSections.map((section) => (
              <Card key={section.name} className="overflow-hidden bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
                <button
                  onClick={() => setExpandedSection(expandedSection === section.name ? null : section.name)}
                  className="w-full p-6 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-700 transition text-left"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-stone-800 dark:text-stone-100">{section.name}</h3>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        section.score >= 80 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        section.score >= 70 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {section.score}%
                      </span>
                    </div>
                  </div>
                  {expandedSection === section.name ? (
                    <ChevronUp className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                  )}
                </button>

                {expandedSection === section.name && (
                  <div className="border-t border-stone-200 dark:border-stone-700 p-6 bg-stone-50 dark:bg-stone-900/50 space-y-4">
                    {/* Checklist */}
                    <div>
                      <h4 className="font-medium text-stone-800 dark:text-stone-100 mb-2 flex items-center gap-2">
                        <ListCheckIcon className="w-4 h-4" />
                        {t('linkedInOptimizer.audit.checklists')}
                      </h4>
                      <div className="space-y-2">
                        {section.checklist.map((item, idx) => (
                          <label key={idx} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-white dark:hover:bg-stone-800 transition">
                            <input
                              type="checkbox"
                              checked={item.completed}
                              onChange={() => {
                                const updated = [...auditSections]
                                updated[auditSections.indexOf(section)].checklist[idx].completed = !item.completed
                                setAuditSections(updated)
                              }}
                              className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-[var(--c-text)] cursor-pointer"
                            />
                            <span className={item.completed ? 'line-through text-stone-500 dark:text-stone-500' : 'text-stone-700 dark:text-stone-300'}>{item.item}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Before/After Examples */}
                    <div>
                      <h4 className="font-medium text-stone-800 dark:text-stone-100 mb-2">{t('linkedInOptimizer.audit.beforeAfterExamples')}</h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800">
                          <p className="text-xs text-red-700 dark:text-red-400 font-medium mb-1">{t('linkedInOptimizer.audit.before')}</p>
                          <p className="text-sm text-stone-700 dark:text-stone-300">{section.examples.before}</p>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded border border-emerald-200 dark:border-emerald-800">
                          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mb-1">{t('linkedInOptimizer.audit.after')}</p>
                          <p className="text-sm text-stone-700 dark:text-stone-300">{section.examples.after}</p>
                        </div>
                      </div>
                    </div>

                    {/* Keywords */}
                    <div>
                      <button
                        onClick={() => setShowKeywords(!showKeywords)}
                        className="flex items-center gap-2 text-sm font-medium text-[var(--c-text)] dark:text-[var(--c-solid)] hover:text-[var(--c-text)] dark:hover:text-[var(--c-accent)]"
                      >
                        {showKeywords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {showKeywords ? t('linkedInOptimizer.audit.hideKeywords') : t('linkedInOptimizer.audit.showKeywords')}
                      </button>
                      {showKeywords && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {section.keywords.map((kw, idx) => (
                            <span key={idx} className="text-xs bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/30 text-[var(--c-text)] dark:text-[var(--c-solid)] px-2 py-1 rounded-full">
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Action Items */}
          <Card className="p-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <h3 className="font-bold text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              {t('linkedInOptimizer.audit.priorityActions')}
            </h3>
            <ol className="space-y-2">
              <li className="text-sm text-stone-700 dark:text-stone-300">
                <strong className="text-amber-700 dark:text-amber-400">{t('linkedInOptimizer.audit.high')}:</strong> {t('linkedInOptimizer.audit.action1')}
              </li>
              <li className="text-sm text-stone-700 dark:text-stone-300">
                <strong className="text-amber-700 dark:text-amber-400">{t('linkedInOptimizer.audit.high')}:</strong> {t('linkedInOptimizer.audit.action2')}
              </li>
              <li className="text-sm text-stone-700 dark:text-stone-300">
                <strong className="text-stone-600 dark:text-stone-400">{t('linkedInOptimizer.audit.medium')}:</strong> {t('linkedInOptimizer.audit.action3')}
              </li>
              <li className="text-sm text-stone-700 dark:text-stone-300">
                <strong className="text-stone-600 dark:text-stone-400">{t('linkedInOptimizer.audit.medium')}:</strong> {t('linkedInOptimizer.audit.action4')}
              </li>
            </ol>
          </Card>
        </div>
      )}

      {/* Bottom Action Button */}
      {aktivTab === 'headline' && !resultat && (
        <div className="flex gap-2">
          <Button onClick={startAudit} variant="outline" className="flex-1 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800">
            <Shield className="w-4 h-4 mr-2" />
            {t('linkedInOptimizer.audit.startAudit')}
          </Button>
        </div>
      )}
    </PageLayout>
  )
}

function ListCheckIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
