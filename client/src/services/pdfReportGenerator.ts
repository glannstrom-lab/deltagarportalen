/**
 * PDF Report Generator for Consultant Analytics
 * Uses jsPDF with autotable for professional report generation
 *
 * PERFORMANCE: Uses dynamic import to load jsPDF (~167KB + autoTable)
 * only when PDF generation is actually requested.
 */

import type { jsPDF } from 'jspdf'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'

// Extend jsPDF type for autotable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number
    }
  }
}

// Lazy-load jsPDF and autoTable to reduce initial bundle
let jsPDFModule: typeof import('jspdf') | null = null
let autoTableModule: typeof import('jspdf-autotable') | null = null

async function loadPDFLibraries(): Promise<typeof import('jspdf').jsPDF> {
  if (!jsPDFModule) {
    const [jspdfLib, autoTableLib] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ])
    jsPDFModule = jspdfLib
    autoTableModule = autoTableLib
  }
  return jsPDFModule.jsPDF
}

export interface ReportData {
  // Summary metrics
  totalParticipants: number
  activeParticipants: number
  completedParticipants: number
  cvCompletionRate: number
  goalsCompletionRate: number
  engagementRate: number
  /**
   * Dagar från kopplingen till jobbets start, eller `null` utan mätbart
   * underlag. RR4/RK11 (2026-09-27): var `number`, och anroparen skickade
   * `?? 0` — PDF:en sa "0 dagar" där vyn sa "—". Utan underlag skrivs "—"
   * och `averageTimeToPlacementNote`.
   */
  averageTimeToPlacement: number | null
  /** En rad om varför snittet saknas eller vilka placeringar som inte räknats. */
  averageTimeToPlacementNote?: string | null

  // Monthly progress
  monthlyProgress: Array<{ month: string; value: number }>

  // Status distribution
  statusDistribution: Array<{ label: string; value: number }>

  // Top goal categories
  topGoalCategories: Array<{ category: string; count: number }>

  // Cohort data
  cohortData: Array<{
    cohort: string
    participants: number
    cvComplete: number
    placed: number
    avgTime: number
  }>

  // Participant details (optional)
  participants?: Array<{
    name: string
    status: string
    progress: number
    goals: number
    lastActive: string
  }>
}

export interface ReportOptions {
  title?: string
  subtitle?: string
  consultantName?: string
  dateRange?: string
  includeParticipantDetails?: boolean
  includeCohortAnalysis?: boolean
  language?: 'sv' | 'en'
}

// Colors matching the Violet/Stone design system
const COLORS = {
  primary: [109, 40, 217] as [number, number, number],      // Violet-600
  primaryLight: [139, 92, 246] as [number, number, number], // Violet-500
  secondary: [87, 83, 78] as [number, number, number],      // Stone-600
  success: [16, 185, 129] as [number, number, number],      // Emerald-500
  warning: [245, 158, 11] as [number, number, number],      // Amber-500
  danger: [239, 68, 68] as [number, number, number],        // Red-500
  background: [250, 250, 249] as [number, number, number],  // Stone-50
  border: [214, 211, 209] as [number, number, number],      // Stone-300
  text: [28, 25, 23] as [number, number, number],           // Stone-900
  textLight: [120, 113, 108] as [number, number, number],   // Stone-500
}

