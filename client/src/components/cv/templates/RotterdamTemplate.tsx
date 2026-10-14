/**
 * Rotterdam (id `rotterdam`) — luftig, med förnamnet spärrat och efternamnet
 * stort, en smal vänsterkolumn med kontakt, kompetenser, utbildning och språk.
 * Inter, nästan svartvit.
 *
 * Strukturen är cv-preview > main + aside så att vänsterkolumnen kan
 * upprepas på sida 2+ via print-CSS (samma teknik som Modern/Nordic).
 *
 * Slipad 2026-10-11 (CVK1):
 * - Bara efternamnet var rubrik (h1); förnamnet låg i ett vanligt stycke.
 *   En skärmläsare och ett rekryteringssystem fick alltså "GLÄNNSTRÖM" som
 *   dokumentets namn. Nu är hela namnet h1, med samma utseende.
 * - Versaler via `text-transform` i stället för `toUpperCase()` i texten.
 * - Kolumnens rubriker var h3 utan någon h2 — nivåerna hoppade.
 * - Ett långt efternamn får mindre grad i stället för att brytas mitt i ordet.
 * - Tunn kant mellan kolumnerna även i förhandsvisningen (PDF:en hade den).
 */

import { PostSektion } from './PostSektion'
import type { CSSProperties } from 'react'
import type { TemplateProps } from './types'
import { getLanguageLevelDisplay, getSkillName, getInitials } from './helpers'
import { periodText, rubrikTaggar } from './typografi'
import { Beskrivning } from './Beskrivning'
import { Url } from './Url'

const BLACK = '#1F2937'
const TEXT = '#374151'
const DAMPAD = '#5B6472' // 6,0:1 på vitt
const KANT = '#E5E7EB'

const sektionsrubrik: CSSProperties = {
  fontSize: '10.5px',
  fontWeight: 700,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: BLACK,
  margin: '0 0 12px',
  paddingBottom: '6px',
  borderBottom: `1px solid ${BLACK}`,
}

/** Efternamnets grad efter längd — "Andersson-Kristoffersson" ska rymmas. */
function efternamnsgrad(namn: string): string {
  if (namn.length > 16) return '36px'
  if (namn.length > 11) return '44px'
  return '54px'
}

