/**
 * CV Preview Component - Förbättrade moderna mallar
 * Bättre typografi, ikoner, och visuell hierarki
 */

import { 
  Mail, Phone, MapPin, Briefcase, GraduationCap, 
  Award, Link2, Globe, Star, Target, Zap, BookOpen, Sparkles
} from 'lucide-react'
import type { CVData } from '@/services/supabaseApi'

interface CVPreviewProps {
  data: CVData
}

// Förbättrade mallar med bättre typografi och ikoner
const TEMPLATES = {
  sidebar: {
    name: 'Sidokolumn',
    layout: 'sidebar',
    fonts: { heading: 'Inter', body: 'Inter' },
    colors: {
      sidebar: '#0f172a',
      sidebarText: '#f8fafc',
      accent: '#3b82f6',
      accentLight: '#dbeafe',
      text: '#1e293b',
      muted: '#64748b',
      border: '#e2e8f0',
    },
    features: {
      roundedPhoto: true,
      skillTags: true,
      timeline: true,
    }
  },
  centered: {
    name: 'Centrerad',
    layout: 'top',
    fonts: { heading: 'Montserrat', body: 'Inter' },
    colors: {
      header: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      headerText: '#ffffff',
      accent: '#7c3aed',
      accentLight: '#ede9fe',
      text: '#1e1b4b',
      muted: '#6b7280',
      border: '#e5e7eb',
    },
    features: {
      gradientHeader: true,
      circularPhoto: true,
      pillTags: true,
    }
  },
  minimal: {
    name: 'Minimal',
    layout: 'top',
    fonts: { heading: 'Inter', body: 'Inter' },
    colors: {
      header: '#fafafa',
      headerText: '#171717',
      accent: '#171717',
      accentLight: '#f5f5f5',
      text: '#171717',
      muted: '#737373',
      border: '#e5e5e5',
    },
    features: {
      cleanLines: true,
      spacious: true,
      simpleTags: true,
    }
  },
  creative: {
    name: 'Kreativ',
    layout: 'split',
    fonts: { heading: 'Poppins', body: 'Inter' },
    colors: {
      leftColumn: '#db2777',
      leftText: '#ffffff',
      rightBg: '#fdf2f8',
      accent: '#be185d',
      accentLight: '#fce7f3',
      text: '#831843',
      muted: '#9d174d',
      border: '#fbcfe8',
    },
    features: {
      progressBars: true,
      cardLayout: true,
      roundedPhoto: true,
    }
  },
  executive: {
    name: 'Executive',
    layout: 'top',
    fonts: { heading: 'Georgia', body: 'Inter' },
    colors: {
      header: '#0f172a',
      headerText: '#f8fafc',
      accent: '#d4af37',
      accentLight: '#fefce8',
      text: '#0f172a',
      muted: '#475569',
      border: '#d4af37',
    },
    features: {
      serif: true,
      goldAccents: true,
      elegant: true,
    }
  },
  nordic: {
    name: 'Nordisk',
    layout: 'sidebar',
    fonts: { heading: 'Inter', body: 'Inter' },
    colors: {
      sidebar: '#f0f9ff',
      sidebarText: '#0c4a6e',
      accent: '#0284c7',
      accentLight: '#e0f2fe',
      text: '#0c4a6e',
      muted: '#0369a1',
      border: '#bae6fd',
    },
    features: {
      softColors: true,
      lightSidebar: true,
      clean: true,
    }
  },
}

