import { useState } from 'react'
import { Download, FileText, Loader2, AlertCircle, Eye } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface CVExportProps {
  getCVElement: () => HTMLElement | null
  fileName?: string
  onShowPreview?: () => void
}

export function CVExport({ getCVElement, fileName = 'mitt-cv', onShowPreview }: CVExportProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exportToPDF = async () => {
    const element = getCVElement()
    
    if (!element) {
      setError('Kunde inte hitta CV-elementet. Försök uppdatera sidan.')
      return
    }

    setError(null)
    setIsExporting(true)
    
    try {
      // Kontrollera att elementet har innehåll
      const rect = element.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) {
        throw new Error('CV-elementet har ingen storlek. Kontrollera att förhandsvisningen är synlig.')
      }

      // Skapa canvas från HTML-elementet
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth + 100,
        width: element.scrollWidth,
        height: element.scrollHeight,
      })

      const imgData = canvas.toDataURL('image/png', 1.0)
      
      // Skapa PDF
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = 210 // A4 bredd i mm
      const pdfHeight = 297 // A4 höjd i mm
      
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      
      // Beräkna skalning för att passa A4-bredd
      const scale = pdfWidth / (imgWidth / 2) // Dela med 2 pga scale: 2
      const scaledWidth = pdfWidth
      const scaledHeight = (imgHeight / 2) * scale
      
      // Om CV:et får plats på en sida
      if (scaledHeight <= pdfHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, scaledWidth, scaledHeight)
      } else {
        // Flera sidor - använd enkel paginering
        let pageCount = 0
        let remainingHeight = imgHeight
        
        while (remainingHeight > 0 && pageCount < 10) {
          if (pageCount > 0) {
            pdf.addPage()
          }
          
          // Beräkna vilken del av bilden som ska visas på denna sida
          const offsetY = pageCount * pdfHeight / scale * 2
          const drawHeight = Math.min(pdfHeight / scale * 2, remainingHeight)
          
          // Skapa en temporär canvas för denna sida
          const tempCanvas = document.createElement('canvas')
          tempCanvas.width = imgWidth
          tempCanvas.height = drawHeight
          const tempCtx = tempCanvas.getContext('2d')
          
          if (tempCtx) {
            // Kopiera delen av original-canvas till temporär canvas
            tempCtx.drawImage(
              canvas,
              0, offsetY, imgWidth, drawHeight, // source
              0, 0, imgWidth, drawHeight // dest
            )
            
            const pageImgData = tempCanvas.toDataURL('image/png')
            const pageScaledHeight = (drawHeight / 2) * scale
            
            pdf.addImage(pageImgData, 'PNG', 0, 0, scaledWidth, pageScaledHeight)
          }
          
          remainingHeight -= drawHeight
          pageCount++
        }
      }

      // Spara PDF
      pdf.save(`${fileName}.pdf`)
    } catch (err) {
      console.error('Fel vid PDF-export:', err)
      setError(err instanceof Error ? err.message : 'Kunde inte skapa PDF. Försök igen.')
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

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
          {onShowPreview && (
            <button
              onClick={onShowPreview}
              className="mt-2 flex items-center gap-1 text-sm text-[#4f46e5] hover:underline"
            >
              <Eye size={14} />
              Visa förhandsvisning först
            </button>
          )}
        </div>
      )}

      {/* Export-alternativ */}
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
          Skriv ut / Spara som PDF
        </button>
      </div>

      <div className="mt-4 p-3 bg-slate-50 rounded-lg">
        <p className="text-xs text-slate-500">
          <strong>Tips:</strong> För bästa resultat, visa förhandsvisningen innan du exporterar. 
          Det säkerställer att alla bilder och stilar har laddats korrekt.
        </p>
      </div>
    </div>
  )
}
