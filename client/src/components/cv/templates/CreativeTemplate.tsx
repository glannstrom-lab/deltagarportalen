/**
 * Kreativ (id `creative`) — magenta, stort namn, kontaktuppgifter som
 * piller och ett färgat kompetensblock. En spalt, Inter.
 *
 * Slipad 2026-10-11 (CVK1):
 * - Varje sektion låg i ett vitt kort. Ett kort som bryts över en sidbrytning
 *   blev två halva kort utan kant i PDF:en (syns på alla CV med mer än en
 *   sida). Nu bär bara de korta blocken (profil, kompetenser) kort; de långa
 *   sektionerna står fritt med magentafärgad rubrik.
 * - Datum, orter och nivåer i #888 (3,4:1 på #FAFAFA) → #5C5C5C.
 * - Datumpillret behåller sin form men i en ton som klarar 4,5:1.
 */

import { PostSektion } from './PostSektion'
import type { CSSProperties } from 'react'
import { Mail, Phone, MapPin } from '@/components/ui/icons'
import type { TemplateProps } from './types'
import { getLanguageLevelDisplay, getSkillName } from './helpers'
import { periodText, rubrikTaggar } from './typografi'
import { Beskrivning } from './Beskrivning'
import { Url } from './Url'

const MAGENTA = '#A21464' // 7,1:1 på #FAFAFA
const MAGENTA_MORK = '#7E0F4D'
const ROSA = '#FBE7F1'
const SVART = '#1A1A1A'
const TEXT = '#3A3A3A'
const DAMPAD = '#5C5C5C' // 6,2:1 på #FAFAFA
const SIDA = '#FAFAFA'

const sektionsrubrik: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: MAGENTA,
  margin: '0 0 12px',
}

const sektion: CSSProperties = { marginBottom: '22px' }

const kort: CSSProperties = {
  background: '#FFFFFF',
  borderRadius: '12px',
  padding: '14px 18px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 2px 10px rgba(0,0,0,0.04)',
}

const pill: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '5px 12px',
  background: '#FFFFFF',
  borderRadius: '100px',
  fontSize: '11.5px',
  color: TEXT,
  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
}

function Rubrik({ tagg: Tagg, children }: { tagg: 'h2' | 'h3' | 'h4' | 'h1'; children: string }) {
  return (
    <Tagg style={sektionsrubrik}>
      {children}
      <span aria-hidden="true" style={{ flex: 1, height: '2px', background: ROSA, borderRadius: '1px' }} />
    </Tagg>
  )
}

