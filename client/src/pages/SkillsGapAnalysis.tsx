import { useState } from 'react'
import { Target, Search, TrendingUp, AlertCircle, CheckCircle, BookOpen, Sparkles, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function SkillsGapAnalysis() {
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
        <h1 className="text-2xl font-bold text-slate-800">Kompetensgap-analys</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Jämför ditt nuvarande CV med ditt drömjobb och få en konkret plan för vad du behöver utveckla.
        </p>
      </div>

      {/* Input */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-slate-600" />
            </div>
            <h2 className="font-semibold text-slate-800">Din nuvarande profil</h2>
          </div>
          <textarea
            value={cvText}
            onChange={(e) => setCvText(e.target.value)}
            placeholder="Klistra in ditt CV här (eller skriv en kort sammanfattning av din bakgrund, erfarenhet och kompetenser)..."
            rows={10}
            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none resize-y"
          />
          <p className="text-xs text-slate-500 mt-2">
            💡 Ju mer detaljerad information, desto bättre analys!
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-semibold text-slate-800">Ditt drömjobb</h2>
          </div>
          <textarea
            value={dromjobb}
            onChange={(e) => setDromjobb(e.target.value)}
            placeholder="Klistra in en jobbannons för ditt drömjobb, eller beskriv rollen...\n\nExempel:\nVi söker en erfaren Projektledare med..."
            rows={10}
            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none resize-y"
          />
          <p className="text-xs text-slate-500 mt-2">
            💡 Använd en riktig jobbannons för bästa resultat!
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
              Analysera gapet
            </>
          )}
        </Button>
      </div>

      {/* Resultat */}
      {analys && (
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            Din kompetensanalys
          </h2>
          <div className="bg-white p-6 rounded-lg border border-purple-100">
            <pre className="whitespace-pre-wrap text-slate-700 font-sans leading-relaxed">
              {analys.text}
            </pre>
          </div>
          
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-purple-100">
              <BookOpen className="w-8 h-8 text-purple-500 mb-2" />
              <h3 className="font-semibold text-slate-800 mb-1">Utbildning</h3>
              <p className="text-sm text-slate-600">Överväg kurser eller certifieringar</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-purple-100">
              <TrendingUp className="w-8 h-8 text-pink-500 mb-2" />
              <h3 className="font-semibold text-slate-800 mb-1">Erfarenhet</h3>
              <p className="text-sm text-slate-600">Bygg portfolio med projekt</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-purple-100">
              <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
              <h3 className="font-semibold text-slate-800 mb-1">Tidslinje</h3>
              <p className="text-sm text-slate-600">Sätt realistiska mål</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
