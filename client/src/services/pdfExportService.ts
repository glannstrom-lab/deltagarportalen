/**
 * PDF Export Service
 * Genererar PDF-dokument för CV med fullt UTF-8 stöd
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CVData, JobData } from '@/types/pdf.types';

// Re-export types
export type { CVData, JobData } from '@/types/pdf.types';

// Make autoTable available
(jsPDF as any).autoTable = autoTable;

// Color schemes
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

// UTF-8 safe encoding for jsPDF - handles Swedish characters properly
function utf8ToLatin1(text: string | undefined | null): string {
  if (!text) return '';
  
  // jsPDF's default fonts support Latin-1 (ISO-8859-1)
  // These characters map directly:
  // Å (0xC5), Ä (0xC4), Ö (0xD6)
  // å (0xE5), ä (0xE4), ö (0xF6)
  // É (0xC9), é (0xE9)
  
  // Replace problematic Unicode characters with Latin-1 equivalents
  return text
    .replace(/–/g, '-')   // en-dash to hyphen
    .replace(/—/g, '-')   // em-dash to hyphen
    .replace(/[\"]/g, '"')  // smart quotes
    .replace(/['']/g, "'")   // smart single quotes
    .replace(/…/g, '...')   // ellipsis
    .replace(/•/g, '\u2022') // bullet (keep as is, supported in Latin-1 extended)
    // Keep Swedish characters as-is - helvetica font supports them
    .trim();
}

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

// Helper to convert image to base64
async function getImageAsBase64(url: string): Promise<string | null> {
  try {
    if (url.startsWith('data:image')) {
      return url;
    }
    
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to load image:', error);
    return null;
  }
}

// Helper to convert hex to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [79, 70, 229];
}

/**
 * Generera PDF från CV-data med fullt UTF-8 stöd
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
  const fullName = utf8ToLatin1(`${cvData.firstName || ''} ${cvData.lastName || ''}`.trim()) || 'Ditt Namn';

  const primaryRgb = hexToRgb(scheme.primary);

  // Helper: Check page overflow
  const checkOverflow = (neededSpace: number = 30) => {
    if (yPos + neededSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }
  };

  // ============================================
  // HEADER
  // ============================================
  
  const hasImage = !!cvData.profileImage;
  const headerHeight = hasImage ? 55 : (cvData.title ? 35 : 28);
  
  // Template-specific header colors
  let headerBgColor: [number, number, number] = primaryRgb;
  let headerTextColor: [number, number, number] = [255, 255, 255];
  
  switch (template) {
    case 'classic':
      headerBgColor = [255, 255, 255];
      headerTextColor = primaryRgb;
      break;
    case 'minimal':
      headerBgColor = [248, 250, 252];
      headerTextColor = [15, 23, 42];
      break;
    case 'tech':
      headerBgColor = [15, 23, 42];
      headerTextColor = hexToRgb(scheme.secondary);
      break;
    case 'executive':
      headerBgColor = [30, 58, 95];
      headerTextColor = [255, 255, 255];
      break;
    case 'academic':
      headerBgColor = [255, 255, 255];
      headerTextColor = primaryRgb;
      break;
  }

  // Draw header background
  doc.setFillColor(...headerBgColor);
  doc.rect(0, 0, pageWidth, headerHeight + 5, 'F');

  // Add profile image if exists
  let nameX = margin;
  if (hasImage && cvData.profileImage) {
    try {
      const base64Image = await getImageAsBase64(cvData.profileImage);
      if (base64Image) {
        let format: 'JPEG' | 'PNG' = 'JPEG';
        if (base64Image.includes('data:image/png')) {
          format = 'PNG';
        }
        
        const imgSize = 25;
        const imgX = margin;
        const imgY = 8;
        
        doc.addImage(base64Image, format, imgX, imgY, imgSize, imgSize);
        nameX = margin + imgSize + 10;
      }
    } catch (error) {
      console.error('Failed to add profile image to PDF:', error);
      nameX = margin;
    }
  }

  // Name
  doc.setFontSize(22);
  doc.setTextColor(...headerTextColor);
  doc.setFont('helvetica', 'bold');
  doc.text(fullName, nameX, 20);

  // Title
  if (cvData.title) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(utf8ToLatin1(cvData.title), nameX, 28);
  }

  // Contact info row
  doc.setFontSize(8);
  const contactParts: string[] = [];
  if (cvData.email) contactParts.push(`E-post: ${utf8ToLatin1(cvData.email)}`);
  if (cvData.phone) contactParts.push(`Tel: ${utf8ToLatin1(cvData.phone)}`);
  if (cvData.location) contactParts.push(utf8ToLatin1(cvData.location));
  
  if (contactParts.length > 0) {
    doc.text(contactParts.join('  |  '), nameX, headerHeight - 12);
  }

  // Links
  if (cvData.links && cvData.links.length > 0) {
    const linkTexts = cvData.links.map(link => {
      const type = link.type;
      if (type === 'linkedin') return 'LinkedIn';
      if (type === 'github') return 'GitHub';
      if (type === 'portfolio') return 'Portfolio';
      if (type === 'website') return 'Webbplats';
      return utf8ToLatin1(link.label) || 'Lank';
    });
    
    doc.setFontSize(7);
    doc.text(linkTexts.join('  |  '), nameX, headerHeight - 5);
  }

  yPos = headerHeight + 15;

  // ============================================
  // CONTENT
  // ============================================

  // Helper: Draw section title
  const drawSectionTitle = (title: string) => {
    checkOverflow(20);
    
    doc.setFontSize(12);
    doc.setTextColor(...primaryRgb);
    doc.setFont('helvetica', 'bold');
    doc.text(utf8ToLatin1(title).toUpperCase(), margin, yPos);
    
    // Underline
    doc.setDrawColor(...primaryRgb);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos + 2, margin + contentWidth, yPos + 2);
    
    yPos += 10;
  };

  // SAMMANFATTNING
  if (cvData.summary?.trim()) {
    drawSectionTitle('Profil');
    
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    const encodedSummary = utf8ToLatin1(cvData.summary);
    const lines = doc.splitTextToSize(encodedSummary, contentWidth);
    doc.text(lines, margin, yPos);
    yPos += lines.length * 4.5 + 8;
  }

  // ARBETSLIVSERFARENHET
  if (cvData.workExperience?.length > 0) {
    drawSectionTitle('Arbetslivserfarenhet');
    
    cvData.workExperience.forEach((job) => {
      checkOverflow(30);
      
      // Job title
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(utf8ToLatin1(job.title) || '', margin, yPos);
      
      // Date on right
      const dateStr = job.current 
        ? `${utf8ToLatin1(job.startDate)} – Pågående`
        : `${utf8ToLatin1(job.startDate)} – ${utf8ToLatin1(job.endDate) || ''}`;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const dateWidth = doc.getTextWidth(dateStr);
      doc.text(dateStr, pageWidth - margin - dateWidth, yPos);
      
      yPos += 5;
      
      // Company
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      let companyText = utf8ToLatin1(job.company) || '';
      if (job.location) companyText += `, ${utf8ToLatin1(job.location)}`;
      doc.text(companyText, margin, yPos);
      yPos += 5;
      
      // Description
      if (job.description?.trim()) {
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        const encodedDesc = utf8ToLatin1(job.description);
        const descLines = doc.splitTextToSize(encodedDesc, contentWidth);
        doc.text(descLines, margin, yPos);
        yPos += descLines.length * 4 + 5;
      } else {
        yPos += 3;
      }
    });
    
    yPos += 5;
  }

  // UTBILDNING
  if (cvData.education?.length > 0) {
    drawSectionTitle('Utbildning');
    
    cvData.education.forEach((edu) => {
      checkOverflow(25);
      
      // Degree
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(utf8ToLatin1(edu.degree) || '', margin, yPos);
      
      // Date
      const dateStr = `${utf8ToLatin1(edu.startDate)} – ${utf8ToLatin1(edu.endDate) || 'Pågående'}`;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const dateWidth = doc.getTextWidth(dateStr);
      doc.text(dateStr, pageWidth - margin - dateWidth, yPos);
      
      yPos += 5;
      
      // School
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      let schoolText = utf8ToLatin1(edu.school) || '';
      if (edu.field) schoolText += ` – ${utf8ToLatin1(edu.field)}`;
      doc.text(schoolText, margin, yPos);
      yPos += 8;
    });
    
    yPos += 2;
  }

  // KOMPETENSER - med korrekt formatering
  if (cvData.skills?.length > 0) {
    drawSectionTitle('Kompetenser');
    
    // Group skills by category
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
      // Use bullet character (•) with proper spacing
      const skillsText = technicalSkills.map(s => utf8ToLatin1(getSkillName(s))).join('  \u2022  ');
      const lines = doc.splitTextToSize(skillsText, contentWidth);
      doc.text(lines, margin, yPos);
      yPos += lines.length * 4 + 4;
    }
    
    // Soft skills
    if (softSkills.length > 0) {
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Mjuka färdigheter:', margin, yPos);
      yPos += 4;
      
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      const skillsText = softSkills.map(s => utf8ToLatin1(getSkillName(s))).join('  \u2022  ');
      const lines = doc.splitTextToSize(skillsText, contentWidth);
      doc.text(lines, margin, yPos);
      yPos += lines.length * 4 + 4;
    }
    
    // Other skills
    const remainingSkills = [...toolSkills, ...otherSkills];
    if (remainingSkills.length > 0) {
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      const skillsText = remainingSkills.map(s => utf8ToLatin1(getSkillName(s))).join('  \u2022  ');
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
      doc.setFontSize(12);
      doc.setTextColor(...primaryRgb);
      doc.setFont('helvetica', 'bold');
      doc.text('SPRÅK', margin, leftY);
      leftY += 8;
      
      doc.setFontSize(10);
      cvData.languages!.forEach((lang) => {
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        // Handle both 'name' (old) and 'language' (new)
        const langName = utf8ToLatin1(lang.language || (lang as any).name) || '';
        doc.text(langName, margin, leftY);
        
        // Level with proper spacing
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        const levelText = ` (${utf8ToLatin1(lang.level)})`;
        doc.text(levelText, margin + doc.getTextWidth(langName), leftY);
        leftY += 5;
      });
    }
    
    // Certifikat (höger)
    if (hasCertificates) {
      doc.setFontSize(12);
      doc.setTextColor(...primaryRgb);
      doc.setFont('helvetica', 'bold');
      doc.text('CERTIFIKAT', margin + colWidth + 5, rightY);
      rightY += 8;
      
      doc.setFontSize(9);
      cvData.certificates!.forEach((cert) => {
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text(utf8ToLatin1(cert.name) || '', margin + colWidth + 5, rightY);
        rightY += 4;
        
        if (cert.issuer || cert.date) {
          doc.setTextColor(100, 116, 139);
          doc.setFont('helvetica', 'normal');
          const details = [utf8ToLatin1(cert.issuer), utf8ToLatin1(cert.date)].filter(Boolean).join(' \u2022 ');
          doc.text(details, margin + colWidth + 5, rightY);
          rightY += 5;
        }
      });
    }
    
    yPos = Math.max(leftY, rightY) + 8;
  }

  // REFERENSER
  if (cvData.references?.length > 0) {
    drawSectionTitle('Referenser');
    
    cvData.references.forEach((ref) => {
      checkOverflow(20);
      
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(utf8ToLatin1(ref.name) || '', margin, yPos);
      yPos += 4;
      
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      let titleText = '';
      if (ref.title) titleText += utf8ToLatin1(ref.title);
      if (ref.company) titleText += (titleText ? ', ' : '') + utf8ToLatin1(ref.company);
      if (titleText) {
        doc.text(titleText, margin, yPos);
        yPos += 4;
      }
      
      if (ref.phone || ref.email) {
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        const contact = [ref.phone, ref.email].filter(Boolean).join(' \u2022 ');
        doc.text(contact, margin, yPos);
        yPos += 4;
      }
      
      yPos += 2;
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

  const primaryRgb: [number, number, number] = [79, 70, 229];

  // Titel
  doc.setFontSize(18);
  doc.setTextColor(...primaryRgb);
  doc.setFont('helvetica', 'bold');
  const splitTitle = doc.splitTextToSize(utf8ToLatin1(jobData.headline) || 'Jobbannons', pageWidth - 40);
  doc.text(splitTitle, 20, yPos);
  yPos += splitTitle.length * 8 + 5;

  // Arbetsgivare
  if (jobData.employer?.name) {
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(utf8ToLatin1(jobData.employer.name), 20, yPos);
    yPos += 7;
  }

  // Plats
  if (jobData.workplace_address) {
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    const location = `${utf8ToLatin1(jobData.workplace_address.municipality)}, ${utf8ToLatin1(jobData.workplace_address.region)}`;
    doc.text(location, 20, yPos);
    yPos += 6;
  }

  // Anställningstyp
  if (jobData.employment_type?.label) {
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(utf8ToLatin1(jobData.employment_type.label), 20, yPos);
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
    
    const encodedDesc = utf8ToLatin1(cleanDescription);
    const splitDesc = doc.splitTextToSize(encodedDesc, pageWidth - 40);
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
      doc.text(utf8ToLatin1(jobData.application_details.reference), 50, yPos);
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
    doc.text(`Sista ansökningsdag: ${lastDate}`, 20, yPos);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'Sparad från Deltagarportalen • Arbetsförmedlingen',
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
    utf8ToLatin1(app.jobTitle),
    utf8ToLatin1(app.company),
    new Date(app.appliedDate).toLocaleDateString('sv-SE'),
    utf8ToLatin1(app.status),
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
    'Genererat från Deltagarportalen',
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
