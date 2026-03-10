/**
 * PDF Export Service - Moderna mallar 2025
 * Synkade med CVPreview.tsx
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CVData, JobData } from '@/types/pdf.types';

export type { CVData, JobData } from '@/types/pdf.types';
(jsPDF as any).autoTable = autoTable;

// 6 Moderna mallar - synkade med CVPreview
const TEMPLATES = {
  sidebar: {
    layout: 'sidebar',
    sidebarWidth: 75, // mm
    colors: {
      sidebar: [30, 41, 59],
      sidebarText: [248, 250, 252],
      accent: [59, 130, 246],
      text: [30, 41, 59],
      muted: [100, 116, 139],
    },
  },
  centered: {
    layout: 'top',
    colors: {
      header: [102, 126, 234], // Violet
      headerText: [255, 255, 255],
      accent: [124, 58, 237],
      text: [30, 27, 75],
      muted: [107, 114, 128],
    },
  },
  minimal: {
    layout: 'top',
    colors: {
      header: [250, 250, 250],
      headerText: [23, 23, 23],
      accent: [23, 23, 23],
      text: [23, 23, 23],
      muted: [115, 115, 115],
    },
  },
  creative: {
    layout: 'split',
    leftWidth: 80, // mm
    colors: {
      left: [236, 72, 153], // Pink
      leftText: [255, 255, 255],
      right: [253, 242, 248],
      accent: [219, 39, 119],
      text: [131, 24, 67],
      muted: [157, 23, 77],
    },
  },
  executive: {
    layout: 'top',
    colors: {
      header: [15, 23, 42],
      headerText: [248, 250, 252],
      accent: [201, 162, 39], // Gold
      text: [15, 23, 42],
      muted: [71, 85, 105],
    },
  },
  nordic: {
    layout: 'sidebar',
    sidebarWidth: 75,
    colors: {
      sidebar: [240, 249, 255],
      sidebarText: [12, 74, 110],
      accent: [14, 165, 233],
      text: [12, 74, 110],
      muted: [3, 105, 161],
    },
  },
};

// Hjälpfunktioner
function getSkillName(skill: any): string {
  if (typeof skill === 'string') return skill;
  if (skill && typeof skill === 'object') return skill.name || '';
  return String(skill);
}

function sanitizeText(text: string | undefined | null): string {
  if (!text) return '';
  return text
    .replace(/[–—]/g, '-')
    .replace(/[\"]/g, '"')
    .replace(/['']/g, "'")
    .replace(/…/g, '...')
    .trim();
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

/**
 * Huvudfunktion för CV-export
 */
export async function generateCVPDF(cvData: CVData): Promise<Blob> {
  const template = TEMPLATES[cvData.template as keyof typeof TEMPLATES] || TEMPLATES.sidebar;
  
  if (template.layout === 'sidebar') {
    return generateSidebarPDF(cvData, template);
  } else if (template.layout === 'split') {
    return generateSplitPDF(cvData, template);
  } else {
    return generateTopPDF(cvData, template);
  }
}

