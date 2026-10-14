/**
 * Atelier (id `atelier`) — premium på krämvit botten. Namnet spärrat i
 * Crimson Pro (serif), brödtexten i Source Sans 3, mörk teal som enda färg,
 * tunna linjer. Smal metakolumn till vänster inne i sidan, bred innehålls-
 * kolumn till höger.
 *
 * Slipad 2026-10-11 (CVK1):
 * - Dämpad teal #7A8C8C (3,3:1 på krämvitt) och #666 i 10 px → #4F6262 och
 *   #5C5C5C, minst 10,5 px.
 * - Metakolumnen står efter innehållet i dokumentet (order: -1): rubrikerna
 *   hoppade från h1 till metakolumnens h3, och läsordningen började med
 *   "Kompetenser" före erfarenheten.
 * - Datumen i kursiv men med tabulära siffror, "mar 2023 – nuvarande".
 */

import { PostSektion } from './PostSektion'
import type { CSSProperties } from 'react'
import type { TemplateProps } from './types'
import { getLanguageLevelDisplay, getSkillName, getInitials } from './helpers'
import { periodText, rubrikTaggar } from './typografi'
import { Beskrivning } from './Beskrivning'
import { Url } from './Url'

const BLACK = '#1A1A1A'
const TEAL = '#1E3A3A' // 12,4:1 på krämvitt
const TEAL_DAMPAD = '#4F6262' // 6,2:1
const TEXT = '#333333'
const DAMPAD = '#5C5C5C' // 6,4:1
const KRAM = '#FAF8F4'
const SERIF = "'Crimson Pro', Georgia, serif"

const rubrik: CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: TEAL,
  margin: '0 0 12px',
  paddingBottom: '6px',
  borderBottom: `1px solid ${TEAL}`,
}

const datum: CSSProperties = { fontSize: '11px', fontStyle: 'italic', color: DAMPAD, whiteSpace: 'nowrap', marginLeft: '14px' }

