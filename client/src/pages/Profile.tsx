import { useState, useEffect } from 'react'
import { userApi } from '../services/api'
import { 
  User, Save, CheckCircle, Camera, Phone, MapPin, Mail,
  FileText, Sparkles, Lightbulb
} from 'lucide-react'
import { PageLayout } from '@/components/layout/index'
import { 
  Card, 
  CardHeader, 
  CardSection,
  Input, 
  Textarea,
  Button,
  LoadingState,
  ErrorState,
  InfoCard,
  StatCard
} from '@/components/ui'
import { cn } from '@/lib/utils'

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
      <PageLayout title="Din profil" showTabs={false}>
        <LoadingState 
          title="Laddar profil..."
          message="Hämtar dina uppgifter"
          fullHeight
        />
      </PageLayout>
    )
  }

  if (error && !profile) {
    return (
      <PageLayout title="Din profil" showTabs={false}>
        <ErrorState 
          title="Kunde inte ladda profilen"
          message={error}
          onRetry={loadProfile}
        />
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="Din profil"
      description="Hantera dina kontouppgifter och personliga information."
      showTabs={false}
      className="max-w-3xl mx-auto"
    >
      {/* Profile Card */}
      <Card variant="elevated">
        {/* Profile Header with Avatar */}
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-6 border-b border-slate-100">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-full flex items-center justify-center shadow-inner">
              <User size={48} className="text-indigo-600" />
            </div>
            <button 
              className={cn(
                'absolute -bottom-1 -right-1 w-8 h-8',
                'bg-indigo-600 hover:bg-indigo-700 text-white',
                'rounded-full flex items-center justify-center shadow-md',
                'transition-colors'
              )}
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
          <CardSection title="Personlig information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Förnamn"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                placeholder="Ditt förnamn"
                leftIcon={<User size={16} />}
              />
              <Input
                label="Efternamn"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                placeholder="Ditt efternamn"
                leftIcon={<User size={16} />}
              />
            </div>
          </CardSection>

          {/* Contact Fields */}
          <CardSection title="Kontaktuppgifter">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Telefonnummer"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+46 70 123 45 67"
                leftIcon={<Phone size={16} />}
              />
              <Input
                label="Ort / Plats"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="Stockholm"
                leftIcon={<MapPin size={16} />}
              />
            </div>
          </CardSection>

          {/* Bio Field */}
          <CardSection title="Om mig">
            <Textarea
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              placeholder="Berätta kort om dig själv..."
              hint="Max 500 tecken (visas på din offentliga profil)"
              maxLength={500}
            />
          </CardSection>

          {/* Email Field (Read-only) */}
          <CardSection>
            <Input
              label="E-post"
              type="email"
              value={profile?.email || ''}
              disabled
              leftIcon={<Mail size={16} />}
              hint="E-postadressen kan inte ändras. Kontakta support om du behöver byta."
            />
          </CardSection>

          {/* Error Message */}
          {error && (
            <InfoCard variant="error" title="Ett fel uppstod">
              {error}
            </InfoCard>
          )}

          {/* Success Message */}
          {saved && (
            <InfoCard variant="success" title="Sparat!">
              Dina ändringar har sparats.
            </InfoCard>
          )}

          {/* Save Button */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              onClick={handleSave}
              isLoading={saving}
              loadingText="Sparar..."
              leftIcon={saved ? <CheckCircle size={18} /> : <Save size={18} />}
              touchOptimized
            >
              {saved ? 'Sparat!' : 'Spara ändringar'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          value={profile?._count?.cv !== undefined ? profile._count.cv : '—'}
          label="CV-uppdateringar"
          icon={<FileText className="w-5 h-5" />}
          color="indigo"
        />
        <StatCard
          value={profile?._count?.coverLetters !== undefined ? profile._count.coverLetters : '—'}
          label="Personliga brev"
          icon={<FileText className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          value={profile?.interestResult ? '✓' : '—'}
          label="Intresseguide"
          icon={<Sparkles className="w-5 h-5" />}
          color="amber"
        />
      </div>

      {/* Quick Tips */}
      <InfoCard 
        variant="info" 
        icon={<Lightbulb className="w-5 h-5" />}
        title="Tips för en bra profil"
      >
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>Fyll i alla fält för att arbetsförmedlare ska kunna kontakta dig</li>
          <li>En kort bio hjälper arbetsgivare att lära känna dig</li>
          <li>Uppdatera din profil regelbundet med aktuell information</li>
        </ul>
      </InfoCard>
    </PageLayout>
  )
}
