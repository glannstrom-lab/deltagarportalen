/**
 * Nordic Template - Scandinavian Minimalism
 * Light, airy, clean sidebar layout
 */

import type { TemplateProps } from './types'
import { getLanguageLevelPercent, getSkillName, getInitials } from './helpers'

const accent = '#0EA5E9'

export function NordicTemplate({ data, fullName }: TemplateProps) {
  return (
    <div
      className="cv-preview"
      style={{
        display: 'flex',
        minHeight: '297mm',
        fontFamily: "'Inter', -apple-system, sans-serif",
        background: '#FFFFFF',
      }}
    >
      {/* Light sidebar */}
      <aside
        style={{
          width: '280px',
          background: '#F8FAFC',
          padding: '56px 32px',
          borderRight: '1px solid #E2E8F0',
        }}
      >
        {/* Photo */}
        {data.profileImage ? (
          <img
            src={data.profileImage}
            alt=""
            style={{
              width: '100%',
              aspectRatio: '1',
              objectFit: 'cover',
              borderRadius: '20px',
              marginBottom: '32px',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              aspectRatio: '1',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '20px',
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '52px', fontWeight: 300, color: '#94A3B8', letterSpacing: '0.02em' }}>
              {getInitials(data.firstName, data.lastName)}
            </span>
          </div>
        )}

        {/* Contact */}
        <div style={{ marginBottom: '40px' }}>
          <h3
            style={{
              fontSize: '11px',
              fontWeight: '500',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#94A3B8',
              marginBottom: '20px',
            }}
          >
            Kontakt
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.email && (
              <a
                href={`mailto:${data.email}`}
                style={{
                  fontSize: '13px',
                  color: '#334155',
                  textDecoration: 'none',
                  wordBreak: 'break-all',
                }}
              >
                {data.email}
              </a>
            )}
            {data.phone && <span style={{ fontSize: '13px', color: '#334155' }}>{data.phone}</span>}
            {data.location && <span style={{ fontSize: '13px', color: '#334155' }}>{data.location}</span>}
          </div>
        </div>

        {/* Skills */}
        {data.skills?.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h3
              style={{
                fontSize: '11px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#94A3B8',
                marginBottom: '16px',
              }}
            >
              Kompetenser
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.skills.map((skill, i) => (
                <span key={i} style={{ fontSize: '13px', color: '#334155' }}>
                  {getSkillName(skill)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {data.languages?.length > 0 && (
          <div className="cv-keep">
            <h3
              style={{
                fontSize: '11px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#94A3B8',
                marginBottom: '16px',
              }}
            >
              Språk
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.languages.map(lang => {
                const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                const percent = getLanguageLevelPercent(lang.level)
                return (
                  <div key={lang.id} className="cv-entry">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', color: '#334155' }}>{name}</span>
                    </div>
                    <div style={{ height: '3px', background: '#E2E8F0', borderRadius: '2px' }}>
                      <div
                        style={{
                          width: `${percent}%`,
                          height: '100%',
                          background: accent,
                          borderRadius: '2px',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: '56px 48px' }}>
        <header style={{ marginBottom: '48px' }}>
          <h1
            style={{
              fontSize: '48px',
              fontWeight: '600',
              letterSpacing: '-0.02em',
              color: '#0F172A',
              marginBottom: '8px',
            }}
          >
            {fullName}
          </h1>
          {data.title && <p style={{ fontSize: '20px', color: accent }}>{data.title}</p>}
        </header>

        {/* Summary */}
        {data.summary && (
          <section style={{ marginBottom: '48px' }}>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.8',
                color: '#475569',
                maxWidth: '560px',
              }}
            >
              {data.summary}
            </p>
          </section>
        )}

        {/* Experience */}
        {data.workExperience?.length > 0 && (
          <section style={{ marginBottom: '48px' }}>
            <h2
              style={{
                fontSize: '11px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#94A3B8',
                marginBottom: '28px',
                paddingBottom: '12px',
                borderBottom: '1px solid #E2E8F0',
              }}
            >
              Erfarenhet
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {data.workExperience.map(job => (
                <div key={job.id} className="cv-entry">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px',
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#0F172A' }}>{job.title}</h3>
                      <div style={{ fontSize: '14px', color: accent }}>{job.company}</div>
                    </div>
                    <span style={{ fontSize: '12px', color: '#94A3B8', whiteSpace: 'nowrap' }}>
                      {job.startDate} — {job.current ? 'Nu' : job.endDate}
                    </span>
                  </div>
                  {job.description && (
                    <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#64748B', marginTop: '12px' }}>
                      {job.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {data.education?.length > 0 && (
          <section className="cv-keep">
            <h2
              style={{
                fontSize: '11px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#94A3B8',
                marginBottom: '28px',
                paddingBottom: '12px',
                borderBottom: '1px solid #E2E8F0',
              }}
            >
              Utbildning
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {data.education.map(edu => (
                <div key={edu.id} className="cv-entry" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0F172A' }}>{edu.degree}</h3>
                    <div style={{ fontSize: '14px', color: '#64748B' }}>{edu.school}</div>
                  </div>
                  <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                    {edu.startDate} — {edu.endDate}
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
