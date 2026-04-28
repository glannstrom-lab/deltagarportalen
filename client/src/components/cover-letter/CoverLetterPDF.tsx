/**
 * CoverLetterPDF — vector PDF för personligt brev via @react-pdf/renderer
 *
 * Ersätter den tidigare html2canvas-baserade lösningen som gav oklch-fel
 * och oskarp bild-PDF. Nu vector + söbar text + korrekt svensk typografi
 * (Helvetica/Times stöder åäö direkt).
 *
 * Stöd för 4 templates som matchar HTML-preview-versionerna:
 * professional, modern, minimal, executive.
 */
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { getTemplateById, getDefaultTemplate } from './templates'

export interface CoverLetterPDFData {
  content: string
  company?: string
  jobTitle?: string
  date?: string
  templateId?: string
  sender: {
    name: string
    email?: string
    phone?: string
    location?: string
  }
}

function formatDate(date?: string): string {
  if (date) return date
  return new Date().toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function parseContent(raw: string): string[] {
  return raw
    .replace(/\*\*(.*?)\*\*/g, '$1')   // ta bort markdown bold
    .replace(/\r\n/g, '\n')
    .split(/\n\n+/)
    .map((p) => p.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

// ============================================================================
// PROFESSIONAL — classic layout, turkos accent, sans-serif
// ============================================================================
function ProfessionalPDF({ data, template }: { data: CoverLetterPDFData; template: ReturnType<typeof getDefaultTemplate> }) {
  const styles = StyleSheet.create({
    page: { padding: '20mm 25mm', fontFamily: 'Helvetica', fontSize: 11, color: template.colors.text, backgroundColor: '#FFFFFF', lineHeight: 1.55 },

    header: { marginBottom: 24 },
    name: { fontSize: 22, fontWeight: 'bold', color: template.colors.header, marginBottom: 6 },
    contactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    contactText: { fontSize: 10, color: template.colors.muted },
    accentLine: { width: 64, height: 2, backgroundColor: template.colors.accent, marginTop: 16 },

    dateRow: { textAlign: 'right', marginBottom: 18, fontSize: 10, color: template.colors.muted },

    recipient: { marginBottom: 22 },
    company: { fontSize: 12, fontWeight: 'bold', color: template.colors.header, marginBottom: 2 },
    jobTitle: { fontSize: 11, fontStyle: 'italic', color: template.colors.muted },

    paragraph: { marginBottom: 12, color: template.colors.text, fontSize: 11 },

    signatureBlock: { marginTop: 24 },
    signatureGreeting: { marginBottom: 18 },
    signatureName: { fontSize: 12, fontWeight: 'bold', color: template.colors.header, marginBottom: 4 },
    signatureContact: { fontSize: 10, color: template.colors.muted, marginBottom: 2 },
  })

  const paragraphs = parseContent(data.content)
  const date = formatDate(data.date)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{data.sender.name || 'Ditt Namn'}</Text>
          <View style={styles.contactRow}>
            {data.sender.email && <Text style={styles.contactText}>{data.sender.email}</Text>}
            {data.sender.phone && <Text style={styles.contactText}>{data.sender.phone}</Text>}
            {data.sender.location && <Text style={styles.contactText}>{data.sender.location}</Text>}
          </View>
          <View style={styles.accentLine} />
        </View>

        {/* Date */}
        <Text style={styles.dateRow}>{date}</Text>

        {/* Recipient */}
        {(data.company || data.jobTitle) && (
          <View style={styles.recipient}>
            {data.company && <Text style={styles.company}>{data.company}</Text>}
            {data.jobTitle && <Text style={styles.jobTitle}>Angående: {data.jobTitle}</Text>}
          </View>
        )}

        {/* Body */}
        {paragraphs.map((p, i) => (
          <Text key={i} style={styles.paragraph}>{p}</Text>
        ))}

        {/* Signature */}
        <View style={styles.signatureBlock}>
          <Text style={styles.signatureGreeting}>Med vänliga hälsningar,</Text>
          <Text style={styles.signatureName}>{data.sender.name || 'Ditt Namn'}</Text>
          {data.sender.phone && <Text style={styles.signatureContact}>{data.sender.phone}</Text>}
          {data.sender.email && <Text style={styles.signatureContact}>{data.sender.email}</Text>}
        </View>
      </Page>
    </Document>
  )
}

// ============================================================================
// MODERN — accent-bar header, blå färg, sans-serif
// ============================================================================
function ModernPDF({ data, template }: { data: CoverLetterPDFData; template: ReturnType<typeof getDefaultTemplate> }) {
  const styles = StyleSheet.create({
    page: { fontFamily: 'Helvetica', fontSize: 11, color: template.colors.text, backgroundColor: '#FFFFFF', lineHeight: 1.55 },

    headerBg: { backgroundColor: template.colors.headerBg || '#EFF6FF', padding: '20mm 25mm 16mm 25mm', borderBottom: `2pt solid ${template.colors.accent}` },
    name: { fontSize: 24, fontWeight: 'bold', color: template.colors.header, marginBottom: 8 },
    contactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    contactText: { fontSize: 10, color: template.colors.muted },

    body: { padding: '16mm 25mm 20mm 25mm' },
    dateRow: { textAlign: 'right', marginBottom: 18, fontSize: 10, color: template.colors.muted },
    recipient: { marginBottom: 22 },
    company: { fontSize: 12, fontWeight: 'bold', color: template.colors.header, marginBottom: 2 },
    jobTitle: { fontSize: 11, fontStyle: 'italic', color: template.colors.muted },
    paragraph: { marginBottom: 12, color: template.colors.text, fontSize: 11 },
    signatureBlock: { marginTop: 24 },
    signatureGreeting: { marginBottom: 18 },
    signatureName: { fontSize: 12, fontWeight: 'bold', color: template.colors.header, marginBottom: 4 },
    signatureContact: { fontSize: 10, color: template.colors.muted, marginBottom: 2 },
  })

  const paragraphs = parseContent(data.content)
  const date = formatDate(data.date)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBg}>
          <Text style={styles.name}>{data.sender.name || 'Ditt Namn'}</Text>
          <View style={styles.contactRow}>
            {data.sender.email && <Text style={styles.contactText}>{data.sender.email}</Text>}
            {data.sender.phone && <Text style={styles.contactText}>{data.sender.phone}</Text>}
            {data.sender.location && <Text style={styles.contactText}>{data.sender.location}</Text>}
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.dateRow}>{date}</Text>

          {(data.company || data.jobTitle) && (
            <View style={styles.recipient}>
              {data.company && <Text style={styles.company}>{data.company}</Text>}
              {data.jobTitle && <Text style={styles.jobTitle}>Angående: {data.jobTitle}</Text>}
            </View>
          )}

          {paragraphs.map((p, i) => (
            <Text key={i} style={styles.paragraph}>{p}</Text>
          ))}

          <View style={styles.signatureBlock}>
            <Text style={styles.signatureGreeting}>Med vänliga hälsningar,</Text>
            <Text style={styles.signatureName}>{data.sender.name || 'Ditt Namn'}</Text>
            {data.sender.phone && <Text style={styles.signatureContact}>{data.sender.phone}</Text>}
            {data.sender.email && <Text style={styles.signatureContact}>{data.sender.email}</Text>}
          </View>
        </View>
      </Page>
    </Document>
  )
}