// ==================== SIDEBAR LAYOUT ====================
async function generateSidebarPDF(cvData: CVData, template: any): Promise<Blob> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const sidebarW = template.sidebarWidth;
  const mainW = pageWidth - sidebarW;
  const margin = 10;
  
  const fullName = sanitizeText(`${cvData.firstName || ''} ${cvData.lastName || ''}`.trim()) || 'Ditt Namn';
  
  // Sidokolumn bakgrund
  doc.setFillColor(...template.colors.sidebar);
  doc.rect(0, 0, sidebarW, pageHeight, 'F');
  
  let yPos = 15;
  
  // FOTO i sidokolumn
  if (cvData.profileImage) {
    try {
      const img = await getImageAsBase64(cvData.profileImage);
      if (img) {
        const format = img.includes('data:image/png') ? 'PNG' : 'JPEG';
        // Cirkel form - vi lägger bilden i en fyrkant men rundar hörnen i CSS-liknande stil
        doc.addImage(img, format, 15, yPos, 45, 45);
        yPos += 55;
      }
    } catch (e) {
      yPos += 20;
    }
  } else {
    yPos += 20;
  }
  
  // Sidokolumn innehåll
  doc.setTextColor(...template.colors.sidebarText);
  
  // Kontakt
  if (cvData.email || cvData.phone || cvData.location) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('KONTAKT', margin, yPos);
    yPos += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    if (cvData.email) {
      doc.text(sanitizeText(cvData.email), margin, yPos);
      yPos += 5;
    }
    if (cvData.phone) {
      doc.text(sanitizeText(cvData.phone), margin, yPos);
      yPos += 5;
    }
    if (cvData.location) {
      doc.text(sanitizeText(cvData.location), margin, yPos);
      yPos += 5;
    }
    yPos += 10;
  }
  
  // Skills i sidokolumn
  if (cvData.skills?.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('KOMPETENSER', margin, yPos);
    yPos += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    cvData.skills.forEach((skill, i) => {
      if (yPos > pageHeight - 20) return;
      doc.setFillColor(255, 255, 255, 0.15);
      doc.roundedRect(margin, yPos - 3, sidebarW - 20, 6, 2, 2, 'F');
      doc.text(sanitizeText(getSkillName(skill)), margin + 2, yPos + 1);
      yPos += 8;
    });
    yPos += 5;
  }
  
  // Språk
  if (cvData.languages?.length > 0) {
    if (yPos < pageHeight - 40) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('SPRÅK', margin, yPos);
      yPos += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      cvData.languages.forEach(lang => {
        if (yPos > pageHeight - 20) return;
        const name = sanitizeText(lang.language || (lang as any).name);
        doc.text(`${name} - ${sanitizeText(lang.level)}`, margin, yPos);
        yPos += 5;
      });
    }
  }
  
  // Huvudinnehåll
  let mainY = 20;
  const mainX = sidebarW + 15;
  
  doc.setTextColor(...template.colors.text);
  
  // Namn
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(fullName, mainX, mainY);
  mainY += 10;
  
  // Titel
  if (cvData.title) {
    doc.setFontSize(14);
    doc.setTextColor(...template.colors.accent);
    doc.text(sanitizeText(cvData.title), mainX, mainY);
    mainY += 15;
  }
  
  doc.setTextColor(...template.colors.text);
  
  // Sammanfattning
  if (cvData.summary) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PROFIL', mainX, mainY);
    mainY += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(sanitizeText(cvData.summary), mainW - 25);
    doc.text(lines, mainX, mainY);
    mainY += lines.length * 4 + 10;
  }
  
  // Erfarenhet
  if (cvData.workExperience?.length > 0) {
    if (mainY > pageHeight - 40) {
      doc.addPage();
      mainY = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ERFARENHET', mainX, mainY);
    mainY += 8;
    
    cvData.workExperience.forEach(job => {
      if (mainY > pageHeight - 30) {
        doc.addPage();
        mainY = 20;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(sanitizeText(job.title), mainX, mainY);
      mainY += 5;
      
      doc.setTextColor(...template.colors.accent);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`${sanitizeText(job.company)} | ${sanitizeText(job.startDate)} - ${job.current ? 'Nu' : sanitizeText(job.endDate)}`, mainX, mainY);
      mainY += 5;
      
      doc.setTextColor(...template.colors.text);
      if (job.description) {
        const descLines = doc.splitTextToSize(sanitizeText(job.description), mainW - 25);
        doc.text(descLines, mainX, mainY);
        mainY += descLines.length * 4 + 5;
      } else {
        mainY += 5;
      }
    });
  }
  
  // Utbildning
  if (cvData.education?.length > 0) {
    if (mainY > pageHeight - 30) {
      doc.addPage();
      mainY = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('UTBILDNING', mainX, mainY);
    mainY += 8;
    
    cvData.education.forEach(edu => {
      if (mainY > pageHeight - 20) {
        doc.addPage();
        mainY = 20;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(sanitizeText(edu.degree), mainX, mainY);
      mainY += 4;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`${sanitizeText(edu.school)} | ${sanitizeText(edu.startDate)} - ${sanitizeText(edu.endDate)}`, mainX, mainY);
      mainY += 6;
    });
  }
  
  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Sida ${i} av ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }
  
  return doc.output('blob');
}