export function RotterdamTemplate({ data, fullName, rubrikniva }: TemplateProps) {
  const { Namn, Sektion, Post } = rubrikTaggar(rubrikniva)
  const fornamn = (data.firstName || '').trim()
  const efternamn = (data.lastName || '').trim()
  const harKontakt = !!(data.email || data.phone || data.location)

  return (
    <div
      className="cv-preview"
      lang="sv"
      style={{
        display: 'flex',
        minHeight: '297mm',
        background: '#FFFFFF',
        color: TEXT,
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      <main style={{ flex: 1, minWidth: 0, padding: '60px 52px 52px 34px' }}>
        <header className="cv-keep" style={{ marginBottom: '32px' }}>
          <Namn style={{ margin: 0, color: BLACK, textTransform: 'uppercase' }}>
            {fornamn && efternamn ? (
              <>
                <span style={{ display: 'block', fontSize: '19px', fontWeight: 300, letterSpacing: '0.45em', lineHeight: 1.2 }}>
                  {fornamn}
                </span>{' '}
                <span
                  style={{
                    display: 'block',
                    fontSize: efternamnsgrad(efternamn),
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    lineHeight: 1,
                    marginTop: '6px',
                  }}
                >
                  {efternamn}
                </span>
              </>
            ) : (
              <span style={{ display: 'block', fontSize: efternamnsgrad(fullName), fontWeight: 700, letterSpacing: '0.1em', lineHeight: 1 }}>
                {fullName}
              </span>
            )}
          </Namn>
          {data.title && (
            <p
              style={{
                fontSize: '11.5px',
                fontWeight: 500,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: DAMPAD,
                margin: '14px 0 0',
              }}
            >
              {data.title}
            </p>
          )}
          <div aria-hidden="true" style={{ height: '1px', background: KANT, marginTop: '22px' }} />
        </header>

        {data.summary && (
          <section style={{ marginBottom: '30px' }}>
            <Sektion style={sektionsrubrik}>Profil</Sektion>
            <p style={{ fontSize: '12.5px', lineHeight: 1.7, color: TEXT, margin: 0 }}>{data.summary}</p>
          </section>
        )}

        {data.workExperience.length > 0 && (
          <PostSektion style={{ marginBottom: '30px' }} rubrik={<Sektion style={sektionsrubrik}>Erfarenhet</Sektion>}>
            {data.workExperience.map((job) => (
              <div key={job.id} className="cv-entry" style={{ marginBottom: '20px' }}>
                <Post style={{ fontSize: '14px', fontWeight: 700, color: BLACK, margin: 0 }}>{job.title}</Post>
                <p className="cv-datum" style={{ fontSize: '11px', fontWeight: 500, color: DAMPAD, margin: '3px 0 0', letterSpacing: '0.03em' }}>
                  {[job.company, job.location, periodText(job.startDate, job.endDate, job.current, 'nuvarande')].filter(Boolean).join(' · ')}
                </p>
                <Beskrivning text={job.description} style={{ fontSize: '12px', lineHeight: 1.65, color: TEXT, marginTop: '6px' }} />
              </div>
            ))}
          </PostSektion>
        )}

        {data.certificates.length > 0 && (
          <section className="cv-keep">
            <Sektion style={sektionsrubrik}>Certifikat</Sektion>
            {data.certificates.map((cert) => (
              <p key={cert.id} className="cv-entry" style={{ fontSize: '12px', color: BLACK, margin: '0 0 6px' }}>
                <span style={{ fontWeight: 600 }}>{cert.name}</span>
                {cert.issuer && <span style={{ color: DAMPAD }}> · {cert.issuer}</span>}
                {cert.date && <span className="cv-datum" style={{ color: DAMPAD }}> · {periodText(cert.date)}</span>}
              </p>
            ))}
          </section>
        )}
      </main>

      {/* Efter huvudtexten i dokumentet, till vänster på sidan (order: -1).
          220 px måste stämma med SIDEBAR_CONFIG.rotterdam. */}
      <aside
        style={{
          order: -1,
          width: '220px',
          flexShrink: 0,
          padding: '60px 26px 52px 48px',
          background: '#FFFFFF',
          borderRight: `1px solid ${KANT}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
        }}
      >
        <div className="cv-keep" style={{ display: 'flex', justifyContent: 'center' }}>
          {data.profileImage ? (
            <img src={data.profileImage} alt="" style={{ width: '108px', height: '108px', objectFit: 'cover', borderRadius: '50%' }} />
          ) : (
            <div
              aria-hidden="true"
              style={{
                width: '108px',
                height: '108px',
                borderRadius: '50%',
                border: '1px solid #D1D5DB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: 300,
                color: DAMPAD,
                letterSpacing: '0.05em',
              }}
            >
              {getInitials(data.firstName, data.lastName)}
            </div>
          )}
        </div>

        {harKontakt && (
          <section className="cv-keep">
            <Sektion style={sektionsrubrik}>Kontakt</Sektion>
            <ul className="cv-kontakt" style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: '11px', lineHeight: 1.7, color: TEXT }}>
              {data.location && <li>{data.location}</li>}
              {data.phone && <li>{data.phone}</li>}
              {data.email && <li>{data.email}</li>}
            </ul>
          </section>
        )}

        {data.links.length > 0 && (
          <section className="cv-keep">
            <Sektion style={sektionsrubrik}>Länkar</Sektion>
            {data.links.map((link) => (
              <div key={link.id} className="cv-entry" style={{ marginBottom: '8px' }}>
                {link.label && <div style={{ fontSize: '11px', fontWeight: 600, color: BLACK }}>{link.label}</div>}
                <div className="cv-url" style={{ fontSize: '10.5px', color: DAMPAD, lineHeight: 1.4 }}><Url text={link.url} /></div>
              </div>
            ))}
          </section>
        )}

        {data.skills.length > 0 && (
          <section>
            <Sektion style={sektionsrubrik}>Kompetenser</Sektion>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: '11px', lineHeight: 1.75, color: TEXT }}>
              {data.skills.map((skill, i) => (
                <li key={i}>{getSkillName(skill)}</li>
              ))}
            </ul>
          </section>
        )}

        {/* I asidens flex-kolumn kollapsar inga marginaler: sista postens 12px stod
            förr inne i sektionen. PostSektion nollar den, så den bor här i stället. */}
        {data.education.length > 0 && (
          <PostSektion style={{ marginBottom: '12px' }} rubrik={<Sektion style={sektionsrubrik}>Utbildning</Sektion>}>
            {data.education.map((edu) => (
              <div key={edu.id} className="cv-entry" style={{ marginBottom: '12px' }}>
                <Post style={{ fontSize: '11.5px', fontWeight: 700, color: BLACK, margin: 0, lineHeight: 1.35 }}>{edu.degree || edu.school}</Post>
                {edu.degree && <div style={{ fontSize: '10.5px', color: TEXT, marginTop: '1px' }}>{edu.school}</div>}
                {edu.field && <div style={{ fontSize: '10.5px', color: DAMPAD }}>{edu.field}</div>}
                <div className="cv-datum" style={{ fontSize: '10.5px', color: DAMPAD }}>
                  {periodText(edu.startDate, edu.endDate, edu.current)}
                </div>
              </div>
            ))}
          </PostSektion>
        )}

        {data.languages.length > 0 && (
          <section className="cv-keep">
            <Sektion style={sektionsrubrik}>Språk</Sektion>
            {data.languages.map((lang) => {
              const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
              return (
                <div key={lang.id} className="cv-entry" style={{ marginBottom: '5px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: BLACK }}>{name}</div>
                  <div style={{ fontSize: '10.5px', color: DAMPAD, fontStyle: 'italic' }}>{getLanguageLevelDisplay(lang.level)}</div>
                </div>
              )
            })}
          </section>
        )}
      </aside>
    </div>
  )
}
