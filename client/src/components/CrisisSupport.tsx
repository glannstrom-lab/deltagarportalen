import { useState } from 'react'
import { Heart, X, Phone, ExternalLink } from 'lucide-react'

const crisisResources = [
  {
    name: 'Jourhavande medmänniska',
    phone: '08-702 16 80',
    hours: '21-06',
  },
  {
    name: 'Självmordslinjen',
    phone: '901 01',
    hours: 'Dygnet runt',
    urgent: true,
  },
  {
    name: '1177 Vårdguiden',
    phone: '1177',
    hours: 'Dygnet runt',
  },
]

export default function CrisisSupport() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Support Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-white text-slate-600 border border-slate-200 rounded-full shadow-lg hover:shadow-xl hover:border-violet-200 transition-all text-sm"
      >
        <Heart size={18} className="text-rose-500" />
        <span className="hidden sm:inline font-medium">Mår du dåligt?</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Stöd och hjälp</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-slate-600 text-sm mb-6">
              Om du mår dåligt finns det alltid någon att prata med. Du är inte ensam.
            </p>

            <div className="space-y-3">
              {crisisResources.map((resource) => (
                <a
                  key={resource.name}
                  href={`tel:${resource.phone.replace(/\s/g, '')}`}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    resource.urgent
                      ? 'bg-rose-50 border-rose-200 hover:border-rose-300'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`p-3 rounded-xl ${resource.urgent ? 'bg-rose-500 text-white' : 'bg-white text-slate-600'}`}>
                    <Phone size={20} />
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${resource.urgent ? 'text-rose-900' : 'text-slate-900'}`}>
                      {resource.name}
                    </div>
                    <div className={`text-lg font-semibold ${resource.urgent ? 'text-rose-700' : 'text-slate-700'}`}>
                      {resource.phone}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 font-medium">{resource.hours}</div>
                </a>
              ))}
            </div>

            <a
              href="https://mind.se"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 mt-6 text-sm text-violet-600 hover:text-violet-700 font-medium"
            >
              Mer information på mind.se
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      )}
    </>
  )
}
