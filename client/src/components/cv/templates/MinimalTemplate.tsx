/**
 * Minimal Template - Swiss Design inspired
 * Clean typography, extreme whitespace, Helvetica-style
 */

import type { TemplateProps } from './types'
import { getLanguageLevelDisplay, getSkillName } from './helpers'

export function MinimalTemplate({ data, fullName }: TemplateProps) {
  return (
    <div
      className="cv-preview"
      style={{
        minHeight: '297mm',
        background: '#FFFFFF',
        padding: '80px',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <header style={{ marginBottom: '64px' }}>
        <h1
          style={{
            fontSize: '64px',
            fontWeight: '700',
            letterSpacing: '-0.03em',
            lineHeight: '1',
            color: '#000000',
            marginBottom: '16px',
          }}
        >
          {fullName}
        </h1>
        {data.title && (
          <p
            style={{
              fontSize: '20px',
              fontWeight: '400',
              color: '#666666',
              letterSpacing: '0.02em',
            }}
          >
            {data.title}
          </p>
        )}

        {/* Contact */}
        <div
          style={{
            display: 'flex',
            gap: '32px',
            marginTop: '32px',
            paddingTop: '32px',
            borderTop: '1px solid #E5E5E5',
          }}
        >
          {data.email && <span style={{ fontSize: '14px', color: '#666666' }}>{data.email}</span>}
          {data.phone && <span style={{ fontSize: '14px', color: '#666666' }}>{data.phone}</span>}
          {data.location && <span style={{ fontSize: '14px', color: '#666666' }}>{data.location}</span>}
        </div>
      </header>

      {/* Summary */}
      {data.summary && (
        <section style={{ marginBottom: '64px', maxWidth: '640px' }}>
          <p style={{ fontSize: '18px', lineHeight: '1.7', color: '#333333' }}>
            {data.summary}
          </p>
        </section>
      )}

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '80px' }}>
        {/* Left - Experience */}
        <div>
          {data.workExperience?.length > 0 && (
            <section style={{ marginBottom: '48px' }}>
              <h2
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#999999',
                  marginBottom: '32px',
                }}
              >
                Erfarenhet
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                {data.workExperience.map(job => (
                  <div key={job.id} className="cv-entry">
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#999999', fontFeatureSettings: '"tnum"' }}>
                        {job.startDate} — {job.current ? 'Nu' : job.endDate}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#000000', marginBottom: '4px' }}>
                      {job.title}
                    </h3>
                    <div style={{ fontSize: '14px', color: '#666666', marginBottom: '12px' }}>
                      {job.company}
                    </div>
                    {job.description && (
                      <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#666666' }}>
                        {job.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.education?.length > 0 && (
            <section className="cv-keep">
              <h2
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#999999',
                  marginBottom: '32px',
                }}
              >
                Utbildning
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {data.education.map(edu => (
                  <div key={edu.id} className="cv-entry">
                    <span style={{ fontSize: '12px', color: '#999999', display: 'block', marginBottom: '4px' }}>
                      {edu.startDate} — {edu.endDate}
                    </span>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#000000' }}>{edu.degree}</h3>
                    <div style={{ fontSize: '14px', color: '#666666' }}>{edu.school}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right - Skills, Languages */}
        <div>
          {data.skills?.length > 0 && (
            <section style={{ marginBottom: '48px' }}>
              <h2
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#999999',
                  marginBottom: '24px',
                }}
              >
                Kompetenser
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.skills.map((skill, i) => (
                  <span key={i} style={{ fontSize: '14px', color: '#333333' }}>
                    {getSkillName(skill)}
                  </span>
                ))}
              </div>
            </section>
          )}

          {data.languages?.length > 0 && (
            <section className="cv-keep" style={{ marginBottom: '48px' }}>
              <h2
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#999999',
                  marginBottom: '24px',
                }}
              >
                Språk
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.languages.map(lang => {
                  const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                  return (
                    <div key={lang.id} className="cv-entry">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '14px', color: '#333333' }}>{name}</span>
                        <span style={{ fontSize: '14px', color: '#999999' }}>
                          {getLanguageLevelDisplay(lang.level)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {data.certificates?.length > 0 && (
            <section className="cv-keep">
              <h2
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#999999',
                  marginBottom: '24px',
                }}
              >
                Certifikat
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.certificates.map(cert => (
                  <div key={cert.id} className="cv-entry">
                    <div style={{ fontSize: '14px', color: '#333333' }}>{cert.name}</div>
                    <div style={{ fontSize: '12px', color: '#999999' }}>{cert.issuer}</div>
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
