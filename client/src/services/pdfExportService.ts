/**
 * PDF Export Service
 * Genererar PDF-dokument för CV och jobbannonser
 * ANPASSAD för att matcha rätt datastruktur
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CVData, JobData } from '@/types/pdf.types';

// Re-export types for bakåtkompatibilitet
export type { CVData, JobData } from '@/types/pdf.types';

// Make autoTable available on jsPDF
(jsPDF as any).autoTable = autoTable;

// Brand colors
const COLORS = {
  primary: [79, 70, 229],      // Indigo-600
  primaryDark: [67, 56, 202],  // Indigo-700
  text: [15, 23, 42],          // Slate-900
  textLight: [71, 85, 105],    // Slate-600
  textMuted: [100, 116, 139],  // Slate-500
  border: [226, 232, 240],     // Slate-200
  white: [255, 255, 255],
};

/**
 * Generera PDF från CV-data
 * ANPASSAD för att matcha rätt datastruktur
 */
export async function generateCVPDF(cvData: CVData): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 15;

  // Helper to check page overflow
  const checkPageOverflow = (neededSpace: number = 30) => {
    if (yPos > 280 - neededSpace) {
      doc.addPage();
      yPos = 20;
    }
  };

  // ============================================
  // HEADER
  // ============================================
  
  // Fullständigt namn
  const fullName = `${cvData.firstName || ''} ${cvData.lastName || ''}`.trim() || 'Ditt Namn';
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text(fullName, 20, yPos);
  
  // Titel/Yrke
  if (cvData.title) {
    yPos += 10;
    doc.setFontSize(14);
    doc.setTextColor(...COLORS.textLight);
    doc.setFont('helvetica', 'normal');
    doc.text(cvData.title, 20, yPos);
  }
  
  yPos += 12;

  // Kontaktinformation - på en rad
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textMuted);
  
  const contactParts: string[] = [];
  if (cvData.email) contactParts.push(`✉ ${cvData.email}`);
  if (cvData.phone) contactParts.push(`☎ ${cvData.phone}`);
  if (cvData.location) contactParts.push(`📍 ${cvData.location}`);
  if (cvData.linkedIn) contactParts.push(`💼 LinkedIn`);
  
  if (contactParts.length > 0) {
    const contactText = contactParts.join('  •  ');
    const splitContact = doc.splitTextToSize(contactText, pageWidth - 40);
    doc.text(splitContact, 20, yPos);
    yPos += splitContact.length * 4 + 5;
  }

  // Avdelarlinje
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 12;

  // ============================================
  // SAMMANFATTNING
  // ============================================
  if (cvData.summary?.trim()) {
    checkPageOverflow(40);
    
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('SAMMANFATTNING', 20, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'normal');
    const splitSummary = doc.splitTextToSize(cvData.summary, pageWidth - 40);
    doc.text(splitSummary, 20, yPos);
    yPos += splitSummary.length * 5 + 12;
  }

  // ============================================
  // ARBETSLIVSERFARENHET
  // ============================================
  if (cvData.workExperience?.length > 0) {
    checkPageOverflow(40);
    
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('ARBETSLIVSERFARENHET', 20, yPos);
    yPos += 10;

    cvData.workExperience.forEach((exp, index) => {
      checkPageOverflow(35);
      
      // Titel
      doc.setFontSize(11);
      doc.setTextColor(...COLORS.text);
      doc.setFont('helvetica', 'bold');
      doc.text(exp.title || '', 20, yPos);
      
      // Datum - högerjusterat
      const dateStr = exp.current 
        ? `${exp.startDate} – Pågående`
        : `${exp.startDate} – ${exp.endDate || ''}`;
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...COLORS.textMuted);
      const dateWidth = doc.getTextWidth(dateStr);
      doc.text(dateStr, pageWidth - 20 - dateWidth, yPos);
      
      yPos += 6;
      
      // Företag och plats
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.textLight);
      doc.setFont('helvetica', 'normal');
      let companyText = exp.company || '';
      if (exp.location) companyText += `, ${exp.location}`;
      doc.text(companyText, 20, yPos);
      yPos += 5;
      
      // Beskrivning
      if (exp.description?.trim()) {
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.text);
        const splitDesc = doc.splitTextToSize(exp.description, pageWidth - 40);
        doc.text(splitDesc, 20, yPos);
        yPos += splitDesc.length * 4 + 8;
      } else {
        yPos += 5;
      }
    });
    
    yPos += 5;
  }

  // ============================================
  // UTBILDNING
  // ============================================
  if (cvData.education?.length > 0) {
    checkPageOverflow(40);
    
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('UTBILDNING', 20, yPos);
    yPos += 10;

    cvData.education.forEach((edu) => {
      checkPageOverflow(25);
      
      // Examen
      doc.setFontSize(11);
      doc.setTextColor(...COLORS.text);
      doc.setFont('helvetica', 'bold');
      doc.text(edu.degree || '', 20, yPos);
      
      // Datum
      const dateStr = `${edu.startDate} – ${edu.endDate || 'Pågående'}`;
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...COLORS.textMuted);
      const dateWidth = doc.getTextWidth(dateStr);
      doc.text(dateStr, pageWidth - 20 - dateWidth, yPos);
      
      yPos += 6;
      
      // Skola och inriktning
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.textLight);
      doc.setFont('helvetica', 'normal');
      let schoolText = edu.school || '';
      if (edu.field) schoolText += ` – ${edu.field}`;
      doc.text(schoolText, 20, yPos);
      yPos += 10;
    });
    
    yPos += 2;
  }

  // ============================================
  // KOMPETENSER
  // ============================================
  if (cvData.skills?.length > 0) {
    checkPageOverflow(50);
    
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('KOMPETENSER', 20, yPos);
    yPos += 10;

    // Gruppera efter kategori
    const technicalSkills = cvData.skills.filter(s => s.category === 'technical');
    const softSkills = cvData.skills.filter(s => s.category === 'soft');
    const otherSkills = cvData.skills.filter(s => !s.category || !['technical', 'soft'].includes(s.category));

    // Tekniska kompetenser
    if (technicalSkills.length > 0) {
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.textMuted);
      doc.text('Tekniska:', 20, yPos);
      yPos += 5;
      
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.text);
      const skillsText = technicalSkills.map(s => s.name).join(' • ');
      const splitSkills = doc.splitTextToSize(skillsText, pageWidth - 40);
      doc.text(splitSkills, 20, yPos);
      yPos += splitSkills.length * 4 + 6;
    }

    // Mjuka färdigheter
    if (softSkills.length > 0) {
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.textMuted);
      doc.text('Mjuka färdigheter:', 20, yPos);
      yPos += 5;
      
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.text);
      const skillsText = softSkills.map(s => s.name).join(' • ');
      const splitSkills = doc.splitTextToSize(skillsText, pageWidth - 40);
      doc.text(splitSkills, 20, yPos);
      yPos += splitSkills.length * 4 + 6;
    }

    // Övriga kompetenser
    if (otherSkills.length > 0) {
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.textMuted);
      doc.text('Övrigt:', 20, yPos);
      yPos += 5;
      
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.text);
      const skillsText = otherSkills.map(s => s.name).join(' • ');
      const splitSkills = doc.splitTextToSize(skillsText, pageWidth - 40);
      doc.text(splitSkills, 20, yPos);
      yPos += splitSkills.length * 4 + 6;
    }
    
    yPos += 5;
  }

  // ============================================
  // SPRÅK & CERTIFIKAT (två kolumner)
  // ============================================
  const hasLanguages = cvData.languages?.length > 0;
  const hasCertificates = cvData.certificates?.length > 0;
  
  if (hasLanguages || hasCertificates) {
    checkPageOverflow(60);
    
    const colWidth = (pageWidth - 50) / 2;
    let leftY = yPos;
    let rightY = yPos;
    
    // Språk (vänster kolumn)
    if (hasLanguages) {
      doc.setFontSize(13);
      doc.setTextColor(...COLORS.primary);
      doc.setFont('helvetica', 'bold');
      doc.text('SPRÅK', 20, leftY);
      leftY += 10;
      
      doc.setFontSize(10);
      cvData.languages!.forEach((lang) => {
        doc.setTextColor(...COLORS.text);
        doc.setFont('helvetica', 'bold');
        doc.text(lang.language || '', 20, leftY);
        
        doc.setTextColor(...COLORS.textLight);
        doc.setFont('helvetica', 'normal');
        doc.text(` – ${lang.level}`, 20 + doc.getTextWidth(lang.language || ''), leftY);
        leftY += 6;
      });
    }
    
    // Certifikat (höger kolumn)
    if (hasCertificates) {
      doc.setFontSize(13);
      doc.setTextColor(...COLORS.primary);
      doc.setFont('helvetica', 'bold');
      doc.text('CERTIFIKAT', 30 + colWidth, rightY);
      rightY += 10;
      
      doc.setFontSize(9);
      cvData.certificates!.forEach((cert) => {
        doc.setTextColor(...COLORS.text);
        doc.setFont('helvetica', 'bold');
        doc.text(cert.name || '', 30 + colWidth, rightY);
        rightY += 5;
        
        if (cert.issuer || cert.date) {
          doc.setTextColor(...COLORS.textLight);
          doc.setFont('helvetica', 'normal');
          const details = [cert.issuer, cert.date].filter(Boolean).join(' • ');
          doc.text(details, 30 + colWidth, rightY);
          rightY += 6;
        }
      });
    }
    
    yPos = Math.max(leftY, rightY) + 10;
  }

  // ============================================
  // REFERENSER
  // ============================================
  if (cvData.references?.length > 0) {
    checkPageOverflow(40);
    
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('REFERENSER', 20, yPos);
    yPos += 10;

    cvData.references.forEach((ref) => {
      checkPageOverflow(20);
      
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.text);
      doc.setFont('helvetica', 'bold');
      doc.text(ref.name || '', 20, yPos);
      yPos += 5;
      
      doc.setTextColor(...COLORS.textLight);
      doc.setFont('helvetica', 'normal');
      let titleText = '';
      if (ref.title) titleText += ref.title;
      if (ref.company) titleText += (titleText ? ', ' : '') + ref.company;
      if (titleText) {
        doc.text(titleText, 20, yPos);
        yPos += 5;
      }
      
      if (ref.phone || ref.email) {
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.textMuted);
        const contact = [ref.phone, ref.email].filter(Boolean).join(' • ');
        doc.text(contact, 20, yPos);
        yPos += 5;
      }
      
      yPos += 3;
    });
  }

  // ============================================
  // FOOTER
  // ============================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Genererat från Deltagarportalen • Sida ${i} av ${totalPages}`,
      pageWidth / 2,
      292,
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
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.primary);
  doc.setFont('helvetica', 'bold');
  const splitTitle = doc.splitTextToSize(jobData.headline || 'Jobbannons', pageWidth - 40);
  doc.text(splitTitle, 20, yPos);
  yPos += splitTitle.length * 8 + 5;

  // Arbetsgivare
  if (jobData.employer?.name) {
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'bold');
    doc.text(jobData.employer.name, 20, yPos);
    yPos += 7;
  }

  // Plats
  if (jobData.workplace_address) {
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.textLight);
    doc.setFont('helvetica', 'normal');
    const location = `${jobData.workplace_address.municipality}, ${jobData.workplace_address.region}`;
    doc.text(`📍 ${location}`, 20, yPos);
    yPos += 6;
  }

  // Anställningstyp
  if (jobData.employment_type?.label) {
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.textLight);
    doc.text(`💼 ${jobData.employment_type.label}`, 20, yPos);
    yPos += 6;
  }

  // Publiceringsdatum
  if (jobData.publication_date) {
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.textMuted);
    const pubDate = new Date(jobData.publication_date).toLocaleDateString('sv-SE');
    doc.text(`Publicerad: ${pubDate}`, 20, yPos);
    yPos += 10;
  }

  // Linje
  doc.setDrawColor(...COLORS.border);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 12;

  // Beskrivning
  if (jobData.description?.text) {
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'bold');
    doc.text('Om tjänsten', 20, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'normal');
    
    // Rensa HTML-taggar
    const cleanDescription = jobData.description.text
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
    
    const splitDesc = doc.splitTextToSize(cleanDescription, pageWidth - 40);
    doc.text(splitDesc, 20, yPos);
    yPos += splitDesc.length * 5 + 15;
  }

  // Ansökan
  if (yPos > 230) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(13);
  doc.setTextColor(...COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('ANSÖKAN', 20, yPos);
  yPos += 10;

  if (jobData.application_details) {
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'normal');
    
    if (jobData.application_details.email) {
      doc.setFont('helvetica', 'bold');
      doc.text('E-post:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(jobData.application_details.email, 50, yPos);
      yPos += 6;
    }
    
    if (jobData.application_details.url) {
      doc.setFont('helvetica', 'bold');
      doc.text('Webb:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(jobData.application_details.url, 50, yPos);
      yPos += 6;
    }
    
    if (jobData.application_details.reference) {
      doc.setFont('helvetica', 'bold');
      doc.text('Referens:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(jobData.application_details.reference, 50, yPos);
      yPos += 6;
    }
  }

  // Sista ansökningsdag
  if (jobData.last_publication_date) {
    yPos += 8;
    doc.setFontSize(10);
    doc.setTextColor(200, 50, 50);
    doc.setFont('helvetica', 'bold');
    const lastDate = new Date(jobData.last_publication_date).toLocaleDateString('sv-SE');
    doc.text(`⏰ Sista ansökningsdag: ${lastDate}`, 20, yPos);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
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
  doc.setTextColor(...COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('Ansökningshistorik', 20, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.textLight);
  doc.setFont('helvetica', 'normal');
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
      fillColor: COLORS.primary,
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 50 },
      2: { cellWidth: 30 },
      3: { cellWidth: 40 },
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
