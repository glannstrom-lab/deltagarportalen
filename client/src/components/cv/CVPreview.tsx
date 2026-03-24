/**
 * CV Preview Component - Premium Design System
 *
 * Design Philosophy:
 * - Apple-level attention to detail and whitespace
 * - Notion's clean information hierarchy
 * - Stripe's sophisticated color usage
 *
 * Typography System (8pt grid):
 * - Display: 48px/56px - Name (major hierarchy)
 * - Title: 24px/32px - Job title, section headers
 * - Body Large: 18px/28px - Summary, key content
 * - Body: 16px/24px - Regular content
 * - Caption: 14px/20px - Dates, labels
 * - Micro: 12px/16px - Tags, badges
 */

import {
  Mail, Phone, MapPin, Briefcase, GraduationCap,
  Award, Globe, Sparkles, ChevronRight, Circle
} from 'lucide-react'
import type { CVData } from '@/services/supabaseApi'

interface CVPreviewProps {
  data: CVData
}

// ============================================================================
// DESIGN TOKENS
// ============================================================================

const TYPOGRAPHY = {
  display: { size: '48px', lineHeight: '56px', weight: '700', letterSpacing: '-0.02em' },
  title: { size: '24px', lineHeight: '32px', weight: '600', letterSpacing: '-0.01em' },
  titleSm: { size: '20px', lineHeight: '28px', weight: '600', letterSpacing: '-0.01em' },
  bodyLg: { size: '18px', lineHeight: '28px', weight: '400', letterSpacing: '0' },
  body: { size: '16px', lineHeight: '24px', weight: '400', letterSpacing: '0' },
  caption: { size: '14px', lineHeight: '20px', weight: '500', letterSpacing: '0' },
  micro: { size: '12px', lineHeight: '16px', weight: '500', letterSpacing: '0.02em' },
  label: { size: '11px', lineHeight: '16px', weight: '600', letterSpacing: '0.08em' },
}

const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
  '4xl': '96px',
}

// ============================================================================
// COLOR PALETTES - Premium, refined colors
// ============================================================================

const PALETTES = {
  // Elegant dark sidebar with warm accents
  modern: {
    name: 'Modern',
    sidebar: {
      bg: '#18181B',
      text: '#FAFAFA',
      textMuted: 'rgba(250, 250, 250, 0.6)',
      accent: '#3B82F6',
      accentMuted: 'rgba(59, 130, 246, 0.15)',
    },
    main: {
      bg: '#FFFFFF',
      text: '#18181B',
      textSecondary: '#52525B',
      textMuted: '#A1A1AA',
      accent: '#3B82F6',
      accentLight: '#EFF6FF',
      border: '#E4E4E7',
      borderLight: '#F4F4F5',
    },
  },
  // Clean minimalist - Notion inspired
  minimal: {
    name: 'Minimal',
    sidebar: null, // No sidebar for this template
    main: {
      bg: '#FFFFFF',
      text: '#1F2937',
      textSecondary: '#4B5563',
      textMuted: '#9CA3AF',
      accent: '#1F2937',
      accentLight: '#F9FAFB',
      border: '#E5E7EB',
      borderLight: '#F3F4F6',
    },
  },
  // Sophisticated executive - gold accents
  executive: {
    name: 'Executive',
    header: {
      bg: '#0C0A09',
      text: '#FAFAF9',
      accent: '#CA8A04',
    },
    main: {
      bg: '#FAFAF9',
      text: '#1C1917',
      textSecondary: '#44403C',
      textMuted: '#78716C',
      accent: '#CA8A04',
      accentLight: '#FEF9C3',
      border: '#D6D3D1',
      borderLight: '#F5F5F4',
    },
  },
  // Nordic - soft, airy blues
  nordic: {
    name: 'Nordic',
    sidebar: {
      bg: '#F0F9FF',
      text: '#0C4A6E',
      textMuted: '#0369A1',
      accent: '#0284C7',
      accentMuted: 'rgba(2, 132, 199, 0.1)',
    },
    main: {
      bg: '#FFFFFF',
      text: '#0C4A6E',
      textSecondary: '#0369A1',
      textMuted: '#7DD3FC',
      accent: '#0284C7',
      accentLight: '#E0F2FE',
      border: '#BAE6FD',
      borderLight: '#F0F9FF',
    },
  },
  // Creative - bold, modern gradient
  creative: {
    name: 'Creative',
    sidebar: {
      bg: 'linear-gradient(180deg, #7C3AED 0%, #5B21B6 100%)',
      text: '#FFFFFF',
      textMuted: 'rgba(255, 255, 255, 0.7)',
      accent: '#FFFFFF',
      accentMuted: 'rgba(255, 255, 255, 0.15)',
    },
    main: {
      bg: '#FAF5FF',
      text: '#3B0764',
      textSecondary: '#6B21A8',
      textMuted: '#A855F7',
      accent: '#7C3AED',
      accentLight: '#EDE9FE',
      border: '#DDD6FE',
      borderLight: '#F5F3FF',
    },
  },
  // Centered - elegant gradient header
  centered: {
    name: 'Centered',
    header: {
      bg: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A855F7 100%)',
      text: '#FFFFFF',
      accent: '#FFFFFF',
    },
    main: {
      bg: '#FFFFFF',
      text: '#1E1B4B',
      textSecondary: '#3730A3',
      textMuted: '#6366F1',
      accent: '#6366F1',
      accentLight: '#EEF2FF',
      border: '#C7D2FE',
      borderLight: '#F5F3FF',
    },
  },
}

// ============================================================================
// TEMPLATE CONFIGURATIONS
// ============================================================================

