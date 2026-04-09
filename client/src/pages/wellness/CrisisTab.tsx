/**
 * Crisis Support Tab - Emergency help for mental health
 */
import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Siren, Phone, MessageCircle, Heart, Wind, Eye, Ear, Hand,
  ExternalLink, AlertTriangle, ChevronRight, X, Activity
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'

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

// Breathing Exercise with Circle Animation
function BreathingExercise({ onStop }: { onStop: () => void }) {
  const [phase, setPhase] = useState<'breathe-in' | 'hold' | 'breathe-out' | 'rest'>('breathe-in')
  const [scale, setScale] = useState(1)
  const [cycleCount, setCycleCount] = useState(0)

  useEffect(() => {
    const timings: Record<string, number> = {
      'breathe-in': 4000,
      'hold': 4000,
      'breathe-out': 6000,
      'rest': 2000
    }

    const sequence: Array<'breathe-in' | 'hold' | 'breathe-out' | 'rest'> = ['breathe-in', 'hold', 'breathe-out', 'rest']
    let phaseIndex = 0

    const cycleTimer = setInterval(() => {
      const currentPhase = sequence[phaseIndex]
      setPhase(currentPhase)

      if (currentPhase === 'breathe-in') {
        setScale(1.4)
      } else if (currentPhase === 'breathe-out') {
        setScale(1)
      }

      phaseIndex = (phaseIndex + 1) % sequence.length
      if (phaseIndex === 0) {
        setCycleCount(c => c + 1)
      }
    }, timings[sequence[phaseIndex]])

    return () => clearInterval(cycleTimer)
  }, [])

  const phaseText: Record<string, string> = {
    'breathe-in': 'Andas in...',
    'hold': 'Håll anden...',
    'breathe-out': 'Andas ut...',
    'rest': 'Vila...'
  }

  return (
    <div className="text-center py-8">
      <p className="text-sm text-slate-700 mb-6">Omgång {cycleCount + 1}</p>
      <motion.div
        animate={{
          scale: phase === 'breathe-in' ? [1, 1.4] : phase === 'breathe-out' ? [1.4, 1] : [1, 1],
          opacity: phase === 'rest' ? 0.8 : 1
        }}
        transition={{
          duration: phase === 'breathe-in' ? 4 : phase === 'hold' ? 4 : phase === 'breathe-out' ? 6 : 2,
          ease: 'easeInOut'
        }}
        className="w-40 h-40 mx-auto mb-8 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center shadow-lg"
      >
        <Wind className="w-16 h-16 text-white" />
      </motion.div>

      <h3 className="text-2xl font-bold text-slate-800 mb-3">{phaseText[phase]}</h3>
      <p className="text-slate-600 mb-8">
        Du mår bra. Du är säker. Du är här. Nu.
      </p>

      <Button
        variant="outline"
        className="w-full"
        onClick={onStop}
      >
        {t('wellness.crisis.stopBreathing')}
      </Button>
    </div>
  )
}

// Grounding Technique Guide
function GroundingGuide({ technique, onClose }: { technique: any; onClose: () => void }) {
  const steps = technique.id === 0
    ? ['Identifiera 5 saker du ser', 'Identifiera 4 saker du kan röra vid', 'Identifiera 3 saker du hör', 'Identifiera 2 saker du luktar', 'Identifiera 1 sak du smäcker']
    : technique.id === 1
    ? ['Hitta kall vatten', 'Doppa ansiktet eller händerna', 'Andas långsamt', 'Märk skiftningen i din kropp']
    : ['Hitta en lugn röst eller musik', 'Lyssna aktivt i 5 minuter', 'Fokusera på tonerna och orden', 'Märk hur det påverkar dig']

  const [currentStep, setCurrentStep] = useState(0)

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-xl font-bold text-slate-800 mb-2">{technique.title}</h4>
        <p className="text-slate-600">{technique.description}</p>
      </div>

      <div className="space-y-4">
        {steps.map((step, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              'p-4 rounded-xl border-2 transition-all cursor-pointer',
              idx <= currentStep
                ? 'bg-indigo-50 border-indigo-300'
                : 'bg-slate-50 border-slate-200'
            )}
            onClick={() => setCurrentStep(idx)}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
                idx <= currentStep ? 'bg-indigo-500 text-white' : 'bg-slate-300 text-slate-700'
              )}>
                {idx + 1}
              </div>
              <p className={idx <= currentStep ? 'text-slate-800 font-medium' : 'text-slate-600'}>{step}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <Button onClick={onClose} variant="outline" className="w-full">
        Jag är beredd att fortsätta
      </Button>
    </div>
  )
}

