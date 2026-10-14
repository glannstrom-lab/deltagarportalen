/**
 * Modern (id `sidebar`, i väljaren "Sidokolumn") — mörk sidopanel, indigo
 * accent, Inter. Standardmallen: den som är förvald och den som okända id
 * faller på.
 *
 * Slipad 2026-10-11 (CVK1):
 * - Panelen är solid #141414 i stället för en gradient. I PDF:en målas den
 *   som canvas-bakgrund i #141414 (SIDEBAR_CONFIG), så gradienten syntes bara
 *   i förhandsvisningen — nu ser de två likadana ut.
 * - Indigo #6366F1 på vitt är 4,46:1 och på svart ~4:1. Text i accentfärg är
 *   nu #4F46E5 på vitt och #A5B4FC på svart; den mättade tonen bär bara ikoner.
 * - Rubrikerna "Erfarenhet"/"Utbildning" i #999 (2,84:1) → #5F5F5F.
 * - Datumen står i en egen kolumn som "dec 2025 / – nu", tabulära siffror.
 */

import { PostSektion } from './PostSektion'
import type { CSSProperties } from 'react'
import { Mail, Phone, MapPin } from '@/components/ui/icons'
import type { TemplateProps } from './types'
import { getLanguageLevelDisplay, getSkillName, getInitials } from './helpers'
import { periodDelar, periodText, rubrikTaggar } from './typografi'
import { Beskrivning } from './Beskrivning'
import { Url } from './Url'

const PANEL = '#141414'
const INDIGO = '#6366F1' // ikoner och linjer
const INDIGO_TEXT = '#4F46E5' // 6,3:1 på vitt
const INDIGO_LJUS = '#A5B4FC' // 9,5:1 på panelen
const PANEL_TEXT = '#E6E6E6'
const PANEL_DAMPAD = '#A3A3A3' // 7,3:1 på panelen
const SVART = '#0F0F0F'
const TEXT = '#3A3A3A'
const DAMPAD = '#5F5F5F' // 6,4:1 på vitt

const panelrubrik: CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: INDIGO_LJUS,
  margin: '0 0 12px',
}

const huvudrubrik: CSSProperties = {
  fontSize: '10.5px',
  fontWeight: 600,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: DAMPAD,
  margin: '0 0 12px',
  paddingBottom: '6px',
  borderBottom: '1px solid #ECECEC',
}

const datumkolumn: CSSProperties = {
  fontSize: '11px',
  color: DAMPAD,
  lineHeight: 1.45,
  paddingTop: '2px',
}

const ikon: CSSProperties = { width: '13px', height: '13px', color: INDIGO_LJUS, flexShrink: 0, marginTop: '1px' }