const LABELS = {
  sv: {
    title: 'Konsultrapport',
    subtitle: 'Sammanfattning av deltagarframsteg',
    generatedOn: 'Genererad',
    overview: 'Översikt',
    totalParticipants: 'Totalt deltagare',
    activeParticipants: 'Aktiva deltagare',
    completedParticipants: 'Avslutade deltagare',
    keyMetrics: 'Nyckeltal',
    cvCompletion: 'CV-komplettering',
    goalsCompletion: 'Måluppfyllelse',
    engagement: 'Engagemang',
    avgPlacementTime: 'Genomsnittlig placeringstid',
    days: 'dagar',
    day: 'dag',
    progressOverTime: 'Framsteg över tid',
    month: 'Månad',
    averageScore: 'Slutförda mål och placeringar',
    statusDistribution: 'Statusfördelning',
    status: 'Status',
    count: 'Antal',
    percentage: 'Procent',
    topGoalCategories: 'Vanligaste målkategorierna',
    category: 'Kategori',
    goals: 'Mål',
    cohortAnalysis: 'Kohortanalys',
    cohort: 'Kohort',
    participants: 'Deltagare',
    cvComplete: 'CV-komplett',
    placed: 'Placerade',
    avgTime: 'Snitt tid (dagar)',
    noCohortData: 'Inga deltagare med kopplingsdatum i underlaget — ingen kohort att visa.',
    dash: '—',
    participantDetails: 'Deltagardetaljer',
    name: 'Namn',
    progress: 'Framsteg',
    lastActive: 'Senast aktiv',
    confidential: 'Konfidentiell rapport',
    page: 'Sida',
    of: 'av',
  },
  en: {
    title: 'Consultant Report',
    subtitle: 'Participant Progress Summary',
    generatedOn: 'Generated',
    overview: 'Overview',
    totalParticipants: 'Total Participants',
    activeParticipants: 'Active Participants',
    completedParticipants: 'Completed Participants',
    keyMetrics: 'Key Metrics',
    cvCompletion: 'CV Completion',
    goalsCompletion: 'Goals Completion',
    engagement: 'Engagement',
    avgPlacementTime: 'Average Placement Time',
    days: 'days',
    day: 'day',
    progressOverTime: 'Progress Over Time',
    month: 'Month',
    averageScore: 'Completed goals and placements',
    statusDistribution: 'Status Distribution',
    status: 'Status',
    count: 'Count',
    percentage: 'Percentage',
    topGoalCategories: 'Top Goal Categories',
    category: 'Category',
    goals: 'Goals',
    cohortAnalysis: 'Cohort Analysis',
    cohort: 'Cohort',
    participants: 'Participants',
    cvComplete: 'CV Complete',
    placed: 'Placed',
    avgTime: 'Avg Time (days)',
    noCohortData: 'No participants with a start date in the data — no cohort to show.',
    dash: '—',
    participantDetails: 'Participant Details',
    name: 'Name',
    progress: 'Progress',
    lastActive: 'Last Active',
    confidential: 'Confidential Report',
    page: 'Page',
    of: 'of',
  }
}

type Etiketter = (typeof LABELS)['sv']

/**
 * RK11: placeringstiden som text. `null` → "—", aldrig "0 dagar".
 * Exporterad så testet kan kontrollera den utan PDF.
 */
export function placeringstidText(varde: number | null, labels: Pick<Etiketter, 'days' | 'day' | 'dash'> = LABELS.sv): string {
  // RR16 (rollspelet 2026-09-27): "1 dagar".
  return varde === null ? labels.dash : `${varde} ${varde === 1 ? labels.day : labels.days}`
}

/**
 * RK11: kohortraderna. `avgTime` 0 betyder i `cohorts.ts` "inget mätbart par"
 * och visas som "—" — en kohort utan placering har ingen snittid, inte 0 dagar.
 */
export function kohortRader(rader: ReportData['cohortData'], labels: Pick<Etiketter, 'dash'> = LABELS.sv): string[][] {
  return rader.map((row) => [
    row.cohort,
    row.participants.toString(),
    `${row.cvComplete}%`,
    `${row.placed}%`,
    row.avgTime > 0 ? row.avgTime.toString() : labels.dash,
  ])
}

/**
 * RK11: månadsserien är ett ANTAL (slutförda mål + placeringar per månad, se
 * `computeMonthlyProgress`), inte en procentsats. PDF:en skrev "Sep 0%" under
 * rubriken "Genomsnittlig poäng".
 */
export function framstegRader(serie: ReportData['monthlyProgress']): string[][] {
  return serie.map((row) => [row.month, String(row.value)])
}

/**
 * Generate a professional PDF report for consultant analytics
 */
