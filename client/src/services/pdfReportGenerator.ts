/**
 * PDF Report Generator for Consultant Analytics
 * Uses jsPDF with autotable for professional report generation
 */

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
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

export interface ReportData {
  // Summary metrics
  totalParticipants: number
  activeParticipants: number
  completedParticipants: number
  cvCompletionRate: number
  goalsCompletionRate: number
  engagementRate: number
  averageTimeToPlacement: number

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
    progressOverTime: 'Framsteg över tid',
    month: 'Månad',
    averageScore: 'Genomsnittlig poäng',
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
    progressOverTime: 'Progress Over Time',
    month: 'Month',
    averageScore: 'Average Score',
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
    participantDetails: 'Participant Details',
    name: 'Name',
    progress: 'Progress',
    lastActive: 'Last Active',
    confidential: 'Confidential Report',
    page: 'Page',
    of: 'of',
  }
}

/**
 * Generate a professional PDF report for consultant analytics
 */
export function generateConsultantReport(
  data: ReportData,
  options: ReportOptions = {}
): jsPDF {
  const {
    title,
    subtitle,
    consultantName = 'Konsulent',
    dateRange,
    includeParticipantDetails = false,
    includeCohortAnalysis = true,
    language = 'sv',
  } = options

  const labels = LABELS[language]
  const doc = new jsPDF('p', 'mm', 'a4')
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
  doc.text(`${data.averageTimeToPlacement} ${labels.days}`, margin + 60, yPos + 4)
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
      body: data.monthlyProgress.map(row => [row.month, `${row.value}%`]),
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
  if (includeCohortAnalysis && data.cohortData.length > 0) {
    checkNewPage(70)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(labels.cohortAnalysis, margin, yPos)
    yPos += 5

    autoTable(doc, {
      startY: yPos,
      head: [[labels.cohort, labels.participants, labels.cvComplete, labels.placed, labels.avgTime]],
      body: data.cohortData.map(row => [
        row.cohort,
        row.participants.toString(),
        `${row.cvComplete}%`,
        `${row.placed}%`,
        row.avgTime.toString()
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
export function downloadConsultantReport(
  data: ReportData,
  options: ReportOptions = {},
  filename?: string
): void {
  const doc = generateConsultantReport(data, options)
  const dateStr = format(new Date(), 'yyyy-MM-dd')
  const defaultFilename = `konsultrapport-${dateStr}.pdf`
  doc.save(filename || defaultFilename)
}

/**
 * Generate PDF as blob for preview or other operations
 */
export function generateReportBlob(
  data: ReportData,
  options: ReportOptions = {}
): Blob {
  const doc = generateConsultantReport(data, options)
  return doc.output('blob')
}

/**
 * Generate PDF as data URL for preview
 */
export function generateReportDataUrl(
  data: ReportData,
  options: ReportOptions = {}
): string {
  const doc = generateConsultantReport(data, options)
  return doc.output('dataurlstring')
}
