/**
 * Creative Template - Bold Asymmetric
 * Color blocking, gradient text, design-forward
 */

import { Mail, Phone, MapPin } from '@/components/ui/icons'
import type { TemplateProps } from './types'
import { getLanguageLevelDisplay, getSkillName } from './helpers'

const primary = '#7C3AED'
const secondary = '#EC4899'

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
      {/* Decorative circle */}
      <div
        style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '400px',
          height: '400px',
          background: `linear-gradient(135deg, ${primary}20 0%, ${secondary}20 100%)`,
          borderRadius: '50%',
        }}
      />

      {/* Header */}
      <header style={{ padding: '64px', paddingBottom: '48px', position: 'relative' }}>
        <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-end' }}>
          {data.profileImage && (
            <img
              src={data.profileImage}
              alt=""
              style={{
                width: '180px',
                height: '220px',
                objectFit: 'cover',
                borderRadius: '24px',
                boxShadow: '0 20px 60px rgba(124, 58, 237, 0.2)',
              }}
            />
          )}
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: '72px',
                fontWeight: '800',
                letterSpacing: '-0.04em',
                lineHeight: '0.95',
                background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '16px',
              }}
            >
              {fullName}
            </h1>
            {data.title && (
              <p style={{ fontSize: '24px', fontWeight: '500', color: '#333333' }}>{data.title}</p>
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

      <main style={{ padding: '0 64px 64px' }}>
        {/* Summary */}
        {data.summary && (
          <section
            style={{
              background: '#FFFFFF',
              padding: '32px',
              borderRadius: '24px',
              marginBottom: '32px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            }}
          >
            <p style={{ fontSize: '18px', lineHeight: '1.8', color: '#444444' }}>{data.summary}</p>
          </section>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          {/* Experience */}
          {data.workExperience?.length > 0 && (
            <section
              style={{
                background: '#FFFFFF',
                padding: '32px',
                borderRadius: '24px',
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
                  marginBottom: '28px',
                }}
              >
                Erfarenhet
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {data.workExperience.map(job => (
                  <div key={job.id}>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '11px',
                        fontWeight: '600',
                        padding: '4px 12px',
                        background: `${primary}15`,
                        color: primary,
                        borderRadius: '100px',
                        marginBottom: '12px',
                      }}
                    >
                      {job.startDate} — {job.current ? 'Nu' : job.endDate}
                    </span>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a', marginBottom: '4px' }}>
                      {job.title}
                    </h3>
                    <div style={{ fontSize: '14px', color: secondary, marginBottom: '8px' }}>{job.company}</div>
                    {job.description && (
                      <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#666666' }}>{job.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Skills */}
            {data.skills?.length > 0 && (
              <section
                style={{
                  background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
                  padding: '32px',
                  borderRadius: '24px',
                  color: '#FFFFFF',
                }}
              >
                <h2
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    opacity: 0.8,
                    marginBottom: '20px',
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

            {/* Education */}
            {data.education?.length > 0 && (
              <section
                style={{
                  background: '#FFFFFF',
                  padding: '32px',
                  borderRadius: '24px',
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
                    marginBottom: '24px',
                  }}
                >
                  Utbildning
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {data.education.map(edu => (
                    <div key={edu.id}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>{edu.degree}</h3>
                      <div style={{ fontSize: '14px', color: secondary }}>{edu.school}</div>
                      <div style={{ fontSize: '12px', color: '#888888' }}>
                        {edu.startDate} — {edu.endDate}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Languages */}
            {data.languages?.length > 0 && (
              <section
                style={{
                  background: '#FFFFFF',
                  padding: '32px',
                  borderRadius: '24px',
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
                    marginBottom: '20px',
                  }}
                >
                  Språk
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {data.languages.map(lang => {
                    const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                    return (
                      <div key={lang.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '14px', color: '#333333' }}>{name}</span>
                        <span style={{ fontSize: '14px', color: '#888888' }}>
                          {getLanguageLevelDisplay(lang.level)}
                        </span>
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
