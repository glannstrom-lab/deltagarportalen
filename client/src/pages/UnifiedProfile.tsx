/**
 * UnifiedProfilePage - Fas 2
 * 
 * Single source of truth för all profilinformation.
 * Sammanfogar data från CV, intresseguide, grundprofil, etc.
 */

import { useState, useEffect, useRef } from 'react'
import { 
  User, Briefcase, MapPin, Mail, Phone, 
  Edit2, Save, X, Camera, CheckCircle2,
  Target, Sparkles, GraduationCap, Award,
  TrendingUp, ChevronRight, Loader2
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { unifiedProfileApi, type UnifiedProfileData } from '@/services/unifiedProfileApi'
import { ImageUpload } from '@/components/ImageUpload'

export default function UnifiedProfilePage() {
  const [profile, setProfile] = useState<Partial<UnifiedProfileData>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'career' | 'settings'>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [editedCore, setEditedCore] = useState<Partial<UnifiedProfileData['core']>>({})

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setLoading(true)
    const data = await unifiedProfileApi.getProfile()
    setProfile(data)
    setEditedCore(data.core || {})
    setLoading(false)
  }

  const handleSaveCore = async () => {
    setSaving(true)
    try {
      await unifiedProfileApi.updateCore(editedCore)
      await loadProfile()
      setIsEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (url: string) => {
    await unifiedProfileApi.updateCore({ ...profile.core, profileImageUrl: url })
    await loadProfile()
  }

  const completeness = unifiedProfileApi.calculateCompleteness(profile)

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 size={32} className="animate-spin text-violet-500" />
        </div>
      </div>
    )
  }

  const { core, professional, career, usage } = profile

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        {/* Cover / Banner */}
        <div className="h-32 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />
        
        {/* Profile Info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 -mt-12">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl border-4 border-white bg-white shadow-lg overflow-hidden">
                {core?.profileImageUrl ? (
                  <img 
                    src={core.profileImageUrl} 
                    alt="Profilbild"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                    <User size={40} className="text-slate-400" />
                  </div>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-violet-500 text-white rounded-full flex items-center justify-center cursor-pointer shadow-md hover:bg-violet-600 transition-colors">
                <Camera size={14} />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const url = await unifiedProfileApi.uploadProfileImage(file)
                      handleImageUpload(url)
                    }
                  }}
                />
              </label>
            </div>

            {/* Name & Title */}
            <div className="flex-1 pt-2 sm:pt-4">
              <h1 className="text-2xl font-bold text-slate-900">
                {core?.firstName} {core?.lastName}
              </h1>
              <p className="text-slate-500 flex flex-wrap items-center gap-3 mt-1">
                {core?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {core.location}
                  </span>
                )}
                {core?.email && (
                  <span className="flex items-center gap-1">
                    <Mail size={14} />
                    {core.email}
                  </span>
                )}
              </p>
            </div>

            {/* Edit Button */}
            <div className="pt-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <Edit2 size={16} />
                  Redigera
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setEditedCore(core || {})
                    }}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                  >
                    <X size={18} />
                  </button>
                  <button
                    onClick={handleSaveCore}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50 transition-colors"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Spara
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Completeness Bar */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">
                Profilkompletthet
              </span>
              <span className={cn(
                "text-sm font-bold",
                completeness >= 80 ? "text-green-600" :
                completeness >= 50 ? "text-amber-600" : "text-rose-600"
              )}>
                {completeness}%
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-500",
                  completeness >= 80 ? "bg-green-500" :
                  completeness >= 50 ? "bg-amber-500" : "bg-rose-500"
                )}
                style={{ width: `${completeness}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              {completeness < 100 
                ? "Fyll i mer information för att förbättra dina chanser till jobb"
                : "Bra jobbat! Din profil är komplett"
              }
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200">
        {[
          { id: 'profile', label: 'Profil', icon: User },
          { id: 'career', label: 'Karriär', icon: Target },
          { id: 'settings', label: 'Inställningar', icon: Award },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.id
                ? "text-violet-600 border-violet-600"
                : "text-slate-600 border-transparent hover:text-slate-900"
            )}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'profile' && (
          <>
            {/* Core Info */}
            <Section title="Grundinformation" icon={User}>
              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Förnamn"
                    value={editedCore.firstName || ''}
                    onChange={(v) => setEditedCore(prev => ({ ...prev, firstName: v }))}
                  />
                  <Input
                    label="Efternamn"
                    value={editedCore.lastName || ''}
                    onChange={(v) => setEditedCore(prev => ({ ...prev, lastName: v }))}
                  />
                  <Input
                    label="E-post"
                    type="email"
                    value={editedCore.email || ''}
                    onChange={(v) => setEditedCore(prev => ({ ...prev, email: v }))}
                  />
                  <Input
                    label="Telefon"
                    value={editedCore.phone || ''}
                    onChange={(v) => setEditedCore(prev => ({ ...prev, phone: v }))}
                  />
                  <Input
                    label="Ort"
                    value={editedCore.location || ''}
                    onChange={(v) => setEditedCore(prev => ({ ...prev, location: v }))}
                    placeholder="t.ex. Stockholm"
                  />
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Sammanfattning
                    </label>
                    <textarea
                      value={editedCore.summary || ''}
                      onChange={(e) => setEditedCore(prev => ({ ...prev, summary: e.target.value }))}
                      placeholder="Beskriv kortfattat vem du är och vad du söker..."
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoItem label="Förnamn" value={core?.firstName} />
                  <InfoItem label="Efternamn" value={core?.lastName} />
                  <InfoItem label="E-post" value={core?.email} />
                  <InfoItem label="Telefon" value={core?.phone} />
                  <InfoItem label="Ort" value={core?.location} />
                  <div className="sm:col-span-2">
                    <InfoItem label="Sammanfattning" value={core?.summary} />
                  </div>
                </div>
              )}
            </Section>

            {/* Skills */}
            <Section title="Kompetenser" icon={Sparkles}>
              <div className="flex flex-wrap gap-2">
                {professional?.skills?.map((skill, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
                {(!professional?.skills || professional.skills.length === 0) && (
                  <p className="text-slate-500 text-sm">
                    Inga kompetenser tillagda ännu.{' '}
                    <Link to="/cv" className="text-violet-600 hover:underline">
                      Lägg till i CV-byggaren
                    </Link>
                  </p>
                )}
              </div>
            </Section>

            {/* Experience Preview */}
            <Section title="Arbetslivserfarenhet" icon={Briefcase}>
              {professional?.workExperience && professional.workExperience.length > 0 ? (
                <div className="space-y-3">
                  {professional.workExperience.slice(0, 3).map((exp, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Briefcase size={18} className="text-slate-500" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{exp.title}</p>
                        <p className="text-sm text-slate-500">{exp.company}</p>
                      </div>
                    </div>
                  ))}
                  {professional.workExperience.length > 3 && (
                    <Link 
                      to="/cv"
                      className="text-sm text-violet-600 hover:underline flex items-center gap-1"
                    >
                      Se alla {professional.workExperience.length} erfarenheter
                      <ChevronRight size={14} />
                    </Link>
                  )}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">
                  Ingen erfarenhet tillagd ännu.{' '}
                  <Link to="/cv" className="text-violet-600 hover:underline">
                    Lägg till i CV-byggaren
                  </Link>
                </p>
              )}
            </Section>

            {/* Education Preview */}
            <Section title="Utbildning" icon={GraduationCap}>
              {professional?.education && professional.education.length > 0 ? (
                <div className="space-y-3">
                  {professional.education.slice(0, 2).map((edu, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <GraduationCap size={18} className="text-slate-500" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{edu.degree}</p>
                        <p className="text-sm text-slate-500">{edu.school}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">
                  Ingen utbildning tillagd ännu.{' '}
                  <Link to="/cv" className="text-violet-600 hover:underline">
                    Lägg till i CV-byggaren
                  </Link>
                </p>
              )}
            </Section>
          </>
        )}

        {activeTab === 'career' && (
          <>
            {/* Interest Guide Results */}
            <Section title="Mina Intressen (RIASEC)" icon={Sparkles}>
              {career?.riasecScores ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(career.riasecScores).map(([type, score]) => (
                      <div 
                        key={type}
                        className="bg-slate-50 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium capitalize text-slate-700">
                            {type === 'realistic' ? 'Realistisk' :
                             type === 'investigative' ? 'Undersökande' :
                             type === 'artistic' ? 'Konstnärlig' :
                             type === 'social' ? 'Social' :
                             type === 'enterprising' ? 'Företagsam' :
                             'Konventionell'}
                          </span>
                          <span className="text-sm font-bold text-violet-600">
                            {Math.round(score * 100)}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-violet-500 rounded-full"
                            style={{ width: `${score * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link 
                    to="/interest-guide"
                    className="text-sm text-violet-600 hover:underline"
                  >
                    Gör om intresseguiden →
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-xl">
                  <Sparkles size={32} className="mx-auto mb-3 text-slate-400" />
                  <p className="text-slate-600 mb-3">
                    Du har inte gjort intresseguiden ännu
                  </p>
                  <Link 
                    to="/interest-guide"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600"
                  >
                    Gör intresseguiden
                  </Link>
                </div>
              )}
            </Section>

            {/* Top Occupations */}
            {career?.topOccupations && career.topOccupations.length > 0 && (
              <Section title="Rekommenderade Yrken" icon={Target}>
                <div className="flex flex-wrap gap-2">
                  {career.topOccupations.map((occupation, idx) => (
                    <Link
                      key={idx}
                      to={`/job-search?query=${encodeURIComponent(occupation)}`}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-violet-300 hover:bg-violet-50 transition-colors"
                    >
                      {occupation}
                    </Link>
                  ))}
                </div>
              </Section>
            )}

            {/* Career Goals */}
            <Section title="Karriärmål" icon={TrendingUp}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Kortsiktigt</h4>
                  <p className="text-slate-900">
                    {career?.careerGoals?.shortTerm || 'Inte angivet ännu'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Långsiktigt</h4>
                  <p className="text-slate-900">
                    {career?.careerGoals?.longTerm || 'Inte angivet ännu'}
                  </p>
                </div>
              </div>
            </Section>

            {/* Preferred Roles */}
            <Section title="Föredragna Roller" icon={CheckCircle2}>
              {career?.preferredRoles && career.preferredRoles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {career.preferredRoles.map((role, idx) => (
                    <span 
                      key={idx}
                      className="px-3 py-1.5 bg-teal-100 text-teal-700 rounded-full text-sm"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">
                  Inga föredragna roller angivna ännu.
                </p>
              )}
            </Section>
          </>
        )}

        {activeTab === 'settings' && (
          <>
            {/* Usage Stats */}
            <Section title="Aktivitet" icon={TrendingUp}>
              <div className="grid grid-cols-3 gap-4">
                <StatCard 
                  label="Ansökningar"
                  value={usage?.applicationsCount || 0}
                  link="/job-tracker"
                />
                <StatCard 
                  label="Personliga brev"
                  value={usage?.coverLettersCount || 0}
                  link="/cover-letter"
                />
                <StatCard 
                  label="CV-uppdatering"
                  value={usage?.cvLastUpdated 
                    ? new Date(usage.cvLastUpdated).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })
                    : 'Aldrig'
                  }
                  link="/cv"
                  isDate={!!usage?.cvLastUpdated}
                />
              </div>
            </Section>

            {/* Data Usage */}
            <Section title="Dataanvändning" icon={CheckCircle2}>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-green-600" />
                    <span className="text-slate-700">CV-byggare</span>
                  </div>
                  <span className="text-sm text-green-700 font-medium">
                    {professional?.workExperience && professional.workExperience.length > 0 ? 'Aktiv' : 'Tom'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-green-600" />
                    <span className="text-slate-700">Personligt brev</span>
                  </div>
                  <span className="text-sm text-green-700 font-medium">
                    {usage?.coverLettersCount ? `${usage.coverLettersCount} sparade` : 'Inga brev'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-green-600" />
                    <span className="text-slate-700">Jobbtracker</span>
                  </div>
                  <span className="text-sm text-green-700 font-medium">
                    {usage?.applicationsCount ? `${usage.applicationsCount} ansökningar` : 'Inga ansökningar'}
                  </span>
                </div>
              </div>
            </Section>
          </>
        )}
      </div>
    </div>
  )
}

// ============================================
// SUB-COMPONENTS
// ============================================

function Section({ 
  title, 
  icon: Icon, 
  children 
}: { 
  title: string
  icon: React.ComponentType<{ size: number; className?: string }>
  children: React.ReactNode 
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
        <Icon size={20} className="text-violet-500" />
        {title}
      </h3>
      {children}
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-500 mb-0.5">
        {label}
      </label>
      <p className="text-slate-900">
        {value || <span className="text-slate-400 italic">Inte angivet</span>}
      </p>
    </div>
  )
}

function Input({ 
  label, 
  value, 
  onChange, 
  type = 'text',
  placeholder
}: { 
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
      />
    </div>
  )
}

function StatCard({ 
  label, 
  value, 
  link,
  isDate = false
}: { 
  label: string
  value: string | number
  link: string
  isDate?: boolean
}) {
  return (
    <Link 
      to={link}
      className="block bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors"
    >
      <p className={cn(
        "font-bold text-slate-900",
        isDate ? "text-lg" : "text-2xl"
      )}>
        {value}
      </p>
      <p className="text-sm text-slate-500">{label}</p>
    </Link>
  )
}
