import { Mail, Phone, MapPin, Briefcase, GraduationCap, Wrench, Award, Link2, Users, Languages } from 'lucide-react'
import type { Template } from './CVTemplateSelector'
import type { CVData } from '@/services/mockApi'

interface CVPreviewProps {
  data: CVData
  template: Template
}

// Hex-färger för PDF-export-kompatibilitet
const colors = {
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  }
}

// Skill level display component
function SkillLevel({ level }: { level?: number }) {
  if (!level) return null
  
  return (
    <div className="flex gap-0.5 mt-1">
      {[1, 2, 3, 4, 5].map((dot) => (
        <div
          key={dot}
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: dot <= level ? 'currentColor' : colors.slate[300],
          }}
        />
      ))}
    </div>
  )
}

export function CVPreview({ data, template }: CVPreviewProps) {
  const fullName = `${data.firstName} ${data.lastName}`.trim() || 'Ditt Namn'
  
  // Group skills by category
  const technicalSkills = data.skills?.filter(s => s.category === 'technical') || []
  const softSkills = data.skills?.filter(s => s.category === 'soft') || []
  const toolSkills = data.skills?.filter(s => s.category === 'tool') || []
  const otherSkills = data.skills?.filter(s => !s.category || s.category === 'language') || []
  
  return (
    <div 
      className="bg-white rounded-2xl shadow-lg overflow-hidden"
      style={{ 
        fontFamily: template.font,
        backgroundColor: '#ffffff'
      }}
      data-cv-export="true"
    >
      {/* Header */}
      <div 
        className="p-8"
        style={{ 
          backgroundColor: template.primaryColor,
          color: '#ffffff'
        }}
      >
        <h1 className="text-3xl font-bold">{fullName}</h1>
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

      <div className="p-8 space-y-6" style={{ backgroundColor: '#ffffff' }}>
        {/* Summary */}
        {data.summary && (
          <section>
            <h2 
              className="text-lg font-semibold mb-3 pb-2 border-b-2"
              style={{ 
                borderColor: template.primaryColor, 
                color: template.primaryColor 
              }}
            >
              Profil
            </h2>
            <p className="leading-relaxed" style={{ color: colors.slate[700] }}>
              {data.summary}
            </p>
          </section>
        )}

        {/* Work Experience */}
        {data.workExperience && data.workExperience.length > 0 && (
          <section>
            <h2 
              className="text-lg font-semibold mb-3 pb-2 border-b-2 flex items-center gap-2"
              style={{ 
                borderColor: template.primaryColor, 
                color: template.primaryColor 
              }}
            >
              <Briefcase size={18} />
              Arbetslivserfarenhet
            </h2>
            <div className="space-y-4">
              {data.workExperience.map((job) => (
                <div key={job.id}>
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold" style={{ color: colors.slate[800] }}>
                      {job.title}
                    </h3>
                    <span className="text-sm" style={{ color: colors.slate[500] }}>
                      {job.startDate} - {job.current ? 'Pågående' : job.endDate}
                    </span>
                  </div>
                  <p style={{ color: colors.slate[600] }}>{job.company}{job.location && `, ${job.location}`}</p>
                  {job.description && (
                    <p className="mt-1 text-sm" style={{ color: colors.slate[700] }}>
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
            <h2 
              className="text-lg font-semibold mb-3 pb-2 border-b-2 flex items-center gap-2"
              style={{ 
                borderColor: template.primaryColor, 
                color: template.primaryColor 
              }}
            >
              <GraduationCap size={18} />
              Utbildning
            </h2>
            <div className="space-y-4">
              {data.education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold" style={{ color: colors.slate[800] }}>
                      {edu.degree}
                    </h3>
                    <span className="text-sm" style={{ color: colors.slate[500] }}>
                      {edu.startDate} - {edu.endDate}
                    </span>
                  </div>
                  <p style={{ color: colors.slate[600] }}>{edu.school}{edu.field && ` - ${edu.field}`}</p>
                  {edu.description && (
                    <p className="text-sm" style={{ color: colors.slate[700] }}>
                      {edu.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills with categories */}
        {data.skills && data.skills.length > 0 && (
          <section>
            <h2 
              className="text-lg font-semibold mb-3 pb-2 border-b-2 flex items-center gap-2"
              style={{ 
                borderColor: template.primaryColor, 
                color: template.primaryColor 
              }}
            >
              <Wrench size={18} />
              Kompetenser
            </h2>
            
            {technicalSkills.length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-medium mb-2" style={{ color: colors.slate[600] }}>Tekniska</h4>
                <div className="flex flex-wrap gap-2">
                  {technicalSkills.map((skill) => (
                    <span
                      key={skill.id}
                      className="px-3 py-1 rounded-full text-sm flex flex-col items-center"
                      style={{
                        backgroundColor: `${template.secondaryColor}20`,
                        color: template.primaryColor,
                      }}
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
                <h4 className="text-sm font-medium mb-2" style={{ color: colors.slate[600] }}>Mjuka färdigheter</h4>
                <div className="flex flex-wrap gap-2">
                  {softSkills.map((skill) => (
                    <span
                      key={skill.id}
                      className="px-3 py-1 rounded-full text-sm flex flex-col items-center"
                      style={{
                        backgroundColor: `${template.secondaryColor}20`,
                        color: template.primaryColor,
                      }}
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
                    className="px-3 py-1 rounded-full text-sm flex flex-col items-center"
                    style={{
                      backgroundColor: `${template.secondaryColor}20`,
                      color: template.primaryColor,
                    }}
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
          <section>
            <h2 
              className="text-lg font-semibold mb-3 pb-2 border-b-2 flex items-center gap-2"
              style={{ 
                borderColor: template.primaryColor, 
                color: template.primaryColor 
              }}
            >
              <Languages size={18} />
              Språk
            </h2>
            <div className="flex flex-wrap gap-4">
              {data.languages.map((lang) => (
                <div key={lang.id} className="flex items-center gap-2">
                  <span className="font-medium" style={{ color: colors.slate[800] }}>{lang.language}</span>
                  <span className="text-sm" style={{ color: colors.slate[500] }}>({lang.level})</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Certificates */}
        {data.certificates && data.certificates.length > 0 && (
          <section>
            <h2 
              className="text-lg font-semibold mb-3 pb-2 border-b-2 flex items-center gap-2"
              style={{ 
                borderColor: template.primaryColor, 
                color: template.primaryColor 
              }}
            >
              <Award size={18} />
              Certifikat
            </h2>
            <div className="space-y-2">
              {data.certificates.map((cert) => (
                <div key={cert.id} className="flex justify-between">
                  <span style={{ color: colors.slate[700] }}>{cert.name}</span>
                  <span className="text-sm" style={{ color: colors.slate[500] }}>{cert.issuer}, {cert.date}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* References */}
        {data.references && data.references.length > 0 && (
          <section>
            <h2 
              className="text-lg font-semibold mb-3 pb-2 border-b-2 flex items-center gap-2"
              style={{ 
                borderColor: template.primaryColor, 
                color: template.primaryColor 
              }}
            >
              <Users size={18} />
              Referenser
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.references.map((ref) => (
                <div key={ref.id}>
                  <p className="font-medium" style={{ color: colors.slate[800] }}>{ref.name}</p>
                  <p className="text-sm" style={{ color: colors.slate[600] }}>{ref.title}, {ref.company}</p>
                  {ref.phone && <p className="text-sm" style={{ color: colors.slate[500] }}>{ref.phone}</p>}
                  {ref.email && <p className="text-sm" style={{ color: colors.slate[500] }}>{ref.email}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
