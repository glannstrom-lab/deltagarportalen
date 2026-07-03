/**
 * Nordic Template - Scandinavian Minimalism
 * Light, airy, clean sidebar layout
 */

import type { TemplateProps } from './types'
import { getLanguageLevelDisplay, getSkillName, getInitials } from './helpers'

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
      {/* Light sidebar — narrower (240px) + tighter padding för bättre A4-balans */}
      <aside
        style={{
          width: '240px',
          background: '#F8FAFC',
          padding: '32px 24px',
          borderRight: '1px solid #E2E8F0',
          flexShrink: 0,
        }}
      >
        {/* Photo — fast storlek 140px så den inte tar 240px höjd */}
        <div className="cv-keep" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          {data.profileImage ? (
            <img
              src={data.profileImage}
              alt=""
              style={{
                width: '140px',
                height: '140px',
                objectFit: 'cover',
                borderRadius: '18px',
              }}
            />
          ) : (
            <div
              style={{
                width: '140px',
                height: '140px',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '40px', fontWeight: 300, color: '#94A3B8', letterSpacing: '0.02em' }}>
                {getInitials(data.firstName, data.lastName)}
              </span>
            </div>
          )}
        </div>

        {/* Contact */}
        <div style={{ marginBottom: '22px' }}>
          <h3
            style={{
              fontSize: '10.5px',
              fontWeight: '500',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#94A3B8',
              marginBottom: '10px',
            }}
          >
            Kontakt
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {data.email && (
              <a
                href={`mailto:${data.email}`}
                style={{
                  fontSize: '11.5px',
                  color: '#334155',
                  textDecoration: 'none',
                  wordBreak: 'break-all',
                  lineHeight: 1.4,
                }}
              >
                {data.email}
              </a>
            )}
            {data.phone && <span style={{ fontSize: '12px', color: '#334155' }}>{data.phone}</span>}
            {data.location && <span style={{ fontSize: '12px', color: '#334155' }}>{data.location}</span>}
          </div>
        </div>

        {/* Länkar — nära kontaktuppgifterna */}
        {data.links?.length > 0 && (
          <div className="cv-keep" style={{ marginBottom: '22px' }}>
            <h3
              style={{
                fontSize: '10.5px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#94A3B8',
                marginBottom: '8px',
              }}
            >
              Länkar
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {data.links.map(link => (
                <div key={link.id} className="cv-entry">
                  {link.label && (
                    <div style={{ fontSize: '12px', color: '#334155', fontWeight: 500 }}>{link.label}</div>
                  )}
                  <div style={{ fontSize: '10.5px', color: '#64748B', wordBreak: 'break-all', lineHeight: 1.4 }}>
                    {link.url}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {data.skills?.length > 0 && (
          <div style={{ marginBottom: '22px' }}>
            <h3
              style={{
                fontSize: '10.5px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#94A3B8',
                marginBottom: '8px',
              }}
            >
              Kompetenser
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {data.skills.map((skill, i) => (
                <span key={i} style={{ fontSize: '12px', color: '#334155' }}>
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
                fontSize: '10.5px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#94A3B8',
                marginBottom: '8px',
              }}
            >
              Språk
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {data.languages.map(lang => {
                const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                return (
                  <div key={lang.id} className="cv-entry">
                    <div style={{ fontSize: '12px', color: '#334155', fontWeight: 500 }}>{name}</div>
                    <div style={{ fontSize: '10.5px', color: '#94A3B8', fontStyle: 'italic', marginTop: '0' }}>
                      {getLanguageLevelDisplay(lang.level)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: '32px 40px' }}>
        <header style={{ marginBottom: '20px' }}>
          <h1
            style={{
              fontSize: '34px',
              fontWeight: '600',
              letterSpacing: '-0.02em',
              color: '#0F172A',
              marginBottom: '4px',
              lineHeight: 1.05,
            }}
          >
            {fullName}
          </h1>
          {data.title && <p style={{ fontSize: '16px', color: accent }}>{data.title}</p>}
        </header>

        {/* Summary */}
        {data.summary && (
          <section style={{ marginBottom: '20px' }}>
            <p
              style={{
                fontSize: '13px',
                lineHeight: '1.55',
                color: '#475569',
              }}
            >
              {data.summary}
            </p>
          </section>
        )}

        {/* Experience */}
        {data.workExperience?.length > 0 && (
          <section style={{ marginBottom: '20px' }}>
            <h2
              style={{
                fontSize: '11px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#94A3B8',
                marginBottom: '12px',
                paddingBottom: '6px',
                borderBottom: '1px solid #E2E8F0',
              }}
            >
              Erfarenhet
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.workExperience.map(job => (
                <div key={job.id} className="cv-entry">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '2px',
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: '14.5px', fontWeight: '600', color: '#0F172A' }}>{job.title}</h3>
                      <div style={{ fontSize: '12.5px', color: accent }}>{job.company}</div>
                    </div>
                    <span style={{ fontSize: '11px', color: '#94A3B8', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                      {job.startDate} — {job.current ? 'Nu' : job.endDate}
                    </span>
                  </div>
                  {job.description && (
                    <p style={{ fontSize: '12.5px', lineHeight: '1.5', color: '#64748B', marginTop: '4px' }}>
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
                marginBottom: '12px',
                paddingBottom: '6px',
                borderBottom: '1px solid #E2E8F0',
              }}
            >
              Utbildning
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.education.map(edu => (
                <div key={edu.id} className="cv-entry">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '13.5px', fontWeight: '600', color: '#0F172A' }}>{edu.degree}</h3>
                      <div style={{ fontSize: '12.5px', color: '#64748B' }}>{edu.school}</div>
                    </div>
                    <span style={{ fontSize: '11px', color: '#94A3B8', marginLeft: '12px' }}>
                      {edu.startDate} — {edu.endDate}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Certifikat */}
        {data.certificates?.length > 0 && (
          <section className="cv-keep" style={{ marginTop: '20px' }}>
            <h2
              style={{
                fontSize: '11px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#94A3B8',
                marginBottom: '12px',
                paddingBottom: '6px',
                borderBottom: '1px solid #E2E8F0',
              }}
            >
              Certifikat
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {data.certificates.map(cert => (
                <div key={cert.id} className="cv-entry">
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#0F172A' }}>{cert.name}</span>
                  {cert.issuer && <span style={{ fontSize: '12px', color: '#64748B' }}> · {cert.issuer}</span>}
                  {cert.date && <span style={{ fontSize: '12px', color: '#94A3B8' }}> · {cert.date}</span>}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