const TEMPLATES = {
  sidebar: {
    name: 'Sidokolumn',
    layout: 'sidebar' as const,
    palette: 'modern',
    features: {
      photoStyle: 'rounded-full',
      skillStyle: 'tags',
      experienceStyle: 'timeline',
    },
  },
  centered: {
    name: 'Centrerad',
    layout: 'top' as const,
    palette: 'centered',
    features: {
      photoStyle: 'rounded-full',
      skillStyle: 'pills',
      experienceStyle: 'cards',
    },
  },
  minimal: {
    name: 'Minimal',
    layout: 'clean' as const,
    palette: 'minimal',
    features: {
      photoStyle: 'rounded-lg',
      skillStyle: 'simple',
      experienceStyle: 'clean',
    },
  },
  creative: {
    name: 'Kreativ',
    layout: 'split' as const,
    palette: 'creative',
    features: {
      photoStyle: 'rounded-2xl',
      skillStyle: 'progress',
      experienceStyle: 'cards',
    },
  },
  executive: {
    name: 'Executive',
    layout: 'top' as const,
    palette: 'executive',
    features: {
      photoStyle: 'rounded-lg',
      skillStyle: 'elegant',
      experienceStyle: 'elegant',
    },
  },
  nordic: {
    name: 'Nordisk',
    layout: 'sidebar' as const,
    palette: 'nordic',
    features: {
      photoStyle: 'rounded-2xl',
      skillStyle: 'soft',
      experienceStyle: 'timeline',
    },
  },
}

// ============================================================================
// HELPER FUNCTIONS
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

const getLanguageLevelWidth = (level: string): string => {
  const widthMap: Record<string, string> = {
    'native': '100%',
    'fluent': '85%',
    'good': '70%',
    'basic': '50%',
    'Modersmål': '100%',
    'Flytande': '85%',
    'God': '70%',
    'Grundläggande': '50%',
  }
  return widthMap[level] || '50%'
}

const getSkillName = (skill: string | { name: string; category?: string }): string => {
  return typeof skill === 'string' ? skill : skill?.name || ''
}

// ============================================================================
// REUSABLE COMPONENTS
// ============================================================================

// Section Label - uppercase tracking
const SectionLabel = ({
  children,
  color = '#A1A1AA',
  style = {}
}: {
  children: React.ReactNode
  color?: string
  style?: React.CSSProperties
}) => (
  <div
    style={{
      fontSize: TYPOGRAPHY.label.size,
      lineHeight: TYPOGRAPHY.label.lineHeight,
      fontWeight: TYPOGRAPHY.label.weight,
      letterSpacing: TYPOGRAPHY.label.letterSpacing,
      textTransform: 'uppercase',
      color,
      marginBottom: SPACING.md,
      ...style
    }}
  >
    {children}
  </div>
)

// Section Title with optional icon
const SectionTitle = ({
  children,
  icon: Icon,
  color = '#18181B',
  accentColor = '#3B82F6',
}: {
  children: React.ReactNode
  icon?: typeof Briefcase
  color?: string
  accentColor?: string
}) => (
  <h2
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: SPACING.sm,
      fontSize: TYPOGRAPHY.titleSm.size,
      lineHeight: TYPOGRAPHY.titleSm.lineHeight,
      fontWeight: TYPOGRAPHY.titleSm.weight,
      letterSpacing: TYPOGRAPHY.titleSm.letterSpacing,
      color,
      marginBottom: SPACING.lg,
    }}
  >
    {Icon && <Icon style={{ width: '20px', height: '20px', color: accentColor }} />}
    {children}
  </h2>
)

// Contact Item
const ContactItem = ({
  icon: Icon,
  children,
  href,
  light = false,
  accentColor = '#3B82F6',
}: {
  icon: typeof Mail
  children: React.ReactNode
  href?: string
  light?: boolean
  accentColor?: string
}) => {
  const content = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.md,
        padding: `${SPACING.sm} 0`,
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: light ? 'rgba(255,255,255,0.1)' : `${accentColor}10`,
          flexShrink: 0,
        }}
      >
        <Icon style={{ width: '18px', height: '18px', color: light ? '#fff' : accentColor }} />
      </div>
      <span
        style={{
          fontSize: TYPOGRAPHY.caption.size,
          lineHeight: TYPOGRAPHY.caption.lineHeight,
          wordBreak: 'break-all',
        }}
      >
        {children}
      </span>
    </div>
  )

  if (href) {
    return <a href={href} style={{ textDecoration: 'none', color: 'inherit' }}>{content}</a>
  }
  return content
}

// Skill Tag
const SkillTag = ({
  children,
  variant = 'default',
  accentColor = '#3B82F6',
  accentLight = '#EFF6FF',
}: {
  children: React.ReactNode
  variant?: 'default' | 'light' | 'outline' | 'minimal'
  accentColor?: string
  accentLight?: string
}) => {
  const styles: Record<string, React.CSSProperties> = {
    default: {
      background: accentLight,
      color: accentColor,
      padding: `${SPACING.sm} ${SPACING.md}`,
      borderRadius: '8px',
    },
    light: {
      background: 'rgba(255,255,255,0.15)',
      color: '#fff',
      padding: `${SPACING.sm} ${SPACING.md}`,
      borderRadius: '8px',
    },
    outline: {
      background: 'transparent',
      border: `1px solid ${accentColor}40`,
      color: accentColor,
      padding: `6px ${SPACING.md}`,
      borderRadius: '6px',
    },
    minimal: {
      background: '#F4F4F5',
      color: '#52525B',
      padding: `6px 12px`,
      borderRadius: '4px',
    },
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        fontSize: TYPOGRAPHY.micro.size,
        lineHeight: TYPOGRAPHY.micro.lineHeight,
        fontWeight: TYPOGRAPHY.micro.weight,
        ...styles[variant],
      }}
    >
      {children}
    </span>
  )
}

