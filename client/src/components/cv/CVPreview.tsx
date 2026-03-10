/**
 * CV Preview Component
 * Visar förhandsgranskning av CV med synkade mallar för PDF-export
 */

import { Mail, Phone, MapPin, Briefcase, GraduationCap, Wrench, Award, Link2, Users } from 'lucide-react'
import type { CVData } from '@/services/mockApi'

interface CVPreviewProps {
  data: CVData
}

// 5 Kompletta färdiga mallar - synkade med CVBuilder och PDF-export
const TEMPLATES = {
  modern: {
    font: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    colors: { primary: '#4f46e5', secondary: '#6366f1', accent: '#818cf8', text: '#1e293b', muted: '#64748b', border: '#e2e8f0', bg: '#ffffff' },
    header: { bg: '#4f46e5', text: '#ffffff', layout: 'centered' },
    sectionTitle: { style: 'underline', transform: 'uppercase', letterSpacing: '0.05em' },
    skillTag: { bg: '#eef2ff', border: '1px solid #c7d2fe', radius: '9999px' },
  },
  minimal: {
    font: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    colors: { primary: '#334155', secondary: '#475569', accent: '#64748b', text: '#0f172a', muted: '#64748b', border: '#e2e8f0', bg: '#ffffff' },
    header: { bg: '#f8fafc', text: '#0f172a', layout: 'left', border: '2px solid #e2e8f0' },
    sectionTitle: { style: 'line', transform: 'none', letterSpacing: '0' },
    skillTag: { bg: '#f1f5f9', border: 'none', radius: '6px' },
  },
  creative: {
    font: 'Montserrat, -apple-system, sans-serif',
    colors: { primary: '#db2777', secondary: '#ec4899', accent: '#f472b6', text: '#1e293b', muted: '#64748b', border: '#fbcfe8', bg: '#ffffff' },
    header: { bg: 'linear-gradient(135deg, #db2777 0%, #ec4899 100%)', text: '#ffffff', layout: 'centered' },
    sectionTitle: { style: 'bold', transform: 'none', letterSpacing: '0' },
    skillTag: { bg: '#fce7f3', border: 'none', radius: '8px' },
  },
  executive: {
    font: 'Georgia, Times New Roman, serif',
    colors: { primary: '#1e3a5f', secondary: '#334155', accent: '#c9a227', text: '#1e293b', muted: '#64748b', border: '#d4af37', bg: '#ffffff' },
    header: { bg: '#1e3a5f', text: '#ffffff', layout: 'classic', border: '3px solid #c9a227' },
    sectionTitle: { style: 'elegant', transform: 'uppercase', letterSpacing: '0.1em' },
    skillTag: { bg: '#f8fafc', border: '1px solid #c9a227', radius: '4px' },
  },
  nordic: {
    font: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    colors: { primary: '#059669', secondary: '#10b981', accent: '#34d399', text: '#064e3b', muted: '#6b7280', border: '#d1fae5', bg: '#f0fdf4' },
    header: { bg: '#ecfdf5', text: '#064e3b', layout: 'split', border: 'none' },
    sectionTitle: { style: 'clean', transform: 'none', letterSpacing: '0' },
    skillTag: { bg: '#d1fae5', border: 'none', radius: '9999px' },
  },
}

