/**
 * CV Preview Component - Premium Design System
 *
 * Each template has a distinct visual personality:
 * - Minimal: Swiss precision, Helvetica-style, extreme whitespace
 * - Executive: Classic elegance, serif typography, gold accents
 * - Creative: Bold asymmetry, color blocking, design-forward
 * - Nordic: Light, airy, Scandinavian minimalism
 * - Modern: Dark, tech-forward, Vercel/Linear inspired
 * - Centered: Elegant gradient, balanced, professional
 */

import {
  Mail, Phone, MapPin, Briefcase, GraduationCap,
  Award, Sparkles, Circle
} from '@/components/ui/icons'
import type { CVData } from '@/services/supabaseApi'

interface CVPreviewProps {
  data: CVData
}

// ============================================================================
// HELPERS
// ============================================================================

const getLanguageLevelDisplay = (level: string): string => {
  const levelMap: Record<string, string> = {
    'basic': 'Grundläggande',
    'good': 'God',
    'fluent': 'Flytande',
    'native': 'Modersmål',
    'Grundläggande': 'Grundläggande',
    'God': 'God',
    'Flytande': 'Flytande',
    'Modersmål': 'Modersmål',
  }
  return levelMap[level] || level
}

const getLanguageLevelPercent = (level: string): number => {
  const map: Record<string, number> = {
    'native': 100, 'fluent': 85, 'good': 70, 'basic': 50,
    'Modersmål': 100, 'Flytande': 85, 'God': 70, 'Grundläggande': 50,
  }
  return map[level] || 50
}

const getSkillName = (skill: string | { name: string; category?: string }): string => {
  return typeof skill === 'string' ? skill : skill?.name || ''
}

// ============================================================================
// TEMPLATE: MINIMAL (Swiss Design)
// ============================================================================