export function CVPreview({ data }: CVPreviewProps) {
  const template = TEMPLATES[data.template as keyof typeof TEMPLATES] || TEMPLATES.sidebar
  const fullName = `${data.firstName} ${data.lastName}`.trim() || 'Ditt Namn'
  
  const getSkillName = (skill: any) => typeof skill === 'string' ? skill : skill?.name || ''
  const getSkillCategory = (skill: any) => typeof skill === 'object' ? skill?.category : 'other'
  
  const technicalSkills = data.skills?.filter(s => getSkillCategory(s) === 'technical') || []
  const softSkills = data.skills?.filter(s => getSkillCategory(s) === 'soft') || []
  const otherSkills = data.skills?.filter(s => !['technical', 'soft'].includes(getSkillCategory(s))) || []

  // SIDEBAR LAYOUT
  if (template.layout === 'sidebar') {
    const isNordic = data.template === 'nordic'
    
    return (
      <div className="cv-preview flex min-h-[297mm] bg-white shadow-2xl">
        {/* Sidokolumn */}
        <aside 
          className="w-[35%] p-8 flex flex-col"
          style={{ 
            background: isNordic ? '#f0f9ff' : '#0f172a',
            color: isNordic ? '#0c4a6e' : '#f8fafc',
          }}
        >
          {/* Profilbild */}
          <div className="mb-8 flex justify-center">
            {data.profileImage ? (
              <div className="relative">
                <img
                  src={data.profileImage}
                  alt=""
                  className="w-40 h-40 object-cover rounded-full border-4 border-white/20 shadow-2xl"
                />
                <div 
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: template.colors.accent }}
                >
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
            ) : (
              <div className="w-40 h-40 rounded-full bg-white/10 flex items-center justify-center border-4 border-white/20">
                <span className="text-6xl opacity-50">👤</span>
              </div>
            )}
          </div>
          
          {/* Kontakt-sektion */}
          <div className="mb-8">
            <h3 className="text-xs uppercase tracking-[0.2em] opacity-60 mb-4 font-semibold">
              Kontakt
            </h3>
            <div className="space-y-3">
              {data.email && (
                <a href={`mailto:${data.email}`} className="flex items-center gap-3 group">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: isNordic ? '#e0f2fe' : 'rgba(255,255,255,0.1)' }}
                  >
                    <Mail className="w-5 h-5" style={{ color: isNordic ? '#0284c7' : 'inherit' }} />
                  </div>
                  <span className="text-sm break-all group-hover:opacity-80 transition-opacity">
                    {data.email}
                  </span>
                </a>
              )}
              {data.phone && (
                <a href={`tel:${data.phone}`} className="flex items-center gap-3 group">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: isNordic ? '#e0f2fe' : 'rgba(255,255,255,0.1)' }}
                  >
                    <Phone className="w-5 h-5" style={{ color: isNordic ? '#0284c7' : 'inherit' }} />
                  </div>
                  <span className="text-sm group-hover:opacity-80 transition-opacity">{data.phone}</span>
                </a>
              )}
              {data.location && (
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: isNordic ? '#e0f2fe' : 'rgba(255,255,255,0.1)' }}
                  >
                    <MapPin className="w-5 h-5" style={{ color: isNordic ? '#0284c7' : 'inherit' }} />
                  </div>
                  <span className="text-sm">{data.location}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Skills med progress bars */}
          {data.skills?.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xs uppercase tracking-[0.2em] opacity-60 mb-4 font-semibold">
                Expertis
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.skills.slice(0, 8).map((skill, i) => (
                  <span 
                    key={i}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium"
                    style={{ 
                      background: isNordic ? '#e0f2fe' : 'rgba(255,255,255,0.15)',
                      color: 'inherit'
                    }}
                  >
                    {getSkillName(skill)}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Språk med nivåer */}
          {data.languages?.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xs uppercase tracking-[0.2em] opacity-60 mb-4 font-semibold">
                Språk
              </h3>
              <div className="space-y-3">
                {data.languages.map(lang => (
                  <div key={lang.id} className="flex items-center justify-between">
                    <span className="font-medium">{lang.language || (lang as any).name}</span>
                    <span 
                      className="text-xs px-2 py-1 rounded-full"
                      style={{ 
                        background: isNordic ? '#bae6fd' : 'rgba(255,255,255,0.2)',
                      }}
                    >
                      {lang.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Certifikat */}
          {data.certificates?.length > 0 && (
            <div className="mt-auto">
              <h3 className="text-xs uppercase tracking-[0.2em] opacity-60 mb-4 font-semibold">
                Certifieringar
              </h3>
              <div className="space-y-2">
                {data.certificates.map(cert => (
                  <div key={cert.id} className="flex items-start gap-2">
                    <Award className="w-4 h-4 mt-0.5 opacity-60 shrink-0" />
                    <div>
                      <div className="font-medium text-sm">{cert.name}</div>
                      <div className="text-xs opacity-60">{cert.issuer}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
        
        {/* Huvudinnehåll */}
        <main className="w-[65%] p-10 bg-white">
          {/* Header */}
          <header className="mb-10 pb-8 border-b-2" style={{ borderColor: template.colors.border }}>
            <h1 className="text-5xl font-bold mb-3" style={{ color: template.colors.text }}>
              {fullName}
            </h1>
            {data.title && (
              <p className="text-2xl font-medium" style={{ color: template.colors.accent }}>
                {data.title}
              </p>
            )}
          </header>
          
          {/* Profil */}
          {data.summary && (
            <section className="mb-10">
              <h2 
                className="text-lg font-bold mb-4 flex items-center gap-2 uppercase tracking-wider"
                style={{ color: template.colors.text }}
              >
                <Target className="w-5 h-5" style={{ color: template.colors.accent }} />
                Profil
              </h2>
              <p className="text-lg leading-relaxed" style={{ color: template.colors.text }}>
                {data.summary}
              </p>
            </section>
          )}
          
          {/* Erfarenhet med timeline */}
          {data.workExperience?.length > 0 && (
            <section className="mb-10">
              <h2 
                className="text-lg font-bold mb-6 flex items-center gap-2 uppercase tracking-wider"
                style={{ color: template.colors.text }}
              >
                <Briefcase className="w-5 h-5" style={{ color: template.colors.accent }} />
                Arbetslivserfarenhet
              </h2>
              <div className="space-y-6 relative">
                {data.workExperience.map((job, i) => (
                  <div key={job.id} className="relative pl-6 pb-6 border-l-2" style={{ borderColor: template.colors.border }}>
                    <div 
                      className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white"
                      style={{ background: template.colors.accent }}
                    />
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-xl font-bold" style={{ color: template.colors.text }}>
                        {job.title}
                      </h3>
                      <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ 
                        background: template.colors.accentLight,
                        color: template.colors.accent
                      }}>
                        {job.startDate} – {job.current ? 'Nu' : job.endDate}
                      </span>
                    </div>
                    <div className="text-base font-medium mb-2" style={{ color: template.colors.accent }}>
                      {job.company}{job.location && ` • ${job.location}`}
                    </div>
                    {job.description && (
                      <p className="text-sm leading-relaxed" style={{ color: template.colors.muted }}>
                        {job.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
          
          {/* Utbildning */}
          {data.education?.length > 0 && (
            <section>
              <h2 
                className="text-lg font-bold mb-6 flex items-center gap-2 uppercase tracking-wider"
                style={{ color: template.colors.text }}
              >
                <GraduationCap className="w-5 h-5" style={{ color: template.colors.accent }} />
                Utbildning
              </h2>
              <div className="space-y-5">
                {data.education.map(edu => (
                  <div key={edu.id} className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold" style={{ color: template.colors.text }}>
                        {edu.degree}
                      </h3>
                      <div className="font-medium" style={{ color: template.colors.accent }}>
                        {edu.school}
                      </div>
                      {edu.field && <div className="text-sm text-slate-500">{edu.field}</div>}
                    </div>
                    <span 
                      className="text-sm px-3 py-1 rounded-full shrink-0"
                      style={{ background: template.colors.accentLight, color: template.colors.accent }}
                    >
                      {edu.startDate} – {edu.endDate}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    )
  }

  // TOP LAYOUT (Centrerad, Minimal, Executive)
  if (template.layout === 'top') {
    const isGradient = data.template === 'centered'
    const isExecutive = data.template === 'executive'
    
    return (
      <div className="cv-preview min-h-[297mm] bg-white shadow-2xl">
        {/* Hero Header */}
        <header 
          className="relative p-12 pb-16"
          style={{ 
            background: isGradient 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
              : isExecutive ? '#0f172a' : '#fafafa',
            color: isGradient || isExecutive ? '#ffffff' : '#171717',
          }}
        >
          {/* Dekorativa element */}
          {isGradient && (
            <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
              <div className="w-full h-full rounded-full bg-white blur-3xl" />
            </div>
          )}
          
          <div className={`flex ${data.profileImage ? 'items-center gap-8' : 'flex-col items-center text-center'}`}>
            {/* Profilbild */}
            {data.profileImage && (
              <div className="relative">
                <img
                  src={data.profileImage}
                  alt=""
                  className={`w-32 h-32 object-cover border-4 border-white/30 shadow-2xl ${
                    data.template === 'centered' ? 'rounded-full' : 'rounded-2xl'
                  }`}
                />
                {isExecutive && (
                  <div 
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: '#d4af37' }}
                  >
                    <Star className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            )}
            
            {/* Text */}
            <div className={!data.profileImage ? 'text-center' : ''}>
              <h1 
                className={`font-bold mb-3 ${isExecutive ? 'font-serif text-6xl' : 'text-5xl'}`}
              >
                {fullName}
              </h1>
              {data.title && (
                <p className={`text-2xl mb-4 ${isExecutive ? 'font-serif italic' : ''} opacity-90`}>
                  {data.title}
                </p>
              )}
              
              {/* Kontakt-pills */}
              <div className={`flex flex-wrap gap-3 text-sm ${!data.profileImage ? 'justify-center' : ''}`}>
                {data.email && (
                  <span className="px-4 py-2 rounded-full bg-white/10 backdrop-blur flex items-center gap-2">
                    <Mail className="w-4 h-4" /> {data.email}
                  </span>
                )}
                {data.phone && (
                  <span className="px-4 py-2 rounded-full bg-white/10 backdrop-blur flex items-center gap-2">
                    <Phone className="w-4 h-4" /> {data.phone}
                  </span>
                )}
                {data.location && (
                  <span className="px-4 py-2 rounded-full bg-white/10 backdrop-blur flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> {data.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>
        
        {/* Innehåll */}
        <main className="p-12">
          {/* Grid layout för profil och quick info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
            {data.summary && (
              <section className="lg:col-span-2">
                <h2 
                  className="text-xl font-bold mb-4 flex items-center gap-2"
                  style={{ color: isExecutive ? '#0f172a' : 'inherit' }}
                >
                  <Zap className="w-5 h-5" style={{ color: isExecutive ? '#d4af37' : '#3b82f6' }} />
                  Om mig
                </h2>
                <p className="text-lg leading-relaxed" style={{ color: template.colors.text }}>
                  {data.summary}
                </p>
              </section>
            )}
            
            {/* Quick stats */}
            <div className="space-y-4">
              {data.languages?.length > 0 && (
                <div className="p-4 rounded-xl" style={{ background: template.colors.accentLight }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: template.colors.accent }}>
                    Språk
                  </h3>
                  <div className="space-y-2">
                    {data.languages.map(lang => (
                      <div key={lang.id} className="flex justify-between items-center">
                        <span style={{ color: template.colors.text }}>
                          {lang.language || (lang as any).name}
                        </span>
                        <span className="text-sm font-medium" style={{ color: template.colors.muted }}>
                          {lang.level}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Skills tags */}
          {data.skills?.length > 0 && (
            <section className="mb-12">
              <h2 
                className="text-xl font-bold mb-5 flex items-center gap-2"
                style={{ color: template.colors.text }}
              >
                <Sparkles className="w-5 h-5" style={{ color: isExecutive ? '#d4af37' : '#3b82f6' }} />
                Kompetenser
              </h2>
              <div className="flex flex-wrap gap-3">
                {data.skills.map((skill, i) => (
                  <span 
                    key={i}
                    className="px-4 py-2 font-medium transition-all hover:scale-105"
                    style={{ 
                      background: template.colors.accentLight,
                      color: template.colors.accent,
                      borderRadius: data.template === 'minimal' ? '4px' : '9999px',
                    }}
                  >
                    {getSkillName(skill)}
                  </span>
                ))}
              </div>
            </section>
          )}
          
          {/* Erfarenhet & Utbildning */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {data.workExperience?.length > 0 && (
              <section>
                <h2 
                  className="text-xl font-bold mb-6 flex items-center gap-2"
                  style={{ color: template.colors.text }}
                >
                  <Briefcase className="w-5 h-5" style={{ color: isExecutive ? '#d4af37' : '#3b82f6' }} />
                  Erfarenhet
                </h2>
                <div className="space-y-6">
                  {data.workExperience.map(job => (
                    <div 
                      key={job.id} 
                      className="relative pl-6 pb-6 border-l-2"
                      style={{ borderColor: template.colors.border }}
                    >
                      <div 
                        className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white"
                        style={{ background: isExecutive ? '#d4af37' : '#3b82f6' }}
                      />
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-lg" style={{ color: template.colors.text }}>
                          {job.title}
                        </h3>
                        <span 
                          className="text-xs px-3 py-1 rounded-full"
                          style={{ background: template.colors.accentLight, color: template.colors.accent }}
                        >
                          {job.startDate} – {job.current ? 'Nu' : job.endDate}
                        </span>
                      </div>
                      <div className="font-medium mb-2" style={{ color: template.colors.accent }}>
                        {job.company}
                      </div>
                      {job.description && (
                        <p className="text-sm" style={{ color: template.colors.muted }}>
                          {job.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
            
            <div className="space-y-10">
              {data.education?.length > 0 && (
                <section>
                  <h2 
                    className="text-xl font-bold mb-6 flex items-center gap-2"
                    style={{ color: template.colors.text }}
                  >
                    <GraduationCap className="w-5 h-5" style={{ color: isExecutive ? '#d4af37' : '#3b82f6' }} />
                    Utbildning
                  </h2>
                  <div className="space-y-5">
                    {data.education.map(edu => (
                      <div 
                        key={edu.id}
                        className="p-4 rounded-xl border-l-4"
                        style={{ 
                          background: template.colors.accentLight,
                          borderColor: isExecutive ? '#d4af37' : '#3b82f6'
                        }}
                      >
                        <h3 className="font-bold" style={{ color: template.colors.text }}>
                          {edu.degree}
                        </h3>
                        <div style={{ color: template.colors.accent }}>{edu.school}</div>
                        <div className="text-sm mt-1" style={{ color: template.colors.muted }}>
                          {edu.startDate} – {edu.endDate}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              
              {data.certificates?.length > 0 && (
                <section>
                  <h2 
                    className="text-xl font-bold mb-4 flex items-center gap-2"
                    style={{ color: template.colors.text }}
                  >
                    <Award className="w-5 h-5" style={{ color: isExecutive ? '#d4af37' : '#3b82f6' }} />
                    Certifikat
                  </h2>
                  <div className="space-y-2">
                    {data.certificates.map(cert => (
                      <div 
                        key={cert.id}
                        className="flex justify-between items-center py-2 border-b"
                        style={{ borderColor: template.colors.border }}
                      >
                        <span style={{ color: template.colors.text }}>{cert.name}</span>
                        <span className="text-sm" style={{ color: template.colors.muted }}>
                          {cert.date}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </main>
      </div>
    )
  }

  // SPLIT LAYOUT (Kreativ)
  return (
    <div className="cv-preview flex min-h-[297mm] shadow-2xl">
      {/* Vänster - färgstark */}
      <aside 
        className="w-[40%] p-8 flex flex-col text-white"
        style={{ background: 'linear-gradient(180deg, #db2777 0%, #be185d 100%)' }}
      >
        {/* Foto */}
        <div className="mb-8 flex justify-center">
          {data.profileImage ? (
            <img
              src={data.profileImage}
              alt=""
              className="w-44 h-44 object-cover rounded-3xl border-4 border-white/20 shadow-2xl"
            />
          ) : (
            <div className="w-44 h-44 rounded-3xl bg-white/10 flex items-center justify-center border-4 border-white/20">
              <span className="text-6xl">👤</span>
            </div>
          )}
        </div>
        
        {/* Namn */}
        <h1 className="text-3xl font-bold mb-2 text-center">{fullName}</h1>
        {data.title && <p className="text-lg opacity-90 mb-8 text-center">{data.title}</p>}
        
        {/* Kontakt-kort */}
        <div className="space-y-3 mb-8">
          {data.email && (
            <a href={`mailto:${data.email}`} className="flex items-center gap-3 bg-white/10 rounded-xl p-3 hover:bg-white/20 transition-colors">
              <Mail className="w-5 h-5" />
              <span className="text-sm">{data.email}</span>
            </a>
          )}
          {data.phone && (
            <a href={`tel:${data.phone}`} className="flex items-center gap-3 bg-white/10 rounded-xl p-3 hover:bg-white/20 transition-colors">
              <Phone className="w-5 h-5" />
              <span className="text-sm">{data.phone}</span>
            </a>
          )}
          {data.location && (
            <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
              <MapPin className="w-5 h-5" />
              <span className="text-sm">{data.location}</span>
            </div>
          )}
        </div>
        
        {/* Språk med progress bars */}
        {data.languages?.length > 0 && (
          <div className="mt-auto">
            <h3 className="text-sm uppercase tracking-widest opacity-70 mb-4 font-semibold">
              Språk
            </h3>
            <div className="space-y-4">
              {data.languages.map(lang => (
                <div key={lang.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{lang.language || (lang as any).name}</span>
                    <span className="opacity-70">{lang.level}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-white transition-all"
                      style={{ 
                        width: lang.level === 'Modersmål' ? '100%' :
                               lang.level === 'Flytande' ? '85%' :
                               lang.level === 'God' ? '70%' : '50%'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>
      
      {/* Höger - innehåll */}
      <main className="w-[60%] p-8 bg-pink-50">
        {/* Profil */}
        {data.summary && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-pink-900">Profil</h2>
            <p className="leading-relaxed text-pink-950">{data.summary}</p>
          </section>
        )}
        
        {/* Erfarenhet i kort */}
        {data.workExperience?.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-pink-900">Erfarenhet</h2>
            <div className="space-y-4">
              {data.workExperience.map(job => (
                <div key={job.id} className="bg-white p-5 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-pink-950">{job.title}</h3>
                    <span className="text-xs px-3 py-1 rounded-full bg-pink-100 text-pink-700">
                      {job.startDate} – {job.current ? 'Nu' : job.endDate}
                    </span>
                  </div>
                  <div className="text-pink-700 font-medium mb-2">{job.company}</div>
                  {job.description && (
                    <p className="text-sm text-slate-600">{job.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
        
        {/* Kompetenser */}
        {data.skills?.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-pink-900">Kompetenser</h2>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill, i) => (
                <span 
                  key={i}
                  className="px-4 py-2 bg-white rounded-full text-pink-700 shadow-sm font-medium"
                >
                  {getSkillName(skill)}
                </span>
              ))}
            </div>
          </section>
        )}
        
        {/* Utbildning */}
        {data.education?.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4 text-pink-900">Utbildning</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.education.map(edu => (
                <div key={edu.id} className="bg-white p-4 rounded-xl">
                  <h3 className="font-bold text-pink-950">{edu.degree}</h3>
                  <div className="text-pink-700">{edu.school}</div>
                  <div className="text-sm text-slate-500 mt-1">
                    {edu.startDate} – {edu.endDate}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default CVPreview
