import { Mail, Phone, MapPin, Briefcase, GraduationCap, Wrench } from 'lucide-react'
import type { Template } from './CVTemplateSelector'

interface CVData {
  firstName: string
  lastName: string
  title: string
  email: string
  phone: string
  location: string
  summary: string
  skills: string
  workExperience: Array<{
    id: string
    company: string
    title: string
    startDate: string
    endDate: string
    current: boolean
    description: string
  }>
  education: Array<{
    id: string
    school: string
    degree: string
    field: string
    startDate: string
    endDate: string
  }>
}

interface CVPreviewProps {
  data: CVData
  template: Template
}

// Hex-färger för PDF-export-kompatibilitet (undviker oklch-problem)
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

export function CVPreview({ data, template }: CVPreviewProps) {
  const fullName = `${data.firstName} ${data.lastName}`.trim() || 'Ditt Namn'
  
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
        {data.workExperience.length > 0 && (
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
                  <p style={{ color: colors.slate[600] }}>{job.company}</p>
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
        {data.education.length > 0 && (
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
                  <p style={{ color: colors.slate[600] }}>{edu.school}</p>
                  {edu.field && (
                    <p className="text-sm" style={{ color: colors.slate[700] }}>
                      {edu.field}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {data.skills && (
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
            <div className="flex flex-wrap gap-2">
              {data.skills.split(',').map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full text-sm"
                  style={{
                    backgroundColor: `${template.secondaryColor}20`,
                    color: template.primaryColor,
                  }}
                >
                  {skill.trim()}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