function MinimalTemplate({ data, fullName }: { data: CVData; fullName: string }) {
  return (
    <div
      className="cv-preview"
      style={{
        minHeight: '297mm',
        background: '#FFFFFF',
        padding: '80px',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Stark typografisk header */}
      <header style={{ marginBottom: '64px' }}>
        <h1
          style={{
            fontSize: '64px',
            fontWeight: '700',
            letterSpacing: '-0.03em',
            lineHeight: '1',
            color: '#000000',
            marginBottom: '16px',
          }}
        >
          {fullName}
        </h1>
        {data.title && (
          <p
            style={{
              fontSize: '20px',
              fontWeight: '400',
              color: '#666666',
              letterSpacing: '0.02em',
            }}
          >
            {data.title}
          </p>
        )}

        {/* Kontakt - horisontell, minimal */}
        <div
          style={{
            display: 'flex',
            gap: '32px',
            marginTop: '32px',
            paddingTop: '32px',
            borderTop: '1px solid #E5E5E5',
          }}
        >
          {data.email && (
            <span style={{ fontSize: '14px', color: '#666666' }}>{data.email}</span>
          )}
          {data.phone && (
            <span style={{ fontSize: '14px', color: '#666666' }}>{data.phone}</span>
          )}
          {data.location && (
            <span style={{ fontSize: '14px', color: '#666666' }}>{data.location}</span>
          )}
        </div>
      </header>

      {/* Profil */}
      {data.summary && (
        <section style={{ marginBottom: '64px', maxWidth: '640px' }}>
          <p
            style={{
              fontSize: '18px',
              lineHeight: '1.7',
              color: '#333333',
            }}
          >
            {data.summary}
          </p>
        </section>
      )}

      {/* Två kolumner */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '80px' }}>
        {/* Vänster - Erfarenhet */}
        <div>
          {data.workExperience?.length > 0 && (
            <section style={{ marginBottom: '48px' }}>
              <h2
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#999999',
                  marginBottom: '32px',
                }}
              >
                Erfarenhet
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                {data.workExperience.map(job => (
                  <div key={job.id}>
                    <div style={{ marginBottom: '8px' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          color: '#999999',
                          fontFeatureSettings: '"tnum"',
                        }}
                      >
                        {job.startDate} — {job.current ? 'Nu' : job.endDate}
                      </span>
                    </div>
                    <h3
                      style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#000000',
                        marginBottom: '4px',
                      }}
                    >
                      {job.title}
                    </h3>
                    <div
                      style={{
                        fontSize: '14px',
                        color: '#666666',
                        marginBottom: '12px',
                      }}
                    >
                      {job.company}
                    </div>
                    {job.description && (
                      <p
                        style={{
                          fontSize: '14px',
                          lineHeight: '1.6',
                          color: '#666666',
                        }}
                      >
                        {job.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.education?.length > 0 && (
            <section>
              <h2
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#999999',
                  marginBottom: '32px',
                }}
              >
                Utbildning
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {data.education.map(edu => (
                  <div key={edu.id}>
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#999999',
                        display: 'block',
                        marginBottom: '4px',
                      }}
                    >
                      {edu.startDate} — {edu.endDate}
                    </span>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#000000' }}>
                      {edu.degree}
                    </h3>
                    <div style={{ fontSize: '14px', color: '#666666' }}>{edu.school}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Höger - Kompetenser, Språk */}
        <div>
          {data.skills?.length > 0 && (
            <section style={{ marginBottom: '48px' }}>
              <h2
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#999999',
                  marginBottom: '24px',
                }}
              >
                Kompetenser
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.skills.map((skill, i) => (
                  <span key={i} style={{ fontSize: '14px', color: '#333333' }}>
                    {getSkillName(skill)}
                  </span>
                ))}
              </div>
            </section>
          )}

          {data.languages?.length > 0 && (
            <section style={{ marginBottom: '48px' }}>
              <h2
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#999999',
                  marginBottom: '24px',
                }}
              >
                Språk
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.languages.map(lang => {
                  const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                  return (
                    <div key={lang.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', color: '#333333' }}>{name}</span>
                      <span style={{ fontSize: '14px', color: '#999999' }}>
                        {getLanguageLevelDisplay(lang.level)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {data.certificates?.length > 0 && (
            <section>
              <h2
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#999999',
                  marginBottom: '24px',
                }}
              >
                Certifikat
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.certificates.map(cert => (
                  <div key={cert.id}>
                    <div style={{ fontSize: '14px', color: '#333333' }}>{cert.name}</div>
                    <div style={{ fontSize: '12px', color: '#999999' }}>{cert.issuer}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// TEMPLATE: EXECUTIVE (Classic Elegance)
// ============================================================================

function ExecutiveTemplate({ data, fullName }: { data: CVData; fullName: string }) {
  const gold = '#B8860B'
  const goldLight = '#F5E6C8'

  return (
    <div
      className="cv-preview"
      style={{
        minHeight: '297mm',
        background: '#FDFCFA',
        fontFamily: "'Georgia', 'Times New Roman', serif",
      }}
    >
      {/* Elegant header med guld-linje */}
      <header
        style={{
          padding: '64px 80px',
          borderBottom: `3px solid ${gold}`,
          background: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
          {data.profileImage && (
            <img
              src={data.profileImage}
              alt=""
              style={{
                width: '120px',
                height: '120px',
                objectFit: 'cover',
                borderRadius: '4px',
                border: `2px solid ${gold}`,
              }}
            />
          )}
          <div>
            <h1
              style={{
                fontSize: '48px',
                fontWeight: '400',
                letterSpacing: '0.02em',
                color: '#1a1a1a',
                marginBottom: '8px',
              }}
            >
              {fullName}
            </h1>
            {data.title && (
              <p
                style={{
                  fontSize: '20px',
                  fontStyle: 'italic',
                  color: gold,
                  marginBottom: '20px',
                }}
              >
                {data.title}
              </p>
            )}
            <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#666666' }}>
              {data.email && <span>{data.email}</span>}
              {data.phone && <span>{data.phone}</span>}
              {data.location && <span>{data.location}</span>}
            </div>
          </div>
        </div>
      </header>

      <main style={{ padding: '64px 80px' }}>
        {/* Profil med initial */}
        {data.summary && (
          <section style={{ marginBottom: '56px' }}>
            <p
              style={{
                fontSize: '18px',
                lineHeight: '1.8',
                color: '#333333',
                maxWidth: '720px',
              }}
            >
              <span
                style={{
                  float: 'left',
                  fontSize: '64px',
                  lineHeight: '1',
                  marginRight: '12px',
                  marginTop: '4px',
                  color: gold,
                  fontWeight: '400',
                }}
              >
                {data.summary.charAt(0)}
              </span>
              {data.summary.slice(1)}
            </p>
          </section>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px' }}>
          {/* Erfarenhet */}
          {data.workExperience?.length > 0 && (
            <section>
              <h2
                style={{
                  fontSize: '14px',
                  fontWeight: '400',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: gold,
                  marginBottom: '32px',
                  paddingBottom: '12px',
                  borderBottom: `1px solid ${goldLight}`,
                }}
              >
                Karriär
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {data.workExperience.map(job => (
                  <div key={job.id}>
                    <h3
                      style={{
                        fontSize: '18px',
                        fontWeight: '400',
                        color: '#1a1a1a',
                        marginBottom: '4px',
                      }}
                    >
                      {job.title}
                    </h3>
                    <div style={{ fontSize: '15px', color: gold, marginBottom: '4px' }}>
                      {job.company}
                    </div>
                    <div style={{ fontSize: '13px', color: '#888888', marginBottom: '12px' }}>
                      {job.startDate} — {job.current ? 'Nuvarande' : job.endDate}
                    </div>
                    {job.description && (
                      <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#555555' }}>
                        {job.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <div>
            {/* Utbildning */}
            {data.education?.length > 0 && (
              <section style={{ marginBottom: '48px' }}>
                <h2
                  style={{
                    fontSize: '14px',
                    fontWeight: '400',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: gold,
                    marginBottom: '32px',
                    paddingBottom: '12px',
                    borderBottom: `1px solid ${goldLight}`,
                  }}
                >
                  Utbildning
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {data.education.map(edu => (
                    <div key={edu.id}>
                      <h3 style={{ fontSize: '16px', fontWeight: '400', color: '#1a1a1a' }}>
                        {edu.degree}
                      </h3>
                      <div style={{ fontSize: '14px', color: gold }}>{edu.school}</div>
                      <div style={{ fontSize: '13px', color: '#888888' }}>
                        {edu.startDate} — {edu.endDate}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Expertis */}
            {data.skills?.length > 0 && (
              <section style={{ marginBottom: '48px' }}>
                <h2
                  style={{
                    fontSize: '14px',
                    fontWeight: '400',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: gold,
                    marginBottom: '24px',
                    paddingBottom: '12px',
                    borderBottom: `1px solid ${goldLight}`,
                  }}
                >
                  Expertis
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {data.skills.map((skill, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '13px',
                        padding: '6px 16px',
                        border: `1px solid ${goldLight}`,
                        color: '#555555',
                      }}
                    >
                      {getSkillName(skill)}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Språk */}
            {data.languages?.length > 0 && (
              <section>
                <h2
                  style={{
                    fontSize: '14px',
                    fontWeight: '400',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: gold,
                    marginBottom: '24px',
                    paddingBottom: '12px',
                    borderBottom: `1px solid ${goldLight}`,
                  }}
                >
                  Språk
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {data.languages.map(lang => {
                    const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                    return (
                      <div key={lang.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '14px', color: '#333333' }}>{name}</span>
                        <span style={{ fontSize: '14px', fontStyle: 'italic', color: '#888888' }}>
                          {getLanguageLevelDisplay(lang.level)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

// ============================================================================
// TEMPLATE: MODERN (Dark Tech)
// ============================================================================

function ModernTemplate({ data, fullName }: { data: CVData; fullName: string }) {
  const accent = '#6366F1'

  return (
    <div
      className="cv-preview"
      style={{
        display: 'flex',
        minHeight: '297mm',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Mörk sidebar */}
      <aside
        style={{
          width: '320px',
          background: 'linear-gradient(180deg, #0F0F0F 0%, #1A1A1A 100%)',
          color: '#FFFFFF',
          padding: '48px 32px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Foto */}
        {data.profileImage ? (
          <img
            src={data.profileImage}
            alt=""
            style={{
              width: '100%',
              aspectRatio: '1',
              objectFit: 'cover',
              borderRadius: '16px',
              marginBottom: '32px',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              aspectRatio: '1',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '16px',
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '72px', opacity: 0.3 }}>👤</span>
          </div>
        )}

        {/* Kontakt */}
        <div style={{ marginBottom: '40px' }}>
          <h3
            style={{
              fontSize: '10px',
              fontWeight: '600',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: accent,
              marginBottom: '20px',
            }}
          >
            Kontakt
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {data.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Mail style={{ width: '16px', height: '16px', color: accent }} />
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{data.email}</span>
              </div>
            )}
            {data.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Phone style={{ width: '16px', height: '16px', color: accent }} />
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{data.phone}</span>
              </div>
            )}
            {data.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <MapPin style={{ width: '16px', height: '16px', color: accent }} />
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{data.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Skills med progress */}
        {data.skills?.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h3
              style={{
                fontSize: '10px',
                fontWeight: '600',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: accent,
                marginBottom: '20px',
              }}
            >
              Tech Stack
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {data.skills.slice(0, 12).map((skill, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '12px',
                    padding: '6px 12px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    borderRadius: '6px',
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

        {/* Språk */}
        {data.languages?.length > 0 && (
          <div style={{ marginTop: 'auto' }}>
            <h3
              style={{
                fontSize: '10px',
                fontWeight: '600',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: accent,
                marginBottom: '20px',
              }}
            >
              Språk
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {data.languages.map(lang => {
                const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                const percent = getLanguageLevelPercent(lang.level)
                return (
                  <div key={lang.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px' }}>{name}</span>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                        {getLanguageLevelDisplay(lang.level)}
                      </span>
                    </div>
                    <div
                      style={{
                        height: '4px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${percent}%`,
                          height: '100%',
                          background: `linear-gradient(90deg, ${accent} 0%, #818CF8 100%)`,
                          borderRadius: '2px',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </aside>

      {/* Huvudinnehåll */}
      <main style={{ flex: 1, padding: '48px 56px', background: '#FFFFFF' }}>
        {/* Header */}
        <header style={{ marginBottom: '48px' }}>
          <h1
            style={{
              fontSize: '56px',
              fontWeight: '700',
              letterSpacing: '-0.03em',
              color: '#0F0F0F',
              lineHeight: '1.1',
              marginBottom: '12px',
            }}
          >
            {fullName}
          </h1>
          {data.title && (
            <p
              style={{
                fontSize: '20px',
                color: accent,
                fontWeight: '500',
              }}
            >
              {data.title}
            </p>
          )}
        </header>

        {/* Profil */}
        {data.summary && (
          <section style={{ marginBottom: '48px' }}>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.8',
                color: '#444444',
                maxWidth: '600px',
              }}
            >
              {data.summary}
            </p>
          </section>
        )}

        {/* Erfarenhet */}
        {data.workExperience?.length > 0 && (
          <section style={{ marginBottom: '48px' }}>
            <h2
              style={{
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#999999',
                marginBottom: '28px',
              }}
            >
              Erfarenhet
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {data.workExperience.map((job, i) => (
                <div
                  key={job.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '140px 1fr',
                    gap: '32px',
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#888888',
                        fontFeatureSettings: '"tnum"',
                      }}
                    >
                      {job.startDate}
                      <br />
                      — {job.current ? 'Nu' : job.endDate}
                    </span>
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#0F0F0F',
                        marginBottom: '4px',
                      }}
                    >
                      {job.title}
                    </h3>
                    <div style={{ fontSize: '14px', color: accent, marginBottom: '12px' }}>
                      {job.company}
                    </div>
                    {job.description && (
                      <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#666666' }}>
                        {job.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Utbildning */}
        {data.education?.length > 0 && (
          <section>
            <h2
              style={{
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#999999',
                marginBottom: '28px',
              }}
            >
              Utbildning
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {data.education.map(edu => (
                <div
                  key={edu.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '140px 1fr',
                    gap: '32px',
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#888888' }}>
                    {edu.startDate} — {edu.endDate}
                  </span>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0F0F0F' }}>
                      {edu.degree}
                    </h3>
                    <div style={{ fontSize: '14px', color: '#666666' }}>{edu.school}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

// ============================================================================
// TEMPLATE: CREATIVE (Bold Asymmetric)
// ============================================================================

function CreativeTemplate({ data, fullName }: { data: CVData; fullName: string }) {
  const primary = '#7C3AED'
  const secondary = '#EC4899'

  return (
    <div
      className="cv-preview"
      style={{
        minHeight: '297mm',
        background: '#FAFAFA',
        fontFamily: "'Inter', -apple-system, sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Dekorativt element */}
      <div
        style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '400px',
          height: '400px',
          background: `linear-gradient(135deg, ${primary}20 0%, ${secondary}20 100%)`,
          borderRadius: '50%',
        }}
      />

      {/* Header */}
      <header
        style={{
          padding: '64px',
          paddingBottom: '48px',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-end' }}>
          {data.profileImage && (
            <img
              src={data.profileImage}
              alt=""
              style={{
                width: '180px',
                height: '220px',
                objectFit: 'cover',
                borderRadius: '24px',
                boxShadow: '0 20px 60px rgba(124, 58, 237, 0.2)',
              }}
            />
          )}
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: '72px',
                fontWeight: '800',
                letterSpacing: '-0.04em',
                lineHeight: '0.95',
                background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '16px',
              }}
            >
              {fullName}
            </h1>
            {data.title && (
              <p
                style={{
                  fontSize: '24px',
                  fontWeight: '500',
                  color: '#333333',
                }}
              >
                {data.title}
              </p>
            )}
          </div>
        </div>

        {/* Kontakt-chips */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '32px', flexWrap: 'wrap' }}>
          {data.email && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: '#FFFFFF',
                borderRadius: '100px',
                fontSize: '14px',
                color: '#333333',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <Mail style={{ width: '16px', height: '16px', color: primary }} />
              {data.email}
            </span>
          )}
          {data.phone && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: '#FFFFFF',
                borderRadius: '100px',
                fontSize: '14px',
                color: '#333333',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <Phone style={{ width: '16px', height: '16px', color: primary }} />
              {data.phone}
            </span>
          )}
          {data.location && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: '#FFFFFF',
                borderRadius: '100px',
                fontSize: '14px',
                color: '#333333',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <MapPin style={{ width: '16px', height: '16px', color: primary }} />
              {data.location}
            </span>
          )}
        </div>
      </header>

      <main style={{ padding: '0 64px 64px' }}>
        {/* Profil */}
        {data.summary && (
          <section
            style={{
              background: '#FFFFFF',
              padding: '32px',
              borderRadius: '24px',
              marginBottom: '32px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            }}
          >
            <p
              style={{
                fontSize: '18px',
                lineHeight: '1.8',
                color: '#444444',
              }}
            >
              {data.summary}
            </p>
          </section>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          {/* Erfarenhet */}
          {data.workExperience?.length > 0 && (
            <section
              style={{
                background: '#FFFFFF',
                padding: '32px',
                borderRadius: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              }}
            >
              <h2
                style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: primary,
                  marginBottom: '28px',
                }}
              >
                Erfarenhet
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {data.workExperience.map(job => (
                  <div key={job.id}>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '11px',
                        fontWeight: '600',
                        padding: '4px 12px',
                        background: `${primary}15`,
                        color: primary,
                        borderRadius: '100px',
                        marginBottom: '12px',
                      }}
                    >
                      {job.startDate} — {job.current ? 'Nu' : job.endDate}
                    </span>
                    <h3
                      style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#1a1a1a',
                        marginBottom: '4px',
                      }}
                    >
                      {job.title}
                    </h3>
                    <div style={{ fontSize: '14px', color: secondary, marginBottom: '8px' }}>
                      {job.company}
                    </div>
                    {job.description && (
                      <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#666666' }}>
                        {job.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Skills */}
            {data.skills?.length > 0 && (
              <section
                style={{
                  background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
                  padding: '32px',
                  borderRadius: '24px',
                  color: '#FFFFFF',
                }}
              >
                <h2
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    opacity: 0.8,
                    marginBottom: '20px',
                  }}
                >
                  Kompetenser
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {data.skills.map((skill, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '13px',
                        fontWeight: '500',
                        padding: '8px 16px',
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: '100px',
                      }}
                    >
                      {getSkillName(skill)}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Utbildning */}
            {data.education?.length > 0 && (
              <section
                style={{
                  background: '#FFFFFF',
                  padding: '32px',
                  borderRadius: '24px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                }}
              >
                <h2
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: primary,
                    marginBottom: '24px',
                  }}
                >
                  Utbildning
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {data.education.map(edu => (
                    <div key={edu.id}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>
                        {edu.degree}
                      </h3>
                      <div style={{ fontSize: '14px', color: secondary }}>{edu.school}</div>
                      <div style={{ fontSize: '12px', color: '#888888' }}>
                        {edu.startDate} — {edu.endDate}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Språk */}
            {data.languages?.length > 0 && (
              <section
                style={{
                  background: '#FFFFFF',
                  padding: '32px',
                  borderRadius: '24px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                }}
              >
                <h2
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: primary,
                    marginBottom: '20px',
                  }}
                >
                  Språk
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {data.languages.map(lang => {
                    const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                    return (
                      <div key={lang.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '14px', color: '#333333' }}>{name}</span>
                        <span style={{ fontSize: '14px', color: '#888888' }}>
                          {getLanguageLevelDisplay(lang.level)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

// ============================================================================
// TEMPLATE: NORDIC (Scandinavian Minimalism)
// ============================================================================

function NordicTemplate({ data, fullName }: { data: CVData; fullName: string }) {
  const accent = '#0EA5E9'

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
      {/* Ljus sidebar */}
      <aside
        style={{
          width: '280px',
          background: '#F8FAFC',
          padding: '56px 32px',
          borderRight: '1px solid #E2E8F0',
        }}
      >
        {/* Foto */}
        {data.profileImage ? (
          <img
            src={data.profileImage}
            alt=""
            style={{
              width: '100%',
              aspectRatio: '1',
              objectFit: 'cover',
              borderRadius: '20px',
              marginBottom: '32px',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              aspectRatio: '1',
              background: '#E2E8F0',
              borderRadius: '20px',
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '64px', opacity: 0.3 }}>👤</span>
          </div>
        )}

        {/* Kontakt */}
        <div style={{ marginBottom: '40px' }}>
          <h3
            style={{
              fontSize: '11px',
              fontWeight: '500',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#94A3B8',
              marginBottom: '20px',
            }}
          >
            Kontakt
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.email && (
              <a
                href={`mailto:${data.email}`}
                style={{
                  fontSize: '13px',
                  color: '#334155',
                  textDecoration: 'none',
                  wordBreak: 'break-all',
                }}
              >
                {data.email}
              </a>
            )}
            {data.phone && (
              <span style={{ fontSize: '13px', color: '#334155' }}>{data.phone}</span>
            )}
            {data.location && (
              <span style={{ fontSize: '13px', color: '#334155' }}>{data.location}</span>
            )}
          </div>
        </div>

        {/* Skills */}
        {data.skills?.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h3
              style={{
                fontSize: '11px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#94A3B8',
                marginBottom: '16px',
              }}
            >
              Kompetenser
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.skills.map((skill, i) => (
                <span key={i} style={{ fontSize: '13px', color: '#334155' }}>
                  {getSkillName(skill)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Språk */}
        {data.languages?.length > 0 && (
          <div>
            <h3
              style={{
                fontSize: '11px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#94A3B8',
                marginBottom: '16px',
              }}
            >
              Språk
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.languages.map(lang => {
                const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                const percent = getLanguageLevelPercent(lang.level)
                return (
                  <div key={lang.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', color: '#334155' }}>{name}</span>
                    </div>
                    <div
                      style={{
                        height: '3px',
                        background: '#E2E8F0',
                        borderRadius: '2px',
                      }}
                    >
                      <div
                        style={{
                          width: `${percent}%`,
                          height: '100%',
                          background: accent,
                          borderRadius: '2px',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </aside>

      {/* Huvudinnehåll */}
      <main style={{ flex: 1, padding: '56px 48px' }}>
        <header style={{ marginBottom: '48px' }}>
          <h1
            style={{
              fontSize: '48px',
              fontWeight: '600',
              letterSpacing: '-0.02em',
              color: '#0F172A',
              marginBottom: '8px',
            }}
          >
            {fullName}
          </h1>
          {data.title && (
            <p style={{ fontSize: '20px', color: accent }}>{data.title}</p>
          )}
        </header>

        {/* Profil */}
        {data.summary && (
          <section style={{ marginBottom: '48px' }}>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.8',
                color: '#475569',
                maxWidth: '560px',
              }}
            >
              {data.summary}
            </p>
          </section>
        )}

        {/* Erfarenhet */}
        {data.workExperience?.length > 0 && (
          <section style={{ marginBottom: '48px' }}>
            <h2
              style={{
                fontSize: '11px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#94A3B8',
                marginBottom: '28px',
                paddingBottom: '12px',
                borderBottom: '1px solid #E2E8F0',
              }}
            >
              Erfarenhet
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {data.workExperience.map(job => (
                <div key={job.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#0F172A' }}>
                        {job.title}
                      </h3>
                      <div style={{ fontSize: '14px', color: accent }}>{job.company}</div>
                    </div>
                    <span style={{ fontSize: '12px', color: '#94A3B8', whiteSpace: 'nowrap' }}>
                      {job.startDate} — {job.current ? 'Nu' : job.endDate}
                    </span>
                  </div>
                  {job.description && (
                    <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#64748B', marginTop: '12px' }}>
                      {job.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Utbildning */}
        {data.education?.length > 0 && (
          <section>
            <h2
              style={{
                fontSize: '11px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#94A3B8',
                marginBottom: '28px',
                paddingBottom: '12px',
                borderBottom: '1px solid #E2E8F0',
              }}
            >
              Utbildning
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {data.education.map(edu => (
                <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0F172A' }}>
                      {edu.degree}
                    </h3>
                    <div style={{ fontSize: '14px', color: '#64748B' }}>{edu.school}</div>
                  </div>
                  <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                    {edu.startDate} — {edu.endDate}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

// ============================================================================
// TEMPLATE: CENTERED (Gradient Elegance)
// ============================================================================

function CenteredTemplate({ data, fullName }: { data: CVData; fullName: string }) {
  const primary = '#6366F1'
  const secondary = '#8B5CF6'

  return (
    <div
      className="cv-preview"
      style={{
        minHeight: '297mm',
        background: '#FFFFFF',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Gradient header */}
      <header
        style={{
          background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 50%, #A855F7 100%)`,
          padding: '64px',
          textAlign: 'center',
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Dekorativa cirklar */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            left: '-80px',
            width: '200px',
            height: '200px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-40px',
            right: '10%',
            width: '120px',
            height: '120px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '50%',
          }}
        />

        {data.profileImage && (
          <img
            src={data.profileImage}
            alt=""
            style={{
              width: '140px',
              height: '140px',
              objectFit: 'cover',
              borderRadius: '50%',
              border: '4px solid rgba(255,255,255,0.3)',
              marginBottom: '24px',
              position: 'relative',
            }}
          />
        )}

        <h1
          style={{
            fontSize: '48px',
            fontWeight: '700',
            letterSpacing: '-0.02em',
            marginBottom: '8px',
            position: 'relative',
          }}
        >
          {fullName}
        </h1>
        {data.title && (
          <p
            style={{
              fontSize: '20px',
              opacity: 0.9,
              marginBottom: '28px',
              position: 'relative',
            }}
          >
            {data.title}
          </p>
        )}

        {/* Kontakt */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            flexWrap: 'wrap',
            position: 'relative',
          }}
        >
          {data.email && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', opacity: 0.9 }}>
              <Mail style={{ width: '16px', height: '16px' }} />
              {data.email}
            </span>
          )}
          {data.phone && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', opacity: 0.9 }}>
              <Phone style={{ width: '16px', height: '16px' }} />
              {data.phone}
            </span>
          )}
          {data.location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', opacity: 0.9 }}>
              <MapPin style={{ width: '16px', height: '16px' }} />
              {data.location}
            </span>
          )}
        </div>
      </header>

      <main style={{ padding: '56px 64px' }}>
        {/* Profil - centrerad */}
        {data.summary && (
          <section style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p
              style={{
                fontSize: '18px',
                lineHeight: '1.8',
                color: '#4B5563',
                maxWidth: '680px',
                margin: '0 auto',
              }}
            >
              {data.summary}
            </p>
          </section>
        )}

        {/* Skills */}
        {data.skills?.length > 0 && (
          <section style={{ marginBottom: '56px', textAlign: 'center' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
              {data.skills.map((skill, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    padding: '8px 20px',
                    background: `linear-gradient(135deg, ${primary}15 0%, ${secondary}15 100%)`,
                    color: primary,
                    borderRadius: '100px',
                  }}
                >
                  {getSkillName(skill)}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Grid för erfarenhet och utbildning */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px' }}>
          {/* Erfarenhet */}
          {data.workExperience?.length > 0 && (
            <section>
              <h2
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: primary,
                  marginBottom: '32px',
                }}
              >
                Erfarenhet
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {data.workExperience.map(job => (
                  <div
                    key={job.id}
                    style={{
                      paddingLeft: '20px',
                      borderLeft: `2px solid ${primary}30`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#9CA3AF',
                        display: 'block',
                        marginBottom: '8px',
                      }}
                    >
                      {job.startDate} — {job.current ? 'Nu' : job.endDate}
                    </span>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                      {job.title}
                    </h3>
                    <div style={{ fontSize: '14px', color: primary, marginBottom: '12px' }}>
                      {job.company}
                    </div>
                    {job.description && (
                      <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#6B7280' }}>
                        {job.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <div>
            {/* Utbildning */}
            {data.education?.length > 0 && (
              <section style={{ marginBottom: '48px' }}>
                <h2
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: primary,
                    marginBottom: '32px',
                  }}
                >
                  Utbildning
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {data.education.map(edu => (
                    <div
                      key={edu.id}
                      style={{
                        padding: '20px',
                        background: '#F9FAFB',
                        borderRadius: '12px',
                      }}
                    >
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                        {edu.degree}
                      </h3>
                      <div style={{ fontSize: '14px', color: primary }}>{edu.school}</div>
                      <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                        {edu.startDate} — {edu.endDate}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Språk */}
            {data.languages?.length > 0 && (
              <section>
                <h2
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: primary,
                    marginBottom: '24px',
                  }}
                >
                  Språk
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {data.languages.map(lang => {
                    const name = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                    const percent = getLanguageLevelPercent(lang.level)
                    return (
                      <div key={lang.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '14px', color: '#374151' }}>{name}</span>
                          <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                            {getLanguageLevelDisplay(lang.level)}
                          </span>
                        </div>
                        <div style={{ height: '4px', background: '#E5E7EB', borderRadius: '2px' }}>
                          <div
                            style={{
                              width: `${percent}%`,
                              height: '100%',
                              background: `linear-gradient(90deg, ${primary} 0%, ${secondary} 100%)`,
                              borderRadius: '2px',
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CVPreview({ data }: CVPreviewProps) {
  const fullName = `${data.firstName} ${data.lastName}`.trim() || 'Ditt Namn'

  // Check for content
  const hasContent = !!(
    data.firstName || data.lastName || data.email || data.phone || data.summary ||
    (data.workExperience && data.workExperience.length > 0) ||
    (data.education && data.education.length > 0) ||
    (data.skills && data.skills.length > 0)
  )

  // Empty state
  if (!hasContent) {
    return (
      <div
        className="cv-preview"
        style={{
          minHeight: '500px',
          background: 'linear-gradient(180deg, #FAFAFA 0%, #F5F5F5 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px',
          textAlign: 'center',
          fontFamily: "'Inter', -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            background: '#E5E5E5',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
          }}
        >
          <Sparkles style={{ width: '40px', height: '40px', color: '#A3A3A3' }} />
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#525252', marginBottom: '8px' }}>
          Förhandsvisning
        </h3>
        <p style={{ fontSize: '15px', color: '#A3A3A3', maxWidth: '280px' }}>
          Börja fylla i dina uppgifter för att se hur ditt CV kommer att se ut
        </p>
      </div>
    )
  }

  // Route to correct template
  switch (data.template) {
    case 'minimal':
      return <MinimalTemplate data={data} fullName={fullName} />
    case 'executive':
      return <ExecutiveTemplate data={data} fullName={fullName} />
    case 'creative':
      return <CreativeTemplate data={data} fullName={fullName} />
    case 'nordic':
      return <NordicTemplate data={data} fullName={fullName} />
    case 'centered':
      return <CenteredTemplate data={data} fullName={fullName} />
    case 'sidebar':
    default:
      return <ModernTemplate data={data} fullName={fullName} />
  }
}

export default CVPreview
