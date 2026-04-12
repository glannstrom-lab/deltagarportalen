/**
 * Executive Template - Classic Elegance
 * Serif typography, gold accents, professional
 */

import type { TemplateProps } from './types'
import { getLanguageLevelDisplay, getSkillName } from './helpers'

const gold = '#B8860B'
const goldLight = '#F5E6C8'

export function ExecutiveTemplate({ data, fullName }: TemplateProps) {
  return (
    <div
      className="cv-preview"
      style={{
        minHeight: '297mm',
        background: '#FDFCFA',
        fontFamily: "'Georgia', 'Times New Roman', serif",
      }}
    >
      {/* Header with gold line */}
      <header
        style={{
          padding: '64px 80px',
          borderBottom: `3px solid ${gold}`,
          background: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
          {data.profileImage && (
            <img
              src={data.profileImage}
              alt=""
              style={{
                width: '120px',
                height: '120px',
                objectFit: 'cover',
                borderRadius: '4px',
                border: `2px solid ${gold}`,
              }}
            />
          )}
          <div>
            <h1
              style={{
                fontSize: '48px',
                fontWeight: '400',
                letterSpacing: '0.02em',
                color: '#1a1a1a',
                marginBottom: '8px',
              }}
            >
              {fullName}
            </h1>
            {data.title && (
              <p style={{ fontSize: '20px', fontStyle: 'italic', color: gold, marginBottom: '20px' }}>
                {data.title}
              </p>
            )}
            <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#666666' }}>
              {data.email && <span>{data.email}</span>}
              {data.phone && <span>{data.phone}</span>}
              {data.location && <span>{data.location}</span>}
            </div>
          </div>
        </div>
      </header>

      <main style={{ padding: '64px 80px' }}>
        {/* Summary with drop cap */}
        {data.summary && (
          <section style={{ marginBottom: '56px' }}>
            <p style={{ fontSize: '18px', lineHeight: '1.8', color: '#333333', maxWidth: '720px' }}>
              <span
                style={{
                  float: 'left',
                  fontSize: '64px',
                  lineHeight: '1',
                  marginRight: '12px',
                  marginTop: '4px',
                  color: gold,
                  fontWeight: '400',
                }}
              >
                {data.summary.charAt(0)}
              </span>
              {data.summary.slice(1)}
            </p>
          </section>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px' }}>
          {/* Experience */}
          {data.workExperience?.length > 0 && (
            <section>
              <h2
                style={{
                  fontSize: '14px',
                  fontWeight: '400',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: gold,
                  marginBottom: '32px',
                  paddingBottom: '12px',
                  borderBottom: `1px solid ${goldLight}`,
                }}
              >
                Karriär
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {data.workExperience.map(job => (
                  <div key={job.id}>
                    <h3 style={{ fontSize: '18px', fontWeight: '400', color: '#1a1a1a', marginBottom: '4px' }}>
                      {job.title}
                    </h3>
                    <div style={{ fontSize: '15px', color: gold, marginBottom: '4px' }}>{job.company}</div>
                    <div style={{ fontSize: '13px', color: '#888888', marginBottom: '12px' }}>
                      {job.startDate} — {job.current ? 'Nuvarande' : job.endDate}
                    </div>
                    {job.description && (
                      <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#555555' }}>{job.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <div>
            {/* Education */}
            {data.education?.length > 0 && (
              <section style={{ marginBottom: '48px' }}>
                <h2
                  style={{
                    fontSize: '14px',
                    fontWeight: '400',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: gold,
                    marginBottom: '32px',
                    paddingBottom: '12px',
                    borderBottom: `1px solid ${goldLight}`,
                  }}
                >
                  Utbildning
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {data.education.map(edu => (
                    <div key={edu.id}>
                      <h3 style={{ fontSize: '16px', fontWeight: '400', color: '#1a1a1a' }}>{edu.degree}</h3>
                      <div style={{ fontSize: '14px', color: gold }}>{edu.school}</div>
                      <div style={{ fontSize: '13px', color: '#888888' }}>
                        {edu.startDate} — {edu.endDate}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Skills */}
            {data.skills?.length > 0 && (
              <section style={{ marginBottom: '48px' }}>
                <h2
                  style={{
                    fontSize: '14px',
                    fontWeight: '400',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: gold,
                    marginBottom: '24px',
                    paddingBottom: '12px',
                    borderBottom: `1px solid ${goldLight}`,
                  }}
                >
                  Expertis
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {data.skills.map((skill, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '13px',
                        padding: '6px 16px',
                        border: `1px solid ${goldLight}`,
                        color: '#555555',
                      }}
                    >
                      {getSkillName(skill)}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Languages */}
            {data.languages?.length > 0 && (
              <section>
                <h2
                  style={{
                    fontSize: '14px',
                    fontWeight: '400',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: gold,
                    marginBottom: '24px',
                    paddingBottom: '12px',
                    borderBottom: `1px solid ${goldLight}`,
                  }}
                >
                  Språk
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {data.languages.map(lang => {
                    const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                    return (
                      <div key={lang.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '14px', color: '#333333' }}>{name}</span>
                        <span style={{ fontSize: '14px', fontStyle: 'italic', color: '#888888' }}>
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
