import { useState, useEffect } from 'react'
import { userApi } from '../services/api'
import { User, Save, CheckCircle, Camera, Phone, MapPin, Mail, Loader2 } from 'lucide-react'

export default function Profile() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    location: '',
    bio: ''
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await userApi.getProfile()
      setProfile(data)
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone: data.phone || '',
        location: data.location || '',
        bio: data.bio || ''
      })
    } catch (err: any) {
      console.error('Fel vid laddning:', err)
      setError('Kunde inte ladda profilen. Försök igen.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await userApi.updateProfile(formData)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      console.error('Fel vid sparande:', err)
      setError('Kunde inte spara ändringarna. Försök igen.')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700"></div>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={loadProfile} className="btn btn-primary">
            Försök igen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Din profil</h1>
        <p className="text-slate-600 mt-2">
          Hantera dina kontouppgifter och personliga information.
        </p>
      </div>

      {/* Profile Card */}
      <div className="card mb-6">
        {/* Profile Header with Avatar */}
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-6 border-b border-slate-200">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center shadow-inner">
              <User size={48} className="text-teal-700" />
            </div>
            <button 
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-teal-600 hover:bg-teal-700 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
              title="Ladda upp profilbild (kommer snart)"
              onClick={() => alert('Profilbildsuppladdning kommer snart!')}
            >
              <Camera size={14} />
            </button>
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-semibold text-slate-800">
              {profile?.first_name} {profile?.last_name}
            </h2>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-500 mt-1">
              <Mail size={14} />
              <span>{profile?.email || 'Ingen e-post'}</span>
            </div>
            <p className="text-sm text-slate-400 mt-2">
              Medlem sedan {new Date(profile?.created_at).toLocaleDateString('sv-SE')}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-2">
                <User size={14} className="text-slate-400" />
                Förnamn
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                className="input"
                placeholder="Ditt förnamn"
              />
            </div>
            <div>
              <label className="label flex items-center gap-2">
                <User size={14} className="text-slate-400" />
                Efternamn
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                className="input"
                placeholder="Ditt efternamn"
              />
            </div>
          </div>

          {/* Contact Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-2">
                <Phone size={14} className="text-slate-400" />
                Telefonnummer
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="input"
                placeholder="+46 70 123 45 67"
              />
            </div>
            <div>
              <label className="label flex items-center gap-2">
                <MapPin size={14} className="text-slate-400" />
                Ort / Plats
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className="input"
                placeholder="Stockholm"
              />
            </div>
          </div>

          {/* Bio Field */}
          <div>
            <label className="label">Om mig</label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              className="input min-h-[100px] resize-none"
              placeholder="Berätta kort om dig själv..."
              rows={3}
            />
            <p className="text-sm text-slate-400 mt-1">
              Max 500 tecken (visas på din offentliga profil)
            </p>
          </div>

          {/* Email Field (Read-only) */}
          <div>
            <label className="label flex items-center gap-2">
              <Mail size={14} className="text-slate-400" />
              E-post
            </label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="input bg-slate-100 text-slate-500 cursor-not-allowed"
            />
            <p className="text-sm text-slate-500 mt-1">
              E-postadressen kan inte ändras. Kontakta support om du behöver byta.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Save Button */}
          <div className="pt-4 border-t border-slate-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary w-full sm:w-auto min-w-[160px]"
            >
              {saving ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Sparar...
                </>
              ) : saved ? (
                <>
                  <CheckCircle size={20} />
                  Sparat!
                </>
              ) : (
                <>
                  <Save size={20} />
                  Spara ändringar
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center hover:shadow-md transition-shadow">
          <div className="text-3xl font-bold text-teal-700 mb-1">
            {profile?._count?.cv !== undefined ? profile._count.cv : '—'}
          </div>
          <p className="text-slate-600 text-sm">CV-uppdateringar</p>
        </div>
        
        <div className="card text-center hover:shadow-md transition-shadow">
          <div className="text-3xl font-bold text-teal-700 mb-1">
            {profile?._count?.coverLetters !== undefined ? profile._count.coverLetters : '—'}
          </div>
          <p className="text-slate-600 text-sm">Personliga brev</p>
        </div>
        
        <div className="card text-center hover:shadow-md transition-shadow">
          <div className="text-3xl font-bold text-teal-700 mb-1">
            {profile?.interestResult ? '✓' : '—'}
          </div>
          <p className="text-slate-600 text-sm">Intresseguide</p>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">💡 Tips för en bra profil</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>Fyll i alla fält för att arbetsförmedlare ska kunna kontakta dig</li>
          <li>En kort bio hjälper arbetsgivare att lära känna dig</li>
          <li>Uppdatera din profil regelbundet med aktuell information</li>
        </ul>
      </div>
    </div>
  )
}