export default function CrisisTab() {
  const { t } = useTranslation()
  const [activeExercise, setActiveExercise] = useState<'breathing' | 'grounding' | null>(null)
  const [selectedGroundingTechnique, setSelectedGroundingTechnique] = useState<number | null>(null)
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


  return (
    <div className="space-y-6">
      {/* Emergency Banner - Prominent and Clear */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 text-white shadow-xl"
      >
        <div className="flex items-start gap-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0"
          >
            <Siren className="w-6 h-6" />
          </motion.div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">{t('wellness.crisis.needUrgentHelp')}</h2>
            <p className="text-red-100 mb-6 text-sm">
              {t('wellness.crisis.urgentHelpDescription')}
            </p>
            <div className="flex gap-3 flex-wrap">
              <a
                href="tel:112"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors shadow-lg"
              >
                <Phone className="w-5 h-5" />
                Ring 112
              </a>
              <a
                href="tel:1177"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 text-white font-bold rounded-xl hover:bg-white/30 transition-colors border border-white/40"
              >
                <Phone className="w-5 h-5" />
                Ring 1177
              </a>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Access Emergency Contacts */}
      <div className="grid grid-cols-2 gap-3">
        {emergencyContacts.slice(0, 4).map((contact, index) => (
          <motion.a
            key={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href={`tel:${contact.number.replace(/\s/g, '')}`}
            className={cn(
              'p-4 rounded-xl text-white font-semibold text-center transition-all shadow-lg',
              contact.color
            )}
          >
            <Phone className="w-5 h-5 mx-auto mb-2" />
            <p className="text-sm">{contact.name}</p>
            <p className="text-lg">{contact.number}</p>
          </motion.a>
        ))}
      </div>

      {/* Breathing Exercise */}
      <Card className="p-6 border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Wind className="w-5 h-5 text-indigo-600" />
          {t('wellness.crisis.breathingExercise')}
        </h3>

        {activeExercise === 'breathing' ? (
          <BreathingExercise onStop={() => setActiveExercise(null)} />
        ) : (
          <div>
            <p className="text-slate-600 mb-6">
              En enkel andningsövning kan lugna din nervösa system. Det tar bara några minuter.
            </p>
            <Button onClick={() => setActiveExercise('breathing')} className="w-full" size="lg">
              <Wind className="w-5 h-5 mr-2" />
              {t('wellness.crisis.startBreathing')}
            </Button>
          </div>
        )}
      </Card>

      {/* Grounding Techniques - Interactive Guide */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-indigo-600" />
          {t('wellness.crisis.groundingTechniques')}
        </h3>

        {selectedGroundingTechnique !== null ? (
          <GroundingGuide
            technique={groundingTechniques[selectedGroundingTechnique]}
            onClose={() => setSelectedGroundingTechnique(null)}
          />
        ) : (
          <div className="space-y-3">
            {groundingTechniques.map((technique, index) => {
              const Icon = technique.icon
              return (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedGroundingTechnique(index)}
                  className="w-full flex items-start gap-4 p-4 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                    <Icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800">{technique.title}</h4>
                    <p className="text-sm text-slate-600">{technique.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 flex-shrink-0" />
                </motion.button>
              )
            })}
          </div>
        )}
      </Card>

      {/* Emergency Contacts - Full Details */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5 text-indigo-600" />
          {t('wellness.crisis.emergencyContacts')}
        </h3>
        <div className="space-y-3">
          {emergencyContacts.map((contact, index) => (
            <motion.a
              key={index}
              whileHover={{ x: 4 }}
              href={`tel:${contact.number.replace(/\s/g, '')}`}
              className="flex items-center gap-4 p-4 rounded-xl bg-white border-2 border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all"
            >
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0',
                contact.color
              )}>
                <Phone className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-slate-800">{contact.name}</h4>
                <p className="text-lg font-bold text-indigo-600">{contact.number}</p>
                <p className="text-sm text-slate-600">{contact.description}</p>
                <p className="text-xs text-slate-700 mt-1">{contact.available}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-600 flex-shrink-0" />
            </motion.a>
          ))}
        </div>
      </Card>

      {/* Chat Support */}
      <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-emerald-600" />
          Chatt-stöd
        </h3>
        <p className="text-slate-700 mb-6">
          Behöver du prata med någon? Våra tränade volontärer finns här dygnet runt för att lyssna.
          Du kan chatta helt anonymt.
        </p>
        <Button onClick={() => setShowChat(true)} className="w-full bg-emerald-600 hover:bg-emerald-700" size="lg">
          <MessageCircle className="w-5 h-5 mr-2" />
          Starta chatt nu
        </Button>
      </Card>

      {/* Share with consultant */}
      <Card className="p-6 bg-amber-50 border-2 border-amber-200">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h4 className="font-semibold text-amber-900 mb-2">Dela med din arbetskonsulent</h4>
            <p className="text-amber-800 mb-4">
              Om du mår dåligt kan det vara värdefullt att berätta för din arbetskonsulent.
              De kan anpassa ditt program eller ge extra stöd under denna tid.
            </p>
            <Button variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100">
              Skicka meddelande till konsulent
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Supportive Reminder */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Heart className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
        </motion.div>
        <p className="text-indigo-900 font-medium">
          Kom ihåg: Det är helt okej att inte må bra. Du är inte ensam i det här. Hjälpen finns här när du behöver den.
        </p>
      </motion.div>
    </div>
  )
}
