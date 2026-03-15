import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  LayoutDashboard, 
  ChevronRight, 
  Sparkles, 
  Settings,
  ChevronDown,
  Plus
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useDashboardData } from '@/hooks/useDashboardData'
import { cn } from '@/lib/utils'
import '@/styles/animations.css'

// Animation wrapper component
function AnimatedSection({ 
  children, 
  delay = 0, 
  className 
}: { 
  children: React.ReactNode
  delay?: number
  className?: string 
}) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div 
      className={cn(
        className,
        "transition-all duration-500",
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-5"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

// Simple widget placeholder
function SimpleWidget({ title, value, to }: { title: string, value: string | number, to: string }) {
  return (
    <Link 
      to={to}
      className="block bg-white p-5 rounded-2xl border-2 border-slate-200 hover:border-violet-300 hover:shadow-lg transition-all"
    >
      <h3 className="font-semibold text-slate-800 mb-2">{title}</h3>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </Link>
  )
}

export default function OverviewTab() {
  const { user } = useAuthStore()
  const { data, loading } = useDashboardData()
  
  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-48 mb-2" />
          <div className="h-4 bg-slate-200 rounded w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl border-2 border-slate-200 p-5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
              <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Välkomstsektion */}
      <AnimatedSection delay={100}>
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Hej{user?.first_name ? `, ${user.first_name}` : ''}! 👋
          </h1>
          <p className="text-violet-100">
            Välkommen till din personliga arbetsmarknadsportal. Här kan du hantera ditt CV, söka jobb och följa din progress.
          </p>
        </div>
      </AnimatedSection>

      {/* Enkla widgets */}
      <AnimatedSection delay={200}>
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            Dina verktyg
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <SimpleWidget 
              title="CV" 
              value={data?.cv?.hasCV ? `${data.cv.progress}%` : 'Saknas'} 
              to="/cv" 
            />
            <SimpleWidget 
              title="Sparade jobb" 
              value={data?.jobs?.savedCount || 0} 
              to="/job-search" 
            />
            <SimpleWidget 
              title="Välmående" 
              value={data?.wellness?.completedActivities || 0} 
              to="/wellness" 
            />
            <SimpleWidget 
              title="Quests" 
              value={`${data?.quests?.completed || 0}/${data?.quests?.total || 3}`} 
              to="/activity" 
            />
          </div>
        </section>
      </AnimatedSection>
    </div>
  )
}
