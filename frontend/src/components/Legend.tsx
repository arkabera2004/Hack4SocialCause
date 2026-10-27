import { LEVEL_ORDER, LEVEL_COLOR } from '../lib/risk'

interface LegendProps {
  showShelters: boolean
  onToggleShelters: (value: boolean) => void
}

export default function Legend({ showShelters, onToggleShelters }: LegendProps) {
  return (
    <div className="absolute bottom-3 left-3 z-[400] rounded-xl border border-card-border bg-white/95 p-3 text-sm shadow">
      <div className="mb-2 flex flex-col gap-1">
        {LEVEL_ORDER.map((level) => (
          <div key={level} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: LEVEL_COLOR[level] }} />
            <span>{level}</span>
          </div>
        ))}
      </div>
      <div className="mb-2 flex flex-col gap-1 border-t border-card-border pt-2 text-text-soft">
        <div className="flex items-center gap-2">
          <span aria-hidden className="h-3 w-3 rounded-full bg-blue-500" /> Glacial lake
        </div>
        <div className="flex items-center gap-2">
          <span aria-hidden className="h-3 w-3 rounded-full bg-slate-500" /> River gauge
        </div>
        <div className="flex items-center gap-2">
          <span aria-hidden className="h-3 w-3 bg-orange" style={{ clipPath: 'polygon(50% 0, 0 100%, 100% 100%)' }} /> Landslide zone
        </div>
        <div className="flex items-center gap-2">
          <span aria-hidden className="h-3 w-3 bg-green-700" /> Shelter
        </div>
      </div>
      <label className="flex items-center gap-2 border-t border-card-border pt-2">
        <input
          type="checkbox"
          checked={showShelters}
          onChange={(e) => onToggleShelters(e.target.checked)}
        />
        Show shelters
      </label>
    </div>
  )
}