// ============================================================================
// MINIMAL — ingen accent, monokrom, mycket whitespace
// ============================================================================
function MinimalPDF({ data, template }: { data: CoverLetterPDFData; template: ReturnType<typeof getDefaultTemplate> }) {
  const styles = StyleSheet.create({
    page: { padding: '25mm 30mm', fontFamily: 'Helvetica', fontSize: 11, color: template.colors.text, backgroundColor: '#FFFFFF', lineHeight: 1.6 },
    header: { marginBottom: 32 },
    name: { fontSize: 18, fontWeight: 'bold', color: template.colors.header, marginBottom: 8 },
    contactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    contactText: { fontSize: 10, color: template.colors.muted },
    dateRow: { textAlign: 'right', marginBottom: 24, fontSize: 10, color: template.colors.muted },
    recipient: { marginBottom: 22 },
    company: { fontSize: 12, fontWeight: 'bold', color: template.colors.header, marginBottom: 2 },
    jobTitle: { fontSize: 11, fontStyle: 'italic', color: template.colors.muted },
    paragraph: { marginBottom: 14, color: template.colors.text, fontSize: 11 },
    signatureBlock: { marginTop: 28 },
    signatureGreeting: { marginBottom: 18 },
    signatureName: { fontSize: 12, fontWeight: 'bold', color: template.colors.header, marginBottom: 4 },
    signatureContact: { fontSize: 10, color: template.colors.muted, marginBottom: 2 },
  })

  const paragraphs = parseContent(data.content)
  const date = formatDate(data.date)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{data.sender.name || 'Ditt Namn'}</Text>
          <View style={styles.contactRow}>
            {data.sender.email && <Text style={styles.contactText}>{data.sender.email}</Text>}
            {data.sender.phone && <Text style={styles.contactText}>{data.sender.phone}</Text>}
            {data.sender.location && <Text style={styles.contactText}>{data.sender.location}</Text>}
          </View>
        </View>

        <Text style={styles.dateRow}>{date}</Text>

        {(data.company || data.jobTitle) && (
          <View style={styles.recipient}>
            {data.company && <Text style={styles.company}>{data.company}</Text>}
            {data.jobTitle && <Text style={styles.jobTitle}>Angående: {data.jobTitle}</Text>}
          </View>
        )}

        {paragraphs.map((p, i) => (
          <Text key={i} style={styles.paragraph}>{p}</Text>
        ))}

        <View style={styles.signatureBlock}>
          <Text style={styles.signatureGreeting}>Med vänliga hälsningar,</Text>
          <Text style={styles.signatureName}>{data.sender.name || 'Ditt Namn'}</Text>
          {data.sender.phone && <Text style={styles.signatureContact}>{data.sender.phone}</Text>}
          {data.sender.email && <Text style={styles.signatureContact}>{data.sender.email}</Text>}
        </View>
      </Page>
    </Document>
  )
}

