/**
 * Modern Template - Dark Tech
 * Vercel/Linear inspired, dark sidebar, indigo accents
 */

import { Mail, Phone, MapPin } from '@/components/ui/icons'
import type { TemplateProps } from './types'
import { getLanguageLevelDisplay, getSkillName, getInitials } from './helpers'

const accent = '#6366F1'

export function ModernTemplate({ data, fullName }: TemplateProps) {
  return (
    <div
      className="cv-preview"
      style={{
        display: 'flex',
        minHeight: '297mm',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Dark sidebar — 240px (≈30% av A4-bredd) ger balanserad proportion
          mellan sidobar och main. Större (320px) gör main för smal och
          rubriker bryts onödigt. */}
      <aside
        style={{
          width: '240px',
          background: 'linear-gradient(180deg, #0F0F0F 0%, #1A1A1A 100%)',
          color: '#FFFFFF',
          padding: '40px 28px',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* Photo — centrerad, fast storlek max 160px så fotot inte
            äter hela sidobaren när användaren har bild. */}
        <div className="cv-keep" style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          {data.profileImage ? (
            <img
              src={data.profileImage}
              alt=""
              style={{
                width: '160px',
                height: '160px',
                objectFit: 'cover',
                borderRadius: '14px',
              }}
            />
          ) : (
            <div
              style={{
                width: '160px',
                height: '160px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <span style={{ fontSize: '44px', fontWeight: 300, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.02em' }}>
                {getInitials(data.firstName, data.lastName)}
              </span>
            </div>
          )}
        </div>

        {/* Contact */}
        <div style={{ marginBottom: '28px' }}>
          <h3
            style={{
              fontSize: '10px',
              fontWeight: '600',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: accent,
              marginBottom: '14px',
            }}
          >
            Kontakt
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mail style={{ width: '14px', height: '14px', color: accent, flexShrink: 0 }} />
                <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.8)', wordBreak: 'break-all', lineHeight: 1.4 }}>{data.email}</span>
              </div>
            )}
            {data.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Phone style={{ width: '14px', height: '14px', color: accent, flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>{data.phone}</span>
              </div>
            )}
            {data.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MapPin style={{ width: '14px', height: '14px', color: accent, flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>{data.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Skills */}
        {data.skills?.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <h3
              style={{
                fontSize: '10px',
                fontWeight: '600',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: accent,
                marginBottom: '14px',
              }}
            >
              Kompetenser
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {data.skills.map((skill, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '11px',
                    padding: '4px 10px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    borderRadius: '5px',
                    color: '#FFFFFF',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                  }}
                >
                  {getSkillName(skill)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Länkar — nära kontaktuppgifterna där man letar efter dem. */}
        {data.links?.length > 0 && (
          <div className="cv-keep" style={{ marginBottom: '28px' }}>
            <h3
              style={{
                fontSize: '10px',
                fontWeight: '600',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: accent,
                marginBottom: '14px',
              }}
            >
              Länkar
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.links.map(link => (
                <div key={link.id} className="cv-entry">
                  {link.label && (
                    <div style={{ fontSize: '11.5px', fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>{link.label}</div>
                  )}
                  <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.55)', wordBreak: 'break-all', lineHeight: 1.4 }}>
                    {link.url}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages — utan marginTop:auto eftersom det skapar stora
            mellanrum när aside-content är kortare än main, vilket gör
            att SPRÅK hamnar i mitten av sida 2 i flera-sidors-PDFs. */}
        {data.languages?.length > 0 && (
          <div className="cv-keep">
            <h3
              style={{
                fontSize: '10px',
                fontWeight: '600',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: accent,
                marginBottom: '14px',
              }}
            >
              Språk
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.languages.map(lang => {
                const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                return (
                  <div key={lang.id} className="cv-entry">
                    <div style={{ fontSize: '12px', fontWeight: 500 }}>{name}</div>
                    <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', marginTop: '1px' }}>
                      {getLanguageLevelDisplay(lang.level)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </aside>

      {/* Main content — kompakt padding för att maxa innehållsplats på A4. */}
      <main style={{ flex: 1, padding: '36px 40px', background: '#FFFFFF' }}>
        {/* Header — namn-font 38px så fullständigt namn ryms på 1 rad
            inom main-bredden (~470px) även för långa namn. */}
        <header style={{ marginBottom: '20px' }}>
          <h1
            style={{
              fontSize: '38px',
              fontWeight: '700',
              letterSpacing: '-0.02em',
              color: '#0F0F0F',
              lineHeight: '1.1',
              marginBottom: '6px',
            }}
          >
            {fullName}
          </h1>
          {data.title && (
            <p style={{ fontSize: '16px', color: accent, fontWeight: '500' }}>{data.title}</p>
          )}
        </header>

        {/* Summary */}
        {data.summary && (
          <section style={{ marginBottom: '22px' }}>
            <p style={{ fontSize: '13px', lineHeight: '1.55', color: '#444444' }}>
              {data.summary}
            </p>
          </section>
        )}

        {/* Experience — datakolumn 90px så titel + beskrivning får mer luft. */}
        {data.workExperience?.length > 0 && (
          <section style={{ marginBottom: '22px' }}>
            <h2
              style={{
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#999999',
                marginBottom: '14px',
              }}
            >
              Erfarenhet
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {data.workExperience.map(job => (
                <div key={job.id} className="cv-entry">
                  <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '18px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#888888', fontFeatureSettings: '"tnum"', lineHeight: 1.45 }}>
                        {job.startDate}<br />— {job.current ? 'Nu' : job.endDate}
                      </span>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '14.5px', fontWeight: '600', color: '#0F0F0F', marginBottom: '1px' }}>
                        {job.title}
                      </h3>
                      <div style={{ fontSize: '12.5px', color: accent, marginBottom: '6px' }}>{job.company}</div>
                      {job.description && (
                        <p style={{ fontSize: '12.5px', lineHeight: '1.55', color: '#666666' }}>{job.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education — hela sektionen är ett cv-keep så de få utbildnings-
            entries hålls ihop på samma sida (sektionen är typiskt 80-120px). */}
        {data.education?.length > 0 && (
          <section className="cv-keep">
            <h2
              style={{
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#999999',
                marginBottom: '14px',
              }}
            >
              Utbildning
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.education.map(edu => (
                <div key={edu.id} className="cv-entry">
                  <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '18px' }}>
                    <span style={{ fontSize: '11px', color: '#888888', lineHeight: 1.45 }}>
                      {edu.startDate}<br />— {edu.endDate}
                    </span>
                    <div>
                      <h3 style={{ fontSize: '13.5px', fontWeight: '600', color: '#0F0F0F' }}>{edu.degree}</h3>
                      <div style={{ fontSize: '12.5px', color: '#666666' }}>{edu.school}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Certifikat */}
        {data.certificates?.length > 0 && (
          <section className="cv-keep" style={{ marginTop: '22px' }}>
            <h2
              style={{
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#999999',
                marginBottom: '14px',
              }}
            >
              Certifikat
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {data.certificates.map(cert => (
                <div key={cert.id} className="cv-entry">
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#0F0F0F' }}>{cert.name}</span>
                  {cert.issuer && <span style={{ fontSize: '12px', color: '#888888' }}> · {cert.issuer}</span>}
                  {cert.date && <span style={{ fontSize: '12px', color: '#888888' }}> · {cert.date}</span>}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