export function CVPreview({ data }: CVPreviewProps) {
  const fullName = `${data.firstName} ${data.lastName}`.trim() || 'Ditt Namn'
  const template = TEMPLATES[data.template as keyof typeof TEMPLATES] || TEMPLATES.modern
  
  const technicalSkills = data.skills?.filter(s => typeof s === 'object' ? s.category === 'technical' : true) || []
  const softSkills = data.skills?.filter(s => typeof s === 'object' ? s.category === 'soft' : false) || []
  const otherSkills = data.skills?.filter(s => {
    if (typeof s === 'string') return true
    return !s.category || s.category === 'tool' || s.category === 'language'
  }) || []

  const getSkillName = (skill: any) => typeof skill === 'string' ? skill : skill.name

  // Template-specific header rendering
  const renderHeader = () => {
    const isGradient = template.header.bg.includes('gradient')
    
    return (
      <div 
        className="cv-header p-8 mb-6"
        style={{ 
          fontFamily: template.font,
          background: template.header.bg,
          color: template.header.text,
          borderBottom: template.header.border || 'none',
        }}
      >
        <div className={`flex ${data.profileImage ? 'items-start gap-6' : 'items-center'} ${template.header.layout === 'centered' ? 'flex-col text-center' : ''}`}>
          {data.profileImage && (
            <div className="shrink-0">
              <img
                src={data.profileImage}
                alt={`Profilbild av ${fullName}`}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white shadow-lg"
              />
            </div>
          )}
          
          <div className="flex-1">
            <h1 
              className="text-3xl sm:text-4xl font-bold tracking-tight"
              style={{ fontFamily: template.font }}
            >
              {fullName}
            </h1>
            
            {data.title && (
              <p className="text-xl mt-2 opacity-90" style={{ fontFamily: template.font }}>
                {data.title}
              </p>
            )}
            
            {/* Contact info */}
            <div className={`flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm opacity-90 ${template.header.layout === 'centered' ? 'justify-center' : ''}`}>
              {data.email && (
                <span className="flex items-center gap-1.5">
                  <Mail size={14} />
                  {data.email}
                </span>
              )}
              {data.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone size={14} />
                  {data.phone}
                </span>
              )}
              {data.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} />
                  {data.location}
                </span>
              )}
            </div>

            {/* Links */}
            {data.links && data.links.length > 0 && (
              <div className={`flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm ${template.header.layout === 'centered' ? 'justify-center' : ''}`}>
                {data.links.map((link) => (
                  <span key={link.id} className="flex items-center gap-1.5 opacity-80">
                    <Link2 size={14} />
                    {link.type === 'linkedin' && 'LinkedIn'}
                    {link.type === 'github' && 'GitHub'}
                    {link.type === 'portfolio' && 'Portfolio'}
                    {link.type === 'website' && 'Webb'}
                    {link.type === 'other' && (link.label || 'Länk')}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Section title component
  const SectionTitle = ({ children, icon: Icon }: { children: React.ReactNode; icon?: any }) => (
    <h2 
      className="text-lg font-semibold mb-4 pb-2 flex items-center gap-2"
      style={{ 
        fontFamily: template.font,
        color: template.colors.primary,
        borderBottom: template.sectionTitle.style === 'underline' ? `2px solid ${template.colors.primary}` : 
                      template.sectionTitle.style === 'line' ? `1px solid ${template.colors.border}` :
                      template.sectionTitle.style === 'elegant' ? `2px solid ${template.colors.accent}` :
                      'none',
        textTransform: template.sectionTitle.transform as any,
        letterSpacing: template.sectionTitle.letterSpacing,
      }}
    >
      {Icon && <Icon size={20} />}
      {children}
    </h2>
  )

  // Skill tag component
  const SkillTag = ({ skill }: { skill: any }) => (
    <span 
      className="px-3 py-1 text-sm"
      style={{ 
        fontFamily: template.font,
        backgroundColor: template.skillTag.bg,
        border: template.skillTag.border,
        borderRadius: template.skillTag.radius,
        color: template.colors.text,
      }}
    >
      {getSkillName(skill)}
    </span>
  )

  return (
    <div 
      className="cv-preview bg-white shadow-xl overflow-hidden"
      style={{ 
        fontFamily: template.font,
        maxWidth: '210mm',
        margin: '0 auto',
      }}
    >
      {renderHeader()}

      <div className="px-8 pb-8 space-y-6">
        {/* Summary */}
        {data.summary && (
          <section>
            <SectionTitle>Profil</SectionTitle>
            <p 
              className="leading-relaxed"
              style={{ 
                fontFamily: template.font,
                color: template.colors.text,
                fontSize: '0.95rem',
              }}
            >
              {data.summary}
            </p>
          </section>
        )}

        {/* Work Experience */}
        {data.workExperience && data.workExperience.length > 0 && (
          <section>
            <SectionTitle icon={Briefcase}>Erfarenhet</SectionTitle>
            <div className="space-y-4">
              {data.workExperience.map((job) => (
                <div key={job.id} className="break-inside-avoid">
                  <div className="flex justify-between items-start gap-4">
                    <h3 
                      className="font-semibold text-base"
                      style={{ fontFamily: template.font, color: template.colors.text }}
                    >
                      {job.title}
                    </h3>
                    <span 
                      className="text-sm shrink-0"
                      style={{ color: template.colors.muted }}
                    >
                      {job.startDate} – {job.current ? 'Pågående' : job.endDate}
                    </span>
                  </div>
                  <p 
                    className="text-sm mt-0.5"
                    style={{ color: template.colors.muted }}
                  >
                    {job.company}{job.location && `, ${job.location}`}
                  </p>
                  {job.description && (
                    <p 
                      className="mt-2 text-sm leading-relaxed"
                      style={{ color: template.colors.text }}
                    >
                      {job.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <section>
            <SectionTitle icon={GraduationCap}>Utbildning</SectionTitle>
            <div className="space-y-4">
              {data.education.map((edu) => (
                <div key={edu.id} className="break-inside-avoid">
                  <div className="flex justify-between items-start gap-4">
                    <h3 
                      className="font-semibold text-base"
                      style={{ fontFamily: template.font, color: template.colors.text }}
                    >
                      {edu.degree}
                    </h3>
                    <span 
                      className="text-sm shrink-0"
                      style={{ color: template.colors.muted }}
                    >
                      {edu.startDate} – {edu.endDate}
                    </span>
                  </div>
                  <p 
                    className="text-sm mt-0.5"
                    style={{ color: template.colors.muted }}
                  >
                    {edu.school}{edu.field && ` – ${edu.field}`}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {(data.skills?.length || 0) > 0 && (
          <section>
            <SectionTitle icon={Wrench}>Kompetenser</SectionTitle>
            
            {technicalSkills.length > 0 && (
              <div className="mb-3">
                <h4 
                  className="text-xs uppercase tracking-wider mb-2"
                  style={{ color: template.colors.muted }}
                >
                  Tekniska
                </h4>
                <div className="flex flex-wrap gap-2">
                  {technicalSkills.map((skill) => (
                    <SkillTag key={typeof skill === 'object' ? skill.id : skill} skill={skill} />
                  ))}
                </div>
              </div>
            )}

            {softSkills.length > 0 && (
              <div className="mb-3">
                <h4 
                  className="text-xs uppercase tracking-wider mb-2"
                  style={{ color: template.colors.muted }}
                >
                  Mjuka färdigheter
                </h4>
                <div className="flex flex-wrap gap-2">
                  {softSkills.map((skill) => (
                    <SkillTag key={typeof skill === 'object' ? skill.id : skill} skill={skill} />
                  ))}
                </div>
              </div>
            )}

            {otherSkills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {otherSkills.map((skill) => (
                  <SkillTag key={typeof skill === 'object' ? skill.id : skill} skill={skill} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Languages & Certificates Grid */}
        {(data.languages?.length > 0 || data.certificates?.length > 0) && (
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {data.languages && data.languages.length > 0 && (
                <div>
                  <SectionTitle>Språk</SectionTitle>
                  <div className="space-y-2">
                    {data.languages.map((lang) => (
                      <div 
                        key={lang.id} 
                        className="flex items-center gap-2"
                      >
                        <span 
                          className="font-medium"
                          style={{ color: template.colors.text }}
                        >
                          {lang.language || (lang as any).name}
                        </span>
                        <span style={{ color: template.colors.muted }}>
                          ({lang.level})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.certificates && data.certificates.length > 0 && (
                <div>
                  <SectionTitle icon={Award}>Certifikat</SectionTitle>
                  <div className="space-y-2">
                    {data.certificates.map((cert) => (
                      <div key={cert.id}>
                        <span 
                          className="font-medium block"
                          style={{ color: template.colors.text }}
                        >
                          {cert.name}
                        </span>
                        <span 
                          className="text-sm"
                          style={{ color: template.colors.muted }}
                        >
                          {cert.issuer}{cert.date && `, ${cert.date}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* References */}
        {data.references && data.references.length > 0 && (
          <section>
            <SectionTitle icon={Users}>Referenser</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.references.map((ref) => (
                <div key={ref.id}>
                  <span 
                    className="font-semibold block"
                    style={{ color: template.colors.text }}
                  >
                    {ref.name}
                  </span>
                  <span 
                    className="text-sm block"
                    style={{ color: template.colors.muted }}
                  >
                    {ref.title}{ref.company && `, ${ref.company}`}
                  </span>
                  {ref.phone && (
                    <span 
                      className="text-sm block"
                      style={{ color: template.colors.muted }}
                    >
                      {ref.phone}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default CVPreview
