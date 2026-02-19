import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { Download, FileText, Loader2, AlertCircle } from 'lucide-react'
import { CVPDFDocument } from './CVPDF'
import type { CVData } from '@/services/mockApi'

interface CVExportProps {
  data: CVData
  fileName?: string
}

export function CVExport({ data, fileName = 'mitt-cv' }: CVExportProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    setIsGenerating(true)
    setError(null)
    
    try {
      // Generate PDF blob
      const blob = await pdf(<CVPDFDocument data={data} />).toBlob()
      
      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${fileName}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF generation error:', err)
      setError('Kunde inte generera PDF. Försök igen.')
    } finally {
      setIsGenerating(false)
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
          onClick={handleDownload}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#4f46e5] text-white rounded-xl hover:bg-[#4338ca] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Genererar PDF...
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
          <strong>PDF med React-PDF:</strong> Genereras direkt i webbläsaren med 
          perfekta sidbrytningar och korrekt layout.
        </p>
      </div>
    </div>
  )
}
