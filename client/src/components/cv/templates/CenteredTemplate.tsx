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
      {/* Solid header — kompakt så Erfarenhet får plats på sida 1 även för
          typiska CV:n. Tidigare 72/56px padding gav 350px header som
          tryckte ut innehåll. Nu 32/24px → ~180px header. */}
      <header
        className="cv-keep"
        style={{
          background: primary,
          padding: '36px 64px 28px',
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
              width: '90px',
              height: '90px',
              objectFit: 'cover',
              borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.25)',
              marginBottom: '14px',
            }}
          />
        )}

        <h1
          style={{
            fontSize: '36px',
            fontWeight: '600',
            letterSpacing: '-0.01em',
            marginBottom: '6px',
          }}
        >
          {fullName}
        </h1>
        {data.title && (
          <p
            style={{
              fontSize: '14px',
              fontWeight: 400,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: accent,
              marginBottom: '16px',
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
            gap: '24px',
            flexWrap: 'wrap',
          }}
        >
          {data.email && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>
              <Mail style={{ width: '12px', height: '12px' }} />
              {data.email}
            </span>
          )}
          {data.phone && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>
              <Phone style={{ width: '12px', height: '12px' }} />
              {data.phone}
            </span>
          )}
          {data.location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>
              <MapPin style={{ width: '12px', height: '12px' }} />
              {data.location}
            </span>
          )}
        </div>
      </header>

      <main style={{ padding: '36px 64px 48px' }}>
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

        {/* Linjär 1-kolumns layout — 2-kolumns body kraschar i multi-page
            (kolumnerna fortsätter oberoende vilket lämnar massa whitespace).
            Linjärt flöde fungerar för alla data-mängder. */}

        {data.workExperience?.length > 0 && (
          <section style={{ marginBottom: '40px' }}>
            <h2
              style={{
                fontSize: '12px',
                fontWeight: '600',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: primary,
                marginBottom: '24px',
                paddingBottom: '8px',
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
                    paddingLeft: '20px',
                    borderLeft: `2px solid ${primary}30`,
                    marginBottom: '24px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight: '600', color: '#111827', wordBreak: 'break-word' }}>
                      {job.title}
                    </h3>
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#9CA3AF',
                        whiteSpace: 'nowrap',
                        marginLeft: '12px',
                      }}
                    >
                      {job.startDate} — {job.current ? 'Nu' : job.endDate}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: primary, marginBottom: '8px' }}>
                    {job.company}
                    {job.location && <span style={{ color: '#9CA3AF' }}> · {job.location}</span>}
                  </div>
                  {job.description && (
                    <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#6B7280' }}>{job.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {data.education?.length > 0 && (
          <section style={{ marginBottom: '40px' }}>
            <h2
              style={{
                fontSize: '12px',
                fontWeight: '600',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: primary,
                marginBottom: '24px',
                paddingBottom: '8px',
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
                    paddingLeft: '20px',
                    borderLeft: `2px solid ${primary}30`,
                    marginBottom: '20px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>{edu.degree}</h3>
                    <span style={{ fontSize: '12px', color: '#9CA3AF', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                      {edu.startDate} — {edu.endDate}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: primary }}>
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
                fontSize: '12px',
                fontWeight: '600',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: primary,
                marginBottom: '20px',
                paddingBottom: '8px',
                borderBottom: `1px solid ${primary}25`,
              }}
            >
              Språk
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {data.languages.map(lang => {
                const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                return (
                  <div key={lang.id} className="cv-entry">
                    <div style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>{name}</div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic', marginTop: '2px' }}>
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