export function AtelierTemplate({ data, fullName, rubrikniva }: TemplateProps) {
  const { Namn, Sektion, Post } = rubrikTaggar(rubrikniva)
  const kontakt = [data.email, data.phone, data.location].filter(Boolean) as string[]

  return (
    <div
      className="cv-preview"
      lang="sv"
      style={{
        minHeight: '297mm',
        background: KRAM,
        fontFamily: "'Source Sans 3', 'Helvetica Neue', Arial, sans-serif",
        color: TEXT,
      }}
    >
      <header style={{ padding: '40px 60px 22px', textAlign: 'center', borderBottom: `1px solid ${TEAL}` }}>
        <Namn
          style={{
            fontFamily: SERIF,
            fontSize: fullName.length > 22 ? '26px' : '31px',
            fontWeight: 400,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: TEAL,
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          {fullName}
        </Namn>
        {data.title && (
          <p
            style={{
              fontSize: '10.5px',
              fontWeight: 600,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: TEAL_DAMPAD,
              margin: '9px 0 0',
            }}
          >
            {data.title}
          </p>
        )}
        {kontakt.length > 0 && (
          <p
            className="cv-kontakt"
            style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '3px 22px',
              fontSize: '11.5px',
              letterSpacing: '0.03em',
              color: DAMPAD,
              margin: '14px 0 0',
            }}
          >
            {kontakt.map((k) => (
              <span key={k}>{k}</span>
            ))}
          </p>
        )}
      </header>

      <div style={{ display: 'flex', padding: '26px 60px 36px', gap: '36px' }}>
        <main style={{ flex: 1, minWidth: 0 }}>
          {data.summary && (
            <section style={{ marginBottom: '22px' }}>
              <Sektion style={rubrik}>Profil</Sektion>
              <p style={{ fontSize: '13px', lineHeight: 1.6, color: TEXT, margin: 0 }}>{data.summary}</p>
            </section>
          )}

          {data.workExperience.length > 0 && (
            <PostSektion style={{ marginBottom: '22px' }} rubrik={<Sektion style={rubrik}>Erfarenhet</Sektion>}>
              {data.workExperience.map((job) => (
                <div key={job.id} className="cv-entry" style={{ marginBottom: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Post style={{ fontSize: '14px', fontWeight: 700, color: BLACK, margin: 0 }}>{job.title}</Post>
                    <span className="cv-datum" style={datum}>
                      {periodText(job.startDate, job.endDate, job.current, 'nuvarande')}
                    </span>
                  </div>
                  <p style={{ fontSize: '12.5px', margin: '1px 0 0', color: TEAL, fontWeight: 600, letterSpacing: '0.02em' }}>
                    {job.company}
                    {job.location && <span style={{ color: DAMPAD, fontWeight: 400 }}> · {job.location}</span>}
                  </p>
                  <Beskrivning text={job.description} style={{ fontSize: '12.5px', lineHeight: 1.55, color: TEXT, marginTop: '4px' }} />
                </div>
              ))}
            </PostSektion>
          )}

          {data.education.length > 0 && (
            <PostSektion style={{ marginBottom: '22px' }} rubrik={<Sektion style={rubrik}>Utbildning</Sektion>}>
              {data.education.map((edu) => (
                <div key={edu.id} className="cv-entry" style={{ marginBottom: '11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Post style={{ fontSize: '13.5px', fontWeight: 700, color: BLACK, margin: 0 }}>{edu.degree || edu.school}</Post>
                    <span className="cv-datum" style={datum}>
                      {periodText(edu.startDate, edu.endDate, edu.current, 'nuvarande')}
                    </span>
                  </div>
                  {edu.degree && edu.school && (
                    <p style={{ fontSize: '12.5px', margin: '1px 0 0', color: TEAL, fontWeight: 600 }}>{edu.school}</p>
                  )}
                  {(edu.field || edu.location) && (
                    <p style={{ fontSize: '12px', margin: '1px 0 0', color: DAMPAD, fontStyle: 'italic' }}>
                      {[edu.field, edu.location].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <Beskrivning text={edu.description} style={{ fontSize: '12.5px', lineHeight: 1.55, color: TEXT, marginTop: '4px' }} />
                </div>
              ))}
            </PostSektion>
          )}
        </main>

        {/* Metakolumnen — efter innehållet i dokumentet, till vänster på sidan. */}
        <aside style={{ order: -1, width: '168px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="cv-keep" style={{ display: 'flex', justifyContent: 'center' }}>
            {data.profileImage ? (
              <img
                src={data.profileImage}
                alt=""
                style={{ width: '96px', height: '96px', objectFit: 'cover', borderRadius: '50%', border: `1px solid ${TEAL}` }}
              />
            ) : (
              <div
                aria-hidden="true"
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  border: `1px solid ${TEAL}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '27px',
                  color: TEAL,
                  fontFamily: SERIF,
                  letterSpacing: '0.08em',
                }}
              >
                {getInitials(data.firstName, data.lastName)}
              </div>
            )}
          </div>

          {data.skills.length > 0 && (
            <section>
              <Sektion style={rubrik}>Kompetenser</Sektion>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {data.skills.map((skill, i) => (
                  <li key={i} style={{ fontSize: '12px', lineHeight: 1.65, color: BLACK }}>
                    {getSkillName(skill)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data.languages.length > 0 && (
            <section className="cv-keep">
              <Sektion style={rubrik}>Språk</Sektion>
              {data.languages.map((lang) => {
                const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                return (
                  <div key={lang.id} className="cv-entry" style={{ marginBottom: '7px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: BLACK }}>{name}</div>
                    <div style={{ fontSize: '11px', color: DAMPAD, fontStyle: 'italic' }}>{getLanguageLevelDisplay(lang.level)}</div>
                  </div>
                )
              })}
            </section>
          )}

          {data.certificates.length > 0 && (
            <section className="cv-keep">
              <Sektion style={rubrik}>Certifikat</Sektion>
              {data.certificates.map((cert) => (
                <div key={cert.id} className="cv-entry" style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: BLACK }}>{cert.name}</div>
                  {(cert.issuer || cert.date) && (
                    <div className="cv-datum" style={{ fontSize: '11px', color: DAMPAD }}>
                      {[cert.issuer, periodText(cert.date)].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          {data.links.length > 0 && (
            <section className="cv-keep">
              <Sektion style={rubrik}>Länkar</Sektion>
              {data.links.map((link) => (
                <div key={link.id} className="cv-entry" style={{ marginBottom: '8px' }}>
                  {link.label && <div style={{ fontSize: '12px', fontWeight: 600, color: BLACK }}>{link.label}</div>}
                  <div className="cv-url" style={{ fontSize: '11px', color: DAMPAD }}><Url text={link.url} /></div>
                </div>
              ))}
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
