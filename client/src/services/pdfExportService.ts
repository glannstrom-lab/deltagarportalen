/**
 * PDF Export Service
 * Genererar PDF-dokument för CV och jobbannonser
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CVData, JobData } from '@/types/pdf.types';

// Re-export types for bakåtkompatibilitet
export type { CVData, JobData } from '@/types/pdf.types';

// Make autoTable available on jsPDF
(jsPDF as any).autoTable = autoTable;

/**
 * Generera PDF från CV-data
 */
export async function generateCVPDF(cvData: CVData): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header med namn
  doc.setFontSize(24);
  doc.setTextColor(30, 58, 138); // Primary color
  doc.text(`${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`, 20, yPos);
  yPos += 10;

  // Kontaktinformation
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const contactInfo = [
    cvData.personalInfo.email,
    cvData.personalInfo.phone,
    cvData.personalInfo.city,
    cvData.personalInfo.linkedIn,
  ].filter(Boolean).join(' | ');
  doc.text(contactInfo, 20, yPos);
  yPos += 15;

  // Linje
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 10;

  // Sammanfattning
  if (cvData.summary) {
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text('Sammanfattning', 20, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const splitSummary = doc.splitTextToSize(cvData.summary, pageWidth - 40);
    doc.text(splitSummary, 20, yPos);
    yPos += splitSummary.length * 5 + 10;
  }

  // Arbetslivserfarenhet
  if (cvData.experience.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text('Arbetslivserfarenhet', 20, yPos);
    yPos += 8;

    cvData.experience.forEach(exp => {
      // Titel och företag
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      doc.text(exp.title, 20, yPos);
      yPos += 5;

      // Företag och datum
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const dateStr = exp.current 
        ? `${exp.startDate} - Pågående`
        : `${exp.startDate} - ${exp.endDate || ''}`;
      doc.text(`${exp.company} | ${dateStr}`, 20, yPos);
      yPos += 5;

      // Beskrivning
      if (exp.description) {
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        const splitDesc = doc.splitTextToSize(exp.description, pageWidth - 40);
        doc.text(splitDesc, 20, yPos);
        yPos += splitDesc.length * 4 + 8;
      } else {
        yPos += 5;
      }

      // Lägg till ny sida om vi närmar oss slutet
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
    });
  }

  // Utbildning
  if (cvData.education.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text('Utbildning', 20, yPos);
    yPos += 8;

    cvData.education.forEach(edu => {
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      doc.text(edu.degree, 20, yPos);
      yPos += 5;

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const dateStr = edu.endDate 
        ? `${edu.startDate} - ${edu.endDate}`
        : `${edu.startDate} - Pågående`;
      doc.text(`${edu.school} | ${dateStr}`, 20, yPos);
      yPos += 10;

      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    });
  }

  // Kompetenser
  if (cvData.skills.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text('Kompetenser', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const skillsText = cvData.skills.join(' • ');
    const splitSkills = doc.splitTextToSize(skillsText, pageWidth - 40);
    doc.text(splitSkills, 20, yPos);
    yPos += splitSkills.length * 5 + 10;
  }

  // Språk
  if (cvData.languages.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text('Språk', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    cvData.languages.forEach(lang => {
      doc.text(`${lang.language}: ${lang.level}`, 20, yPos);
      yPos += 5;
    });
  }

  // Sertifikat
  if (cvData.certifications && cvData.certifications.length > 0) {
    yPos += 5;
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text('Certifieringar', 20, yPos);
    yPos += 8;

    cvData.certifications.forEach(cert => {
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.text(cert.name, 20, yPos);
      yPos += 5;
      
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`${cert.issuer} • ${cert.date}`, 20, yPos);
      yPos += 8;
    });
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Genererat från Deltagarportalen • Sida ${i} av ${totalPages}`,
      pageWidth / 2,
      290,
      { align: 'center' }
    );
  }

  return doc.output('blob');
}

/**
 * Generera PDF från jobbannons
 */
export async function generateJobPDF(jobData: JobData): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Titel
  doc.setFontSize(20);
  doc.setTextColor(30, 58, 138);
  doc.text(jobData.headline, 20, yPos);
  yPos += 10;

  // Arbetsgivare
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text(jobData.employer.name, 20, yPos);
  yPos += 8;

  // Plats
  if (jobData.workplace_address) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `${jobData.workplace_address.municipality}, ${jobData.workplace_address.region}`,
      20,
      yPos
    );
    yPos += 8;
  }

  // Anställningstyp
  if (jobData.employment_type) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Anställningstyp: ${jobData.employment_type.label}`, 20, yPos);
    yPos += 8;
  }

  // Publiceringsdatum
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  const pubDate = new Date(jobData.publication_date).toLocaleDateString('sv-SE');
  doc.text(`Publicerad: ${pubDate}`, 20, yPos);
  yPos += 15;

  // Linje
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 10;

  // Beskrivning
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  
  // Rensa HTML-taggar från beskrivning
  const cleanDescription = jobData.description.text
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
  
  const splitDesc = doc.splitTextToSize(cleanDescription, pageWidth - 40);
  doc.text(splitDesc, 20, yPos);
  yPos += splitDesc.length * 5 + 15;

  // Ansökan
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setTextColor(30, 58, 138);
  doc.text('Ansökan', 20, yPos);
  yPos += 10;

  if (jobData.application_details) {
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    
    if (jobData.application_details.email) {
      doc.text(`E-post: ${jobData.application_details.email}`, 20, yPos);
      yPos += 6;
    }
    
    if (jobData.application_details.url) {
      doc.text(`Länk: ${jobData.application_details.url}`, 20, yPos);
      yPos += 6;
    }
    
    if (jobData.application_details.reference) {
      doc.text(`Referens: ${jobData.application_details.reference}`, 20, yPos);
      yPos += 6;
    }
  }

  if (jobData.last_publication_date) {
    yPos += 5;
    doc.setFontSize(10);
    doc.setTextColor(200, 50, 50);
    const lastDate = new Date(jobData.last_publication_date).toLocaleDateString('sv-SE');
    doc.text(`Sista ansökningsdag: ${lastDate}`, 20, yPos);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Sparad från Deltagarportalen • Arbetsförmedlingen`,
    pageWidth / 2,
    290,
    { align: 'center' }
  );

  return doc.output('blob');
}

/**
 * Generera ansökningshistorik PDF
 */
export async function generateApplicationHistoryPDF(
  applications: Array<{
    jobTitle: string;
    company: string;
    appliedDate: string;
    status: string;
    notes?: string;
  }>
): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(30, 58, 138);
  doc.text('Ansökningshistorik', 20, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Genererad: ${new Date().toLocaleDateString('sv-SE')}`, 20, 28);

  // Tabell
  const tableData = applications.map(app => [
    app.jobTitle,
    app.company,
    new Date(app.appliedDate).toLocaleDateString('sv-SE'),
    app.status,
  ]);

  (doc as any).autoTable({
    startY: 35,
    head: [['Jobb', 'Företag', 'Datum', 'Status']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: 255,
    },
    styles: {
      fontSize: 9,
    },
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Genererat från Deltagarportalen`,
    pageWidth / 2,
    290,
    { align: 'center' }
  );

  return doc.output('blob');
}

/**
 * Ladda ner PDF-fil
 */
export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Förhandsgranska PDF i ny flik
 */
export function previewPDF(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

// Explicit type exports för TypeScript
export type { CVData as CVDataType, JobData as JobDataType };
