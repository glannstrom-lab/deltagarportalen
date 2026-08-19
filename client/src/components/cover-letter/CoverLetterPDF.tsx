/**
 * CoverLetterPDF — vector PDF för personligt brev via @react-pdf/renderer
 *
 * Ersätter den tidigare html2canvas-baserade lösningen som gav oklch-fel
 * och oskarp bild-PDF. Nu vector + söbar text + korrekt svensk typografi
 * (Helvetica/Times stöder åäö direkt).
 *
 * Stöd för 4 templates som matchar HTML-preview-versionerna:
 * professional, modern, minimal, executive.
 *
 * TVÅ REGLER SOM KOSTAT BUGGAR ATT LÄRA SIG — bryt dem inte:
 *
 * 1. **Marginalerna hör hemma på `<Page>`, aldrig på en View som bryts.**
 *    Samma fel som CV-PDF:en hade 2026-07-03. Modern-mallen la sin padding på
 *    två Views (`headerBg` + `body`); när brevet spillde över tappade sida 2
 *    hela toppmarginalen (uppmätt med pdfjs: översta textraden 0,4 mm OVANFÖR
 *    papperskanten) och sida 3 blev helt blank (16 ritoperationer, 0 text).
 *    Vill man ha ett färgband kant-till-kant görs det med NEGATIVA marginaler
 *    mot sidans padding — då gäller marginalen fortfarande på varje sida.
 *    Vaktat av `CoverLetterPDF.test.tsx`, som mäter millimetrarna.
 *
 * 2. **Ingen platshållare får följa med ut till en arbetsgivare.**
 *    Namnet skrevs tidigare som `data.sender.name || 'Ditt Namn'` på åtta
 *    ställen. 28 av 92 profiler i prod saknar förnamn, 83 saknar telefon och
 *    ort — och `profileStore` persistar inte profilen, så den är null vid
 *    varje sidladdning medan PDF-knappen redan går att klicka. En rad utan
 *    underlag UTELÄMNAS; den gissas aldrig.
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
    name?: string
    email?: string
    phone?: string
    location?: string
  }
}

/**
 * Tolkar datumsträngen som följer med brevet.
 *
 * Vägen från Mina brev skickar `cover_letters.created_at` rått ur databasen
 * ("2026-02-23 21:26:02.810016+00"), och den strängen stod tidigare
 * oförändrad i brevets datumrad. Postgres-formen har mellanslag i stället för
 * `T` och tvåsiffrig offset, så den normaliseras innan andra försöket.
 */
function parseDate(raw: string): Date | null {
  const direct = new Date(raw)
  if (!Number.isNaN(direct.getTime())) return direct

  const normalized = raw.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00')
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/**
 * Skriver datumet som en människa skriver det: "23 februari 2026".
 * Går strängen inte att tolka lämnas den orörd i stället för att bytas mot
 * dagens datum — ett brev som ljuger om sitt datum är värre än ett som visar
 * en sträng vi inte förstod.
 */
function formatDate(date?: string): string {
  const parsed = date ? parseDate(date) : new Date()
  if (!parsed) return date as string
  return parsed.toLocaleDateString('sv-SE', {
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

/** Tom sträng och blanksteg räknas som "saknas" — inte som ett namn. */
function trimmed(value?: string): string | undefined {
  const v = value?.trim()
  return v ? v : undefined
}

type Template = ReturnType<typeof getDefaultTemplate>

// ============================================================================
// PROFESSIONAL — classic layout, turkos accent, sans-serif
// ============================================================================
function ProfessionalPDF({ data, template }: { data: CoverLetterPDFData; template: Template }) {
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
  const name = trimmed(data.sender.name)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {name && <Text style={styles.name}>{name}</Text>}
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
          {name && <Text style={styles.signatureName}>{name}</Text>}
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
function ModernPDF({ data, template }: { data: CoverLetterPDFData; template: Template }) {
  const styles = StyleSheet.create({
    // Marginalerna ligger på sidan, inte på Views — se filhuvudet, regel 1.
    page: {
      paddingTop: '20mm',
      paddingBottom: '20mm',
      paddingHorizontal: '25mm',
      fontFamily: 'Helvetica',
      fontSize: 11,
      color: template.colors.text,
      backgroundColor: '#FFFFFF',
      lineHeight: 1.55,
    },

    // Färgbandet får gå kant-till-kant på sida 1 genom att dra ut sig med
    // NEGATIVA marginaler mot sidans padding. Sidans marginaler gäller
    // fortfarande på sida 2 och framåt — det var hela poängen med flytten.
    headerBg: {
      backgroundColor: template.colors.headerBg || '#EFF6FF',
      marginTop: '-20mm',
      marginHorizontal: '-25mm',
      paddingTop: '20mm',
      paddingBottom: '16mm',
      paddingHorizontal: '25mm',
      marginBottom: '16mm',
      borderBottom: `2pt solid ${template.colors.accent}`,
    },
    name: { fontSize: 24, fontWeight: 'bold', color: template.colors.header, marginBottom: 8 },
    contactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    contactText: { fontSize: 10, color: template.colors.muted },

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
  const name = trimmed(data.sender.name)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBg}>
          {name && <Text style={styles.name}>{name}</Text>}
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
          {name && <Text style={styles.signatureName}>{name}</Text>}
          {data.sender.phone && <Text style={styles.signatureContact}>{data.sender.phone}</Text>}
          {data.sender.email && <Text style={styles.signatureContact}>{data.sender.email}</Text>}
        </View>
      </Page>
    </Document>
  )
}

// ============================================================================
// MINIMAL — ingen accent, monokrom, mycket whitespace
// ============================================================================
function MinimalPDF({ data, template }: { data: CoverLetterPDFData; template: Template }) {
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
  const name = trimmed(data.sender.name)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {name && <Text style={styles.name}>{name}</Text>}
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
          {name && <Text style={styles.signatureName}>{name}</Text>}
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
function ExecutivePDF({ data, template }: { data: CoverLetterPDFData; template: Template }) {
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
  const name = trimmed(data.sender.name)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {name && <Text style={styles.name}>{name}</Text>}
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
          {name && <Text style={styles.signatureName}>{name}</Text>}
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
