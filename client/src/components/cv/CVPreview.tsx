/**
 * CV Preview Component - Premium Design System
 *
 * Each template has a distinct visual personality:
 * - Minimal: Swiss precision, Helvetica-style, extreme whitespace
 * - Executive: Classic elegance, serif typography, gold accents
 * - Creative: Bold asymmetry, color blocking, design-forward
 * - Nordic: Light, airy, Scandinavian minimalism
 * - Modern: Dark, tech-forward, Vercel/Linear inspired
 * - Centered: Elegant gradient, balanced, professional
 */

import { Sparkles } from '@/components/ui/icons'
import type { CVData } from '@/services/supabaseApi'
import {
  MinimalTemplate,
  ExecutiveTemplate,
  ModernTemplate,
  CreativeTemplate,
  NordicTemplate,
  CenteredTemplate,
} from './templates'

interface CVPreviewProps {
  data: CVData
}

// Filtrera bort halvtomma entries så preview matchar PDF — annars syns
// "• -" eller bara datum för en oifylld erfarenhet.
function sanitize(data: CVData): CVData {
  return {
    ...data,
    workExperience: (data.workExperience || []).filter(
      (e) => (e?.title?.trim() || e?.company?.trim()),
    ),
    education: (data.education || []).filter(
      (e) => (e?.degree?.trim() || e?.school?.trim()),
    ),
    skills: (data.skills || []).filter((s) => {
      const name = typeof s === 'string' ? s : s?.name
      return !!name?.trim()
    }),
    languages: (data.languages || []).filter((l) => {
      const name = (l as { language?: string; name?: string })?.language || (l as { name?: string })?.name
      return !!name?.trim()
    }),
    certificates: (data.certificates || []).filter((c) => c?.name?.trim()),
    links: (data.links || []).filter((l) => l?.url?.trim()),
  }
}

export function CVPreview({ data: rawData }: CVPreviewProps) {
  const data = sanitize(rawData)
  const fullName = `${data.firstName} ${data.lastName}`.trim() || 'Ditt Namn'

  // Check for content
  const hasContent = !!(
    data.firstName ||
    data.lastName ||
    data.email ||
    data.phone ||
    data.summary ||
    (data.workExperience && data.workExperience.length > 0) ||
    (data.education && data.education.length > 0) ||
    (data.skills && data.skills.length > 0)
  )

  // Empty state
  if (!hasContent) {
    return (
      <div
        className="cv-preview"
        style={{
          minHeight: '500px',
          background: 'linear-gradient(180deg, #FAFAFA 0%, #F5F5F5 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px',
          textAlign: 'center',
          fontFamily: "'Inter', -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            background: '#E5E5E5',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
          }}
        >
          <Sparkles style={{ width: '40px', height: '40px', color: '#A3A3A3' }} />
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#525252', marginBottom: '8px' }}>
          Förhandsvisning
        </h3>
        <p style={{ fontSize: '15px', color: '#A3A3A3', maxWidth: '280px' }}>
          Börja fylla i dina uppgifter för att se hur ditt CV kommer att se ut
        </p>
      </div>
    )
  }

  // Route to correct template
  switch (data.template) {
    case 'minimal':
      return <MinimalTemplate data={data} fullName={fullName} />
    case 'executive':
      return <ExecutiveTemplate data={data} fullName={fullName} />
    case 'creative':
      return <CreativeTemplate data={data} fullName={fullName} />
    case 'nordic':
      return <NordicTemplate data={data} fullName={fullName} />
    case 'centered':
      return <CenteredTemplate data={data} fullName={fullName} />
    case 'sidebar':
    default:
      return <ModernTemplate data={data} fullName={fullName} />
  }
}

export default CVPreview
