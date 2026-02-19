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
      setError('Kunde inte hitta CV-elementet.')
      return
    }

    setError(null)
    setIsExporting(true)
    
    try {
      // Säkerställ att elementet har rätt storlek innan vi börjar
      const originalWidth = element.style.width
      element.style.width = '210mm'
      element.style.minHeight = '297mm'
      
      // Vänta på att DOM ska uppdateras
      await new Promise(resolve => setTimeout(resolve, 300))

      // Beräkna antal sidor baserat på innehållets höjd
      const contentHeight = element.scrollHeight
      const pageHeight = 1123 // A4 höjd i pixlar vid 96 DPI
      const totalPages = Math.ceil(contentHeight / pageHeight)

      // Skapa PDF
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = 210
      // const pdfHeight = 297

      for (let page = 0; page < totalPages && page < 5; page++) {
        if (page > 0) {
          pdf.addPage()
        }

        // Skapa canvas för denna sida
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          x: 0,
          y: page * pageHeight,
          width: element.scrollWidth,
          height: Math.min(pageHeight, contentHeight - page * pageHeight),
          windowWidth: element.scrollWidth,
        })

        const imgData = canvas.toDataURL('image/png', 1.0)
        const imgWidth = canvas.width
        const imgHeight = canvas.height
        
        // Skala för att passa PDF
        const scale = pdfWidth / (imgWidth / 2)
        const scaledWidth = pdfWidth
        const scaledHeight = (imgHeight / 2) * scale

        pdf.addImage(imgData, 'PNG', 0, 0, scaledWidth, scaledHeight)
      }

      // Återställ stilar
      element.style.width = originalWidth
      element.style.minHeight = ''

      // Spara PDF
      pdf.save(`${fileName}.pdf`)
    } catch (err) {
      console.error('Fel vid PDF-export:', err)
      setError(err instanceof Error ? err.message : 'Kunde inte skapa PDF.')
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
          <strong>Tips:</strong> PDF:en anpassas automatiskt till A4-storlek. 
          Om ditt CV är långt skapas flera sidor automatiskt.
        </p>
      </div>
    </div>
  )
}