export function CreativeTemplate({ data, fullName, rubrikniva }: TemplateProps) {
  const { Namn, Sektion, Post } = rubrikTaggar(rubrikniva)

  return (
    <div
      className="cv-preview"
      lang="sv"
      style={{
        minHeight: '297mm',
        background: SIDA,
        color: TEXT,
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        position: 'relative',
      }}
    >
      <header style={{ padding: '34px 44px 18px' }}>
        <div style={{ display: 'flex', gap: '22px', alignItems: 'center' }}>
          {data.profileImage && (
            <img
              src={data.profileImage}
              alt=""
              style={{
                width: '96px',
                height: '120px',
                objectFit: 'cover',
                borderRadius: '14px',
                boxShadow: `6px 6px 0 ${ROSA}`,
                flexShrink: 0,
              }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Namn
              style={{
                fontSize: '42px',
                fontWeight: 800,
                letterSpacing: '-0.035em',
                lineHeight: 1.02,
                color: MAGENTA,
                margin: 0,
              }}
            >
              {fullName}
            </Namn>
            {data.title && (
              <p style={{ fontSize: '15.5px', fontWeight: 500, color: SVART, margin: '7px 0 0' }}>{data.title}</p>
            )}
          </div>
        </div>

        {(data.email || data.phone || data.location) && (
          <p className="cv-kontakt" style={{ display: 'flex', gap: '8px', margin: '18px 0 0', flexWrap: 'wrap' }}>
            {data.email && (
              <span style={pill}>
                <Mail aria-hidden="true" style={{ width: '12px', height: '12px', color: MAGENTA }} />
                {data.email}
              </span>
            )}
            {data.phone && (
              <span style={pill}>
                <Phone aria-hidden="true" style={{ width: '12px', height: '12px', color: MAGENTA }} />
                {data.phone}
              </span>
            )}
            {data.location && (
              <span style={pill}>
                <MapPin aria-hidden="true" style={{ width: '12px', height: '12px', color: MAGENTA }} />
                {data.location}
              </span>
            )}
          </p>
        )}
      </header>

      <main style={{ padding: '4px 44px 32px' }}>
        {data.summary && (
          <section className="cv-keep" style={{ ...kort, marginBottom: '14px', borderLeft: `4px solid ${MAGENTA}` }}>
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: TEXT, margin: 0 }}>{data.summary}</p>
          </section>
        )}

        {data.skills.length > 0 && (
          <section
            className="cv-keep"
            style={{ background: MAGENTA, borderRadius: '12px', padding: '14px 18px', marginBottom: '24px' }}
          >
            <Sektion
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#FFFFFF',
                margin: '0 0 10px',
              }}
            >
              Kompetenser
            </Sektion>
            <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', listStyle: 'none', margin: 0, padding: 0 }}>
              {data.skills.map((skill, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    padding: '4px 11px',
                    background: MAGENTA_MORK,
                    color: '#FFFFFF',
                    borderRadius: '100px',
                  }}
                >
                  {getSkillName(skill)}
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.workExperience.length > 0 && (
          <PostSektion style={sektion} rubrik={<Rubrik tagg={Sektion}>Erfarenhet</Rubrik>}>
            {data.workExperience.map((job) => (
              <div key={job.id} className="cv-entry" style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '14px' }}>
                  <Post style={{ fontSize: '14.5px', fontWeight: 700, color: SVART, margin: 0 }}>{job.title}</Post>
                  <span
                    className="cv-datum"
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 600,
                      color: MAGENTA_MORK,
                      background: ROSA,
                      padding: '2px 9px',
                      borderRadius: '100px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {periodText(job.startDate, job.endDate, job.current)}
                  </span>
                </div>
                <p style={{ fontSize: '12.5px', margin: '2px 0 0', color: MAGENTA, fontWeight: 500 }}>
                  {job.company}
                  {job.location && <span style={{ color: DAMPAD, fontWeight: 400 }}> · {job.location}</span>}
                </p>
                <Beskrivning text={job.description} style={{ fontSize: '12.5px', lineHeight: 1.55, color: TEXT, marginTop: '5px' }} />
              </div>
            ))}
          </PostSektion>
        )}

        {data.education.length > 0 && (
          <PostSektion style={sektion} rubrik={<Rubrik tagg={Sektion}>Utbildning</Rubrik>}>
            {data.education.map((edu) => (
              <div key={edu.id} className="cv-entry" style={{ marginBottom: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '14px' }}>
                  <Post style={{ fontSize: '14px', fontWeight: 700, color: SVART, margin: 0 }}>{edu.degree || edu.school}</Post>
                  <span className="cv-datum" style={{ fontSize: '11px', color: DAMPAD, whiteSpace: 'nowrap' }}>
                    {periodText(edu.startDate, edu.endDate, edu.current)}
                  </span>
                </div>
                <p style={{ fontSize: '12.5px', margin: '2px 0 0', color: MAGENTA, fontWeight: 500 }}>
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
            <Rubrik tagg={Sektion}>Språk</Rubrik>
            <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 30px', listStyle: 'none', margin: 0, padding: 0 }}>
              {data.languages.map((lang) => {
                const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                return (
                  <li key={lang.id} style={{ fontSize: '12.5px', color: SVART, fontWeight: 500 }}>
                    {name}
                    <span style={{ color: DAMPAD, fontWeight: 400 }}> · {getLanguageLevelDisplay(lang.level)}</span>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {data.certificates.length > 0 && (
          <section className="cv-keep" style={sektion}>
            <Rubrik tagg={Sektion}>Certifikat</Rubrik>
            {data.certificates.map((cert) => (
              <p key={cert.id} className="cv-entry" style={{ fontSize: '12.5px', color: SVART, margin: '0 0 4px' }}>
                <span style={{ fontWeight: 600 }}>{cert.name}</span>
                {cert.issuer && <span style={{ color: DAMPAD }}> · {cert.issuer}</span>}
                {cert.date && <span className="cv-datum" style={{ color: DAMPAD }}> · {periodText(cert.date)}</span>}
              </p>
            ))}
          </section>
        )}

        {data.links.length > 0 && (
          <section className="cv-keep" style={sektion}>
            <Rubrik tagg={Sektion}>Länkar</Rubrik>
            {data.links.map((link) => (
              <p key={link.id} className="cv-entry" style={{ fontSize: '12.5px', color: SVART, margin: '0 0 4px' }}>
                {link.label && <span style={{ fontWeight: 600 }}>{link.label} · </span>}
                <span className="cv-url" style={{ color: DAMPAD }}><Url text={link.url} /></span>
              </p>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}