// ==================== TOP LAYOUT ====================
async function generateTopPDF(cvData: CVData, template: any): Promise<Blob> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentW = pageWidth - 40;
  
  const fullName = sanitizeText(`${cvData.firstName || ''} ${cvData.lastName || ''}`.trim()) || 'Ditt Namn';
  
  // Header bakgrund
  const headerH = cvData.profileImage ? 60 : (cvData.title ? 40 : 30);
  
  if (cvData.template === 'centered') {
    // Gradient simulation med färg
    doc.setFillColor(...template.colors.header);
    doc.rect(0, 0, pageWidth, headerH, 'F');
  } else {
    doc.setFillColor(...template.colors.header);
    doc.rect(0, 0, pageWidth, headerH, 'F');
  }
  
  // Header innehåll
  doc.setTextColor(...template.colors.headerText);
  
  let yPos = 20;
  
  // Foto
  if (cvData.profileImage) {
    try {
      const img = await getImageAsBase64(cvData.profileImage);
      if (img) {
        const format = img.includes('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(img, format, margin, 10, 35, 35);
      }
    } catch (e) {}
  }
  
  // Namn
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  if (cvData.profileImage) {
    doc.text(fullName, margin + 45, yPos);
  } else {
    doc.text(fullName, pageWidth / 2, yPos, { align: 'center' });
  }
  yPos += 8;
  
  // Titel
  if (cvData.title) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    if (cvData.profileImage) {
      doc.text(sanitizeText(cvData.title), margin + 45, yPos);
    } else {
      doc.text(sanitizeText(cvData.title), pageWidth / 2, yPos, { align: 'center' });
    }
  }
  
  // Kontakt under header
  yPos = headerH + 10;
  doc.setTextColor(...template.colors.text);
  doc.setFontSize(9);
  
  const contactParts = [];
  if (cvData.email) contactParts.push(sanitizeText(cvData.email));
  if (cvData.phone) contactParts.push(sanitizeText(cvData.phone));
  if (cvData.location) contactParts.push(sanitizeText(cvData.location));
  
  if (contactParts.length > 0) {
    doc.text(contactParts.join('  |  '), pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
  }
  
  // Sammanfattning
  if (cvData.summary) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('OM MIG', margin, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(sanitizeText(cvData.summary), contentW);
    doc.text(lines, margin, yPos);
    yPos += lines.length * 4 + 10;
  }
  
  // Skills
  if (cvData.skills?.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('KOMPETENSER', margin, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const skillsText = cvData.skills.map(s => sanitizeText(getSkillName(s))).join('  •  ');
    const skillLines = doc.splitTextToSize(skillsText, contentW);
    doc.text(skillLines, margin, yPos);
    yPos += skillLines.length * 4 + 10;
  }
  
  // Två kolumner - Erfarenhet & Utbildning
  const colW = (contentW - 10) / 2;
  let leftY = yPos;
  let rightY = yPos;
  
  // Erfarenhet (vänster)
  if (cvData.workExperience?.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('ERFARENHET', margin, leftY);
    leftY += 8;
    
    cvData.workExperience.forEach(job => {
      if (leftY > pageHeight - 30) return;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(sanitizeText(job.title), margin, leftY);
      leftY += 4;
      
      doc.setTextColor(...template.colors.accent);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(sanitizeText(job.company), margin, leftY);
      leftY += 4;
      
      doc.setTextColor(...template.colors.muted);
      doc.text(`${sanitizeText(job.startDate)} - ${job.current ? 'Nu' : sanitizeText(job.endDate)}`, margin, leftY);
      leftY += 8;
    });
  }
  
  // Utbildning (höger)
  if (cvData.education?.length > 0) {
    doc.setTextColor(...template.colors.text);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('UTBILDNING', margin + colW + 10, rightY);
    rightY += 8;
    
    cvData.education.forEach(edu => {
      if (rightY > pageHeight - 30) return;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(sanitizeText(edu.degree), margin + colW + 10, rightY);
      rightY += 4;
      
      doc.setTextColor(...template.colors.accent);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(sanitizeText(edu.school), margin + colW + 10, rightY);
      rightY += 4;
      
      doc.setTextColor(...template.colors.muted);
      doc.text(`${sanitizeText(edu.startDate)} - ${sanitizeText(edu.endDate)}`, margin + colW + 10, rightY);
      rightY += 7;
    });
  }
  
  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Sida ${i} av ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }
  
  return doc.output('blob');
}

