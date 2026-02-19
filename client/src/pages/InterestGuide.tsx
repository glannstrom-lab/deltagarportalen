import { useState } from 'react'
import { interestApi } from '../services/api'
import { ChevronRight, ChevronLeft, RotateCcw, Briefcase, Brain, Activity } from 'lucide-react'

interface Answer {
  questionId: string
  value: number
}

export default function InterestGuide() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [showResults, setShowResults] = useState(false)
  const [result, setResult] = useState<any>(null)

  // RIASEC-frågor
  const riasecQuestions = [
    { id: 'r1', category: 'realistic', text: 'Jag gillar att arbeta praktiskt med händerna' },
    { id: 'r2', category: 'realistic', text: 'Jag tycker om att reparera saker' },
    { id: 'r3', category: 'realistic', text: 'Jag föredrar att se konkreta resultat av mitt arbete' },
    { id: 'r4', category: 'realistic', text: 'Jag gillar att arbeta utomhus' },
    { id: 'i1', category: 'investigative', text: 'Jag gillar att lösa komplexa problem' },
    { id: 'i2', category: 'investigative', text: 'Jag är nyfiken på hur saker fungerar' },
    { id: 'i3', category: 'investigative', text: 'Jag tycker om att analysera data' },
    { id: 'i4', category: 'investigative', text: 'Jag gillar att lära mig nya saker kontinuerligt' },
    { id: 'a1', category: 'artistic', text: 'Jag tycker om att vara kreativ' },
    { id: 'a2', category: 'artistic', text: 'Jag uppskattar konst och estetik' },
    { id: 'a3', category: 'artistic', text: 'Jag gillar att uttrycka mig fritt' },
    { id: 'a4', category: 'artistic', text: 'Jag har en livlig fantasi' },
    { id: 's1', category: 'social', text: 'Jag tycker om att hjälpa andra' },
    { id: 's2', category: 'social', text: 'Jag är en bra lyssnare' },
    { id: 's3', category: 'social', text: 'Jag trivs i sociala sammanhang' },
    { id: 's4', category: 'social', text: 'Jag gillar att undervisa eller vägleda' },
    { id: 'e1', category: 'enterprising', text: 'Jag gillar att leda och påverka' },
    { id: 'e2', category: 'enterprising', text: 'Jag är bra på att övertyga andra' },
    { id: 'e3', category: 'enterprising', text: 'Jag tycker om att ta risker' },
    { id: 'e4', category: 'enterprising', text: 'Jag vill starta eget företag' },
    { id: 'c1', category: 'conventional', text: 'Jag gillar ordning och struktur' },
    { id: 'c2', category: 'conventional', text: 'Jag är noggrann med detaljer' },
    { id: 'c3', category: 'conventional', text: 'Jag föredrar tydliga instruktioner' },
    { id: 'c4', category: 'conventional', text: 'Jag tycker om att organisera och kategorisera' },
  ]

  // Big Five-frågor
  const bigFiveQuestions = [
    { id: 'bf1', category: 'openness', text: 'Jag har en livlig fantasi' },
    { id: 'bf2', category: 'openness', text: 'Jag är intresserad av abstrakta idéer' },
    { id: 'bf3', category: 'openness', text: 'Jag uppskattar konst och estetik' },
    { id: 'bf4', category: 'conscientiousness', text: 'Jag är alltid förberedd' },
    { id: 'bf5', category: 'conscientiousness', text: 'Jag uppmärksammar detaljer' },
    { id: 'bf6', category: 'conscientiousness', text: 'Jag gillar ordning och struktur' },
    { id: 'bf7', category: 'extraversion', text: 'Jag är den som startar konversationer' },
    { id: 'bf8', category: 'extraversion', text: 'Jag känner mig energisk i stora grupper' },
    { id: 'bf9', category: 'extraversion', text: 'Jag tar gärna kommando i grupper' },
    { id: 'bf10', category: 'agreeableness', text: 'Jag bryr mig om andras känslor' },
    { id: 'bf11', category: 'agreeableness', text: 'Jag litar på andra människor' },
    { id: 'bf12', category: 'agreeableness', text: 'Jag hjälper gärna andra' },
    { id: 'bf13', category: 'neuroticism', text: 'Jag blir lätt stressad' },
    { id: 'bf14', category: 'neuroticism', text: 'Jag oroar mig mycket' },
    { id: 'bf15', category: 'neuroticism', text: 'Jag är känslomässigt stabil' },
  ]

  // Fysiska krav
  const physicalQuestions = [
    { id: 'ph1', category: 'mobility', text: 'Jag kan utan problem stå och gå under hela arbetsdagen' },
    { id: 'ph2', category: 'lifting', text: 'Jag kan lyfta tyngre föremål (över 10 kg)' },
    { id: 'ph3', category: 'vision', text: 'Jag har god syn (eventuellt med glasögon)' },
    { id: 'ph4', category: 'hearing', text: 'Jag har god hörsel' },
    { id: 'ph5', category: 'communication', text: 'Jag kan kommunicera verbalt utan svårigheter' },
    { id: 'ph6', category: 'fine_motor', text: 'Jag har bra finmotorik (t.ex. skriva, använda verktyg)' },
    { id: 'ph7', category: 'sitting', text: 'Jag kan sitta under längre perioder utan problem' },
    { id: 'ph8', category: 'computer', text: 'Jag kan arbeta vid dator utan besvär' },
  ]

  const allQuestions = [
    { title: 'RIASEC - Yrkesintressen', icon: Briefcase, questions: riasecQuestions },
    { title: 'Big Five - Personlighet', icon: Brain, questions: bigFiveQuestions },
    { title: 'Fysiska förutsättningar', icon: Activity, questions: physicalQuestions },
  ]

  const currentSection = allQuestions[step]
  const CurrentIcon = currentSection?.icon || Briefcase

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers((prev) => {
      const existing = prev.find((a) => a.questionId === questionId)
      if (existing) {
        return prev.map((a) => (a.questionId === questionId ? { ...a, value } : a))
      }
      return [...prev, { questionId, value }]
    })
  }

  const getAnswer = (questionId: string) => {
    return answers.find((a) => a.questionId === questionId)?.value || 0
  }

  const calculateResults = () => {
    // Beräkna RIASEC-poäng
    const riasecScores = {
      realistic: 0,
      investigative: 0,
      artistic: 0,
      social: 0,
      enterprising: 0,
      conventional: 0,
    }

    riasecQuestions.forEach((q) => {
      const answer = getAnswer(q.id)
      riasecScores[q.category as keyof typeof riasecScores] += answer
    })

    // Normalisera till 0-100
    Object.keys(riasecScores).forEach((key) => {
      const k = key as keyof typeof riasecScores
      riasecScores[k] = Math.round((riasecScores[k] / 16) * 100)
    })

    // Hitta Holland-kod (top 3)
    const sorted = Object.entries(riasecScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key]) => key[0].toUpperCase())
      .join('')

    // Big Five
    const bigFiveScores = {
      openness: 0,
      conscientiousness: 0,
      extraversion: 0,
      agreeableness: 0,
      neuroticism: 0,
    }

    bigFiveQuestions.forEach((q) => {
      const answer = getAnswer(q.id)
      bigFiveScores[q.category as keyof typeof bigFiveScores] += answer
    })

    Object.keys(bigFiveScores).forEach((key) => {
      const k = key as keyof typeof bigFiveScores
      bigFiveScores[k] = Math.round((bigFiveScores[k] / 15) * 100)
    })

    return {
      riasec: riasecScores,
      hollandCode: sorted,
      bigFive: bigFiveScores,
    }
  }

  const handleFinish = async () => {
    const results = calculateResults()
    setResult(results)
    setShowResults(true)

    // Spara resultat
    try {
      await interestApi.saveResult({
        ...results.riasec,
        hollandCode: results.hollandCode,
        ...results.bigFive,
      })
    } catch (error) {
      console.error('Fel vid sparande:', error)
    }
  }

  const reset = () => {
    setStep(0)
    setAnswers([])
    setShowResults(false)
    setResult(null)
  }

  if (showResults && result) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Dina resultat</h1>
          <p className="text-slate-600 mt-2">
            Baserat på dina svar har vi analyserat dina intressen och personlighet.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Holland Code */}
          <div className="card">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Din Holland-kod</h3>
            <div className="text-4xl font-bold text-teal-700 mb-4">{result.hollandCode}</div>
            <p className="text-slate-600 mb-4">
              Din kod visar vilka yrkestyper som passar dig bäst.
            </p>
            <div className="space-y-2">
              {result.hollandCode.split('').map((letter: string, i: number) => {
                const descriptions: Record<string, string> = {
                  R: 'Realistisk - Praktiskt arbete',
                  I: 'Investigativ - Analytiskt arbete',
                  A: 'Artistisk - Kreativt arbete',
                  S: 'Social - Hjälpa andra',
                  E: 'Enterprising - Leda och påverka',
                  C: 'Konventionell - Strukturerat arbete',
                }
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center font-bold text-teal-700">
                      {letter}
                    </span>
                    <span className="text-sm text-slate-600">{descriptions[letter]}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* RIASEC Chart */}
          <div className="card">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">RIASEC-profil</h3>
            <div className="space-y-3">
              {Object.entries(result.riasec).map(([key, value]) => {
                const riasecLabels: Record<string, string> = {
                  realistic: 'Realistisk',
                  investigative: 'Utforskande',
                  artistic: 'Konstnärlig',
                  social: 'Social',
                  enterprising: 'Företagsam',
                  conventional: 'Konventionell',
                }
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-700">{riasecLabels[key] || key}</span>
                      <span className="font-medium">{value as number}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-600 rounded-full transition-all"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Big Five */}
          <div className="card">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Big Five - Personlighet</h3>
            <div className="space-y-3">
              {Object.entries(result.bigFive).map(([key, value]) => {
                const labels: Record<string, string> = {
                  openness: 'Öppenhet',
                  conscientiousness: 'Samvetsgrannhet',
                  extraversion: 'Extraversion',
                  agreeableness: 'Vänlighet',
                  neuroticism: 'Känslomässig stabilitet',
                }
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-700">{labels[key]}</span>
                      <span className="font-medium">{value as number}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Job Recommendations */}
          <div className="card">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Rekommenderade yrken</h3>
            <div className="space-y-2">
              {getJobRecommendations(result.hollandCode).map((job) => (
                <div key={job} className="p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-800">{job}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button onClick={reset} className="btn btn-outline">
            <RotateCcw size={20} />
            Gör testet igen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Intresseguide</h1>
        <p className="text-slate-600 mt-2">
          Svara på frågorna för att hitta yrken som passar dina intressen och personlighet.
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {allQuestions.map((_, index) => (
            <div
              key={index}
              className={`h-2 flex-1 mx-1 rounded-full ${
                index <= step ? 'bg-teal-600' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
        <p className="text-center text-sm text-slate-500">
          Del {step + 1} av {allQuestions.length}: {currentSection.title}
        </p>
      </div>

      {/* Questions */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
            <CurrentIcon size={24} className="text-teal-700" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800">{currentSection.title}</h2>
        </div>

        <div className="space-y-6">
          {currentSection.questions.map((question) => {
            const answer = getAnswer(question.id)
            return (
              <div key={question.id} className="border-b border-slate-100 pb-6 last:border-0">
                <p className="text-slate-800 mb-4">{question.text}</p>
                
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => handleAnswer(question.id, value)}
                      className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                        answer === value
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {value === 1 && 'Stämmer inte'}
                      {value === 2 && 'Stämmer lite'}
                      {value === 3 && 'Neutral'}
                      {value === 4 && 'Stämmer ganska'}
                      {value === 5 && 'Stämmer helt'}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
            className="btn btn-ghost"
          >
            <ChevronLeft size={20} />
            Föregående
          </button>

          {step < allQuestions.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="btn btn-primary"
            >
              Nästa
              <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="btn btn-secondary"
            >
              Se resultat
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function getJobRecommendations(hollandCode: string): string[] {
  const jobDatabase: Record<string, string[]> = {
    RIA: ['Maskiningenjör', 'Tekniker', 'Pilot', 'Mekaniker'],
    RIS: ['Fysioterapeut', 'Sjuksköterska', 'Brandman', 'Polis'],
    RAE: ['Arkitekt', 'Produktionschef', 'Byggledare'],
    IAS: ['Psykolog', 'Lärare', 'Forskare', 'Dataanalytiker'],
    IAR: ['Läkare', 'Apotekare', 'Biokemist'],
    ISE: ['HR-specialist', 'Konsult', 'Projektledare'],
    ASE: ['Journalist', 'PR-specialist', 'Eventkoordinator'],
    AES: ['Konstnär', 'Skådespelare', 'Musiker', 'Fotograf'],
    SAE: ['Socialarbetare', 'Lärare', 'Vårdare', 'Kurator'],
    SIA: ['Psykolog', 'Sociolog', 'Vägledare'],
    ECR: ['Revisor', 'Controller', 'Banktjänsteman'],
    ECS: ['Administratör', 'Kundtjänst', 'Receptionist'],
    ECA: ['Grafisk designer', 'Webbdesigner', 'Inredare'],
    CRS: ['Bokförare', 'Lagerarbetare', 'Kundtjänst'],
    CIS: ['Systemadministratör', 'Nätverkstekniker', 'Databasadministratör'],
  }

  // Försök hitta exakt match
  if (jobDatabase[hollandCode]) {
    return jobDatabase[hollandCode]
  }

  // Försök med första två bokstäverna
  const partialCode = hollandCode.slice(0, 2)
  const partialMatch = Object.keys(jobDatabase).find((code) =>
    code.startsWith(partialCode)
  )
  if (partialMatch) {
    return jobDatabase[partialMatch]
  }

  // Standardrekommendationer
  return ['Kundtjänstmedarbetare', 'Administratör', 'Säljare', 'Lagerarbetare']
}