export function ModernTemplate({ data, fullName, rubrikniva }: TemplateProps) {
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
      }}
    >

      <main style={{ flex: 1, minWidth: 0, padding: '38px 40px 36px', background: '#FFFFFF' }}>
        <header style={{ marginBottom: '22px' }}>
          <Namn
            style={{
              fontSize: '36px',
              fontWeight: 700,
              letterSpacing: '-0.022em',
              color: SVART,
              lineHeight: 1.08,
              margin: 0,
            }}
          >
            {fullName}
          </Namn>
          {data.title && (
            <p style={{ fontSize: '15.5px', color: INDIGO_TEXT, fontWeight: 500, margin: '6px 0 0' }}>{data.title}</p>
          )}
          <div aria-hidden="true" style={{ width: '36px', height: '3px', background: INDIGO, borderRadius: '2px', marginTop: '14px' }} />
        </header>

        {data.summary && (
          <section style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: TEXT, margin: 0 }}>{data.summary}</p>
          </section>
        )}

        {data.workExperience.length > 0 && (
          <PostSektion style={{ marginBottom: '24px' }} rubrik={<Sektion style={huvudrubrik}>Erfarenhet</Sektion>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {data.workExperience.map((job) => {
                const p = periodDelar(job.startDate, job.endDate, job.current)
                return (
                  <div key={job.id} className="cv-entry" style={{ display: 'grid', gridTemplateColumns: '78px 1fr', gap: '16px' }}>
                    <div className="cv-datum" style={datumkolumn}>
                      {p.fran}
                      {p.till && (
                        <>
                          <br />– {p.till}
                        </>
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <Post style={{ fontSize: '14px', fontWeight: 600, color: SVART, margin: 0 }}>{job.title}</Post>
                      <p style={{ fontSize: '12.5px', margin: '2px 0 0', color: INDIGO_TEXT }}>
                        {job.company}
                        {job.location && <span style={{ color: DAMPAD }}> · {job.location}</span>}
                      </p>
                      <Beskrivning
                        text={job.description}
                        style={{ fontSize: '12.5px', lineHeight: 1.55, color: TEXT, marginTop: '5px' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </PostSektion>
        )}

        {data.education.length > 0 && (
          <PostSektion style={{ marginBottom: '24px' }} rubrik={<Sektion style={huvudrubrik}>Utbildning</Sektion>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
              {data.education.map((edu) => {
                const p = periodDelar(edu.startDate, edu.endDate, edu.current)
                return (
                  <div key={edu.id} className="cv-entry" style={{ display: 'grid', gridTemplateColumns: '78px 1fr', gap: '16px' }}>
                    <div className="cv-datum" style={datumkolumn}>
                      {p.fran}
                      {p.till && (
                        <>
                          <br />– {p.till}
                        </>
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <Post style={{ fontSize: '13.5px', fontWeight: 600, color: SVART, margin: 0 }}>{edu.degree || edu.school}</Post>
                      <p style={{ fontSize: '12.5px', margin: '2px 0 0', color: DAMPAD }}>
                        {[edu.degree ? edu.school : null, edu.field, edu.location].filter(Boolean).join(' · ')}
                      </p>
                      <Beskrivning
                        text={edu.description}
                        style={{ fontSize: '12.5px', lineHeight: 1.55, color: TEXT, marginTop: '4px' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </PostSektion>
        )}

        {data.certificates.length > 0 && (
          <section className="cv-keep">
            <Sektion style={huvudrubrik}>Certifikat</Sektion>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {data.certificates.map((cert) => (
                <p key={cert.id} className="cv-entry" style={{ fontSize: '12.5px', color: SVART, margin: 0 }}>
                  <span style={{ fontWeight: 500 }}>{cert.name}</span>
                  {cert.issuer && <span style={{ color: DAMPAD }}> · {cert.issuer}</span>}
                  {cert.date && <span className="cv-datum" style={{ color: DAMPAD }}> · {periodText(cert.date)}</span>}
                </p>
              ))}
            </div>
          </section>
        )}
      </main>
      {/* Panelen står EFTER huvudtexten i dokumentet men till vänster på sidan
          (order: -1). Läsordningen — för en skärmläsare, för den som kopierar
          texten och för ett rekryteringssystem — blir då namn, erfarenhet,
          utbildning, och sist kontakt och kompetenser, i stället för att
          dokumentet börjar med ordet "Kontakt".
          240 px ≈ 30 % av A4 — måste vara samma som SIDEBAR_CONFIG.sidebar. */}
      <aside
        style={{
          order: -1,
          width: '240px',
          background: PANEL,
          color: PANEL_TEXT,
          padding: '40px 26px',
          display: 'flex',
          flexDirection: 'column',
          gap: '26px',
          flexShrink: 0,
        }}
      >
        <div className="cv-keep" style={{ display: 'flex', justifyContent: 'center' }}>
          {data.profileImage ? (
            <img
              src={data.profileImage}
              alt=""
              style={{ width: '148px', height: '148px', objectFit: 'cover', borderRadius: '12px' }}
            />
          ) : (
            <div
              aria-hidden="true"
              style={{
                width: '148px',
                height: '148px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #2E2E2E',
              }}
            >
              <span style={{ fontSize: '42px', fontWeight: 300, color: '#8A8A8A', letterSpacing: '0.02em' }}>
                {getInitials(data.firstName, data.lastName)}
              </span>
            </div>
          )}
        </div>

        {harKontakt && (
          <section className="cv-keep">
            <Sektion style={panelrubrik}>Kontakt</Sektion>
            <ul className="cv-kontakt" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '9px' }}>
              {data.email && (
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', fontSize: '11.5px', lineHeight: 1.4 }}>
                  <Mail aria-hidden="true" style={ikon} />
                  <span>{data.email}</span>
                </li>
              )}
              {data.phone && (
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', fontSize: '11.5px', lineHeight: 1.4 }}>
                  <Phone aria-hidden="true" style={ikon} />
                  <span>{data.phone}</span>
                </li>
              )}
              {data.location && (
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', fontSize: '11.5px', lineHeight: 1.4 }}>
                  <MapPin aria-hidden="true" style={ikon} />
                  <span>{data.location}</span>
                </li>
              )}
            </ul>
          </section>
        )}

        {data.skills.length > 0 && (
          <section>
            <Sektion style={panelrubrik}>Kompetenser</Sektion>
            <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', listStyle: 'none', margin: 0, padding: 0 }}>
              {data.skills.map((skill, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: '11px',
                    padding: '3px 9px',
                    borderRadius: '4px',
                    color: '#FFFFFF',
                    border: '1px solid #3B3D6B',
                    background: '#1E1F33',
                  }}
                >
                  {getSkillName(skill)}
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.links.length > 0 && (
          <section className="cv-keep">
            <Sektion style={panelrubrik}>Länkar</Sektion>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.links.map((link) => (
                <li key={link.id} className="cv-entry">
                  {link.label && <div style={{ fontSize: '11.5px', fontWeight: 500, color: '#FFFFFF' }}>{link.label}</div>}
                  <div className="cv-url" style={{ fontSize: '10.5px', color: PANEL_DAMPAD, lineHeight: 1.4 }}>
                    <Url text={link.url} />
                  </div>
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
                    <div style={{ fontSize: '12px', fontWeight: 500, color: '#FFFFFF' }}>{name}</div>
                    <div style={{ fontSize: '10.5px', color: PANEL_DAMPAD, marginTop: '1px' }}>
                      {getLanguageLevelDisplay(lang.level)}
                    </div>
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
