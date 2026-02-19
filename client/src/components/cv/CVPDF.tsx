import { Document, Page, Text, View, StyleSheet, Font, Link } from '@react-pdf/renderer'
import type { CVData } from '@/services/mockApi'

// Register fonts (using standard fonts that work in react-pdf)
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT0kLW-43aMEzIO6XUTLjamMU.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT0kLW-43aMEzIO6XUTLjamMU.woff2', fontWeight: 700 },
  ]
})

interface CVPDFProps {
  data: CVData
}

// Color schemes
const getColors = (schemeId: string = 'indigo') => {
  const schemes: Record<string, { primary: string; secondary: string; light: string }> = {
    indigo: { primary: '#4f46e5', secondary: '#6366f1', light: '#e0e7ff' },
    ocean: { primary: '#0ea5e9', secondary: '#38bdf8', light: '#e0f2fe' },
    forest: { primary: '#059669', secondary: '#10b981', light: '#d1fae5' },
    berry: { primary: '#db2777', secondary: '#ec4899', light: '#fce7f3' },
    sunset: { primary: '#ea580c', secondary: '#f97316', light: '#ffedd5' },
    ruby: { primary: '#dc2626', secondary: '#ef4444', light: '#fee2e2' },
    slate: { primary: '#1e293b', secondary: '#475569', light: '#e2e8f0' },
    violet: { primary: '#7c3aed', secondary: '#8b5cf6', light: '#ede9fe' },
    cyan: { primary: '#0891b2', secondary: '#06b6d4', light: '#cffafe' },
    rose: { primary: '#e11d48', secondary: '#fb7185', light: '#ffe4e6' },
  }
  return schemes[schemeId] || schemes.indigo
}

const getTemplateStyles = (template: string = 'modern', colors: { primary: string; secondary: string; light: string }) => {
  const baseHeader = {
    backgroundColor: colors.primary,
    color: '#ffffff',
    padding: 24,
  }
  
  switch (template) {
    case 'classic':
      return {
        header: { ...baseHeader, backgroundColor: '#ffffff', color: colors.primary, borderBottom: `3px solid ${colors.primary}` },
        sectionTitle: { color: colors.primary, borderBottom: `1px solid ${colors.secondary}`, fontSize: 11 },
        skillTag: { backgroundColor: 'transparent', color: colors.primary, border: `1px solid ${colors.secondary}` },
      }
    case 'minimal':
      return {
        header: { backgroundColor: '#f8fafc', color: '#0f172a', padding: 24 },
        sectionTitle: { color: '#0f172a', borderBottom: `2px solid ${colors.primary}` },
        skillTag: { backgroundColor: '#f1f5f9', color: '#334155' },
      }
    case 'creative':
      return {
        header: { backgroundColor: colors.primary, color: '#ffffff', padding: 24 },
        sectionTitle: { color: colors.primary, borderBottom: `3px solid ${colors.secondary}` },
        skillTag: { backgroundColor: colors.primary, color: '#ffffff' },
      }
    case 'tech':
      return {
        header: { backgroundColor: '#0f172a', color: colors.secondary, padding: 24, borderLeft: `4px solid ${colors.primary}` },
        sectionTitle: { color: colors.primary, borderBottom: `2px dashed ${colors.secondary}` },
        skillTag: { backgroundColor: '#1e293b', color: colors.secondary, border: `1px solid ${colors.primary}` },
      }
    case 'executive':
      return {
        header: { backgroundColor: '#1e3a5f', color: '#ffffff', padding: 24 },
        sectionTitle: { color: '#1e3a5f', borderBottom: `2px solid #c9a227` },
        skillTag: { backgroundColor: '#f8fafc', color: '#1e3a5f', border: `1px solid #c9a227` },
      }
    case 'academic':
      return {
        header: { backgroundColor: '#ffffff', color: colors.primary, padding: 24, borderBottom: `3px double ${colors.primary}` },
        sectionTitle: { color: colors.primary, borderBottom: `1px dotted ${colors.secondary}` },
        skillTag: { backgroundColor: '#fafafa', color: '#333', border: `1px solid #ddd` },
      }
    case 'corporate':
      return {
        header: { backgroundColor: colors.primary, color: '#ffffff', padding: 24 },
        sectionTitle: { color: colors.primary, borderLeft: `4px solid ${colors.secondary}`, paddingLeft: 8, borderBottom: 'none' },
        skillTag: { backgroundColor: '#f0fdf4', color: colors.primary },
      }
    default: // modern
      return {
        header: baseHeader,
        sectionTitle: { color: colors.primary, borderBottom: `2px solid ${colors.primary}` },
        skillTag: { backgroundColor: colors.light, color: colors.primary },
      }
  }
}