export async function generateConsultantReport(
  data: ReportData,
  options: ReportOptions = {}
): Promise<jsPDF> {
  const {
    title,
    subtitle,
    consultantName = 'Konsulent',
    dateRange,
    includeParticipantDetails = false,
    includeCohortAnalysis = true,
    language = 'sv',
  } = options

  // Lazy load PDF libraries
  const jsPDFClass = await loadPDFLibraries()
  const { default: autoTable } = autoTableModule!

  const labels = LABELS[language]
  const doc = new jsPDFClass('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let yPos = margin

  // Helper function to add new page if needed
  const checkNewPage = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - 30) {
      doc.addPage()
      yPos = margin
      return true
    }
    return false
  }

  // Header
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, 0, pageWidth, 45, 'F')

  // Title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text(title || labels.title, margin, 25)

  // Subtitle
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(subtitle || labels.subtitle, margin, 35)

  // Consultant name and date on header right
  const dateStr = format(new Date(), 'PPP', { locale: language === 'sv' ? sv : undefined })
  doc.setFontSize(10)
  doc.text(consultantName, pageWidth - margin, 20, { align: 'right' })
  doc.text(`${labels.generatedOn}: ${dateStr}`, pageWidth - margin, 28, { align: 'right' })
  if (dateRange) {
    doc.text(dateRange, pageWidth - margin, 36, { align: 'right' })
  }

  yPos = 60

  // Overview Section
  doc.setTextColor(...COLORS.text)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(labels.overview, margin, yPos)
  yPos += 10

  // Summary cards
  const cardWidth = (pageWidth - margin * 2 - 10) / 3
  const cardHeight = 28
  const cardData = [
    { label: labels.totalParticipants, value: data.totalParticipants.toString() },
    { label: labels.activeParticipants, value: data.activeParticipants.toString() },
    { label: labels.completedParticipants, value: data.completedParticipants.toString() },
  ]

  cardData.forEach((card, index) => {
    const x = margin + index * (cardWidth + 5)

    // Card background
    doc.setFillColor(...COLORS.background)
    doc.setDrawColor(...COLORS.border)
    doc.roundedRect(x, yPos, cardWidth, cardHeight, 3, 3, 'FD')

    // Card content
    doc.setTextColor(...COLORS.textLight)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(card.label, x + 5, yPos + 10)

    doc.setTextColor(...COLORS.text)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(card.value, x + 5, yPos + 22)
  })

  yPos += cardHeight + 15

  // Key Metrics Section
  doc.setTextColor(...COLORS.text)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(labels.keyMetrics, margin, yPos)
  yPos += 8

  // Progress bars for key metrics
  const metrics = [
    { label: labels.cvCompletion, value: data.cvCompletionRate, color: COLORS.success },
    { label: labels.goalsCompletion, value: data.goalsCompletionRate, color: COLORS.primary },
    { label: labels.engagement, value: data.engagementRate, color: COLORS.primaryLight },
  ]

  metrics.forEach(metric => {
    doc.setTextColor(...COLORS.text)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(metric.label, margin, yPos + 4)
    doc.text(`${metric.value}%`, pageWidth - margin, yPos + 4, { align: 'right' })

    // Progress bar background
    const barWidth = pageWidth - margin * 2 - 80
    doc.setFillColor(...COLORS.border)
    doc.roundedRect(margin + 80, yPos, barWidth, 5, 2, 2, 'F')

    // Progress bar fill
    doc.setFillColor(...metric.color)
    doc.roundedRect(margin + 80, yPos, (barWidth * metric.value) / 100, 5, 2, 2, 'F')

    yPos += 12
  })

  // Average placement time
  doc.setTextColor(...COLORS.text)
  doc.setFontSize(10)
  doc.text(`${labels.avgPlacementTime}: `, margin, yPos + 4)
  doc.setFont('helvetica', 'bold')
  doc.text(placeringstidText(data.averageTimeToPlacement, labels), margin + 60, yPos + 4)
  if (data.averageTimeToPlacementNote) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.textLight)
    const brutna = doc.splitTextToSize(data.averageTimeToPlacementNote, pageWidth - margin * 2) as string[]
    doc.text(brutna, margin, yPos + 10)
    yPos += brutna.length * 3.5
    doc.setTextColor(...COLORS.text)
  }
  yPos += 20

  // Progress Over Time Table
  checkNewPage(60)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...COLORS.text)
  doc.text(labels.progressOverTime, margin, yPos)
  yPos += 5

  if (data.monthlyProgress.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [[labels.month, labels.averageScore]],
      body: framstegRader(data.monthlyProgress),
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: COLORS.background,
      },
    })
    yPos = doc.lastAutoTable.finalY + 15
  }

  // Status Distribution Table
  checkNewPage(50)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(labels.statusDistribution, margin, yPos)
  yPos += 5

  if (data.statusDistribution.length > 0) {
    const total = data.statusDistribution.reduce((sum, s) => sum + s.value, 0)
    autoTable(doc, {
      startY: yPos,
      head: [[labels.status, labels.count, labels.percentage]],
      body: data.statusDistribution.map(row => [
        row.label,
        row.value.toString(),
        `${Math.round((row.value / Math.max(total, 1)) * 100)}%`
      ]),
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: COLORS.background,
      },
    })
    yPos = doc.lastAutoTable.finalY + 15
  }

  // Top Goal Categories Table
  checkNewPage(60)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(labels.topGoalCategories, margin, yPos)
  yPos += 5

  if (data.topGoalCategories.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [[labels.category, labels.goals]],
      body: data.topGoalCategories.map(row => [row.category, row.count.toString()]),
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: COLORS.background,
      },
    })
    yPos = doc.lastAutoTable.finalY + 15
  }

  // Cohort Analysis Table
  if (includeCohortAnalysis && data.cohortData.length === 0) {
    checkNewPage(30)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(labels.cohortAnalysis, margin, yPos)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`${labels.dash} ${labels.noCohortData}`, margin, yPos + 8)
    yPos += 20
  }
  if (includeCohortAnalysis && data.cohortData.length > 0) {
    checkNewPage(70)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(labels.cohortAnalysis, margin, yPos)
    yPos += 5

    autoTable(doc, {
      startY: yPos,
      head: [[labels.cohort, labels.participants, labels.cvComplete, labels.placed, labels.avgTime]],
      body: kohortRader(data.cohortData, labels),
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: COLORS.background,
      },
    })
    yPos = doc.lastAutoTable.finalY + 15
  }

  // Participant Details (optional)
  if (includeParticipantDetails && data.participants && data.participants.length > 0) {
    checkNewPage(80)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(labels.participantDetails, margin, yPos)
    yPos += 5

    autoTable(doc, {
      startY: yPos,
      head: [[labels.name, labels.status, labels.progress, labels.goals, labels.lastActive]],
      body: data.participants.map(p => [
        p.name,
        p.status,
        `${p.progress}%`,
        p.goals.toString(),
        p.lastActive
      ]),
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: COLORS.background,
      },
    })
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)

    // Footer line
    doc.setDrawColor(...COLORS.border)
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15)

    // Footer text
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.textLight)
    doc.text(labels.confidential, margin, pageHeight - 10)
    doc.text(
      `${labels.page} ${i} ${labels.of} ${totalPages}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    )
  }

  return doc
}

/**
 * Generate and download the PDF report
 */
export async function downloadConsultantReport(
  data: ReportData,
  options: ReportOptions = {},
  filename?: string
): Promise<void> {
  const doc = await generateConsultantReport(data, options)
  const dateStr = format(new Date(), 'yyyy-MM-dd')
  const defaultFilename = `konsultrapport-${dateStr}.pdf`
  doc.save(filename || defaultFilename)
}

/**
 * Generate PDF as data URL for preview
 */
export async function generateReportDataUrl(
  data: ReportData,
  options: ReportOptions = {}
): Promise<string> {
  const doc = await generateConsultantReport(data, options)
  return doc.output('dataurlstring')
}
