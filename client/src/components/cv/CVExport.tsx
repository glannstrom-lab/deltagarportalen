import { useState } from 'react'
import { Download, FileText, Loader2, AlertCircle } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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
      // Hämta CV-elementet från den synliga förhandsvisningen
      // Om ingen preview är synlig, leta efter den dolda containern
      let element = document.querySelector('[data-cv-export="true"]') as HTMLElement
      
      if (!element) {
        throw new Error('Kunde inte hitta CV-element. Vänligen aktivera förhandsvisningen först.')
      }

      // Kontrollera om elementet har dimensioner
      const rect = element.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) {
        throw new Error('CV-elementet har ingen storlek. Vänligen aktivera förhandsvisningen.')
      }

      // Spara nuvarande stilar
      const originalOverflow = element.style.overflow
      const originalHeight = element.style.height
      
      // Säkerställ att hela innehållet är synligt
      element.style.overflow = 'visible'
      element.style.height = 'auto'

      // Rendera hela elementet
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
      })

      // Återställ stilar
      element.style.overflow = originalOverflow
      element.style.height = originalHeight

      const imgData = canvas.toDataURL('image/png', 1.0)
      
      // A4 dimensioner i mm
      const pdfWidth = 210
      const pdfHeight = 297
      
      // Beräkna skalning
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = imgWidth / imgHeight
      
      const scaledWidth = pdfWidth
      const scaledHeight = pdfWidth / ratio
      
      // Skapa PDF
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      // Om hela CV:t får plats på en sida
      if (scaledHeight <= pdfHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, scaledWidth, scaledHeight)
      } else {
        // Flera sidor - beräkna hur många sidor som behövs
        const totalPages = Math.ceil(scaledHeight / pdfHeight)
        
        for (let page = 0; page < totalPages && page < 5; page++) {
          if (page > 0) {
            pdf.addPage()
          }
          
          // Beräkna vilken del av bilden som ska visas på denna sida
          const sourceY = (page * pdfHeight * imgWidth) / pdfWidth
          const sourceHeight = Math.min(
            ((pdfHeight * imgWidth) / pdfWidth),
            imgHeight - sourceY
          )
          
          // Skapa temporär canvas för denna sida
          const pageCanvas = document.createElement('canvas')
          pageCanvas.width = imgWidth
          pageCanvas.height = sourceHeight
          
          const ctx = pageCanvas.getContext('2d')
          if (ctx) {
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
            ctx.drawImage(
              canvas,
              0, sourceY, imgWidth, sourceHeight,
              0, 0, imgWidth, sourceHeight
            )
            
            const pageImgData = pageCanvas.toDataURL('image/png')
            const pageHeightMm = (sourceHeight * pdfWidth) / imgWidth
            
            pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidth, pageHeightMm)
          }
        }
      }

      pdf.save(`${fileName}.pdf`)
    } catch (err) {
      console.error('PDF export error:', err)
      setError(err instanceof Error ? err.message : 'Kunde inte skapa PDF')
    } finally {
      setIsExporting(false)
    }
  }

  const printCV = () => {
    // Öppna print-dialog direkt
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
              Skapar PDF...
            </>
          ) : (
            <>
              <Download size={18} />
              Ladda ner PDF
            </>
          )}
        </button>

        <button
          onClick={printCV}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <FileText size={18} />
          Skriv ut
        </button>
      </div>

      <div className="mt-4 p-3 bg-slate-50 rounded-lg">
        <p className="text-xs text-slate-500">
          <strong>Tips:</strong> Om PDF-exporten inte fungerar, använd "Skriv ut" 
          och välj "Spara som PDF" i print-dialogen för bästa resultat.
        </p>
      </div>
    </div>
  )
}
