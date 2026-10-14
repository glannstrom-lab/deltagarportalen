/**
 * Centrerad (id `centered`) — klassisk navy-rubrik med guldlinje, centrerat
 * huvud, en spalt. Namnet i Source Serif 4, brödtexten i Inter: den klassiska
 * kombinationen serif-rubrik och sans-text.
 *
 * Slipad 2026-10-11 (CVK1): datum och orter i #9CA3AF (2,54:1) → #5B6472;
 * beskrivningar i #6B7280 → mörkare (#3F4652) för läsbarhet i löptext;
 * rubrikhierarkin följer dokumentet (h1 i PDF:en, h2 i förhandsvisningen).
 */

import { PostSektion } from './PostSektion'
import type { CSSProperties } from 'react'
import { Mail, Phone, MapPin } from '@/components/ui/icons'
import type { TemplateProps } from './types'
import { getLanguageLevelDisplay, getSkillName } from './helpers'
import { periodText, rubrikTaggar } from './typografi'
import { Beskrivning } from './Beskrivning'
import { Url } from './Url'

const NAVY = '#1E3A5F' // 11,3:1 på vitt
const GULD = '#C9A66B' // linjer; på navy 5,2:1
const SVART = '#111827'
const TEXT = '#3F4652'
const DAMPAD = '#5B6472' // 6,0:1 på vitt
const LINJE = '#D7DEE7'

const sektionsrubrik: CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: NAVY,
  margin: '0 0 11px',
  paddingBottom: '5px',
  borderBottom: `1px solid ${LINJE}`,
}

const sektion: CSSProperties = { marginBottom: '20px' }

const datum: CSSProperties = { fontSize: '11.5px', color: DAMPAD, whiteSpace: 'nowrap', marginLeft: '16px' }

const post: CSSProperties = { paddingLeft: '14px', borderLeft: `2px solid ${LINJE}`, marginBottom: '11px' }

