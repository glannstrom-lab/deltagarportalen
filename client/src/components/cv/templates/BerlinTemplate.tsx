/**
 * Berlin Template — Bauhaus-inspirerad editorial.
 *
 * Designprinciper:
 * - Cream/sand-bakgrund (#F4EDE0) med svart bläck — varm men strikt
 * - Brutalist sans-serif headlines (Inter/Helvetica) i ultra-bold all-caps
 * - Rödorange accent (#C8392E) för datum, sektionsnumrering och rubriker
 * - Geometrisk rytm: tunna 1px svarta linjer, sidebar med vertikalt rotated-namn
 * - Single-column innehåll men med vänster sidobar (40px) som bär initialer + rotated bokstäver
 * - Sektionsnumrering i romerska siffror (I, II, III) — editorial-känsla
 *
 * Skiljer sig från Manhattan (mörk navy + copper executive) och
 * Atelier (cream + teal subtle): Berlin är kontrastrik, geometrisk, mer "tidning".
 */

import type { TemplateProps } from './types'
import { getLanguageLevelDisplay, getSkillName, getInitials } from './helpers'

const cream = '#F4EDE0'
const ink = '#1A1A1A'
const accent = '#C8392E'
const muted = '#5A5A5A'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']

export function BerlinTemplate({ data, fullName }: TemplateProps) {
  const initials = getInitials(data.firstName, data.lastName)
  let sectionIndex = 0
  const nextRoman = () => ROMAN[sectionIndex++] || ''

  return (
    <div
      className="cv-preview"
      style={{
        display: 'flex',
        minHeight: '297mm',
        background: cream,
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        color: ink,
      }}
    >
      {/* Smal sidobar med initialer och vertikal etikett */}
      <aside
        style={{
          width: '60px',
          background: ink,
          color: cream,
          padding: '32px 0',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div className="cv-keep" style={{ marginBottom: '32px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              border: `1.5px solid ${cream}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.04em',
            }}
          >
            {initials}
          </div>
        </div>
        <div
          aria-hidden="true"
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            fontSize: '10px',
            letterSpacing: '0.5em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: cream,
            opacity: 0.85,
          }}
        >
          Curriculum Vitae · Berlin
        </div>
        <div style={{ flex: 1 }} />
        <div
          aria-hidden="true"
          style={{
            width: '24px',
            height: '24px',
            background: accent,
            marginTop: '32px',
          }}
        />
      </aside>

      {/* Huvudkolumn — tightad så typisk CV ryms på 1 sida */}
      <main style={{ flex: 1, padding: '22px 40px 24px', position: 'relative' }}>
        {/* Header med massiv typografi */}
        <header style={{ marginBottom: '14px' }}>
          <div
            style={{
              fontSize: '9.5px',
              fontWeight: 700,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: accent,
              marginBottom: '6px',
            }}
          >
            ◼ {data.title || 'Curriculum Vitae'}
          </div>
          <h1
            style={{
              fontSize: '34px',
              fontWeight: 900,
              color: ink,
              letterSpacing: '-0.025em',
              lineHeight: 0.95,
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            {fullName}
          </h1>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '18px',
              fontSize: '11px',
              color: muted,
              borderTop: `1px solid ${ink}`,
              paddingTop: '8px',
            }}
          >
            {data.email && <span>{data.email}</span>}
            {data.phone && <span>{data.phone}</span>}
            {data.location && <span>{data.location}</span>}
          </div>
        </header>

        {data.summary && (
          <section style={{ marginBottom: '14px' }}>
            <SectionHeader roman={nextRoman()} title="Profil" />
            <p
              style={{
                fontSize: '12.5px',
                lineHeight: 1.5,
                color: ink,
              }}
            >
              {data.summary}
            </p>
          </section>
        )}

        {data.workExperience?.length > 0 && (
          <section style={{ marginBottom: '14px' }}>
            <SectionHeader roman={nextRoman()} title="Erfarenhet" />
            <div>
              {data.workExperience.map((job) => (
                <div
                  key={job.id}
                  className="cv-entry"
                  style={{
                    marginBottom: '10px',
                    paddingBottom: '10px',
                    borderBottom: `1px solid ${ink}33`,
                    display: 'grid',
                    gridTemplateColumns: '90px 1fr',
                    gap: '18px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      color: accent,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      paddingTop: '2px',
                      lineHeight: 1.3,
                    }}
                  >
                    {job.startDate}
                    <br />
                    <span style={{ color: muted, fontWeight: 600 }}>—</span>
                    <br />
                    {job.current ? 'Nu' : job.endDate}
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: '14px',
                        fontWeight: 800,
                        color: ink,
                        letterSpacing: '-0.01em',
                        marginBottom: '2px',
                      }}
                    >
                      {job.title}
                    </h3>
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: muted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginBottom: '4px',
                      }}
                    >
                      {job.company}
                      {job.location && <span> · {job.location}</span>}
                    </div>
                    {job.description && (
                      <p style={{ fontSize: '12px', lineHeight: 1.5, color: '#3F3F3F' }}>
                        {job.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.education?.length > 0 && (
          <section className="cv-keep" style={{ marginBottom: '14px' }}>
            <SectionHeader roman={nextRoman()} title="Utbildning" />
            <div>
              {data.education.map((edu) => (
                <div
                  key={edu.id}
                  className="cv-entry"
                  style={{
                    marginBottom: '8px',
                    paddingBottom: '8px',
                    borderBottom: `1px solid ${ink}33`,
                    display: 'grid',
                    gridTemplateColumns: '90px 1fr',
                    gap: '18px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      color: accent,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      paddingTop: '2px',
                      lineHeight: 1.3,
                    }}
                  >
                    {edu.startDate}
                    <br />
                    <span style={{ color: muted, fontWeight: 600 }}>—</span>
                    <br />
                    {edu.endDate}
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: '13.5px',
                        fontWeight: 800,
                        color: ink,
                        letterSpacing: '-0.01em',
                        marginBottom: '1px',
                      }}
                    >
                      {edu.degree}
                    </h3>
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: muted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {edu.school}
                    </div>
                    {edu.field && (
                      <div style={{ fontSize: '11px', color: muted, marginTop: '2px' }}>{edu.field}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.skills?.length > 0 && (
          <section className="cv-keep" style={{ marginBottom: '16px' }}>
            <SectionHeader roman={nextRoman()} title="Kompetenser" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {data.skills.map((skill, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: ink,
                    background: 'transparent',
                    border: `1px solid ${ink}`,
                    padding: '4px 10px',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {getSkillName(skill)}
                </span>
              ))}
            </div>
          </section>
        )}

        {data.languages?.length > 0 && (
          <section className="cv-keep" style={{ marginBottom: '16px' }}>
            <SectionHeader roman={nextRoman()} title="Språk" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
              {data.languages.map((lang) => {
                const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                return (
                  <div key={lang.id}>
                    <div style={{ fontSize: '12.5px', fontWeight: 800, color: ink, letterSpacing: '-0.01em' }}>
                      {name}
                    </div>
                    <div
                      style={{
                        fontSize: '9.5px',
                        color: accent,
                        marginTop: '1px',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                      }}
                    >
                      {getLanguageLevelDisplay(lang.level)}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {data.certificates?.length > 0 && (
          <section style={{ marginBottom: '32px' }}>
            <SectionHeader roman={nextRoman()} title="Certifikat" />
            <div>
              {data.certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="cv-entry"
                  style={{
                    marginBottom: '10px',
                    paddingBottom: '8px',
                    borderBottom: `1px solid ${ink}22`,
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 700, color: ink }}>{cert.name}</div>
                  {cert.issuer && (
                    <div
                      style={{
                        fontSize: '11px',
                        color: muted,
                        marginTop: '2px',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {cert.issuer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {data.links?.length > 0 && (
          <section>
            <SectionHeader roman={nextRoman()} title="Länkar" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {data.links.map((link) => (
                <div key={link.id} style={{ fontSize: '12px' }} className="cv-keep">
                  {link.label && (
                    <span style={{ fontWeight: 700, color: ink, marginRight: '8px' }}>{link.label}</span>
                  )}
                  <span style={{ color: accent, wordBreak: 'break-all' }}>{link.url}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function SectionHeader({ roman, title }: { roman: string; title: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '14px',
        marginBottom: '10px',
        paddingBottom: '5px',
        borderBottom: `2px solid ${ink}`,
      }}
    >
      <span
        style={{
          fontSize: '12px',
          fontWeight: 800,
          color: accent,
          fontFamily: "'Playfair Display', 'Georgia', serif",
          letterSpacing: '0.04em',
          minWidth: '28px',
        }}
      >
        {roman}
      </span>
      <h2
        style={{
          fontSize: '15px',
          fontWeight: 900,
          color: ink,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          flex: 1,
        }}
      >
        {title}
      </h2>
    </div>
  )
}
