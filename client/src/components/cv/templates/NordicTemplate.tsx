/**
 * Nordisk (id `nordic`) — ljus, luftig skandinavisk minimalism. Ljusgrå
 * sidopanel med tunn kant, himmelsblå accent, Inter.
 *
 * Slipad 2026-10-11 (CVK1):
 * - Panelrubriker och datum i #94A3B8 (2,56:1 på vitt) → #5B6B80.
 * - Accentblått #0EA5E9 (2,77:1) som textfärg → #0369A1 (5,9:1). Den ljusa
 *   tonen bär bara den korta linjen under namnet.
 * - Panelen står efter huvudtexten i dokumentet (order: -1) så läsordningen
 *   börjar med namnet, inte med ordet "Kontakt".
 */

import type { CSSProperties } from 'react'
import type { TemplateProps } from './types'
import { getLanguageLevelDisplay, getSkillName, getInitials } from './helpers'
import { periodText, rubrikTaggar } from './typografi'
import { Beskrivning } from './Beskrivning'
import { Url } from './Url'

const HIMMEL = '#0EA5E9' // bara dekor
const BLA_TEXT = '#0369A1' // 5,9:1 på vitt
const PANEL = '#F8FAFC'
const KANT = '#E2E8F0'
const RUBRIK = '#0F172A'
const TEXT = '#334155'
const DAMPAD = '#5B6B80' // 5,4:1 på #F8FAFC

const panelrubrik: CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: DAMPAD,
  margin: '0 0 9px',
}

const huvudrubrik: CSSProperties = {
  fontSize: '10.5px',
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: DAMPAD,
  margin: '0 0 12px',
  paddingBottom: '6px',
  borderBottom: `1px solid ${KANT}`,
}

const datum: CSSProperties = { fontSize: '11px', color: DAMPAD, whiteSpace: 'nowrap', marginLeft: '14px' }

