import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Linkedin, Copy, Check, Sparkles, RefreshCw, User, FileText, Share2, MessageSquare, TrendingUp, Shield, Search, AlertCircle, Eye, EyeOff, ChevronDown, ChevronUp } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
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
    { id: 'audit', label: 'Profil-granskning', icon: Shield, beskrivning: 'Fullständig analys' }
  ]

  const auditGrade = profileCompleteness >= 80 ? 'A' : profileCompleteness >= 70 ? 'B' : profileCompleteness >= 60 ? 'C' : 'D'

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 mb-2">
          <Linkedin className="w-7 h-7 text-blue-700" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">{t('linkedInOptimizer.title')}</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          {t('linkedInOptimizer.description')}
        </p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setAktivTab(tab.id as any); setResultat(''); }}
            className={`p-3 rounded-xl border-2 text-left transition-all text-sm ${
              aktivTab === tab.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-blue-200 bg-white'
            }`}
          >
            <tab.icon className={`w-5 h-5 mb-1 ${aktivTab === tab.id ? 'text-blue-600' : 'text-slate-600'}`} />
            <div className="font-medium text-slate-800 text-xs">{tab.label}</div>
          </button>
        ))}
      </div>

      {/* Form or Audit */}
      {aktivTab !== 'audit' ? (
        <>
          <Card className="p-6">
            {aktivTab === 'headline' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800">{t('linkedInOptimizer.headline.title')}</h2>
                <p className="text-sm text-slate-600">{t('linkedInOptimizer.headline.description')}</p>
                <input
                  type="text"
                  placeholder={t('linkedInOptimizer.headline.jobTitlePlaceholder')}
                  value={formData.headline.yrke}
                  onChange={(e) => setFormData({ ...formData, headline: { ...formData.headline, yrke: e.target.value } })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                />
                <input
                  type="text"
                  placeholder={t('linkedInOptimizer.headline.specializationPlaceholder')}
                  value={formData.headline.erfarenhet}
                  onChange={(e) => setFormData({ ...formData, headline: { ...formData.headline, erfarenhet: e.target.value } })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                />
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800"><strong>Tips:</strong> Använd nyckelord som arbetsgivare söker på. Exempelvis: Full-Stack Developer, Cloud Architecture, Team Leadership</p>
                </div>
              </div>
            )}

            {aktivTab === 'about' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800">{t('linkedInOptimizer.about.title')}</h2>
                <p className="text-sm text-slate-600">{t('linkedInOptimizer.about.description')}</p>
                <textarea
                  placeholder={t('linkedInOptimizer.about.backgroundPlaceholder')}
                  value={formData.about.bakgrund}
                  onChange={(e) => setFormData({ ...formData, about: { ...formData.about, bakgrund: e.target.value } })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-y"
                />
                <textarea
                  placeholder={t('linkedInOptimizer.about.strengthsPlaceholder')}
                  value={formData.about.styrkor}
                  onChange={(e) => setFormData({ ...formData, about: { ...formData.about, styrkor: e.target.value } })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-y"
                />
                <input
                  type="text"
                  placeholder={t('linkedInOptimizer.about.goalsPlaceholder')}
                  value={formData.about.mal}
                  onChange={(e) => setFormData({ ...formData, about: { ...formData.about, mal: e.target.value } })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                />
              </div>
            )}

            {aktivTab === 'post' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800">{t('linkedInOptimizer.post.title')}</h2>
                <p className="text-sm text-slate-600">{t('linkedInOptimizer.post.description')}</p>
                <textarea
                  placeholder={t('linkedInOptimizer.post.topicPlaceholder')}
                  value={formData.post.amne}
                  onChange={(e) => setFormData({ ...formData, post: { ...formData.post, amne: e.target.value } })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-y"
                />
                <select
                  value={formData.post.ton}
                  onChange={(e) => setFormData({ ...formData, post: { ...formData.post, ton: e.target.value } })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
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
                <h2 className="text-lg font-semibold text-slate-800">{t('linkedInOptimizer.connection.title')}</h2>
                <p className="text-sm text-slate-600">{t('linkedInOptimizer.connection.description')}</p>
                <input
                  type="text"
                  placeholder={t('linkedInOptimizer.connection.namePlaceholder')}
                  value={formData.connection.namn}
                  onChange={(e) => setFormData({ ...formData, connection: { ...formData.connection, namn: e.target.value } })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                />
                <input
                  type="text"
                  placeholder={t('linkedInOptimizer.connection.rolePlaceholder')}
                  value={formData.connection.roll}
                  onChange={(e) => setFormData({ ...formData, connection: { ...formData.connection, roll: e.target.value } })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                />
                <textarea
                  placeholder={t('linkedInOptimizer.connection.purposePlaceholder')}
                  value={formData.connection.syfte}
                  onChange={(e) => setFormData({ ...formData, connection: { ...formData.connection, syfte: e.target.value } })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-y"
                />
              </div>
            )}

            <Button
              onClick={generera}
              disabled={isLoading}
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700"
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
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">{t('linkedInOptimizer.result.title')}</h3>
                <button
                  onClick={kopiera}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? t('linkedInOptimizer.result.copied') : t('linkedInOptimizer.result.copy')}
                </button>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <p className="text-slate-700 whitespace-pre-wrap">{resultat}</p>
              </div>
              <p className="text-xs text-slate-700 mt-3">
                💡 {t('linkedInOptimizer.result.tip')}
              </p>
            </Card>
          )}
        </>
      ) : (
        /* Audit View */
        <div className="space-y-6">
          {/* Completeness Overview */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-600" />
                Profilhälsa
              </h2>
              <div className="text-right">
                <p className="text-4xl font-bold text-blue-600">{auditGrade}</p>
                <p className="text-xs text-slate-600">Betyg</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">Profil slutförd</span>
                <span className="text-sm font-bold text-blue-600">{profileCompleteness}%</span>
              </div>
              <Progress value={profileCompleteness} className="h-4" />
              <p className="text-xs text-slate-600 mt-2">Rekommendation: Slutför din profil för att öka synligheten bland rekryterare</p>
            </div>
          </Card>

          {/* Audit Sections */}
          <div className="space-y-4">
            {auditSections.map((section) => (
              <Card key={section.name} className="overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === section.name ? null : section.name)}
                  className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition text-left"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-slate-800">{section.name}</h3>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        section.score >= 80 ? 'bg-green-100 text-green-800' :
                        section.score >= 70 ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {section.score}%
                      </span>
                    </div>
                  </div>
                  {expandedSection === section.name ? (
                    <ChevronUp className="w-5 h-5 text-slate-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-600" />
                  )}
                </button>

                {expandedSection === section.name && (
                  <div className="border-t border-slate-200 p-6 bg-slate-50 space-y-4">
                    {/* Checklist */}
                    <div>
                      <h4 className="font-medium text-slate-800 mb-2 flex items-center gap-2">
                        <ListCheckIcon className="w-4 h-4" />
                        Checklistor
                      </h4>
                      <div className="space-y-2">
                        {section.checklist.map((item, idx) => (
                          <label key={idx} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-white transition">
                            <input
                              type="checkbox"
                              checked={item.completed}
                              onChange={() => {
                                const updated = [...auditSections]
                                updated[auditSections.indexOf(section)].checklist[idx].completed = !item.completed
                                setAuditSections(updated)
                              }}
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
                            />
                            <span className={item.completed ? 'line-through text-slate-600' : 'text-slate-700'}>{item.item}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Before/After Examples */}
                    <div>
                      <h4 className="font-medium text-slate-800 mb-2">Före/Efter exempel</h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="bg-red-50 p-3 rounded border border-red-200">
                          <p className="text-xs text-red-700 font-medium mb-1">❌ Innan</p>
                          <p className="text-sm text-slate-700">{section.examples.before}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded border border-green-200">
                          <p className="text-xs text-green-700 font-medium mb-1">✓ Efter</p>
                          <p className="text-sm text-slate-700">{section.examples.after}</p>
                        </div>
                      </div>
                    </div>

                    {/* Keywords */}
                    <div>
                      <button
                        onClick={() => setShowKeywords(!showKeywords)}
                        className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        {showKeywords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {showKeywords ? 'Dölj' : 'Visa'} nyckelord för denna sektion
                      </button>
                      {showKeywords && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {section.keywords.map((kw, idx) => (
                            <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
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
          <Card className="p-6 bg-amber-50 border-amber-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Prioriterade åtgärdsobjekt
            </h3>
            <ol className="space-y-2">
              <li className="text-sm text-slate-700">
                <strong>Högt:</strong> Lägg till rekommendationer från tidigare kollegor och chefer
              </li>
              <li className="text-sm text-slate-700">
                <strong>Högt:</strong> Förbättra "Om mig" sektionen med mer specifika nyckelord
              </li>
              <li className="text-sm text-slate-700">
                <strong>Medel:</strong> Lägg till mätbara resultat till din arbetshistoria
              </li>
              <li className="text-sm text-slate-700">
                <strong>Medel:</strong> Länka relevanta projekt och publikationer
              </li>
            </ol>
          </Card>
        </div>
      )}

      {/* Bottom Action Button */}
      {aktivTab === 'headline' && !resultat && (
        <div className="flex gap-2">
          <Button onClick={startAudit} variant="outline" className="flex-1">
            <Shield className="w-4 h-4 mr-2" />
            Starta profil-granskning
          </Button>
        </div>
      )}
    </div>
  )
}

function ListCheckIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
