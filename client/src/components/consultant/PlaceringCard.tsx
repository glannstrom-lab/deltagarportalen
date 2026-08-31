/**
 * PlaceringCard — en rad i platslistan (PlatserTab).
 * Portat i idé från WorkplaceCard (avaktiverad STA-modul) men visar de fyra
 * matchningsdimensionerna i stället för AF-status.
 */

import { Button } from '@/components/ui/Button'
import {
  AlertTriangle,
  Building2,
  Calendar,
  ClipboardList,
  Dumbbell,
  Edit,
  Thermometer,
  Trash2,
  Volume2,
} from '@/components/ui/icons'
import { placeringarApi, type Placering } from '@/services/placeringarApi'
import {
  NIVA_LABEL,
  PLACERING_STATUS_KLASS,
  PLACERING_STATUS_LABEL,
  PLACERING_TYP_LABEL,
  TEMPERATUR_LABEL,
} from './placeringLabels'

interface Props {
  placering: Placering
  deltagarNamn: string
  onEdit: () => void
  onUppfoljning: () => void
  onDelete: () => void
}

export function PlaceringCard({ placering: p, deltagarNamn, onEdit, onUppfoljning, onDelete }: Props) {
  const fysiskaKrav: string[] = []
  if (p.lifting_required) fysiskaKrav.push('Tunga lyft')
  if (p.standing_required) fysiskaKrav.push('Stå upp')
  if (p.shift_work) fysiskaKrav.push('Skift')
  if (p.temperature_demands && p.temperature_demands !== 'normal') {
    fysiskaKrav.push(TEMPERATUR_LABEL[p.temperature_demands])
  }
  if (p.noise_level && p.noise_level !== 'lag') {
    fysiskaKrav.push(`Buller: ${NIVA_LABEL[p.noise_level]}`)
  }

  // KRITISK, inte jämbördig med övriga dimensioner (Mikael, uppdragssvar
  // 2026-08-31): den vanligaste orsaken till att en placering spricker.
  // Lyfts som egen, synlig varning — inte en rad text bland andra.
  const handledningsobalans = placeringarApi.harHandledningsobalans(p)

  return (
    <div className="rounded-xl border border-stone-200 p-4 space-y-3">
      {handledningsobalans && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>
            <strong className="block">Handledningsobalans</strong>
            Arbetsplatsen har låg kapacitet att handleda, men deltagaren behöver mycket stöd.
            Vanligaste orsaken till att en placering spricker — se över detta innan platsen startar.
          </span>
        </div>
      )}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
            <Building2 size={16} className="text-stone-600" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-stone-900">{p.company_name}</h4>
            <p className="text-xs text-stone-500">
              {deltagarNamn} · {PLACERING_TYP_LABEL[p.placement_type]}
              {p.occupation && <> · {p.occupation}</>}
            </p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${PLACERING_STATUS_KLASS[p.status]}`}>
          {PLACERING_STATUS_LABEL[p.status]}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-stone-600">
        {(p.start_date || p.end_date) && (
          <span className="inline-flex items-center gap-1">
            <Calendar size={12} />
            {p.start_date ?? '—'} – {p.end_date ?? 'pågår'}
          </span>
        )}
        {p.hours_per_week != null && (
          <span className="inline-flex items-center gap-1">
            <ClipboardList size={12} />
            {p.hours_per_week} tim/vecka
            {p.can_ramp_up && <span className="text-emerald-700"> · kan trappas upp</span>}
          </span>
        )}
        {p.participant_supervision_need && (
          <span className="inline-flex items-center gap-1">
            Handledningsbehov: {NIVA_LABEL[p.participant_supervision_need]}
          </span>
        )}
      </div>

      {fysiskaKrav.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {fysiskaKrav.map((k) => (
            <span
              key={k}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px]"
            >
              {k === 'Tunga lyft' ? <Dumbbell size={10} /> : k.startsWith('Buller') ? <Volume2 size={10} /> : <Thermometer size={10} />}
              {k}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1 flex-wrap">
        <Button size="sm" variant="outline" leftIcon={<ClipboardList size={13} />} onClick={onUppfoljning}>
          Uppföljning
        </Button>
        <Button size="sm" variant="ghost" leftIcon={<Edit size={13} />} onClick={onEdit}>
          Redigera
        </Button>
        <Button
          size="sm"
          variant="ghost"
          leftIcon={<Trash2 size={13} />}
          onClick={onDelete}
          className="text-rose-700 hover:bg-rose-50"
        >
          Ta bort
        </Button>
      </div>
    </div>
  )
}
