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
      {/* Header — kompaktare så fler typiska CV passar 2 sidor */}
      <header style={{ padding: '40px 56px 24px', position: 'relative' }}>
        <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
          {data.profileImage && (
            <img
              src={data.profileImage}
              alt=""
              style={{
                width: '160px',
                height: '200px',
                objectFit: 'cover',
                borderRadius: '20px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              }}
            />
          )}
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: '64px',
                fontWeight: '700',
                letterSpacing: '-0.03em',
                lineHeight: '1',
                color: primary,
                marginBottom: '12px',
              }}
            >
              {fullName}
            </h1>
            {data.title && (
              <p style={{ fontSize: '20px', fontWeight: '500', color: '#333333', letterSpacing: '0.02em' }}>{data.title}</p>
            )}
          </div>
        </div>

        {/* Contact chips */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '32px', flexWrap: 'wrap' }}>
          {data.email && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: '#FFFFFF',
                borderRadius: '100px',
                fontSize: '14px',
                color: '#333333',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <Mail style={{ width: '16px', height: '16px', color: primary }} />
              {data.email}
            </span>
          )}
          {data.phone && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: '#FFFFFF',
                borderRadius: '100px',
                fontSize: '14px',
                color: '#333333',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <Phone style={{ width: '16px', height: '16px', color: primary }} />
              {data.phone}
            </span>
          )}
          {data.location && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: '#FFFFFF',
                borderRadius: '100px',
                fontSize: '14px',
                color: '#333333',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <MapPin style={{ width: '16px', height: '16px', color: primary }} />
              {data.location}
            </span>
          )}
        </div>
      </header>

      <main style={{ padding: '0 56px 40px' }}>
        {/* Summary */}
        {data.summary && (
          <section
            style={{
              background: '#FFFFFF',
              padding: '24px 28px',
              borderRadius: '20px',
              marginBottom: '24px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            }}
          >
            <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#444444' }}>{data.summary}</p>
          </section>
        )}

        {/* Linjär 1-kolumns layout — 2-kol grid kraschar i multi-page med
            asymetrisk fördelning + texten klipps i högerkolumnen. */}

        {/* Skills som ett bold magenta-block */}
        {data.skills?.length > 0 && (
          <section
            className="cv-keep"
            style={{
              background: primary,
              padding: '24px 32px',
              borderRadius: '20px',
              color: '#FFFFFF',
              marginBottom: '32px',
            }}
          >
            <h2
              style={{
                fontSize: '12px',
                fontWeight: '700',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                opacity: 0.8,
                marginBottom: '16px',
              }}
            >
              Kompetenser
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {data.skills.map((skill, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    padding: '8px 16px',
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
              padding: '24px 28px',
              borderRadius: '20px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              marginBottom: '32px',
            }}
          >
            <h2
              style={{
                fontSize: '12px',
                fontWeight: '700',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: primary,
                marginBottom: '24px',
              }}
            >
              Erfarenhet
            </h2>
            <div>
              {data.workExperience.map(job => (
                <div key={job.id} className="cv-entry" style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#1a1a1a', wordBreak: 'break-word' }}>
                      {job.title}
                    </h3>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        padding: '4px 12px',
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
                  <div style={{ fontSize: '14px', color: secondary, marginBottom: '8px' }}>
                    {job.company}
                    {job.location && <span style={{ color: '#888' }}> · {job.location}</span>}
                  </div>
                  {job.description && (
                    <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#666666' }}>{job.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {data.education?.length > 0 && (
          <section
            style={{
              background: '#FFFFFF',
              padding: '24px 28px',
              borderRadius: '20px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              marginBottom: '32px',
            }}
          >
            <h2
              style={{
                fontSize: '12px',
                fontWeight: '700',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: primary,
                marginBottom: '20px',
              }}
            >
              Utbildning
            </h2>
            <div>
              {data.education.map(edu => (
                <div key={edu.id} className="cv-entry" style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>{edu.degree}</h3>
                    <span style={{ fontSize: '12px', color: '#888888', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                      {edu.startDate} — {edu.endDate}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: secondary }}>
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
              padding: '24px 28px',
              borderRadius: '20px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            }}
          >
            <h2
              style={{
                fontSize: '12px',
                fontWeight: '700',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: primary,
                marginBottom: '16px',
              }}
            >
              Språk
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {data.languages.map(lang => {
                const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                return (
                  <div key={lang.id} className="cv-entry">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', color: '#333333' }}>{name}</span>
                      <span style={{ fontSize: '14px', color: '#888888' }}>
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
