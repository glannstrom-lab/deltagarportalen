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
        padding: '40px 48px',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <header style={{ marginBottom: '24px' }}>
        <h1
          style={{
            fontSize: '40px',
            fontWeight: '700',
            letterSpacing: '-0.03em',
            lineHeight: '1',
            color: '#000000',
            marginBottom: '8px',
          }}
        >
          {fullName}
        </h1>
        {data.title && (
          <p
            style={{
              fontSize: '15px',
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
            gap: '24px',
            marginTop: '16px',
            paddingTop: '14px',
            borderTop: '1px solid #E5E5E5',
          }}
        >
          {data.email && <span style={{ fontSize: '12px', color: '#666666' }}>{data.email}</span>}
          {data.phone && <span style={{ fontSize: '12px', color: '#666666' }}>{data.phone}</span>}
          {data.location && <span style={{ fontSize: '12px', color: '#666666' }}>{data.location}</span>}
        </div>
      </header>

      {/* Summary */}
      {data.summary && (
        <section style={{ marginBottom: '22px' }}>
          <p style={{ fontSize: '13px', lineHeight: '1.55', color: '#333333' }}>
            {data.summary}
          </p>
        </section>
      )}

      {/* Linjär 1-kolumns layout. */}

      {data.workExperience?.length > 0 && (
        <section style={{ marginBottom: '20px' }}>
          <h2
            style={{
              fontSize: '11px',
              fontWeight: '600',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#999999',
              marginBottom: '12px',
            }}
          >
            Erfarenhet
          </h2>
          <div>
            {data.workExperience.map(job => (
              <div key={job.id} className="cv-entry" style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1px' }}>
                  <h3 style={{ fontSize: '14.5px', fontWeight: '600', color: '#000000', wordBreak: 'break-word' }}>
                    {job.title}
                  </h3>
                  <span style={{ fontSize: '11px', color: '#999999', fontFeatureSettings: '"tnum"', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                    {job.startDate} — {job.current ? 'Nu' : job.endDate}
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: '#666666', marginBottom: '4px' }}>
                  {job.company}
                  {job.location && <span> · {job.location}</span>}
                </div>
                {job.description && (
                  <p style={{ fontSize: '12.5px', lineHeight: '1.5', color: '#666666' }}>
                    {job.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {data.education?.length > 0 && (
        <section className="cv-keep" style={{ marginBottom: '20px' }}>
          <h2
            style={{
              fontSize: '11px',
              fontWeight: '600',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#999999',
              marginBottom: '12px',
            }}
          >
            Utbildning
          </h2>
          <div>
            {data.education.map(edu => (
              <div key={edu.id} className="cv-entry" style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h3 style={{ fontSize: '13.5px', fontWeight: '600', color: '#000000' }}>{edu.degree}</h3>
                  <span style={{ fontSize: '11px', color: '#999999', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                    {edu.startDate} — {edu.endDate}
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: '#666666' }}>
                  {edu.school}
                  {edu.field && <span> · {edu.field}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.skills?.length > 0 && (
        <section className="cv-keep" style={{ marginBottom: '20px' }}>
          <h2
            style={{
              fontSize: '11px',
              fontWeight: '600',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#999999',
              marginBottom: '10px',
            }}
          >
            Kompetenser
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', fontSize: '12.5px', color: '#333333' }}>
            {data.skills.map((skill, i) => (
              <span key={i}>{getSkillName(skill)}</span>
            ))}
          </div>
        </section>
      )}

      {data.languages?.length > 0 && (
        <section className="cv-keep" style={{ marginBottom: '20px' }}>
          <h2
            style={{
              fontSize: '11px',
              fontWeight: '600',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#999999',
              marginBottom: '10px',
            }}
          >
            Språk
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
            {data.languages.map(lang => {
              const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
              return (
                <div key={lang.id} className="cv-entry">
                  {/* Nivån direkt efter namnet — space-between över hela
                      grid-kolumnen gjorde att kolumn 1:s nivå hamnade
                      intill kolumn 2:s språknamn ("Modersmål Engelska"). */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ fontSize: '12.5px', color: '#333333' }}>{name}</span>
                    <span style={{ fontSize: '12.5px', color: '#999999' }}>
                      · {getLanguageLevelDisplay(lang.level)}
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
              marginBottom: '20px',
            }}
          >
            Certifikat
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.certificates.map(cert => (
              <div key={cert.id} className="cv-entry">
                <span style={{ fontSize: '14px', color: '#333333' }}>{cert.name}</span>
                {cert.issuer && <span style={{ fontSize: '12px', color: '#999999', marginLeft: '8px' }}>· {cert.issuer}</span>}
                {cert.date && <span style={{ fontSize: '12px', color: '#999999', marginLeft: '8px' }}>· {cert.date}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {data.links?.length > 0 && (
        <section className="cv-keep" style={{ marginTop: '20px' }}>
          <h2
            style={{
              fontSize: '11px',
              fontWeight: '600',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#999999',
              marginBottom: '10px',
            }}
          >
            Länkar
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {data.links.map(link => (
              <div key={link.id} className="cv-entry" style={{ fontSize: '12.5px' }}>
                {link.label && <span style={{ color: '#333333' }}>{link.label} · </span>}
                <span style={{ color: '#999999', wordBreak: 'break-all' }}>{link.url}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
