/**
 * Crisis Support Tab - Emergency help for mental health
 */
import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, MotionConfig } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Siren, Phone, Heart, Wind, Eye, Ear, Hand,
  ExternalLink, AlertTriangle, ChevronRight
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

// Grounding technique definitions with i18n keys
const groundingTechniqueDefs = [
  { titleKey: 'wellness.crisis.technique54321.title', descKey: 'wellness.crisis.technique54321.description', icon: Eye },
  { titleKey: 'wellness.crisis.coldWater.title', descKey: 'wellness.crisis.coldWater.description', icon: Hand },
  { titleKey: 'wellness.crisis.activeListening.title', descKey: 'wellness.crisis.activeListening.description', icon: Ear },
]

// Breathing Exercise with Circle Animation
function BreathingExercise({ onStop }: { onStop: () => void }) {
  const { t } = useTranslation()
  const [phase, setPhase] = useState<'breathe-in' | 'hold' | 'breathe-out' | 'rest'>('breathe-in')
  const [, setScale] = useState(1)
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
    'breathe-in': t('wellness.crisis.phase.in'),
    'hold': t('wellness.crisis.phase.hold'),
    'breathe-out': t('wellness.crisis.phase.out'),
    'rest': t('wellness.crisis.phase.rest'),
  }

  return (
    <div className="text-center py-8">
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{t('wellness.crisis.round', { count: cycleCount + 1 })}</p>
      <motion.div
        animate={{
          scale: phase === 'breathe-in' ? [1, 1.4] : phase === 'breathe-out' ? [1.4, 1] : [1, 1],
          opacity: phase === 'rest' ? 0.8 : 1
        }}
        transition={{
          duration: phase === 'breathe-in' ? 4 : phase === 'hold' ? 4 : phase === 'breathe-out' ? 6 : 2,
          ease: 'easeInOut'
        }}
        className="w-40 h-40 mx-auto mb-8 rounded-full bg-[var(--c-solid)] flex items-center justify-center shadow-lg"
      >
        <Wind className="w-16 h-16 text-white" />
      </motion.div>

      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">{phaseText[phase]}</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        {/* Stod: "Du mår bra. Du är säker." — till någon i kris kan sidan inte
            veta något av det. Nu bara det som är sant i stunden. */}
        {t('wellness.crisis.breathingAffirmation')}
      </p>

      <Button
        variant="outline"
        className="w-full"
        onClick={onStop}
      >
        {t('wellness.crisis.stopExercise')}
      </Button>
    </div>
  )
}

// Grounding Technique Guide
// Stegen per teknik — nycklar under wellness.crisis.steps. Ordningen följer
// groundingTechniqueDefs (0 = 5-4-3-2-1, 1 = kallt vatten, 2 = lyssna).
const GRUNDNINGSSTEG: Record<number, { grupp: string; antal: number }> = {
  0: { grupp: 's54321', antal: 5 },
  1: { grupp: 'coldWater', antal: 4 },
  2: { grupp: 'listening', antal: 4 },
}

function GroundingGuide({ technique, onClose }: { technique: { id: number; title: string; description: string }; onClose: () => void }) {
  const { t } = useTranslation()
  const { grupp, antal } = GRUNDNINGSSTEG[technique.id] ?? GRUNDNINGSSTEG[2]
  const steps = Array.from({ length: antal }, (_, i) => t(`wellness.crisis.steps.${grupp}.${i + 1}`))

  const [currentStep, setCurrentStep] = useState(0)

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{technique.title}</h4>
        <p className="text-gray-600 dark:text-gray-300">{technique.description}</p>
      </div>

      <div className="space-y-4">
        {steps.map((step, idx) => (
          // En knapp, inte en klickbar div: stegen gick inte att nå med
          // tangentbordet — på krissidan, av alla ställen.
          <motion.button
            type="button"
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            aria-current={idx === currentStep ? 'step' : undefined}
            className={cn(
              'block w-full text-left p-4 rounded-xl border-2 transition-all',
              idx <= currentStep
                ? 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border-[var(--c-accent)] dark:border-[var(--c-solid)]'
                : 'bg-stone-50 dark:bg-stone-700 border-stone-200 dark:border-stone-600'
            )}
            onClick={() => setCurrentStep(idx)}
          >
            <span className="flex items-start gap-3">
              <span className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
                idx <= currentStep ? 'bg-[var(--c-solid)] dark:bg-[var(--c-solid)] text-white' : 'bg-stone-300 dark:bg-stone-600 text-gray-700 dark:text-gray-300'
              )}>
                {idx + 1}
              </span>
              <span className={idx <= currentStep ? 'text-gray-800 dark:text-gray-100 font-medium' : 'text-gray-600 dark:text-gray-300'}>{step}</span>
            </span>
          </motion.button>
        ))}
      </div>

      <Button onClick={onClose} variant="outline" className="w-full">
        {t('wellness.crisis.readyToContinue')}
      </Button>
    </div>
  )
}

