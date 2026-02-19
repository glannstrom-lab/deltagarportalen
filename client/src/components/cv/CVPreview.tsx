import { Mail, Phone, MapPin, Briefcase, GraduationCap, Wrench, Award, Link2, Users, Languages } from 'lucide-react'
import type { CVData } from '@/services/mockApi'

interface CVPreviewProps {
  data: CVData
}

// Color schemes
const colorSchemes: Record<string, { primary: string; secondary: string; accent: string }> = {
  indigo: { primary: '#4f46e5', secondary: '#6366f1', accent: '#818cf8' },
  ocean: { primary: '#0ea5e9', secondary: '#38bdf8', accent: '#7dd3fc' },
  forest: { primary: '#059669', secondary: '#10b981', accent: '#34d399' },
  berry: { primary: '#db2777', secondary: '#ec4899', accent: '#f472b6' },
  sunset: { primary: '#ea580c', secondary: '#f97316', accent: '#fb923c' },
  ruby: { primary: '#dc2626', secondary: '#ef4444', accent: '#f87171' },
  slate: { primary: '#1e293b', secondary: '#475569', accent: '#64748b' },
  violet: { primary: '#7c3aed', secondary: '#8b5cf6', accent: '#a78bfa' },
  cyan: { primary: '#0891b2', secondary: '#06b6d4', accent: '#22d3ee' },
  rose: { primary: '#e11d48', secondary: '#fb7185', accent: '#fda4af' },
}

// Fonts
const fonts: Record<string, string> = {
  inter: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  roboto: 'Roboto, -apple-system, sans-serif',
  georgia: 'Georgia, Times New Roman, serif',
  playfair: 'Playfair Display, Georgia, serif',
  merriweather: 'Merriweather, Georgia, serif',
  jetbrains: 'JetBrains Mono, Consolas, monospace',
  opensans: 'Open Sans, -apple-system, sans-serif',
  montserrat: 'Montserrat, -apple-system, sans-serif',
  dyslexic: 'OpenDyslexic, sans-serif',
}

export function CVPreview({ data }: CVPreviewProps) {
  return (
    <CVPreviewContent data={data} />
  )
}

