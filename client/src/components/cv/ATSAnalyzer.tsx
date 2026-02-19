import { CheckCircle, AlertCircle, FileText } from 'lucide-react'

interface ATSCheck {
  name: string
  passed: boolean
  description: string
}

interface ATSAnalyzerProps {
  score: number
  checks: ATSCheck[]
  suggestions: string[]
}

export function ATSAnalyzer({ score, checks, suggestions }: ATSAnalyzerProps) {
  const getScoreColor = () => {
    if (score >= 80) return '#10b981'
    if (score >= 50) return '#f59e0b'
    return '#ef4444'
  }

  const getScoreLabel = () => {
    if (score >= 80) return 'Utmärkt'
    if (score >= 50) return 'Godkänd'
    return 'Behöver förbättras'
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${getScoreColor()}20` }}>
          <FileText size={24} style={{ color: getScoreColor() }} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">ATS-kompatibilitet</h3>
          <p className="text-sm text-slate-500">
            Hur väl fungerar ditt CV i rekryteringssystem
          </p>
        </div>
        <div className="text-right">
          <div 
            className="text-3xl font-bold"
            style={{ color: getScoreColor() }}
          >
            {score}/100
          </div>
          <p className="text-sm" style={{ color: getScoreColor() }}>
            {getScoreLabel()}
          </p>
        </div>
      </div>

      {/* Checks */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {checks.map((check) => (
          <div
            key={check.name}
            className={`flex items-center gap-2 p-3 rounded-lg ${
              check.passed ? 'bg-green-50' : 'bg-amber-50'
            }`}
          >
            {check.passed ? (
              <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />
            )}
            <div>
              <p className={`text-sm font-medium ${
                check.passed ? 'text-green-700' : 'text-amber-700'
              }`}>
                {check.name}
              </p>
              <p className={`text-xs ${
                check.passed ? 'text-green-600' : 'text-amber-600'
              }`}>
                {check.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="p-4 bg-[#eef2ff] rounded-xl">
          <p className="font-medium text-[#4f46e5] mb-2">Förbättringsförslag:</p>
          <ul className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="text-sm text-slate-700 flex items-start gap-2">
                <span style={{ color: '#4f46e5' }}>•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
