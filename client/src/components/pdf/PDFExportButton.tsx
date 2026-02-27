/**
 * PDF Export Button
 * Knapp för att exportera CV eller jobb till PDF
 */

import React, { useState } from 'react';
import { FileDown, Loader2, Eye, Download } from 'lucide-react';
import {
  generateCVPDF,
  generateJobPDF,
  generateApplicationHistoryPDF,
  downloadPDF,
  previewPDF,
} from '@/services/pdfExportService';
import type { CVData, JobData } from '@/types/pdf.types';
// Type-only import to avoid runtime errors

interface PDFExportButtonProps {
  type: 'cv' | 'job' | 'applications';
  data: CVData | JobData | any;
  filename?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  showPreview?: boolean;
  className?: string;
}

export const PDFExportButton: React.FC<PDFExportButtonProps> = ({
  type,
  data,
  filename,
  variant = 'primary',
  size = 'md',
  showPreview = true,
  className = '',
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50',
  };

  const getDefaultFilename = () => {
    try {
      switch (type) {
        case 'cv': {
          const cvData = data as CVData;
          const firstName = cvData?.personalInfo?.firstName || 'okänd';
          const lastName = cvData?.personalInfo?.lastName || '';
          return `CV_${firstName}_${lastName}.pdf`;
        }
        case 'job': {
          const jobData = data as JobData;
          const headline = jobData?.headline?.slice(0, 30).replace(/\s+/g, '_') || 'annons';
          return `Jobb_${headline}.pdf`;
        }
        case 'applications':
          return `Ansökningshistorik_${new Date().toISOString().split('T')[0]}.pdf`;
        default:
          return 'dokument.pdf';
      }
    } catch {
      return 'dokument.pdf';
    }
  };

  const finalFilename = filename || getDefaultFilename();

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      let blob: Blob;

      switch (type) {
        case 'cv':
          blob = await generateCVPDF(data as CVData);
          break;
        case 'job':
          blob = await generateJobPDF(data as JobData);
          break;
        case 'applications':
          blob = await generateApplicationHistoryPDF(data);
          break;
        default:
          throw new Error('Unknown PDF type');
      }

      return blob;
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Kunde inte generera PDF. Försök igen.');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    const blob = await generatePDF();
    if (blob) {
      downloadPDF(blob, finalFilename);
    }
    setShowMenu(false);
  };

  const handlePreview = async () => {
    const blob = await generatePDF();
    if (blob) {
      previewPDF(blob);
    }
    setShowMenu(false);
  };

  if (isGenerating) {
    return (
      <button
        disabled
        className={`inline-flex items-center gap-2 rounded-lg font-medium opacity-70 cursor-not-allowed ${
          sizeClasses[size]
        } ${variantClasses[variant]} ${className}`}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Genererar PDF...
      </button>
    );
  }

  if (!showPreview) {
    return (
      <button
        onClick={handleDownload}
        className={`inline-flex items-center gap-2 rounded-lg font-medium transition-colors ${
          sizeClasses[size]
        } ${variantClasses[variant]} ${className}`}
      >
        <FileDown className="w-4 h-4" />
        Exportera PDF
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`inline-flex items-center gap-2 rounded-lg font-medium transition-colors ${
          sizeClasses[size]
        } ${variantClasses[variant]} ${className}`}
      >
        <FileDown className="w-4 h-4" />
        Exportera PDF
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
            <button
              onClick={handleDownload}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Ladda ner
            </button>
            <button
              onClick={handlePreview}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Förhandsgranska
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PDFExportButton;
