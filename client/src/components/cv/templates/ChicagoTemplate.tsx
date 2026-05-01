/**
 * Chicago Template - Klassisk centrerad header + 2-kolumns body med vertikal divider.
 * Inspirerad av resume-example.com Chicago.
 *
 * Strukturen är cv-preview > aside + main så att vänsterkolumnen kan
 * upprepas på sida 2+ via print-CSS. Den centrerade rubriken med monogram
 * sitter i toppen av main-kolumnen.
 */

import type { TemplateProps } from './types'
import { getLanguageLevelDisplay, getSkillName, getInitials } from './helpers'

const ink = '#111827'
const muted = '#6B7280'

export function ChicagoTemplate({ data, fullName }: TemplateProps) {
  const initials = getInitials(data.firstName, data.lastName)

  const sectionHeader: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.2em',
    color: ink,
    marginBottom: '14px',
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
          width: '200px',
          flexShrink: 0,
          padding: '64px 24px 64px 56px',
          borderRight: '1px solid #E5E7EB',
          background: '#FFFFFF',
        }}
      >
        <section className="cv-keep" style={{ marginBottom: '32px' }}>
          <h3 style={sectionHeader}>KONTAKT</h3>
          <div style={{ fontSize: '11px', lineHeight: 1.7, color: '#374151' }}>
            {data.phone && <div style={{ marginBottom: '6px' }}>{data.phone}</div>}
            {data.email && <div style={{ marginBottom: '6px', wordBreak: 'break-all' }}>{data.email}</div>}
            {data.location && <div>{data.location}</div>}
          </div>
        </section>

        {data.links?.length > 0 && (
          <section className="cv-keep" style={{ marginBottom: '32px' }}>
            <h3 style={sectionHeader}>LÄNKAR</h3>
            <div>
              {data.links.map((link) => (
                <div key={link.id} style={{ marginBottom: '10px' }}>
                  {link.label && (
                    <div style={{ fontSize: '11px', fontWeight: 600, color: ink }}>{link.label}</div>
                  )}
                  <div style={{ fontSize: '10px', color: muted, wordBreak: 'break-all' }}>{link.url}</div>
                </div>
              ))}
            </div>
          </section>
        )}

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

        {data.languages?.length > 0 && (
          <section className="cv-keep">
            <h3 style={sectionHeader}>SPRÅK</h3>
            <div style={{ fontSize: '11px', lineHeight: 1.6, color: '#374151' }}>
              {data.languages.map((lang) => {
                const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                return (
                  <div key={lang.id} className="cv-entry" style={{ marginBottom: '6px' }}>
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
        {/* Header med namn + monogram-emblem */}
        <header
          className="cv-keep"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            paddingBottom: '24px',
            borderBottom: '1px solid #D1D5DB',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '36px',
                fontWeight: 400,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: ink,
                lineHeight: 1.1,
                wordBreak: 'break-word',
              }}
            >
              {fullName}
            </h1>
            {data.title && (
              <p
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: muted,
                  marginTop: '8px',
                }}
              >
                {data.title}
              </p>
            )}
          </div>
          <div
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              border: `1px solid ${ink}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginLeft: '16px',
            }}
          >
            {data.profileImage ? (
              <img
                src={data.profileImage}
                alt=""
                style={{ width: '78px', height: '78px', objectFit: 'cover', borderRadius: '50%' }}
              />
            ) : (
              <span style={{ fontSize: '24px', fontWeight: 300, color: ink, letterSpacing: '0.1em' }}>{initials}</span>
            )}
          </div>
        </header>

        {data.summary && (
          <section style={{ marginBottom: '32px' }}>
            <h3 style={sectionHeader}>OM MIG</h3>
            <p style={{ fontSize: '12px', lineHeight: 1.7, color: '#374151' }}>{data.summary}</p>
          </section>
        )}

        {data.workExperience?.length > 0 && (
          <section style={{ marginBottom: '32px' }}>
            <h3 style={{ ...sectionHeader, marginBottom: '18px' }}>ARBETSLIVSERFARENHET</h3>
            <div>
              {data.workExperience.map((job) => (
                <div key={job.id} className="cv-entry" style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: ink, wordBreak: 'break-word' }}>
                      {job.title}
                      {job.company && (
                        <span style={{ fontWeight: 500, color: '#4B5563' }}>, {job.company}</span>
                      )}
                    </h4>
                    <span style={{ fontSize: '11px', color: muted, whiteSpace: 'nowrap', marginLeft: '12px' }}>
                      {job.startDate} - {job.current ? 'Nu' : job.endDate}
                    </span>
                  </div>
                  {job.description && (
                    <p style={{ fontSize: '12px', lineHeight: 1.6, color: '#4B5563' }}>{job.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {data.education?.length > 0 && (
          <section className="cv-keep">
            <h3 style={{ ...sectionHeader, marginBottom: '18px' }}>UTBILDNING</h3>
            <div>
              {data.education.map((edu) => (
                <div key={edu.id} className="cv-entry" style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: ink, wordBreak: 'break-word' }}>
                      {edu.degree}
                      {edu.school && <span style={{ fontWeight: 500, color: '#4B5563' }}>, {edu.school}</span>}
                    </h4>
                    <span style={{ fontSize: '11px', color: muted, whiteSpace: 'nowrap', marginLeft: '12px' }}>
                      {edu.startDate} - {edu.endDate}
                    </span>
                  </div>
                  {edu.field && <div style={{ fontSize: '12px', color: muted, marginTop: '2px' }}>{edu.field}</div>}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
