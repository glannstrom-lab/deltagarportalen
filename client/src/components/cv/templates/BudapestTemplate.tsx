/**
 * Budapest Template - Mörk sidopanel med cirkulärt foto + timeline
 * Inspirerad av resume-example.com Budapest
 */

import type { TemplateProps } from './types'
import { getLanguageLevelDisplay, getSkillName, getInitials } from './helpers'

const dark = '#2C3E50'
const accent = '#E67E22'

export function BudapestTemplate({ data, fullName }: TemplateProps) {
  return (
    <div
      className="cv-preview"
      style={{
        display: 'flex',
        minHeight: '297mm',
        fontFamily: "'Inter', -apple-system, sans-serif",
        background: '#FFFFFF',
      }}
    >
      {/* Mörk sidopanel */}
      <aside
        style={{
          width: '34%',
          background: dark,
          color: '#FFFFFF',
          padding: '48px 32px',
        }}
      >
        {/* Cirkulärt foto */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
          {data.profileImage ? (
            <img
              src={data.profileImage}
              alt=""
              style={{
                width: '160px',
                height: '160px',
                objectFit: 'cover',
                borderRadius: '50%',
                border: `4px solid ${accent}`,
              }}
            />
          ) : (
            <div
              style={{
                width: '160px',
                height: '160px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
                border: `4px solid ${accent}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                fontWeight: 300,
                color: 'rgba(255,255,255,0.6)',
                letterSpacing: '0.02em',
              }}
            >
              {getInitials(data.firstName, data.lastName)}
            </div>
          )}
        </div>

        {/* About me */}
        {data.summary && (
          <section style={{ marginBottom: '32px' }}>
            <h3
              style={{
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.15em',
                marginBottom: '12px',
                color: '#FFFFFF',
              }}
            >
              OM MIG
            </h3>
            <p style={{ fontSize: '12px', lineHeight: 1.7, color: 'rgba(255,255,255,0.85)' }}>
              {data.summary}
            </p>
          </section>
        )}

        <div style={{ height: '1px', background: 'rgba(255,255,255,0.12)', marginBottom: '32px' }} />

        {/* Links */}
        {data.links?.length > 0 && (
          <section className="cv-keep" style={{ marginBottom: '32px' }}>
            <h3
              style={{
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.15em',
                marginBottom: '14px',
                color: '#FFFFFF',
              }}
            >
              LÄNKAR
            </h3>
            {data.links.map((link) => (
              <div key={link.id} style={{ marginBottom: '12px' }}>
                {link.label && (
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF' }}>{link.label}</div>
                )}
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', wordBreak: 'break-all' }}>
                  {link.url}
                </div>
              </div>
            ))}
          </section>
        )}

        {data.languages?.length > 0 && (
          <>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.12)', marginBottom: '32px' }} />
            <section style={{ marginBottom: '32px' }}>
              <h3
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  marginBottom: '14px',
                  color: '#FFFFFF',
                }}
              >
                SPRÅK
              </h3>
              {data.languages.map((lang) => {
                const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                return (
                  <div key={lang.id} className="cv-entry" style={{ marginBottom: '8px', fontSize: '12px' }}>
                    <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{name}</span>
                    <span style={{ color: 'rgba(255,255,255,0.7)', marginLeft: '6px' }}>
                      — {getLanguageLevelDisplay(lang.level)}
                    </span>
                  </div>
                )
              })}
            </section>
          </>
        )}

        {data.certificates?.length > 0 && (
          <>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.12)', marginBottom: '32px' }} />
            <section>
              <h3
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  marginBottom: '14px',
                  color: '#FFFFFF',
                }}
              >
                CERTIFIKAT
              </h3>
              {data.certificates.map((cert) => (
                <div key={cert.id} className="cv-entry" style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF' }}>{cert.name}</div>
                  {cert.issuer && (
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{cert.issuer}</div>
                  )}
                </div>
              ))}
            </section>
          </>
        )}
      </aside>

      {/* Huvudkolumn */}
      <main style={{ flex: 1, padding: '48px 56px', background: '#FFFFFF' }}>
        {/* Header med namn + kontakt */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div>
            <h1
              style={{
                fontSize: '36px',
                fontWeight: 700,
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
                color: dark,
                lineHeight: 1.1,
                marginBottom: '6px',
              }}
            >
              {fullName}
            </h1>
            {data.title && (
              <p
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: '#888888',
                }}
              >
                {data.title}
              </p>
            )}
          </div>
          <div style={{ textAlign: 'right', fontSize: '12px', color: '#555555' }}>
            {data.location && <div style={{ marginBottom: '4px' }}>{data.location}</div>}
            {data.phone && <div style={{ marginBottom: '4px' }}>{data.phone}</div>}
            {data.email && <div>{data.email}</div>}
          </div>
        </header>

        {/* Work experience med timeline */}
        {data.workExperience?.length > 0 && (
          <section style={{ marginBottom: '32px' }}>
            <h2
              style={{
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.15em',
                color: dark,
                marginBottom: '6px',
              }}
            >
              ARBETSLIVSERFARENHET
            </h2>
            <div style={{ height: '1px', background: '#E5E7EB', marginBottom: '20px' }} />
            <div>
              {data.workExperience.map((job) => (
                // VIKTIGT: print-CSS tvingar display:block på .cv-entry för
                // att break-inside ska respekteras i Chrome (puppeteer #6366).
                // Grid-layouten måste därför leva på en INNER div.
                <div key={job.id} className="cv-entry" style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 24px 1fr', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: dark }}>{job.company}</div>
                      {job.location && <div style={{ fontSize: '11px', color: '#888' }}>{job.location}</div>}
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                        {job.startDate} - {job.current ? 'Nu' : job.endDate}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '6px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: dark }} />
                      <div style={{ width: '1px', flex: 1, background: '#D1D5DB', marginTop: '4px' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '13px', fontWeight: 700, color: dark, marginBottom: '4px' }}>
                        {job.title}
                      </h3>
                      {job.description && (
                        <p style={{ fontSize: '12px', lineHeight: 1.6, color: '#555' }}>{job.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {data.education?.length > 0 && (
          <section style={{ marginBottom: '32px' }}>
            <h2
              style={{
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.15em',
                color: dark,
                marginBottom: '6px',
              }}
            >
              UTBILDNING
            </h2>
            <div style={{ height: '1px', background: '#E5E7EB', marginBottom: '20px' }} />
            <div>
              {data.education.map((edu) => (
                <div key={edu.id} className="cv-entry" style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 24px 1fr', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: dark }}>{edu.school}</div>
                      {edu.location && <div style={{ fontSize: '11px', color: '#888' }}>{edu.location}</div>}
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                        {edu.startDate} - {edu.endDate}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '6px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: dark }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '13px', fontWeight: 700, color: dark, marginBottom: '4px' }}>
                        {edu.degree}
                      </h3>
                      {edu.field && <div style={{ fontSize: '12px', color: '#555' }}>{edu.field}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {data.skills?.length > 0 && (
          <section>
            <h2
              style={{
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.15em',
                color: dark,
                marginBottom: '6px',
              }}
            >
              KOMPETENSER
            </h2>
            <div style={{ height: '1px', background: '#E5E7EB', marginBottom: '16px' }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {data.skills.map((skill, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '11px',
                    padding: '5px 12px',
                    background: '#F3F4F6',
                    color: dark,
                    borderRadius: '3px',
                    fontWeight: 500,
                  }}
                >
                  {getSkillName(skill)}
                </span>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
