/**
 * Rotterdam Template - Spacious med stort efternamn + 2-kolumns body
 * Inspirerad av resume-example.com Rotterdam.
 *
 * Strukturen är cv-preview > aside + main så att vänsterkolumnen kan
 * upprepas på sida 2+ via print-CSS (samma teknik som Modern/Nordic).
 * Det stora namnet bor i main-kolumnen och behåller sin visuella vikt.
 */

import type { TemplateProps } from './types'
import { getLanguageLevelDisplay, getSkillName, getInitials } from './helpers'

const ink = '#1F2937'
const muted = '#6B7280'

export function RotterdamTemplate({ data, fullName }: TemplateProps) {
  const firstName = (data.firstName || '').toUpperCase()
  const lastName = (data.lastName || '').toUpperCase()

  const sectionHeader: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.25em',
    color: ink,
    marginBottom: '12px',
    paddingBottom: '6px',
    borderBottom: `1px solid ${ink}`,
  }

  return (
    <div
      className="cv-preview"
      style={{
        display: 'flex',
        minHeight: '297mm',
        background: '#FFFFFF',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      <aside
        style={{
          width: '220px',
          flexShrink: 0,
          padding: '64px 28px 64px 56px',
          background: '#FFFFFF',
        }}
      >
        {/* Profilbild eller initialer */}
        <div className="cv-keep" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'center' }}>
          {data.profileImage ? (
            <img
              src={data.profileImage}
              alt=""
              style={{ width: '110px', height: '110px', objectFit: 'cover', borderRadius: '50%' }}
            />
          ) : (
            <div
              style={{
                width: '110px',
                height: '110px',
                borderRadius: '50%',
                border: `1px solid #D1D5DB`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '34px',
                fontWeight: 300,
                color: muted,
                letterSpacing: '0.05em',
              }}
            >
              {getInitials(data.firstName, data.lastName)}
            </div>
          )}
        </div>

        <section className="cv-keep" style={{ marginBottom: '32px' }}>
          <h3 style={sectionHeader}>KONTAKT</h3>
          <div style={{ fontSize: '11px', lineHeight: 1.7, color: '#374151' }}>
            {data.location && <div>{data.location}</div>}
            {data.phone && <div>{data.phone}</div>}
            {data.email && <div style={{ wordBreak: 'break-all' }}>{data.email}</div>}
          </div>
        </section>

        {data.skills?.length > 0 && (
          <section className="cv-keep" style={{ marginBottom: '32px' }}>
            <h3 style={sectionHeader}>KOMPETENSER</h3>
            <div style={{ fontSize: '11px', lineHeight: 1.8, color: '#374151' }}>
              {data.skills.map((skill, i) => (
                <div key={i}>{getSkillName(skill)}</div>
              ))}
            </div>
          </section>
        )}

        {data.education?.length > 0 && (
          <section className="cv-keep" style={{ marginBottom: '32px' }}>
            <h3 style={sectionHeader}>UTBILDNING</h3>
            <div>
              {data.education.map((edu) => (
                <div key={edu.id} className="cv-entry" style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: ink }}>{edu.degree}</div>
                  <div style={{ fontSize: '10px', color: muted }}>{edu.school}</div>
                  <div style={{ fontSize: '10px', color: muted }}>
                    {edu.startDate} - {edu.endDate}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.languages?.length > 0 && (
          <section className="cv-keep">
            <h3 style={sectionHeader}>SPRÅK</h3>
            <div style={{ fontSize: '11px', lineHeight: 1.7, color: '#374151' }}>
              {data.languages.map((lang) => {
                const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                return (
                  <div key={lang.id} className="cv-entry" style={{ marginBottom: '4px' }}>
                    <div style={{ fontWeight: 600 }}>{name}</div>
                    <div style={{ fontSize: '10px', color: muted, fontStyle: 'italic' }}>
                      {getLanguageLevelDisplay(lang.level)}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </aside>

      <main style={{ flex: 1, padding: '64px 56px 64px 32px' }}>
        {/* Stort namn-stamp */}
        <header className="cv-keep" style={{ marginBottom: '36px' }}>
          <p style={{ fontSize: '20px', fontWeight: 300, letterSpacing: '0.45em', color: ink, marginBottom: '0px' }}>
            {firstName || fullName.toUpperCase()}
          </p>
          {lastName && (
            <h1
              style={{
                fontSize: '56px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                lineHeight: 0.95,
                color: ink,
                marginTop: '6px',
                wordBreak: 'break-word',
              }}
            >
              {lastName}
            </h1>
          )}
          {data.title && (
            <p
              style={{
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: muted,
                marginTop: '12px',
              }}
            >
              {data.title}
            </p>
          )}
          <div style={{ height: '1px', background: '#E5E7EB', marginTop: '20px' }} />
        </header>

        {data.summary && (
          <section style={{ marginBottom: '32px' }}>
            <h3 style={sectionHeader}>PROFIL</h3>
            <p style={{ fontSize: '12px', lineHeight: 1.7, color: '#374151' }}>{data.summary}</p>
          </section>
        )}

        {data.workExperience?.length > 0 && (
          <section>
            <h3 style={sectionHeader}>ERFARENHET</h3>
            <div>
              {data.workExperience.map((job) => (
                <div key={job.id} className="cv-entry" style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: ink, marginBottom: '2px', wordBreak: 'break-word' }}>
                    {job.title}
                  </h4>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: muted,
                      marginBottom: '6px',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {job.company}
                    {job.location && <span> · {job.location}</span>}
                    <span> · {job.startDate} – {job.current ? 'Nuvarande' : job.endDate}</span>
                  </div>
                  {job.description && (
                    <p style={{ fontSize: '12px', lineHeight: 1.6, color: '#4B5563' }}>{job.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
