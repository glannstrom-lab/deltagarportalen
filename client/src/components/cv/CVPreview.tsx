/**
 * CV Preview Component - Moderna mallar 2025
 * Sidokolumner, modern typografi, snygg foto-hantering
 */

import { Mail, Phone, MapPin, Briefcase, GraduationCap, Wrench, Award, Link2, Users, Globe } from 'lucide-react'
import type { CVData } from '@/services/mockApi'

interface CVPreviewProps {
  data: CVData
}

// 6 Moderna mallar med sidokolumner och avancerad typografi
const TEMPLATES = {
  // 1. SIDOKOLUMN - Modern två-kolumns layout
  sidebar: {
    name: 'Sidokolumn',
    layout: 'sidebar', // sidebar, top, split
    font: { heading: 'Inter, system-ui, sans-serif', body: 'Inter, system-ui, sans-serif' },
    colors: {
      sidebar: '#1e293b',
      sidebarText: '#f8fafc',
      accent: '#3b82f6',
      text: '#1e293b',
      muted: '#64748b',
      border: '#e2e8f0',
      skillBg: '#dbeafe',
    },
    borderRadius: '8px',
    shadows: true,
  },
  
  // 2. CENTRERAD - Hero-stil med stort foto
  centered: {
    name: 'Centrerad',
    layout: 'top',
    font: { heading: 'Montserrat, system-ui, sans-serif', body: 'Inter, system-ui, sans-serif' },
    colors: {
      header: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      headerText: '#ffffff',
      accent: '#7c3aed',
      text: '#1e1b4b',
      muted: '#6b7280',
      border: '#e5e7eb',
      skillBg: '#ede9fe',
    },
    borderRadius: '9999px', // Pills
    shadows: true,
  },
  
  // 3. MINIMAL - Luftig med mycket whitespace
  minimal: {
    name: 'Minimal',
    layout: 'top',
    font: { heading: 'Inter, system-ui, sans-serif', body: 'Inter, system-ui, sans-serif' },
    colors: {
      header: '#fafafa',
      headerText: '#171717',
      accent: '#171717',
      text: '#171717',
      muted: '#737373',
      border: '#e5e5e5',
      skillBg: '#f5f5f5',
    },
    borderRadius: '4px',
    shadows: false,
  },
  
  // 4. KREATIV - Färgstark med unik layout
  creative: {
    name: 'Kreativ',
    layout: 'split',
    font: { heading: 'Poppins, system-ui, sans-serif', body: 'Inter, system-ui, sans-serif' },
    colors: {
      leftColumn: '#ec4899',
      leftText: '#ffffff',
      rightBg: '#fdf2f8',
      accent: '#db2777',
      text: '#831843',
      muted: '#9d174d',
      border: '#fbcfe8',
      skillBg: '#fce7f3',
    },
    borderRadius: '16px',
    shadows: true,
  },
  
  // 5. EXECUTIVE - Elegant med serif
  executive: {
    name: 'Executive',
    layout: 'top',
    font: { heading: 'Playfair Display, Georgia, serif', body: 'Inter, system-ui, sans-serif' },
    colors: {
      header: '#0f172a',
      headerText: '#f8fafc',
      accent: '#c9a227',
      text: '#0f172a',
      muted: '#475569',
      border: '#d4af37',
      skillBg: '#fefce8',
    },
    borderRadius: '2px',
    shadows: false,
  },
  
  // 6. NORDIC - Skandinavisk med mjuka färger
  nordic: {
    name: 'Nordisk',
    layout: 'sidebar',
    font: { heading: 'Inter, system-ui, sans-serif', body: 'Inter, system-ui, sans-serif' },
    colors: {
      sidebar: '#f0f9ff',
      sidebarText: '#0c4a6e',
      accent: '#0ea5e9',
      text: '#0c4a6e',
      muted: '#0369a1',
      border: '#bae6fd',
      skillBg: '#e0f2fe',
    },
    borderRadius: '12px',
    shadows: false,
  },
}

