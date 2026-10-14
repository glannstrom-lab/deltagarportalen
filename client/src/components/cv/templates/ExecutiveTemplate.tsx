/**
 * Executive — klassisk elegans. En spalt, serif (Source Serif 4), guldlinjer.
 *
 * Linjär 1-kolumns layout (Harvard/Yale-stilen). 2-kolumnsversionen
 * splittade poster över sidbrott så Erfarenhet kunde hamna i en smal kolumn
 * på sida 2 — ful effekt utan något att vinna.
 *
 * Slipad 2026-10-11 (CVK1):
 * - Typsnittet var `Georgia`, som inte finns i Linux-Chromium där PDF:en
 *   renderas — PDF:en sattes i ett okänt reservtypsnitt. Nu Source Serif 4,
 *   laddat av mallen (cvTypsnitt.ts), med riktig kursiv och tabulära siffror.
 * - Guldet (#B8860B, 3,2:1) bär bara linjer nu; text i guld är en mörkare
 *   brons som klarar 4,5:1.
 * - Anfangen är borta: den delade första ordet i två ("A rbetskonsulent")
 *   för den som kopierar texten, och för ett rekryteringssystem.
 * - Rubrikerna var blandat svenska och portalens UI-språk (t('cv.languages'));
 *   nu svenska rakt igenom, som dokumentets språk.
 */

import { PostSektion } from './PostSektion'
import type { CSSProperties } from 'react'
import type { TemplateProps } from './types'
import { getLanguageLevelDisplay, getSkillName } from './helpers'
import { periodText, rubrikTaggar } from './typografi'
import { Beskrivning } from './Beskrivning'
import { Url } from './Url'

const GULD = '#B8860B' // bara linjer och ramar
const GULDLJUS = '#E8D9B0'
const BRONS = '#7A5A12' // guldets textversion, 6,4:1 på #FDFCFA
const BLACK = '#1A1A1A'
const TEXT = '#333333'
const DAMPAD = '#5E5A52' // 6,6:1

const sektionsrubrik: CSSProperties = {
  fontSize: '11.5px',
  fontWeight: 600,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: BRONS,
  margin: '0 0 11px',
  paddingBottom: '5px',
  borderBottom: `1px solid ${GULDLJUS}`,
}

const sektion: CSSProperties = { marginBottom: '20px' }

const datum: CSSProperties = {
  fontSize: '11.5px',
  fontStyle: 'italic',
  color: DAMPAD,
  whiteSpace: 'nowrap',
  marginLeft: '16px',
}

