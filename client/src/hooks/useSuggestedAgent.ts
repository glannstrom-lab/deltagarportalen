/**
 * Hook to suggest an AI agent based on user's recent activity
 */

import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import type { AgentId } from '@/components/ai-team/types'

interface SuggestedAgent {
  agentId: AgentId
  reason: string
  reasonKey: string
}

// Map routes to suggested agents
const routeToAgent: Record<string, SuggestedAgent> = {
  '/cv': {
    agentId: 'arbetskonsulent',
    reason: 'Du arbetade nyss med ditt CV',
    reasonKey: 'aiTeam.suggestions.cvWork',
  },
  '/cover-letter': {
    agentId: 'arbetskonsulent',
    reason: 'Du arbetade nyss med personligt brev',
    reasonKey: 'aiTeam.suggestions.coverLetter',
  },
  '/job-search': {
    agentId: 'arbetskonsulent',
    reason: 'Du sökte nyss efter jobb',
    reasonKey: 'aiTeam.suggestions.jobSearch',
  },
  '/interview-simulator': {
    agentId: 'arbetskonsulent',
    reason: 'Du övade nyss på intervjuer',
    reasonKey: 'aiTeam.suggestions.interview',
  },
  '/wellness': {
    agentId: 'arbetsterapeut',
    reason: 'Du checkade nyss in din hälsa',
    reasonKey: 'aiTeam.suggestions.wellness',
  },
  '/diary': {
    agentId: 'arbetsterapeut',
    reason: 'Du skrev nyss i dagboken',
    reasonKey: 'aiTeam.suggestions.diary',
  },
  '/career': {
    agentId: 'studievagledare',
    reason: 'Du utforskade nyss karriärvägar',
    reasonKey: 'aiTeam.suggestions.career',
  },
  '/skills-gap-analysis': {
    agentId: 'studievagledare',
    reason: 'Du analyserade nyss kompetensgap',
    reasonKey: 'aiTeam.suggestions.skillsGap',
  },
  '/interest-guide': {
    agentId: 'studievagledare',
    reason: 'Du utforskade nyss dina intressen',
    reasonKey: 'aiTeam.suggestions.interestGuide',
  },
  '/linkedin-optimizer': {
    agentId: 'digitalcoach',
    reason: 'Du arbetade nyss med LinkedIn',
    reasonKey: 'aiTeam.suggestions.linkedin',
  },
}

// Key for storing last visited route
const LAST_ROUTE_KEY = 'aiTeam_lastVisitedRoute'

export function useSuggestedAgent(): SuggestedAgent | null {
  const location = useLocation()

  // Save current route if it's a tool page
  useMemo(() => {
    const currentPath = location.pathname
    if (routeToAgent[currentPath]) {
      try {
        localStorage.setItem(LAST_ROUTE_KEY, currentPath)
      } catch {
        // Ignore storage errors
      }
    }
  }, [location.pathname])

  // Get suggestion based on last visited route (not current, since we're on AI Team page)
  return useMemo(() => {
    // If we're on the AI Team page, check last visited tool
    if (location.pathname === '/ai-team') {
      try {
        const lastRoute = localStorage.getItem(LAST_ROUTE_KEY)
        if (lastRoute && routeToAgent[lastRoute]) {
          return routeToAgent[lastRoute]
        }
      } catch {
        // Ignore storage errors
      }
    }

    // Check if current page matches a tool
    const suggestion = routeToAgent[location.pathname]
    if (suggestion) {
      return suggestion
    }

    return null
  }, [location.pathname])
}

// Track page visits from other pages
export function trackPageVisit(path: string) {
  if (routeToAgent[path]) {
    try {
      localStorage.setItem(LAST_ROUTE_KEY, path)
    } catch {
      // Ignore storage errors
    }
  }
}

export default useSuggestedAgent