export function CVPreview({ data }: CVPreviewProps) {
  const template = TEMPLATES[data.template as keyof typeof TEMPLATES] || TEMPLATES.sidebar
  const fullName = `${data.firstName} ${data.lastName}`.trim() || 'Ditt Namn'
  
  // Helper för skill name
  const getSkillName = (skill: any) => typeof skill === 'string' ? skill : skill?.name || ''
  const getSkillCategory = (skill: any) => typeof skill === 'object' ? skill?.category : 'other'
  
  // Sortera skills
  const technicalSkills = data.skills?.filter(s => getSkillCategory(s) === 'technical') || []
  const softSkills = data.skills?.filter(s => getSkillCategory(s) === 'soft') || []
  const otherSkills = data.skills?.filter(s => !['technical', 'soft'].includes(getSkillCategory(s))) || []

  // ==================== SIDEBAR LAYOUT ====================
  if (template.layout === 'sidebar') {
    const isNordic = data.template === 'nordic'
    const sidebarBg = isNordic ? template.colors.sidebar : template.colors.sidebar
    const sidebarText = isNordic ? template.colors.sidebarText : template.colors.sidebarText
    
    return (
      <div 
        className="cv-preview flex min-h-[297mm]"
        style={{ 
          fontFamily: template.font.body,
          background: '#ffffff',
          boxShadow: template.shadows ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : 'none',
        }}
      >
        {/* Sidokolumn */}
        <div 
          className="w-[35%] p-8 flex flex-col"
          style={{ 
            background: sidebarBg,
            color: sidebarText,
          }}
        >
          {/* Foto - stort och centrerat */}
          {data.profileImage ? (
            <div className="mb-8 flex justify-center">
              <img
                src={data.profileImage}
                alt=""
                className="w-40 h-40 object-cover border-4 border-white/30"
                style={{ 
                  borderRadius: data.template === 'sidebar' ? '50%' : '16px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                }}
              />
            </div>
          ) : (
            <div 
              className="w-40 h-40 mb-8 mx-auto flex items-center justify-center border-4 border-white/30"
              style={{ 
                borderRadius: data.template === 'sidebar' ? '50%' : '16px',
                background: 'rgba(255,255,255,0.1)',
              }}
            >
              <span className="text-4xl opacity-50">👤</span>
            </div>
          )}
          
          {/* Kontakt i sidokolumn */}
          <div className="space-y-4 mb-8">
            <h3 
              className="text-sm uppercase tracking-widest opacity-70 mb-4"
              style={{ fontFamily: template.font.heading }}
            >
              Kontakt
            </h3>
            
            {data.email && (
              <div className="flex items-start gap-3">
                <Mail size={16} className="mt-0.5 opacity-70 shrink-0" />
                <span className="text-sm break-all">{data.email}</span>
              </div>
            )}
            {data.phone && (
              <div className="flex items-start gap-3">
                <Phone size={16} className="mt-0.5 opacity-70 shrink-0" />
                <span className="text-sm">{data.phone}</span>
              </div>
            )}
            {data.location && (
              <div className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 opacity-70 shrink-0" />
                <span className="text-sm">{data.location}</span>
              </div>
            )}
            
            {data.links?.map(link => (
              <div key={link.id} className="flex items-start gap-3">
                <Link2 size={16} className="mt-0.5 opacity-70 shrink-0" />
                <span className="text-sm">
                  {link.type === 'linkedin' ? 'LinkedIn' :
                   link.type === 'github' ? 'GitHub' :
                   link.type === 'portfolio' ? 'Portfolio' :
                   link.label || 'Länk'}
                </span>
              </div>
            ))}
          </div>
          
          {/* Skills i sidokolumn */}
          {data.skills?.length > 0 && (
            <div className="mb-8">
              <h3 
                className="text-sm uppercase tracking-widest opacity-70 mb-4"
                style={{ fontFamily: template.font.heading }}
              >
                Kompetenser
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.skills.map((skill, i) => (
                  <span 
                    key={i}
                    className="px-3 py-1.5 text-xs font-medium"
                    style={{ 
                      background: 'rgba(255,255,255,0.15)',
                      borderRadius: template.borderRadius,
                    }}
                  >
                    {getSkillName(skill)}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Språk i sidokolumn */}
          {data.languages?.length > 0 && (
            <div className="mb-8">
              <h3 
                className="text-sm uppercase tracking-widest opacity-70 mb-4"
                style={{ fontFamily: template.font.heading }}
              >
                Språk
              </h3>
              <div className="space-y-2">
                {data.languages.map(lang => (
                  <div key={lang.id} className="text-sm">
                    <span className="font-medium">{lang.language || (lang as any).name}</span>
                    <span className="opacity-70 ml-2">— {lang.level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Certifikat i sidokolumn */}
          {data.certificates?.length > 0 && (
            <div>
              <h3 
                className="text-sm uppercase tracking-widest opacity-70 mb-4"
                style={{ fontFamily: template.font.heading }}
              >
                Certifikat
              </h3>
              <div className="space-y-2">
                {data.certificates.map(cert => (
                  <div key={cert.id} className="text-sm">
                    <div className="font-medium">{cert.name}</div>
                    <div className="opacity-70 text-xs">{cert.issuer}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Huvudinnehåll */}
        <div className="w-[65%] p-8" style={{ background: '#ffffff' }}>
          {/* Namn och titel */}
          <div className="mb-8 pb-8" style={{ borderBottom: `2px solid ${template.colors.border}` }}>
            <h1 
              className="text-4xl font-bold mb-2"
              style={{ 
                fontFamily: template.font.heading,
                color: template.colors.text,
              }}
            >
              {fullName}
            </h1>
            {data.title && (
              <p 
                className="text-xl"
                style={{ 
                  fontFamily: template.font.body,
                  color: template.colors.accent,
                }}
              >
                {data.title}
              </p>
            )}
          </div>
          
          {/* Sammanfattning */}
          {data.summary && (
            <div className="mb-8">
              <h2 
                className="text-lg font-bold mb-4 uppercase tracking-wider"
                style={{ 
                  fontFamily: template.font.heading,
                  color: template.colors.text,
                }}
              >
                Profil
              </h2>
              <p 
                className="leading-relaxed"
                style={{ 
                  fontFamily: template.font.body,
                  color: template.colors.text,
                }}
              >
                {data.summary}
              </p>
            </div>
          )}
          
          {/* Erfarenhet */}
          {data.workExperience?.length > 0 && (
            <div className="mb-8">
              <h2 
                className="text-lg font-bold mb-6 uppercase tracking-wider"
                style={{ 
                  fontFamily: template.font.heading,
                  color: template.colors.text,
                }}
              >
                Erfarenhet
              </h2>
              <div className="space-y-6">
                {data.workExperience.map(job => (
                  <div key={job.id}>
                    <div className="flex justify-between items-start mb-1">
                      <h3 
                        className="font-bold text-lg"
                        style={{ fontFamily: template.font.heading, color: template.colors.text }}
                      >
                        {job.title}
                      </h3>
                      <span 
                        className="text-sm shrink-0"
                        style={{ color: template.colors.muted }}
                      >
                        {job.startDate} — {job.current ? 'Pågående' : job.endDate}
                      </span>
                    </div>
                    <div 
                      className="mb-2"
                      style={{ color: template.colors.accent, fontWeight: 500 }}
                    >
                      {job.company}{job.location && `, ${job.location}`}
                    </div>
                    {job.description && (
                      <p 
                        className="text-sm leading-relaxed"
                        style={{ color: template.colors.text }}
                      >
                        {job.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Utbildning */}
          {data.education?.length > 0 && (
            <div>
              <h2 
                className="text-lg font-bold mb-6 uppercase tracking-wider"
                style={{ 
                  fontFamily: template.font.heading,
                  color: template.colors.text,
                }}
              >
                Utbildning
              </h2>
              <div className="space-y-5">
                {data.education.map(edu => (
                  <div key={edu.id}>
                    <div className="flex justify-between items-start mb-1">
                      <h3 
                        className="font-bold"
                        style={{ fontFamily: template.font.heading, color: template.colors.text }}
                      >
                        {edu.degree}
                      </h3>
                      <span 
                        className="text-sm shrink-0"
                        style={{ color: template.colors.muted }}
                      >
                        {edu.startDate} — {edu.endDate}
                      </span>
                    </div>
                    <div style={{ color: template.colors.accent }}>
                      {edu.school}{edu.field && ` — ${edu.field}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ==================== TOP LAYOUT (Centrerad, Minimal, Executive) ====================
  if (template.layout === 'top') {
    const isGradient = typeof template.colors.header === 'string' && template.colors.header.includes('gradient')
    
    return (
      <div 
        className="cv-preview min-h-[297mm]"
        style={{ 
          fontFamily: template.font.body,
          background: '#ffffff',
          boxShadow: template.shadows ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : 'none',
        }}
      >
        {/* Header */}
        <div 
          className="relative p-10 pb-12"
          style={{ 
            background: template.colors.header,
            color: template.colors.headerText,
          }}
        >
          <div className={`flex ${data.profileImage ? 'items-center gap-8' : 'flex-col items-center text-center'}`}>
            {/* Foto */}
            {data.profileImage ? (
              <img
                src={data.profileImage}
                alt=""
                className="w-32 h-32 object-cover border-4 border-white/30"
                style={{ 
                  borderRadius: data.template === 'centered' ? '50%' : '16px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                }}
              />
            ) : data.template === 'centered' && (
              <div 
                className="w-32 h-32 flex items-center justify-center border-4 border-white/30 mb-4"
                style={{ 
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                }}
              >
                <span className="text-5xl">👤</span>
              </div>
            )}
            
            {/* Text */}
            <div className={!data.profileImage && data.template !== 'centered' ? 'text-center' : ''}>
              <h1 
                className="text-5xl font-bold mb-3"
                style={{ fontFamily: template.font.heading }}
              >
                {fullName}
              </h1>
              {data.title && (
                <p className="text-2xl opacity-90 mb-4">{data.title}</p>
              )}
              
              {/* Kontakt-rad */}
              <div className={`flex flex-wrap gap-x-6 gap-y-2 text-sm opacity-80 ${!data.profileImage && data.template !== 'centered' ? 'justify-center' : ''}`}>
                {data.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail size={14} /> {data.email}
                  </span>
                )}
                {data.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone size={14} /> {data.phone}
                  </span>
                )}
                {data.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} /> {data.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Innehåll */}
        <div className="p-10">
          {/* Rad 1: Profil + Skills */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Profil */}
            {data.summary && (
              <div className="lg:col-span-2">
                <h2 
                  className="text-xl font-bold mb-4 flex items-center gap-2"
                  style={{ 
                    fontFamily: template.font.heading,
                    color: template.colors.text,
                  }}
                >
                  <span 
                    className="w-8 h-0.5"
                    style={{ background: template.colors.accent }}
                  />
                  Om mig
                </h2>
                <p 
                  className="leading-relaxed text-lg"
                  style={{ color: template.colors.text }}
                >
                  {data.summary}
                </p>
              </div>
            )}
            
            {/* Quick info */}
            <div className="space-y-4">
              {data.languages?.length > 0 && (
                <div>
                  <h3 
                    className="text-sm font-bold uppercase tracking-wider mb-3"
                    style={{ color: template.colors.muted }}
                  >
                    Språk
                  </h3>
                  <div className="space-y-1">
                    {data.languages.map(lang => (
                      <div key={lang.id} className="flex justify-between text-sm">
                        <span style={{ color: template.colors.text }}>
                          {lang.language || (lang as any).name}
                        </span>
                        <span style={{ color: template.colors.muted }}>{lang.level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Skills tags */}
          {data.skills?.length > 0 && (
            <div className="mb-10">
              <h2 
                className="text-xl font-bold mb-4 flex items-center gap-2"
                style={{ 
                  fontFamily: template.font.heading,
                  color: template.colors.text,
                }}
              >
                <span 
                  className="w-8 h-0.5"
                  style={{ background: template.colors.accent }}
                />
                Kompetenser
              </h2>
              <div className="flex flex-wrap gap-2">
                {data.skills.map((skill, i) => (
                  <span 
                    key={i}
                    className="px-4 py-2 text-sm font-medium"
                    style={{ 
                      background: template.colors.skillBg,
                      color: template.colors.text,
                      borderRadius: template.borderRadius,
                    }}
                  >
                    {getSkillName(skill)}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Erfarenhet & Utbildning - Två kolumner */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Erfarenhet */}
            {data.workExperience?.length > 0 && (
              <div>
                <h2 
                  className="text-xl font-bold mb-6 flex items-center gap-2"
                  style={{ 
                    fontFamily: template.font.heading,
                    color: template.colors.text,
                  }}
                >
                  <Briefcase size={20} style={{ color: template.colors.accent }} />
                  Erfarenhet
                </h2>
                <div className="space-y-6">
                  {data.workExperience.map(job => (
                    <div 
                      key={job.id}
                      className="relative pl-6 pb-6"
                      style={{ 
                        borderLeft: `2px solid ${template.colors.border}`,
                      }}
                    >
                      <div 
                        className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full"
                        style={{ background: template.colors.accent }}
                      />
                      <h3 
                        className="font-bold text-lg"
                        style={{ color: template.colors.text }}
                      >
                        {job.title}
                      </h3>
                      <div 
                        className="text-sm mb-2"
                        style={{ color: template.colors.accent }}
                      >
                        {job.company}
                      </div>
                      <div 
                        className="text-xs uppercase tracking-wider mb-2"
                        style={{ color: template.colors.muted }}
                      >
                        {job.startDate} — {job.current ? 'Nu' : job.endDate}
                      </div>
                      {job.description && (
                        <p 
                          className="text-sm leading-relaxed"
                          style={{ color: template.colors.text }}
                        >
                          {job.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Utbildning + Certifikat */}
            <div className="space-y-8">
              {data.education?.length > 0 && (
                <div>
                  <h2 
                    className="text-xl font-bold mb-6 flex items-center gap-2"
                    style={{ 
                      fontFamily: template.font.heading,
                      color: template.colors.text,
                    }}
                  >
                    <GraduationCap size={20} style={{ color: template.colors.accent }} />
                    Utbildning
                  </h2>
                  <div className="space-y-4">
                    {data.education.map(edu => (
                      <div key={edu.id}>
                        <h3 
                          className="font-bold"
                          style={{ color: template.colors.text }}
                        >
                          {edu.degree}
                        </h3>
                        <div style={{ color: template.colors.accent }}>{edu.school}</div>
                        <div 
                          className="text-sm"
                          style={{ color: template.colors.muted }}
                        >
                          {edu.startDate} — {edu.endDate}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {data.certificates?.length > 0 && (
                <div>
                  <h2 
                    className="text-xl font-bold mb-4 flex items-center gap-2"
                    style={{ 
                      fontFamily: template.font.heading,
                      color: template.colors.text,
                    }}
                  >
                    <Award size={20} style={{ color: template.colors.accent }} />
                    Certifikat
                  </h2>
                  <div className="space-y-2">
                    {data.certificates.map(cert => (
                      <div 
                        key={cert.id}
                        className="flex justify-between items-center py-2"
                        style={{ borderBottom: `1px solid ${template.colors.border}` }}
                      >
                        <span style={{ color: template.colors.text }}>{cert.name}</span>
                        <span 
                          className="text-sm"
                          style={{ color: template.colors.muted }}
                        >
                          {cert.date}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ==================== SPLIT LAYOUT (Kreativ) ====================
  return (
    <div 
      className="cv-preview flex min-h-[297mm]"
      style={{ 
        fontFamily: template.font.body,
        background: '#ffffff',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }}
    >
      {/* Vänster kolumn - färgstark */}
      <div 
        className="w-[40%] p-8 flex flex-col"
        style={{ 
          background: template.colors.leftColumn,
          color: template.colors.leftText,
        }}
      >
        {/* Foto */}
        <div className="mb-8 flex justify-center">
          {data.profileImage ? (
            <img
              src={data.profileImage}
              alt=""
              className="w-44 h-44 object-cover rounded-3xl"
              style={{ 
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                border: '4px solid rgba(255,255,255,0.2)',
              }}
            />
          ) : (
            <div 
              className="w-44 h-44 rounded-3xl flex items-center justify-center"
              style={{ 
                background: 'rgba(255,255,255,0.15)',
                border: '4px solid rgba(255,255,255,0.2)',
              }}
            >
              <span className="text-6xl">👤</span>
            </div>
          )}
        </div>
        
        {/* Namn */}
        <h1 
          className="text-3xl font-bold mb-2 text-center"
          style={{ fontFamily: template.font.heading }}
        >
          {fullName}
        </h1>
        {data.title && (
          <p className="text-lg opacity-90 mb-8 text-center">{data.title}</p>
        )}
        
        {/* Kontakt */}
        <div className="space-y-3 mb-8">
          {data.email && (
            <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
              <Mail size={18} />
              <span className="text-sm">{data.email}</span>
            </div>
          )}
          {data.phone && (
            <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
              <Phone size={18} />
              <span className="text-sm">{data.phone}</span>
            </div>
          )}
          {data.location && (
            <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
              <MapPin size={18} />
              <span className="text-sm">{data.location}</span>
            </div>
          )}
        </div>
        
        {/* Språk */}
        {data.languages?.length > 0 && (
          <div className="mt-auto">
            <h3 className="text-sm uppercase tracking-widest opacity-70 mb-4">Språk</h3>
            <div className="space-y-3">
              {data.languages.map(lang => (
                <div key={lang.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{lang.language || (lang as any).name}</span>
                    <span className="opacity-70">{lang.level}</span>
                  </div>
                  <div 
                    className="h-1.5 rounded-full bg-white/20 overflow-hidden"
                  >
                    <div 
                      className="h-full rounded-full bg-white"
                      style={{ 
                        width: lang.level === 'Modersmål' ? '100%' :
                               lang.level === 'Flytande' ? '85%' :
                               lang.level === 'God' ? '70%' : '50%',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Höger kolumn */}
      <div 
        className="w-[60%] p-8"
        style={{ background: template.colors.rightBg }}
      >
        {/* Profil */}
        {data.summary && (
          <div className="mb-8">
            <h2 
              className="text-2xl font-bold mb-4"
              style={{ 
                fontFamily: template.font.heading,
                color: template.colors.text,
              }}
            >
              Profil
            </h2>
            <p 
              className="leading-relaxed"
              style={{ color: template.colors.text }}
            >
              {data.summary}
            </p>
          </div>
        )}
        
        {/* Erfarenhet */}
        {data.workExperience?.length > 0 && (
          <div className="mb-8">
            <h2 
              className="text-2xl font-bold mb-6"
              style={{ 
                fontFamily: template.font.heading,
                color: template.colors.text,
              }}
            >
              Erfarenhet
            </h2>
            <div className="space-y-5">
              {data.workExperience.map(job => (
                <div 
                  key={job.id}
                  className="p-4 rounded-2xl"
                  style={{ background: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 
                      className="font-bold"
                      style={{ color: template.colors.text }}
                    >
                      {job.title}
                    </h3>
                    <span 
                      className="text-xs px-2 py-1 rounded-full"
                      style={{ 
                        background: template.colors.skillBg,
                        color: template.colors.accent,
                      }}
                    >
                      {job.startDate} — {job.current ? 'Nu' : job.endDate}
                    </span>
                  </div>
                  <div 
                    className="text-sm mb-2"
                    style={{ color: template.colors.accent }}
                  >
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
          </div>
        )}
        
        {/* Kompetenser */}
        {data.skills?.length > 0 && (
          <div className="mb-8">
            <h2 
              className="text-2xl font-bold mb-4"
              style={{ 
                fontFamily: template.font.heading,
                color: template.colors.text,
              }}
            >
              Kompetenser
            </h2>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill, i) => (
                <span 
                  key={i}
                  className="px-4 py-2 text-sm font-medium rounded-full"
                  style={{ 
                    background: '#ffffff',
                    color: template.colors.accent,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  }}
                >
                  {getSkillName(skill)}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Utbildning */}
        {data.education?.length > 0 && (
          <div>
            <h2 
              className="text-2xl font-bold mb-4"
              style={{ 
                fontFamily: template.font.heading,
                color: template.colors.text,
              }}
            >
              Utbildning
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.education.map(edu => (
                <div 
                  key={edu.id}
                  className="p-4 rounded-xl"
                  style={{ background: '#ffffff' }}
                >
                  <h3 
                    className="font-bold mb-1"
                    style={{ color: template.colors.text }}
                  >
                    {edu.degree}
                  </h3>
                  <div 
                    className="text-sm"
                    style={{ color: template.colors.accent }}
                  >
                    {edu.school}
                  </div>
                  <div 
                    className="text-xs mt-1"
                    style={{ color: template.colors.muted }}
                  >
                    {edu.startDate} — {edu.endDate}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CVPreview
