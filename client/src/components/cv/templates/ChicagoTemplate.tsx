/**
 * Chicago Template - Klassisk centrerad header + 2-kolumns body med vertikal divider
 * Inspirerad av resume-example.com Chicago
 */

import type { TemplateProps } from './types'
import { getLanguageLevelDisplay, getSkillName, getInitials } from './helpers'

const ink = '#111827'
const muted = '#6B7280'

export function ChicagoTemplate({ data, fullName }: TemplateProps) {
  const initials = getInitials(data.firstName, data.lastName)

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
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          paddingBottom: '24px',
          borderBottom: '1px solid #D1D5DB',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '40px',
              fontWeight: 400,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: ink,
              lineHeight: 1.1,
            }}
          >
            {fullName}
          </h1>
          {data.title && (
            <p
              style={{
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: muted,
                marginTop: '8px',
              }}
            >
              {data.title}
            </p>
          )}
        </div>
        {/* Cirkulär monogram-emblem */}
        <div
          style={{
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            border: `1px solid ${ink}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {data.profileImage ? (
            <img
              src={data.profileImage}
              alt=""
              style={{
                width: '78px',
                height: '78px',
                objectFit: 'cover',
                borderRadius: '50%',
              }}
            />
          ) : (
            <span style={{ fontSize: '24px', fontWeight: 300, color: ink, letterSpacing: '0.1em' }}>{initials}</span>
          )}
        </div>
      </header>

      {/* Body 2-kolumns med tunn vertikal divider */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '180px 1fr',
          gap: '40px',
          position: 'relative',
        }}
      >
        {/* Vänster kolumn */}
        <div style={{ paddingRight: '20px', borderRight: '1px solid #E5E7EB' }}>
          {/* Kontakt */}
          <section style={{ marginBottom: '32px' }}>
            <h3
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.2em',
                color: ink,
                marginBottom: '14px',
              }}
            >
              KONTAKT
            </h3>
            <div style={{ fontSize: '11px', lineHeight: 1.7, color: '#374151' }}>
              {data.phone && <div style={{ marginBottom: '6px' }}>{data.phone}</div>}
              {data.email && <div style={{ marginBottom: '6px', wordBreak: 'break-all' }}>{data.email}</div>}
              {data.location && <div>{data.location}</div>}
            </div>
          </section>

          {/* Links */}
          {data.links?.length > 0 && (
            <section style={{ marginBottom: '32px' }}>
              <h3
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  color: ink,
                  marginBottom: '14px',
                }}
              >
                LÄNKAR
              </h3>
              <div>
                {data.links.map((link) => (
                  <div key={link.id} style={{ marginBottom: '10px' }}>
                    {link.label && (
                      <div style={{ fontSize: '11px', fontWeight: 600, color: ink }}>{link.label}</div>
                    )}
                    <div style={{ fontSize: '10px', color: muted, wordBreak: 'break-all' }}>{link.url}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills */}
          {data.skills?.length > 0 && (
            <section style={{ marginBottom: '32px' }}>
              <h3
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  color: ink,
                  marginBottom: '14px',
                }}
              >
                KOMPETENSER
              </h3>
              <div style={{ fontSize: '11px', lineHeight: 1.8, color: '#374151' }}>
                {data.skills.map((skill, i) => (
                  <div key={i}>{getSkillName(skill)}</div>
                ))}
              </div>
            </section>
          )}

          {/* Languages */}
          {data.languages?.length > 0 && (
            <section>
              <h3
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  color: ink,
                  marginBottom: '14px',
                }}
              >
                SPRÅK
              </h3>
              <div style={{ fontSize: '11px', lineHeight: 1.6, color: '#374151' }}>
                {data.languages.map((lang) => {
                  const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                  return (
                    <div key={lang.id} style={{ marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>{name}</span>
                      <span style={{ color: muted }}> — {getLanguageLevelDisplay(lang.level)}</span>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        {/* Höger kolumn */}
        <div>
          {/* About me */}
          {data.summary && (
            <section style={{ marginBottom: '32px' }}>
              <h3
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  color: ink,
                  marginBottom: '14px',
                }}
              >
                OM MIG
              </h3>
              <p style={{ fontSize: '12px', lineHeight: 1.7, color: '#374151' }}>{data.summary}</p>
            </section>
          )}

          {/* Experience */}
          {data.workExperience?.length > 0 && (
            <section style={{ marginBottom: '32px' }}>
              <h3
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  color: ink,
                  marginBottom: '18px',
                }}
              >
                ARBETSLIVSERFARENHET
              </h3>
              <div>
                {data.workExperience.map((job) => (
                  <div key={job.id} style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 700, color: ink }}>
                        {job.title}
                        {job.company && (
                          <span style={{ fontWeight: 500, color: '#4B5563' }}>, {job.company}</span>
                        )}
                      </h4>
                      <span style={{ fontSize: '11px', color: muted, whiteSpace: 'nowrap', marginLeft: '12px' }}>
                        {job.startDate} - {job.current ? 'Nu' : job.endDate}
                      </span>
                    </div>
                    {job.description && (
                      <p style={{ fontSize: '12px', lineHeight: 1.6, color: '#4B5563' }}>{job.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {data.education?.length > 0 && (
            <section>
              <h3
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  color: ink,
                  marginBottom: '18px',
                }}
              >
                UTBILDNING
              </h3>
              <div>
                {data.education.map((edu) => (
                  <div key={edu.id} style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 700, color: ink }}>
                        {edu.degree}
                        {edu.school && <span style={{ fontWeight: 500, color: '#4B5563' }}>, {edu.school}</span>}
                      </h4>
                      <span style={{ fontSize: '11px', color: muted, whiteSpace: 'nowrap', marginLeft: '12px' }}>
                        {edu.startDate} - {edu.endDate}
                      </span>
                    </div>
                    {edu.field && <div style={{ fontSize: '12px', color: muted, marginTop: '2px' }}>{edu.field}</div>}
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
