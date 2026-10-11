/**
 * Manhattan (id `manhattan`) — mörk navy-sidopanel, kopparaccent, namn och
 * befattningar i Playfair Display, brödtext i Source Sans 3. Den bestämda,
 * "executive" systern till Atelier (som är krämvit och dämpad).
 *
 * Slipad 2026-10-11 (CVK1):
 * - Koppar #B07A4C som textfärg på vitt är 3,4:1 → #8A5A2E (5,6:1). Den ljusa
 *   kopparn ligger kvar som linjer, och som text bara på navy där den klarar
 *   8:1.
 * - Panelen står efter huvudtexten i dokumentet (order: -1), så läsordningen
 *   börjar med namnet i stället för "Kontakt".
 * - Datumen i versaler med spärr var svåra att läsa ("2025-12 — NUVARANDE");
 *   nu "dec 2025 – nuvarande" i gemener med tabulära siffror.
 */

import type { CSSProperties } from 'react'
import type { TemplateProps } from './types'
import { getLanguageLevelDisplay, getSkillName, getInitials } from './helpers'
import { periodText, rubrikTaggar } from './typografi'
import { Beskrivning } from './Beskrivning'
import { Url } from './Url'

const NAVY = '#0F1B2D'
const KOPPAR = '#B07A4C' // linjer
const KOPPAR_TEXT = '#8A5A2E' // 5,6:1 på vitt
const KOPPAR_LJUS = '#D4A574' // 8,3:1 på navy
const PANEL_TEXT = '#E6EBF2'
const PANEL_DAMPAD = '#B4C0D0' // 9,0:1 på navy
const BLACK = '#1A1A1A'
const TEXT = '#3A3A3A'
const DAMPAD = '#5A5A5A' // 6,9:1
const PLAYFAIR = "'Playfair Display', Georgia, serif"

const panelrubrik: CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: KOPPAR_LJUS,
  margin: '0 0 12px',
  paddingBottom: '7px',
  borderBottom: '1px solid #2A3B55',
}

const huvudrubrik: CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: BLACK,
  margin: '0 0 12px',
}

const datum: CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.03em',
  color: KOPPAR_TEXT,
  whiteSpace: 'nowrap',
  marginLeft: '14px',
}

const post: CSSProperties = { paddingLeft: '13px', borderLeft: `2px solid ${KOPPAR}`, marginBottom: '13px' }

