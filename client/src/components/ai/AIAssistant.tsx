import { useState } from 'react'
import { Sparkles, X, Loader2, MessageSquare, Wand2, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { aiService } from '@/services/aiService'

interface AIAssistantProps {
  mode: 'cv-optimization' | 'cv-generate' | 'cover-letter' | 'interview-prep' | 'job-tips' | 'salary' | 'exercise-help'
  context?: Record<string, any>
  onResult?: (result: string) => void
  buttonText?: string
  compact?: boolean
}

const modeConfig = {
  'cv-optimization': {
    icon: Sparkles,
    title: 'AI CV-analys',
    description: 'Få feedback på ditt CV',
    buttonText: 'Analysera med AI',
    placeholder: 'Klistra in ditt CV-text här...'
  },
  'cv-generate': {
    icon: Wand2,
    title: 'Generera CV-text',
    description: 'Låt AI hjälpa dig skriva',
    buttonText: 'Generera text',
    placeholder: 'Beskriv vad du vill ha hjälp med...'
  },
  'cover-letter': {
    icon: MessageSquare,
    title: 'Personligt brev',
    description: 'Skriv personligt brev med AI',
    buttonText: 'Skriv brev',
    placeholder: 'Klistra in jobbannonsen...'
  },
  'interview-prep': {
    icon: Lightbulb,
    title: 'Intervjuförberedelser',
    description: 'Förbered dig inför intervjun',
    buttonText: 'Förbered mig',
    placeholder: 'Ange roll och företag...'
  },
  'job-tips': {
    icon: Sparkles,
    title: 'Jobbsökartips',
    description: 'Få personliga tips',
    buttonText: 'Få tips',
    placeholder: 'Beskriv din situation...'
  },
  'salary': {
    icon: Sparkles,
    title: 'Löneförhandling',
    description: 'Få råd inför löneförhandling',
    buttonText: 'Få rådgivning',
    placeholder: 'Ange roll och erfarenhet...'
  },
  'exercise-help': {
    icon: Lightbulb,
    title: 'AI Coach',
    description: 'Få hjälp med övningen',
    buttonText: 'Be om hjälp',
    placeholder: 'Beskriv vad du behöver hjälp med...'
  }
}

export function AIAssistant({ mode, context = {}, onResult, buttonText, compact = false }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [input, setInput] = useState('')

  const config = modeConfig[mode]
  const Icon = config.icon

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      let response

      switch (mode) {
        case 'cv-optimization':
          response = await aiService.optimizeCV({
            cvText: input || context.cvText,
            yrke: context.yrke
          })
          setResult(response.feedback)
          onResult?.(response.feedback)
          break

        case 'cv-generate':
          response = await aiService.generateCVText({
            yrke: context.yrke || input,
            erfarenhet: context.erfarenhet,
            styrkor: context.styrkor
          })
          setResult(response.cvText)
          onResult?.(response.cvText)
          break

        case 'cover-letter':
          response = await aiService.generateCoverLetter({
            jobbAnnons: input || context.jobbAnnons,
            erfarenhet: context.erfarenhet,
            motivering: context.motivering,
            namn: context.namn,
            ton: context.ton || 'professionell'
          })
          setResult(response.brev)
          onResult?.(response.brev)
          break

        case 'interview-prep':
          response = await aiService.prepareInterview({
            jobbTitel: context.jobbTitel || input,
            foretag: context.foretag,
            erfarenhet: context.erfarenhet,
            egenskaper: context.egenskaper
          })
          setResult(response.forberedelser)
          onResult?.(response.forberedelser)
          break

        case 'job-tips':
          response = await aiService.getJobTips({
            intressen: context.intressen || input,
            tidigareErfarenhet: context.tidigareErfarenhet,
            hinder: context.hinder,
            mal: context.mal
          })
          setResult(response.tips)
          onResult?.(response.tips)
          break

        case 'salary':
          response = await aiService.getSalaryAdvice({
            roll: context.roll || input,
            erfarenhetAr: context.erfarenhetAr,
            nuvarandeLon: context.nuvarandeLon,
            foretagsStorlek: context.foretagsStorlek,
            ort: context.ort
          })
          setResult(response.radgivning)
          onResult?.(response.radgivning)
          break

        case 'exercise-help':
          response = await aiService.getExerciseHelp({
            ovningId: context.ovningId,
            steg: context.steg,
            fraga: context.fraga,
            anvandarSvar: context.anvandarSvar || input
          })
          setResult(response.hjalp)
          onResult?.(response.hjalp)
          break
      }
    } catch (err) {
      setError('Ett fel uppstod. Försök igen senare.')
      console.error('AI error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (compact) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2"
        >
          <Icon className="w-4 h-4" />
          {buttonText || config.buttonText}
        </Button>

        {isOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{config.title}</h3>
                      <p className="text-sm text-gray-500">{config.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Content */}
                {!result ? (
                  <div className="space-y-4">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={config.placeholder}
                      rows={6}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-y"
                    />
                    {error && (
                      <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                        {error}
                      </div>
                    )}
                    <Button
                      onClick={handleSubmit}
                      disabled={isLoading || !input.trim()}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Bearbetar...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          {config.buttonText}
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-800 max-h-96 overflow-y-auto">
                      {result}
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setResult(null)
                          setInput('')
                        }}
                        className="flex-1"
                      >
                        Ny fråga
                      </Button>
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(result)
                        }}
                        className="flex-1"
                      >
                        Kopiera
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </>
    )
  }

  return (
    <Card className="p-4 border-indigo-100 bg-indigo-50/50">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <Icon className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{config.title}</h3>
            <p className="text-sm text-gray-500">{config.description}</p>
          </div>
        </div>

        {/* Content */}
        {!result ? (
          <div className="space-y-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={config.placeholder}
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-y"
            />
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !input.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Bearbetar...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {buttonText || config.buttonText}
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 whitespace-pre-wrap text-gray-800 max-h-64 overflow-y-auto">
              {result}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null)
                  setInput('')
                }}
                className="flex-1"
              >
                Ny fråga
              </Button>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(result)
                }}
                className="flex-1"
              >
                Kopiera
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
