import { Document, Page, Text, View, StyleSheet, Font, Link, Svg, Path, Circle } from '@react-pdf/renderer'
import type { CVData } from '@/services/supabaseApi'

interface CVPDFProps {
  data: CVData
}

// Color schemes - utökad med fler varianter
const getColors = (schemeId: string = 'indigo') => {
  const schemes: Record<string, { primary: string; secondary: string; light: string; dark: string; accent: string }> = {
    indigo: { primary: '#4f46e5', secondary: '#6366f1', light: '#eef2ff', dark: '#312e81', accent: '#818cf8' },
    ocean: { primary: '#0284c7', secondary: '#0ea5e9', light: '#e0f2fe', dark: '#0c4a6e', accent: '#38bdf8' },
    forest: { primary: '#059669', secondary: '#10b981', light: '#d1fae5', dark: '#064e3b', accent: '#34d399' },
    berry: { primary: '#db2777', secondary: '#ec4899', light: '#fce7f3', dark: '#831843', accent: '#f472b6' },
    sunset: { primary: '#ea580c', secondary: '#f97316', light: '#ffedd5', dark: '#7c2d12', accent: '#fb923c' },
    ruby: { primary: '#dc2626', secondary: '#ef4444', light: '#fee2e2', dark: '#7f1d1d', accent: '#f87171' },
    slate: { primary: '#334155', secondary: '#475569', light: '#f1f5f9', dark: '#0f172a', accent: '#64748b' },
    violet: { primary: '#7c3aed', secondary: '#8b5cf6', light: '#ede9fe', dark: '#4c1d95', accent: '#a78bfa' },
    cyan: { primary: '#0891b2', secondary: '#06b6d4', light: '#cffafe', dark: '#164e63', accent: '#22d3ee' },
    rose: { primary: '#e11d48', secondary: '#f43f5e', light: '#ffe4e6', dark: '#881337', accent: '#fb7185' },
    gold: { primary: '#b45309', secondary: '#d97706', light: '#fef3c7', dark: '#78350f', accent: '#fbbf24' },
  }
  return schemes[schemeId] || schemes.indigo
}

// Template configurations - mer sofistikerade mallar
const getTemplateConfig = (template: string = 'modern', colors: ReturnType<typeof getColors>) => {
  const configs: Record<string, {
    layout: 'single' | 'sidebar' | 'two-column'
    headerStyle: 'full-width' | 'minimal' | 'centered' | 'split'
    accentPosition: 'left' | 'top' | 'none'
    sectionStyle: 'underline' | 'background' | 'icon' | 'sidebar'
  }> = {
    modern: { layout: 'single', headerStyle: 'full-width', accentPosition: 'none', sectionStyle: 'underline' },
    classic: { layout: 'single', headerStyle: 'minimal', accentPosition: 'top', sectionStyle: 'underline' },
    minimal: { layout: 'single', headerStyle: 'centered', accentPosition: 'none', sectionStyle: 'underline' },
    creative: { layout: 'sidebar', headerStyle: 'split', accentPosition: 'left', sectionStyle: 'background' },
    tech: { layout: 'single', headerStyle: 'full-width', accentPosition: 'left', sectionStyle: 'icon' },
    executive: { layout: 'single', headerStyle: 'full-width', accentPosition: 'top', sectionStyle: 'underline' },
    academic: { layout: 'single', headerStyle: 'minimal', accentPosition: 'top', sectionStyle: 'underline' },
    corporate: { layout: 'two-column', headerStyle: 'full-width', accentPosition: 'left', sectionStyle: 'sidebar' },
    sidebar: { layout: 'sidebar', headerStyle: 'split', accentPosition: 'left', sectionStyle: 'icon' },
    centered: { layout: 'single', headerStyle: 'centered', accentPosition: 'none', sectionStyle: 'background' },
    nordic: { layout: 'sidebar', headerStyle: 'split', accentPosition: 'left', sectionStyle: 'icon' },
  }
  return configs[template] || configs.modern
}