export function ManhattanTemplate({ data, fullName, rubrikniva }: TemplateProps) {
  const { Namn, Sektion, Post } = rubrikTaggar(rubrikniva)
  const harKontakt = !!(data.email || data.phone || data.location)

  return (
    <div
      className="cv-preview"
      lang="sv"
      style={{
        display: 'flex',
        minHeight: '297mm',
        background: '#FFFFFF',
        fontFamily: "'Source Sans 3', 'Helvetica Neue', Arial, sans-serif",
        color: TEXT,
      }}
    >
      <main style={{ flex: 1, minWidth: 0, padding: '42px 44px 40px', background: '#FFFFFF' }}>
        <header style={{ marginBottom: '22px', paddingBottom: '14px', borderBottom: `2px solid ${KOPPAR}` }}>
          <Namn
            style={{
              fontFamily: PLAYFAIR,
              fontSize: fullName.length > 22 ? '30px' : '36px',
              fontWeight: 700,
              letterSpacing: '-0.005em',
              color: NAVY,
              lineHeight: 1.08,
              margin: 0,
            }}
          >
            {fullName}
          </Namn>
          {data.title && (
            <p
              style={{
                fontSize: '11.5px',
                fontWeight: 600,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: KOPPAR_TEXT,
                margin: '8px 0 0',
              }}
            >
              {data.title}
            </p>
          )}
        </header>

        {data.summary && (
          <section style={{ marginBottom: '22px' }}>
            <Sektion style={huvudrubrik}>Profil</Sektion>
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: TEXT, margin: 0 }}>{data.summary}</p>
          </section>
        )}

        {data.workExperience.length > 0 && (
          <section style={{ marginBottom: '22px' }}>
            <Sektion style={huvudrubrik}>Erfarenhet</Sektion>
            {data.workExperience.map((job) => (
              <div key={job.id} className="cv-entry" style={post}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Post style={{ fontFamily: PLAYFAIR, fontSize: '15px', fontWeight: 600, color: NAVY, margin: 0 }}>{job.title}</Post>
                  <span className="cv-datum" style={datum}>
                    {periodText(job.startDate, job.endDate, job.current, 'nuvarande')}
                  </span>
                </div>
                <p style={{ fontSize: '12.5px', fontStyle: 'italic', color: DAMPAD, margin: '2px 0 0' }}>
                  {[job.company, job.location].filter(Boolean).join(' · ')}
                </p>
                <Beskrivning text={job.description} style={{ fontSize: '12.5px', lineHeight: 1.55, color: TEXT, marginTop: '4px' }} />
              </div>
            ))}
          </section>
        )}

        {data.education.length > 0 && (
          <section style={{ marginBottom: '22px' }}>
            <Sektion style={huvudrubrik}>Utbildning</Sektion>
            {data.education.map((edu) => (
              <div key={edu.id} className="cv-entry" style={post}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Post style={{ fontFamily: PLAYFAIR, fontSize: '14.5px', fontWeight: 600, color: NAVY, margin: 0 }}>{edu.degree || edu.school}</Post>
                  <span className="cv-datum" style={datum}>
                    {periodText(edu.startDate, edu.endDate, edu.current, 'nuvarande')}
                  </span>
                </div>
                <p style={{ fontSize: '12.5px', fontStyle: 'italic', color: DAMPAD, margin: '2px 0 0' }}>
                  {[edu.degree ? edu.school : null, edu.field, edu.location].filter(Boolean).join(' · ')}
                </p>
                <Beskrivning text={edu.description} style={{ fontSize: '12.5px', lineHeight: 1.55, color: TEXT, marginTop: '4px' }} />
              </div>
            ))}
          </section>
        )}
      </main>

      {/* Efter huvudtexten i dokumentet, till vänster på sidan (order: -1).
          220 px och #0F1B2D måste stämma med SIDEBAR_CONFIG.manhattan. */}
      <aside
        style={{
          order: -1,
          width: '220px',
          background: NAVY,
          color: PANEL_TEXT,
          padding: '42px 26px 40px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '26px',
        }}
      >
        <div className="cv-keep" style={{ display: 'flex', justifyContent: 'center' }}>
          {data.profileImage ? (
            <img
              src={data.profileImage}
              alt=""
              style={{ width: '136px', height: '136px', objectFit: 'cover', borderRadius: '50%', border: `2px solid ${KOPPAR}` }}
            />
          ) : (
            <div
              aria-hidden="true"
              style={{
                width: '136px',
                height: '136px',
                borderRadius: '50%',
                border: `2px solid ${KOPPAR}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: PLAYFAIR,
                fontSize: '40px',
                color: KOPPAR_LJUS,
              }}
            >
              {getInitials(data.firstName, data.lastName)}
            </div>
          )}
        </div>

        {harKontakt && (
          <section className="cv-keep">
            <Sektion style={panelrubrik}>Kontakt</Sektion>
            <ul className="cv-kontakt" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '11.5px', lineHeight: 1.4, color: PANEL_TEXT }}>
              {data.email && <li>{data.email}</li>}
              {data.phone && <li>{data.phone}</li>}
              {data.location && <li>{data.location}</li>}
            </ul>
          </section>
        )}

        {data.skills.length > 0 && (
          <section>
            <Sektion style={panelrubrik}>Kompetenser</Sektion>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px', color: PANEL_TEXT }}>
              {data.skills.map((skill, i) => (
                <li key={i}>{getSkillName(skill)}</li>
              ))}
            </ul>
          </section>
        )}

        {data.languages.length > 0 && (
          <section className="cv-keep">
            <Sektion style={panelrubrik}>Språk</Sektion>
            {data.languages.map((lang) => {
              const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
              return (
                <div key={lang.id} className="cv-entry" style={{ marginBottom: '7px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF' }}>{name}</div>
                  <div style={{ fontSize: '11px', fontStyle: 'italic', color: KOPPAR_LJUS }}>{getLanguageLevelDisplay(lang.level)}</div>
                </div>
              )
            })}
          </section>
        )}

        {data.certificates.length > 0 && (
          <section className="cv-keep">
            <Sektion style={panelrubrik}>Certifikat</Sektion>
            {data.certificates.map((cert) => (
              <div key={cert.id} className="cv-entry" style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF' }}>{cert.name}</div>
                {(cert.issuer || cert.date) && (
                  <div className="cv-datum" style={{ fontSize: '11px', color: PANEL_DAMPAD }}>
                    {[cert.issuer, periodText(cert.date)].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {data.links.length > 0 && (
          <section className="cv-keep">
            <Sektion style={panelrubrik}>Länkar</Sektion>
            {data.links.map((link) => (
              <div key={link.id} className="cv-entry" style={{ marginBottom: '8px' }}>
                {link.label && <div style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF' }}>{link.label}</div>}
                <div className="cv-url" style={{ fontSize: '11px', color: KOPPAR_LJUS }}><Url text={link.url} /></div>
              </div>
            ))}
          </section>
        )}
      </aside>
    </div>
  )
}
