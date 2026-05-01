/**
 * Rotterdam Template - Spacious med stort efternamn + 2-kolumns body
 * Inspirerad av resume-example.com Rotterdam
 */

import type { TemplateProps } from './types'
import { getLanguageLevelDisplay, getSkillName, getInitials } from './helpers'

const ink = '#1F2937'
const muted = '#6B7280'

export function RotterdamTemplate({ data, fullName }: TemplateProps) {
  const firstName = (data.firstName || '').toUpperCase()
  const lastName = (data.lastName || '').toUpperCase()

  return (
    <div
      className="cv-preview"
      style={{
        minHeight: '297mm',
        background: '#FFFFFF',
        padding: '64px 72px',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <p style={{ fontSize: '20px', fontWeight: 300, letterSpacing: '0.45em', color: ink, marginBottom: '0px' }}>
            {firstName || fullName.toUpperCase()}
          </p>
          {lastName && (
            <h1
              style={{
                fontSize: '64px',
                fontWeight: 700,
                letterSpacing: '0.15em',
                lineHeight: 0.95,
                color: ink,
                marginTop: '6px',
              }}
            >
              {lastName}
            </h1>
          )}
          {data.title && (
            <p
              style={{
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: muted,
                marginTop: '8px',
              }}
            >
              {data.title}
            </p>
          )}
        </div>
        {data.profileImage ? (
          <img
            src={data.profileImage}
            alt=""
            style={{
              width: '110px',
              height: '110px',
              objectFit: 'cover',
              borderRadius: '50%',
            }}
          />
        ) : (
          <div
            style={{
              width: '110px',
              height: '110px',
              borderRadius: '50%',
              border: `1px solid #D1D5DB`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '34px',
              fontWeight: 300,
              color: muted,
              letterSpacing: '0.05em',
            }}
          >
            {getInitials(data.firstName, data.lastName)}
          </div>
        )}
      </header>

      <div style={{ height: '1px', background: '#E5E7EB', margin: '32px 0' }} />

      {/* Body 2-kolumns med tunn vertikal divider */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '48px', position: 'relative' }}>
        {/* Vänster kolumn */}
        <div>
          {/* Kontakt */}
          <section style={{ marginBottom: '36px' }}>
            <h3
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.25em',
                color: ink,
                marginBottom: '12px',
                paddingBottom: '6px',
                borderBottom: `1px solid ${ink}`,
              }}
            >
              KONTAKT
            </h3>
            <div style={{ fontSize: '11px', lineHeight: 1.7, color: '#374151' }}>
              {data.location && <div>{data.location}</div>}
              {data.phone && <div>{data.phone}</div>}
              {data.email && <div style={{ wordBreak: 'break-all' }}>{data.email}</div>}
            </div>
          </section>

          {/* Skills */}
          {data.skills?.length > 0 && (
            <section style={{ marginBottom: '36px' }}>
              <h3
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.25em',
                  color: ink,
                  marginBottom: '12px',
                  paddingBottom: '6px',
                  borderBottom: `1px solid ${ink}`,
                }}
              >
                KOMPETENSER
              </h3>
              <div style={{ fontSize: '11px', lineHeight: 1.7, color: '#374151' }}>
                {data.skills.map((skill, i) => (
                  <div key={i}>{getSkillName(skill)}</div>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {data.education?.length > 0 && (
            <section className="cv-keep" style={{ marginBottom: '36px' }}>
              <h3
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.25em',
                  color: ink,
                  marginBottom: '12px',
                  paddingBottom: '6px',
                  borderBottom: `1px solid ${ink}`,
                }}
              >
                UTBILDNING
              </h3>
              <div>
                {data.education.map((edu) => (
                  <div key={edu.id} className="cv-entry" style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: ink }}>{edu.degree}</div>
                    <div style={{ fontSize: '10px', color: muted }}>{edu.school}</div>
                    <div style={{ fontSize: '10px', color: muted }}>
                      {edu.startDate} - {edu.endDate}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Languages */}
          {data.languages?.length > 0 && (
            <section className="cv-keep">
              <h3
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.25em',
                  color: ink,
                  marginBottom: '12px',
                  paddingBottom: '6px',
                  borderBottom: `1px solid ${ink}`,
                }}
              >
                SPRÅK
              </h3>
              <div style={{ fontSize: '11px', lineHeight: 1.7, color: '#374151' }}>
                {data.languages.map((lang) => {
                  const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                  return (
                    <div key={lang.id} className="cv-entry" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{name}</span>
                      <span style={{ color: muted }}>{getLanguageLevelDisplay(lang.level)}</span>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        {/* Höger kolumn */}
        <div>
          {/* Profile/summary */}
          {data.summary && (
            <section style={{ marginBottom: '36px' }}>
              <h3
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.25em',
                  color: ink,
                  marginBottom: '12px',
                  paddingBottom: '6px',
                  borderBottom: `1px solid ${ink}`,
                }}
              >
                PROFIL
              </h3>
              <p style={{ fontSize: '12px', lineHeight: 1.7, color: '#374151' }}>{data.summary}</p>
            </section>
          )}

          {/* Experience */}
          {data.workExperience?.length > 0 && (
            <section>
              <h3
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.25em',
                  color: ink,
                  marginBottom: '12px',
                  paddingBottom: '6px',
                  borderBottom: `1px solid ${ink}`,
                }}
              >
                ERFARENHET
              </h3>
              <div>
                {data.workExperience.map((job) => (
                  <div key={job.id} className="cv-entry" style={{ marginBottom: '24px' }}>
                    <div
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        letterSpacing: '0.15em',
                        color: muted,
                        marginBottom: '4px',
                      }}
                    >
                      {job.title?.toUpperCase()} · {job.startDate} - {job.current ? 'Nu' : job.endDate}
                    </div>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: ink, marginBottom: '6px' }}>
                      {job.company}
                    </h4>
                    {job.description && (
                      <p style={{ fontSize: '12px', lineHeight: 1.6, color: '#4B5563' }}>{job.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
