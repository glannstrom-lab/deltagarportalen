import { useState } from 'react'
import { Download, FileText, Loader2, AlertCircle } from 'lucide-react'

interface CVExportProps {
  fileName?: string
}

export function CVExport({ fileName = 'mitt-cv' }: CVExportProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exportToPDF = async () => {
    setError(null)
    setIsExporting(true)
    
    try {
      // Hitta CV-elementet
      const cvElement = document.querySelector('[data-cv-export="true"]') as HTMLElement
      
      if (!cvElement) {
        throw new Error('Kunde inte hitta CV-elementet')
      }

      // Klona elementet för manipulation
      const clone = cvElement.cloneNode(true) as HTMLElement
      
      // Skapa ett nytt fönster för utskrift
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        throw new Error('Kunde inte öppna print-fönster. Kontrollera popup-blockering.')
      }

      // Bygg HTML för utskrift med korrekt A4-styling
      const printHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${fileName}</title>
          <style>
            @page {
              size: A4;
              margin: 15mm;
            }
            
            * {
              box-sizing: border-box;
            }
            
            body {
              margin: 0;
              padding: 0;
              font-family: ${clone.style.fontFamily || 'Inter, sans-serif'};
              font-size: 11pt;
              line-height: 1.4;
              color: #1e293b;
              background: white;
            }
            
            /* A4 container */
            .cv-container {
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              background: white;
              padding: 0;
            }
            
            /* Section styling with page break control */
            section {
              break-inside: avoid;
              page-break-inside: avoid;
              margin-bottom: 16pt;
            }
            
            /* Header */
            .cv-header {
              background-color: ${clone.querySelector('[class*="cv-header"]')?.getAttribute('style')?.match(/backgroundColor:\s*([^;]+)/)?.[1] || '#4f46e5'};
              color: white;
              padding: 24pt;
              margin: -15mm -15mm 16pt -15mm;
              width: calc(100% + 30mm);
            }
            
            .cv-header h1 {
              margin: 0 0 8pt 0;
              font-size: 24pt;
              font-weight: bold;
            }
            
            .cv-header .title {
              font-size: 14pt;
              margin-bottom: 12pt;
              opacity: 0.9;
            }
            
            .cv-header .contact-info {
              display: flex;
              flex-wrap: wrap;
              gap: 12pt;
              font-size: 10pt;
            }
            
            /* Section titles */
            h2 {
              color: ${clone.querySelector('h2')?.style.color || '#4f46e5'};
              border-bottom: 2px solid ${clone.querySelector('h2')?.style.borderColor || '#4f46e5'};
              padding-bottom: 4pt;
              margin: 0 0 12pt 0;
              font-size: 13pt;
              font-weight: 600;
              break-after: avoid;
              page-break-after: avoid;
            }
            
            /* Job/Education entries */
            .entry {
              margin-bottom: 12pt;
              break-inside: avoid;
              page-break-inside: avoid;
            }
            
            .entry-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 2pt;
            }
            
            .entry-title {
              font-weight: 600;
              font-size: 11pt;
              color: #1e293b;
            }
            
            .entry-date {
              font-size: 9pt;
              color: #64748b;
              white-space: nowrap;
            }
            
            .entry-company {
              font-size: 10pt;
              color: #475569;
              margin-bottom: 4pt;
            }
            
            .entry-description {
              font-size: 10pt;
              color: #334155;
              margin: 0;
            }
            
            /* Skills */
            .skill-category {
              margin-bottom: 10pt;
            }
            
            .skill-category-title {
              font-size: 9pt;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin-bottom: 6pt;
            }
            
            .skill-list {
              display: flex;
              flex-wrap: wrap;
              gap: 6pt;
            }
            
            .skill-tag {
              background-color: ${clone.querySelector('.skill-tag')?.getAttribute('style')?.match(/backgroundColor:\s*([^;]+)/)?.[1] || '#e0e7ff'};
              color: ${clone.querySelector('.skill-tag')?.getAttribute('style')?.match(/color:\s*([^;]+)/)?.[1] || '#4f46e5'};
              padding: 4pt 8pt;
              border-radius: 4pt;
              font-size: 9pt;
              break-inside: avoid;
            }
            
            /* Languages */
            .language-list {
              display: flex;
              flex-wrap: wrap;
              gap: 16pt;
            }
            
            .language-item {
              display: flex;
              align-items: center;
              gap: 4pt;
            }
            
            /* Certificates */
            .certificate-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 6pt;
              font-size: 10pt;
            }
            
            /* References */
            .reference-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12pt;
            }
            
            .reference-item {
              font-size: 10pt;
            }
            
            .reference-name {
              font-weight: 600;
              color: #1e293b;
            }
            
            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="cv-container">
            ${clone.innerHTML}
          </div>
          <script>
            // Vänta på att allt ska laddas, sen skriv ut
            window.onload = function() {
              setTimeout(function() {
                window.print();
                // Stäng fönstret efter utskrift (om användaren inte avbryter)
                setTimeout(function() {
                  window.close();
                }, 1000);
              }, 500);
            };
          </script>
        </body>
        </html>
      `

      // Skriv HTML till det nya fönstret
      printWindow.document.write(printHTML)
      printWindow.document.close()
      
    } catch (err) {
      console.error('PDF export error:', err)
      setError(err instanceof Error ? err.message : 'Kunde inte skapa PDF')
    } finally {
      setIsExporting(false)
    }
  }

  const printCV = () => {
    window.print()
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-[#4f46e5]/10 rounded-lg">
          <FileText size={24} style={{ color: '#4f46e5' }} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">Exportera CV</h3>
          <p className="text-sm text-slate-500">Ladda ner eller skriv ut</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={exportToPDF}
          disabled={isExporting}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#4f46e5] text-white rounded-xl hover:bg-[#4338ca] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Öppnar för utskrift...
            </>
          ) : (
            <>
              <Download size={18} />
              Spara som PDF (via utskrift)
            </>
          )}
        </button>

        <button
          onClick={printCV}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <FileText size={18} />
          Skriv ut / Spara som PDF
        </button>
      </div>

      <div className="mt-4 p-3 bg-slate-50 rounded-lg">
        <p className="text-xs text-slate-500">
          <strong>Rekommenderad metod:</strong> Använd "Skriv ut / Spara som PDF" och välj 
          "Spara som PDF" som skrivare. Detta ger bäst resultat med korrekta sidbrytningar.
        </p>
      </div>
    </div>
  )
}
