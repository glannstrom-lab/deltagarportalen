/**
 * Knowledge Base - Robust implementation with working tabs
 * Uses local state synced with URL hash for reliability
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Sparkles, Rocket, BookOpen, Route, Wrench, Flame, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui'

// Tab definitions
const tabs = [
  { id: 'for-you', label: 'För dig', hash: '', icon: Sparkles },
  { id: 'getting-started', label: 'Komma igång', hash: '#getting-started', icon: Rocket },
  { id: 'topics', label: 'Ämnen', hash: '#topics', icon: BookOpen },
  { id: 'quick-help', label: 'Snabbhjälp', hash: '#quick-help', icon: AlertCircle },
  { id: 'my-journey', label: 'Min resa', hash: '#my-journey', icon: Route },
  { id: 'tools', label: 'Verktyg', hash: '#tools', icon: Wrench },
  { id: 'trending', label: 'Trendar', hash: '#trending', icon: Flame },
] as const

type TabId = typeof tabs[number]['id']

export default function KnowledgeBase() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Get initial tab from URL hash
  const getTabFromHash = useCallback((): TabId => {
    const hash = location.hash.replace('#', '')
    const matchedTab = tabs.find(t => t.id === hash)
    return matchedTab ? matchedTab.id : 'for-you'
  }, [location.hash])
  
  // Local state for active tab
  const [activeTabId, setActiveTabId] = useState<TabId>(getTabFromHash)
  const [isNavigating, setIsNavigating] = useState(false)
  
  // Sync with URL hash when it changes
  useEffect(() => {
    const newTabId = getTabFromHash()
    if (newTabId !== activeTabId && !isNavigating) {
      setActiveTabId(newTabId)
    }
  }, [location.hash, getTabFromHash, activeTabId, isNavigating])
  
  const handleTabClick = (tab: typeof tabs[number]) => {
    if (tab.id === activeTabId) return // Don't re-navigate to same tab
    
    setIsNavigating(true)
    setActiveTabId(tab.id)
    
    // Update URL hash (only the hash part, not the pathname)
    navigate({
      pathname: '/dashboard/knowledge-base',
      hash: tab.hash.replace('#', ''),
    }, { replace: true })
    
    // Reset navigating flag after animation
    setTimeout(() => setIsNavigating(false), 100)
  }
  
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0]
  
  // Render content based on active tab
  const renderContent = () => {
    const contentMap: Record<TabId, React.ReactNode> = {
      'for-you': (
        <>
          <h2 className="text-xl font-bold mb-4 text-slate-900">För dig</h2>
          <p className="text-slate-600">Personligt anpassat innehåll baserat på dina intressen och mål.</p>
          <div className="mt-4 p-4 bg-violet-50 rounded-lg">
            <p className="text-sm text-violet-700">Här kommer AI-anpassade rekommendationer att visas baserat på din profil.</p>
          </div>
        </>
      ),
      'getting-started': (
        <>
          <h2 className="text-xl font-bold mb-4 text-slate-900">Komma igång</h2>
          <p className="text-slate-600">Snabbstartguide för nya användare.</p>
          <div className="mt-4 space-y-2">
            <div className="p-3 bg-white border rounded-lg">Steg 1: Skapa ditt CV</div>
            <div className="p-3 bg-white border rounded-lg">Steg 2: Gör intresseguiden</div>
            <div className="p-3 bg-white border rounded-lg">Steg 3: Sök ditt första jobb</div>
          </div>
        </>
      ),
      'topics': (
        <>
          <h2 className="text-xl font-bold mb-4 text-slate-900">Ämnen</h2>
          <p className="text-slate-600">Bläddra bland alla artikelkategorier.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="p-4 bg-teal-50 rounded-lg">CV & Personligt brev</div>
            <div className="p-4 bg-blue-50 rounded-lg">Jobbsökning</div>
            <div className="p-4 bg-amber-50 rounded-lg">Intervjutips</div>
            <div className="p-4 bg-rose-50 rounded-lg">Karriärutveckling</div>
          </div>
        </>
      ),
      'quick-help': (
        <>
          <h2 className="text-xl font-bold mb-4 text-slate-900">Snabbhjälp</h2>
          <p className="text-slate-600">Akuta situationer och snabba svar.</p>
          <div className="mt-4 space-y-2">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">🚨 Jag har intervju imorgon!</div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">⚠️ Mitt CV ser tomt ut</div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">💬 Hur förklarar jag ett glapp?</div>
          </div>
        </>
      ),
      'my-journey': (
        <>
          <h2 className="text-xl font-bold mb-4 text-slate-900">Min resa</h2>
          <p className="text-slate-600">Din progress och sparade artiklar.</p>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-violet-600">12</div>
              <div className="text-sm text-slate-500">Artiklar lästa</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">5</div>
              <div className="text-sm text-slate-500">Sparade</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600">3</div>
              <div className="text-sm text-slate-500">Dagars streak</div>
            </div>
          </div>
        </>
      ),
      'tools': (
        <>
          <h2 className="text-xl font-bold mb-4 text-slate-900">Verktyg</h2>
          <p className="text-slate-600">Mallar och checklistor för din jobbsökning.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button className="p-4 text-left bg-white border hover:border-violet-300 rounded-lg transition-colors">
              <div className="font-medium">CV-mall (Modern)</div>
              <div className="text-sm text-slate-500">Word + PDF</div>
            </button>
            <button className="p-4 text-left bg-white border hover:border-violet-300 rounded-lg transition-colors">
              <div className="font-medium">Personligt brev-mall</div>
              <div className="text-sm text-slate-500">Word</div>
            </button>
            <button className="p-4 text-left bg-white border hover:border-violet-300 rounded-lg transition-colors">
              <div className="font-medium">Intervju-checklista</div>
              <div className="text-sm text-slate-500">PDF</div>
            </button>
            <button className="p-4 text-left bg-white border hover:border-violet-300 rounded-lg transition-colors">
              <div className="font-medium">Lönekalkylator</div>
              <div className="text-sm text-slate-500">Excel</div>
            </button>
          </div>
        </>
      ),
      'trending': (
        <>
          <h2 className="text-xl font-bold mb-4 text-slate-900">Trendar</h2>
          <p className="text-slate-600">Populärt innehåll just nu.</p>
          <div className="mt-4 space-y-3">
            <div className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg border border-rose-100">
              <div className="font-medium text-rose-900">🔥 Så hanterar du nervositet inför intervjun</div>
              <div className="text-sm text-rose-600">247 läser just nu</div>
            </div>
            <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-100">
              <div className="font-medium text-amber-900">⭐ Så skriver du ett CV utan erfarenhet</div>
              <div className="text-sm text-amber-600">189 läser just nu</div>
            </div>
          </div>
        </>
      ),
    }
    
    return contentMap[activeTabId] || contentMap['for-you']
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Kunskapsbank</h1>
        <p className="text-slate-600 mt-2">Artiklar, guider och verktyg för din jobbsökarresa.</p>
      </div>
      
      {/* Tab navigation */}
      <div className="mb-8 border-b border-slate-200">
        <nav className="flex gap-1 overflow-x-auto scrollbar-hide" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTabId === tab.id
            
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap bg-transparent",
                  isActive
                    ? "border-violet-600 text-violet-600"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
      
      {/* Tab content */}
      <div className="min-h-[400px]">
        <Card className="p-6 animate-in fade-in duration-200">
          {renderContent()}
        </Card>
      </div>
      
      {/* Debug info - remove in production */}
      <div className="mt-8 p-4 bg-slate-100 rounded-lg text-xs font-mono text-slate-500">
        <p>Debug: activeTabId={activeTabId} | hash={location.hash} | pathname={location.pathname}</p>
      </div>
    </div>
  )
}
