/**
 * Minimal — schweizisk enkelhet. En spalt, svart på vitt, Inter.
 *
 * Personligheten bärs av luft och skala, inte av färg: ett stort namn, små
 * versala sektionsetiketter och en enda tunn linje under huvudet. Den mest
 * valda mallen i prod (14 av 39 CV:n, 2026-10-11) — ändringar här märks.
 *
 * Slipad 2026-10-11 (CVK1): grått bara där det klarar 4,5:1 (#6B6B6B, inte
 * #999), datum som "mar 2023 – nu" i tabulära siffror, ort och inriktning
 * med, beskrivningarnas radbrytningar och punktlistor bevarade.
 */

import type { CSSProperties } from 'react'
import type { TemplateProps } from './types'
import { getLanguageLevelDisplay, getSkillName } from './helpers'
import { periodText, rubrikTaggar } from './typografi'
import { Beskrivning } from './Beskrivning'
import { Url } from './Url'

const SVART = '#111111'
const TEXT = '#333333'
const DAMPAD = '#595959' // 7,0:1 på vitt
const ETIKETT = '#6B6B6B' // 5,3:1 på vitt
const LINJE = '#E3E3E3'

const sektionsrubrik: CSSProperties = {
  fontSize: '10.5px',
  fontWeight: 600,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: ETIKETT,
  margin: '0 0 10px',
}

const sektion: CSSProperties = { marginBottom: '22px' }

const datum: CSSProperties = {
  fontSize: '11px',
  color: ETIKETT,
  whiteSpace: 'nowrap',
  marginLeft: '16px',
}

export function MinimalTemplate({ data, fullName, rubrikniva }: TemplateProps) {
  const { Namn, Sektion, Post } = rubrikTaggar(rubrikniva)
  const kontakt = [data.email, data.phone, data.location].filter(Boolean) as string[]

  return (
    <div
      className="cv-preview"
      lang="sv"
      style={{
        minHeight: '297mm',
        background: '#FFFFFF',
        color: TEXT,
        padding: '44px 52px 40px',
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      <header style={{ marginBottom: '26px' }}>
        <Namn
          style={{
            fontSize: '40px',
            fontWeight: 700,
            letterSpacing: '-0.028em',
            lineHeight: 1.05,
            color: SVART,
            margin: 0,
          }}
        >
          {fullName}
        </Namn>
        {data.title && (
          <p style={{ fontSize: '15px', color: DAMPAD, margin: '8px 0 0', letterSpacing: '0.005em' }}>
            {data.title}
          </p>
        )}
        {kontakt.length > 0 && (
          <p
            className="cv-kontakt"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px 22px',
              margin: '18px 0 0',
              paddingTop: '12px',
              borderTop: `1px solid ${LINJE}`,
              fontSize: '11.5px',
              color: DAMPAD,
            }}
          >
            {kontakt.map((k) => (
              <span key={k}>{k}</span>
            ))}
          </p>
        )}
      </header>

      {data.summary && (
        <section style={sektion}>
          <p style={{ fontSize: '13px', lineHeight: 1.6, color: TEXT, margin: 0, maxWidth: '84ch' }}>
            {data.summary}
          </p>
        </section>
      )}

      {data.workExperience.length > 0 && (
        <section style={sektion}>
          <Sektion style={sektionsrubrik}>Erfarenhet</Sektion>
          {data.workExperience.map((job) => (
            <div key={job.id} className="cv-entry" style={{ marginBottom: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Post style={{ fontSize: '14px', fontWeight: 600, color: SVART, margin: 0 }}>{job.title}</Post>
                <span className="cv-datum" style={datum}>
                  {periodText(job.startDate, job.endDate, job.current)}
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: DAMPAD, margin: '2px 0 0' }}>
                {[job.company, job.location].filter(Boolean).join(' · ')}
              </p>
              <Beskrivning
                text={job.description}
                style={{ fontSize: '12.5px', lineHeight: 1.55, color: TEXT, marginTop: '5px', maxWidth: '88ch' }}
              />
            </div>
          ))}
        </section>
      )}

      {data.education.length > 0 && (
        <section style={sektion}>
          <Sektion style={sektionsrubrik}>Utbildning</Sektion>
          {data.education.map((edu) => (
            <div key={edu.id} className="cv-entry" style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Post style={{ fontSize: '13px', fontWeight: 600, color: SVART, margin: 0 }}>{edu.degree || edu.school}</Post>
                <span className="cv-datum" style={datum}>
                  {periodText(edu.startDate, edu.endDate, edu.current)}
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: DAMPAD, margin: '2px 0 0' }}>
                {[edu.degree ? edu.school : null, edu.field, edu.location].filter(Boolean).join(' · ')}
              </p>
              <Beskrivning
                text={edu.description}
                style={{ fontSize: '12.5px', lineHeight: 1.55, color: TEXT, marginTop: '4px', maxWidth: '88ch' }}
              />
            </div>
          ))}
        </section>
      )}

      {data.skills.length > 0 && (
        <section className="cv-keep" style={sektion}>
          <Sektion style={sektionsrubrik}>Kompetenser</Sektion>
          <ul
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '5px 20px',
              listStyle: 'none',
              margin: 0,
              padding: 0,
              fontSize: '12px',
              color: TEXT,
            }}
          >
            {data.skills.map((skill, i) => (
              <li key={i}>{getSkillName(skill)}</li>
            ))}
          </ul>
        </section>
      )}

      {data.languages.length > 0 && (
        <section className="cv-keep" style={sektion}>
          <Sektion style={sektionsrubrik}>Språk</Sektion>
          <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 28px', listStyle: 'none', margin: 0, padding: 0 }}>
            {data.languages.map((lang) => {
              const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
              return (
                <li key={lang.id} style={{ fontSize: '12px', color: TEXT }}>
                  {name}
                  <span style={{ color: DAMPAD }}> · {getLanguageLevelDisplay(lang.level)}</span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {data.certificates.length > 0 && (
        <section className="cv-keep" style={sektion}>
          <Sektion style={sektionsrubrik}>Certifikat</Sektion>
          {data.certificates.map((cert) => (
            <div
              key={cert.id}
              className="cv-entry"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}
            >
              <span style={{ fontSize: '12px', color: TEXT }}>
                <span style={{ fontWeight: 600, color: SVART }}>{cert.name}</span>
                {cert.issuer && <span style={{ color: DAMPAD }}> · {cert.issuer}</span>}
              </span>
              {cert.date && (
                <span className="cv-datum" style={datum}>
                  {periodText(cert.date)}
                </span>
              )}
            </div>
          ))}
        </section>
      )}

      {data.links.length > 0 && (
        <section className="cv-keep" style={sektion}>
          <Sektion style={sektionsrubrik}>Länkar</Sektion>
          {data.links.map((link) => (
            <p key={link.id} className="cv-entry" style={{ fontSize: '12px', color: TEXT, margin: '0 0 4px' }}>
              {link.label && <span style={{ fontWeight: 600, color: SVART }}>{link.label} </span>}
              <span className="cv-url" style={{ color: DAMPAD }}><Url text={link.url} /></span>
            </p>
          ))}
        </section>
      )}
    </div>
  )
}
