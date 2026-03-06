import { useState } from 'react'
import { Linkedin, Copy, Check, Sparkles, RefreshCw, User, FileText, Share2, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

const AI_SERVER_URL = import.meta.env.VITE_AI_SERVER_URL || 'http://localhost:3002'

export default function LinkedInOptimizer() {
  const [aktivTab, setAktivTab] = useState<'headline' | 'about' | 'post' | 'connection'>('headline')
  const [formData, setFormData] = useState({
    headline: { yrke: '', erfarenhet: '' },
    about: { bakgrund: '', styrkor: '', mal: '' },
    post: { amne: '', ton: 'professionell' },
    connection: { namn: '', roll: '', syfte: '' }
  })
  const [resultat, setResultat] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const generera = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${AI_SERVER_URL}/api/ai/linkedin-optimering`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typ: aktivTab,
          data: formData[aktivTab]
        })
      })
      
      if (!response.ok) throw new Error('AI error')
      const data = await response.json()
      setResultat(data.text)
    } catch (error) {
      // Fallback
      const fallbacks: Record<string, string> = {
        headline: `${formData.headline.yrke} | Erfaren specialist inom ${formData.headline.erfarenhet || 'branschen'}`,
        about: `Jag är en driven ${formData.about.bakgrund} med passion för ${formData.about.styrkor}. ${formData.about.mal}`,
        post: `Idag vill jag dela med mig av mina tankar om ${formData.post.amne}. Vad tycker ni?`,
        connection: `Hej ${formData.connection.namn}! Jag såg att du arbetar som ${formData.connection.roll} och skulle gärna vilja connecta. ${formData.connection.syfte}`
      }
      setResultat(fallbacks[aktivTab] || 'Kunde inte generera text. Försök igen.')
    } finally {
      setIsLoading(false)
    }
  }

  const kopiera = () => {
    navigator.clipboard.writeText(resultat)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tabs = [
    { id: 'headline', label: 'Headline', icon: User, beskrivning: 'Skapa en catchy profilrubrik' },
    { id: 'about', label: 'About', icon: FileText, beskrivning: 'Skriv en övertygande bio' },
    { id: 'post', label: 'Inlägg', icon: Share2, beskrivning: 'Skapa engagerande inlägg' },
    { id: 'connection', label: 'Kontakt', icon: MessageSquare, beskrivning: 'Nätverka smart' }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 mb-2">
          <Linkedin className="w-7 h-7 text-blue-700" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">LinkedIn-optimerare</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Gör din LinkedIn-profil mer synlig och professionell med AI-genererade texter.
        </p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setAktivTab(tab.id as any); setResultat(''); }}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              aktivTab === tab.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-blue-200 bg-white'
            }`}
          >
            <tab.icon className={`w-6 h-6 mb-2 ${aktivTab === tab.id ? 'text-blue-600' : 'text-slate-400'}`} />
            <div className="font-medium text-slate-800">{tab.label}</div>
            <div className="text-xs text-slate-500 mt-1">{tab.beskrivning}</div>
          </button>
        ))}
      </div>

      {/* Form */}
      <Card className="p-6">
        {aktivTab === 'headline' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Skapa Headline</h2>
            <p className="text-sm text-slate-600">Din headline syns direkt under ditt namn. Gör den beskrivande och catchy!</p>
            <input
              type="text"
              placeholder="Din yrkestitel (t.ex. Projektledare)"
              value={formData.headline.yrke}
              onChange={(e) => setFormData({ ...formData, headline: { ...formData.headline, yrke: e.target.value } })}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
            />
            <input
              type="text"
              placeholder="Specialisering (t.ex. Digitala transformationer)"
              value={formData.headline.erfarenhet}
              onChange={(e) => setFormData({ ...formData, headline: { ...formData.headline, erfarenhet: e.target.value } })}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
            />
          </div>
        )}

        {aktivTab === 'about' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Skriv About-sektion</h2>
            <p className="text-sm text-slate-600">Berätta vem du är och vad du gör. Max 2000 tecken.</p>
            <textarea
              placeholder="Din bakgrund och erfarenhet..."
              value={formData.about.bakgrund}
              onChange={(e) => setFormData({ ...formData, about: { ...formData.about, bakgrund: e.target.value } })}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-y"
            />
            <textarea
              placeholder="Dina styrkor och vad du brinner för..."
              value={formData.about.styrkor}
              onChange={(e) => setFormData({ ...formData, about: { ...formData.about, styrkor: e.target.value } })}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-y"
            />
            <input
              type="text"
              placeholder="Dina karriärmål..."
              value={formData.about.mal}
              onChange={(e) => setFormData({ ...formData, about: { ...formData.about, mal: e.target.value } })}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
            />
          </div>
        )}

        {aktivTab === 'post' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Skapa LinkedIn-inlägg</h2>
            <p className="text-sm text-slate-600">Engagerande inlägg ökar din synlighet. Max 1300 tecken.</p>
            <textarea
              placeholder="Vad vill du skriva om? (t.ex. 'Erfarenheter från mitt senaste projekt')"
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
              <option value="professionell">Professionell</option>
              <option value="personlig">Personlig & reflekterande</option>
              <option value="entusiastisk">Entusiastisk</option>
              <option value="formell">Formell</option>
            </select>
          </div>
        )}

        {aktivTab === 'connection' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Nätverka - Kontaktmeddelande</h2>
            <p className="text-sm text-slate-600">Ett personligt meddelande ökar chansen att bli accepterad.</p>
            <input
              type="text"
              placeholder="Personens namn"
              value={formData.connection.namn}
              onChange={(e) => setFormData({ ...formData, connection: { ...formData.connection, namn: e.target.value } })}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
            />
            <input
              type="text"
              placeholder="Personens roll (t.ex. HR-chef på Volvo)"
              value={formData.connection.roll}
              onChange={(e) => setFormData({ ...formData, connection: { ...formData.connection, roll: e.target.value } })}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
            />
            <textarea
              placeholder="Varför vill du connecta? (t.ex. 'Jag beundrar ditt arbete inom...')"
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
              Generera med AI
            </>
          )}
        </Button>
      </Card>

      {/* Resultat */}
      {resultat && (
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Din LinkedIn-text</h3>
            <button
              onClick={kopiera}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Kopierat!' : 'Kopiera'}
            </button>
          </div>
          <div className="bg-white p-4 rounded-lg border border-blue-100">
            <p className="text-slate-700 whitespace-pre-wrap">{resultat}</p>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            💡 Tips: Anpassa texten efter din personliga stil innan du publicerar!
          </p>
        </Card>
      )}
    </div>
  )
}
