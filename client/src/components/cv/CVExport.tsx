import { useState } from 'react'
import { Download, FileText, Check } from 'lucide-react'
import type { CVData } from '@/services/mockApi'

interface CVExportProps {
  cvData: CVData
}

export function CVExport({ cvData }: CVExportProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    
    // Simulera export
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsExporting(false)
    setExportSuccess(true)
    
    setTimeout(() => setExportSuccess(false), 3000)
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-50 rounded-lg">
          <FileText className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">Exportera CV</h3>
          <p className="text-sm text-slate-500">Ladda ner som PDF</p>
        </div>
      </div>

      <button
        onClick={handleExport}
        disabled={isExporting}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-slate-200 disabled:cursor-not-allowed transition-colors"
      >
        {exportSuccess ? (
          <>
            <Check className="w-5 h-5" />
            Sparat!
          </>
        ) : isExporting ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Exporterar...
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Ladda ner PDF
          </>
        )}
      </button>

      <p className="text-xs text-slate-400 mt-3 text-center">
        Filnamn: {cvData.firstName?.toLowerCase() || 'ditt'}-{cvData.lastName?.toLowerCase() || 'namn'}-cv.pdf
      </p>
    </div>
  )
}

export default CVExport
