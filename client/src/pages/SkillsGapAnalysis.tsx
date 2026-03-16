import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Target, Search, TrendingUp, AlertCircle, CheckCircle, BookOpen, Sparkles, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function SkillsGapAnalysis() {
  const { t } = useTranslation()
  const [cvText, setCvText] = useState('')
  const [dromjobb, setDromjobb] = useState('')
  const [analys, setAnalys] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const analysera = async () => {
    if (!cvText.trim() || !dromjobb.trim()) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/ai/kompetensgap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText, dromjobb })
      })
      
      if (!response.ok) throw new Error('AI error')
      const data = await response.json()
      setAnalys({ text: data.analys })
    } catch (error) {
      // Fallback
      setAnalys({
        text: `KOMPETENSGAP-ANALYS\n\nMATCHNING: Beräknas utifrån din bakgrund...\n\nSAKNADE KOMPETENSER:\n• Analysera jobbannonsen noggrant\n• Identifiera nyckelkompetenser\n• Jämför med din nuvarande profil\n\nREKOMMENDATIONER:\n1. Gå en certifiering inom området\n2. Bygg portfolio med exempelprojekt\n3. Nätverka med personer i branschen\n4. Sök mentorskap`
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 mb-2">
          <Target className="w-7 h-7 text-purple-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">{t('skillsGapAnalysis.title')}</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          {t('skillsGapAnalysis.description')}
        </p>
      </div>

      {/* Input */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-slate-600" />
            </div>
            <h2 className="font-semibold text-slate-800">{t('skillsGapAnalysis.currentProfile.title')}</h2>
          </div>
          <textarea
            value={cvText}
            onChange={(e) => setCvText(e.target.value)}
            placeholder={t('skillsGapAnalysis.currentProfile.placeholder')}
            rows={10}
            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none resize-y"
          />
          <p className="text-xs text-slate-500 mt-2">
            💡 {t('skillsGapAnalysis.currentProfile.tip')}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-semibold text-slate-800">{t('skillsGapAnalysis.dreamJob.title')}</h2>
          </div>
          <textarea
            value={dromjobb}
            onChange={(e) => setDromjobb(e.target.value)}
            placeholder={t('skillsGapAnalysis.dreamJob.placeholder')}
            rows={10}
            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none resize-y"
          />
          <p className="text-xs text-slate-500 mt-2">
            💡 {t('skillsGapAnalysis.dreamJob.tip')}
          </p>
        </Card>
      </div>

      {/* Analyze Button */}
      <div className="flex justify-center">
        <Button
          onClick={analysera}
          disabled={!cvText.trim() || !dromjobb.trim() || isLoading}
          className="px-8 py-4 text-lg bg-gradient-to-r from-purple-600 to-pink-600"
        >
          {isLoading ? (
            <RefreshCw className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-6 h-6 mr-2" />
              {t('skillsGapAnalysis.analyzeGap')}
            </>
          )}
        </Button>
      </div>

      {/* Resultat */}
      {analys && (
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            {t('skillsGapAnalysis.result.title')}
          </h2>
          <div className="bg-white p-6 rounded-lg border border-purple-100">
            <pre className="whitespace-pre-wrap text-slate-700 font-sans leading-relaxed">
              {analys.text}
            </pre>
          </div>

          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-purple-100">
              <BookOpen className="w-8 h-8 text-purple-500 mb-2" />
              <h3 className="font-semibold text-slate-800 mb-1">{t('skillsGapAnalysis.result.education.title')}</h3>
              <p className="text-sm text-slate-600">{t('skillsGapAnalysis.result.education.description')}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-purple-100">
              <TrendingUp className="w-8 h-8 text-pink-500 mb-2" />
              <h3 className="font-semibold text-slate-800 mb-1">{t('skillsGapAnalysis.result.experience.title')}</h3>
              <p className="text-sm text-slate-600">{t('skillsGapAnalysis.result.experience.description')}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-purple-100">
              <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
              <h3 className="font-semibold text-slate-800 mb-1">{t('skillsGapAnalysis.result.timeline.title')}</h3>
              <p className="text-sm text-slate-600">{t('skillsGapAnalysis.result.timeline.description')}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
