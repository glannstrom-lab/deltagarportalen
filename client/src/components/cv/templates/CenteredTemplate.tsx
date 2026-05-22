/**
 * Centered Template - Gradient Elegance
 * Professional centered layout with gradient header
 */

import { Mail, Phone, MapPin } from '@/components/ui/icons'
import type { TemplateProps } from './types'
import { getLanguageLevelDisplay, getSkillName } from './helpers'

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
      {/* Kompakt navy-header — tar ~130px så main får ~990px på 1 A4. */}
      <header
        className="cv-keep"
        style={{
          background: primary,
          padding: '20px 56px 16px',
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
              width: '66px',
              height: '66px',
              objectFit: 'cover',
              borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.25)',
              marginBottom: '8px',
            }}
          />
        )}

        <h1
          style={{
            fontSize: '28px',
            fontWeight: '600',
            letterSpacing: '-0.01em',
            marginBottom: '3px',
          }}
        >
          {fullName}
        </h1>
        {data.title && (
          <p
            style={{
              fontSize: '11.5px',
              fontWeight: 400,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: accent,
              marginBottom: '10px',
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
            gap: '20px',
            flexWrap: 'wrap',
          }}
        >
          {data.email && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'rgba(255,255,255,0.85)' }}>
              <Mail style={{ width: '12px', height: '12px' }} />
              {data.email}
            </span>
          )}
          {data.phone && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'rgba(255,255,255,0.85)' }}>
              <Phone style={{ width: '12px', height: '12px' }} />
              {data.phone}
            </span>
          )}
          {data.location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'rgba(255,255,255,0.85)' }}>
              <MapPin style={{ width: '12px', height: '12px' }} />
              {data.location}
            </span>
          )}
        </div>
      </header>

      <main style={{ padding: '20px 56px 24px' }}>
        {/* Summary - centered, tighter line-height */}
        {data.summary && (
          <section style={{ textAlign: 'center', marginBottom: '16px' }}>
            <p
              style={{
                fontSize: '13px',
                lineHeight: '1.55',
                color: '#4B5563',
                maxWidth: '640px',
                margin: '0 auto',
              }}
            >
              {data.summary}
            </p>
          </section>
        )}

        {/* Skills */}
        {data.skills?.length > 0 && (
          <section style={{ marginBottom: '18px', textAlign: 'center' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', justifyContent: 'center' }}>
              {data.skills.map((skill, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    padding: '5px 13px',
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

        {/* Linjär 1-kolumns layout — fungerar för alla data-mängder. */}

        {data.workExperience?.length > 0 && (
          <section style={{ marginBottom: '16px' }}>
            <h2
              style={{
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: primary,
                marginBottom: '10px',
                paddingBottom: '5px',
                borderBottom: `1px solid ${primary}25`,
              }}
            >
              Erfarenhet
            </h2>
            <div>
              {data.workExperience.map(job => (
                <div
                  key={job.id}
                  className="cv-entry"
                  style={{
                    paddingLeft: '14px',
                    borderLeft: `2px solid ${primary}30`,
                    marginBottom: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', wordBreak: 'break-word' }}>
                      {job.title}
                    </h3>
                    <span
                      style={{
                        fontSize: '11.5px',
                        color: '#9CA3AF',
                        whiteSpace: 'nowrap',
                        marginLeft: '12px',
                      }}
                    >
                      {job.startDate} — {job.current ? 'Nu' : job.endDate}
                    </span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: primary, marginBottom: '3px' }}>
                    {job.company}
                    {job.location && <span style={{ color: '#9CA3AF' }}> · {job.location}</span>}
                  </div>
                  {job.description && (
                    <p style={{ fontSize: '12.5px', lineHeight: '1.5', color: '#6B7280' }}>{job.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {data.education?.length > 0 && (
          <section className="cv-keep" style={{ marginBottom: '16px' }}>
            <h2
              style={{
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: primary,
                marginBottom: '10px',
                paddingBottom: '5px',
                borderBottom: `1px solid ${primary}25`,
              }}
            >
              Utbildning
            </h2>
            <div>
              {data.education.map(edu => (
                <div
                  key={edu.id}
                  className="cv-entry"
                  style={{
                    paddingLeft: '14px',
                    borderLeft: `2px solid ${primary}30`,
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1px' }}>
                    <h3 style={{ fontSize: '13.5px', fontWeight: '600', color: '#111827' }}>{edu.degree}</h3>
                    <span style={{ fontSize: '11.5px', color: '#9CA3AF', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                      {edu.startDate} — {edu.endDate}
                    </span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: primary }}>
                    {edu.school}
                    {edu.field && <span style={{ color: '#9CA3AF' }}> · {edu.field}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.languages?.length > 0 && (
          <section className="cv-keep">
            <h2
              style={{
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: primary,
                marginBottom: '10px',
                paddingBottom: '5px',
                borderBottom: `1px solid ${primary}25`,
              }}
            >
              Språk
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '6px' }}>
              {data.languages.map(lang => {
                const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                return (
                  <div key={lang.id} className="cv-entry">
                    <div style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{name}</div>
                    <div style={{ fontSize: '11.5px', color: '#9CA3AF', fontStyle: 'italic', marginTop: '1px' }}>
                      {getLanguageLevelDisplay(lang.level)}
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