// ============================================================================
// EXECUTIVE — Times serif, gold accent, formell
// ============================================================================
function ExecutivePDF({ data, template }: { data: CoverLetterPDFData; template: ReturnType<typeof getDefaultTemplate> }) {
  const styles = StyleSheet.create({
    page: { padding: '20mm 25mm', fontFamily: 'Times-Roman', fontSize: 11, color: template.colors.text, backgroundColor: '#FFFFFF', lineHeight: 1.55 },
    header: { marginBottom: 24 },
    name: { fontSize: 24, fontFamily: 'Times-Bold', color: template.colors.header, marginBottom: 6 },
    contactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    contactText: { fontSize: 10, fontFamily: 'Times-Roman', color: template.colors.muted },
    accentLine: { width: 96, height: 1, backgroundColor: template.colors.accent, marginTop: 16 },
    dateRow: { textAlign: 'right', marginBottom: 22, fontSize: 11, color: template.colors.muted },
    recipient: { marginBottom: 22 },
    company: { fontSize: 12, fontFamily: 'Times-Bold', color: template.colors.header, marginBottom: 2 },
    jobTitle: { fontSize: 11, fontFamily: 'Times-Italic', color: template.colors.muted },
    paragraph: { marginBottom: 12, color: template.colors.text, fontSize: 11 },
    signatureBlock: { marginTop: 28 },
    signatureGreeting: { marginBottom: 18 },
    signatureName: { fontSize: 13, fontFamily: 'Times-Bold', color: template.colors.header, marginBottom: 4 },
    signatureContact: { fontSize: 10, color: template.colors.muted, marginBottom: 2 },
  })

  const paragraphs = parseContent(data.content)
  const date = formatDate(data.date)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{data.sender.name || 'Ditt Namn'}</Text>
          <View style={styles.contactRow}>
            {data.sender.email && <Text style={styles.contactText}>{data.sender.email}</Text>}
            {data.sender.phone && <Text style={styles.contactText}>{data.sender.phone}</Text>}
            {data.sender.location && <Text style={styles.contactText}>{data.sender.location}</Text>}
          </View>
          <View style={styles.accentLine} />
        </View>

        <Text style={styles.dateRow}>{date}</Text>

        {(data.company || data.jobTitle) && (
          <View style={styles.recipient}>
            {data.company && <Text style={styles.company}>{data.company}</Text>}
            {data.jobTitle && <Text style={styles.jobTitle}>Angående: {data.jobTitle}</Text>}
          </View>
        )}

        {paragraphs.map((p, i) => (
          <Text key={i} style={styles.paragraph}>{p}</Text>
        ))}

        <View style={styles.signatureBlock}>
          <Text style={styles.signatureGreeting}>Med vänliga hälsningar,</Text>
          <Text style={styles.signatureName}>{data.sender.name || 'Ditt Namn'}</Text>
          {data.sender.phone && <Text style={styles.signatureContact}>{data.sender.phone}</Text>}
          {data.sender.email && <Text style={styles.signatureContact}>{data.sender.email}</Text>}
        </View>
      </Page>
    </Document>
  )
}

// ============================================================================
// PUBLIC: routar till rätt template-PDF
// ============================================================================
export function CoverLetterPDF({ data }: { data: CoverLetterPDFData }) {
  const template = getTemplateById(data.templateId || 'professional') || getDefaultTemplate()

  switch (template.id) {
    case 'modern':
      return <ModernPDF data={data} template={template} />
    case 'minimal':
      return <MinimalPDF data={data} template={template} />
    case 'executive':
      return <ExecutivePDF data={data} template={template} />
    case 'professional':
    default:
      return <ProfessionalPDF data={data} template={template} />
  }
}
