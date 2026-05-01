/**
 * Executive Template — Klassisk elegans, serif typografi och guld-accenter.
 *
 * Linjär 1-kolumns layout (matchar Harvard/Yale/Forbes executive-CV-stil).
 * 2-kolumns-versionen splittade entries över sidbrott på multi-page-CVs så
 * Erfarenhet kunde hamna i en smal kolumn på sida 2 medan Skills/Språk
 * tog plats parallellt — ful effekt utan något att vinna designmässigt.
 */

import type { TemplateProps } from './types'
import { getLanguageLevelDisplay, getSkillName } from './helpers'

const gold = '#B8860B'
const goldLight = '#E5D4A8'
const goldFaint = '#F5E6C8'
const ink = '#1A1A1A'
const muted = '#666666'

export function ExecutiveTemplate({ data, fullName }: TemplateProps) {
  const sectionHeader: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 400,
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    color: gold,
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottom: `1px solid ${goldFaint}`,
  }

  return (
    <div
      className="cv-preview"
      style={{
        minHeight: '297mm',
        background: '#FDFCFA',
        fontFamily: "'Georgia', 'Times New Roman', serif",
        color: ink,
      }}
    >
      {/* Header med guld-divider */}
      <header
        className="cv-keep"
        style={{
          padding: '56px 72px 28px',
          borderBottom: `2px solid ${gold}`,
          background: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {data.profileImage && (
            <img
              src={data.profileImage}
              alt=""
              style={{
                width: '110px',
                height: '110px',
                objectFit: 'cover',
                borderRadius: '4px',
                border: `2px solid ${gold}`,
                flexShrink: 0,
              }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontSize: '42px',
                fontWeight: 400,
                letterSpacing: '0.02em',
                color: ink,
                marginBottom: '6px',
                lineHeight: 1.1,
              }}
            >
              {fullName}
            </h1>
            {data.title && (
              <p style={{ fontSize: '18px', fontStyle: 'italic', color: gold, marginBottom: '14px' }}>
                {data.title}
              </p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '13px', color: muted }}>
              {data.email && <span>{data.email}</span>}
              {data.phone && <span>{data.phone}</span>}
              {data.location && <span>{data.location}</span>}
            </div>
          </div>
        </div>
      </header>

      <main style={{ padding: '40px 72px 56px' }}>
        {/* Profil — drop cap fungerar bara om summary börjar med en bokstav
            och är längre än 1 rad. Annars blir floaten visuellt udda. */}
        {data.summary && (
          <section style={{ marginBottom: '36px' }}>
            <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#333333' }}>
              {data.summary.length > 80 ? (
                <>
                  <span
                    style={{
                      float: 'left',
                      fontSize: '52px',
                      lineHeight: 0.9,
                      marginRight: '10px',
                      marginTop: '6px',
                      marginBottom: '-4px',
                      color: gold,
                      fontWeight: 400,
                    }}
                  >
                    {data.summary.charAt(0)}
                  </span>
                  {data.summary.slice(1)}
                </>
              ) : (
                data.summary
              )}
            </p>
          </section>
        )}

        {data.workExperience?.length > 0 && (
          <section style={{ marginBottom: '36px' }}>
            <h2 style={sectionHeader}>Erfarenhet</h2>
            <div>
              {data.workExperience.map((job) => (
                <div key={job.id} className="cv-entry" style={{ marginBottom: '20px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      marginBottom: '2px',
                    }}
                  >
                    <h3 style={{ fontSize: '17px', fontWeight: 400, color: ink, wordBreak: 'break-word' }}>
                      {job.title}
                    </h3>
                    <span
                      style={{
                        fontSize: '13px',
                        color: muted,
                        fontStyle: 'italic',
                        whiteSpace: 'nowrap',
                        marginLeft: '12px',
                      }}
                    >
                      {job.startDate} — {job.current ? 'Nuvarande' : job.endDate}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: gold, marginBottom: '8px' }}>
                    {job.company}
                    {job.location && <span style={{ color: muted }}> · {job.location}</span>}
                  </div>
                  {job.description && (
                    <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#444444' }}>{job.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {data.education?.length > 0 && (
          <section style={{ marginBottom: '36px' }}>
            <h2 style={sectionHeader}>Utbildning</h2>
            <div>
              {data.education.map((edu) => (
                <div key={edu.id} className="cv-entry" style={{ marginBottom: '16px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      marginBottom: '2px',
                    }}
                  >
                    <h3 style={{ fontSize: '16px', fontWeight: 400, color: ink, wordBreak: 'break-word' }}>
                      {edu.degree}
                    </h3>
                    <span
                      style={{
                        fontSize: '13px',
                        color: muted,
                        fontStyle: 'italic',
                        whiteSpace: 'nowrap',
                        marginLeft: '12px',
                      }}
                    >
                      {edu.startDate} — {edu.endDate}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: gold }}>
                    {edu.school}
                    {edu.field && <span style={{ color: muted, fontStyle: 'italic' }}> · {edu.field}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.skills?.length > 0 && (
          <section className="cv-keep" style={{ marginBottom: '36px' }}>
            <h2 style={sectionHeader}>Expertis</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {data.skills.map((skill, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '13px',
                    padding: '6px 14px',
                    border: `1px solid ${goldLight}`,
                    color: '#555555',
                    borderRadius: '2px',
                  }}
                >
                  {getSkillName(skill)}
                </span>
              ))}
            </div>
          </section>
        )}

        {data.languages?.length > 0 && (
          <section className="cv-keep" style={{ marginBottom: '36px' }}>
            <h2 style={sectionHeader}>Språk</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              {data.languages.map((lang) => {
                const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                return (
                  <div key={lang.id} className="cv-entry">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', color: '#333333' }}>{name}</span>
                      <span style={{ fontSize: '14px', fontStyle: 'italic', color: muted }}>
                        {getLanguageLevelDisplay(lang.level)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {data.certificates?.length > 0 && (
          <section className="cv-keep" style={{ marginBottom: '36px' }}>
            <h2 style={sectionHeader}>Certifikat</h2>
            <div>
              {data.certificates.map((cert) => (
                <div key={cert.id} className="cv-entry" style={{ marginBottom: '10px' }}>
                  <span style={{ fontSize: '14px', color: ink, fontWeight: 400 }}>{cert.name}</span>
                  {cert.issuer && (
                    <span style={{ fontSize: '13px', color: muted, fontStyle: 'italic' }}> · {cert.issuer}</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {data.links?.length > 0 && (
          <section className="cv-keep">
            <h2 style={sectionHeader}>Länkar</h2>
            <div>
              {data.links.map((link) => (
                <div key={link.id} className="cv-entry" style={{ marginBottom: '6px', fontSize: '13px' }}>
                  {link.label && <span style={{ color: ink }}>{link.label} · </span>}
                  <span style={{ color: gold, wordBreak: 'break-all' }}>{link.url}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
