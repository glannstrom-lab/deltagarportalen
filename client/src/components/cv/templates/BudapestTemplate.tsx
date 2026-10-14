/**
 * Budapest (id `budapest`) — mörk skifferblå sidopanel med runt foto i en
 * orange ring, namnet i versaler och en tidslinje genom erfarenheten. Inter.
 *
 * Slipad 2026-10-11 (CVK1):
 * - Ort, datum och titel i #888 (3,54:1) → #5A6676.
 * - Profiltexten flyttad från den smala panelen till huvudspalten, där den
 *   läses först (och av ett rekryteringssystem i rätt ordning). Kompetenserna
 *   tog dess plats i panelen, så de två spalterna väger jämnare.
 * - Ett tunt CV ritade en ensam avdelarlinje i en annars tom panel; panelens
 *   avdelare kommer nu bara mellan sektioner som faktiskt finns.
 * - Rubriker skrevs med versaler i källtexten ("OM MIG"); nu vanlig text med
 *   `text-transform`, så den som kopierar texten får "Om mig".
 */

import { PostSektion } from './PostSektion'
import type { CSSProperties, ReactNode } from 'react'
import type { TemplateProps } from './types'
import { getLanguageLevelDisplay, getSkillName, getInitials } from './helpers'
import { periodText, rubrikTaggar } from './typografi'
import { Beskrivning } from './Beskrivning'
import { Url } from './Url'

const SKIFFER = '#2C3E50' // 11,0:1 på vitt
const ORANGE = '#E67E22' // bara ringen och tidslinjens punkt
const PANEL_TEXT = '#E8EDF2'
const PANEL_DAMPAD = '#BAC6D3' // 6,9:1 på skiffer
const TEXT = '#404B58'
const DAMPAD = '#5A6676' // 5,9:1 på vitt
const LINJE = '#E3E7EC'

const panelrubrik: CSSProperties = {
  fontSize: '10.5px',
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: '#FFFFFF',
  margin: '0 0 10px',
}

const huvudrubrik: CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: SKIFFER,
  margin: '0 0 16px',
  paddingBottom: '7px',
  borderBottom: `1px solid ${LINJE}`,
}

function Tidslinje({ sist }: { sist: boolean }) {
  return (
    <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '4px' }}>
      <div style={{ width: '9px', height: '9px', borderRadius: '50%', border: `2px solid ${SKIFFER}`, background: '#FFFFFF' }} />
      {!sist && <div style={{ width: '1px', flex: 1, background: '#CBD3DC', marginTop: '4px' }} />}
    </div>
  )
}

