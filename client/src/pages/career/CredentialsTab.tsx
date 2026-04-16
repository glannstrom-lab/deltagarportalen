/**
 * Credentials Tab - Track certifications and education requirements
 */
import { useState, useEffect } from 'react'
import { GraduationCap, CheckCircle, Circle, Plus, Trash2, ExternalLink, Calendar, Award, BookOpen } from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Credential {
  id: string
  name: string
  issuer: string
  status: 'planned' | 'in-progress' | 'completed'
  type: 'certification' | 'degree' | 'course' | 'license'
  targetDate?: string
  completedDate?: string
  url?: string
}

const POPULAR_CREDENTIALS = [
  { name: 'Google Analytics Certification', issuer: 'Google', type: 'certification' as const },
  { name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon', type: 'certification' as const },
  { name: 'Scrum Master Certification', issuer: 'Scrum.org', type: 'certification' as const },
  { name: 'Project Management Professional (PMP)', issuer: 'PMI', type: 'certification' as const },
  { name: 'PRINCE2 Foundation', issuer: 'Axelos', type: 'certification' as const },
  { name: 'Microsoft Azure Fundamentals', issuer: 'Microsoft', type: 'certification' as const },
  { name: 'HubSpot Inbound Marketing', issuer: 'HubSpot', type: 'certification' as const },
  { name: 'SFI - Svenska för invandrare', issuer: 'Kommun', type: 'course' as const },
]

const CREDENTIAL_TYPES = {
  certification: { label: 'Certifiering', color: 'violet' },
  degree: { label: 'Examen', color: 'blue' },
  course: { label: 'Kurs', color: 'emerald' },
  license: { label: 'Licens', color: 'amber' },
}

export default function CredentialsTab() {
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    issuer: '',
    type: 'certification' as Credential['type'],
    targetDate: '',
  })

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('user-credentials')
    if (saved) {
      setCredentials(JSON.parse(saved))
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('user-credentials', JSON.stringify(credentials))
  }, [credentials])

  const handleAdd = () => {
    if (!formData.name.trim()) return

    const newCredential: Credential = {
      id: Date.now().toString(),
      name: formData.name,
      issuer: formData.issuer,
      type: formData.type,
      status: 'planned',
      targetDate: formData.targetDate || undefined,
    }

    setCredentials(prev => [...prev, newCredential])
    setFormData({ name: '', issuer: '', type: 'certification', targetDate: '' })
    setIsAdding(false)
  }

  const handleAddPopular = (cred: typeof POPULAR_CREDENTIALS[0]) => {
    const newCredential: Credential = {
      id: Date.now().toString(),
      name: cred.name,
      issuer: cred.issuer,
      type: cred.type,
      status: 'planned',
    }
    setCredentials(prev => [...prev, newCredential])
  }

  const updateStatus = (id: string, status: Credential['status']) => {
    setCredentials(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          status,
          completedDate: status === 'completed' ? new Date().toISOString().split('T')[0] : undefined,
        }
      }
      return c
    }))
  }

  const deleteCredential = (id: string) => {
    setCredentials(prev => prev.filter(c => c.id !== id))
  }

  const stats = {
    completed: credentials.filter(c => c.status === 'completed').length,
    inProgress: credentials.filter(c => c.status === 'in-progress').length,
    planned: credentials.filter(c => c.status === 'planned').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-teal-50 to-violet-50 dark:from-teal-900/20 dark:to-violet-900/20 border-teal-100 dark:border-teal-800">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Mina Credentials</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Håll koll på certifieringar, utbildningar och licenser du har eller planerar att ta.
            </p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      {credentials.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.completed}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Avslutade</p>
          </Card>
          <Card className="text-center bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.inProgress}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pågående</p>
          </Card>
          <Card className="text-center bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.planned}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Planerade</p>
          </Card>
        </div>
      )}

      {/* Add form */}
      {isAdding ? (
        <Card className="border-teal-200 dark:border-teal-700 bg-white dark:bg-stone-800">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Lägg till credential</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Namn *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="T.ex. AWS Cloud Practitioner"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Utfärdare</label>
                <input
                  type="text"
                  value={formData.issuer}
                  onChange={(e) => setFormData(prev => ({ ...prev, issuer: e.target.value }))}
                  className="w-full px-3 py-2 border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="T.ex. Amazon"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Typ</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Credential['type'] }))}
                  className="w-full px-3 py-2 border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 text-gray-800 dark:text-gray-100"
                >
                  {Object.entries(CREDENTIAL_TYPES).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Måldatum (valfritt)</label>
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
                className="w-full px-3 py-2 border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 text-gray-800 dark:text-gray-100"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={!formData.name.trim()} className="bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-700">
                Lägg till
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Avbryt
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Button onClick={() => setIsAdding(true)} className="bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-700">
          <Plus className="w-4 h-4 mr-1" />
          Lägg till credential
        </Button>
      )}

      {/* My credentials */}
      {credentials.length > 0 && (
        <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Mina credentials</h3>
          <div className="space-y-3">
            {credentials.map((cred) => {
              const typeInfo = CREDENTIAL_TYPES[cred.type]
              return (
                <div
                  key={cred.id}
                  className={cn(
                    "p-4 rounded-xl border transition-all",
                    cred.status === 'completed' && "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
                    cred.status === 'in-progress' && "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
                    cred.status === 'planned' && "bg-stone-50 dark:bg-stone-700 border-stone-200 dark:border-stone-600"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        cred.status === 'completed' && "bg-emerald-100 dark:bg-emerald-900/30",
                        cred.status === 'in-progress' && "bg-amber-100 dark:bg-amber-900/30",
                        cred.status === 'planned' && "bg-stone-100 dark:bg-stone-600"
                      )}>
                        {cred.status === 'completed' ? (
                          <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : cred.status === 'in-progress' ? (
                          <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <GraduationCap className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-gray-100">{cred.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{cred.issuer}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            typeInfo.color === 'violet' && "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300",
                            typeInfo.color === 'blue' && "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
                            typeInfo.color === 'emerald' && "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
                            typeInfo.color === 'amber' && "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                          )}>
                            {typeInfo.label}
                          </span>
                          {cred.targetDate && cred.status !== 'completed' && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Mål: {cred.targetDate}
                            </span>
                          )}
                          {cred.completedDate && (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Klar: {cred.completedDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteCredential(cred.id)}
                      className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded text-rose-400 hover:text-rose-600 dark:hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Status buttons */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100 dark:border-stone-600">
                    <button
                      onClick={() => updateStatus(cred.id, 'planned')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        cred.status === 'planned'
                          ? "bg-gray-600 text-white"
                          : "bg-stone-100 dark:bg-stone-600 text-gray-600 dark:text-gray-300 hover:bg-stone-200 dark:hover:bg-stone-500"
                      )}
                    >
                      Planerad
                    </button>
                    <button
                      onClick={() => updateStatus(cred.id, 'in-progress')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        cred.status === 'in-progress'
                          ? "bg-amber-600 text-white"
                          : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50"
                      )}
                    >
                      Pågående
                    </button>
                    <button
                      onClick={() => updateStatus(cred.id, 'completed')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        cred.status === 'completed'
                          ? "bg-emerald-600 text-white"
                          : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
                      )}
                    >
                      Avslutad
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Popular suggestions */}
      <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Populära certifieringar</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {POPULAR_CREDENTIALS.filter(p => !credentials.find(c => c.name === p.name)).slice(0, 6).map((cred) => (
            <button
              key={cred.name}
              onClick={() => handleAddPopular(cred)}
              className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-teal-300 dark:hover:border-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all text-left group"
            >
              <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center group-hover:bg-teal-200 dark:group-hover:bg-teal-900/50">
                <Plus className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 dark:text-gray-100 text-sm truncate">{cred.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{cred.issuer}</p>
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
