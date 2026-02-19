import { useState, useEffect } from 'react'
import { userApi } from '../services/api'
import { User, Save, CheckCircle } from 'lucide-react'

export default function Profile() {
  const [profile, setProfile] = useState<any>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const data = await userApi.getMe()
      setProfile(data)
      setFormData({
        firstName: data.firstName,
        lastName: data.lastName,
      })
    } catch (error) {
      console.error('Fel vid laddning:', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await userApi.updateMe(formData)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Fel vid sparande:', error)
    } finally {
      setSaving(false)
    }
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Din profil</h1>
        <p className="text-slate-600 mt-2">
          Hantera dina kontouppgifter.
        </p>
      </div>

      <div className="card">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center">
            <User size={40} className="text-teal-700" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-slate-500">{profile.email}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Förnamn</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Efternamn</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">E-post</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="input bg-slate-100"
            />
            <p className="text-sm text-slate-500 mt-1">E-post kan inte ändras</p>
          </div>

          <div className="pt-6 border-t border-slate-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary"
            >
              {saved ? (
                <>
                  <CheckCircle size={20} />
                  Sparat!
                </>
              ) : (
                <>
                  <Save size={20} />
                  {saving ? 'Sparar...' : 'Spara ändringar'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="card text-center">
          <div className="text-3xl font-bold text-teal-700 mb-1">{profile._count?.cv || 0}</div>
          <p className="text-slate-600">CV-uppdateringar</p>
        </div>
        
        <div className="card text-center">
          <div className="text-3xl font-bold text-teal-700 mb-1">{profile._count?.coverLetters || 0}</div>
          <p className="text-slate-600">Personliga brev</p>
        </div>
        
        <div className="card text-center">
          <div className="text-3xl font-bold text-teal-700 mb-1">
            {profile.interestResult ? '✓' : '—'}
          </div>
          <p className="text-slate-600">Intresseguide</p>
        </div>
      </div>
    </div>
  )
}
