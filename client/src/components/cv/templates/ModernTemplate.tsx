/**
 * Modern Template - Dark Tech
 * Vercel/Linear inspired, dark sidebar, indigo accents
 */

import { Mail, Phone, MapPin } from '@/components/ui/icons'
import type { TemplateProps } from './types'
import { getLanguageLevelDisplay, getLanguageLevelPercent, getSkillName } from './helpers'

const accent = '#6366F1'

export function ModernTemplate({ data, fullName }: TemplateProps) {
  return (
    <div
      className="cv-preview"
      style={{
        display: 'flex',
        minHeight: '297mm',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Dark sidebar */}
      <aside
        style={{
          width: '320px',
          background: 'linear-gradient(180deg, #0F0F0F 0%, #1A1A1A 100%)',
          color: '#FFFFFF',
          padding: '48px 32px',
          display: 'flex',
          flexDirection: 'column',
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
              borderRadius: '16px',
              marginBottom: '32px',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              aspectRatio: '1',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '16px',
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '72px', opacity: 0.3 }}>👤</span>
          </div>
        )}

        {/* Contact */}
        <div style={{ marginBottom: '40px' }}>
          <h3
            style={{
              fontSize: '10px',
              fontWeight: '600',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: accent,
              marginBottom: '20px',
            }}
          >
            Kontakt
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {data.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Mail style={{ width: '16px', height: '16px', color: accent }} />
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{data.email}</span>
              </div>
            )}
            {data.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Phone style={{ width: '16px', height: '16px', color: accent }} />
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{data.phone}</span>
              </div>
            )}
            {data.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <MapPin style={{ width: '16px', height: '16px', color: accent }} />
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{data.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Skills */}
        {data.skills?.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h3
              style={{
                fontSize: '10px',
                fontWeight: '600',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: accent,
                marginBottom: '20px',
              }}
            >
              Tech Stack
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {data.skills.slice(0, 12).map((skill, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '12px',
                    padding: '6px 12px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    borderRadius: '6px',
                    color: '#FFFFFF',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                  }}
                >
                  {getSkillName(skill)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {data.languages?.length > 0 && (
          <div style={{ marginTop: 'auto' }}>
            <h3
              style={{
                fontSize: '10px',
                fontWeight: '600',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: accent,
                marginBottom: '20px',
              }}
            >
              Språk
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {data.languages.map(lang => {
                const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                const percent = getLanguageLevelPercent(lang.level)
                return (
                  <div key={lang.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px' }}>{name}</span>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                        {getLanguageLevelDisplay(lang.level)}
                      </span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${percent}%`,
                          height: '100%',
                          background: `linear-gradient(90deg, ${accent} 0%, #818CF8 100%)`,
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
      <main style={{ flex: 1, padding: '48px 56px', background: '#FFFFFF' }}>
        {/* Header */}
        <header style={{ marginBottom: '48px' }}>
          <h1
            style={{
              fontSize: '56px',
              fontWeight: '700',
              letterSpacing: '-0.03em',
              color: '#0F0F0F',
              lineHeight: '1.1',
              marginBottom: '12px',
            }}
          >
            {fullName}
          </h1>
          {data.title && (
            <p style={{ fontSize: '20px', color: accent, fontWeight: '500' }}>{data.title}</p>
          )}
        </header>

        {/* Summary */}
        {data.summary && (
          <section style={{ marginBottom: '48px' }}>
            <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#444444', maxWidth: '600px' }}>
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
                fontWeight: '600',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#999999',
                marginBottom: '28px',
              }}
            >
              Erfarenhet
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {data.workExperience.map(job => (
                <div key={job.id} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '32px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#888888', fontFeatureSettings: '"tnum"' }}>
                      {job.startDate}<br />— {job.current ? 'Nu' : job.endDate}
                    </span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#0F0F0F', marginBottom: '4px' }}>
                      {job.title}
                    </h3>
                    <div style={{ fontSize: '14px', color: accent, marginBottom: '12px' }}>{job.company}</div>
                    {job.description && (
                      <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#666666' }}>{job.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {data.education?.length > 0 && (
          <section>
            <h2
              style={{
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#999999',
                marginBottom: '28px',
              }}
            >
              Utbildning
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {data.education.map(edu => (
                <div key={edu.id} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '32px' }}>
                  <span style={{ fontSize: '12px', color: '#888888' }}>
                    {edu.startDate} — {edu.endDate}
                  </span>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0F0F0F' }}>{edu.degree}</h3>
                    <div style={{ fontSize: '14px', color: '#666666' }}>{edu.school}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