// Timeline Item
const TimelineItem = ({
  title,
  subtitle,
  period,
  description,
  accentColor = '#3B82F6',
  textColor = '#18181B',
  mutedColor = '#A1A1AA',
  isLast = false,
}: {
  title: string
  subtitle: string
  period: string
  description?: string
  accentColor?: string
  textColor?: string
  mutedColor?: string
  isLast?: boolean
}) => (
  <div
    style={{
      position: 'relative',
      paddingLeft: SPACING.lg,
      paddingBottom: isLast ? 0 : SPACING.lg,
    }}
  >
    {/* Timeline line */}
    {!isLast && (
      <div
        style={{
          position: 'absolute',
          left: '5px',
          top: '12px',
          bottom: 0,
          width: '2px',
          background: `${accentColor}20`,
        }}
      />
    )}

    {/* Timeline dot */}
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: '4px',
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        background: accentColor,
        border: '3px solid #fff',
        boxShadow: `0 0 0 2px ${accentColor}30`,
      }}
    />

    {/* Content */}
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
        <h3
          style={{
            fontSize: TYPOGRAPHY.body.size,
            lineHeight: TYPOGRAPHY.body.lineHeight,
            fontWeight: '600',
            color: textColor,
          }}
        >
          {title}
        </h3>
        <span
          style={{
            fontSize: TYPOGRAPHY.micro.size,
            fontWeight: '500',
            color: accentColor,
            background: `${accentColor}10`,
            padding: '4px 10px',
            borderRadius: '20px',
            whiteSpace: 'nowrap',
            marginLeft: SPACING.md,
          }}
        >
          {period}
        </span>
      </div>
      <div
        style={{
          fontSize: TYPOGRAPHY.caption.size,
          fontWeight: '500',
          color: accentColor,
          marginBottom: description ? SPACING.sm : 0,
        }}
      >
        {subtitle}
      </div>
      {description && (
        <p
          style={{
            fontSize: TYPOGRAPHY.caption.size,
            lineHeight: '22px',
            color: mutedColor,
            margin: 0,
          }}
        >
          {description}
        </p>
      )}
    </div>
  </div>
)

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CVPreview({ data }: CVPreviewProps) {
  const templateConfig = TEMPLATES[data.template as keyof typeof TEMPLATES] || TEMPLATES.sidebar
  const palette = PALETTES[templateConfig.palette as keyof typeof PALETTES] || PALETTES.modern
  const fullName = `${data.firstName} ${data.lastName}`.trim() || 'Ditt Namn'

  // Check if there's any meaningful content
  const hasContent = !!(
    data.firstName ||
    data.lastName ||
    data.email ||
    data.phone ||
    data.summary ||
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
          background: 'linear-gradient(180deg, #FAFAFA 0%, #F4F4F5 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: SPACING['3xl'],
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            background: '#E4E4E7',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: SPACING.lg,
          }}
        >
          <Sparkles style={{ width: '40px', height: '40px', color: '#A1A1AA' }} />
        </div>
        <h3
          style={{
            fontSize: TYPOGRAPHY.title.size,
            fontWeight: TYPOGRAPHY.title.weight,
            color: '#52525B',
            marginBottom: SPACING.sm,
          }}
        >
          Förhandsvisning
        </h3>
        <p style={{ fontSize: TYPOGRAPHY.body.size, color: '#A1A1AA', maxWidth: '280px' }}>
          Börja fylla i dina uppgifter för att se hur ditt CV kommer att se ut
        </p>
      </div>
    )
  }

  // ============================================================================
  // SIDEBAR LAYOUT (Modern, Nordic)
  // ============================================================================
  if (templateConfig.layout === 'sidebar') {
    const sidebarPalette = 'sidebar' in palette ? palette.sidebar : null
    const mainPalette = palette.main
    const isNordic = data.template === 'nordic'

    return (
      <div
        className="cv-preview"
        style={{
          display: 'flex',
          minHeight: '297mm',
          background: mainPalette.bg,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Sidebar */}
        <aside
          style={{
            width: '35%',
            padding: SPACING['2xl'],
            background: sidebarPalette?.bg || '#18181B',
            color: sidebarPalette?.text || '#FAFAFA',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Profile Photo */}
          <div style={{ marginBottom: SPACING['2xl'], textAlign: 'center' }}>
            {data.profileImage ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={data.profileImage}
                  alt=""
                  style={{
                    width: '160px',
                    height: '160px',
                    objectFit: 'cover',
                    borderRadius: templateConfig.features.photoStyle === 'rounded-full' ? '50%' : '24px',
                    border: '4px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-8px',
                    right: '-8px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: sidebarPalette?.accent || '#3B82F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  }}
                >
                  <Sparkles style={{ width: '16px', height: '16px', color: '#fff' }} />
                </div>
              </div>
            ) : (
              <div
                style={{
                  width: '160px',
                  height: '160px',
                  borderRadius: templateConfig.features.photoStyle === 'rounded-full' ? '50%' : '24px',
                  background: sidebarPalette?.accentMuted || 'rgba(255,255,255,0.1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '4px solid rgba(255,255,255,0.1)',
                }}
              >
                <span style={{ fontSize: '64px', opacity: 0.4 }}>👤</span>
              </div>
            )}
          </div>

          {/* Contact Section */}
          <div style={{ marginBottom: SPACING['2xl'] }}>
            <SectionLabel color={sidebarPalette?.textMuted}>Kontakt</SectionLabel>
            <div>
              {data.email && (
                <ContactItem
                  icon={Mail}
                  href={`mailto:${data.email}`}
                  light={!isNordic}
                  accentColor={sidebarPalette?.accent}
                >
                  {data.email}
                </ContactItem>
              )}
              {data.phone && (
                <ContactItem
                  icon={Phone}
                  href={`tel:${data.phone}`}
                  light={!isNordic}
                  accentColor={sidebarPalette?.accent}
                >
                  {data.phone}
                </ContactItem>
              )}
              {data.location && (
                <ContactItem
                  icon={MapPin}
                  light={!isNordic}
                  accentColor={sidebarPalette?.accent}
                >
                  {data.location}
                </ContactItem>
              )}
            </div>
          </div>

          {/* Skills */}
          {data.skills?.length > 0 && (
            <div style={{ marginBottom: SPACING['2xl'] }}>
              <SectionLabel color={sidebarPalette?.textMuted}>Expertis</SectionLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING.sm }}>
                {data.skills.slice(0, 10).map((skill, i) => (
                  <SkillTag
                    key={i}
                    variant={isNordic ? 'default' : 'light'}
                    accentColor={sidebarPalette?.accent}
                    accentLight={sidebarPalette?.accentMuted}
                  >
                    {getSkillName(skill)}
                  </SkillTag>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {data.languages?.length > 0 && (
            <div style={{ marginBottom: SPACING['2xl'] }}>
              <SectionLabel color={sidebarPalette?.textMuted}>Språk</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
                {data.languages.map(lang => {
                  const languageName = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                  return (
                    <div key={lang.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: TYPOGRAPHY.caption.size, fontWeight: '500' }}>
                          {languageName}
                        </span>
                        <span
                          style={{
                            fontSize: TYPOGRAPHY.micro.size,
                            opacity: 0.7,
                          }}
                        >
                          {getLanguageLevelDisplay(lang.level)}
                        </span>
                      </div>
                      <div
                        style={{
                          height: '4px',
                          borderRadius: '2px',
                          background: sidebarPalette?.accentMuted || 'rgba(255,255,255,0.15)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: getLanguageLevelWidth(lang.level),
                            background: sidebarPalette?.accent || '#3B82F6',
                            borderRadius: '2px',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Certificates */}
          {data.certificates?.length > 0 && (
            <div style={{ marginTop: 'auto' }}>
              <SectionLabel color={sidebarPalette?.textMuted}>Certifieringar</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
                {data.certificates.map(cert => (
                  <div key={cert.id} style={{ display: 'flex', alignItems: 'flex-start', gap: SPACING.sm }}>
                    <Award
                      style={{
                        width: '16px',
                        height: '16px',
                        marginTop: '2px',
                        color: sidebarPalette?.accent,
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ fontSize: TYPOGRAPHY.caption.size, fontWeight: '500' }}>
                        {cert.name}
                      </div>
                      <div
                        style={{
                          fontSize: TYPOGRAPHY.micro.size,
                          opacity: 0.6,
                        }}
                      >
                        {cert.issuer}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main style={{ width: '65%', padding: SPACING['2xl'], background: mainPalette.bg }}>
          {/* Header */}
          <header
            style={{
              marginBottom: SPACING['2xl'],
              paddingBottom: SPACING['2xl'],
              borderBottom: `2px solid ${mainPalette.border}`,
            }}
          >
            <h1
              style={{
                fontSize: TYPOGRAPHY.display.size,
                lineHeight: TYPOGRAPHY.display.lineHeight,
                fontWeight: TYPOGRAPHY.display.weight,
                letterSpacing: TYPOGRAPHY.display.letterSpacing,
                color: mainPalette.text,
                marginBottom: SPACING.sm,
              }}
            >
              {fullName}
            </h1>
            {data.title && (
              <p
                style={{
                  fontSize: TYPOGRAPHY.title.size,
                  lineHeight: TYPOGRAPHY.title.lineHeight,
                  fontWeight: '500',
                  color: mainPalette.accent,
                }}
              >
                {data.title}
              </p>
            )}
          </header>

          {/* Profile Summary */}
          {data.summary && (
            <section style={{ marginBottom: SPACING['2xl'] }}>
              <SectionTitle icon={Sparkles} color={mainPalette.text} accentColor={mainPalette.accent}>
                Profil
              </SectionTitle>
              <p
                style={{
                  fontSize: TYPOGRAPHY.bodyLg.size,
                  lineHeight: TYPOGRAPHY.bodyLg.lineHeight,
                  color: mainPalette.textSecondary,
                }}
              >
                {data.summary}
              </p>
            </section>
          )}

          {/* Work Experience */}
          {data.workExperience?.length > 0 && (
            <section style={{ marginBottom: SPACING['2xl'] }}>
              <SectionTitle icon={Briefcase} color={mainPalette.text} accentColor={mainPalette.accent}>
                Arbetslivserfarenhet
              </SectionTitle>
              <div>
                {data.workExperience.map((job, index) => (
                  <TimelineItem
                    key={job.id}
                    title={job.title}
                    subtitle={`${job.company}${job.location ? ` • ${job.location}` : ''}`}
                    period={`${job.startDate} – ${job.current ? 'Nu' : job.endDate}`}
                    description={job.description}
                    accentColor={mainPalette.accent}
                    textColor={mainPalette.text}
                    mutedColor={mainPalette.textMuted}
                    isLast={index === data.workExperience.length - 1}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {data.education?.length > 0 && (
            <section>
              <SectionTitle icon={GraduationCap} color={mainPalette.text} accentColor={mainPalette.accent}>
                Utbildning
              </SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
                {data.education.map(edu => (
                  <div
                    key={edu.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: TYPOGRAPHY.body.size,
                          fontWeight: '600',
                          color: mainPalette.text,
                          marginBottom: '2px',
                        }}
                      >
                        {edu.degree}
                      </h3>
                      <div
                        style={{
                          fontSize: TYPOGRAPHY.caption.size,
                          fontWeight: '500',
                          color: mainPalette.accent,
                        }}
                      >
                        {edu.school}
                      </div>
                      {edu.field && (
                        <div
                          style={{
                            fontSize: TYPOGRAPHY.caption.size,
                            color: mainPalette.textMuted,
                          }}
                        >
                          {edu.field}
                        </div>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: TYPOGRAPHY.micro.size,
                        fontWeight: '500',
                        color: mainPalette.accent,
                        background: mainPalette.accentLight,
                        padding: '4px 12px',
                        borderRadius: '20px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {edu.startDate} – {edu.endDate}
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
  // CLEAN LAYOUT (Minimal)
  // ============================================================================
  if (templateConfig.layout === 'clean') {
    const mainPalette = palette.main

    return (
      <div
        className="cv-preview"
        style={{
          minHeight: '297mm',
          background: mainPalette.bg,
          padding: SPACING['3xl'],
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Clean Header */}
        <header
          style={{
            marginBottom: SPACING['3xl'],
            textAlign: 'center',
          }}
        >
          {data.profileImage && (
            <img
              src={data.profileImage}
              alt=""
              style={{
                width: '100px',
                height: '100px',
                objectFit: 'cover',
                borderRadius: '16px',
                marginBottom: SPACING.lg,
              }}
            />
          )}
          <h1
            style={{
              fontSize: '42px',
              lineHeight: '48px',
              fontWeight: '700',
              letterSpacing: '-0.02em',
              color: mainPalette.text,
              marginBottom: SPACING.sm,
            }}
          >
            {fullName}
          </h1>
          {data.title && (
            <p
              style={{
                fontSize: TYPOGRAPHY.title.size,
                color: mainPalette.textSecondary,
                marginBottom: SPACING.lg,
              }}
            >
              {data.title}
            </p>
          )}

          {/* Contact row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: SPACING.xl,
              flexWrap: 'wrap',
            }}
          >
            {data.email && (
              <a
                href={`mailto:${data.email}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: SPACING.sm,
                  fontSize: TYPOGRAPHY.caption.size,
                  color: mainPalette.textSecondary,
                  textDecoration: 'none',
                }}
              >
                <Mail style={{ width: '16px', height: '16px' }} />
                {data.email}
              </a>
            )}
            {data.phone && (
              <a
                href={`tel:${data.phone}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: SPACING.sm,
                  fontSize: TYPOGRAPHY.caption.size,
                  color: mainPalette.textSecondary,
                  textDecoration: 'none',
                }}
              >
                <Phone style={{ width: '16px', height: '16px' }} />
                {data.phone}
              </a>
            )}
            {data.location && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: SPACING.sm,
                  fontSize: TYPOGRAPHY.caption.size,
                  color: mainPalette.textSecondary,
                }}
              >
                <MapPin style={{ width: '16px', height: '16px' }} />
                {data.location}
              </span>
            )}
          </div>
        </header>

        {/* Divider */}
        <div
          style={{
            height: '1px',
            background: mainPalette.border,
            marginBottom: SPACING['2xl'],
          }}
        />

        {/* Summary */}
        {data.summary && (
          <section style={{ marginBottom: SPACING['2xl'] }}>
            <p
              style={{
                fontSize: TYPOGRAPHY.bodyLg.size,
                lineHeight: '30px',
                color: mainPalette.textSecondary,
                textAlign: 'center',
                maxWidth: '700px',
                margin: '0 auto',
              }}
            >
              {data.summary}
            </p>
          </section>
        )}

        {/* Skills - Simple tags */}
        {data.skills?.length > 0 && (
          <section style={{ marginBottom: SPACING['2xl'], textAlign: 'center' }}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: SPACING.sm,
                justifyContent: 'center',
              }}
            >
              {data.skills.map((skill, i) => (
                <SkillTag key={i} variant="minimal">
                  {getSkillName(skill)}
                </SkillTag>
              ))}
            </div>
          </section>
        )}

        {/* Two Column Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: SPACING['2xl'],
          }}
        >
          {/* Experience */}
          {data.workExperience?.length > 0 && (
            <section>
              <h2
                style={{
                  fontSize: TYPOGRAPHY.micro.size,
                  fontWeight: '600',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: mainPalette.textMuted,
                  marginBottom: SPACING.lg,
                  paddingBottom: SPACING.sm,
                  borderBottom: `2px solid ${mainPalette.border}`,
                }}
              >
                Erfarenhet
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
                {data.workExperience.map(job => (
                  <div key={job.id}>
                    <div
                      style={{
                        fontSize: TYPOGRAPHY.micro.size,
                        color: mainPalette.textMuted,
                        marginBottom: '4px',
                      }}
                    >
                      {job.startDate} – {job.current ? 'Nu' : job.endDate}
                    </div>
                    <h3
                      style={{
                        fontSize: TYPOGRAPHY.body.size,
                        fontWeight: '600',
                        color: mainPalette.text,
                      }}
                    >
                      {job.title}
                    </h3>
                    <div
                      style={{
                        fontSize: TYPOGRAPHY.caption.size,
                        color: mainPalette.textSecondary,
                        marginBottom: job.description ? SPACING.sm : 0,
                      }}
                    >
                      {job.company}
                    </div>
                    {job.description && (
                      <p
                        style={{
                          fontSize: TYPOGRAPHY.caption.size,
                          color: mainPalette.textMuted,
                          lineHeight: '20px',
                          margin: 0,
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

          {/* Right column */}
          <div>
            {/* Education */}
            {data.education?.length > 0 && (
              <section style={{ marginBottom: SPACING.xl }}>
                <h2
                  style={{
                    fontSize: TYPOGRAPHY.micro.size,
                    fontWeight: '600',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: mainPalette.textMuted,
                    marginBottom: SPACING.lg,
                    paddingBottom: SPACING.sm,
                    borderBottom: `2px solid ${mainPalette.border}`,
                  }}
                >
                  Utbildning
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
                  {data.education.map(edu => (
                    <div key={edu.id}>
                      <div
                        style={{
                          fontSize: TYPOGRAPHY.micro.size,
                          color: mainPalette.textMuted,
                          marginBottom: '2px',
                        }}
                      >
                        {edu.startDate} – {edu.endDate}
                      </div>
                      <h3
                        style={{
                          fontSize: TYPOGRAPHY.body.size,
                          fontWeight: '600',
                          color: mainPalette.text,
                        }}
                      >
                        {edu.degree}
                      </h3>
                      <div style={{ fontSize: TYPOGRAPHY.caption.size, color: mainPalette.textSecondary }}>
                        {edu.school}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Languages */}
            {data.languages?.length > 0 && (
              <section style={{ marginBottom: SPACING.xl }}>
                <h2
                  style={{
                    fontSize: TYPOGRAPHY.micro.size,
                    fontWeight: '600',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: mainPalette.textMuted,
                    marginBottom: SPACING.lg,
                    paddingBottom: SPACING.sm,
                    borderBottom: `2px solid ${mainPalette.border}`,
                  }}
                >
                  Språk
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
                  {data.languages.map(lang => {
                    const languageName = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                    return (
                      <div
                        key={lang.id}
                        style={{ display: 'flex', justifyContent: 'space-between' }}
                      >
                        <span style={{ fontSize: TYPOGRAPHY.caption.size, color: mainPalette.text }}>
                          {languageName}
                        </span>
                        <span style={{ fontSize: TYPOGRAPHY.caption.size, color: mainPalette.textMuted }}>
                          {getLanguageLevelDisplay(lang.level)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Certificates */}
            {data.certificates?.length > 0 && (
              <section>
                <h2
                  style={{
                    fontSize: TYPOGRAPHY.micro.size,
                    fontWeight: '600',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: mainPalette.textMuted,
                    marginBottom: SPACING.lg,
                    paddingBottom: SPACING.sm,
                    borderBottom: `2px solid ${mainPalette.border}`,
                  }}
                >
                  Certifikat
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
                  {data.certificates.map(cert => (
                    <div
                      key={cert.id}
                      style={{ display: 'flex', justifyContent: 'space-between' }}
                    >
                      <span style={{ fontSize: TYPOGRAPHY.caption.size, color: mainPalette.text }}>
                        {cert.name}
                      </span>
                      <span style={{ fontSize: TYPOGRAPHY.caption.size, color: mainPalette.textMuted }}>
                        {cert.date}
                      </span>
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
  // TOP LAYOUT (Centered, Executive)
  // ============================================================================
  if (templateConfig.layout === 'top') {
    const headerPalette = 'header' in palette ? palette.header : null
    const mainPalette = palette.main
    const isExecutive = data.template === 'executive'
    const isCentered = data.template === 'centered'

    return (
      <div
        className="cv-preview"
        style={{
          minHeight: '297mm',
          background: mainPalette.bg,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Hero Header */}
        <header
          style={{
            position: 'relative',
            padding: `${SPACING['3xl']} ${SPACING['2xl']}`,
            background: headerPalette?.bg || '#0C0A09',
            color: headerPalette?.text || '#FAFAF9',
            overflow: 'hidden',
          }}
        >
          {/* Decorative gradient orb for centered template */}
          {isCentered && (
            <div
              style={{
                position: 'absolute',
                top: '-50%',
                right: '-20%',
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                borderRadius: '50%',
              }}
            />
          )}

          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: data.profileImage ? 'center' : 'center',
              justifyContent: data.profileImage ? 'flex-start' : 'center',
              gap: SPACING.xl,
              textAlign: data.profileImage ? 'left' : 'center',
              flexDirection: data.profileImage ? 'row' : 'column',
            }}
          >
            {/* Profile Image */}
            {data.profileImage && (
              <div style={{ position: 'relative' }}>
                <img
                  src={data.profileImage}
                  alt=""
                  style={{
                    width: '140px',
                    height: '140px',
                    objectFit: 'cover',
                    borderRadius: isCentered ? '50%' : '20px',
                    border: '4px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                  }}
                />
                {isExecutive && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-4px',
                      right: '-4px',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: headerPalette?.accent || '#CA8A04',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    }}
                  >
                    <Award style={{ width: '18px', height: '18px', color: '#fff' }} />
                  </div>
                )}
              </div>
            )}

            {/* Text Content */}
            <div style={{ flex: 1 }}>
              <h1
                style={{
                  fontSize: isExecutive ? '52px' : TYPOGRAPHY.display.size,
                  lineHeight: isExecutive ? '60px' : TYPOGRAPHY.display.lineHeight,
                  fontWeight: TYPOGRAPHY.display.weight,
                  letterSpacing: TYPOGRAPHY.display.letterSpacing,
                  fontFamily: isExecutive ? 'Georgia, serif' : 'inherit',
                  marginBottom: SPACING.sm,
                }}
              >
                {fullName}
              </h1>
              {data.title && (
                <p
                  style={{
                    fontSize: TYPOGRAPHY.title.size,
                    lineHeight: TYPOGRAPHY.title.lineHeight,
                    fontStyle: isExecutive ? 'italic' : 'normal',
                    opacity: 0.9,
                    marginBottom: SPACING.lg,
                  }}
                >
                  {data.title}
                </p>
              )}

              {/* Contact Pills */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: SPACING.sm,
                  justifyContent: data.profileImage ? 'flex-start' : 'center',
                }}
              >
                {data.email && (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: SPACING.sm,
                      padding: `${SPACING.sm} ${SPACING.md}`,
                      borderRadius: '24px',
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      fontSize: TYPOGRAPHY.caption.size,
                    }}
                  >
                    <Mail style={{ width: '14px', height: '14px' }} />
                    {data.email}
                  </span>
                )}
                {data.phone && (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: SPACING.sm,
                      padding: `${SPACING.sm} ${SPACING.md}`,
                      borderRadius: '24px',
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      fontSize: TYPOGRAPHY.caption.size,
                    }}
                  >
                    <Phone style={{ width: '14px', height: '14px' }} />
                    {data.phone}
                  </span>
                )}
                {data.location && (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: SPACING.sm,
                      padding: `${SPACING.sm} ${SPACING.md}`,
                      borderRadius: '24px',
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      fontSize: TYPOGRAPHY.caption.size,
                    }}
                  >
                    <MapPin style={{ width: '14px', height: '14px' }} />
                    {data.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ padding: SPACING['2xl'] }}>
          {/* Summary + Languages Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: data.languages?.length > 0 ? '2fr 1fr' : '1fr',
              gap: SPACING['2xl'],
              marginBottom: SPACING['2xl'],
            }}
          >
            {data.summary && (
              <section>
                <SectionTitle
                  icon={Sparkles}
                  color={mainPalette.text}
                  accentColor={mainPalette.accent}
                >
                  Om mig
                </SectionTitle>
                <p
                  style={{
                    fontSize: TYPOGRAPHY.bodyLg.size,
                    lineHeight: '30px',
                    color: mainPalette.textSecondary,
                  }}
                >
                  {data.summary}
                </p>
              </section>
            )}

            {data.languages?.length > 0 && (
              <div
                style={{
                  background: mainPalette.accentLight,
                  borderRadius: '16px',
                  padding: SPACING.lg,
                }}
              >
                <h3
                  style={{
                    fontSize: TYPOGRAPHY.micro.size,
                    fontWeight: '600',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: mainPalette.accent,
                    marginBottom: SPACING.md,
                  }}
                >
                  Språk
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
                  {data.languages.map(lang => {
                    const languageName = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                    return (
                      <div
                        key={lang.id}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <span style={{ fontSize: TYPOGRAPHY.caption.size, color: mainPalette.text }}>
                          {languageName}
                        </span>
                        <span
                          style={{
                            fontSize: TYPOGRAPHY.micro.size,
                            color: mainPalette.textMuted,
                          }}
                        >
                          {getLanguageLevelDisplay(lang.level)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Skills */}
          {data.skills?.length > 0 && (
            <section style={{ marginBottom: SPACING['2xl'] }}>
              <SectionTitle color={mainPalette.text} accentColor={mainPalette.accent}>
                Kompetenser
              </SectionTitle>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING.sm }}>
                {data.skills.map((skill, i) => (
                  <SkillTag
                    key={i}
                    variant={isExecutive ? 'outline' : 'default'}
                    accentColor={mainPalette.accent}
                    accentLight={mainPalette.accentLight}
                  >
                    {getSkillName(skill)}
                  </SkillTag>
                ))}
              </div>
            </section>
          )}

          {/* Experience & Education Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: SPACING['2xl'],
            }}
          >
            {/* Experience */}
            {data.workExperience?.length > 0 && (
              <section>
                <SectionTitle
                  icon={Briefcase}
                  color={mainPalette.text}
                  accentColor={mainPalette.accent}
                >
                  Erfarenhet
                </SectionTitle>
                <div>
                  {data.workExperience.map((job, index) => (
                    <TimelineItem
                      key={job.id}
                      title={job.title}
                      subtitle={job.company}
                      period={`${job.startDate} – ${job.current ? 'Nu' : job.endDate}`}
                      description={job.description}
                      accentColor={mainPalette.accent}
                      textColor={mainPalette.text}
                      mutedColor={mainPalette.textMuted}
                      isLast={index === data.workExperience.length - 1}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Right Column */}
            <div>
              {/* Education */}
              {data.education?.length > 0 && (
                <section style={{ marginBottom: SPACING.xl }}>
                  <SectionTitle
                    icon={GraduationCap}
                    color={mainPalette.text}
                    accentColor={mainPalette.accent}
                  >
                    Utbildning
                  </SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
                    {data.education.map(edu => (
                      <div
                        key={edu.id}
                        style={{
                          padding: SPACING.md,
                          borderRadius: '12px',
                          background: mainPalette.accentLight,
                          borderLeft: `4px solid ${mainPalette.accent}`,
                        }}
                      >
                        <h3
                          style={{
                            fontSize: TYPOGRAPHY.body.size,
                            fontWeight: '600',
                            color: mainPalette.text,
                          }}
                        >
                          {edu.degree}
                        </h3>
                        <div style={{ fontSize: TYPOGRAPHY.caption.size, color: mainPalette.accent }}>
                          {edu.school}
                        </div>
                        <div
                          style={{
                            fontSize: TYPOGRAPHY.micro.size,
                            color: mainPalette.textMuted,
                            marginTop: '4px',
                          }}
                        >
                          {edu.startDate} – {edu.endDate}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Certificates */}
              {data.certificates?.length > 0 && (
                <section>
                  <SectionTitle
                    icon={Award}
                    color={mainPalette.text}
                    accentColor={mainPalette.accent}
                  >
                    Certifikat
                  </SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
                    {data.certificates.map(cert => (
                      <div
                        key={cert.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: `${SPACING.sm} 0`,
                          borderBottom: `1px solid ${mainPalette.border}`,
                        }}
                      >
                        <span style={{ fontSize: TYPOGRAPHY.caption.size, color: mainPalette.text }}>
                          {cert.name}
                        </span>
                        <span style={{ fontSize: TYPOGRAPHY.micro.size, color: mainPalette.textMuted }}>
                          {cert.date}
                        </span>
                      </div>
                    ))}
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
  // SPLIT LAYOUT (Creative)
  // ============================================================================
  const sidebarPalette = 'sidebar' in palette ? palette.sidebar : null
  const mainPalette = palette.main

  return (
    <div
      className="cv-preview"
      style={{
        display: 'flex',
        minHeight: '297mm',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Left Column - Gradient */}
      <aside
        style={{
          width: '40%',
          padding: SPACING['2xl'],
          background: sidebarPalette?.bg || 'linear-gradient(180deg, #7C3AED 0%, #5B21B6 100%)',
          color: sidebarPalette?.text || '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Photo */}
        <div style={{ marginBottom: SPACING['2xl'], textAlign: 'center' }}>
          {data.profileImage ? (
            <img
              src={data.profileImage}
              alt=""
              style={{
                width: '180px',
                height: '180px',
                objectFit: 'cover',
                borderRadius: '32px',
                border: '4px solid rgba(255,255,255,0.2)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              }}
            />
          ) : (
            <div
              style={{
                width: '180px',
                height: '180px',
                borderRadius: '32px',
                background: 'rgba(255,255,255,0.1)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '4px solid rgba(255,255,255,0.1)',
              }}
            >
              <span style={{ fontSize: '72px', opacity: 0.4 }}>👤</span>
            </div>
          )}
        </div>

        {/* Name & Title */}
        <h1
          style={{
            fontSize: '32px',
            lineHeight: '40px',
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: SPACING.sm,
          }}
        >
          {fullName}
        </h1>
        {data.title && (
          <p
            style={{
              fontSize: TYPOGRAPHY.body.size,
              textAlign: 'center',
              opacity: 0.9,
              marginBottom: SPACING.xl,
            }}
          >
            {data.title}
          </p>
        )}

        {/* Contact Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm, marginBottom: SPACING['2xl'] }}>
          {data.email && (
            <a
              href={`mailto:${data.email}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.md,
                padding: SPACING.md,
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.1)',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <Mail style={{ width: '20px', height: '20px' }} />
              <span style={{ fontSize: TYPOGRAPHY.caption.size }}>{data.email}</span>
            </a>
          )}
          {data.phone && (
            <a
              href={`tel:${data.phone}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.md,
                padding: SPACING.md,
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.1)',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <Phone style={{ width: '20px', height: '20px' }} />
              <span style={{ fontSize: TYPOGRAPHY.caption.size }}>{data.phone}</span>
            </a>
          )}
          {data.location && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.md,
                padding: SPACING.md,
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.1)',
              }}
            >
              <MapPin style={{ width: '20px', height: '20px' }} />
              <span style={{ fontSize: TYPOGRAPHY.caption.size }}>{data.location}</span>
            </div>
          )}
        </div>

        {/* Languages with Progress */}
        {data.languages?.length > 0 && (
          <div style={{ marginTop: 'auto' }}>
            <SectionLabel color="rgba(255,255,255,0.6)">Språk</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
              {data.languages.map(lang => {
                const languageName = lang.language || ('name' in lang ? (lang as { name: string }).name : '')
                return (
                  <div key={lang.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: TYPOGRAPHY.caption.size }}>{languageName}</span>
                      <span style={{ fontSize: TYPOGRAPHY.micro.size, opacity: 0.7 }}>
                        {getLanguageLevelDisplay(lang.level)}
                      </span>
                    </div>
                    <div
                      style={{
                        height: '6px',
                        borderRadius: '3px',
                        background: 'rgba(255,255,255,0.2)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: getLanguageLevelWidth(lang.level),
                          background: '#fff',
                          borderRadius: '3px',
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

      {/* Right Column - Content */}
      <main
        style={{
          width: '60%',
          padding: SPACING['2xl'],
          background: mainPalette.bg,
        }}
      >
        {/* Summary */}
        {data.summary && (
          <section style={{ marginBottom: SPACING['2xl'] }}>
            <h2
              style={{
                fontSize: TYPOGRAPHY.title.size,
                fontWeight: '700',
                color: mainPalette.text,
                marginBottom: SPACING.md,
              }}
            >
              Profil
            </h2>
            <p
              style={{
                fontSize: TYPOGRAPHY.body.size,
                lineHeight: '26px',
                color: mainPalette.textSecondary,
              }}
            >
              {data.summary}
            </p>
          </section>
        )}

        {/* Experience Cards */}
        {data.workExperience?.length > 0 && (
          <section style={{ marginBottom: SPACING['2xl'] }}>
            <h2
              style={{
                fontSize: TYPOGRAPHY.title.size,
                fontWeight: '700',
                color: mainPalette.text,
                marginBottom: SPACING.lg,
              }}
            >
              Erfarenhet
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
              {data.workExperience.map(job => (
                <div
                  key={job.id}
                  style={{
                    background: '#fff',
                    padding: SPACING.lg,
                    borderRadius: '20px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm }}>
                    <h3
                      style={{
                        fontSize: TYPOGRAPHY.body.size,
                        fontWeight: '600',
                        color: mainPalette.text,
                      }}
                    >
                      {job.title}
                    </h3>
                    <span
                      style={{
                        fontSize: TYPOGRAPHY.micro.size,
                        fontWeight: '500',
                        color: mainPalette.accent,
                        background: mainPalette.accentLight,
                        padding: '4px 12px',
                        borderRadius: '20px',
                      }}
                    >
                      {job.startDate} – {job.current ? 'Nu' : job.endDate}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: TYPOGRAPHY.caption.size,
                      fontWeight: '500',
                      color: mainPalette.accent,
                      marginBottom: job.description ? SPACING.sm : 0,
                    }}
                  >
                    {job.company}
                  </div>
                  {job.description && (
                    <p
                      style={{
                        fontSize: TYPOGRAPHY.caption.size,
                        color: mainPalette.textMuted,
                        lineHeight: '22px',
                        margin: 0,
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

        {/* Skills Pills */}
        {data.skills?.length > 0 && (
          <section style={{ marginBottom: SPACING['2xl'] }}>
            <h2
              style={{
                fontSize: TYPOGRAPHY.title.size,
                fontWeight: '700',
                color: mainPalette.text,
                marginBottom: SPACING.md,
              }}
            >
              Kompetenser
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING.sm }}>
              {data.skills.map((skill, i) => (
                <span
                  key={i}
                  style={{
                    padding: `${SPACING.sm} ${SPACING.md}`,
                    background: '#fff',
                    borderRadius: '20px',
                    fontSize: TYPOGRAPHY.caption.size,
                    fontWeight: '500',
                    color: mainPalette.accent,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  {getSkillName(skill)}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Education Grid */}
        {data.education?.length > 0 && (
          <section>
            <h2
              style={{
                fontSize: TYPOGRAPHY.title.size,
                fontWeight: '700',
                color: mainPalette.text,
                marginBottom: SPACING.md,
              }}
            >
              Utbildning
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: SPACING.md,
              }}
            >
              {data.education.map(edu => (
                <div
                  key={edu.id}
                  style={{
                    background: '#fff',
                    padding: SPACING.md,
                    borderRadius: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  <h3
                    style={{
                      fontSize: TYPOGRAPHY.caption.size,
                      fontWeight: '600',
                      color: mainPalette.text,
                    }}
                  >
                    {edu.degree}
                  </h3>
                  <div style={{ fontSize: TYPOGRAPHY.micro.size, color: mainPalette.accent }}>
                    {edu.school}
                  </div>
                  <div
                    style={{
                      fontSize: TYPOGRAPHY.micro.size,
                      color: mainPalette.textMuted,
                      marginTop: '4px',
                    }}
                  >
                    {edu.startDate} – {edu.endDate}
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

export default CVPreview
