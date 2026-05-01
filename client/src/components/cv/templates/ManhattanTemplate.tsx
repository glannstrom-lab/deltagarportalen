/**
 * Manhattan Template — Kickresume-inspirerad premium-mall.
 *
 * Designprinciper:
 * - Mörk navy-sidebar (#0F1B2D) med vit text — bold, executive-känsla
 * - Vit huvudkolumn med generös whitespace
 * - Brun/copper-accent (#B07A4C) för rubriker — varm metallisk ton
 * - Stora, breda serif-headlines (Playfair Display) för namn/titel
 * - Sober geometriska divider-linjer i sidebar
 * - Cirkulär profilbild med tunn copper-ring
 * - 2-kolumns: 220px navy-sidebar + flex content
 *
 * Skiljer sig från Atelier: Manhattan är bold/executive (mörk + copper),
 * Atelier är subtle/editorial (cream + teal).
 */

import type { TemplateProps } from './types'
import { getLanguageLevelDisplay, getSkillName, getInitials } from './helpers'

const navy = '#0F1B2D'
const navySoft = '#1A2A42'
const copper = '#B07A4C'
const copperSoft = '#D4A574'
const ink = '#1A1A1A'
const muted = '#5A5A5A'

export function ManhattanTemplate({ data, fullName }: TemplateProps) {
  const initials = getInitials(data.firstName, data.lastName)

  return (
    <div
      className="cv-preview"
      style={{
        display: 'flex',
        minHeight: '297mm',
        background: '#FFFFFF',
        fontFamily: "'Source Sans 3', 'Helvetica Neue', Arial, sans-serif",
        color: ink,
      }}
    >
      {/* Vänster navy-sidebar */}
      <aside
        style={{
          width: '220px',
          background: navy,
          color: '#FFFFFF',
          padding: '48px 28px',
          flexShrink: 0,
        }}
      >
        {/* Profilbild */}
        <div className="cv-keep" style={{ marginBottom: '36px', display: 'flex', justifyContent: 'center' }}>
          {data.profileImage ? (
            <img
              src={data.profileImage}
              alt=""
              style={{
                width: '140px',
                height: '140px',
                objectFit: 'cover',
                borderRadius: '50%',
                border: `2px solid ${copper}`,
              }}
            />
          ) : (
            <div
              style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                border: `2px solid ${copper}`,
                background: navySoft,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '38px',
                fontWeight: 400,
                color: copperSoft,
                fontFamily: "'Playfair Display', 'Georgia', serif",
                letterSpacing: '0.05em',
              }}
            >
              {initials}
            </div>
          )}
        </div>

        {/* Kontakt */}
        <section className="cv-keep" style={{ marginBottom: '32px' }}>
          <h3
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: copper,
              marginBottom: '14px',
              paddingBottom: '8px',
              borderBottom: `1px solid ${copper}`,
            }}
          >
            Kontakt
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
            {data.email && (
              <div style={{ color: '#E5E7EB', wordBreak: 'break-all', lineHeight: 1.5 }}>{data.email}</div>
            )}
            {data.phone && <div style={{ color: '#E5E7EB' }}>{data.phone}</div>}
            {data.location && <div style={{ color: '#E5E7EB' }}>{data.location}</div>}
          </div>
        </section>

        {data.skills?.length > 0 && (
          <section className="cv-keep" style={{ marginBottom: '32px' }}>
            <h3
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: copper,
                marginBottom: '14px',
                paddingBottom: '8px',
                borderBottom: `1px solid ${copper}`,
              }}
            >
              Kompetenser
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {data.skills.map((skill, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: '12px',
                    color: '#E5E7EB',
                    lineHeight: 1.8,
                  }}
                >
                  {getSkillName(skill)}
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.languages?.length > 0 && (
          <section className="cv-keep" style={{ marginBottom: '32px' }}>
            <h3
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: copper,
                marginBottom: '14px',
                paddingBottom: '8px',
                borderBottom: `1px solid ${copper}`,
              }}
            >
              Språk
            </h3>
            {data.languages.map((lang) => {
              const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
              return (
                <div key={lang.id} style={{ marginBottom: '10px', fontSize: '12px' }}>
                  <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{name}</div>
                  <div style={{ fontSize: '10px', color: copperSoft, marginTop: '2px', fontStyle: 'italic' }}>
                    {getLanguageLevelDisplay(lang.level)}
                  </div>
                </div>
              )
            })}
          </section>
        )}

        {data.certificates?.length > 0 && (
          <section className="cv-keep" style={{ marginBottom: '32px' }}>
            <h3
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: copper,
                marginBottom: '14px',
                paddingBottom: '8px',
                borderBottom: `1px solid ${copper}`,
              }}
            >
              Certifikat
            </h3>
            {data.certificates.map((cert) => (
              <div key={cert.id} style={{ marginBottom: '12px', fontSize: '12px' }}>
                <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{cert.name}</div>
                {cert.issuer && (
                  <div style={{ fontSize: '11px', color: copperSoft, marginTop: '2px' }}>{cert.issuer}</div>
                )}
              </div>
            ))}
          </section>
        )}

        {data.links?.length > 0 && (
          <section className="cv-keep">
            <h3
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: copper,
                marginBottom: '14px',
                paddingBottom: '8px',
                borderBottom: `1px solid ${copper}`,
              }}
            >
              Länkar
            </h3>
            {data.links.map((link) => (
              <div key={link.id} style={{ marginBottom: '10px', fontSize: '11px' }}>
                {link.label && (
                  <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '12px' }}>{link.label}</div>
                )}
                <div style={{ color: copperSoft, wordBreak: 'break-all' }}>{link.url}</div>
              </div>
            ))}
          </section>
        )}
      </aside>

      {/* Höger huvudkolumn */}
      <main style={{ flex: 1, padding: '56px 56px 64px' }}>
        {/* Header — stort namn i serif */}
        <header style={{ marginBottom: '40px', paddingBottom: '24px', borderBottom: `2px solid ${copper}` }}>
          <h1
            style={{
              fontSize: '46px',
              fontWeight: 700,
              color: navy,
              fontFamily: "'Playfair Display', 'Georgia', serif",
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
              marginBottom: '8px',
            }}
          >
            {fullName}
          </h1>
          {data.title && (
            <p
              style={{
                fontSize: '15px',
                fontWeight: 500,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: copper,
                marginTop: '12px',
              }}
            >
              {data.title}
            </p>
          )}
        </header>

        {data.summary && (
          <section style={{ marginBottom: '32px' }}>
            <h2
              style={{
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: navy,
                marginBottom: '14px',
              }}
            >
              Profil
            </h2>
            <p
              style={{
                fontSize: '13px',
                lineHeight: 1.8,
                color: ink,
              }}
            >
              {data.summary}
            </p>
          </section>
        )}

        {data.workExperience?.length > 0 && (
          <section style={{ marginBottom: '32px' }}>
            <h2
              style={{
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: navy,
                marginBottom: '20px',
              }}
            >
              Erfarenhet
            </h2>
            <div>
              {data.workExperience.map((job) => (
                <div key={job.id} className="cv-entry" style={{ marginBottom: '24px', paddingLeft: '16px', borderLeft: `2px solid ${copperSoft}` }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      marginBottom: '4px',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '16px',
                        fontWeight: 700,
                        color: navy,
                        fontFamily: "'Playfair Display', 'Georgia', serif",
                      }}
                    >
                      {job.title}
                    </h3>
                    <span
                      style={{
                        fontSize: '11px',
                        color: copper,
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        marginLeft: '12px',
                      }}
                    >
                      {job.startDate} — {job.current ? 'Nuvarande' : job.endDate}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: muted,
                      marginBottom: '8px',
                      fontStyle: 'italic',
                    }}
                  >
                    {job.company}
                    {job.location && <span> · {job.location}</span>}
                  </div>
                  {job.description && (
                    <p style={{ fontSize: '12px', lineHeight: 1.7, color: '#3F3F3F' }}>{job.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {data.education?.length > 0 && (
          <section className="cv-keep">
            <h2
              style={{
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: navy,
                marginBottom: '20px',
              }}
            >
              Utbildning
            </h2>
            <div>
              {data.education.map((edu) => (
                <div key={edu.id} className="cv-entry" style={{ marginBottom: '20px', paddingLeft: '16px', borderLeft: `2px solid ${copperSoft}` }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      marginBottom: '2px',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: navy,
                        fontFamily: "'Playfair Display', 'Georgia', serif",
                      }}
                    >
                      {edu.degree}
                    </h3>
                    <span
                      style={{
                        fontSize: '11px',
                        color: copper,
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        marginLeft: '12px',
                      }}
                    >
                      {edu.startDate} — {edu.endDate}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: muted,
                      fontStyle: 'italic',
                    }}
                  >
                    {edu.school}
                  </div>
                  {edu.field && (
                    <div style={{ fontSize: '12px', color: muted, marginTop: '2px' }}>{edu.field}</div>
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
