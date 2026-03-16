/**
 * Crisis Support Tab - Emergency help for mental health
 */
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Siren, Phone, MessageCircle, Heart, Wind, Eye, Ear, Hand,
  ExternalLink, AlertTriangle, ChevronRight, X
} from 'lucide-react'
import { Card, Button } from '@/components/ui'

// Contact definitions with i18n keys
const emergencyContactDefs = [
  { nameKey: 'wellness.crisis.contacts.1177.name', number: '1177', descKey: 'wellness.crisis.contacts.1177.description', color: 'bg-blue-500' },
  { nameKey: 'wellness.crisis.contacts.bup.name', number: '08-123 150 00', descKey: 'wellness.crisis.contacts.bup.description', color: 'bg-green-500' },
  { nameKey: 'wellness.crisis.contacts.healthcare.name', number: '08-320 100', descKey: 'wellness.crisis.contacts.healthcare.description', color: 'bg-purple-500' },
  { nameKey: 'wellness.crisis.contacts.112.name', number: '112', descKey: 'wellness.crisis.contacts.112.description', color: 'bg-red-600' },
]

// Breathing step definitions with i18n keys
const breathingStepDefs = [
  { textKey: 'wellness.crisis.breatheIn', duration: 4000, icon: Wind },
  { textKey: 'wellness.crisis.holdBreath', duration: 4000, icon: Hand },
  { textKey: 'wellness.crisis.breatheOut', duration: 6000, icon: Wind },
  { textKey: 'wellness.crisis.rest', duration: 2000, icon: Heart },
]

// Grounding technique definitions with i18n keys
const groundingTechniqueDefs = [
  { titleKey: 'wellness.crisis.technique54321.title', descKey: 'wellness.crisis.technique54321.description', icon: Eye },
  { titleKey: 'wellness.crisis.coldWater.title', descKey: 'wellness.crisis.coldWater.description', icon: Hand },
  { titleKey: 'wellness.crisis.activeListening.title', descKey: 'wellness.crisis.activeListening.description', icon: Ear },
]

export default function CrisisTab() {
  const { t } = useTranslation()
  const [activeExercise, setActiveExercise] = useState<'breathing' | 'grounding' | null>(null)
  const [breathingStep, setBreathingStep] = useState(0)
  const [showChat, setShowChat] = useState(false)

  // Build translated arrays
  const emergencyContacts = useMemo(() => emergencyContactDefs.map(c => ({
    name: t(c.nameKey),
    number: c.number,
    description: t(c.descKey),
    available: t('wellness.crisis.roundTheClock'),
    color: c.color,
  })), [t])

  const breathingSteps = useMemo(() => breathingStepDefs.map(s => ({
    text: t(s.textKey),
    duration: s.duration,
    icon: s.icon,
  })), [t])

  const groundingTechniques = useMemo(() => groundingTechniqueDefs.map(g => ({
    title: t(g.titleKey),
    description: t(g.descKey),
    icon: g.icon,
  })), [t])

  const startBreathing = () => {
    setActiveExercise('breathing')
    setBreathingStep(0)
    // Start breathing cycle
    let step = 0
    const interval = setInterval(() => {
      step = (step + 1) % breathingSteps.length
      setBreathingStep(step)
    }, breathingSteps[step].duration)

    // Stop after 2 minutes
    setTimeout(() => {
      clearInterval(interval)
      setActiveExercise(null)
    }, 120000)
  }

  return (
    <div className="space-y-6">
      {/* Emergency Banner */}
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Siren className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-red-800 mb-2">{t('wellness.crisis.needUrgentHelp')}</h2>
            <p className="text-red-700 mb-4">
              {t('wellness.crisis.urgentHelpDescription')}
            </p>
            <a
              href="tel:112"
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
            >
              <Phone className="w-5 h-5" />
              {t('wellness.crisis.call112')}
            </a>
          </div>
        </div>
      </div>

      {/* Breathing Exercise */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Wind className="w-5 h-5 text-indigo-600" />
          {t('wellness.crisis.breathingExercise')}
        </h3>

        {activeExercise === 'breathing' ? (
          <div className="text-center py-8">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-indigo-100 flex items-center justify-center animate-pulse">
              {(() => {
                const Icon = breathingSteps[breathingStep].icon
                return <Icon className="w-12 h-12 text-indigo-600" />
              })()}
            </div>
            <p className="text-xl font-medium text-slate-800 mb-2">
              {breathingSteps[breathingStep].text}
            </p>
            <p className="text-sm text-slate-500">
              {breathingStep + 1} / {breathingSteps.length}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setActiveExercise(null)}
            >
              {t('wellness.crisis.stopBreathing')}
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-slate-600 mb-4">
              {t('wellness.crisis.breathingExercise')}
            </p>
            <Button onClick={startBreathing}>
              {t('wellness.crisis.startBreathing')}
            </Button>
          </div>
        )}
      </Card>

      {/* Grounding Techniques */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-indigo-600" />
          {t('wellness.crisis.groundingTechniques')}
        </h3>
        <div className="space-y-3">
          {groundingTechniques.map((technique, index) => {
            const Icon = technique.icon
            return (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">{technique.title}</h4>
                  <p className="text-sm text-slate-600">{technique.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Emergency Contacts */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5 text-indigo-600" />
          {t('wellness.crisis.emergencyContacts')}
        </h3>
        <div className="space-y-3">
          {emergencyContacts.map((contact, index) => (
            <a
              key={index}
              href={`tel:${contact.number.replace(/\s/g, '')}`}
              className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all"
            >
              <div className={`w-12 h-12 rounded-xl ${contact.color} flex items-center justify-center text-white font-bold`}>
                <Phone className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-800">{contact.name}</h4>
                <p className="text-lg font-bold text-indigo-600">{contact.number}</p>
                <p className="text-sm text-slate-600">{contact.description}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">{contact.available}</span>
                <ExternalLink className="w-4 h-4 text-slate-400 mt-1" />
              </div>
            </a>
          ))}
        </div>
      </Card>

      {/* Chat Support */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-indigo-600" />
          Chatt-stöd
        </h3>
        <p className="text-slate-600 mb-4">
          Behöver du prata med någon? Våra volontärer finns här för att lyssna.
          Chatta anonymt och få stöd direkt.
        </p>
        <Button onClick={() => setShowChat(true)}>
          Starta chatt
        </Button>
      </Card>

      {/* Share with consultant */}
      <Card className="p-6 bg-amber-50 border-amber-200">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-amber-900 mb-2">Dela med din arbetskonsulent</h4>
            <p className="text-amber-800 mb-4">
              Om du har det svårt kan det vara bra att berätta för din arbetskonsulent. 
              De kan anpassa ditt program eller ge ytterligare stöd.
            </p>
            <Button variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100">
              Skicka meddelande till konsulent
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Reminder */}
      <div className="text-center p-6 bg-indigo-50 rounded-xl">
        <Heart className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
        <p className="text-indigo-800 font-medium">
          Kom ihåg: Det är okej att inte må bra. Du är inte ensam, och det finns hjälp att få.
        </p>
      </div>
    </div>
  )
}
