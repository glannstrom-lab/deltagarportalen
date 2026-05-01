/**
 * Centered Template - Gradient Elegance
 * Professional centered layout with gradient header
 */

import { Mail, Phone, MapPin } from '@/components/ui/icons'
import type { TemplateProps } from './types'
import { getLanguageLevelDisplay, getLanguageLevelPercent, getSkillName } from './helpers'

// Djup, klassisk navy istället för gradient — mer tidlös och mindre 2018-startup
const primary = '#1E3A5F'
const accent = '#C9A66B'

export function CenteredTemplate({ data, fullName }: TemplateProps) {
  return (
    <div
      className="cv-preview"
      style={{
        minHeight: '297mm',
        background: '#FFFFFF',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Solid header — platt navy med tunn guld-accent under */}
      <header
        style={{
          background: primary,
          padding: '72px 64px 56px',
          textAlign: 'center',
          color: '#FFFFFF',
          borderBottom: `3px solid ${accent}`,
        }}
      >
        {data.profileImage && (
          <img
            src={data.profileImage}
            alt=""
            style={{
              width: '120px',
              height: '120px',
              objectFit: 'cover',
              borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.25)',
              marginBottom: '24px',
            }}
          />
        )}

        <h1
          style={{
            fontSize: '44px',
            fontWeight: '600',
            letterSpacing: '-0.01em',
            marginBottom: '8px',
          }}
        >
          {fullName}
        </h1>
        {data.title && (
          <p
            style={{
              fontSize: '17px',
              fontWeight: 400,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: accent,
              marginBottom: '32px',
            }}
          >
            {data.title}
          </p>
        )}

        {/* Contact */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '32px',
            flexWrap: 'wrap',
          }}
        >
          {data.email && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>
              <Mail style={{ width: '14px', height: '14px' }} />
              {data.email}
            </span>
          )}
          {data.phone && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>
              <Phone style={{ width: '14px', height: '14px' }} />
              {data.phone}
            </span>
          )}
          {data.location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>
              <MapPin style={{ width: '14px', height: '14px' }} />
              {data.location}
            </span>
          )}
        </div>
      </header>

      <main style={{ padding: '56px 64px' }}>
        {/* Summary - centered */}
        {data.summary && (
          <section style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p
              style={{
                fontSize: '18px',
                lineHeight: '1.8',
                color: '#4B5563',
                maxWidth: '680px',
                margin: '0 auto',
              }}
            >
              {data.summary}
            </p>
          </section>
        )}

        {/* Skills */}
        {data.skills?.length > 0 && (
          <section style={{ marginBottom: '56px', textAlign: 'center' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
              {data.skills.map((skill, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    padding: '8px 18px',
                    background: '#F4F1EC',
                    color: primary,
                    borderRadius: '4px',
                    letterSpacing: '0.01em',
                  }}
                >
                  {getSkillName(skill)}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Grid for experience and education */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px' }}>
          {/* Experience */}
          {data.workExperience?.length > 0 && (
            <section>
              <h2
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: primary,
                  marginBottom: '32px',
                }}
              >
                Erfarenhet
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {data.workExperience.map(job => (
                  <div
                    key={job.id} className="cv-entry"
                    style={{
                      paddingLeft: '20px',
                      borderLeft: `2px solid ${primary}30`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#9CA3AF',
                        display: 'block',
                        marginBottom: '8px',
                      }}
                    >
                      {job.startDate} — {job.current ? 'Nu' : job.endDate}
                    </span>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                      {job.title}
                    </h3>
                    <div style={{ fontSize: '14px', color: primary, marginBottom: '12px' }}>{job.company}</div>
                    {job.description && (
                      <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#6B7280' }}>{job.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <div>
            {/* Education */}
            {data.education?.length > 0 && (
              <section className="cv-keep" style={{ marginBottom: '48px' }}>
                <h2
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: primary,
                    marginBottom: '32px',
                  }}
                >
                  Utbildning
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {data.education.map(edu => (
                    <div
                      key={edu.id} className="cv-entry"
                      style={{
                        padding: '20px',
                        background: '#F9FAFB',
                        borderRadius: '12px',
                      }}
                    >
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>{edu.degree}</h3>
                      <div style={{ fontSize: '14px', color: primary }}>{edu.school}</div>
                      <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                        {edu.startDate} — {edu.endDate}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Languages */}
            {data.languages?.length > 0 && (
              <section className="cv-keep">
                <h2
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: primary,
                    marginBottom: '24px',
                  }}
                >
                  Språk
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {data.languages.map(lang => {
                    const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                    const percent = getLanguageLevelPercent(lang.level)
                    return (
                      <div key={lang.id} className="cv-entry">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '14px', color: '#374151' }}>{name}</span>
                          <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                            {getLanguageLevelDisplay(lang.level)}
                          </span>
                        </div>
                        <div style={{ height: '4px', background: '#E5E7EB', borderRadius: '2px' }}>
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
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
