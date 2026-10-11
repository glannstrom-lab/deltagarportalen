/**
 * Chicago (id `chicago`) — klassisk: namnet spärrat i serif (Source Serif 4)
 * med ett runt monogram, smal vänsterkolumn bakom en tunn linje, brödtext i
 * Inter.
 *
 * Strukturen är cv-preview > main + aside så att vänsterkolumnen kan
 * upprepas på sida 2+ via print-CSS.
 *
 * Slipad 2026-10-11 (CVK1):
 * - Chicago och Rotterdam var nästan dubbletter (vit smal kolumn, spärrat
 *   versalnamn i samma sans). Chicago fick serifnamnet och monogrammet som
 *   sin egen röst; Rotterdam behåller det stora feta efternamnet.
 * - Kolumnrubrikerna var h3 utan h2 och posterna h4 — nivåerna hoppade.
 * - Grått #6B7280 i 10 px (nivåer, länkar) → #5B6472 och minst 10,5 px.
 * - Utbildningen var en enda odelbar sektion; nu hålls varje post ihop men
 *   en lång utbildningslista kan delas över en sidbrytning.
 */

import type { CSSProperties } from 'react'
import type { TemplateProps } from './types'
import { getLanguageLevelDisplay, getSkillName, getInitials } from './helpers'
import { periodText, rubrikTaggar } from './typografi'
import { Beskrivning } from './Beskrivning'
import { Url } from './Url'

const BLACK = '#111827'
const TEXT = '#374151'
const DAMPAD = '#5B6472' // 6,0:1 på vitt
const KANT = '#E5E7EB'
const SERIF = "'Source Serif 4', Georgia, serif"

const sektionsrubrik: CSSProperties = {
  fontSize: '10.5px',
  fontWeight: 700,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: BLACK,
  margin: '0 0 13px',
}

const datum: CSSProperties = { fontSize: '11px', color: DAMPAD, whiteSpace: 'nowrap', marginLeft: '14px' }

export function ChicagoTemplate({ data, fullName, rubrikniva }: TemplateProps) {
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
        color: TEXT,
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      <main style={{ flex: 1, minWidth: 0, padding: '60px 52px 52px 32px' }}>
        <header
          className="cv-keep"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '18px',
            marginBottom: '26px',
            paddingBottom: '24px',
            borderBottom: '1px solid #D1D5DB',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <Namn
              style={{
                fontFamily: SERIF,
                fontSize: fullName.length > 22 ? '28px' : '34px',
                fontWeight: 400,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: BLACK,
                lineHeight: 1.12,
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
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  color: DAMPAD,
                  margin: '10px 0 0',
                }}
              >
                {data.title}
              </p>
            )}
          </div>
          <div
            aria-hidden={data.profileImage ? undefined : 'true'}
            style={{
              width: '88px',
              height: '88px',
              borderRadius: '50%',
              border: `1px solid ${BLACK}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {data.profileImage ? (
              <img src={data.profileImage} alt="" style={{ width: '76px', height: '76px', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              <span style={{ fontFamily: SERIF, fontSize: '26px', fontWeight: 400, color: BLACK, letterSpacing: '0.08em' }}>
                {getInitials(data.firstName, data.lastName)}
              </span>
            )}
          </div>
        </header>

        {data.summary && (
          <section style={{ marginBottom: '28px' }}>
            <Sektion style={sektionsrubrik}>Om mig</Sektion>
            <p style={{ fontSize: '12.5px', lineHeight: 1.7, color: TEXT, margin: 0 }}>{data.summary}</p>
          </section>
        )}

        {data.workExperience.length > 0 && (
          <section style={{ marginBottom: '28px' }}>
            <Sektion style={sektionsrubrik}>Arbetslivserfarenhet</Sektion>
            {data.workExperience.map((job) => (
              <div key={job.id} className="cv-entry" style={{ marginBottom: '17px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Post style={{ fontSize: '13.5px', fontWeight: 700, color: BLACK, margin: 0 }}>
                    {job.title}
                    {job.company && <span style={{ fontWeight: 500, color: TEXT }}>, {job.company}</span>}
                  </Post>
                  <span className="cv-datum" style={datum}>
                    {periodText(job.startDate, job.endDate, job.current)}
                  </span>
                </div>
                {job.location && <p style={{ fontSize: '11.5px', color: DAMPAD, margin: '1px 0 0' }}>{job.location}</p>}
                <Beskrivning text={job.description} style={{ fontSize: '12px', lineHeight: 1.65, color: TEXT, marginTop: '4px' }} />
              </div>
            ))}
          </section>
        )}

        {data.education.length > 0 && (
          <section style={{ marginBottom: '28px' }}>
            <Sektion style={sektionsrubrik}>Utbildning</Sektion>
            {data.education.map((edu) => (
              <div key={edu.id} className="cv-entry" style={{ marginBottom: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Post style={{ fontSize: '13.5px', fontWeight: 700, color: BLACK, margin: 0 }}>
                    {edu.degree || edu.school}
                    {edu.degree && edu.school && <span style={{ fontWeight: 500, color: TEXT }}>, {edu.school}</span>}
                  </Post>
                  <span className="cv-datum" style={datum}>
                    {periodText(edu.startDate, edu.endDate, edu.current)}
                  </span>
                </div>
                {(edu.field || edu.location) && (
                  <p style={{ fontSize: '11.5px', color: DAMPAD, margin: '1px 0 0' }}>{[edu.field, edu.location].filter(Boolean).join(' · ')}</p>
                )}
                <Beskrivning text={edu.description} style={{ fontSize: '12px', lineHeight: 1.65, color: TEXT, marginTop: '4px' }} />
              </div>
            ))}
          </section>
        )}

        {data.certificates.length > 0 && (
          <section className="cv-keep">
            <Sektion style={sektionsrubrik}>Certifikat</Sektion>
            {data.certificates.map((cert) => (
              <div key={cert.id} className="cv-entry" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '7px' }}>
                <p style={{ fontSize: '12.5px', fontWeight: 700, color: BLACK, margin: 0 }}>
                  {cert.name}
                  {cert.issuer && <span style={{ fontWeight: 500, color: TEXT }}>, {cert.issuer}</span>}
                </p>
                {cert.date && (
                  <span className="cv-datum" style={datum}>
                    {periodText(cert.date)}
                  </span>
                )}
              </div>
            ))}
          </section>
        )}
      </main>

      {/* Efter huvudtexten i dokumentet, till vänster på sidan (order: -1).
          200 px måste stämma med SIDEBAR_CONFIG.chicago. */}
      <aside
        style={{
          order: -1,
          width: '200px',
          flexShrink: 0,
          padding: '60px 22px 52px 48px',
          borderRight: `1px solid ${KANT}`,
          background: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          gap: '30px',
        }}
      >
        {harKontakt && (
          <section className="cv-keep">
            <Sektion style={sektionsrubrik}>Kontakt</Sektion>
            <ul className="cv-kontakt" style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: '11px', lineHeight: 1.6, color: TEXT, display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {data.phone && <li>{data.phone}</li>}
              {data.email && <li>{data.email}</li>}
              {data.location && <li>{data.location}</li>}
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

        {data.languages.length > 0 && (
          <section className="cv-keep">
            <Sektion style={sektionsrubrik}>Språk</Sektion>
            {data.languages.map((lang) => {
              const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
              return (
                <div key={lang.id} className="cv-entry" style={{ marginBottom: '6px' }}>
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
