/**
 * PDF Export Service
 * Genererar PDF-dokument för CV - MATCHAR EXAKT CVPreview.tsx
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CVData, JobData } from '@/types/pdf.types';

// Re-export types
export type { CVData, JobData } from '@/types/pdf.types';

// Make autoTable available
(jsPDF as any).autoTable = autoTable;

// Color schemes - MATCHAR CVPreview.tsx exakt
const colorSchemes: Record<string, { primary: string; secondary: string; accent: string; headerBg: string }> = {
  indigo: { primary: '#4f46e5', secondary: '#6366f1', accent: '#818cf8', headerBg: '#4f46e5' },
  ocean: { primary: '#0ea5e9', secondary: '#38bdf8', accent: '#7dd3fc', headerBg: '#0ea5e9' },
  forest: { primary: '#059669', secondary: '#10b981', accent: '#34d399', headerBg: '#059669' },
  berry: { primary: '#db2777', secondary: '#ec4899', accent: '#f472b6', headerBg: '#db2777' },
  amber: { primary: '#d97706', secondary: '#f59e0b', accent: '#fbbf24', headerBg: '#d97706' },
  ruby: { primary: '#dc2626', secondary: '#ef4444', accent: '#f87171', headerBg: '#dc2626' },
  slate: { primary: '#1e293b', secondary: '#475569', accent: '#64748b', headerBg: '#1e293b' },
  violet: { primary: '#7c3aed', secondary: '#8b5cf6', accent: '#a78bfa', headerBg: '#7c3aed' },
};

// Helper to safely get skill name
function getSkillName(skill: any): string {
  if (typeof skill === 'string') return skill;
  if (skill && typeof skill === 'object') {
    return skill.name || skill.label || String(skill);
  }
  return String(skill);
}

// Helper to safely get skill category
function getSkillCategory(skill: any): string {
  if (typeof skill === 'string') return 'other';
  if (skill && typeof skill === 'object') {
    return skill.category || 'other';
  }
  return 'other';
}

/**
 * Generera PDF från CV-data - MATCHAR EXAKT CVPreview.tsx
 */