export function NordicTemplate({ data, fullName, rubrikniva }: TemplateProps) {
  const { Namn, Sektion, Post } = rubrikTaggar(rubrikniva)
  const harKontakt = !!(data.email || data.phone || data.location)

  return (
    <div
      className="cv-preview"
      lang="sv"
      style={{
        display: 'flex',
        minHeight: '297mm',
        color: TEXT,
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        background: '#FFFFFF',
      }}
    >
      <main style={{ flex: 1, minWidth: 0, padding: '38px 40px 36px' }}>
        <header style={{ marginBottom: '22px' }}>
          <Namn
            style={{ fontSize: '34px', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.1, color: RUBRIK, margin: 0 }}
          >
            {fullName}
          </Namn>
          {data.title && <p style={{ fontSize: '15px', color: BLA_TEXT, margin: '6px 0 0' }}>{data.title}</p>}
          <div aria-hidden="true" style={{ width: '28px', height: '2px', background: HIMMEL, marginTop: '14px' }} />
        </header>

        {data.summary && (
          <section style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '13px', lineHeight: 1.65, color: TEXT, margin: 0 }}>{data.summary}</p>
          </section>
        )}

        {data.workExperience.length > 0 && (
          <section style={{ marginBottom: '24px' }}>
            <Sektion style={huvudrubrik}>Erfarenhet</Sektion>
            {data.workExperience.map((job) => (
              <div key={job.id} className="cv-entry" style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Post style={{ fontSize: '14px', fontWeight: 600, color: RUBRIK, margin: 0 }}>{job.title}</Post>
                  <span className="cv-datum" style={datum}>
                    {periodText(job.startDate, job.endDate, job.current)}
                  </span>
                </div>
                <p style={{ fontSize: '12.5px', color: BLA_TEXT, margin: '2px 0 0' }}>
                  {job.company}
                  {job.location && <span style={{ color: DAMPAD }}> · {job.location}</span>}
                </p>
                <Beskrivning text={job.description} style={{ fontSize: '12.5px', lineHeight: 1.6, color: TEXT, marginTop: '5px' }} />
              </div>
            ))}
          </section>
        )}

        {data.education.length > 0 && (
          <section style={{ marginBottom: '24px' }}>
            <Sektion style={huvudrubrik}>Utbildning</Sektion>
            {data.education.map((edu) => (
              <div key={edu.id} className="cv-entry" style={{ marginBottom: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Post style={{ fontSize: '13.5px', fontWeight: 600, color: RUBRIK, margin: 0 }}>{edu.degree || edu.school}</Post>
                  <span className="cv-datum" style={datum}>
                    {periodText(edu.startDate, edu.endDate, edu.current)}
                  </span>
                </div>
                <p style={{ fontSize: '12.5px', color: DAMPAD, margin: '2px 0 0' }}>
                  {[edu.degree ? edu.school : null, edu.field, edu.location].filter(Boolean).join(' · ')}
                </p>
                <Beskrivning text={edu.description} style={{ fontSize: '12.5px', lineHeight: 1.6, color: TEXT, marginTop: '4px' }} />
              </div>
            ))}
          </section>
        )}

        {data.certificates.length > 0 && (
          <section className="cv-keep">
            <Sektion style={huvudrubrik}>Certifikat</Sektion>
            {data.certificates.map((cert) => (
              <p key={cert.id} className="cv-entry" style={{ fontSize: '12.5px', color: RUBRIK, margin: '0 0 5px' }}>
                <span style={{ fontWeight: 500 }}>{cert.name}</span>
                {cert.issuer && <span style={{ color: DAMPAD }}> · {cert.issuer}</span>}
                {cert.date && <span className="cv-datum" style={{ color: DAMPAD }}> · {periodText(cert.date)}</span>}
              </p>
            ))}
          </section>
        )}
      </main>

      {/* Efter huvudtexten i dokumentet, till vänster på sidan — se huvudet.
          240 px och #F8FAFC måste stämma med SIDEBAR_CONFIG.nordic. */}
      <aside
        style={{
          order: -1,
          width: '240px',
          background: PANEL,
          padding: '38px 24px',
          borderRight: `1px solid ${KANT}`,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '22px',
        }}
      >
        <div className="cv-keep" style={{ display: 'flex', justifyContent: 'center' }}>
          {data.profileImage ? (
            <img
              src={data.profileImage}
              alt=""
              style={{ width: '136px', height: '136px', objectFit: 'cover', borderRadius: '18px' }}
            />
          ) : (
            <div
              aria-hidden="true"
              style={{
                width: '136px',
                height: '136px',
                background: '#FFFFFF',
                border: `1px solid ${KANT}`,
                borderRadius: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '38px', fontWeight: 300, color: DAMPAD, letterSpacing: '0.02em' }}>
                {getInitials(data.firstName, data.lastName)}
              </span>
            </div>
          )}
        </div>

        {harKontakt && (
          <section className="cv-keep">
            <Sektion style={panelrubrik}>Kontakt</Sektion>
            <ul className="cv-kontakt" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px', lineHeight: 1.4 }}>
              {data.email && (
                <li>
                  <a href={`mailto:${data.email}`} style={{ color: TEXT, textDecoration: 'none' }}>
                    {data.email}
                  </a>
                </li>
              )}
              {data.phone && <li style={{ color: TEXT }}>{data.phone}</li>}
              {data.location && <li style={{ color: TEXT }}>{data.location}</li>}
            </ul>
          </section>
        )}

        {data.links.length > 0 && (
          <section className="cv-keep">
            <Sektion style={panelrubrik}>Länkar</Sektion>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {data.links.map((link) => (
                <li key={link.id} className="cv-entry">
                  {link.label && <div style={{ fontSize: '11.5px', color: RUBRIK, fontWeight: 500 }}>{link.label}</div>}
                  <div className="cv-url" style={{ fontSize: '10.5px', color: DAMPAD, lineHeight: 1.4 }}>
                    <Url text={link.url} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.skills.length > 0 && (
          <section>
            <Sektion style={panelrubrik}>Kompetenser</Sektion>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {data.skills.map((skill, i) => (
                <li key={i} style={{ fontSize: '12px', color: TEXT, lineHeight: 1.35 }}>
                  {getSkillName(skill)}
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.languages.length > 0 && (
          <section className="cv-keep">
            <Sektion style={panelrubrik}>Språk</Sektion>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {data.languages.map((lang) => {
                const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                return (
                  <li key={lang.id} className="cv-entry">
                    <div style={{ fontSize: '12px', fontWeight: 500, color: RUBRIK }}>{name}</div>
                    <div style={{ fontSize: '10.5px', color: DAMPAD, marginTop: '1px' }}>{getLanguageLevelDisplay(lang.level)}</div>
                  </li>
                )
              })}
            </ul>
          </section>
        )}
      </aside>
    </div>
  )
}
