import { Document, Page, Text, View, StyleSheet, Link, Image, Font } from '@react-pdf/renderer'
import type { CVData } from '@/services/supabaseApi'

// Stäng av automatisk avstavning — react-pdf:s default bryter svenska ord
// som "Samhällsvetenskapligt" → "Samhällsvetenskapligt pro-gram" mitt i en
// rad. Vi vill alltid bevara ord intakta. Måste registreras INNAN första
// PDF-rendern eftersom det är global state.
Font.registerHyphenationCallback((word) => [word])

interface CVPDFProps {
  data: CVData
}

// Render-callback för fixed page-header som visas från sida 2 och uppåt.
// Returnerar tom sträng på sida 1 så headern inte syns där.
const pageHeaderText = (fullName: string) =>
  ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
    pageNumber > 1 ? `${fullName} · sida ${pageNumber} av ${totalPages}` : ''

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
    pageHeaderText: { position: 'absolute', top: 18, left: 0, right: 50, textAlign: 'right', fontSize: 8, color: '#999999', letterSpacing: 0.5 },
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
        <Text fixed style={styles.pageHeaderText} render={pageHeaderText(fullName)} />
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
                  <View key={job.id} style={styles.entry} wrap={false}>
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
                  <View key={edu.id} style={styles.entry} wrap={false}>
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
    page: { fontFamily: 'Times-Roman', backgroundColor: '#FDFCFA', paddingBottom: 36 },
    pageHeaderText: { position: 'absolute', top: 18, left: 0, right: 50, textAlign: 'right', fontSize: 8, color: '#888888', letterSpacing: 0.5, fontFamily: 'Helvetica' },
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
        <Text fixed style={styles.pageHeaderText} render={pageHeaderText(fullName)} />
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
                    <View key={job.id} style={styles.entry} wrap={false}>
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
                    <View key={edu.id} style={styles.entry} wrap={false}>
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
  const initials = `${data.firstName?.charAt(0) || ''}${data.lastName?.charAt(0) || ''}`.toUpperCase() || 'CV'

  const styles = StyleSheet.create({
    // Page-padding ger top/bottom-margin på VARJE sida (även sida 2+) — utan
    // den hamnar fortsättningstext vid övre/nedre kant. Horisontell padding
    // hanteras per-View så sidebar och main får olika sidobredd.
    page: { flexDirection: 'row', fontFamily: 'Helvetica', paddingTop: 36, paddingBottom: 36 },
    sidebar: { width: '32%', backgroundColor: '#0F0F0F', paddingHorizontal: 28, color: '#FFFFFF' },
    sidebarPhoto: { width: '100%', aspectRatio: 1, borderRadius: 12, marginBottom: 24 },
    // Mörk ruta med initialer istället för tom platshållare
    sidebarPhotoPlaceholder: { width: '100%', aspectRatio: 1, borderRadius: 12, marginBottom: 24, backgroundColor: 'rgba(255,255,255,0.05)', border: '1pt solid rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
    sidebarPhotoInitials: { fontSize: 36, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 },
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
    main: { flex: 1, paddingHorizontal: 36, backgroundColor: '#FFFFFF' },
    // pageHeader-Text behöver explicit width — annars layoutar Page (som är
    // flexDirection: row) varje bokstav som ett separat flex-item och texten
    // renderas vertikalt en char per rad.
    pageHeaderText: { position: 'absolute', top: 18, left: 0, right: 50, textAlign: 'right', fontSize: 8, color: '#888888', letterSpacing: 0.5 },
    // 36pt istället för 42pt så långa namn (ex. "Anna Andersson") inte
    // bryts olämpligt med bindestreck i den smalare main-kolumnen.
    name: { fontSize: 36, fontWeight: 'bold', letterSpacing: -0.5, color: '#0F0F0F', marginBottom: 8 },
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
        {/* Page-header som diskret visas från sida 2 — så pappren inte blandas
            ihop om de skrivs ut. Standardiserat enligt Indeed/Zety best practice. */}
        <Text fixed style={styles.pageHeaderText} render={pageHeaderText(fullName)} />
        {/* fixed=true → sidebar repeteras på varje sida så main-kolumnen kan
            spilla över utan att ENDAST vita ytor visas till vänster på sida 2+. */}
        <View style={styles.sidebar} fixed>
          {data.profileImage ? (
            <Image src={data.profileImage} style={styles.sidebarPhoto} />
          ) : (
            <View style={styles.sidebarPhotoPlaceholder}>
              <Text style={styles.sidebarPhotoInitials}>{initials}</Text>
            </View>
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
              {/* sectionTitle som upprepas på varje sida som rubriken brutits över */}
              <Text style={styles.sectionLabel}>Erfarenhet</Text>
              {data.workExperience.map(job => (
                // wrap=false → en hel jobb-entry hålls samman, inte halv-bryts
                <View key={job.id} style={styles.entry} wrap={false}>
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
                <View key={edu.id} style={styles.entry} wrap={false}>
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
  // Matchar HTML-versionen — solid magenta, ingen gradient.
  const primary = '#A21464'
  const secondary = '#A21464'

  const styles = StyleSheet.create({
    page: { fontFamily: 'Helvetica', backgroundColor: '#FAFAFA', paddingTop: 50, paddingBottom: 36 },
    pageHeaderText: { position: 'absolute', top: 18, left: 0, right: 50, textAlign: 'right', fontSize: 8, color: '#888888', letterSpacing: 0.5 },
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
    entryBadge: { fontSize: 9, fontWeight: 'bold', padding: '3 10', backgroundColor: 'rgba(162,20,100,0.1)', color: primary, borderRadius: 20, marginBottom: 8 },
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
        <Text fixed style={styles.pageHeaderText} render={pageHeaderText(fullName)} />
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
                    <View key={job.id} style={styles.entry} wrap={false}>
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
                    <View key={edu.id} style={styles.eduEntry} wrap={false}>
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
  const initials = `${data.firstName?.charAt(0) || ''}${data.lastName?.charAt(0) || ''}`.toUpperCase() || 'CV'

  const styles = StyleSheet.create({
    page: { flexDirection: 'row', fontFamily: 'Helvetica', paddingTop: 36, paddingBottom: 36 },
    pageHeaderText: { position: 'absolute', top: 18, left: 0, right: 50, textAlign: 'right', fontSize: 8, color: '#94A3B8', letterSpacing: 0.5 },
    sidebar: { width: '32%', backgroundColor: '#F8FAFC', paddingHorizontal: 36, borderRight: '1pt solid #E2E8F0' },
    sidebarPhoto: { width: '100%', aspectRatio: 1, borderRadius: 16, marginBottom: 24 },
    // Vit ruta med subtil border + initialer istället för tom grå platta
    sidebarPhotoPlaceholder: { width: '100%', aspectRatio: 1, borderRadius: 16, marginBottom: 24, backgroundColor: '#FFFFFF', border: '1pt solid #E2E8F0', alignItems: 'center', justifyContent: 'center' },
    sidebarPhotoInitials: { fontSize: 32, color: '#94A3B8', letterSpacing: 1 },
    sidebarSection: { marginBottom: 30 },
    sidebarLabel: { fontSize: 9, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', color: '#94A3B8', marginBottom: 14 },
    sidebarText: { fontSize: 10, color: '#334155', marginBottom: 8 },
    skillText: { fontSize: 10, color: '#334155', marginBottom: 6 },
    langItem: { marginBottom: 10 },
    langRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    langName: { fontSize: 10, color: '#334155' },
    langBar: { height: 2, backgroundColor: '#E2E8F0', borderRadius: 1 },
    langBarFill: { height: 2, backgroundColor: accent, borderRadius: 1 },
    main: { flex: 1, paddingHorizontal: 40 },
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
        <Text fixed style={styles.pageHeaderText} render={pageHeaderText(fullName)} />
        <View style={styles.sidebar} fixed>
          {data.profileImage ? (
            <Image src={data.profileImage} style={styles.sidebarPhoto} />
          ) : (
            <View style={styles.sidebarPhotoPlaceholder}>
              <Text style={styles.sidebarPhotoInitials}>{initials}</Text>
            </View>
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
                <View key={job.id} style={styles.entry} wrap={false}>
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
                <View key={edu.id} style={styles.eduRow} wrap={false}>
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
  // Matchar HTML-versionen — navy header med guld-accent under.
  const primary = '#1E3A5F'
  const accent = '#C9A66B'

  const styles = StyleSheet.create({
    page: { fontFamily: 'Helvetica', backgroundColor: '#FFFFFF', paddingTop: 50, paddingBottom: 36 },
    pageHeaderText: { position: 'absolute', top: 18, left: 0, right: 50, textAlign: 'right', fontSize: 8, color: '#888888', letterSpacing: 0.5 },
    header: { backgroundColor: primary, padding: 50, alignItems: 'center', borderBottom: `3pt solid ${accent}`, marginTop: -50 },
    photo: { width: 90, height: 90, borderRadius: 45, marginBottom: 16, border: '3pt solid rgba(255,255,255,0.25)' },
    name: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 6 },
    title: { fontSize: 13, fontWeight: 'normal', letterSpacing: 1, color: accent, marginBottom: 24, textTransform: 'uppercase' },
    contactRow: { flexDirection: 'row', gap: 24, justifyContent: 'center' },
    contactText: { fontSize: 10, color: 'rgba(255,255,255,0.85)' },
    main: { padding: '40 50' },
    summary: { fontSize: 13, lineHeight: 1.7, color: '#4B5563', textAlign: 'center', marginBottom: 36, maxWidth: 500, alignSelf: 'center' },
    skillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 36 },
    skillTag: { fontSize: 10, fontWeight: 'bold', padding: '6 14', backgroundColor: '#F4F1EC', color: primary, borderRadius: 4 },
    twoColumn: { flexDirection: 'row', gap: 50 },
    column: { flex: 1 },
    sectionLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', color: primary, marginBottom: 22 },
    entry: { marginBottom: 22, paddingLeft: 14, borderLeft: `2pt solid ${accent}` },
    entryDate: { fontSize: 10, color: '#9CA3AF', marginBottom: 4 },
    entryTitle: { fontSize: 13, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
    entryCompany: { fontSize: 11, color: primary, marginBottom: 8 },
    entryDesc: { fontSize: 10, lineHeight: 1.6, color: '#6B7280' },
    eduCard: { padding: 14, backgroundColor: '#F9FAFB', borderRadius: 6, marginBottom: 12 },
    eduTitle: { fontSize: 12, fontWeight: 'bold', color: '#111827' },
    eduSchool: { fontSize: 11, color: primary },
    eduDate: { fontSize: 10, color: '#9CA3AF', marginTop: 4 },
    langItem: { marginBottom: 12 },
    langRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    langName: { fontSize: 11, color: '#374151' },
    langLevel: { fontSize: 10, color: '#9CA3AF' },
    langBar: { height: 3, backgroundColor: '#E5E7EB', borderRadius: 2 },
    langBarFill: { height: 3, backgroundColor: accent, borderRadius: 2 },
  })

  const getLangPercent = (level: string) => {
    const map: Record<string, number> = { 'native': 100, 'fluent': 85, 'good': 70, 'basic': 50 }
    return map[level] || 50
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text fixed style={styles.pageHeaderText} render={pageHeaderText(fullName)} />
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
                    <View key={job.id} style={styles.entry} wrap={false}>
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
                    <View key={edu.id} style={styles.eduCard} wrap={false}>
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
// BUDAPEST TEMPLATE — Mörk sidopanel + cirkulärt foto + timeline
// ============================================================================

function BudapestPDF({ data, fullName }: { data: CVData; fullName: string }) {
  const dark = '#2C3E50'
  const accent = '#E67E22'
  const initials = `${data.firstName?.charAt(0) || ''}${data.lastName?.charAt(0) || ''}`.toUpperCase() || 'CV'

  const styles = StyleSheet.create({
    page: { flexDirection: 'row', fontFamily: 'Helvetica', paddingTop: 36, paddingBottom: 36 },
    pageHeaderText: { position: 'absolute', top: 18, left: 0, right: 50, textAlign: 'right', fontSize: 8, color: '#888888', letterSpacing: 0.5 },
    sidebar: { width: '34%', backgroundColor: dark, paddingHorizontal: 28, color: '#FFFFFF' },
    photoWrap: { alignItems: 'center', marginBottom: 30 },
    photo: { width: 120, height: 120, borderRadius: 60, border: `3pt solid ${accent}` },
    photoPlaceholder: { width: 120, height: 120, borderRadius: 60, border: `3pt solid ${accent}`, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
    photoInitials: { fontSize: 36, color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },
    sidebarLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 10, color: '#FFFFFF' },
    sidebarText: { fontSize: 10, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', marginBottom: 6 },
    sidebarDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 24 },
    main: { flex: 1, paddingHorizontal: 36, backgroundColor: '#FFFFFF' },
    // Stack contact under namn istället för bredvid — så långa svenska namn
    // får plats utan att bryts på flera rader.
    header: { marginBottom: 30 },
    name: { fontSize: 26, fontWeight: 'bold', letterSpacing: 0.8, textTransform: 'uppercase', color: dark, lineHeight: 1.15, marginBottom: 6 },
    title: { fontSize: 10, fontWeight: 'bold', letterSpacing: 2, textTransform: 'uppercase', color: '#888888', marginBottom: 14 },
    contactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, fontSize: 10, color: '#555555' },
    sectionTitle: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5, color: dark, marginBottom: 4 },
    sectionRule: { height: 1, backgroundColor: '#E5E7EB', marginBottom: 14 },
    timelineRow: { flexDirection: 'row', marginBottom: 16 },
    timelineLeft: { width: 95, paddingRight: 10 },
    timelineDot: { width: 18, alignItems: 'center', paddingTop: 4 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: dark },
    timelineRight: { flex: 1 },
    company: { fontSize: 11, fontWeight: 'bold', color: dark },
    meta: { fontSize: 9, color: '#888888' },
    jobTitle: { fontSize: 11, fontWeight: 'bold', color: dark, marginBottom: 4 },
    jobDesc: { fontSize: 10, lineHeight: 1.6, color: '#555555' },
    skillTag: { fontSize: 10, padding: '4 10', backgroundColor: '#F3F4F6', color: dark, borderRadius: 3, marginRight: 5, marginBottom: 5 },
    skillWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text fixed style={styles.pageHeaderText} render={pageHeaderText(fullName)} />
        <View style={styles.sidebar} fixed>
          <View style={styles.photoWrap}>
            {data.profileImage ? (
              <Image src={data.profileImage} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoInitials}>{initials}</Text>
              </View>
            )}
          </View>

          {data.summary && (
            <View>
              <Text style={styles.sidebarLabel}>OM MIG</Text>
              <Text style={[styles.sidebarText, { lineHeight: 1.7 }]}>{data.summary}</Text>
            </View>
          )}

          {data.links?.length > 0 && (
            <>
              <View style={styles.sidebarDivider} />
              <Text style={styles.sidebarLabel}>LÄNKAR</Text>
              {data.links.map((link) => (
                <View key={link.id} style={{ marginBottom: 8 }}>
                  {link.label && <Text style={[styles.sidebarText, { fontWeight: 'bold' }]}>{link.label}</Text>}
                  <Text style={[styles.sidebarText, { fontSize: 9 }]}>{link.url}</Text>
                </View>
              ))}
            </>
          )}

          {data.languages?.length > 0 && (
            <>
              <View style={styles.sidebarDivider} />
              <Text style={styles.sidebarLabel}>SPRÅK</Text>
              {data.languages.map((lang) => (
                <Text key={lang.id} style={styles.sidebarText}>
                  <Text style={{ fontWeight: 'bold' }}>{lang.language || lang.name}</Text> — {getLanguageLevelDisplay(lang.level)}
                </Text>
              ))}
            </>
          )}
        </View>

        <View style={styles.main}>
          <View style={styles.header}>
            <Text style={styles.name}>{fullName}</Text>
            {data.title && <Text style={styles.title}>{data.title}</Text>}
            <View style={styles.contactRow}>
              {data.location && <Text>{data.location}</Text>}
              {data.phone && <Text>{data.phone}</Text>}
              {data.email && <Text>{data.email}</Text>}
            </View>
          </View>

          {data.workExperience?.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Text style={styles.sectionTitle}>ARBETSLIVSERFARENHET</Text>
              <View style={styles.sectionRule} />
              {data.workExperience.map((job) => (
                <View key={job.id} style={styles.timelineRow} wrap={false}>
                  <View style={styles.timelineLeft}>
                    <Text style={styles.company}>{job.company}</Text>
                    {job.location && <Text style={styles.meta}>{job.location}</Text>}
                    <Text style={styles.meta}>{job.startDate} - {job.current ? 'Nu' : job.endDate}</Text>
                  </View>
                  <View style={styles.timelineDot}>
                    <View style={styles.dot} />
                  </View>
                  <View style={styles.timelineRight}>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    {job.description && <Text style={styles.jobDesc}>{job.description}</Text>}
                  </View>
                </View>
              ))}
            </View>
          )}

          {data.education?.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Text style={styles.sectionTitle}>UTBILDNING</Text>
              <View style={styles.sectionRule} />
              {data.education.map((edu) => (
                <View key={edu.id} style={styles.timelineRow} wrap={false}>
                  <View style={styles.timelineLeft}>
                    <Text style={styles.company}>{edu.school}</Text>
                    {edu.location && <Text style={styles.meta}>{edu.location}</Text>}
                    <Text style={styles.meta}>{edu.startDate} - {edu.endDate}</Text>
                  </View>
                  <View style={styles.timelineDot}>
                    <View style={styles.dot} />
                  </View>
                  <View style={styles.timelineRight}>
                    <Text style={styles.jobTitle}>{edu.degree}</Text>
                    {edu.field && <Text style={styles.jobDesc}>{edu.field}</Text>}
                  </View>
                </View>
              ))}
            </View>
          )}

          {data.skills?.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>KOMPETENSER</Text>
              <View style={styles.sectionRule} />
              <View style={styles.skillWrap}>
                {data.skills.map((skill, i) => (
                  <Text key={i} style={styles.skillTag}>{getSkillName(skill)}</Text>
                ))}
              </View>
            </View>
          )}
        </View>
      </Page>
    </Document>
  )
}

// ============================================================================
// ROTTERDAM TEMPLATE — Spacious med stort efternamn + 2-kol body
// ============================================================================

function RotterdamPDF({ data, fullName }: { data: CVData; fullName: string }) {
  const ink = '#1F2937'
  const muted = '#6B7280'
  const initials = `${data.firstName?.charAt(0) || ''}${data.lastName?.charAt(0) || ''}`.toUpperCase() || 'CV'
  const firstName = (data.firstName || '').toUpperCase()
  const lastName = (data.lastName || '').toUpperCase()

  const styles = StyleSheet.create({
    page: { padding: 50, fontFamily: 'Helvetica', backgroundColor: '#FFFFFF' },
    pageHeaderText: { position: 'absolute', top: 18, left: 0, right: 50, textAlign: 'right', fontSize: 8, color: '#888888', letterSpacing: 0.5 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    firstName: { fontSize: 14, fontWeight: 'normal', letterSpacing: 6, color: ink },
    lastName: { fontSize: 48, fontWeight: 'bold', letterSpacing: 4, lineHeight: 1, color: ink, marginTop: 4 },
    title: { fontSize: 9, fontWeight: 'bold', letterSpacing: 4, textTransform: 'uppercase', color: muted, marginTop: 6 },
    photo: { width: 80, height: 80, borderRadius: 40 },
    photoPlaceholder: { width: 80, height: 80, borderRadius: 40, border: '1pt solid #D1D5DB', alignItems: 'center', justifyContent: 'center' },
    photoInitials: { fontSize: 24, color: muted, letterSpacing: 1 },
    divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 24 },
    body: { flexDirection: 'row', gap: 36 },
    leftCol: { width: 150 },
    rightCol: { flex: 1 },
    sectionLabel: { fontSize: 9, fontWeight: 'bold', letterSpacing: 3, color: ink, marginBottom: 8, paddingBottom: 4, borderBottom: `1pt solid ${ink}` },
    sectionContent: { fontSize: 10, lineHeight: 1.7, color: '#374151' },
    eduItem: { marginBottom: 12 },
    eduTitle: { fontSize: 10, fontWeight: 'bold', color: ink },
    eduMeta: { fontSize: 9, color: muted },
    summary: { fontSize: 11, lineHeight: 1.7, color: '#374151' },
    expItem: { marginBottom: 18 },
    expMeta: { fontSize: 9, fontWeight: 'bold', letterSpacing: 1.2, color: muted, marginBottom: 4 },
    expCompany: { fontSize: 12, fontWeight: 'bold', color: ink, marginBottom: 4 },
    expDesc: { fontSize: 11, lineHeight: 1.6, color: '#4B5563' },
    langRow: { flexDirection: 'row', justifyContent: 'space-between' },
    langLevel: { color: muted },
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text fixed style={styles.pageHeaderText} render={pageHeaderText(fullName)} />
        <View style={styles.header}>
          <View>
            <Text style={styles.firstName}>{firstName || fullName.toUpperCase()}</Text>
            {lastName && <Text style={styles.lastName}>{lastName}</Text>}
            {data.title && <Text style={styles.title}>{data.title}</Text>}
          </View>
          {data.profileImage ? (
            <Image src={data.profileImage} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoInitials}>{initials}</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.body}>
          <View style={styles.leftCol}>
            <View style={{ marginBottom: 24 }}>
              <Text style={styles.sectionLabel}>KONTAKT</Text>
              <View style={styles.sectionContent}>
                {data.location && <Text>{data.location}</Text>}
                {data.phone && <Text>{data.phone}</Text>}
                {data.email && <Text>{data.email}</Text>}
              </View>
            </View>

            {data.skills?.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <Text style={styles.sectionLabel}>KOMPETENSER</Text>
                <View style={styles.sectionContent}>
                  {data.skills.map((skill, i) => (
                    <Text key={i}>{getSkillName(skill)}</Text>
                  ))}
                </View>
              </View>
            )}

            {data.education?.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <Text style={styles.sectionLabel}>UTBILDNING</Text>
                {data.education.map((edu) => (
                  <View key={edu.id} style={styles.eduItem} wrap={false}>
                    <Text style={styles.eduTitle}>{edu.degree}</Text>
                    <Text style={styles.eduMeta}>{edu.school}</Text>
                    <Text style={styles.eduMeta}>{edu.startDate} - {edu.endDate}</Text>
                  </View>
                ))}
              </View>
            )}

            {data.languages?.length > 0 && (
              <View>
                <Text style={styles.sectionLabel}>SPRÅK</Text>
                <View style={styles.sectionContent}>
                  {data.languages.map((lang) => (
                    <View key={lang.id} style={styles.langRow}>
                      <Text>{lang.language || lang.name}</Text>
                      <Text style={styles.langLevel}>{getLanguageLevelDisplay(lang.level)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          <View style={styles.rightCol}>
            {data.summary && (
              <View style={{ marginBottom: 24 }}>
                <Text style={styles.sectionLabel}>PROFIL</Text>
                <Text style={styles.summary}>{data.summary}</Text>
              </View>
            )}

            {data.workExperience?.length > 0 && (
              <View>
                <Text style={styles.sectionLabel}>ERFARENHET</Text>
                {data.workExperience.map((job) => (
                  <View key={job.id} style={styles.expItem} wrap={false}>
                    <Text style={styles.expMeta}>
                      {job.title?.toUpperCase()} · {job.startDate} - {job.current ? 'Nu' : job.endDate}
                    </Text>
                    <Text style={styles.expCompany}>{job.company}</Text>
                    {job.description && <Text style={styles.expDesc}>{job.description}</Text>}
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
// CHICAGO TEMPLATE — Centrerad header + 2-kol body med vertikal divider
// ============================================================================

function ChicagoPDF({ data, fullName }: { data: CVData; fullName: string }) {
  const ink = '#111827'
  const muted = '#6B7280'
  const initials = `${data.firstName?.charAt(0) || ''}${data.lastName?.charAt(0) || ''}`.toUpperCase() || 'CV'

  const styles = StyleSheet.create({
    page: { padding: 50, fontFamily: 'Helvetica', backgroundColor: '#FFFFFF' },
    pageHeaderText: { position: 'absolute', top: 18, left: 0, right: 50, textAlign: 'right', fontSize: 8, color: '#888888', letterSpacing: 0.5 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 18, borderBottom: '1pt solid #D1D5DB' },
    name: { fontSize: 30, fontWeight: 'normal', letterSpacing: 4, textTransform: 'uppercase', color: ink, lineHeight: 1.1 },
    title: { fontSize: 9, fontWeight: 'bold', letterSpacing: 3, textTransform: 'uppercase', color: muted, marginTop: 6 },
    monogram: { width: 70, height: 70, borderRadius: 35, border: `1pt solid ${ink}`, alignItems: 'center', justifyContent: 'center' },
    monogramText: { fontSize: 18, color: ink, letterSpacing: 1 },
    photo: { width: 60, height: 60, borderRadius: 30 },
    body: { flexDirection: 'row', gap: 30 },
    leftCol: { width: 140, paddingRight: 16, borderRight: '1pt solid #E5E7EB' },
    rightCol: { flex: 1 },
    sectionLabel: { fontSize: 9, fontWeight: 'bold', letterSpacing: 2, color: ink, marginBottom: 10 },
    leftContent: { fontSize: 10, lineHeight: 1.7, color: '#374151' },
    leftItem: { marginBottom: 4 },
    expItem: { marginBottom: 16 },
    expHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
    expTitle: { fontSize: 11, fontWeight: 'bold', color: ink, flex: 1 },
    expCompanyInline: { fontWeight: 'normal', color: '#4B5563' },
    expDate: { fontSize: 10, color: muted },
    expDesc: { fontSize: 11, lineHeight: 1.6, color: '#4B5563' },
    summary: { fontSize: 11, lineHeight: 1.7, color: '#374151' },
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text fixed style={styles.pageHeaderText} render={pageHeaderText(fullName)} />
        <View style={styles.header}>
          <View>
            <Text style={styles.name}>{fullName}</Text>
            {data.title && <Text style={styles.title}>{data.title}</Text>}
          </View>
          {data.profileImage ? (
            <View style={styles.monogram}>
              <Image src={data.profileImage} style={styles.photo} />
            </View>
          ) : (
            <View style={styles.monogram}>
              <Text style={styles.monogramText}>{initials}</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          <View style={styles.leftCol}>
            <View style={{ marginBottom: 24 }}>
              <Text style={styles.sectionLabel}>KONTAKT</Text>
              <View style={styles.leftContent}>
                {data.phone && <Text style={styles.leftItem}>{data.phone}</Text>}
                {data.email && <Text style={styles.leftItem}>{data.email}</Text>}
                {data.location && <Text>{data.location}</Text>}
              </View>
            </View>

            {data.links?.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <Text style={styles.sectionLabel}>LÄNKAR</Text>
                {data.links.map((link) => (
                  <View key={link.id} style={{ marginBottom: 8 }}>
                    {link.label && <Text style={[styles.leftContent, { fontWeight: 'bold' }]}>{link.label}</Text>}
                    <Text style={[styles.leftContent, { fontSize: 9, color: muted }]}>{link.url}</Text>
                  </View>
                ))}
              </View>
            )}

            {data.skills?.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <Text style={styles.sectionLabel}>KOMPETENSER</Text>
                <View style={styles.leftContent}>
                  {data.skills.map((skill, i) => (
                    <Text key={i}>{getSkillName(skill)}</Text>
                  ))}
                </View>
              </View>
            )}

            {data.languages?.length > 0 && (
              <View>
                <Text style={styles.sectionLabel}>SPRÅK</Text>
                <View style={styles.leftContent}>
                  {data.languages.map((lang) => (
                    <Text key={lang.id} style={{ marginBottom: 3 }}>
                      <Text style={{ fontWeight: 'bold' }}>{lang.language || lang.name}</Text> — {getLanguageLevelDisplay(lang.level)}
                    </Text>
                  ))}
                </View>
              </View>
            )}
          </View>

          <View style={styles.rightCol}>
            {data.summary && (
              <View style={{ marginBottom: 24 }}>
                <Text style={styles.sectionLabel}>OM MIG</Text>
                <Text style={styles.summary}>{data.summary}</Text>
              </View>
            )}

            {data.workExperience?.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <Text style={styles.sectionLabel}>ARBETSLIVSERFARENHET</Text>
                {data.workExperience.map((job) => (
                  <View key={job.id} style={styles.expItem} wrap={false}>
                    <View style={styles.expHeaderRow}>
                      <Text style={styles.expTitle}>
                        {job.title}
                        {job.company && <Text style={styles.expCompanyInline}>, {job.company}</Text>}
                      </Text>
                      <Text style={styles.expDate}>{job.startDate} - {job.current ? 'Nu' : job.endDate}</Text>
                    </View>
                    {job.description && <Text style={styles.expDesc}>{job.description}</Text>}
                  </View>
                ))}
              </View>
            )}

            {data.education?.length > 0 && (
              <View>
                <Text style={styles.sectionLabel}>UTBILDNING</Text>
                {data.education.map((edu) => (
                  <View key={edu.id} style={[styles.expItem, { marginBottom: 12 }]} wrap={false}>
                    <View style={styles.expHeaderRow}>
                      <Text style={styles.expTitle}>
                        {edu.degree}
                        {edu.school && <Text style={styles.expCompanyInline}>, {edu.school}</Text>}
                      </Text>
                      <Text style={styles.expDate}>{edu.startDate} - {edu.endDate}</Text>
                    </View>
                    {edu.field && <Text style={[styles.expDesc, { color: muted }]}>{edu.field}</Text>}
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
// MAIN EXPORT COMPONENT
// ============================================================================

// Filtrerar bort halvtomma entries som annars skulle ge t.ex. "• -" eller
// bara ett datum-spann i exporten. En erfarenhet räknas som meaningful om
// den har antingen titel eller företag — annars är den bara skräp från en
// klickad "Lägg till"-knapp som inte fyllts i.
function sanitize(data: CVData): CVData {
  return {
    ...data,
    workExperience: (data.workExperience || []).filter(
      (e) => (e?.title?.trim() || e?.company?.trim()),
    ),
    education: (data.education || []).filter(
      (e) => (e?.degree?.trim() || e?.school?.trim()),
    ),
    skills: (data.skills || []).filter((s) => {
      const name = typeof s === 'string' ? s : s?.name
      return !!name?.trim()
    }),
    languages: (data.languages || []).filter((l) => {
      const name = (l as { language?: string; name?: string })?.language || (l as { name?: string })?.name
      return !!name?.trim()
    }),
    certificates: (data.certificates || []).filter((c) => c?.name?.trim()),
    links: (data.links || []).filter((l) => l?.url?.trim()),
  }
}

export function CVPDFDocument({ data }: CVPDFProps) {
  const clean = sanitize(data)
  const fullName = `${clean.firstName} ${clean.lastName}`.trim() || 'Ditt Namn'

  switch (clean.template) {
    case 'minimal':
      return <MinimalPDF data={clean} fullName={fullName} />
    case 'executive':
      return <ExecutivePDF data={clean} fullName={fullName} />
    case 'creative':
      return <CreativePDF data={clean} fullName={fullName} />
    case 'nordic':
      return <NordicPDF data={clean} fullName={fullName} />
    case 'centered':
      return <CenteredPDF data={clean} fullName={fullName} />
    case 'budapest':
      return <BudapestPDF data={clean} fullName={fullName} />
    case 'rotterdam':
      return <RotterdamPDF data={clean} fullName={fullName} />
    case 'chicago':
      return <ChicagoPDF data={clean} fullName={fullName} />
    case 'sidebar':
    default:
      return <ModernPDF data={clean} fullName={fullName} />
  }
}

export default CVPDFDocument
