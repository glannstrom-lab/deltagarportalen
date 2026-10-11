/**
 * Berlin (id `berlin`) — Bauhaus-inspirerad tidningslayout. Sandfärgad sida,
 * svart bläck, rödorange accent, versala tunga rubriker med romerska
 * sektionsnummer, en smal svart list till vänster. Inter.
 *
 * Den smala listen (60 px) är ren dekor — initialer och en roterad etikett —
 * och hela `<aside>` är `aria-hidden`. Uppgifterna står i huvudspalten
 * (registret kallar spaltformen `dekorativ-spalt`).
 *
 * Slipad 2026-10-11 (CVK1):
 * - Sidan var sandfärgad i förhandsvisningen men VIT i PDF:en: print-vägen
 *   målar sidan från SIDEBAR_CONFIG, som bara kände till listens färg. Nu
 *   bär konfigurationen även huvudytans färg (`main`).
 * - "◼" före titeln var ett tecken i texten som Inter saknar; nu en ritad ruta.
 * - Datum i tre rader ("2025-12 / — / NU") → två rader med tabulära siffror.
 * - Språkrubriken var portalens UI-språk; nu svenska som resten.
 */

import type { CSSProperties } from 'react'
import type { TemplateProps } from './types'
import { getLanguageLevelDisplay, getSkillName, getInitials } from './helpers'
import { periodDelar, periodText, rubrikTaggar } from './typografi'
import { Beskrivning } from './Beskrivning'
import { Url } from './Url'

const SAND = '#F4EDE0'
const BLACK = '#1A1A1A'
const ROD = '#B8322A' // 5,3:1 på sand
const TEXT = '#333333'
const DAMPAD = '#555049' // 6,9:1 på sand
const ROMERSKA = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']

const datumkolumn: CSSProperties = {
  fontSize: '10.5px',
  fontWeight: 700,
  color: ROD,
  letterSpacing: '0.04em',
  paddingTop: '2px',
  lineHeight: 1.4,
}

const post: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '78px 1fr',
  gap: '14px',
  marginBottom: '9px',
  paddingBottom: '9px',
  borderBottom: '1px solid #D6CCBA',
}

function Rubrik({ tagg: Tagg, nr, children }: { tagg: 'h1' | 'h2' | 'h3' | 'h4'; nr: string; children: string }) {
  return (
    <Tagg
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '12px',
        margin: '0 0 10px',
        paddingBottom: '5px',
        borderBottom: `2px solid ${BLACK}`,
        fontSize: '13px',
        fontWeight: 800,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: BLACK,
      }}
    >
      <span style={{ fontSize: '10px', fontWeight: 800, color: ROD, minWidth: '18px', letterSpacing: '0.02em' }}>{nr}</span>
      {children}
    </Tagg>
  )
}