export async function generateCVPDF(cvData: CVData): Promise<Blob> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;

  // Get settings
  const scheme = colorSchemes[cvData.colorScheme || 'indigo'] || colorSchemes.indigo;
  const template = cvData.template || 'modern';
  const fullName = `${cvData.firstName || ''} ${cvData.lastName || ''}`.trim() || 'Ditt Namn';

  // Helper: Check page overflow
  const checkOverflow = (neededSpace: number = 30) => {
    if (yPos + neededSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }
  };

  // Helper: Convert hex to RGB
  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [79, 70, 229];
  };

  const primaryRgb = hexToRgb(scheme.primary);
  const secondaryRgb = hexToRgb(scheme.secondary);

  // ============================================
  // HEADER - Matchar CVPreview.tsx exakt
  // ============================================
  
  // Header background
  const headerHeight = cvData.profileImage ? 50 : (cvData.title ? 35 : 25);
  
  // Template-specific header colors
  let headerBgColor: [number, number, number] = primaryRgb;
  let headerTextColor: [number, number, number] = [255, 255, 255];
  
  if (template === 'classic') {
    headerBgColor = [255, 255, 255];
    headerTextColor = primaryRgb;
  } else if (template === 'minimal') {
    headerBgColor = [248, 250, 252];
    headerTextColor = [15, 23, 42];
  } else if (template === 'tech') {
    headerBgColor = [15, 23, 42];
    headerTextColor = secondaryRgb;
  } else if (template === 'executive') {
    headerBgColor = [30, 58, 95];
    headerTextColor = [255, 255, 255];
  } else if (template === 'academic') {
    headerBgColor = [255, 255, 255];
    headerTextColor = primaryRgb;
  }

  // Draw header background
  doc.setFillColor(...headerBgColor);
  doc.rect(0, 0, pageWidth, headerHeight + 10, 'F');

  // Profile image placeholder (if exists)
  if (cvData.profileImage) {
    // Draw circle for profile image
    doc.setDrawColor(...headerTextColor);
    doc.setLineWidth(0.5);
    doc.circle(margin + 12, headerHeight / 2 + 5, 12, 'S');
    doc.setFontSize(8);
    doc.setTextColor(...headerTextColor);
    doc.text('[Foto]', margin + 8, headerHeight / 2 + 7);
  }

  // Name
  doc.setFontSize(24);
  doc.setTextColor(...headerTextColor);
  doc.setFont('helvetica', 'bold');
  const nameX = cvData.profileImage ? margin + 35 : margin;
  doc.text(fullName, nameX, 18);

  // Title
  if (cvData.title) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(cvData.title, nameX, 26);
  }

  // Contact info row
  doc.setFontSize(9);
  const contactParts: string[] = [];
  if (cvData.email) contactParts.push(`✉ ${cvData.email}`);
  if (cvData.phone) contactParts.push(`☎ ${cvData.phone}`);
  if (cvData.location) contactParts.push(`📍 ${cvData.location}`);
  
  if (contactParts.length > 0) {
    doc.text(contactParts.join('    '), nameX, headerHeight - 5);
  }

  // Links
  if (cvData.links && cvData.links.length > 0) {
    const linkTexts = cvData.links.map(link => {
      const type = link.type;
      if (type === 'linkedin') return 'LinkedIn';
      if (type === 'github') return 'GitHub';
      if (type === 'portfolio') return 'Portfolio';
      if (type === 'website') return 'Webbplats';
      return link.label || 'Länk';
    });
    
    doc.setFontSize(8);
    doc.text(linkTexts.join('    '), nameX, headerHeight + 2);
  }

  yPos = headerHeight + 20;

  // ============================================
  // CONTENT
  // ============================================

  // Helper: Draw section title
  const drawSectionTitle = (title: string, icon?: string) => {
    checkOverflow(20);
    
    doc.setFontSize(13);
    doc.setTextColor(...primaryRgb);
    doc.setFont('helvetica', 'bold');
    
    const fullTitle = icon ? `${icon} ${title}` : title;
    doc.text(fullTitle, margin, yPos);
    
    // Underline
    doc.setDrawColor(...primaryRgb);
    doc.setLineWidth(0.5);
    
    if (template === 'classic' || template === 'minimal' || template === 'creative') {
      doc.line(margin, yPos + 2, margin + contentWidth, yPos + 2);
    } else if (template === 'corporate') {
      doc.line(margin, yPos + 2, margin + 4, yPos + 2);
    } else {
      doc.line(margin, yPos + 2, margin + contentWidth, yPos + 2);
    }
    
    yPos += 10;
  };

  // Helper: Draw text with word wrap
  const drawWrappedText = (text: string, x: number, maxWidth: number, fontSize: number = 10): number => {
    doc.setFontSize(fontSize);
    const splitText = doc.splitTextToSize(text, maxWidth);
    doc.text(splitText, x, yPos);
    return splitText.length * (fontSize * 0.4);
  };

  // SAMMANFATTNING
  if (cvData.summary?.trim()) {
    drawSectionTitle('Profil');
    
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85); // slate-700
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(cvData.summary, contentWidth);
    doc.text(lines, margin, yPos);
    yPos += lines.length * 5 + 8;
  }

  // ARBETSLIVSERFARENHET
  if (cvData.workExperience?.length > 0) {
    drawSectionTitle('Arbetslivserfarenhet', '💼');
    
    cvData.workExperience.forEach((job, index) => {
      checkOverflow(35);
      
      // Job title
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('helvetica', 'bold');
      doc.text(job.title || '', margin, yPos);
      
      // Date on right
      const dateStr = job.current 
        ? `${job.startDate} – Pågående`
        : `${job.startDate} – ${job.endDate || ''}`;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // slate-500
      const dateWidth = doc.getTextWidth(dateStr);
      doc.text(dateStr, pageWidth - margin - dateWidth, yPos);
      
      yPos += 5;
      
      // Company
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.setFont('helvetica', 'normal');
      let companyText = job.company || '';
      if (job.location) companyText += `, ${job.location}`;
      doc.text(companyText, margin, yPos);
      yPos += 5;
      
      // Description
      if (job.description?.trim()) {
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        const descLines = doc.splitTextToSize(job.description, contentWidth);
        doc.text(descLines, margin, yPos);
        yPos += descLines.length * 4 + 6;
      } else {
        yPos += 3;
      }
    });
    
    yPos += 5;
  }

  // UTBILDNING
  if (cvData.education?.length > 0) {
    drawSectionTitle('Utbildning', '🎓');
    
    cvData.education.forEach((edu) => {
      checkOverflow(25);
      
      // Degree
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(edu.degree || '', margin, yPos);
      
      // Date
      const dateStr = `${edu.startDate} – ${edu.endDate || 'Pågående'}`;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      const dateWidth = doc.getTextWidth(dateStr);
      doc.text(dateStr, pageWidth - margin - dateWidth, yPos);
      
      yPos += 5;
      
      // School
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      let schoolText = edu.school || '';
      if (edu.field) schoolText += ` – ${edu.field}`;
      doc.text(schoolText, margin, yPos);
      yPos += 8;
    });
    
    yPos += 2;
  }

  // KOMPETENSER
  if (cvData.skills?.length > 0) {
    drawSectionTitle('Kompetenser', '🛠');
    
    // Group skills by category - MATCHAR CVPreview.tsx exakt
    const technicalSkills = cvData.skills.filter(s => getSkillCategory(s) === 'technical');
    const softSkills = cvData.skills.filter(s => getSkillCategory(s) === 'soft');
    const toolSkills = cvData.skills.filter(s => getSkillCategory(s) === 'tool');
    const otherSkills = cvData.skills.filter(s => {
      const cat = getSkillCategory(s);
      return !cat || cat === 'language' || cat === 'other';
    });
    
    // Technical skills
    if (technicalSkills.length > 0) {
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Tekniska:', margin, yPos);
      yPos += 4;
      
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      const skillsText = technicalSkills.map(s => getSkillName(s)).join(' • ');
      const lines = doc.splitTextToSize(skillsText, contentWidth);
      doc.text(lines, margin, yPos);
      yPos += lines.length * 4 + 5;
    }
    
    // Soft skills
    if (softSkills.length > 0) {
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Mjuka färdigheter:', margin, yPos);
      yPos += 4;
      
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      const skillsText = softSkills.map(s => getSkillName(s)).join(' • ');
      const lines = doc.splitTextToSize(skillsText, contentWidth);
      doc.text(lines, margin, yPos);
      yPos += lines.length * 4 + 5;
    }
    
    // Other skills
    const remainingSkills = [...toolSkills, ...otherSkills];
    if (remainingSkills.length > 0) {
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      const skillsText = remainingSkills.map(s => getSkillName(s)).join(' • ');
      const lines = doc.splitTextToSize(skillsText, contentWidth);
      doc.text(lines, margin, yPos);
      yPos += lines.length * 4 + 5;
    }
    
    yPos += 3;
  }

  // SPRÅK & CERTIFIKAT (två kolumner)
  const hasLanguages = cvData.languages?.length > 0;
  const hasCertificates = cvData.certificates?.length > 0;
  
  if (hasLanguages || hasCertificates) {
    checkOverflow(40);
    
    const colWidth = contentWidth / 2;
    let leftY = yPos;
    let rightY = yPos;
    
    // Språk (vänster)
    if (hasLanguages) {
      doc.setFontSize(13);
      doc.setTextColor(...primaryRgb);
      doc.setFont('helvetica', 'bold');
      doc.text('🌐 Språk', margin, leftY);
      leftY += 8;
      
      doc.setFontSize(10);
      cvData.languages!.forEach((lang) => {
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text(lang.language || '', margin, leftY);
        
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.text(` (${lang.level})`, margin + doc.getTextWidth(lang.language || ''), leftY);
        leftY += 5;
      });
    }
    
    // Certifikat (höger)
    if (hasCertificates) {
      doc.setFontSize(13);
      doc.setTextColor(...primaryRgb);
      doc.setFont('helvetica', 'bold');
      doc.text('🏆 Certifikat', margin + colWidth + 5, rightY);
      rightY += 8;
      
      doc.setFontSize(9);
      cvData.certificates!.forEach((cert) => {
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text(cert.name || '', margin + colWidth + 5, rightY);
        rightY += 4;
        
        if (cert.issuer || cert.date) {
          doc.setTextColor(100, 116, 139);
          doc.setFont('helvetica', 'normal');
          const details = [cert.issuer, cert.date].filter(Boolean).join(' • ');
          doc.text(details, margin + colWidth + 5, rightY);
          rightY += 5;
        }
      });
    }
    
    yPos = Math.max(leftY, rightY) + 8;
  }

  // REFERENSER
  if (cvData.references?.length > 0) {
    drawSectionTitle('Referenser', '👥');
    
    cvData.references.forEach((ref) => {
      checkOverflow(20);
      
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(ref.name || '', margin, yPos);
      yPos += 4;
      
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      let titleText = '';
      if (ref.title) titleText += ref.title;
      if (ref.company) titleText += (titleText ? ', ' : '') + ref.company;
      if (titleText) {
        doc.text(titleText, margin, yPos);
        yPos += 4;
      }
      
      if (ref.phone || ref.email) {
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        const contact = [ref.phone, ref.email].filter(Boolean).join(' • ');
        doc.text(contact, margin, yPos);
        yPos += 4;
      }
      
      yPos += 3;
    });
  }

  // FOOTER
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Genererat från Deltagarportalen • Sida ${i} av ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
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

  // Primary color
  const primaryRgb: [number, number, number] = [79, 70, 229];

  // Titel
  doc.setFontSize(18);
  doc.setTextColor(...primaryRgb);
  doc.setFont('helvetica', 'bold');
  const splitTitle = doc.splitTextToSize(jobData.headline || 'Jobbannons', pageWidth - 40);
  doc.text(splitTitle, 20, yPos);
  yPos += splitTitle.length * 8 + 5;

  // Arbetsgivare
  if (jobData.employer?.name) {
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(jobData.employer.name, 20, yPos);
    yPos += 7;
  }

  // Plats
  if (jobData.workplace_address) {
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    const location = `${jobData.workplace_address.municipality}, ${jobData.workplace_address.region}`;
    doc.text(`📍 ${location}`, 20, yPos);
    yPos += 6;
  }

  // Anställningstyp
  if (jobData.employment_type?.label) {
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`💼 ${jobData.employment_type.label}`, 20, yPos);
    yPos += 6;
  }

  // Publiceringsdatum
  if (jobData.publication_date) {
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    const pubDate = new Date(jobData.publication_date).toLocaleDateString('sv-SE');
    doc.text(`Publicerad: ${pubDate}`, 20, yPos);
    yPos += 10;
  }

  // Linje
  doc.setDrawColor(226, 232, 240);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 12;

  // Beskrivning
  if (jobData.description?.text) {
    doc.setFontSize(12);
    doc.setTextColor(...primaryRgb);
    doc.setFont('helvetica', 'bold');
    doc.text('Om tjänsten', 20, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
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
  doc.setTextColor(...primaryRgb);
  doc.setFont('helvetica', 'bold');
  doc.text('Ansökan', 20, yPos);
  yPos += 10;

  if (jobData.application_details) {
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
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
  doc.setTextColor(79, 70, 229);
  doc.setFont('helvetica', 'bold');
  doc.text('Ansökningshistorik', 20, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
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
      fillColor: [79, 70, 229],
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

// Type exports
export type { CVData as CVDataType, JobData as JobDataType };
