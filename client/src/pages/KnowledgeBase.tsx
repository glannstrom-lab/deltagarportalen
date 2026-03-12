/**
 * Knowledge Base - Main Page with Tab Navigation
 * Simplified debug version
 */

import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Sparkles,
  Rocket,
  BookOpen,
  Route,
  Wrench,
  Flame,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, LoadingState } from '@/components/ui'

// Tab definitions
const tabs = [
  { id: 'for-you', label: 'För dig', path: '/dashboard/knowledge-base', icon: Sparkles },
  { id: 'getting-started', label: 'Komma igång', path: '/dashboard/knowledge-base/getting-started', icon: Rocket },
  { id: 'topics', label: 'Ämnen', path: '/dashboard/knowledge-base/topics', icon: BookOpen },
  { id: 'quick-help', label: 'Snabbhjälp', path: '/dashboard/knowledge-base/quick-help', icon: AlertCircle },
  { id: 'my-journey', label: 'Min resa', path: '/dashboard/knowledge-base/my-journey', icon: Route },
  { id: 'tools', label: 'Verktyg', path: '/dashboard/knowledge-base/tools', icon: Wrench },
  { id: 'trending', label: 'Trendar', path: '/dashboard/knowledge-base/trending', icon: Flame },
]

// Simple tab content components
function ForYouContent() {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">För dig</h2>
      <p>Här visas personligt anpassat innehåll baserat på dina intressen.</p>
    </Card>
  )
}

function GettingStartedContent() {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Komma igång</h2>
      <p>Snabbstartguide för nya användare.</p>
    </Card>
  )
}

function TopicsContent() {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Ämnen</h2>
      <p>Bläddra bland alla artikelkategorier.</p>
    </Card>
  )
}

function QuickHelpContent() {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Snabbhjälp</h2>
      <p>Akuta situationer och snabba svar.</p>
    </Card>
  )
}

function MyJourneyContent() {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Min resa</h2>
      <p>Din progress och sparade artiklar.</p>
    </Card>
  )
}

function ToolsContent() {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Verktyg</h2>
      <p>Mallar och checklistor.</p>
    </Card>
  )
}

function TrendingContent() {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Trendar</h2>
      <p>Populärt innehåll just nu.</p>
    </Card>
  )
}

export default function KnowledgeBase() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Determine active tab from URL
  const currentPath = location.pathname
  const activeTab = tabs.find(t => currentPath === t.path || currentPath.startsWith(t.path + '/')) || tabs[0]
  
  const handleTabClick = (tab: typeof tabs[0]) => {
    console.log('=== TAB CLICKED ===')
    console.log('Tab:', tab.label)
    console.log('Path:', tab.path)
    console.log('Current path:', currentPath)
    navigate(tab.path)
  }
  
  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab.id) {
      case 'for-you': return <ForYouContent />
      case 'getting-started': return <GettingStartedContent />
      case 'topics': return <TopicsContent />
      case 'quick-help': return <QuickHelpContent />
      case 'my-journey': return <MyJourneyContent />
      case 'tools': return <ToolsContent />
      case 'trending': return <TrendingContent />
      default: return <ForYouContent />
    }
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Kunskapsbank</h1>
        <p className="text-slate-600 mt-2">Artiklar, guider och verktyg för din jobbsökarresa.</p>
        <p className="text-sm text-slate-400 mt-1">Nuvarande URL: {currentPath}</p>
      </div>
      
      {/* Tab navigation - simplified */}
      <div className="mb-8 border-b border-slate-200">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab.id === tab.id
            
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab)}
                style={{ cursor: 'pointer' }}
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
        </div>
      </div>
      
      {/* Tab content */}
      <div className="min-h-[400px]">
        {renderContent()}
      </div>
    </div>
  )
}