export function BerlinTemplate({ data, fullName, rubrikniva }: TemplateProps) {
  const { Namn, Sektion, Post } = rubrikTaggar(rubrikniva)
  // Sektionerna numreras i den ordning de faktiskt ritas — en saknad
  // sektion lämnar ingen lucka i numreringen.
  let sektionsnummer = 0
  const nasta = () => ROMERSKA[sektionsnummer++] || ''

  const kontakt = [data.email, data.phone, data.location].filter(Boolean) as string[]

  return (
    <div
      className="cv-preview"
      lang="sv"
      style={{
        display: 'flex',
        minHeight: '297mm',
        background: SAND,
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        color: TEXT,
      }}
    >
      <main style={{ flex: 1, minWidth: 0, padding: '30px 42px 32px 38px' }}>
        <header style={{ marginBottom: '20px' }}>
          <p
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: ROD,
              margin: '0 0 8px',
            }}
          >
            <span aria-hidden="true" style={{ width: '8px', height: '8px', background: ROD, flexShrink: 0 }} />
            {data.title || 'Curriculum vitae'}
          </p>
          <Namn
            style={{
              fontSize: fullName.length > 22 ? '30px' : '38px',
              fontWeight: 800,
              color: BLACK,
              letterSpacing: '-0.025em',
              lineHeight: 0.98,
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            {fullName}
          </Namn>
          {kontakt.length > 0 && (
            <p
              className="cv-kontakt"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '3px 18px',
                fontSize: '11px',
                color: DAMPAD,
                borderTop: `1px solid ${BLACK}`,
                paddingTop: '8px',
                margin: '10px 0 0',
              }}
            >
              {kontakt.map((k) => (
                <span key={k}>{k}</span>
              ))}
            </p>
          )}
        </header>

        {data.summary && (
          <section style={{ marginBottom: '18px' }}>
            <Rubrik tagg={Sektion} nr={nasta()}>Profil</Rubrik>
            <p style={{ fontSize: '12.5px', lineHeight: 1.55, color: BLACK, margin: 0 }}>{data.summary}</p>
          </section>
        )}

        {data.workExperience.length > 0 && (
          <section style={{ marginBottom: '16px' }}>
            <Rubrik tagg={Sektion} nr={nasta()}>Erfarenhet</Rubrik>
            {data.workExperience.map((job) => {
              const p = periodDelar(job.startDate, job.endDate, job.current)
              return (
                <div key={job.id} className="cv-entry" style={post}>
                  <div className="cv-datum" style={datumkolumn}>
                    {p.fran}
                    {p.till && (
                      <>
                        <br />– {p.till}
                      </>
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <Post style={{ fontSize: '14px', fontWeight: 800, color: BLACK, letterSpacing: '-0.01em', margin: 0 }}>{job.title}</Post>
                    <p style={{ fontSize: '10.5px', fontWeight: 600, color: DAMPAD, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '2px 0 0' }}>
                      {[job.company, job.location].filter(Boolean).join(' · ')}
                    </p>
                    <Beskrivning text={job.description} style={{ fontSize: '12px', lineHeight: 1.55, color: TEXT, marginTop: '4px' }} />
                  </div>
                </div>
              )
            })}
          </section>
        )}

        {data.education.length > 0 && (
          <section style={{ marginBottom: '16px' }}>
            <Rubrik tagg={Sektion} nr={nasta()}>Utbildning</Rubrik>
            {data.education.map((edu) => {
              const p = periodDelar(edu.startDate, edu.endDate, edu.current)
              return (
                <div key={edu.id} className="cv-entry" style={post}>
                  <div className="cv-datum" style={datumkolumn}>
                    {p.fran}
                    {p.till && (
                      <>
                        <br />– {p.till}
                      </>
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <Post style={{ fontSize: '13.5px', fontWeight: 800, color: BLACK, letterSpacing: '-0.01em', margin: 0 }}>{edu.degree || edu.school}</Post>
                    {edu.degree && edu.school && (
                      <p style={{ fontSize: '10.5px', fontWeight: 600, color: DAMPAD, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '2px 0 0' }}>
                        {edu.school}
                      </p>
                    )}
                    {(edu.field || edu.location) && (
                      <p style={{ fontSize: '11.5px', color: DAMPAD, margin: '2px 0 0' }}>{[edu.field, edu.location].filter(Boolean).join(' · ')}</p>
                    )}
                    <Beskrivning text={edu.description} style={{ fontSize: '12px', lineHeight: 1.55, color: TEXT, marginTop: '4px' }} />
                  </div>
                </div>
              )
            })}
          </section>
        )}

        {data.skills.length > 0 && (
          <section className="cv-keep" style={{ marginBottom: '16px' }}>
            <Rubrik tagg={Sektion} nr={nasta()}>Kompetenser</Rubrik>
            <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', listStyle: 'none', margin: 0, padding: 0 }}>
              {data.skills.map((skill, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    color: BLACK,
                    border: `1px solid ${BLACK}`,
                    padding: '3px 9px',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  {getSkillName(skill)}
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.languages.length > 0 && (
          <section className="cv-keep" style={{ marginBottom: '16px' }}>
            <Rubrik tagg={Sektion} nr={nasta()}>Språk</Rubrik>
            <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 36px', listStyle: 'none', margin: 0, padding: 0 }}>
              {data.languages.map((lang) => {
                const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                return (
                  <li key={lang.id}>
                    <div style={{ fontSize: '12.5px', fontWeight: 800, color: BLACK }}>{name}</div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: ROD, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {getLanguageLevelDisplay(lang.level)}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {(data.certificates.length > 0 || data.links.length > 0) && (
          <div
            className="cv-keep"
            style={{
              display: 'grid',
              gridTemplateColumns: data.certificates.length && data.links.length ? '1fr 1fr' : '1fr',
              gap: '24px',
            }}
          >
            {data.certificates.length > 0 && (
              <section>
                <Rubrik tagg={Sektion} nr={nasta()}>Certifikat</Rubrik>
                {data.certificates.map((cert) => (
                  <div key={cert.id} className="cv-entry" style={{ marginBottom: '6px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: BLACK }}>{cert.name}</div>
                    {(cert.issuer || cert.date) && (
                      <div className="cv-datum" style={{ fontSize: '10.5px', color: DAMPAD, letterSpacing: '0.04em' }}>
                        {[cert.issuer, periodText(cert.date)].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>
                ))}
              </section>
            )}
            {data.links.length > 0 && (
              <section>
                <Rubrik tagg={Sektion} nr={nasta()}>Länkar</Rubrik>
                {data.links.map((link) => (
                  <p key={link.id} className="cv-entry" style={{ fontSize: '11.5px', color: BLACK, margin: '0 0 4px' }}>
                    {link.label && <span style={{ fontWeight: 700 }}>{link.label} </span>}
                    <span className="cv-url" style={{ color: ROD }}><Url text={link.url} /></span>
                  </p>
                ))}
              </section>
            )}
          </div>
        )}
      </main>

      {/* Dekor: initialer och roterad etikett. Efter huvudtexten i dokumentet
          men till vänster på sidan (order: -1), och dold för hjälpmedel —
          namnet står redan i rubriken. 60 px och #1A1A1A måste stämma med
          SIDEBAR_CONFIG.berlin. */}
      <aside
        aria-hidden="true"
        style={{
          order: -1,
          width: '60px',
          background: BLACK,
          color: SAND,
          padding: '30px 0',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            border: `1.5px solid ${SAND}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '0.04em',
            marginBottom: '30px',
          }}
        >
          {getInitials(data.firstName, data.lastName)}
        </div>
        <div
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            fontSize: '10px',
            letterSpacing: '0.5em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: SAND,
          }}
        >
          Curriculum vitae
        </div>
        <div style={{ width: '22px', height: '22px', background: ROD, marginTop: '30px' }} />
      </aside>
    </div>
  )
}
