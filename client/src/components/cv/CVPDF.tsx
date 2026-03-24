import { Document, Page, Text, View, StyleSheet, Link, Image } from '@react-pdf/renderer'
import type { CVData } from '@/services/supabaseApi'

interface CVPDFProps {
  data: CVData
}

// Helper functions
const getLanguageLevelDisplay = (level: string): string => {
  const levelMap: Record<string, string> = {
    'basic': 'Grundläggande',
    'good': 'God',
    'fluent': 'Flytande',
    'native': 'Modersmål',
  }
  return levelMap[level] || level
}

const getSkillName = (skill: { name: string } | string): string => {
  return typeof skill === 'string' ? skill : skill?.name || ''
}

// ============================================================================
// MINIMAL TEMPLATE
// ============================================================================

function MinimalPDF({ data, fullName }: { data: CVData; fullName: string }) {
  const styles = StyleSheet.create({
    page: { padding: 60, fontFamily: 'Helvetica', backgroundColor: '#FFFFFF' },
    header: { marginBottom: 40 },
    name: { fontSize: 42, fontWeight: 'bold', letterSpacing: -1, color: '#000000', marginBottom: 8 },
    title: { fontSize: 16, color: '#666666', marginBottom: 20 },
    contactRow: { flexDirection: 'row', gap: 24, paddingTop: 20, borderTop: '1pt solid #E5E5E5' },
    contactText: { fontSize: 11, color: '#666666' },
    summary: { fontSize: 14, lineHeight: 1.7, color: '#333333', marginBottom: 40, maxWidth: 450 },
    twoColumn: { flexDirection: 'row', gap: 60 },
    leftColumn: { flex: 2 },
    rightColumn: { flex: 1 },
    sectionLabel: { fontSize: 9, fontWeight: 'bold', letterSpacing: 1.5, textTransform: 'uppercase', color: '#999999', marginBottom: 20 },
    entry: { marginBottom: 24 },
    entryDate: { fontSize: 10, color: '#999999', marginBottom: 4 },
    entryTitle: { fontSize: 14, fontWeight: 'bold', color: '#000000', marginBottom: 2 },
    entryCompany: { fontSize: 11, color: '#666666', marginBottom: 8 },
    entryDesc: { fontSize: 11, lineHeight: 1.5, color: '#666666' },
    skillText: { fontSize: 11, color: '#333333', marginBottom: 6 },
    langRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    langName: { fontSize: 11, color: '#333333' },
    langLevel: { fontSize: 11, color: '#999999' },
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{fullName}</Text>
          {data.title && <Text style={styles.title}>{data.title}</Text>}
          <View style={styles.contactRow}>
            {data.email && <Text style={styles.contactText}>{data.email}</Text>}
            {data.phone && <Text style={styles.contactText}>{data.phone}</Text>}
            {data.location && <Text style={styles.contactText}>{data.location}</Text>}
          </View>
        </View>

        {data.summary && <Text style={styles.summary}>{data.summary}</Text>}

        <View style={styles.twoColumn}>
          <View style={styles.leftColumn}>
            {data.workExperience?.length > 0 && (
              <View style={{ marginBottom: 30 }}>
                <Text style={styles.sectionLabel}>Erfarenhet</Text>
                {data.workExperience.map(job => (
                  <View key={job.id} style={styles.entry}>
                    <Text style={styles.entryDate}>{job.startDate} — {job.current ? 'Nu' : job.endDate}</Text>
                    <Text style={styles.entryTitle}>{job.title}</Text>
                    <Text style={styles.entryCompany}>{job.company}</Text>
                    {job.description && <Text style={styles.entryDesc}>{job.description}</Text>}
                  </View>
                ))}
              </View>
            )}
            {data.education?.length > 0 && (
              <View>
                <Text style={styles.sectionLabel}>Utbildning</Text>
                {data.education.map(edu => (
                  <View key={edu.id} style={styles.entry}>
                    <Text style={styles.entryDate}>{edu.startDate} — {edu.endDate}</Text>
                    <Text style={styles.entryTitle}>{edu.degree}</Text>
                    <Text style={styles.entryCompany}>{edu.school}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          <View style={styles.rightColumn}>
            {data.skills?.length > 0 && (
              <View style={{ marginBottom: 30 }}>
                <Text style={styles.sectionLabel}>Kompetenser</Text>
                {data.skills.map((skill, i) => (
                  <Text key={i} style={styles.skillText}>{getSkillName(skill)}</Text>
                ))}
              </View>
            )}
            {data.languages?.length > 0 && (
              <View>
                <Text style={styles.sectionLabel}>Språk</Text>
                {data.languages.map(lang => (
                  <View key={lang.id} style={styles.langRow}>
                    <Text style={styles.langName}>{lang.language || lang.name}</Text>
                    <Text style={styles.langLevel}>{getLanguageLevelDisplay(lang.level)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  )
}

// ============================================================================
// EXECUTIVE TEMPLATE
// ============================================================================

function ExecutivePDF({ data, fullName }: { data: CVData; fullName: string }) {
  const gold = '#B8860B'
  const goldLight = '#F5E6C8'

  const styles = StyleSheet.create({
    page: { fontFamily: 'Times-Roman', backgroundColor: '#FDFCFA' },
    header: { padding: '40 60', borderBottom: `3pt solid ${gold}`, backgroundColor: '#FFFFFF' },
    headerContent: { flexDirection: 'row', alignItems: 'center', gap: 30 },
    photo: { width: 90, height: 90, borderRadius: 4, border: `2pt solid ${gold}` },
    name: { fontSize: 36, color: '#1a1a1a', marginBottom: 4 },
    title: { fontSize: 16, fontStyle: 'italic', color: gold, marginBottom: 12 },
    contactRow: { flexDirection: 'row', gap: 16, fontSize: 11, color: '#666666' },
    main: { padding: '40 60' },
    summary: { fontSize: 14, lineHeight: 1.8, color: '#333333', marginBottom: 40 },
    dropCap: { fontSize: 48, color: gold, marginRight: 8 },
    twoColumn: { flexDirection: 'row', gap: 40 },
    column: { flex: 1 },
    sectionTitle: { fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: gold, marginBottom: 20, paddingBottom: 8, borderBottom: `1pt solid ${goldLight}` },
    entry: { marginBottom: 20 },
    entryTitle: { fontSize: 14, color: '#1a1a1a', marginBottom: 2 },
    entryCompany: { fontSize: 12, color: gold, marginBottom: 2 },
    entryDate: { fontSize: 10, color: '#888888', marginBottom: 8 },
    entryDesc: { fontSize: 10, lineHeight: 1.6, color: '#555555' },
    skillTag: { fontSize: 10, padding: '4 12', border: `1pt solid ${goldLight}`, color: '#555555', marginRight: 6, marginBottom: 6 },
    skillWrap: { flexDirection: 'row', flexWrap: 'wrap' },
    langRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    langName: { fontSize: 11, color: '#333333' },
    langLevel: { fontSize: 11, fontStyle: 'italic', color: '#888888' },
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            {data.profileImage && <Image src={data.profileImage} style={styles.photo} />}
            <View>
              <Text style={styles.name}>{fullName}</Text>
              {data.title && <Text style={styles.title}>{data.title}</Text>}
              <View style={styles.contactRow}>
                {data.email && <Text>{data.email}</Text>}
                {data.phone && <Text>{data.phone}</Text>}
                {data.location && <Text>{data.location}</Text>}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.main}>
          {data.summary && (
            <View style={{ flexDirection: 'row', marginBottom: 40 }}>
              <Text style={styles.dropCap}>{data.summary.charAt(0)}</Text>
              <Text style={styles.summary}>{data.summary.slice(1)}</Text>
            </View>
          )}

          <View style={styles.twoColumn}>
            <View style={styles.column}>
              {data.workExperience?.length > 0 && (
                <View>
                  <Text style={styles.sectionTitle}>Karriär</Text>
                  {data.workExperience.map(job => (
                    <View key={job.id} style={styles.entry}>
                      <Text style={styles.entryTitle}>{job.title}</Text>
                      <Text style={styles.entryCompany}>{job.company}</Text>
                      <Text style={styles.entryDate}>{job.startDate} — {job.current ? 'Nuvarande' : job.endDate}</Text>
                      {job.description && <Text style={styles.entryDesc}>{job.description}</Text>}
                    </View>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.column}>
              {data.education?.length > 0 && (
                <View style={{ marginBottom: 30 }}>
                  <Text style={styles.sectionTitle}>Utbildning</Text>
                  {data.education.map(edu => (
                    <View key={edu.id} style={styles.entry}>
                      <Text style={styles.entryTitle}>{edu.degree}</Text>
                      <Text style={styles.entryCompany}>{edu.school}</Text>
                      <Text style={styles.entryDate}>{edu.startDate} — {edu.endDate}</Text>
                    </View>
                  ))}
                </View>
              )}
              {data.skills?.length > 0 && (
                <View style={{ marginBottom: 30 }}>
                  <Text style={styles.sectionTitle}>Expertis</Text>
                  <View style={styles.skillWrap}>
                    {data.skills.map((skill, i) => (
                      <Text key={i} style={styles.skillTag}>{getSkillName(skill)}</Text>
                    ))}
                  </View>
                </View>
              )}
              {data.languages?.length > 0 && (
                <View>
                  <Text style={styles.sectionTitle}>Språk</Text>
                  {data.languages.map(lang => (
                    <View key={lang.id} style={styles.langRow}>
                      <Text style={styles.langName}>{lang.language || lang.name}</Text>
                      <Text style={styles.langLevel}>{getLanguageLevelDisplay(lang.level)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

// ============================================================================
// MODERN/SIDEBAR TEMPLATE
// ============================================================================

function ModernPDF({ data, fullName }: { data: CVData; fullName: string }) {
  const accent = '#6366F1'

  const styles = StyleSheet.create({
    page: { flexDirection: 'row', fontFamily: 'Helvetica' },
    sidebar: { width: '35%', backgroundColor: '#0F0F0F', padding: 30, color: '#FFFFFF' },
    sidebarPhoto: { width: '100%', aspectRatio: 1, borderRadius: 12, marginBottom: 24 },
    sidebarPhotoPlaceholder: { width: '100%', aspectRatio: 1, borderRadius: 12, marginBottom: 24, backgroundColor: 'rgba(255,255,255,0.05)' },
    sidebarSection: { marginBottom: 30 },
    sidebarLabel: { fontSize: 8, fontWeight: 'bold', letterSpacing: 2, textTransform: 'uppercase', color: accent, marginBottom: 14 },
    sidebarText: { fontSize: 10, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
    skillTag: { fontSize: 9, padding: '4 10', backgroundColor: 'rgba(99,102,241,0.15)', borderRadius: 4, color: '#FFFFFF', marginRight: 6, marginBottom: 6 },
    skillWrap: { flexDirection: 'row', flexWrap: 'wrap' },
    langItem: { marginBottom: 12 },
    langRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    langName: { fontSize: 10, color: '#FFFFFF' },
    langLevel: { fontSize: 8, color: 'rgba(255,255,255,0.5)' },
    langBar: { height: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
    langBarFill: { height: 3, backgroundColor: accent, borderRadius: 2 },
    main: { flex: 1, padding: 36, backgroundColor: '#FFFFFF' },
    name: { fontSize: 42, fontWeight: 'bold', letterSpacing: -1, color: '#0F0F0F', marginBottom: 8 },
    title: { fontSize: 16, color: accent, fontWeight: 'bold', marginBottom: 30 },
    summary: { fontSize: 12, lineHeight: 1.7, color: '#444444', marginBottom: 30, maxWidth: 400 },
    sectionLabel: { fontSize: 9, fontWeight: 'bold', letterSpacing: 1.5, textTransform: 'uppercase', color: '#999999', marginBottom: 20 },
    entry: { flexDirection: 'row', gap: 24, marginBottom: 24 },
    entryDate: { width: 100, fontSize: 10, color: '#888888' },
    entryContent: { flex: 1 },
    entryTitle: { fontSize: 14, fontWeight: 'bold', color: '#0F0F0F', marginBottom: 2 },
    entryCompany: { fontSize: 11, color: accent, marginBottom: 8 },
    entryDesc: { fontSize: 10, lineHeight: 1.6, color: '#666666' },
  })

  const getLangPercent = (level: string) => {
    const map: Record<string, number> = { 'native': 100, 'fluent': 85, 'good': 70, 'basic': 50 }
    return map[level] || 50
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.sidebar}>
          {data.profileImage ? (
            <Image src={data.profileImage} style={styles.sidebarPhoto} />
          ) : (
            <View style={styles.sidebarPhotoPlaceholder} />
          )}

          <View style={styles.sidebarSection}>
            <Text style={styles.sidebarLabel}>Kontakt</Text>
            {data.email && <Text style={styles.sidebarText}>{data.email}</Text>}
            {data.phone && <Text style={styles.sidebarText}>{data.phone}</Text>}
            {data.location && <Text style={styles.sidebarText}>{data.location}</Text>}
          </View>

          {data.skills?.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarLabel}>Tech Stack</Text>
              <View style={styles.skillWrap}>
                {data.skills.slice(0, 12).map((skill, i) => (
                  <Text key={i} style={styles.skillTag}>{getSkillName(skill)}</Text>
                ))}
              </View>
            </View>
          )}

          {data.languages?.length > 0 && (
            <View>
              <Text style={styles.sidebarLabel}>Språk</Text>
              {data.languages.map(lang => (
                <View key={lang.id} style={styles.langItem}>
                  <View style={styles.langRow}>
                    <Text style={styles.langName}>{lang.language || lang.name}</Text>
                    <Text style={styles.langLevel}>{getLanguageLevelDisplay(lang.level)}</Text>
                  </View>
                  <View style={styles.langBar}>
                    <View style={[styles.langBarFill, { width: `${getLangPercent(lang.level)}%` }]} />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.main}>
          <Text style={styles.name}>{fullName}</Text>
          {data.title && <Text style={styles.title}>{data.title}</Text>}
          {data.summary && <Text style={styles.summary}>{data.summary}</Text>}

          {data.workExperience?.length > 0 && (
            <View style={{ marginBottom: 30 }}>
              <Text style={styles.sectionLabel}>Erfarenhet</Text>
              {data.workExperience.map(job => (
                <View key={job.id} style={styles.entry}>
                  <Text style={styles.entryDate}>{job.startDate}{'\n'}— {job.current ? 'Nu' : job.endDate}</Text>
                  <View style={styles.entryContent}>
                    <Text style={styles.entryTitle}>{job.title}</Text>
                    <Text style={styles.entryCompany}>{job.company}</Text>
                    {job.description && <Text style={styles.entryDesc}>{job.description}</Text>}
                  </View>
                </View>
              ))}
            </View>
          )}

          {data.education?.length > 0 && (
            <View>
              <Text style={styles.sectionLabel}>Utbildning</Text>
              {data.education.map(edu => (
                <View key={edu.id} style={styles.entry}>
                  <Text style={styles.entryDate}>{edu.startDate} — {edu.endDate}</Text>
                  <View style={styles.entryContent}>
                    <Text style={styles.entryTitle}>{edu.degree}</Text>
                    <Text style={styles.entryCompany}>{edu.school}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  )
}

// ============================================================================
// CREATIVE TEMPLATE
// ============================================================================

function CreativePDF({ data, fullName }: { data: CVData; fullName: string }) {
  const primary = '#7C3AED'
  const secondary = '#EC4899'

  const styles = StyleSheet.create({
    page: { fontFamily: 'Helvetica', backgroundColor: '#FAFAFA' },
    header: { padding: '40 50', paddingBottom: 30 },
    headerContent: { flexDirection: 'row', gap: 30, alignItems: 'flex-end' },
    photo: { width: 140, height: 170, borderRadius: 18, objectFit: 'cover' },
    name: { fontSize: 48, fontWeight: 'bold', letterSpacing: -1.5, color: primary, marginBottom: 8 },
    title: { fontSize: 18, fontWeight: 'bold', color: '#333333', marginBottom: 20 },
    contactWrap: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    contactPill: { fontSize: 11, padding: '8 16', backgroundColor: '#FFFFFF', borderRadius: 20, color: '#333333' },
    main: { padding: '0 50 50' },
    summaryCard: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 18, marginBottom: 24 },
    summaryText: { fontSize: 14, lineHeight: 1.7, color: '#444444' },
    twoColumn: { flexDirection: 'row', gap: 24 },
    leftCol: { flex: 1 },
    rightCol: { flex: 1 },
    card: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 18, marginBottom: 24 },
    gradientCard: { backgroundColor: primary, padding: 24, borderRadius: 18, marginBottom: 24 },
    sectionLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', color: primary, marginBottom: 20 },
    sectionLabelWhite: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)', marginBottom: 16 },
    entry: { marginBottom: 20 },
    entryBadge: { fontSize: 9, fontWeight: 'bold', padding: '3 10', backgroundColor: 'rgba(124,58,237,0.1)', color: primary, borderRadius: 20, marginBottom: 8 },
    entryTitle: { fontSize: 14, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 2 },
    entryCompany: { fontSize: 11, color: secondary, marginBottom: 6 },
    entryDesc: { fontSize: 10, lineHeight: 1.5, color: '#666666' },
    skillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    skillTag: { fontSize: 10, fontWeight: 'bold', padding: '6 14', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, color: '#FFFFFF' },
    eduEntry: { marginBottom: 16 },
    eduTitle: { fontSize: 12, fontWeight: 'bold', color: '#1a1a1a' },
    eduSchool: { fontSize: 11, color: secondary },
    eduDate: { fontSize: 9, color: '#888888' },
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            {data.profileImage && <Image src={data.profileImage} style={styles.photo} />}
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{fullName}</Text>
              {data.title && <Text style={styles.title}>{data.title}</Text>}
              <View style={styles.contactWrap}>
                {data.email && <Text style={styles.contactPill}>{data.email}</Text>}
                {data.phone && <Text style={styles.contactPill}>{data.phone}</Text>}
                {data.location && <Text style={styles.contactPill}>{data.location}</Text>}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.main}>
          {data.summary && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryText}>{data.summary}</Text>
            </View>
          )}

          <View style={styles.twoColumn}>
            <View style={styles.leftCol}>
              {data.workExperience?.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.sectionLabel}>Erfarenhet</Text>
                  {data.workExperience.map(job => (
                    <View key={job.id} style={styles.entry}>
                      <Text style={styles.entryBadge}>{job.startDate} — {job.current ? 'Nu' : job.endDate}</Text>
                      <Text style={styles.entryTitle}>{job.title}</Text>
                      <Text style={styles.entryCompany}>{job.company}</Text>
                      {job.description && <Text style={styles.entryDesc}>{job.description}</Text>}
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.rightCol}>
              {data.skills?.length > 0 && (
                <View style={styles.gradientCard}>
                  <Text style={styles.sectionLabelWhite}>Kompetenser</Text>
                  <View style={styles.skillWrap}>
                    {data.skills.map((skill, i) => (
                      <Text key={i} style={styles.skillTag}>{getSkillName(skill)}</Text>
                    ))}
                  </View>
                </View>
              )}

              {data.education?.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.sectionLabel}>Utbildning</Text>
                  {data.education.map(edu => (
                    <View key={edu.id} style={styles.eduEntry}>
                      <Text style={styles.eduTitle}>{edu.degree}</Text>
                      <Text style={styles.eduSchool}>{edu.school}</Text>
                      <Text style={styles.eduDate}>{edu.startDate} — {edu.endDate}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

// ============================================================================
// NORDIC TEMPLATE
// ============================================================================

function NordicPDF({ data, fullName }: { data: CVData; fullName: string }) {
  const accent = '#0EA5E9'

  const styles = StyleSheet.create({
    page: { flexDirection: 'row', fontFamily: 'Helvetica' },
    sidebar: { width: '35%', backgroundColor: '#F8FAFC', padding: 40, borderRight: '1pt solid #E2E8F0' },
    sidebarPhoto: { width: '100%', aspectRatio: 1, borderRadius: 16, marginBottom: 24 },
    sidebarPhotoPlaceholder: { width: '100%', aspectRatio: 1, borderRadius: 16, marginBottom: 24, backgroundColor: '#E2E8F0' },
    sidebarSection: { marginBottom: 30 },
    sidebarLabel: { fontSize: 9, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', color: '#94A3B8', marginBottom: 14 },
    sidebarText: { fontSize: 10, color: '#334155', marginBottom: 8 },
    skillText: { fontSize: 10, color: '#334155', marginBottom: 6 },
    langItem: { marginBottom: 10 },
    langRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    langName: { fontSize: 10, color: '#334155' },
    langBar: { height: 2, backgroundColor: '#E2E8F0', borderRadius: 1 },
    langBarFill: { height: 2, backgroundColor: accent, borderRadius: 1 },
    main: { flex: 1, padding: 40 },
    name: { fontSize: 36, fontWeight: 'bold', letterSpacing: -0.5, color: '#0F172A', marginBottom: 6 },
    title: { fontSize: 16, color: accent, marginBottom: 30 },
    summary: { fontSize: 12, lineHeight: 1.7, color: '#475569', marginBottom: 30, maxWidth: 400 },
    sectionLabel: { fontSize: 9, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', color: '#94A3B8', marginBottom: 20, paddingBottom: 8, borderBottom: '1pt solid #E2E8F0' },
    entry: { marginBottom: 24 },
    entryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    entryTitle: { fontSize: 14, fontWeight: 'bold', color: '#0F172A' },
    entryCompany: { fontSize: 11, color: accent },
    entryDate: { fontSize: 10, color: '#94A3B8' },
    entryDesc: { fontSize: 10, lineHeight: 1.6, color: '#64748B', marginTop: 8 },
    eduRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    eduLeft: { flex: 1 },
    eduTitle: { fontSize: 12, fontWeight: 'bold', color: '#0F172A' },
    eduSchool: { fontSize: 11, color: '#64748B' },
  })

  const getLangPercent = (level: string) => {
    const map: Record<string, number> = { 'native': 100, 'fluent': 85, 'good': 70, 'basic': 50 }
    return map[level] || 50
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.sidebar}>
          {data.profileImage ? (
            <Image src={data.profileImage} style={styles.sidebarPhoto} />
          ) : (
            <View style={styles.sidebarPhotoPlaceholder} />
          )}

          <View style={styles.sidebarSection}>
            <Text style={styles.sidebarLabel}>Kontakt</Text>
            {data.email && <Text style={styles.sidebarText}>{data.email}</Text>}
            {data.phone && <Text style={styles.sidebarText}>{data.phone}</Text>}
            {data.location && <Text style={styles.sidebarText}>{data.location}</Text>}
          </View>

          {data.skills?.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarLabel}>Kompetenser</Text>
              {data.skills.map((skill, i) => (
                <Text key={i} style={styles.skillText}>{getSkillName(skill)}</Text>
              ))}
            </View>
          )}

          {data.languages?.length > 0 && (
            <View>
              <Text style={styles.sidebarLabel}>Språk</Text>
              {data.languages.map(lang => (
                <View key={lang.id} style={styles.langItem}>
                  <View style={styles.langRow}>
                    <Text style={styles.langName}>{lang.language || lang.name}</Text>
                  </View>
                  <View style={styles.langBar}>
                    <View style={[styles.langBarFill, { width: `${getLangPercent(lang.level)}%` }]} />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.main}>
          <Text style={styles.name}>{fullName}</Text>
          {data.title && <Text style={styles.title}>{data.title}</Text>}
          {data.summary && <Text style={styles.summary}>{data.summary}</Text>}

          {data.workExperience?.length > 0 && (
            <View style={{ marginBottom: 30 }}>
              <Text style={styles.sectionLabel}>Erfarenhet</Text>
              {data.workExperience.map(job => (
                <View key={job.id} style={styles.entry}>
                  <View style={styles.entryRow}>
                    <View>
                      <Text style={styles.entryTitle}>{job.title}</Text>
                      <Text style={styles.entryCompany}>{job.company}</Text>
                    </View>
                    <Text style={styles.entryDate}>{job.startDate} — {job.current ? 'Nu' : job.endDate}</Text>
                  </View>
                  {job.description && <Text style={styles.entryDesc}>{job.description}</Text>}
                </View>
              ))}
            </View>
          )}

          {data.education?.length > 0 && (
            <View>
              <Text style={styles.sectionLabel}>Utbildning</Text>
              {data.education.map(edu => (
                <View key={edu.id} style={styles.eduRow}>
                  <View style={styles.eduLeft}>
                    <Text style={styles.eduTitle}>{edu.degree}</Text>
                    <Text style={styles.eduSchool}>{edu.school}</Text>
                  </View>
                  <Text style={styles.entryDate}>{edu.startDate} — {edu.endDate}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  )
}

// ============================================================================
// CENTERED TEMPLATE
// ============================================================================

function CenteredPDF({ data, fullName }: { data: CVData; fullName: string }) {
  const primary = '#6366F1'

  const styles = StyleSheet.create({
    page: { fontFamily: 'Helvetica', backgroundColor: '#FFFFFF' },
    header: { backgroundColor: primary, padding: 50, alignItems: 'center' },
    photo: { width: 100, height: 100, borderRadius: 50, marginBottom: 16, border: '3pt solid rgba(255,255,255,0.3)' },
    name: { fontSize: 36, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 6 },
    title: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginBottom: 20 },
    contactRow: { flexDirection: 'row', gap: 20, justifyContent: 'center' },
    contactText: { fontSize: 11, color: 'rgba(255,255,255,0.9)' },
    main: { padding: '40 50' },
    summary: { fontSize: 14, lineHeight: 1.7, color: '#4B5563', textAlign: 'center', marginBottom: 40, maxWidth: 500, alignSelf: 'center' },
    skillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 40 },
    skillTag: { fontSize: 10, fontWeight: 'bold', padding: '6 16', backgroundColor: `${primary}15`, color: primary, borderRadius: 20 },
    twoColumn: { flexDirection: 'row', gap: 50 },
    column: { flex: 1 },
    sectionLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', color: primary, marginBottom: 24 },
    entry: { marginBottom: 24, paddingLeft: 16, borderLeft: `2pt solid ${primary}30` },
    entryDate: { fontSize: 10, color: '#9CA3AF', marginBottom: 6 },
    entryTitle: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
    entryCompany: { fontSize: 11, color: primary, marginBottom: 8 },
    entryDesc: { fontSize: 10, lineHeight: 1.6, color: '#6B7280' },
    eduCard: { padding: 16, backgroundColor: '#F9FAFB', borderRadius: 10, marginBottom: 12 },
    eduTitle: { fontSize: 12, fontWeight: 'bold', color: '#111827' },
    eduSchool: { fontSize: 11, color: primary },
    eduDate: { fontSize: 10, color: '#9CA3AF', marginTop: 4 },
    langItem: { marginBottom: 12 },
    langRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    langName: { fontSize: 11, color: '#374151' },
    langLevel: { fontSize: 10, color: '#9CA3AF' },
    langBar: { height: 3, backgroundColor: '#E5E7EB', borderRadius: 2 },
    langBarFill: { height: 3, backgroundColor: primary, borderRadius: 2 },
  })

  const getLangPercent = (level: string) => {
    const map: Record<string, number> = { 'native': 100, 'fluent': 85, 'good': 70, 'basic': 50 }
    return map[level] || 50
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {data.profileImage && <Image src={data.profileImage} style={styles.photo} />}
          <Text style={styles.name}>{fullName}</Text>
          {data.title && <Text style={styles.title}>{data.title}</Text>}
          <View style={styles.contactRow}>
            {data.email && <Text style={styles.contactText}>{data.email}</Text>}
            {data.phone && <Text style={styles.contactText}>{data.phone}</Text>}
            {data.location && <Text style={styles.contactText}>{data.location}</Text>}
          </View>
        </View>

        <View style={styles.main}>
          {data.summary && <Text style={styles.summary}>{data.summary}</Text>}

          {data.skills?.length > 0 && (
            <View style={styles.skillWrap}>
              {data.skills.map((skill, i) => (
                <Text key={i} style={styles.skillTag}>{getSkillName(skill)}</Text>
              ))}
            </View>
          )}

          <View style={styles.twoColumn}>
            <View style={styles.column}>
              {data.workExperience?.length > 0 && (
                <View>
                  <Text style={styles.sectionLabel}>Erfarenhet</Text>
                  {data.workExperience.map(job => (
                    <View key={job.id} style={styles.entry}>
                      <Text style={styles.entryDate}>{job.startDate} — {job.current ? 'Nu' : job.endDate}</Text>
                      <Text style={styles.entryTitle}>{job.title}</Text>
                      <Text style={styles.entryCompany}>{job.company}</Text>
                      {job.description && <Text style={styles.entryDesc}>{job.description}</Text>}
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.column}>
              {data.education?.length > 0 && (
                <View style={{ marginBottom: 30 }}>
                  <Text style={styles.sectionLabel}>Utbildning</Text>
                  {data.education.map(edu => (
                    <View key={edu.id} style={styles.eduCard}>
                      <Text style={styles.eduTitle}>{edu.degree}</Text>
                      <Text style={styles.eduSchool}>{edu.school}</Text>
                      <Text style={styles.eduDate}>{edu.startDate} — {edu.endDate}</Text>
                    </View>
                  ))}
                </View>
              )}

              {data.languages?.length > 0 && (
                <View>
                  <Text style={styles.sectionLabel}>Språk</Text>
                  {data.languages.map(lang => (
                    <View key={lang.id} style={styles.langItem}>
                      <View style={styles.langRow}>
                        <Text style={styles.langName}>{lang.language || lang.name}</Text>
                        <Text style={styles.langLevel}>{getLanguageLevelDisplay(lang.level)}</Text>
                      </View>
                      <View style={styles.langBar}>
                        <View style={[styles.langBarFill, { width: `${getLangPercent(lang.level)}%` }]} />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

// ============================================================================
// MAIN EXPORT COMPONENT
// ============================================================================

export function CVPDFDocument({ data }: CVPDFProps) {
  const fullName = `${data.firstName} ${data.lastName}`.trim() || 'Ditt Namn'

  switch (data.template) {
    case 'minimal':
      return <MinimalPDF data={data} fullName={fullName} />
    case 'executive':
      return <ExecutivePDF data={data} fullName={fullName} />
    case 'creative':
      return <CreativePDF data={data} fullName={fullName} />
    case 'nordic':
      return <NordicPDF data={data} fullName={fullName} />
    case 'centered':
      return <CenteredPDF data={data} fullName={fullName} />
    case 'sidebar':
    default:
      return <ModernPDF data={data} fullName={fullName} />
  }
}

export default CVPDFDocument