export default function CrisisTab() {
  const { t } = useTranslation()
  const [activeExercise, setActiveExercise] = useState<'breathing' | 'grounding' | null>(null)
  const [selectedGroundingTechnique, setSelectedGroundingTechnique] = useState<number | null>(null)

  // Build translated arrays
  const emergencyContacts = useMemo(() => emergencyContactDefs.map(c => ({
    name: t(c.nameKey),
    number: c.number,
    description: t(c.descKey),
    available: t('wellness.crisis.roundTheClock'),
    color: c.color,
  })), [t])

  // breathingSteps borttagen 2026-05-15 — 0 callers. Återinför när
  // andningsövning rendrar steg-för-steg.

  // 2026-09-22: `id` saknades här, men GroundingGuide (nedan) grenar sina
  // instruktionssteg på `technique.id === 0 | 1 | else`. Utan id var
  // `technique.id` alltid `undefined`, så ALLA tre grundningsövningar (5-4-
  // 3-2-1, kallt vatten, aktivt lyssnande) visade exakt samma steg — den
  // sista teknikens ("aktivt lyssnande"), oavsett vilken användaren klickade
  // på. En krissida som visar fel instruktioner till någon i affekt är
  // allvarligt — index matchar ordningen i groundingTechniqueDefs ovan.
  const groundingTechniques = useMemo(() => groundingTechniqueDefs.map((g, index) => ({
    id: index,
    title: t(g.titleKey),
    description: t(g.descKey),
    icon: g.icon,
  })), [t])


  // CrisisTab är en krishanteringssida — användare i kris ska inte mötas
  // av dansande element. MotionConfig reducedMotion="user" gör att alla
  // motion-element inom (19 st i denna fil) automatiskt stängs av för
  // användare med prefers-reduced-motion satt. WCAG 2.3.3 / a11y-audit
  // 2026-05-09.
  return (
    <MotionConfig reducedMotion="user">
    <div className="space-y-6">
      {/* Emergency Banner - Prominent and Clear */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-600 rounded-xl p-6 text-white shadow-xl"
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
                {t('wellness.crisis.call', { number: '112' })}
              </a>
              <a
                href="tel:1177"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 text-white font-bold rounded-xl hover:bg-white/30 transition-colors border border-white/40"
              >
                <Phone className="w-5 h-5" />
                {t('wellness.crisis.call', { number: '1177' })}
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
      <Card className="p-6 border-2 border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Wind className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" />
          {t('wellness.crisis.breathingExercise')}
        </h3>

        {activeExercise === 'breathing' ? (
          <BreathingExercise onStop={() => setActiveExercise(null)} />
        ) : (
          <div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {t('wellness.crisis.breathingIntro')}
            </p>
            <Button onClick={() => setActiveExercise('breathing')} className="w-full" size="lg">
              <Wind className="w-5 h-5 mr-2" />
              {t('wellness.crisis.startBreathing')}
            </Button>
          </div>
        )}
      </Card>

      {/* Grounding Techniques - Interactive Guide */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" />
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
                  className="w-full flex items-start gap-4 p-4 rounded-xl bg-stone-50 dark:bg-stone-700 hover:bg-[var(--c-bg)] dark:hover:bg-[var(--c-bg)]/30 border border-transparent hover:border-[var(--c-accent)]/60 dark:hover:border-[var(--c-solid)] transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-stone-600 flex items-center justify-center shadow-sm flex-shrink-0">
                    <Icon className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">{technique.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{technique.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300 flex-shrink-0" />
                </motion.button>
              )
            })}
          </div>
        )}
      </Card>

      {/* Emergency Contacts - Full Details */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" />
          {t('wellness.crisis.emergencyContacts')}
        </h3>
        <div className="space-y-3">
          {emergencyContacts.map((contact, index) => (
            <motion.a
              key={index}
              whileHover={{ x: 4 }}
              href={`tel:${contact.number.replace(/\s/g, '')}`}
              className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-stone-700 border-2 border-stone-200 dark:border-stone-600 hover:border-[var(--c-accent)] dark:hover:border-[var(--c-solid)] hover:shadow-md transition-all"
            >
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0',
                contact.color
              )}>
                <Phone className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-800 dark:text-gray-100">{contact.name}</h4>
                <p className="text-lg font-bold text-[var(--c-text)] dark:text-[var(--c-text)]">{contact.number}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{contact.description}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{contact.available}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-300 flex-shrink-0" />
            </motion.a>
          ))}
        </div>
      </Card>

      {/*
        Här låg ett "Chatt-stöd"-kort: "Våra tränade volontärer finns här
        dygnet runt … Du kan chatta helt anonymt", med en knapp som satte ett
        tillstånd ingenting läste. Portalen har varken volontärer eller chatt.
        På en krissida är ett löfte utan verkan värre än inget löfte — borttaget
        2026-09-22. Ska en riktig chattjänst länkas hit krävs ett beslut om
        vilken, och en kontrollerad adress.
      */}

      {/* Share with consultant */}
      <Card className="p-6 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">{t('wellness.crisis.shareHeading')}</h4>
            <p className="text-amber-800 dark:text-amber-300 mb-4">
              {t('wellness.crisis.shareText')}
            </p>
            {/* Var en <Button> utan onClick. Meddelandena bor på Min konsulent. */}
            <Link
              to="/my-consultant"
              className="inline-flex items-center px-4 py-2 rounded-lg border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 font-medium text-sm"
            >
              {t('wellness.crisis.sendMessage')}
              <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Card>

      {/* Supportive Reminder */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-6 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 rounded-xl border-2 border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Heart className="w-8 h-8 text-[var(--c-solid)] dark:text-[var(--c-text)] mx-auto mb-3" />
        </motion.div>
        <p className="text-[var(--c-text)] dark:text-[var(--c-text)] font-medium">
          {t('wellness.crisis.reminder')}
        </p>
      </motion.div>
    </div>
    </MotionConfig>
  )
}