// ==================== SPLIT LAYOUT ====================
async function generateSplitPDF(cvData: CVData, template: any): Promise<Blob> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const leftW = template.leftWidth;
  const rightW = pageWidth - leftW;
  
  const fullName = sanitizeText(`${cvData.firstName || ''} ${cvData.lastName || ''}`.trim()) || 'Ditt Namn';
  
  // Vänster kolumn (färgstark)
  doc.setFillColor(...template.colors.left);
  doc.rect(0, 0, leftW, pageHeight, 'F');
  
  let leftY = 20;
  
  // Foto stort
  if (cvData.profileImage) {
    try {
      const img = await getImageAsBase64(cvData.profileImage);
      if (img) {
        const format = img.includes('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(img, format, 15, leftY, leftW - 30, leftW - 30);
        leftY += leftW - 20;
      }
    } catch (e) {
      leftY += 20;
    }
  }
  
  // Namn i vänster
  doc.setTextColor(...template.colors.leftText);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(fullName, 15, leftY, { maxWidth: leftW - 30 });
  leftY += 10;
  
  if (cvData.title) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(sanitizeText(cvData.title), 15, leftY);
    leftY += 15;
  }
  
  // Kontakt i vänster
  doc.setFontSize(9);
  if (cvData.email) {
    doc.text(sanitizeText(cvData.email), 15, leftY);
    leftY += 5;
  }
  if (cvData.phone) {
    doc.text(sanitizeText(cvData.phone), 15, leftY);
    leftY += 5;
  }
  if (cvData.location) {
    doc.text(sanitizeText(cvData.location), 15, leftY);
    leftY += 5;
  }
  leftY += 10;
  
  // Språk med progress bars
  if (cvData.languages?.length > 0 && leftY < pageHeight - 50) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('SPRÅK', 15, leftY);
    leftY += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    cvData.languages.forEach(lang => {
      if (leftY > pageHeight - 20) return;
      
      doc.text(sanitizeText(lang.language || (lang as any).name), 15, leftY);
      
      const level = lang.level;
      const width = level === 'Modersmål' ? 40 : level === 'Flytande' ? 34 : level === 'God' ? 28 : 20;
      
      doc.setFillColor(255, 255, 255, 0.2);
      doc.rect(15, leftY + 2, 40, 3, 'F');
      doc.setFillColor(255, 255, 255);
      doc.rect(15, leftY + 2, width, 3, 'F');
      
      leftY += 10;
    });
  }
  
  // Höger kolumn
  let rightY = 20;
  const rightX = leftW + 15;
  
  doc.setTextColor(...template.colors.text);
  
  // Sammanfattning
  if (cvData.summary) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Profil', rightX, rightY);
    rightY += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(sanitizeText(cvData.summary), rightW - 25);
    doc.text(lines, rightX, rightY);
    rightY += lines.length * 4 + 10;
  }
  
  // Erfarenhet
  if (cvData.workExperience?.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Erfarenhet', rightX, rightY);
    rightY += 8;
    
    cvData.workExperience.forEach(job => {
      if (rightY > pageHeight - 30) {
        doc.addPage();
        rightY = 20;
      }
      
      // Kort bakgrund
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(rightX - 2, rightY - 4, rightW - 20, 25, 3, 3, 'F');
      
      doc.setTextColor(...template.colors.text);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(sanitizeText(job.title), rightX, rightY);
      rightY += 5;
      
      doc.setTextColor(...template.colors.accent);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(sanitizeText(job.company), rightX, rightY);
      rightY += 5;
      
      doc.setTextColor(...template.colors.muted);
      doc.text(`${sanitizeText(job.startDate)} - ${job.current ? 'Nu' : sanitizeText(job.endDate)}`, rightX, rightY);
      rightY += 10;
    });
  }
  
  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Sida ${i} av ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }
  
  return doc.output('blob');
}

// ==================== ANDRA EXPORTER ====================
export async function generateJobPDF(jobData: JobData): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;
  
  doc.setFontSize(18);
  doc.setTextColor(79, 70, 229);
  doc.setFont('helvetica', 'bold');
  const title = doc.splitTextToSize(sanitizeText(jobData.headline) || 'Jobbannons', pageWidth - 40);
  doc.text(title, 20, yPos);
  yPos += title.length * 8 + 5;
  
  if (jobData.employer?.name) {
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(sanitizeText(jobData.employer.name), 20, yPos);
    yPos += 7;
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
    const clean = jobData.description.text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const desc = doc.splitTextToSize(sanitizeText(clean), pageWidth - 40);
    doc.text(desc, 20, yPos);
  }
  
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
    headStyles: { fillColor: [79, 70, 229], textColor: 255 },
    styles: { fontSize: 9 },
  });
  
  return doc.output('blob');
}