// Main PDF Document Component
export function CVPDFDocument({ data }: CVPDFProps) {
  const fullName = `${data.firstName} ${data.lastName}`.trim() || 'Ditt Namn'
  const colors = getColors(data.colorScheme)
  const styles = getTemplateStyles(data.template, colors)
  
  // Group skills
  const technicalSkills = data.skills?.filter(s => s.category === 'technical') || []
  const softSkills = data.skills?.filter(s => s.category === 'soft') || []
  const otherSkills = data.skills?.filter(s => !s.category || !['technical', 'soft'].includes(s.category)) || []

  const pdfStyles = StyleSheet.create({
    page: {
      fontFamily: 'Helvetica',
      fontSize: 10,
      padding: 0,
      backgroundColor: '#ffffff',
    },
    header: {
      ...styles.header,
      marginBottom: 20,
    },
    name: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    title: {
      fontSize: 14,
      marginBottom: 12,
      opacity: 0.9,
    },
    contactRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      fontSize: 10,
    },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    content: {
      paddingHorizontal: 30,
      paddingBottom: 30,
    },
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      paddingBottom: 4,
      marginBottom: 8,
      ...styles.sectionTitle,
    },
    entry: {
      marginBottom: 10,
    },
    entryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    entryTitle: {
      fontWeight: 'bold',
      fontSize: 11,
      color: '#1e293b',
    },
    entryDate: {
      fontSize: 9,
      color: '#64748b',
    },
    entryCompany: {
      fontSize: 10,
      color: '#475569',
      marginBottom: 2,
    },
    entryDescription: {
      fontSize: 9,
      color: '#334155',
      lineHeight: 1.4,
    },
    summary: {
      fontSize: 10,
      color: '#334155',
      lineHeight: 1.5,
    },
    skillCategory: {
      marginBottom: 8,
    },
    skillCategoryTitle: {
      fontSize: 8,
      color: '#64748b',
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    skillList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    skillTag: {
      fontSize: 8,
      padding: '3 8',
      borderRadius: 4,
      ...styles.skillTag,
    },
    languageList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    languageItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    certificateItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    referenceGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    referenceItem: {
      width: '45%',
    },
    referenceName: {
      fontWeight: 'bold',
      fontSize: 10,
    },
    twoColumn: {
      flexDirection: 'row',
      gap: 20,
    },
    column: {
      flex: 1,
    },
  })

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
                <Text>✉ {data.email}</Text>
              </View>
            )}
            {data.phone && (
              <View style={pdfStyles.contactItem}>
                <Text>☎ {data.phone}</Text>
              </View>
            )}
            {data.location && (
              <View style={pdfStyles.contactItem}>
                <Text>📍 {data.location}</Text>
              </View>
            )}
          </View>
          
          {data.links && data.links.length > 0 && (
            <View style={[pdfStyles.contactRow, { marginTop: 8 }]}>
              {data.links.map((link) => (
                <View key={link.id} style={pdfStyles.contactItem}>
                  <Link src={link.url}>
                    <Text style={{ color: styles.header.color }}>
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

        {/* Content */}
        <View style={pdfStyles.content}>
          {/* Summary */}
          {data.summary && (
            <View style={pdfStyles.section}>
              <Text style={pdfStyles.sectionTitle}>Profil</Text>
              <Text style={pdfStyles.summary}>{data.summary}</Text>
            </View>
          )}

          {/* Work Experience */}
          {data.workExperience && data.workExperience.length > 0 && (
            <View style={pdfStyles.section}>
              <Text style={pdfStyles.sectionTitle}>Arbetslivserfarenhet</Text>
              {data.workExperience.map((job) => (
                <View key={job.id} style={pdfStyles.entry}>
                  <View style={pdfStyles.entryHeader}>
                    <Text style={pdfStyles.entryTitle}>{job.title}</Text>
                    <Text style={pdfStyles.entryDate}>
                      {job.startDate} - {job.current ? 'Pågående' : job.endDate}
                    </Text>
                  </View>
                  <Text style={pdfStyles.entryCompany}>
                    {job.company}{job.location && `, ${job.location}`}
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
              <Text style={pdfStyles.sectionTitle}>Utbildning</Text>
              {data.education.map((edu) => (
                <View key={edu.id} style={pdfStyles.entry}>
                  <View style={pdfStyles.entryHeader}>
                    <Text style={pdfStyles.entryTitle}>{edu.degree}</Text>
                    <Text style={pdfStyles.entryDate}>{edu.startDate} - {edu.endDate}</Text>
                  </View>
                  <Text style={pdfStyles.entryCompany}>
                    {edu.school}{edu.field && ` - ${edu.field}`}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Skills */}
          {(data.skills?.length || 0) > 0 && (
            <View style={pdfStyles.section}>
              <Text style={pdfStyles.sectionTitle}>Kompetenser</Text>
              
              {technicalSkills.length > 0 && (
                <View style={pdfStyles.skillCategory}>
                  <Text style={pdfStyles.skillCategoryTitle}>Tekniska</Text>
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

          {/* Languages & Certificates - Two column if both exist */}
          {(data.languages?.length || 0) > 0 || (data.certificates?.length || 0) > 0 ? (
            <View style={pdfStyles.twoColumn}>
              {data.languages && data.languages.length > 0 && (
                <View style={[pdfStyles.section, pdfStyles.column]}>
                  <Text style={pdfStyles.sectionTitle}>Språk</Text>
                  <View style={pdfStyles.languageList}>
                    {data.languages.map((lang) => (
                      <View key={lang.id} style={pdfStyles.languageItem}>
                        <Text style={{ fontWeight: 'bold' }}>{lang.language}</Text>
                        <Text style={{ fontSize: 9, color: '#64748b' }}>({lang.level})</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {data.certificates && data.certificates.length > 0 && (
                <View style={[pdfStyles.section, pdfStyles.column]}>
                  <Text style={pdfStyles.sectionTitle}>Certifikat</Text>
                  {data.certificates.map((cert) => (
                    <View key={cert.id} style={pdfStyles.certificateItem}>
                      <Text>{cert.name}</Text>
                      <Text style={{ fontSize: 9, color: '#64748b' }}>{cert.issuer}, {cert.date}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : null}

          {/* References */}
          {data.references && data.references.length > 0 && (
            <View style={pdfStyles.section}>
              <Text style={pdfStyles.sectionTitle}>Referenser</Text>
              <View style={pdfStyles.referenceGrid}>
                {data.references.map((ref) => (
                  <View key={ref.id} style={pdfStyles.referenceItem}>
                    <Text style={pdfStyles.referenceName}>{ref.name}</Text>
                    <Text style={{ fontSize: 9, color: '#475569' }}>{ref.title}, {ref.company}</Text>
                    {ref.phone && <Text style={{ fontSize: 8, color: '#64748b' }}>{ref.phone}</Text>}
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