export function ExecutiveTemplate({ data, fullName, rubrikniva }: TemplateProps) {
  const { Namn, Sektion, Post } = rubrikTaggar(rubrikniva)
  const kontakt = [data.email, data.phone, data.location].filter(Boolean) as string[]

  return (
    <div
      className="cv-preview"
      lang="sv"
      style={{
        minHeight: '297mm',
        background: '#FDFCFA',
        fontFamily: "'Source Serif 4', Georgia, 'Times New Roman', serif",
        color: TEXT,
      }}
    >
      <header
        className="cv-keep"
        style={{
          padding: '36px 60px 22px',
          borderBottom: `2px solid ${GULD}`,
          background: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {data.profileImage && (
            <img
              src={data.profileImage}
              alt=""
              style={{
                width: '86px',
                height: '86px',
                objectFit: 'cover',
                borderRadius: '3px',
                border: `2px solid ${GULD}`,
                flexShrink: 0,
              }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Namn
              style={{
                fontSize: '34px',
                fontWeight: 400,
                letterSpacing: '0.005em',
                color: BLACK,
                margin: 0,
                lineHeight: 1.08,
              }}
            >
              {fullName}
            </Namn>
            {data.title && (
              <p style={{ fontSize: '15px', fontStyle: 'italic', color: BRONS, margin: '5px 0 0' }}>{data.title}</p>
            )}
            {kontakt.length > 0 && (
              <p
                className="cv-kontakt"
                style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 18px', fontSize: '12px', color: DAMPAD, margin: '9px 0 0' }}
              >
                {kontakt.map((k) => (
                  <span key={k}>{k}</span>
                ))}
              </p>
            )}
          </div>
        </div>
      </header>

      <main style={{ padding: '26px 60px 36px' }}>
        {data.summary && (
          <section style={sektion}>
            <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: TEXT, margin: 0 }}>{data.summary}</p>
          </section>
        )}

        {data.workExperience.length > 0 && (
          <PostSektion style={sektion} rubrik={<Sektion style={sektionsrubrik}>Erfarenhet</Sektion>}>
            {data.workExperience.map((job) => (
              <div key={job.id} className="cv-entry" style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Post style={{ fontSize: '15px', fontWeight: 600, color: BLACK, margin: 0 }}>{job.title}</Post>
                  <span className="cv-datum" style={datum}>
                    {periodText(job.startDate, job.endDate, job.current, 'nuvarande')}
                  </span>
                </div>
                <p style={{ fontSize: '13px', margin: '1px 0 0', color: BRONS }}>
                  {job.company}
                  {job.location && <span style={{ color: DAMPAD }}> · {job.location}</span>}
                </p>
                <Beskrivning
                  text={job.description}
                  style={{ fontSize: '12.5px', lineHeight: 1.55, color: TEXT, marginTop: '4px' }}
                />
              </div>
            ))}
          </PostSektion>
        )}

        {data.education.length > 0 && (
          <PostSektion style={sektion} rubrik={<Sektion style={sektionsrubrik}>Utbildning</Sektion>}>
            {data.education.map((edu) => (
              <div key={edu.id} className="cv-entry" style={{ marginBottom: '9px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Post style={{ fontSize: '14px', fontWeight: 600, color: BLACK, margin: 0 }}>{edu.degree || edu.school}</Post>
                  <span className="cv-datum" style={datum}>
                    {periodText(edu.startDate, edu.endDate, edu.current, 'nuvarande')}
                  </span>
                </div>
                <p style={{ fontSize: '13px', margin: '1px 0 0', color: BRONS }}>
                  {edu.degree ? edu.school : null}
                  {edu.field && <span style={{ color: DAMPAD, fontStyle: 'italic' }}>{edu.degree ? ' · ' : ''}{edu.field}</span>}
                  {edu.location && <span style={{ color: DAMPAD }}> · {edu.location}</span>}
                </p>
                <Beskrivning
                  text={edu.description}
                  style={{ fontSize: '12.5px', lineHeight: 1.55, color: TEXT, marginTop: '3px' }}
                />
              </div>
            ))}
          </PostSektion>
        )}

        {data.skills.length > 0 && (
          <section className="cv-keep" style={sektion}>
            <Sektion style={sektionsrubrik}>Expertis</Sektion>
            <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', listStyle: 'none', margin: 0, padding: 0 }}>
              {data.skills.map((skill, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: '12px',
                    padding: '3px 11px',
                    border: `1px solid ${GULDLJUS}`,
                    color: TEXT,
                    borderRadius: '2px',
                  }}
                >
                  {getSkillName(skill)}
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.languages.length > 0 && (
          <section className="cv-keep" style={sektion}>
            <Sektion style={sektionsrubrik}>Språk</Sektion>
            <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 32px', listStyle: 'none', margin: 0, padding: 0 }}>
              {data.languages.map((lang) => {
                const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                return (
                  <li key={lang.id} style={{ fontSize: '13px', color: TEXT }}>
                    {name}
                    <span style={{ fontStyle: 'italic', color: DAMPAD }}> · {getLanguageLevelDisplay(lang.level)}</span>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {/* Certifikat + Länkar sida vid sida — sparar höjd när båda finns. */}
        {(data.certificates.length > 0 || data.links.length > 0) && (
          <div
            className="cv-keep"
            style={{
              display: 'grid',
              gridTemplateColumns: data.certificates.length && data.links.length ? '1fr 1fr' : '1fr',
              gap: '28px',
            }}
          >
            {data.certificates.length > 0 && (
              <section>
                <Sektion style={sektionsrubrik}>Certifikat</Sektion>
                {data.certificates.map((cert) => (
                  <p key={cert.id} className="cv-entry" style={{ fontSize: '12.5px', color: BLACK, margin: '0 0 4px' }}>
                    {cert.name}
                    {(cert.issuer || cert.date) && (
                      <span style={{ fontSize: '12px', color: DAMPAD, fontStyle: 'italic' }}>
                        {cert.issuer && ` · ${cert.issuer}`}
                        {cert.date && <span className="cv-datum"> · {periodText(cert.date)}</span>}
                      </span>
                    )}
                  </p>
                ))}
              </section>
            )}
            {data.links.length > 0 && (
              <section>
                <Sektion style={sektionsrubrik}>Länkar</Sektion>
                {data.links.map((link) => (
                  <p key={link.id} className="cv-entry" style={{ fontSize: '12px', color: BLACK, margin: '0 0 4px' }}>
                    {link.label && <span>{link.label} · </span>}
                    <span className="cv-url" style={{ color: BRONS }}><Url text={link.url} /></span>
                  </p>
                ))}
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
