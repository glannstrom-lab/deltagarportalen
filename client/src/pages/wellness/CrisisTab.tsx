/**
 * Crisis Support Tab - Emergency help for mental health
 */
import { useState } from 'react'
import { 
  Siren, Phone, MessageCircle, Heart, Wind, Eye, Ear, Hand,
  ExternalLink, AlertTriangle, ChevronRight, X
} from 'lucide-react'
import { Card, Button } from '@/components/ui'

const emergencyContacts = [
  {
    name: 'Jourtelefon 1177',
    number: '1177',
    description: 'Sjukvårdsrådgivning dygnet runt',
    available: 'Dygnet runt',
    color: 'bg-blue-500',
  },
  {
    name: 'Barn- och ungdomspsykiatri (BUP)',
    number: '08-123 150 00',
    description: 'Akut hjälp för barn och unga',
    available: 'Dygnet runt',
    color: 'bg-green-500',
  },
  {
    name: 'Sjukvårdsupplysningen',
    number: '08-320 100',
    description: 'Råd och vägledning',
    available: 'Dygnet runt',
    color: 'bg-purple-500',
  },
  {
    name: '112',
    number: '112',
    description: 'Vid akut livsfara',
    available: 'Dygnet runt',
    color: 'bg-red-600',
  },
]

const breathingSteps = [
  { text: 'Andas in genom näsan', duration: 4000, icon: Wind },
  { text: 'Håll andan', duration: 4000, icon: Hand },
  { text: 'Andas ut genom munnen', duration: 6000, icon: Wind },
  { text: 'Vila', duration: 2000, icon: Heart },
]

const groundingTechniques = [
  {
    title: '5-4-3-2-1-tekniken',
    description: 'Identifiera 5 saker du ser, 4 du kan röra vid, 3 du hör, 2 du luktar, 1 du smakar',
    icon: Eye,
  },
  {
    title: 'Kalla vatten',
    description: 'Håll händerna under kallt vatten eller lägg en kall handduk i pannan',
    icon: Hand,
  },
  {
    title: 'Lyssna aktivt',
    description: 'Identifiera alla ljud du kan höra just nu, en efter en',
    icon: Ear,
  },
]

export default function CrisisTab() {
  const [activeExercise, setActiveExercise] = useState<'breathing' | 'grounding' | null>(null)
  const [breathingStep, setBreathingStep] = useState(0)
  const [showChat, setShowChat] = useState(false)

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
            <h2 className="text-xl font-bold text-red-800 mb-2">Behöver du akut hjälp?</h2>
            <p className="text-red-700 mb-4">
              Om du har tankar på att skada dig själv eller andra, kontakta omedelbart 
              112 eller åk till närmaste akutmottagning.
            </p>
            <a 
              href="tel:112" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
            >
              <Phone className="w-5 h-5" />
              Ring 112
            </a>
          </div>
        </div>
      </div>

      {/* Breathing Exercise */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Wind className="w-5 h-5 text-indigo-600" />
          Andningsövning
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
              Steg {breathingStep + 1} av {breathingSteps.length}
            </p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => setActiveExercise(null)}
            >
              Avbryt
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-slate-600 mb-4">
              En enkel andningsövning kan hjälpa dig att lugna ner dig vid ångest eller panik.
              Följ instruktionerna i 2 minuter.
            </p>
            <Button onClick={startBreathing}>
              Starta andningsövning
            </Button>
          </div>
        )}
      </Card>

      {/* Grounding Techniques */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-indigo-600" />
          Markövningar (Grounding)
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
          Viktiga telefonnummer
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
