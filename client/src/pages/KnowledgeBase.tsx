/**
 * Knowledge Base - Working version with tabs
 */

import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Sparkles, Rocket, BookOpen, Route, Wrench, Flame, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui'

const tabs = [
  { id: 'for-you', label: 'För dig', path: '/dashboard/knowledge-base', icon: Sparkles },
  { id: 'getting-started', label: 'Komma igång', path: '/dashboard/knowledge-base/getting-started', icon: Rocket },
  { id: 'topics', label: 'Ämnen', path: '/dashboard/knowledge-base/topics', icon: BookOpen },
  { id: 'quick-help', label: 'Snabbhjälp', path: '/dashboard/knowledge-base/quick-help', icon: AlertCircle },
  { id: 'my-journey', label: 'Min resa', path: '/dashboard/knowledge-base/my-journey', icon: Route },
  { id: 'tools', label: 'Verktyg', path: '/dashboard/knowledge-base/tools', icon: Wrench },
  { id: 'trending', label: 'Trendar', path: '/dashboard/knowledge-base/trending', icon: Flame },
]

export default function KnowledgeBase() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const currentPath = location.pathname
  const activeTab = tabs.find(t => currentPath === t.path || currentPath.startsWith(t.path + '/')) || tabs[0]
  
  const handleTabClick = (tab: typeof tabs[0]) => {
    navigate(tab.path)
  }
  
  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab.id) {
      case 'for-you':
        return (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">För dig</h2>
            <p className="text-slate-600">Personligt anpassat innehåll baserat på dina intressen och mål.</p>
          </Card>
        )
      case 'getting-started':
        return (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Komma igång</h2>
            <p className="text-slate-600">Snabbstartguide för nya användare. Följ dessa steg för att komma igång med din jobbsökning.</p>
          </Card>
        )
      case 'topics':
        return (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Ämnen</h2>
            <p className="text-slate-600">Bläddra bland alla artikelkategorier. Här hittar du allt innehåll organiserat efter ämne.</p>
          </Card>
        )
      case 'quick-help':
        return (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Snabbhjälp</h2>
            <p className="text-slate-600">Akuta situationer och snabba svar på vanliga problem.</p>
          </Card>
        )
      case 'my-journey':
        return (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Min resa</h2>
            <p className="text-slate-600">Din progress och sparade artiklar. Håll koll på vad du läst och vad du sparat för senare.</p>
          </Card>
        )
      case 'tools':
        return (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Verktyg</h2>
            <p className="text-slate-600">Mallar och checklistor. Ladda ned praktiska resurser för din jobbsökning.</p>
          </Card>
        )
      case 'trending':
        return (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Trendar</h2>
            <p className="text-slate-600">Populärt innehåll just nu. Se vad andra läser och hitta inspiration.</p>
          </Card>
        )
      default:
        return (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Välkommen</h2>
            <p className="text-slate-600">Välj en flik ovan för att utforska kunskapsbanken.</p>
          </Card>
        )
    }
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
            const isActive = activeTab.id === tab.id
            
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
        {renderContent()}
      </div>
    </div>
  )
}
