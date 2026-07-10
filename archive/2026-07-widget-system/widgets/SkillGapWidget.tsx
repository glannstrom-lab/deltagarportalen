import { BarChart3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { useKarriarWidgetData } from './KarriarDataContext'
import type { WidgetProps } from './types'

function milestoneLabel(percentage: number): string {
  if (percentage >= 80) return 'Mycket nära målet'
  if (percentage >= 60) return 'Nära målet'
  if (percentage >= 40) return 'Bra framsteg'
  return 'Långt kvar — fortsätt utvecklas'
}

export default function SkillGapWidget({
  id,
  size,
  allowedSizes,
  onSizeChange,
  editMode,
  onHide,
}: WidgetProps) {
  const analysis = useKarriarWidgetData('latestSkillsAnalysis')
  const isEmpty = !analysis

  // Extract top-3 missing skills from JSONB skills_comparison
  const missingSkills: string[] = (() => {
    if (!analysis?.skills_comparison) return []
    const sc = analysis.skills_comparison as Record<string, unknown>
    const missing = sc.missing
    if (Array.isArray(missing)) {
      return (missing as string[]).slice(0, 3)
    }
    return []
  })()

  return (
    <Widget
      id={id}
      size={size}
      allowedSizes={allowedSizes}
      onSizeChange={onSizeChange}
      editMode={editMode}
      onHide={onHide}
    >
      <Widget.Header icon={BarChart3} title="Kompetensgap" />
      <Widget.Body>
        {isEmpty ? (
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-1">
              Ingen analys gjord
            </p>
            <p className="text-[12px] text-[var(--stone-700)] m-0">
              Ta reda på vilka kompetenser du behöver för din drömroll
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[12px] text-[var(--stone-700)] m-0 mb-1">
              {analysis!.dream_job}
            </p>
            {/* Qualitative milestone label — NEVER raw match_percentage */}
            <p className="text-[22px] font-bold text-[var(--stone-900)] leading-tight m-0 mb-2">
              {milestoneLabel(analysis!.match_percentage)}
            </p>
            {missingSkills.length > 0 && (
              <ul className="list-none m-0 p-0 flex flex-col gap-1">
                {missingSkills.map(skill => (
                  <li key={skill} className="text-[12px] text-[var(--stone-700)] flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-[var(--c-text)] flex-shrink-0" />
                    {skill}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Widget.Body>
      {(size === 'M' || size === 'L') && (
        <Widget.Footer>
          <Link
            to="/skills-gap-analysis"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            {isEmpty ? 'Gör analys' : 'Se full analys'}
          </Link>
        </Widget.Footer>
      )}
    </Widget>
  )
}
