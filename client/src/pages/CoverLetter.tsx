import { useState, useEffect } from 'react'
import { coverLetterApi } from '../services/api'
import { Plus, FileText, Sparkles, Save, Copy, Check } from 'lucide-react'

export default function CoverLetter() {
  const [letters, setLetters] = useState<any[]>([])
  const [activeLetter, setActiveLetter] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    title: '',
    jobAd: '',
    styleReference: '',
    content: '',
  })

  useEffect(() => {
    loadLetters()
  }, [])

  const loadLetters = async () => {
    try {
      const data = await coverLetterApi.getAll()
      setLetters(data)
    } catch (error) {
      console.error('Fel vid laddning:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!formData.jobAd.trim()) return
    
    setIsGenerating(true)
    try {
      const result = await coverLetterApi.generate(formData.jobAd, formData.styleReference)
      setFormData({ ...formData, content: result.content })
    } catch (error) {
      console.error('Fel vid generering:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    try {
      if (activeLetter) {
        await coverLetterApi.update(activeLetter.id, formData)
      } else {
        const newLetter = await coverLetterApi.create(formData)
        setLetters([newLetter, ...letters])
        setActiveLetter(newLetter)
      }
    } catch (error) {
      console.error('Fel vid sparande:', error)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(formData.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const createNew = () => {
    setActiveLetter(null)
    setFormData({
      title: '',
      jobAd: '',
      styleReference: '',
      content: '',
    })
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Personligt brev-generator</h1>
        <p className="text-slate-600 mt-2">
          Skapa personliga brev med hjälp av AI. Klistra in jobbannonsen så skapar vi ett brev som matchar.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar - Saved letters */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Sparade brev</h3>
              <button
                onClick={createNew}
                className="p-2 text-teal-700 hover:bg-teal-50 rounded-lg"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="space-y-2">
              {letters.length === 0 ? (
                <p className="text-slate-500 text-sm">Inga sparade brev ännu</p>
              ) : (
                letters.map((letter) => (
                  <button
                    key={letter.id}
                    onClick={() => {
                      setActiveLetter(letter)
                      setFormData({
                        title: letter.title,
                        jobAd: letter.jobAd,
                        styleReference: letter.styleReference || '',
                        content: letter.content,
                      })
                    }}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      activeLetter?.id === letter.id
                        ? 'bg-teal-50 border border-teal-200'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-slate-400" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">{letter.title}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(letter.createdAt).toLocaleDateString('sv-SE')}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="label">Titel / Företag</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  placeholder="t.ex. Applikation till Company AB"
                />
              </div>

              {/* Job Ad */}
              <div>
                <label className="label">Jobbannons * </label>
                <textarea
                  value={formData.jobAd}
                  onChange={(e) => setFormData({ ...formData, jobAd: e.target.value })}
                  className="input min-h-[150px]"
                  placeholder="Klistra in hela jobbannonsen här..."
                />
                <p className="text-sm text-slate-500 mt-2">
                  Ju mer information du ger, desto bättre blir resultatet.
                </p>
              </div>

              {/* Style Reference */}
              <div>
                <label className="label">Tidigare personligt brev (valfritt)</label>
                <textarea
                  value={formData.styleReference}
                  onChange={(e) => setFormData({ ...formData, styleReference: e.target.value })}
                  className="input min-h-[100px]"
                  placeholder="Klistra in ett tidigare brev som inspiration för ton och stil..."
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !formData.jobAd.trim()}
                className="w-full btn btn-secondary py-3"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Genererar...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Generera personligt brev
                  </>
                )}
              </button>

              {/* Generated Content */}
              {formData.content && (
                <div className="mt-6">
                  <label className="label">Genererat brev</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="input min-h-[300px] font-serif"
                  />

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleCopy}
                      className="btn btn-outline"
                    >
                      {copied ? <Check size={20} /> : <Copy size={20} />}
                      {copied ? 'Kopierat!' : 'Kopiera'}
                    </button>

                    <button
                      onClick={handleSave}
                      className="btn btn-primary"
                    >
                      <Save size={20} />
                      Spara brev
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
