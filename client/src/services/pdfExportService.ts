/**
 * PDF Export Service
 * Synkade mallar med CVPreview - 5 kompletta moderna mallar
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CVData, JobData } from '@/types/pdf.types';

export type { CVData, JobData } from '@/types/pdf.types';
(jsPDF as any).autoTable = autoTable;

// 5 Kompletta mallar - EXAKT samma som CVPreview.tsx
const TEMPLATES = {
  modern: {
    font: 'helvetica',
    colors: { primary: [79, 70, 229], text: [30, 41, 59], muted: [100, 116, 139], border: [226, 232, 240] },
    header: { bg: [79, 70, 229], text: [255, 255, 255], layout: 'centered' },
    sectionTitle: { style: 'underline' },
    skillTag: { style: 'pill' },
  },
  minimal: {
    font: 'helvetica',
    colors: { primary: [51, 65, 85], text: [15, 23, 42], muted: [100, 116, 139], border: [226, 232, 240] },
    header: { bg: [248, 250, 252], text: [15, 23, 42], layout: 'left' },
    sectionTitle: { style: 'line' },
    skillTag: { style: 'box' },
  },
  creative: {
    font: 'helvetica',
    colors: { primary: [219, 39, 119], text: [30, 41, 59], muted: [100, 116, 139], border: [251, 207, 232] },
    header: { bg: [219, 39, 119], text: [255, 255, 255], layout: 'centered' },
    sectionTitle: { style: 'bold' },
    skillTag: { style: 'rounded' },
  },
  executive: {
    font: 'times', // Serif font for executive
    colors: { primary: [30, 58, 95], text: [30, 41, 59], muted: [100, 116, 139], border: [201, 162, 39] },
    header: { bg: [30, 58, 95], text: [255, 255, 255], layout: 'classic' },
    sectionTitle: { style: 'elegant' },
    skillTag: { style: 'bordered' },
  },
  nordic: {
    font: 'helvetica',
    colors: { primary: [5, 150, 105], text: [6, 78, 59], muted: [107, 114, 128], border: [209, 250, 229] },
    header: { bg: [236, 253, 245], text: [6, 78, 59], layout: 'left' },
    sectionTitle: { style: 'clean' },
    skillTag: { style: 'pill' },
  },
};

// Hjälpfunktioner
function getSkillName(skill: any): string {
  if (typeof skill === 'string') return skill;
  if (skill && typeof skill === 'object') return skill.name || '';
  return String(skill);
}

function getSkillCategory(skill: any): string {
  if (typeof skill === 'string') return 'other';
  if (skill && typeof skill === 'object') return skill.category || 'other';
  return 'other';
}

async function getImageAsBase64(url: string): Promise<string | null> {
  try {
    if (url.startsWith('data:image')) return url;
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

// jsPDF har begränsat stöd för Unicode - vi behåller svenska tecken
// men vissa tecken kan behöva ersättas för kompatibilitet
function sanitizeText(text: string | undefined | null): string {
  if (!text) return '';
  return text
    .replace(/[–—]/g, '-') // dashes
    .replace(/[\"]/g, '"') // quotes
    .replace(/['']/g, "'") // single quotes
    .replace(/…/g, '...')  // ellipsis
    .trim();
}

export async function generateCVPDF(cvData: CVData): Promise<Blob> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;

  const template = TEMPLATES[cvData.template as keyof typeof TEMPLATES] || TEMPLATES.modern;
  const fullName = sanitizeText(`${cvData.firstName || ''} ${cvData.lastName || ''}`.trim()) || 'Ditt Namn';

  // Set font
  doc.setFont(template.font);

  const checkOverflow = (neededSpace: number = 30) => {
    if (yPos + neededSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }
  };

  // ============================================
  // HEADER - Matchar CVPreview exakt
  // ============================================
  const headerHeight = cvData.profileImage ? 55 : (cvData.title ? 35 : 28);
  
  // Header background
  doc.setFillColor(...template.header.bg);
  doc.rect(0, 0, pageWidth, headerHeight + 5, 'F');

  // Profile image
  let nameX = margin;
  if (cvData.profileImage) {
    try {
      const base64Image = await getImageAsBase64(cvData.profileImage);
      if (base64Image) {
        const format = base64Image.includes('data:image/png') ? 'PNG' : 'JPEG';
        const imgSize = 25;
        doc.addImage(base64Image, format, margin, 8, imgSize, imgSize);
        nameX = margin + imgSize + 10;
      }
    } catch (error) {
      console.error('Failed to add profile image:', error);
    }
  }

  // Name
  doc.setFontSize(22);
  doc.setTextColor(...template.header.text);
  doc.setFont(template.font, 'bold');
  
  if (template.header.layout === 'centered') {
    doc.text(fullName, pageWidth / 2, 20, { align: 'center' });
  } else {
    doc.text(fullName, nameX, 20);
  }

  // Title
  if (cvData.title) {
    doc.setFontSize(12);
    doc.setFont(template.font, 'normal');
    const titleX = template.header.layout === 'centered' ? pageWidth / 2 : nameX;
    doc.text(sanitizeText(cvData.title), titleX, 28, template.header.layout === 'centered' ? { align: 'center' } : {});
  }

  // Contact info
  doc.setFontSize(8);
  const contactParts: string[] = [];
  if (cvData.email) contactParts.push(`E-post: ${sanitizeText(cvData.email)}`);
  if (cvData.phone) contactParts.push(`Tel: ${sanitizeText(cvData.phone)}`);
  if (cvData.location) contactParts.push(sanitizeText(cvData.location));
  
  if (contactParts.length > 0) {
    const contactText = contactParts.join('  |  ');
    const contactX = template.header.layout === 'centered' ? pageWidth / 2 : nameX;
    doc.text(contactText, contactX, headerHeight - 12, template.header.layout === 'centered' ? { align: 'center' } : {});
  }

  // Links
  if (cvData.links?.length > 0) {
    const linkTexts = cvData.links.map(l => {
      if (l.type === 'linkedin') return 'LinkedIn';
      if (l.type === 'github') return 'GitHub';
      if (l.type === 'portfolio') return 'Portfolio';
      if (l.type === 'website') return 'Webb';
      return sanitizeText(l.label) || 'Lank';
    });
    doc.setFontSize(7);
    const linkX = template.header.layout === 'centered' ? pageWidth / 2 : nameX;
    doc.text(linkTexts.join('  |  '), linkX, headerHeight - 5, template.header.layout === 'centered' ? { align: 'center' } : {});
  }

  yPos = headerHeight + 18;

  // ============================================
  // CONTENT
  // ============================================

  const drawSectionTitle = (title: string) => {
    checkOverflow(20);
    doc.setFontSize(12);
    doc.setTextColor(...template.colors.primary);
    doc.setFont(template.font, 'bold');
    
    const upperTitle = sanitizeText(title).toUpperCase();
    doc.text(upperTitle, margin, yPos);
    
    // Underline based on template style
    doc.setDrawColor(...template.colors.primary);
    doc.setLineWidth(0.5);
    
    if (template.sectionTitle.style === 'underline') {
      doc.line(margin, yPos + 2, margin + contentWidth, yPos + 2);
    } else if (template.sectionTitle.style === 'line') {
      doc.line(margin, yPos + 2, margin + contentWidth, yPos + 2);
    } else if (template.sectionTitle.style === 'elegant') {
      doc.setDrawColor(...template.colors.border); // Gold accent for executive
      doc.line(margin, yPos + 2, margin + 40, yPos + 2);
    }
    
    yPos += 10;
  };

  // PROFIL
  if (cvData.summary?.trim()) {
    drawSectionTitle('Profil');
    doc.setFontSize(10);
    doc.setTextColor(...template.colors.text);
    doc.setFont(template.font, 'normal');
    const lines = doc.splitTextToSize(sanitizeText(cvData.summary), contentWidth);
    doc.text(lines, margin, yPos);
    yPos += lines.length * 4.5 + 8;
  }

  // ERFARENHET
  if (cvData.workExperience?.length > 0) {
    drawSectionTitle('Erfarenhet');
    
    cvData.workExperience.forEach((job) => {
      checkOverflow(30);
      
      doc.setFontSize(11);
      doc.setTextColor(...template.colors.text);
      doc.setFont(template.font, 'bold');
      doc.text(sanitizeText(job.title) || '', margin, yPos);
      
      const dateStr = job.current 
        ? `${sanitizeText(job.startDate)} – Pågående`
        : `${sanitizeText(job.startDate)} – ${sanitizeText(job.endDate) || ''}`;
      doc.setFont(template.font, 'italic');
      doc.setFontSize(8);
      doc.setTextColor(...template.colors.muted);
      const dateWidth = doc.getTextWidth(dateStr);
      doc.text(dateStr, pageWidth - margin - dateWidth, yPos);
      
      yPos += 5;
      
      doc.setFontSize(10);
      doc.setTextColor(...template.colors.muted);
      doc.setFont(template.font, 'normal');
      let companyText = sanitizeText(job.company) || '';
      if (job.location) companyText += `, ${sanitizeText(job.location)}`;
      doc.text(companyText, margin, yPos);
      yPos += 5;
      
      if (job.description?.trim()) {
        doc.setFontSize(9);
        doc.setTextColor(...template.colors.text);
        const descLines = doc.splitTextToSize(sanitizeText(job.description), contentWidth);
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
      
      doc.setFontSize(11);
      doc.setTextColor(...template.colors.text);
      doc.setFont(template.font, 'bold');
      doc.text(sanitizeText(edu.degree) || '', margin, yPos);
      
      const dateStr = `${sanitizeText(edu.startDate)} – ${sanitizeText(edu.endDate) || 'Pågående'}`;
      doc.setFont(template.font, 'italic');
      doc.setFontSize(8);
      doc.setTextColor(...template.colors.muted);
      const dateWidth = doc.getTextWidth(dateStr);
      doc.text(dateStr, pageWidth - margin - dateWidth, yPos);
      
      yPos += 5;
      
      doc.setFontSize(10);
      doc.setTextColor(...template.colors.muted);
      doc.setFont(template.font, 'normal');
      let schoolText = sanitizeText(edu.school) || '';
      if (edu.field) schoolText += ` – ${sanitizeText(edu.field)}`;
      doc.text(schoolText, margin, yPos);
      yPos += 8;
    });
    
    yPos += 2;
  }

  // KOMPETENSER
  if (cvData.skills?.length > 0) {
    drawSectionTitle('Kompetenser');
    
    const technicalSkills = cvData.skills.filter(s => getSkillCategory(s) === 'technical');
    const softSkills = cvData.skills.filter(s => getSkillCategory(s) === 'soft');
    const otherSkills = cvData.skills.filter(s => {
      const cat = getSkillCategory(s);
      return !cat || cat === 'tool' || cat === 'language' || cat === 'other';
    });
    
    const renderSkillCategory = (skills: any[], label?: string) => {
      if (skills.length === 0) return;
      
      if (label) {
        doc.setFontSize(8);
        doc.setTextColor(...template.colors.muted);
        doc.text(sanitizeText(label) + ':', margin, yPos);
        yPos += 4;
      }
      
      doc.setFontSize(10);
      doc.setTextColor(...template.colors.text);
      
      // Format skills based on template style
      const skillTexts = skills.map(s => sanitizeText(getSkillName(s)));
      
      if (template.skillTag.style === 'pill' || template.skillTag.style === 'rounded') {
        // List format for pills
        const fullText = skillTexts.join('  •  ');
        const lines = doc.splitTextToSize(fullText, contentWidth);
        doc.text(lines, margin, yPos);
        yPos += lines.length * 4 + 4;
      } else {
        // Comma separated for box/bordered
        const fullText = skillTexts.join(', ');
        const lines = doc.splitTextToSize(fullText, contentWidth);
        doc.text(lines, margin, yPos);
        yPos += lines.length * 4 + 4;
      }
    };
    
    renderSkillCategory(technicalSkills, 'Tekniska');
    renderSkillCategory(softSkills, 'Mjuka färdigheter');
    renderSkillCategory(otherSkills);
    
    yPos += 3;
  }

  // SPRÅK & CERTIFIKAT
  const hasLanguages = cvData.languages?.length > 0;
  const hasCertificates = cvData.certificates?.length > 0;
  
  if (hasLanguages || hasCertificates) {
    checkOverflow(40);
    
    const colWidth = contentWidth / 2;
    let leftY = yPos;
    let rightY = yPos;
    
    // Språk
    if (hasLanguages) {
      doc.setFontSize(12);
      doc.setTextColor(...template.colors.primary);
      doc.setFont(template.font, 'bold');
      doc.text('SPRÅK', margin, leftY);
      leftY += 8;
      
      doc.setFontSize(10);
      cvData.languages!.forEach((lang) => {
        doc.setTextColor(...template.colors.text);
        doc.setFont(template.font, 'bold');
        const langName = sanitizeText(lang.language || (lang as any).name) || '';
        doc.text(langName, margin, leftY);
        
        doc.setTextColor(...template.colors.muted);
        doc.setFont(template.font, 'normal');
        const levelText = ` (${sanitizeText(lang.level)})`;
        doc.text(levelText, margin + doc.getTextWidth(langName), leftY);
        leftY += 5;
      });
    }
    
    // Certifikat
    if (hasCertificates) {
      doc.setFontSize(12);
      doc.setTextColor(...template.colors.primary);
      doc.setFont(template.font, 'bold');
      doc.text('CERTIFIKAT', margin + colWidth + 5, rightY);
      rightY += 8;
      
      doc.setFontSize(9);
      cvData.certificates!.forEach((cert) => {
        doc.setTextColor(...template.colors.text);
        doc.setFont(template.font, 'bold');
        doc.text(sanitizeText(cert.name) || '', margin + colWidth + 5, rightY);
        rightY += 4;
        
        if (cert.issuer || cert.date) {
          doc.setTextColor(...template.colors.muted);
          doc.setFont(template.font, 'normal');
          const details = [sanitizeText(cert.issuer), sanitizeText(cert.date)].filter(Boolean).join(' • ');
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
      doc.setTextColor(...template.colors.text);
      doc.setFont(template.font, 'bold');
      doc.text(sanitizeText(ref.name) || '', margin, yPos);
      yPos += 4;
      
      doc.setTextColor(...template.colors.muted);
      doc.setFont(template.font, 'normal');
      let titleText = '';
      if (ref.title) titleText += sanitizeText(ref.title);
      if (ref.company) titleText += (titleText ? ', ' : '') + sanitizeText(ref.company);
      if (titleText) {
        doc.text(titleText, margin, yPos);
        yPos += 4;
      }
      
      if (ref.phone) {
        doc.setFontSize(8);
        doc.text(ref.phone, margin, yPos);
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
    doc.setFont(template.font, 'normal');
    doc.text(
      `Genererat från Deltagarportalen • Sida ${i} av ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  return doc.output('blob');
}

// Andra PDF-funktioner (oförändrade)
export async function generateJobPDF(jobData: JobData): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  doc.setFontSize(18);
  doc.setTextColor(79, 70, 229);
  doc.setFont('helvetica', 'bold');
  const splitTitle = doc.splitTextToSize(sanitizeText(jobData.headline) || 'Jobbannons', pageWidth - 40);
  doc.text(splitTitle, 20, yPos);
  yPos += splitTitle.length * 8 + 5;

  if (jobData.employer?.name) {
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(sanitizeText(jobData.employer.name), 20, yPos);
    yPos += 7;
  }

  if (jobData.workplace_address) {
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    const location = `${sanitizeText(jobData.workplace_address.municipality)}, ${sanitizeText(jobData.workplace_address.region)}`;
    doc.text(location, 20, yPos);
    yPos += 6;
  }

  if (jobData.employment_type?.label) {
    doc.setFontSize(10);
    doc.text(sanitizeText(jobData.employment_type.label), 20, yPos);
    yPos += 6;
  }

  if (jobData.publication_date) {
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Publicerad: ${new Date(jobData.publication_date).toLocaleDateString('sv-SE')}`, 20, yPos);
    yPos += 10;
  }

  doc.setDrawColor(226, 232, 240);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 12;

  if (jobData.description?.text) {
    doc.setFontSize(12);
    doc.setTextColor(79, 70, 229);
    doc.text('Om tjänsten', 20, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    const cleanDesc = jobData.description.text
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
    
    const splitDesc = doc.splitTextToSize(sanitizeText(cleanDesc), pageWidth - 40);
    doc.text(splitDesc, 20, yPos);
    yPos += splitDesc.length * 5 + 15;
  }

  if (yPos > 230) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(13);
  doc.setTextColor(79, 70, 229);
  doc.text('Ansökan', 20, yPos);
  yPos += 10;

  if (jobData.application_details) {
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    
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
  }

  if (jobData.last_publication_date) {
    yPos += 8;
    doc.setFontSize(10);
    doc.setTextColor(200, 50, 50);
    doc.setFont('helvetica', 'bold');
    doc.text(`Sista ansökningsdag: ${new Date(jobData.last_publication_date).toLocaleDateString('sv-SE')}`, 20, yPos);
  }

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Sparad från Deltagarportalen • Arbetsförmedlingen', pageWidth / 2, 290, { align: 'center' });

  return doc.output('blob');
}

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

export function previewPDF(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

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
  
  doc.setFontSize(20);
  doc.setTextColor(79, 70, 229);
  doc.setFont('helvetica', 'bold');
  doc.text('Ansökningshistorik', 20, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.text(`Genererad: ${new Date().toLocaleDateString('sv-SE')}`, 20, 28);

  const tableData = applications.map(app => [
    sanitizeText(app.jobTitle),
    sanitizeText(app.company),
    new Date(app.appliedDate).toLocaleDateString('sv-SE'),
    sanitizeText(app.status),
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
  });

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

export type { CVData as CVDataType, JobData as JobDataType };