export function CenteredTemplate({ data, fullName, rubrikniva }: TemplateProps) {
  const { Namn, Sektion, Post } = rubrikTaggar(rubrikniva)
  const kontaktstil: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px' }

  return (
    <div
      className="cv-preview"
      lang="sv"
      style={{
        minHeight: '297mm',
        background: '#FFFFFF',
        color: TEXT,
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      <header
        className="cv-keep"
        style={{
          background: NAVY,
          padding: '26px 56px 20px',
          textAlign: 'center',
          color: '#FFFFFF',
          borderBottom: `3px solid ${GULD}`,
        }}
      >
        {data.profileImage && (
          <img
            src={data.profileImage}
            alt=""
            style={{
              width: '72px',
              height: '72px',
              objectFit: 'cover',
              borderRadius: '50%',
              border: `2px solid ${GULD}`,
              // Portalens preflight gör img till block — centrera med marginaler.
              display: 'block',
              margin: '0 auto 10px',
            }}
          />
        )}
        <Namn
          style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: '32px',
            fontWeight: 600,
            letterSpacing: '0.005em',
            lineHeight: 1.1,
            color: '#FFFFFF',
            margin: 0,
          }}
        >
          {fullName}
        </Namn>
        {data.title && (
          <p
            style={{
              fontSize: '11.5px',
              fontWeight: 500,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: GULD,
              margin: '7px 0 0',
            }}
          >
            {data.title}
          </p>
        )}
        {(data.email || data.phone || data.location) && (
          <p
            className="cv-kontakt"
            style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '4px 20px',
              margin: '12px 0 0',
              fontSize: '11.5px',
              color: '#E4EAF2',
            }}
          >
            {data.email && (
              <span style={kontaktstil}>
                <Mail aria-hidden="true" style={{ width: '12px', height: '12px', color: GULD }} />
                {data.email}
              </span>
            )}
            {data.phone && (
              <span style={kontaktstil}>
                <Phone aria-hidden="true" style={{ width: '12px', height: '12px', color: GULD }} />
                {data.phone}
              </span>
            )}
            {data.location && (
              <span style={kontaktstil}>
                <MapPin aria-hidden="true" style={{ width: '12px', height: '12px', color: GULD }} />
                {data.location}
              </span>
            )}
          </p>
        )}
      </header>

      <main style={{ padding: '24px 56px 32px' }}>
        {data.summary && (
          <section style={{ ...sektion, textAlign: 'center' }}>
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: TEXT, maxWidth: '620px', margin: '0 auto' }}>
              {data.summary}
            </p>
          </section>
        )}

        {data.skills.length > 0 && (
          <section style={{ ...sektion, textAlign: 'center' }}>
            <Sektion style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', margin: 0, color: NAVY }}>
              Kompetenser
            </Sektion>
            <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', justifyContent: 'center', listStyle: 'none', margin: 0, padding: 0 }}>
              {data.skills.map((skill, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    padding: '4px 12px',
                    background: '#F1EEE7',
                    color: NAVY,
                    borderRadius: '3px',
                  }}
                >
                  {getSkillName(skill)}
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.workExperience.length > 0 && (
          <PostSektion style={sektion} rubrik={<Sektion style={sektionsrubrik}>Erfarenhet</Sektion>}>
            {data.workExperience.map((job) => (
              <div key={job.id} className="cv-entry" style={post}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Post style={{ fontSize: '14px', fontWeight: 600, color: SVART, margin: 0 }}>{job.title}</Post>
                  <span className="cv-datum" style={datum}>
                    {periodText(job.startDate, job.endDate, job.current)}
                  </span>
                </div>
                <p style={{ fontSize: '12.5px', color: NAVY, margin: '2px 0 0', fontWeight: 500 }}>
                  {job.company}
                  {job.location && <span style={{ color: DAMPAD, fontWeight: 400 }}> · {job.location}</span>}
                </p>
                <Beskrivning text={job.description} style={{ fontSize: '12.5px', lineHeight: 1.55, color: TEXT, marginTop: '4px' }} />
              </div>
            ))}
          </PostSektion>
        )}

        {data.education.length > 0 && (
          <PostSektion style={sektion} rubrik={<Sektion style={sektionsrubrik}>Utbildning</Sektion>}>
            {data.education.map((edu) => (
              <div key={edu.id} className="cv-entry" style={post}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Post style={{ fontSize: '13.5px', fontWeight: 600, color: SVART, margin: 0 }}>{edu.degree || edu.school}</Post>
                  <span className="cv-datum" style={datum}>
                    {periodText(edu.startDate, edu.endDate, edu.current)}
                  </span>
                </div>
                <p style={{ fontSize: '12.5px', color: NAVY, margin: '2px 0 0', fontWeight: 500 }}>
                  {edu.degree ? edu.school : null}
                  {[edu.field, edu.location].filter(Boolean).length > 0 && (
                    <span style={{ color: DAMPAD, fontWeight: 400 }}>
                      {edu.degree ? ' · ' : ''}
                      {[edu.field, edu.location].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </p>
                <Beskrivning text={edu.description} style={{ fontSize: '12.5px', lineHeight: 1.55, color: TEXT, marginTop: '4px' }} />
              </div>
            ))}
          </PostSektion>
        )}

        {data.languages.length > 0 && (
          <section className="cv-keep" style={sektion}>
            <Sektion style={sektionsrubrik}>Språk</Sektion>
            <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 32px', listStyle: 'none', margin: 0, padding: 0 }}>
              {data.languages.map((lang) => {
                const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                return (
                  <li key={lang.id} style={{ fontSize: '12.5px', color: SVART }}>
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
              <p key={cert.id} className="cv-entry" style={{ fontSize: '12.5px', color: SVART, margin: '0 0 4px' }}>
                <span style={{ fontWeight: 500 }}>{cert.name}</span>
                {cert.issuer && <span style={{ color: DAMPAD }}> · {cert.issuer}</span>}
                {cert.date && <span className="cv-datum" style={{ color: DAMPAD }}> · {periodText(cert.date)}</span>}
              </p>
            ))}
          </section>
        )}

        {data.links.length > 0 && (
          <section className="cv-keep" style={sektion}>
            <Sektion style={sektionsrubrik}>Länkar</Sektion>
            {data.links.map((link) => (
              <p key={link.id} className="cv-entry" style={{ fontSize: '12.5px', color: SVART, margin: '0 0 4px' }}>
                {link.label && <span style={{ fontWeight: 500 }}>{link.label} · </span>}
                <span className="cv-url" style={{ color: DAMPAD }}><Url text={link.url} /></span>
              </p>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}
