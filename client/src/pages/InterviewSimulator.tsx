import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageCircle, Send, User, Bot, RefreshCw, Mic, MicOff, ThumbsUp, ThumbsDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAchievementTracker } from '@/hooks/useAchievementTracker'

interface FragaSvar {
  fraga: string
  svar: string
  feedback?: string
}

export default function InterviewSimulator() {
  const { t } = useTranslation()
  const [roll, setRoll] = useState('')
  const [foretag, setForetag] = useState('')
  const [harStartat, setHarStartat] = useState(false)
  const [nuvarandeFraga, setNuvarandeFraga] = useState('')
  const [anvandarSvar, setAnvandarSvar] = useState('')
  const [historik, setHistorik] = useState<FragaSvar[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [antalFragor, setAntalFragor] = useState(0)
  const { trackInterviewCompleted } = useAchievementTracker()

  const startaIntervju = async () => {
    if (!roll.trim()) return
    setHarStartat(true)
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/intervju-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roll, foretag, tidigareFragor: [] })
      })

      if (!response.ok) throw new Error('AI error')
      const data = await response.json()
      setNuvarandeFraga(data.resultat)
    } catch (error) {
      const companyPart = foretag ? t('interviewSimulator.atCompany', { company: foretag }) : ''
      setNuvarandeFraga(t('interviewSimulator.welcomeMessage', { role: roll, company: companyPart }))
    } finally {
      setIsLoading(false)
    }
  }

  const svara = async () => {
    if (!anvandarSvar.trim() || isLoading) return

    setIsLoading(true)
    const nyFragaSvar: FragaSvar = {
      fraga: nuvarandeFraga,
      svar: anvandarSvar
    }

    try {
      const response = await fetch('/api/ai/intervju-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roll,
          foretag,
          anvandarSvar,
          tidigareFragor: [...historik, nyFragaSvar]
        })
      })

      if (!response.ok) throw new Error('AI error')
      const data = await response.json()

      setHistorik([...historik, { ...nyFragaSvar, feedback: t('interviewSimulator.goodAnswerNext') }])
      setNuvarandeFraga(data.resultat)
      setAnvandarSvar('')
      setAntalFragor(prev => prev + 1)
    } catch (error) {
      const fallbackFraga = antalFragor === 0
        ? t('interviewSimulator.fallbackQ1')
        : antalFragor === 1
        ? t('interviewSimulator.fallbackQ2')
        : t('interviewSimulator.fallbackQ3')

      setHistorik([...historik, nyFragaSvar])
      setNuvarandeFraga(fallbackFraga)
      setAnvandarSvar('')
      setAntalFragor(prev => prev + 1)
    } finally {
      setIsLoading(false)
    }
  }

  const avslutaIntervju = () => {
    // Track interview completion if at least 3 questions were answered
    if (antalFragor >= 3) {
      trackInterviewCompleted()
    }

    setHarStartat(false)
    setRoll('')
    setForetag('')
    setNuvarandeFraga('')
    setAnvandarSvar('')
    setHistorik([])
    setAntalFragor(0)
  }

  if (!harStartat) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-20">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 mb-2">
            <MessageCircle className="w-7 h-7 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">{t('interviewSimulator.title')}</h1>
          <p className="text-slate-600">
            {t('interviewSimulator.description')}
          </p>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('interviewSimulator.roleLabel')}</label>
              <input
                type="text"
                value={roll}
                onChange={(e) => setRoll(e.target.value)}
                placeholder={t('interviewSimulator.rolePlaceholder')}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('interviewSimulator.companyLabel')}</label>
              <input
                type="text"
                value={foretag}
                onChange={(e) => setForetag(e.target.value)}
                placeholder={t('interviewSimulator.companyPlaceholder')}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
              />
            </div>
            <Button
              onClick={startaIntervju}
              disabled={!roll.trim() || isLoading}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600"
            >
              {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : t('interviewSimulator.startInterview')}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t('interviewSimulator.interview')} {roll}</h1>
          <p className="text-sm text-slate-500">{foretag || t('interviewSimulator.genericPractice')}</p>
        </div>
        <Button variant="outline" onClick={avslutaIntervju}>
          {t('interviewSimulator.end')}
        </Button>
      </div>

      {/* Historik */}
      {historik.length > 0 && (
        <div className="space-y-4">
          {historik.map((fs, index) => (
            <Card key={index} className="p-4 bg-slate-50">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600 mb-1">{t('interviewSimulator.interviewer')}</p>
                    <p className="text-slate-800">{fs.fraga}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600 mb-1">{t('interviewSimulator.yourAnswer')}</p>
                    <p className="text-slate-800">{fs.svar}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Nuvarande fråga */}
      <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-700 mb-2">{t('interviewSimulator.interviewerAsks')}</p>
            <p className="text-lg text-slate-800">{nuvarandeFraga}</p>
          </div>
        </div>
      </Card>

      {/* Svarsfält */}
      <Card className="p-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <textarea
              value={anvandarSvar}
              onChange={(e) => setAnvandarSvar(e.target.value)}
              placeholder={t('interviewSimulator.writeAnswerHere')}
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none resize-y"
            />
            <div className="flex justify-end mt-3">
              <Button
                onClick={svara}
                disabled={!anvandarSvar.trim() || isLoading}
                className="bg-gradient-to-r from-amber-600 to-orange-600"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> {t('interviewSimulator.answer')}</>}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Tips */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <p className="text-sm text-blue-700">
          {t('interviewSimulator.tip')}
        </p>
      </div>
    </div>
  )
}