const getTemplateStyles = (template: string = 'modern', colors: ReturnType<typeof getColors>) => {
  switch (template) {
    case 'classic':
      return {
        header: { backgroundColor: '#ffffff', color: colors.primary, padding: 30, borderBottom: `3pt solid ${colors.primary}` },
        headerAccent: { backgroundColor: colors.light, height: 4 },
        sectionTitle: { color: colors.primary, borderBottom: `1pt solid ${colors.secondary}`, fontSize: 12, letterSpacing: 0.5 },
        skillTag: { backgroundColor: '#ffffff', color: colors.primary, border: `1pt solid ${colors.primary}`, borderRadius: 2 },
        bodyText: { color: '#1e293b' },
        mutedText: { color: '#64748b' },
      }
    case 'minimal':
      return {
        header: { backgroundColor: '#ffffff', color: '#0f172a', padding: 35, borderBottom: 'none' },
        headerAccent: { backgroundColor: 'transparent' },
        sectionTitle: { color: '#0f172a', borderBottom: `2pt solid ${colors.primary}`, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
        skillTag: { backgroundColor: '#f8fafc', color: '#334155', border: 'none', borderRadius: 3 },
        bodyText: { color: '#1e293b' },
        mutedText: { color: '#64748b' },
      }
    case 'creative':
    case 'sidebar':
      return {
        header: { backgroundColor: colors.dark, color: '#ffffff', padding: 25 },
        headerAccent: { backgroundColor: colors.primary },
        sectionTitle: { color: colors.primary, borderBottom: `2pt solid ${colors.secondary}`, fontSize: 11, letterSpacing: 0.5 },
        skillTag: { backgroundColor: colors.light, color: colors.dark, border: 'none', borderRadius: 10 },
        sidebarBg: colors.dark,
        sidebarText: '#ffffff',
        sidebarAccent: colors.accent,
        bodyText: { color: '#1e293b' },
        mutedText: { color: '#64748b' },
      }
    case 'tech':
      return {
        header: { backgroundColor: '#0f172a', color: colors.accent, padding: 28, borderLeft: `4pt solid ${colors.primary}` },
        headerAccent: { backgroundColor: colors.primary },
        sectionTitle: { color: colors.primary, borderBottom: `1pt dashed ${colors.secondary}`, fontSize: 11, letterSpacing: 1 },
        skillTag: { backgroundColor: '#1e293b', color: colors.accent, border: `1pt solid ${colors.primary}`, borderRadius: 4 },
        bodyText: { color: '#1e293b' },
        mutedText: { color: '#64748b' },
      }
    case 'executive':
      return {
        header: { backgroundColor: '#0f172a', color: '#ffffff', padding: 32 },
        headerAccent: { backgroundColor: '#d4af37', height: 3 },
        sectionTitle: { color: '#0f172a', borderBottom: `2pt solid #d4af37`, fontSize: 12, letterSpacing: 0.5 },
        skillTag: { backgroundColor: '#fef9c3', color: '#0f172a', border: `1pt solid #d4af37`, borderRadius: 2 },
        accentColor: '#d4af37',
        bodyText: { color: '#0f172a' },
        mutedText: { color: '#475569' },
      }
    case 'academic':
      return {
        header: { backgroundColor: '#ffffff', color: colors.primary, padding: 30, borderBottom: `2pt double ${colors.primary}` },
        headerAccent: { backgroundColor: colors.light },
        sectionTitle: { color: colors.primary, borderBottom: `1pt dotted ${colors.secondary}`, fontSize: 11 },
        skillTag: { backgroundColor: '#f8fafc', color: '#374151', border: `1pt solid #d1d5db`, borderRadius: 2 },
        bodyText: { color: '#1f2937' },
        mutedText: { color: '#6b7280' },
      }
    case 'corporate':
      return {
        header: { backgroundColor: colors.primary, color: '#ffffff', padding: 28 },
        headerAccent: { backgroundColor: colors.dark },
        sectionTitle: { color: colors.primary, borderLeft: `3pt solid ${colors.secondary}`, paddingLeft: 10, borderBottom: 'none', fontSize: 11 },
        skillTag: { backgroundColor: colors.light, color: colors.primary, border: 'none', borderRadius: 4 },
        bodyText: { color: '#1e293b' },
        mutedText: { color: '#64748b' },
      }
    case 'centered':
      return {
        header: { backgroundColor: colors.primary, color: '#ffffff', padding: 35, textAlign: 'center' },
        headerAccent: { backgroundColor: colors.secondary },
        sectionTitle: { color: colors.primary, borderBottom: `2pt solid ${colors.light}`, fontSize: 12, textAlign: 'center' },
        skillTag: { backgroundColor: colors.light, color: colors.primary, border: 'none', borderRadius: 12 },
        bodyText: { color: '#1e293b' },
        mutedText: { color: '#64748b' },
      }
    case 'nordic':
      return {
        header: { backgroundColor: colors.light, color: colors.dark, padding: 28 },
        headerAccent: { backgroundColor: colors.primary },
        sectionTitle: { color: colors.dark, borderBottom: `2pt solid ${colors.primary}`, fontSize: 11, letterSpacing: 0.5 },
        skillTag: { backgroundColor: '#ffffff', color: colors.primary, border: `1pt solid ${colors.light}`, borderRadius: 6 },
        sidebarBg: colors.light,
        sidebarText: colors.dark,
        sidebarAccent: colors.primary,
        bodyText: { color: colors.dark },
        mutedText: { color: colors.secondary },
      }
    default: // modern
      return {
        header: { backgroundColor: colors.primary, color: '#ffffff', padding: 28 },
        headerAccent: { backgroundColor: colors.secondary },
        sectionTitle: { color: colors.primary, borderBottom: `2pt solid ${colors.primary}`, fontSize: 11, letterSpacing: 0.3 },
        skillTag: { backgroundColor: colors.light, color: colors.primary, border: 'none', borderRadius: 6 },
        bodyText: { color: '#1e293b' },
        mutedText: { color: '#64748b' },
      }
  }
}

// Icon components for PDF
const MailIcon = ({ color = '#ffffff', size = 10 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" fill="none" stroke={color} strokeWidth="2"/>
    <Path d="M22 6l-10 7L2 6" fill="none" stroke={color} strokeWidth="2"/>
  </Svg>
)

const PhoneIcon = ({ color = '#ffffff', size = 10 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" fill="none" stroke={color} strokeWidth="2"/>
  </Svg>
)

const LocationIcon = ({ color = '#ffffff', size = 10 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" fill="none" stroke={color} strokeWidth="2"/>
    <Circle cx="12" cy="10" r="3" fill="none" stroke={color} strokeWidth="2"/>
  </Svg>
)

const BriefcaseIcon = ({ color = '#4f46e5', size = 12 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M20 7H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z" fill="none" stroke={color} strokeWidth="2"/>
    <Path d="M16 7V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2" fill="none" stroke={color} strokeWidth="2"/>
  </Svg>
)

const GraduationIcon = ({ color = '#4f46e5', size = 12 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M22 10l-10-6L2 10l10 6 10-6z" fill="none" stroke={color} strokeWidth="2"/>
    <Path d="M6 12v5c3 3 9 3 12 0v-5" fill="none" stroke={color} strokeWidth="2"/>
  </Svg>
)

const StarIcon = ({ color = '#4f46e5', size = 12 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="none" stroke={color} strokeWidth="2"/>
  </Svg>
)

const AwardIcon = ({ color = '#4f46e5', size = 12 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="8" r="6" fill="none" stroke={color} strokeWidth="2"/>
    <Path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" fill="none" stroke={color} strokeWidth="2"/>
  </Svg>
)

const GlobeIcon = ({ color = '#4f46e5', size = 12 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="2"/>
    <Path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" fill="none" stroke={color} strokeWidth="2"/>
  </Svg>
)

// Main PDF Document Component
export function CVPDFDocument({ data }: CVPDFProps) {
  const fullName = `${data.firstName} ${data.lastName}`.trim() || 'Ditt Namn'
  const colors = getColors(data.colorScheme)
  const styles = getTemplateStyles(data.template, colors)
  const config = getTemplateConfig(data.template, colors)

  // Group skills
  const technicalSkills = data.skills?.filter(s => s.category === 'technical') || []
  const softSkills = data.skills?.filter(s => s.category === 'soft') || []
  const otherSkills = data.skills?.filter(s => !s.category || !['technical', 'soft'].includes(s.category)) || []
  const allSkills = [...technicalSkills, ...softSkills, ...otherSkills]

  // Determine if using sidebar layout
  const useSidebar = config.layout === 'sidebar'
  const sidebarStyles = (styles as any).sidebarBg ? styles : null

  const pdfStyles = StyleSheet.create({
    page: {
      fontFamily: 'Helvetica',
      fontSize: 10,
      padding: 0,
      backgroundColor: '#ffffff',
    },
    // Sidebar layout styles
    sidebarContainer: {
      flexDirection: 'row',
      minHeight: '100%',
    },
    sidebar: {
      width: '35%',
      backgroundColor: (sidebarStyles as any)?.sidebarBg || colors.dark,
      padding: 24,
      color: (sidebarStyles as any)?.sidebarText || '#ffffff',
    },
    mainContent: {
      width: '65%',
      padding: 30,
      backgroundColor: '#ffffff',
    },
    // Single column header
    header: {
      ...styles.header,
      marginBottom: 0,
    },
    headerAccent: {
      height: (styles.headerAccent as any)?.height || 4,
      backgroundColor: (styles.headerAccent as any)?.backgroundColor || colors.secondary,
      marginBottom: 24,
    },
    name: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 6,
      letterSpacing: 0.5,
    },
    sidebarName: {
      fontSize: 22,
      fontWeight: 'bold',
      marginBottom: 4,
      textAlign: 'center',
    },
    title: {
      fontSize: 14,
      marginBottom: 16,
      opacity: 0.9,
      letterSpacing: 0.3,
    },
    sidebarTitle: {
      fontSize: 11,
      marginBottom: 20,
      opacity: 0.85,
      textAlign: 'center',
    },
    contactRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
      fontSize: 10,
    },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    sidebarContactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12,
      paddingVertical: 6,
    },
    contactIconBox: {
      width: 28,
      height: 28,
      borderRadius: 6,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      paddingHorizontal: 30,
      paddingBottom: 30,
    },
    section: {
      marginBottom: 20,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      paddingBottom: 6,
      marginBottom: 10,
      ...styles.sectionTitle,
      textTransform: (styles.sectionTitle as any)?.textTransform || 'none',
      letterSpacing: (styles.sectionTitle as any)?.letterSpacing || 0,
    },
    sidebarSectionTitle: {
      fontSize: 9,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      opacity: 0.7,
      marginBottom: 12,
      marginTop: 20,
    },
    entry: {
      marginBottom: 14,
    },
    entryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 3,
    },
    entryTitle: {
      fontWeight: 'bold',
      fontSize: 11,
      color: (styles.bodyText as any)?.color || '#1e293b',
    },
    entryDate: {
      fontSize: 9,
      color: colors.primary,
      backgroundColor: colors.light,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    entryCompany: {
      fontSize: 10,
      color: colors.primary,
      marginBottom: 4,
      fontWeight: 'bold',
    },
    entryLocation: {
      fontSize: 9,
      color: (styles.mutedText as any)?.color || '#64748b',
    },
    entryDescription: {
      fontSize: 9,
      color: (styles.bodyText as any)?.color || '#334155',
      lineHeight: 1.5,
      marginTop: 4,
    },
    summary: {
      fontSize: 10,
      color: (styles.bodyText as any)?.color || '#334155',
      lineHeight: 1.6,
      backgroundColor: '#f8fafc',
      padding: 16,
      borderRadius: 6,
      borderLeft: `3pt solid ${colors.primary}`,
    },
    skillCategory: {
      marginBottom: 10,
    },
    skillCategoryTitle: {
      fontSize: 8,
      color: (styles.mutedText as any)?.color || '#64748b',
      textTransform: 'uppercase',
      marginBottom: 6,
      letterSpacing: 0.5,
    },
    skillList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    skillTag: {
      fontSize: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: (styles.skillTag as any)?.borderRadius || 6,
      backgroundColor: (styles.skillTag as any)?.backgroundColor || colors.light,
      color: (styles.skillTag as any)?.color || colors.primary,
    },
    sidebarSkillTag: {
      fontSize: 8,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.15)',
      marginBottom: 6,
      marginRight: 6,
    },
    languageList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 20,
    },
    languageItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    languageName: {
      fontWeight: 'bold',
      fontSize: 10,
    },
    languageLevel: {
      fontSize: 9,
      color: (styles.mutedText as any)?.color || '#64748b',
    },
    sidebarLanguageItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
      paddingBottom: 8,
      borderBottom: '1pt solid rgba(255,255,255,0.1)',
    },
    certificateItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
      paddingBottom: 8,
      borderBottom: `1pt solid ${colors.light}`,
    },
    referenceGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    referenceItem: {
      width: '47%',
      padding: 12,
      backgroundColor: '#f8fafc',
      borderRadius: 6,
    },
    referenceName: {
      fontWeight: 'bold',
      fontSize: 10,
      color: (styles.bodyText as any)?.color || '#1e293b',
      marginBottom: 2,
    },
    referenceTitle: {
      fontSize: 9,
      color: colors.primary,
      marginBottom: 4,
    },
    referenceContact: {
      fontSize: 8,
      color: (styles.mutedText as any)?.color || '#64748b',
    },
    twoColumn: {
      flexDirection: 'row',
      gap: 24,
    },
    column: {
      flex: 1,
    },
    divider: {
      height: 1,
      backgroundColor: colors.light,
      marginVertical: 16,
    },
    timelineDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
      position: 'absolute',
      left: -4,
      top: 4,
    },
    timelineEntry: {
      paddingLeft: 16,
      borderLeft: `2pt solid ${colors.light}`,
      marginBottom: 14,
      position: 'relative',
    },
  })

  // SIDEBAR LAYOUT - för creative, sidebar, nordic mallar
  if (useSidebar) {
    return (
      <Document>
        <Page size="A4" style={pdfStyles.page}>
          <View style={pdfStyles.sidebarContainer}>
            {/* Sidebar */}
            <View style={pdfStyles.sidebar}>
              {/* Name & Title */}
              <Text style={pdfStyles.sidebarName}>{fullName}</Text>
              {data.title && <Text style={pdfStyles.sidebarTitle}>{data.title}</Text>}

              {/* Contact */}
              <Text style={pdfStyles.sidebarSectionTitle}>Kontakt</Text>
              {data.email && (
                <View style={pdfStyles.sidebarContactItem}>
                  <View style={pdfStyles.contactIconBox}>
                    <MailIcon size={12} />
                  </View>
                  <Text style={{ fontSize: 9, flex: 1 }}>{data.email}</Text>
                </View>
              )}
              {data.phone && (
                <View style={pdfStyles.sidebarContactItem}>
                  <View style={pdfStyles.contactIconBox}>
                    <PhoneIcon size={12} />
                  </View>
                  <Text style={{ fontSize: 9 }}>{data.phone}</Text>
                </View>
              )}
              {data.location && (
                <View style={pdfStyles.sidebarContactItem}>
                  <View style={pdfStyles.contactIconBox}>
                    <LocationIcon size={12} />
                  </View>
                  <Text style={{ fontSize: 9 }}>{data.location}</Text>
                </View>
              )}

              {/* Skills in sidebar */}
              {allSkills.length > 0 && (
                <>
                  <Text style={pdfStyles.sidebarSectionTitle}>Expertis</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {allSkills.slice(0, 10).map((skill) => (
                      <Text key={skill.id} style={pdfStyles.sidebarSkillTag}>{skill.name}</Text>
                    ))}
                  </View>
                </>
              )}

              {/* Languages in sidebar */}
              {data.languages && data.languages.length > 0 && (
                <>
                  <Text style={pdfStyles.sidebarSectionTitle}>Språk</Text>
                  {data.languages.map((lang) => (
                    <View key={lang.id} style={pdfStyles.sidebarLanguageItem}>
                      <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{lang.language}</Text>
                      <Text style={{ fontSize: 8, opacity: 0.7 }}>{lang.level}</Text>
                    </View>
                  ))}
                </>
              )}

              {/* Certificates in sidebar */}
              {data.certificates && data.certificates.length > 0 && (
                <>
                  <Text style={pdfStyles.sidebarSectionTitle}>Certifikat</Text>
                  {data.certificates.slice(0, 4).map((cert) => (
                    <View key={cert.id} style={{ marginBottom: 10 }}>
                      <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{cert.name}</Text>
                      <Text style={{ fontSize: 8, opacity: 0.7 }}>{cert.issuer}</Text>
                    </View>
                  ))}
                </>
              )}
            </View>

            {/* Main Content */}
            <View style={pdfStyles.mainContent}>
              {/* Summary */}
              {data.summary && (
                <View style={pdfStyles.section}>
                  <View style={pdfStyles.sectionHeader}>
                    <StarIcon color={colors.primary} />
                    <Text style={pdfStyles.sectionTitle}>Profil</Text>
                  </View>
                  <Text style={{ fontSize: 10, lineHeight: 1.6, color: '#334155' }}>{data.summary}</Text>
                </View>
              )}

              {/* Work Experience with timeline */}
              {data.workExperience && data.workExperience.length > 0 && (
                <View style={pdfStyles.section}>
                  <View style={pdfStyles.sectionHeader}>
                    <BriefcaseIcon color={colors.primary} />
                    <Text style={pdfStyles.sectionTitle}>Arbetslivserfarenhet</Text>
                  </View>
                  {data.workExperience.map((job) => (
                    <View key={job.id} style={pdfStyles.timelineEntry}>
                      <View style={pdfStyles.timelineDot} />
                      <View style={pdfStyles.entryHeader}>
                        <Text style={pdfStyles.entryTitle}>{job.title}</Text>
                        <Text style={pdfStyles.entryDate}>
                          {job.startDate} - {job.current ? 'Nu' : job.endDate}
                        </Text>
                      </View>
                      <Text style={pdfStyles.entryCompany}>
                        {job.company}{job.location && <Text style={pdfStyles.entryLocation}> • {job.location}</Text>}
                      </Text>
                      {job.description && (
                        <Text style={pdfStyles.entryDescription}>{job.description}</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Education */}
              {data.education && data.education.length > 0 && (
                <View style={pdfStyles.section}>
                  <View style={pdfStyles.sectionHeader}>
                    <GraduationIcon color={colors.primary} />
                    <Text style={pdfStyles.sectionTitle}>Utbildning</Text>
                  </View>
                  {data.education.map((edu) => (
                    <View key={edu.id} style={pdfStyles.timelineEntry}>
                      <View style={pdfStyles.timelineDot} />
                      <View style={pdfStyles.entryHeader}>
                        <Text style={pdfStyles.entryTitle}>{edu.degree}</Text>
                        <Text style={pdfStyles.entryDate}>{edu.startDate} - {edu.endDate}</Text>
                      </View>
                      <Text style={pdfStyles.entryCompany}>{edu.school}</Text>
                      {edu.field && <Text style={pdfStyles.entryLocation}>{edu.field}</Text>}
                    </View>
                  ))}
                </View>
              )}

              {/* References */}
              {data.references && data.references.length > 0 && (
                <View style={pdfStyles.section}>
                  <Text style={pdfStyles.sectionTitle}>Referenser</Text>
                  <View style={pdfStyles.referenceGrid}>
                    {data.references.map((ref) => (
                      <View key={ref.id} style={pdfStyles.referenceItem}>
                        <Text style={pdfStyles.referenceName}>{ref.name}</Text>
                        <Text style={pdfStyles.referenceTitle}>{ref.title}{ref.company && `, ${ref.company}`}</Text>
                        {ref.phone && <Text style={pdfStyles.referenceContact}>{ref.phone}</Text>}
                        {ref.email && <Text style={pdfStyles.referenceContact}>{ref.email}</Text>}
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        </Page>
      </Document>
    )
  }

  // STANDARD SINGLE-COLUMN LAYOUT
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.name}>{fullName}</Text>
          {data.title && <Text style={pdfStyles.title}>{data.title}</Text>}

          <View style={pdfStyles.contactRow}>
            {data.email && (
              <View style={pdfStyles.contactItem}>
                <MailIcon color={styles.header.color as string} size={11} />
                <Text>{data.email}</Text>
              </View>
            )}
            {data.phone && (
              <View style={pdfStyles.contactItem}>
                <PhoneIcon color={styles.header.color as string} size={11} />
                <Text>{data.phone}</Text>
              </View>
            )}
            {data.location && (
              <View style={pdfStyles.contactItem}>
                <LocationIcon color={styles.header.color as string} size={11} />
                <Text>{data.location}</Text>
              </View>
            )}
          </View>

          {data.links && data.links.length > 0 && (
            <View style={[pdfStyles.contactRow, { marginTop: 10 }]}>
              {data.links.map((link) => (
                <View key={link.id} style={pdfStyles.contactItem}>
                  <GlobeIcon color={styles.header.color as string} size={10} />
                  <Link src={link.url}>
                    <Text style={{ color: styles.header.color as string, textDecoration: 'underline' }}>
                      {link.type === 'linkedin' && 'LinkedIn'}
                      {link.type === 'github' && 'GitHub'}
                      {link.type === 'portfolio' && 'Portfolio'}
                      {link.type === 'website' && 'Webbplats'}
                      {link.type === 'other' && (link.label || 'Länk')}
                    </Text>
                  </Link>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Accent line */}
        <View style={pdfStyles.headerAccent} />

        {/* Content */}
        <View style={pdfStyles.content}>
          {/* Summary */}
          {data.summary && (
            <View style={pdfStyles.section}>
              <View style={pdfStyles.sectionHeader}>
                <StarIcon color={colors.primary} />
                <Text style={pdfStyles.sectionTitle}>Profil</Text>
              </View>
              <Text style={pdfStyles.summary}>{data.summary}</Text>
            </View>
          )}

          {/* Work Experience */}
          {data.workExperience && data.workExperience.length > 0 && (
            <View style={pdfStyles.section}>
              <View style={pdfStyles.sectionHeader}>
                <BriefcaseIcon color={colors.primary} />
                <Text style={pdfStyles.sectionTitle}>Arbetslivserfarenhet</Text>
              </View>
              {data.workExperience.map((job) => (
                <View key={job.id} style={pdfStyles.entry}>
                  <View style={pdfStyles.entryHeader}>
                    <Text style={pdfStyles.entryTitle}>{job.title}</Text>
                    <Text style={pdfStyles.entryDate}>
                      {job.startDate} - {job.current ? 'Nu' : job.endDate}
                    </Text>
                  </View>
                  <Text style={pdfStyles.entryCompany}>
                    {job.company}{job.location && <Text style={pdfStyles.entryLocation}> • {job.location}</Text>}
                  </Text>
                  {job.description && (
                    <Text style={pdfStyles.entryDescription}>{job.description}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Education */}
          {data.education && data.education.length > 0 && (
            <View style={pdfStyles.section}>
              <View style={pdfStyles.sectionHeader}>
                <GraduationIcon color={colors.primary} />
                <Text style={pdfStyles.sectionTitle}>Utbildning</Text>
              </View>
              {data.education.map((edu) => (
                <View key={edu.id} style={pdfStyles.entry}>
                  <View style={pdfStyles.entryHeader}>
                    <Text style={pdfStyles.entryTitle}>{edu.degree}</Text>
                    <Text style={pdfStyles.entryDate}>{edu.startDate} - {edu.endDate}</Text>
                  </View>
                  <Text style={pdfStyles.entryCompany}>
                    {edu.school}{edu.field && <Text style={pdfStyles.entryLocation}> - {edu.field}</Text>}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Skills */}
          {allSkills.length > 0 && (
            <View style={pdfStyles.section}>
              <View style={pdfStyles.sectionHeader}>
                <StarIcon color={colors.primary} />
                <Text style={pdfStyles.sectionTitle}>Kompetenser</Text>
              </View>

              {technicalSkills.length > 0 && (
                <View style={pdfStyles.skillCategory}>
                  <Text style={pdfStyles.skillCategoryTitle}>Tekniska kompetenser</Text>
                  <View style={pdfStyles.skillList}>
                    {technicalSkills.map((skill) => (
                      <Text key={skill.id} style={pdfStyles.skillTag}>{skill.name}</Text>
                    ))}
                  </View>
                </View>
              )}

              {softSkills.length > 0 && (
                <View style={pdfStyles.skillCategory}>
                  <Text style={pdfStyles.skillCategoryTitle}>Mjuka färdigheter</Text>
                  <View style={pdfStyles.skillList}>
                    {softSkills.map((skill) => (
                      <Text key={skill.id} style={pdfStyles.skillTag}>{skill.name}</Text>
                    ))}
                  </View>
                </View>
              )}

              {otherSkills.length > 0 && (
                <View style={pdfStyles.skillList}>
                  {otherSkills.map((skill) => (
                    <Text key={skill.id} style={pdfStyles.skillTag}>{skill.name}</Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Two column: Languages & Certificates */}
          {((data.languages?.length || 0) > 0 || (data.certificates?.length || 0) > 0) && (
            <View style={pdfStyles.twoColumn}>
              {data.languages && data.languages.length > 0 && (
                <View style={[pdfStyles.section, pdfStyles.column]}>
                  <View style={pdfStyles.sectionHeader}>
                    <GlobeIcon color={colors.primary} />
                    <Text style={pdfStyles.sectionTitle}>Språk</Text>
                  </View>
                  <View style={pdfStyles.languageList}>
                    {data.languages.map((lang) => (
                      <View key={lang.id} style={pdfStyles.languageItem}>
                        <Text style={pdfStyles.languageName}>{lang.language}</Text>
                        <Text style={pdfStyles.languageLevel}>({lang.level})</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {data.certificates && data.certificates.length > 0 && (
                <View style={[pdfStyles.section, pdfStyles.column]}>
                  <View style={pdfStyles.sectionHeader}>
                    <AwardIcon color={colors.primary} />
                    <Text style={pdfStyles.sectionTitle}>Certifikat</Text>
                  </View>
                  {data.certificates.map((cert) => (
                    <View key={cert.id} style={pdfStyles.certificateItem}>
                      <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{cert.name}</Text>
                      <Text style={{ fontSize: 8, color: '#64748b' }}>{cert.issuer}, {cert.date}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* References */}
          {data.references && data.references.length > 0 && (
            <View style={pdfStyles.section}>
              <Text style={pdfStyles.sectionTitle}>Referenser</Text>
              <View style={pdfStyles.referenceGrid}>
                {data.references.map((ref) => (
                  <View key={ref.id} style={pdfStyles.referenceItem}>
                    <Text style={pdfStyles.referenceName}>{ref.name}</Text>
                    <Text style={pdfStyles.referenceTitle}>{ref.title}{ref.company && `, ${ref.company}`}</Text>
                    {ref.phone && <Text style={pdfStyles.referenceContact}>{ref.phone}</Text>}
                    {ref.email && <Text style={pdfStyles.referenceContact}>{ref.email}</Text>}
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </Page>
    </Document>
  )
}

export default CVPDFDocument