export function BudapestTemplate({ data, fullName, rubrikniva }: TemplateProps) {
  const { Namn, Sektion, Post } = rubrikTaggar(rubrikniva)

  // Panelens sektioner — avdelare bara MELLAN sådana som finns.
  const panel: { nyckel: string; innehall: ReactNode }[] = []
  if (data.skills.length > 0) {
    panel.push({
      nyckel: 'kompetenser',
      innehall: (
        <section>
          <Sektion style={panelrubrik}>Kompetenser</Sektion>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {data.skills.map((skill, i) => (
              <li key={i} style={{ fontSize: '12px', color: PANEL_TEXT, lineHeight: 1.35 }}>
                {getSkillName(skill)}
              </li>
            ))}
          </ul>
        </section>
      ),
    })
  }
  if (data.languages.length > 0) {
    panel.push({
      nyckel: 'sprak',
      innehall: (
        <section className="cv-keep">
          <Sektion style={panelrubrik}>Språk</Sektion>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {data.languages.map((lang) => {
              const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
              return (
                <li key={lang.id} style={{ fontSize: '12px', color: '#FFFFFF', fontWeight: 600 }}>
                  {name}
                  <span style={{ color: PANEL_DAMPAD, fontWeight: 400 }}> – {getLanguageLevelDisplay(lang.level)}</span>
                </li>
              )
            })}
          </ul>
        </section>
      ),
    })
  }
  if (data.certificates.length > 0) {
    panel.push({
      nyckel: 'certifikat',
      innehall: (
        <section className="cv-keep">
          <Sektion style={panelrubrik}>Certifikat</Sektion>
          {data.certificates.map((cert) => (
            <div key={cert.id} className="cv-entry" style={{ marginBottom: '7px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF' }}>{cert.name}</div>
              {(cert.issuer || cert.date) && (
                <div className="cv-datum" style={{ fontSize: '11px', color: PANEL_DAMPAD }}>
                  {[cert.issuer, periodText(cert.date)].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
          ))}
        </section>
      ),
    })
  }
  if (data.links.length > 0) {
    panel.push({
      nyckel: 'lankar',
      innehall: (
        <section className="cv-keep">
          <Sektion style={panelrubrik}>Länkar</Sektion>
          {data.links.map((link) => (
            <div key={link.id} className="cv-entry" style={{ marginBottom: '7px' }}>
              {link.label && <div style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF' }}>{link.label}</div>}
              <div className="cv-url" style={{ fontSize: '10.5px', color: PANEL_DAMPAD }}><Url text={link.url} /></div>
            </div>
          ))}
        </section>
      ),
    })
  }

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
      <main style={{ flex: 1, minWidth: 0, padding: '46px 48px 40px', background: '#FFFFFF' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', marginBottom: '30px' }}>
          <div style={{ minWidth: 0 }}>
            <Namn
              style={{
                fontSize: '32px',
                fontWeight: 800,
                letterSpacing: '0.01em',
                textTransform: 'uppercase',
                color: SKIFFER,
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
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: DAMPAD,
                  margin: '8px 0 0',
                }}
              >
                {data.title}
              </p>
            )}
          </div>
          {(data.email || data.phone || data.location) && (
            <ul
              className="cv-kontakt"
              style={{ listStyle: 'none', margin: '4px 0 0', padding: 0, textAlign: 'right', fontSize: '11.5px', color: TEXT, lineHeight: 1.6, flexShrink: 0, maxWidth: '45%' }}
            >
              {data.phone && <li>{data.phone}</li>}
              {data.email && <li>{data.email}</li>}
              {data.location && <li>{data.location}</li>}
            </ul>
          )}
        </header>

        {data.summary && (
          <section style={{ marginBottom: '28px' }}>
            <Sektion style={huvudrubrik}>Om mig</Sektion>
            <p style={{ fontSize: '12.5px', lineHeight: 1.65, color: TEXT, margin: 0 }}>{data.summary}</p>
          </section>
        )}

        {data.workExperience.length > 0 && (
          <PostSektion style={{ marginBottom: '28px' }} rubrik={<Sektion style={huvudrubrik}>Arbetslivserfarenhet</Sektion>}>
            {data.workExperience.map((job, i) => (
              <div key={job.id} className="cv-entry">
                <div style={{ display: 'grid', gridTemplateColumns: '122px 18px 1fr', gap: '10px' }}>
                  <div style={{ paddingBottom: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: SKIFFER, lineHeight: 1.35 }}>{job.company}</div>
                    {job.location && <div style={{ fontSize: '11px', color: DAMPAD }}>{job.location}</div>}
                    <div className="cv-datum" style={{ fontSize: '11px', color: DAMPAD, marginTop: '2px' }}>
                      {periodText(job.startDate, job.endDate, job.current)}
                    </div>
                  </div>
                  <Tidslinje sist={i === data.workExperience.length - 1} />
                  <div style={{ minWidth: 0, paddingBottom: '16px' }}>
                    <Post style={{ fontSize: '13.5px', fontWeight: 700, color: SKIFFER, margin: 0 }}>{job.title}</Post>
                    <Beskrivning text={job.description} style={{ fontSize: '12px', lineHeight: 1.6, color: TEXT, marginTop: '4px' }} />
                  </div>
                </div>
              </div>
            ))}
          </PostSektion>
        )}

        {data.education.length > 0 && (
          <PostSektion style={{ marginBottom: '28px' }} rubrik={<Sektion style={huvudrubrik}>Utbildning</Sektion>}>
            {data.education.map((edu, i) => (
              <div key={edu.id} className="cv-entry">
                <div style={{ display: 'grid', gridTemplateColumns: '122px 18px 1fr', gap: '10px' }}>
                  <div style={{ paddingBottom: '14px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: SKIFFER, lineHeight: 1.35 }}>{edu.school}</div>
                    {edu.location && <div style={{ fontSize: '11px', color: DAMPAD }}>{edu.location}</div>}
                    <div className="cv-datum" style={{ fontSize: '11px', color: DAMPAD, marginTop: '2px' }}>
                      {periodText(edu.startDate, edu.endDate, edu.current)}
                    </div>
                  </div>
                  <Tidslinje sist={i === data.education.length - 1} />
                  <div style={{ minWidth: 0, paddingBottom: '14px' }}>
                    <Post style={{ fontSize: '13.5px', fontWeight: 700, color: SKIFFER, margin: 0 }}>{edu.degree || edu.school}</Post>
                    {edu.field && <p style={{ fontSize: '12px', color: TEXT, margin: '2px 0 0' }}>{edu.field}</p>}
                    <Beskrivning text={edu.description} style={{ fontSize: '12px', lineHeight: 1.6, color: TEXT, marginTop: '4px' }} />
                  </div>
                </div>
              </div>
            ))}
          </PostSektion>
        )}
      </main>

      {/* Efter huvudtexten i dokumentet, till vänster på sidan (order: -1).
          34 % och #2C3E50 måste stämma med SIDEBAR_CONFIG.budapest. */}
      <aside
        style={{
          order: -1,
          width: '34%',
          flexShrink: 0,
          background: SKIFFER,
          color: PANEL_TEXT,
          padding: '46px 30px 40px',
        }}
      >
        <div className="cv-keep" style={{ display: 'flex', justifyContent: 'center', marginBottom: panel.length ? '34px' : 0 }}>
          {data.profileImage ? (
            <img
              src={data.profileImage}
              alt=""
              style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '50%', border: `4px solid ${ORANGE}` }}
            />
          ) : (
            <div
              aria-hidden="true"
              style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                border: `4px solid ${ORANGE}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '46px',
                fontWeight: 300,
                color: '#D5DDE5',
                letterSpacing: '0.02em',
              }}
            >
              {getInitials(data.firstName, data.lastName)}
            </div>
          )}
        </div>
        {panel.map((p, i) => (
          <div key={p.nyckel}>
            {i > 0 && <div aria-hidden="true" style={{ height: '1px', background: '#41546A', margin: '18px 0' }} />}
            {p.innehall}
          </div>
        ))}
      </aside>
    </div>
  )
}
