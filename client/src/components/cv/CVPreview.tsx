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

export function CVPreview({ data, template }: CVPreviewProps) {
  const fullName = `${data.firstName} ${data.lastName}`.trim() || 'Ditt Namn'
  
  return (
    <div 
      className="bg-white rounded-2xl shadow-lg overflow-hidden"
      style={{ fontFamily: template.font }}
    >
      {/* Header */}
      <div 
        className="p-8 text-white"
        style={{ backgroundColor: template.primaryColor }}
      >
        <h1 className="text-3xl font-bold">{fullName}</h1>
        {data.title && (
          <p className="text-xl mt-2 opacity-90">{data.title}</p>
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

      <div className="p-8 space-y-6">
        {/* Summary */}
        {data.summary && (
          <section>
            <h2 
              className="text-lg font-semibold mb-3 pb-2 border-b-2"
              style={{ borderColor: template.primaryColor, color: template.primaryColor }}
            >
              Profil
            </h2>
            <p className="text-slate-700 leading-relaxed">{data.summary}</p>
          </section>
        )}

        {/* Work Experience */}
        {data.workExperience.length > 0 && (
          <section>
            <h2 
              className="text-lg font-semibold mb-3 pb-2 border-b-2 flex items-center gap-2"
              style={{ borderColor: template.primaryColor, color: template.primaryColor }}
            >
              <Briefcase size={18} />
              Arbetslivserfarenhet
            </h2>
            <div className="space-y-4">
              {data.workExperience.map((job) => (
                <div key={job.id}>
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-slate-800">{job.title}</h3>
                    <span className="text-sm text-slate-500">
                      {job.startDate} - {job.current ? 'Pågående' : job.endDate}
                    </span>
                  </div>
                  <p className="text-slate-600">{job.company}</p>
                  {job.description && (
                    <p className="text-slate-700 mt-1 text-sm">{job.description}</p>
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
              style={{ borderColor: template.primaryColor, color: template.primaryColor }}
            >
              <GraduationCap size={18} />
              Utbildning
            </h2>
            <div className="space-y-4">
              {data.education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-slate-800">{edu.degree}</h3>
                    <span className="text-sm text-slate-500">
                      {edu.startDate} - {edu.endDate}
                    </span>
                  </div>
                  <p className="text-slate-600">{edu.school}</p>
                  {edu.field && <p className="text-slate-700 text-sm">{edu.field}</p>}
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
              style={{ borderColor: template.primaryColor, color: template.primaryColor }}
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
