import { useState } from 'react'
import { Download, FileText, Loader2 } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface CVExportProps {
  previewRef: React.RefObject<HTMLDivElement | null>
  fileName?: string
}

export function CVExport({ previewRef, fileName = 'mitt-cv' }: CVExportProps) {
  const [isExporting, setIsExporting] = useState(false)

  const exportToPDF = async () => {
    if (!previewRef.current) return

    setIsExporting(true)
    try {
      const element = previewRef.current
      
      // Skapa canvas från HTML-elementet
      const canvas = await html2canvas(element, {
        scale: 2, // Högre upplösning för skarpare text
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/png')
      
      // Beräkna PDF-dimensioner (A4)
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      
      const imgX = (pdfWidth - imgWidth * ratio) / 2
      let imgY = 10 // Lite marginal från toppen
      
      // Om CV:et är längre än en sida, skapa flera sidor
      const scaledHeight = imgHeight * ratio
      const pageHeight = pdfHeight - 20 // Lite marginal
      
      let heightLeft = scaledHeight
      let position = 0

      // Lägg till första sidan
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)
      heightLeft -= pageHeight

      // Lägg till fler sidor om nödvändigt
      while (heightLeft > 0) {
        position = heightLeft - scaledHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', imgX, position, imgWidth * ratio, imgHeight * ratio)
        heightLeft -= pageHeight
      }

      // Spara PDF
      pdf.save(`${fileName}.pdf`)
    } catch (error) {
      console.error('Fel vid PDF-export:', error)
      alert('Kunde inte exportera PDF. Försök igen.')
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
          <strong>Tips:</strong> Kontrollera att allt innehåll ser bra ut i förhandsvisningen innan du exporterar. 
          PDF:en genereras exakt som den visas.
        </p>
      </div>
    </div>
  )
}