function CVPreviewContent({ data }: CVPreviewProps) {
  const fullName = `${data.firstName} ${data.lastName}`.trim() || 'Ditt Namn'
  const scheme = colorSchemes[data.colorScheme || 'indigo']
  const fontFamily = fonts[data.font || 'inter']
  const template = data.template || 'modern'
  
  // Group skills by category
  const technicalSkills = data.skills?.filter(s => s.category === 'technical') || []
  const softSkills = data.skills?.filter(s => s.category === 'soft') || []
  const toolSkills = data.skills?.filter(s => s.category === 'tool') || []
  const otherSkills = data.skills?.filter(s => !s.category || s.category === 'language') || []
  
  // Template-specific styles
  const getTemplateStyles = () => {
    switch (template) {
      case 'classic':
        return {
          header: { backgroundColor: '#ffffff', color: scheme.primary, borderBottom: `2px solid ${scheme.primary}` },
          sectionTitle: { color: scheme.primary, borderBottom: `1px solid ${scheme.secondary}`, textTransform: 'uppercase' as const, fontSize: '0.875rem', letterSpacing: '0.05em' },
          skillTag: { backgroundColor: 'transparent', color: scheme.primary, border: `1px solid ${scheme.secondary}` },
        }
      case 'minimal':
        return {
          header: { backgroundColor: '#f8fafc', color: '#0f172a', borderBottom: 'none' },
          sectionTitle: { color: '#0f172a', borderBottom: `2px solid ${scheme.primary}`, fontWeight: 300 },
          skillTag: { backgroundColor: '#f1f5f9', color: '#334155' },
        }
      case 'creative':
        return {
          header: { backgroundColor: `linear-gradient(135deg, ${scheme.primary} 0%, ${scheme.secondary} 100%)`, color: '#ffffff' },
          sectionTitle: { color: scheme.primary, borderBottom: `3px solid ${scheme.accent}`, fontStyle: 'italic' as const },
          skillTag: { backgroundColor: scheme.primary, color: '#ffffff' },
        }
      case 'tech':
        return {
          header: { backgroundColor: '#0f172a', color: scheme.secondary, borderLeft: `4px solid ${scheme.primary}` },
          sectionTitle: { color: scheme.primary, borderBottom: `2px dashed ${scheme.secondary}`, fontFamily: fonts.jetbrains },
          skillTag: { backgroundColor: '#1e293b', color: scheme.secondary, border: `1px solid ${scheme.primary}` },
        }
      case 'executive':
        return {
          header: { backgroundColor: '#1e3a5f', color: '#ffffff' },
          sectionTitle: { color: '#1e3a5f', borderBottom: `2px solid #c9a227`, fontFamily: fonts.playfair },
          skillTag: { backgroundColor: '#f8fafc', color: '#1e3a5f', border: `1px solid #c9a227` },
        }
      case 'academic':
        return {
          header: { backgroundColor: '#ffffff', color: scheme.primary, borderBottom: `3px double ${scheme.primary}` },
          sectionTitle: { color: scheme.primary, borderBottom: `1px dotted ${scheme.secondary}`, fontFamily: fonts.merriweather },
          skillTag: { backgroundColor: '#fafafa', color: '#333', border: `1px solid #ddd` },
        }
      case 'corporate':
        return {
          header: { backgroundColor: scheme.primary, color: '#ffffff' },
          sectionTitle: { color: scheme.primary, borderLeft: `4px solid ${scheme.secondary}`, paddingLeft: '12px', borderBottom: 'none' },
          skillTag: { backgroundColor: '#f0fdf4', color: scheme.primary },
        }
      default: // modern
        return {
          header: { backgroundColor: scheme.primary, color: '#ffffff' },
          sectionTitle: { color: scheme.primary, borderBottom: `2px solid ${scheme.primary}` },
          skillTag: { backgroundColor: `${scheme.secondary}20`, color: scheme.primary },
        }
    }
  }
  
  const styles = getTemplateStyles()
  
  // Skill level dots
  const SkillLevel = ({ level }: { level?: number }) => {
    if (!level) return null
    return (
      <div className="flex gap-0.5 mt-1">
        {[1, 2, 3, 4, 5].map((dot) => (
          <div
            key={dot}
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: dot <= level ? 'currentColor' : '#cbd5e1' }}
          />
        ))}
      </div>
    )
  }
  
  return (
    <div 
      className="bg-white shadow-lg overflow-hidden"
      style={{ 
        fontFamily, 
        backgroundColor: '#ffffff',
        width: '210mm',
        maxWidth: '100%',
      }}
      data-cv-export="true"
    >
      {/* Header - Template specific */}
      <div 
        className="p-8"
        style={styles.header}
      >
        <h1 className="text-3xl font-bold" style={{ fontFamily }}>{fullName}</h1>
        {data.title && (
          <p className="text-xl mt-2" style={{ opacity: 0.9 }}>{data.title}</p>
        )}
        
        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          {data.email && (
            <div className="flex items-center gap-1">
              <Mail size={14} />
              {data.email}
            </div>
          )}
          {data.phone && (
            <div className="flex items-center gap-1">
              <Phone size={14} />
              {data.phone}
            </div>
          )}
          {data.location && (
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              {data.location}
            </div>
          )}
        </div>

        {/* Links */}
        {data.links && data.links.length > 0 && (
          <div className="flex flex-wrap gap-4 mt-3 text-sm">
            {data.links.map((link) => (
              <div key={link.id} className="flex items-center gap-1">
                <Link2 size={14} />
                {link.type === 'linkedin' && 'LinkedIn'}
                {link.type === 'github' && 'GitHub'}
                {link.type === 'portfolio' && 'Portfolio'}
                {link.type === 'website' && 'Webbplats'}
                {link.type === 'other' && link.label || 'Länk'}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-8 space-y-5" style={{ backgroundColor: '#ffffff' }}>
        {/* Summary */}
        {data.summary && (
          <section className="avoid-break" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <h2 
              className="text-lg font-semibold mb-3 pb-1"
              style={styles.sectionTitle}
            >
              Profil
            </h2>
            <p className="leading-relaxed text-sm" style={{ color: '#334155' }}>
              {data.summary}
            </p>
          </section>
        )}

        {/* Work Experience */}
        {data.workExperience && data.workExperience.length > 0 && (
          <section className="avoid-break" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <h2 
              className="text-lg font-semibold mb-3 pb-1 flex items-center gap-2"
              style={styles.sectionTitle}
            >
              <Briefcase size={18} />
              Arbetslivserfarenhet
            </h2>
            <div className="space-y-3">
              {data.workExperience.map((job) => (
                <div key={job.id} className="break-inside-avoid">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-sm" style={{ color: '#1e293b' }}>
                      {job.title}
                    </h3>
                    <span className="text-xs" style={{ color: '#64748b' }}>
                      {job.startDate} - {job.current ? 'Pågående' : job.endDate}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: '#475569' }}>{job.company}{job.location && `, ${job.location}`}</p>
                  {job.description && (
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: '#334155' }}>
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
          <section className="avoid-break" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <h2 
              className="text-lg font-semibold mb-3 pb-1 flex items-center gap-2"
              style={styles.sectionTitle}
            >
              <GraduationCap size={18} />
              Utbildning
            </h2>
            <div className="space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id} className="break-inside-avoid">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-sm" style={{ color: '#1e293b' }}>
                      {edu.degree}
                    </h3>
                    <span className="text-xs" style={{ color: '#64748b' }}>
                      {edu.startDate} - {edu.endDate}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: '#475569' }}>{edu.school}{edu.field && ` - ${edu.field}`}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {(data.skills?.length || 0) > 0 && (
          <section className="avoid-break" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <h2 
              className="text-lg font-semibold mb-3 pb-1 flex items-center gap-2"
              style={styles.sectionTitle}
            >
              <Wrench size={18} />
              Kompetenser
            </h2>
            
            {technicalSkills.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: '#64748b' }}>Tekniska</h4>
                <div className="flex flex-wrap gap-2">
                  {technicalSkills.map((skill) => (
                    <span
                      key={skill.id}
                      className="skill-tag px-2 py-1 rounded text-xs font-medium"
                      style={styles.skillTag}
                    >
                      {skill.name}
                      <SkillLevel level={skill.level} />
                    </span>
                  ))}
                </div>
              </div>
            )}

            {softSkills.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: '#64748b' }}>Mjuka färdigheter</h4>
                <div className="flex flex-wrap gap-2">
                  {softSkills.map((skill) => (
                    <span
                      key={skill.id}
                      className="skill-tag px-2 py-1 rounded text-xs font-medium"
                      style={styles.skillTag}
                    >
                      {skill.name}
                      <SkillLevel level={skill.level} />
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(toolSkills.length > 0 || otherSkills.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {[...toolSkills, ...otherSkills].map((skill) => (
                  <span
                    key={skill.id}
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={styles.skillTag}
                  >
                    {skill.name}
                    <SkillLevel level={skill.level} />
                  </span>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Languages */}
        {data.languages && data.languages.length > 0 && (
          <section className="avoid-break" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <h2 
              className="text-lg font-semibold mb-3 pb-1 flex items-center gap-2"
              style={styles.sectionTitle}
            >
              <Languages size={18} />
              Språk
            </h2>
            <div className="flex flex-wrap gap-4">
              {data.languages.map((lang) => (
                <div key={lang.id} className="flex items-center gap-2">
                  <span className="font-medium text-sm" style={{ color: '#1e293b' }}>{lang.language}</span>
                  <span className="text-xs" style={{ color: '#64748b' }}>({lang.level})</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Certificates */}
        {data.certificates && data.certificates.length > 0 && (
          <section className="avoid-break" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <h2 
              className="text-lg font-semibold mb-3 pb-1 flex items-center gap-2"
              style={styles.sectionTitle}
            >
              <Award size={18} />
              Certifikat
            </h2>
            <div className="space-y-2">
              {data.certificates.map((cert) => (
                <div key={cert.id} className="flex justify-between text-sm">
                  <span style={{ color: '#334155' }}>{cert.name}</span>
                  <span className="text-xs" style={{ color: '#64748b' }}>{cert.issuer}, {cert.date}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* References */}
        {data.references && data.references.length > 0 && (
          <section className="avoid-break" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <h2 
              className="text-lg font-semibold mb-3 pb-1 flex items-center gap-2"
              style={styles.sectionTitle}
            >
              <Users size={18} />
              Referenser
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.references.map((ref) => (
                <div key={ref.id} className="text-sm">
                  <p className="font-medium" style={{ color: '#1e293b' }}>{ref.name}</p>
                  <p style={{ color: '#475569' }}>{ref.title}, {ref.company}</p>
                  {ref.phone && <p className="text-xs" style={{ color: '#64748b' }}>{ref.phone}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
