/**
 * Atelier Template — Premium serif på cream/off-white bakgrund.
 * Inspirerad av Resume.io's "Madrid" och Kickresume's "Harry Hansen".
 *
 * Designprinciper:
 * - Cream/off-white bakgrund (#FAF8F4) för varm, premium känsla
 * - Mörk teal accent (#1E3A3A) — sober och tidlös
 * - Mixed font weights (300 light, 500 medium, 700 bold) för hierarki
 * - Subtila 1px divider-linjer i accent-färg
 * - 2-kolumns: smal meta-kolumn vänster (kontakt, skills, languages, cert)
 *   och bred content-kolumn höger (profil, erfarenhet, utbildning)
 * - Inga onödiga decorationer — pure focus på typografi och whitespace
 */

import type { TemplateProps } from './types'
import { getLanguageLevelDisplay, getSkillName, getInitials } from './helpers'

const ink = '#1A1A1A'
const accent = '#1E3A3A'      // Mörk teal
const accentSoft = '#7A8C8C'  // Dämpad teal för meta-text
const muted = '#666666'
const cream = '#FAF8F4'

export function AtelierTemplate({ data, fullName }: TemplateProps) {
  const initials = getInitials(data.firstName, data.lastName)

  return (
    <div
      className="cv-preview"
      style={{
        minHeight: '297mm',
        background: cream,
        fontFamily: "'Source Sans 3', 'Helvetica Neue', Arial, sans-serif",
        color: ink,
      }}
    >
      {/* Header — generös, centrerad */}
      <header
        style={{
          padding: '64px 72px 32px',
          textAlign: 'center',
          borderBottom: `1px solid ${accent}`,
        }}
      >
        <h1
          style={{
            fontSize: '38px',
            fontWeight: 300,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: accent,
            marginBottom: '12px',
            fontFamily: "'Crimson Pro', 'Georgia', serif",
          }}
        >
          {fullName}
        </h1>
        {data.title && (
          <p
            style={{
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: accentSoft,
              marginBottom: '20px',
            }}
          >
            {data.title}
          </p>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            fontSize: '11px',
            letterSpacing: '0.04em',
            color: muted,
          }}
        >
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>{data.phone}</span>}
          {data.location && <span>{data.location}</span>}
        </div>
      </header>

      {/* Body — 2-kolumns */}
      <div style={{ display: 'flex', padding: '40px 72px 64px', gap: '48px' }}>
        {/* Vänster meta-kolumn */}
        <aside style={{ width: '180px', flexShrink: 0 }}>
          {/* Profilfoto — cirkulär */}
          <div className="cv-keep" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'center' }}>
            {data.profileImage ? (
              <img
                src={data.profileImage}
                alt=""
                style={{
                  width: '120px',
                  height: '120px',
                  objectFit: 'cover',
                  borderRadius: '50%',
                  border: `1px solid ${accent}`,
                }}
              />
            ) : (
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  border: `1px solid ${accent}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  fontWeight: 300,
                  color: accent,
                  fontFamily: "'Crimson Pro', serif",
                  letterSpacing: '0.1em',
                }}
              >
                {initials}
              </div>
            )}
          </div>

          {data.skills?.length > 0 && (
            <section className="cv-keep" style={{ marginBottom: '32px' }}>
              <h3
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: accent,
                  marginBottom: '14px',
                  paddingBottom: '6px',
                  borderBottom: `1px solid ${accent}`,
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
                      fontWeight: 400,
                      lineHeight: 1.7,
                      color: ink,
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
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: accent,
                  marginBottom: '14px',
                  paddingBottom: '6px',
                  borderBottom: `1px solid ${accent}`,
                }}
              >
                Språk
              </h3>
              {data.languages.map((lang) => {
                const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                return (
                  <div key={lang.id} style={{ marginBottom: '8px', fontSize: '12px' }}>
                    <div style={{ fontWeight: 500, color: ink }}>{name}</div>
                    <div style={{ fontSize: '10px', color: muted, marginTop: '1px', fontStyle: 'italic' }}>
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
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: accent,
                  marginBottom: '14px',
                  paddingBottom: '6px',
                  borderBottom: `1px solid ${accent}`,
                }}
              >
                Certifikat
              </h3>
              {data.certificates.map((cert) => (
                <div key={cert.id} style={{ marginBottom: '10px', fontSize: '12px' }}>
                  <div style={{ fontWeight: 500, color: ink }}>{cert.name}</div>
                  {cert.issuer && (
                    <div style={{ fontSize: '11px', color: muted, marginTop: '1px' }}>{cert.issuer}</div>
                  )}
                </div>
              ))}
            </section>
          )}

          {data.links?.length > 0 && (
            <section className="cv-keep">
              <h3
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: accent,
                  marginBottom: '14px',
                  paddingBottom: '6px',
                  borderBottom: `1px solid ${accent}`,
                }}
              >
                Länkar
              </h3>
              {data.links.map((link) => (
                <div key={link.id} style={{ marginBottom: '8px', fontSize: '11px' }}>
                  {link.label && (
                    <div style={{ fontWeight: 500, color: ink, fontSize: '12px' }}>{link.label}</div>
                  )}
                  <div style={{ color: muted, wordBreak: 'break-all' }}>{link.url}</div>
                </div>
              ))}
            </section>
          )}
        </aside>

        {/* Höger content-kolumn */}
        <main style={{ flex: 1 }}>
          {data.summary && (
            <section style={{ marginBottom: '32px' }}>
              <h2
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: accent,
                  marginBottom: '14px',
                  paddingBottom: '6px',
                  borderBottom: `1px solid ${accent}`,
                }}
              >
                Profil
              </h2>
              <p
                style={{
                  fontSize: '13px',
                  lineHeight: 1.75,
                  color: ink,
                  fontWeight: 400,
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
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: accent,
                  marginBottom: '20px',
                  paddingBottom: '6px',
                  borderBottom: `1px solid ${accent}`,
                }}
              >
                Erfarenhet
              </h2>
              <div>
                {data.workExperience.map((job) => (
                  <div key={job.id} className="cv-entry" style={{ marginBottom: '24px' }}>
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
                          fontSize: '14px',
                          fontWeight: 700,
                          color: ink,
                          letterSpacing: '0.01em',
                        }}
                      >
                        {job.title}
                      </h3>
                      <span
                        style={{
                          fontSize: '11px',
                          color: accentSoft,
                          fontStyle: 'italic',
                          letterSpacing: '0.02em',
                          whiteSpace: 'nowrap',
                          marginLeft: '12px',
                        }}
                      >
                        {job.startDate} — {job.current ? 'Nuvarande' : job.endDate}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: accent,
                        marginBottom: '8px',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {job.company}
                      {job.location && (
                        <span style={{ color: muted, fontWeight: 400 }}> · {job.location}</span>
                      )}
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
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: accent,
                  marginBottom: '20px',
                  paddingBottom: '6px',
                  borderBottom: `1px solid ${accent}`,
                }}
              >
                Utbildning
              </h2>
              <div>
                {data.education.map((edu) => (
                  <div key={edu.id} className="cv-entry" style={{ marginBottom: '20px' }}>
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
                          fontSize: '13px',
                          fontWeight: 700,
                          color: ink,
                        }}
                      >
                        {edu.degree}
                      </h3>
                      <span
                        style={{
                          fontSize: '11px',
                          color: accentSoft,
                          fontStyle: 'italic',
                          whiteSpace: 'nowrap',
                          marginLeft: '12px',
                        }}
                      >
                        {edu.startDate} — {edu.endDate}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: accent,
                        fontWeight: 500,
                        letterSpacing: '0.02em',
                      }}
                    >
                      {edu.school}
                    </div>
                    {edu.field && (
                      <div style={{ fontSize: '11px', color: muted, fontStyle: 'italic', marginTop: '2px' }}>
                        {edu.field}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
