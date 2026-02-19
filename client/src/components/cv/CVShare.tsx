import { useState } from 'react'
import { Share2, Copy, Check, QrCode, X, Download } from 'lucide-react'

interface CVShareProps {
  onShare: () => Promise<{ shareUrl: string; qrCode: string; expiresAt: string }>
}

export function CVShare({ onShare }: CVShareProps) {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shareData, setShareData] = useState<{ shareUrl: string; qrCode: string; expiresAt: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    setLoading(true)
    try {
      const data = await onShare()
      setShareData(data)
      setShowModal(true)
    } catch (error) {
      console.error('Delningsfel:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (!shareData) return
    try {
      await navigator.clipboard.writeText(shareData.shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Kunde inte kopiera:', err)
    }
  }

  const downloadQR = () => {
    if (!shareData?.qrCode) return
    const link = document.createElement('a')
    link.href = shareData.qrCode
    link.download = 'cv-qr-code.png'
    link.click()
  }

  return (
    <>
      <button
        onClick={handleShare}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            Skapar länk...
          </>
        ) : (
          <>
            <Share2 size={18} />
            Dela CV
          </>
        )}
      </button>

      {showModal && shareData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Dela ditt CV</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Share URL */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Delningslänk
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareData.shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors"
                    title="Kopiera länk"
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Länken är giltig till {new Date(shareData.expiresAt).toLocaleDateString('sv-SE')}
                </p>
              </div>

              {/* QR Code */}
              <div className="text-center">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  QR-kod
                </label>
                <div className="inline-block p-4 bg-white border-2 border-slate-200 rounded-xl">
                  {shareData.qrCode ? (
                    <img
                      src={shareData.qrCode}
                      alt="QR-kod för CV"
                      className="w-48 h-48"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center bg-slate-100">
                      <QrCode size={64} className="text-slate-400" />
                    </div>
                  )}
                </div>
                <button
                  onClick={downloadQR}
                  className="mt-2 flex items-center justify-center gap-2 text-sm text-[#4f46e5] hover:underline mx-auto"
                >
                  <Download size={14} />
                  Ladda ner QR-kod
                </button>
              </div>

              {/* Info */}
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">
                  <strong>Tips:</strong> QR-koden är perfekt att skriva ut på visitkort 
                  eller visa på nätverksträffar. Mottagaren kan enkelt scanna och se ditt CV.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
