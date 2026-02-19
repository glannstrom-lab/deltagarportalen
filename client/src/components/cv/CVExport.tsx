import { useState } from 'react'
import { Download, FileText, Loader2, AlertCircle, Eye } from 'lucide-react'

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
      // Dynamiskt importera html2pdf (det är ett stort bibliotek)
      const html2pdf = (await import('html2pdf.js')).default

      // Gör elementet synligt och sätt rätt storlek
      const originalPosition = element.style.position
      const originalLeft = element.style.left
      const originalVisibility = element.style.visibility
      
      element.style.position = 'absolute'
      element.style.left = '-9999px'
      element.style.visibility = 'visible'
      element.style.width = '210mm'
      element.style.minHeight = '297mm'

      // Vänta på att layout ska uppdateras
      await new Promise(resolve => setTimeout(resolve, 500))

      // Konfiguration för html2pdf
      const opt = {
        margin: 0,
        filename: `${fileName}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 794, // A4 bredd i pixlar
          height: null, // Automatisk höjd
          windowWidth: 794,
        },
        jsPDF: {
          unit: 'mm' as const,
          format: 'a4' as const,
          orientation: 'portrait' as const
        },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy'] as const,
          before: '.page-break-before',
          after: '.page-break-after',
          avoid: 'section, .skill-tag, .avoid-break'
        }
      }

      // Generera PDF
      await html2pdf().set(opt).from(element).save()

      // Återställ stilar
      element.style.position = originalPosition
      element.style.left = originalLeft
      element.style.visibility = originalVisibility
      element.style.width = ''
      element.style.minHeight = ''

    } catch (err) {
      console.error('Fel vid PDF-export:', err)
      setError(err instanceof Error ? err.message : 'Kunde inte skapa PDF.')
    } finally {
      setIsExporting(false)
    }
  }

  const printCV = () => {
    // Skapa en print-vänlig version
    const element = getCVElement()
    if (!element) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Tillåt popup-fönster för att skriva ut')
      return
    }

    const styles = `
      <style>
        @page { size: A4; margin: 0; }
        body { margin: 0; padding: 0; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      </style>
    `

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Mitt CV</title>
          ${styles}
        </head>
        <body>
          ${element.outerHTML}
        </body>
      </html>
    `)
    
    printWindow.document.close()
    
    // Vänta på att bilder ska laddas
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
    }, 500)
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
          <strong>Tips:</strong> PDF:en skapas med automatiska sidbrytningar som 
          undviker att dela sektioner mitt i.
        </p>
      </div>
    </div>
  )
}
