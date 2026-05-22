/**
 * Creative Template - Bold Asymmetric
 * Color blocking, gradient text, design-forward
 */

import { Mail, Phone, MapPin } from '@/components/ui/icons'
import type { TemplateProps } from './types'
import { getLanguageLevelDisplay, getSkillName } from './helpers'

// Sammanhållen mörk magenta — bold men inte gradient-trippy
const primary = '#A21464'
const secondary = '#A21464'

export function CreativeTemplate({ data, fullName }: TemplateProps) {
  return (
    <div
      className="cv-preview"
      style={{
        minHeight: '297mm',
        background: '#FAFAFA',
        fontFamily: "'Inter', -apple-system, sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header — kompakt så typisk CV ryms på 1 sida */}
      <header style={{ padding: '20px 40px 10px', position: 'relative' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {data.profileImage && (
            <img
              src={data.profileImage}
              alt=""
              style={{
                width: '92px',
                height: '116px',
                objectFit: 'cover',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
            />
          )}
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: '42px',
                fontWeight: '700',
                letterSpacing: '-0.03em',
                lineHeight: '1',
                color: primary,
                marginBottom: '6px',
              }}
            >
              {fullName}
            </h1>
            {data.title && (
              <p style={{ fontSize: '15px', fontWeight: '500', color: '#333333', letterSpacing: '0.02em' }}>{data.title}</p>
            )}
          </div>
        </div>

        {/* Contact chips */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
          {data.email && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                background: '#FFFFFF',
                borderRadius: '100px',
                fontSize: '12px',
                color: '#333333',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              }}
            >
              <Mail style={{ width: '13px', height: '13px', color: primary }} />
              {data.email}
            </span>
          )}
          {data.phone && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                background: '#FFFFFF',
                borderRadius: '100px',
                fontSize: '12px',
                color: '#333333',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              }}
            >
              <Phone style={{ width: '13px', height: '13px', color: primary }} />
              {data.phone}
            </span>
          )}
          {data.location && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                background: '#FFFFFF',
                borderRadius: '100px',
                fontSize: '12px',
                color: '#333333',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              }}
            >
              <MapPin style={{ width: '13px', height: '13px', color: primary }} />
              {data.location}
            </span>
          )}
        </div>
      </header>

      <main style={{ padding: '0 40px 20px' }}>
        {/* Summary */}
        {data.summary && (
          <section
            style={{
              background: '#FFFFFF',
              padding: '12px 16px',
              borderRadius: '12px',
              marginBottom: '10px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            }}
          >
            <p style={{ fontSize: '12px', lineHeight: '1.5', color: '#444444' }}>{data.summary}</p>
          </section>
        )}

        {/* Skills som ett magenta-block */}
        {data.skills?.length > 0 && (
          <section
            className="cv-keep"
            style={{
              background: primary,
              padding: '10px 16px',
              borderRadius: '12px',
              color: '#FFFFFF',
              marginBottom: '10px',
            }}
          >
            <h2
              style={{
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                opacity: 0.8,
                marginBottom: '8px',
              }}
            >
              Kompetenser
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {data.skills.map((skill, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '11.5px',
                    fontWeight: '500',
                    padding: '4px 12px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '100px',
                  }}
                >
                  {getSkillName(skill)}
                </span>
              ))}
            </div>
          </section>
        )}

        {data.workExperience?.length > 0 && (
          <section
            style={{
              background: '#FFFFFF',
              padding: '12px 16px',
              borderRadius: '12px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              marginBottom: '10px',
            }}
          >
            <h2
              style={{
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: primary,
                marginBottom: '10px',
              }}
            >
              Erfarenhet
            </h2>
            <div>
              {data.workExperience.map(job => (
                <div key={job.id} className="cv-entry" style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a', wordBreak: 'break-word' }}>
                      {job.title}
                    </h3>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: '600',
                        padding: '3px 10px',
                        background: `${primary}15`,
                        color: primary,
                        borderRadius: '100px',
                        whiteSpace: 'nowrap',
                        marginLeft: '12px',
                      }}
                    >
                      {job.startDate} — {job.current ? 'Nu' : job.endDate}
                    </span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: secondary, marginBottom: '4px' }}>
                    {job.company}
                    {job.location && <span style={{ color: '#888' }}> · {job.location}</span>}
                  </div>
                  {job.description && (
                    <p style={{ fontSize: '12.5px', lineHeight: '1.5', color: '#666666' }}>{job.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {data.education?.length > 0 && (
          <section
            className="cv-keep"
            style={{
              background: '#FFFFFF',
              padding: '12px 16px',
              borderRadius: '12px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              marginBottom: '10px',
            }}
          >
            <h2
              style={{
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: primary,
                marginBottom: '10px',
              }}
            >
              Utbildning
            </h2>
            <div>
              {data.education.map(edu => (
                <div key={edu.id} className="cv-entry" style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <h3 style={{ fontSize: '13.5px', fontWeight: '600', color: '#1a1a1a' }}>{edu.degree}</h3>
                    <span style={{ fontSize: '11px', color: '#888888', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                      {edu.startDate} — {edu.endDate}
                    </span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: secondary }}>
                    {edu.school}
                    {edu.field && <span style={{ color: '#888' }}> · {edu.field}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.languages?.length > 0 && (
          <section
            className="cv-keep"
            style={{
              background: '#FFFFFF',
              padding: '12px 16px',
              borderRadius: '12px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            }}
          >
            <h2
              style={{
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: primary,
                marginBottom: '8px',
              }}
            >
              Språk
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
              {data.languages.map(lang => {
                const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                return (
                  <div key={lang.id} className="cv-entry">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12.5px', color: '#333333' }}>{name}</span>
                      <span style={{ fontSize: '12.5px', color: '#888888' }}>
                        {getLanguageLevelDisplay(lang.level)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
