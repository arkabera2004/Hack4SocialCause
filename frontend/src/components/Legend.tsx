import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { LEVEL_ORDER, LEVEL_COLOR } from '../lib/risk'

interface LegendProps {
  showShelters: boolean
  onToggleShelters: (value: boolean) => void
}

export default function Legend({ showShelters, onToggleShelters }: LegendProps) {
  const [open, setOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 640 : true))

  return (
    <div className="absolute bottom-3 left-3 z-[400] max-h-[calc(100%-1.5rem)] max-w-[calc(100%-1.5rem)] overflow-y-auto rounded-xl border border-card-border bg-white/95 text-sm shadow">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2 font-medium text-dark"
      >
        Legend
        {open ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>
      {open && (
        <div className="px-3 pb-3">
          <div className="mb-2 flex flex-col gap-1">
            {LEVEL_ORDER.map((level) => (
              <div key={level} className="flex items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: LEVEL_COLOR[level] }} />
                <span>{level}</span>
              </div>
            ))}
          </div>
          <div className="mb-2 flex flex-col gap-1 border-t border-card-border pt-2 text-text-soft">
            <div className="flex items-center gap-2">
              <span aria-hidden className="h-3 w-3 shrink-0 rounded-full bg-blue-500" /> Glacial lake
            </div>
            <div className="flex items-center gap-2">
              <span aria-hidden className="h-3 w-3 shrink-0 rounded-full bg-slate-500" /> River gauge
            </div>
            <div className="flex items-center gap-2">
              <span aria-hidden className="h-3 w-3 shrink-0 bg-orange" style={{ clipPath: 'polygon(50% 0, 0 100%, 100% 100%)' }} /> Landslide zone
            </div>
            <div className="flex items-center gap-2">
              <span aria-hidden className="h-3 w-3 shrink-0 bg-green-700" /> Shelter
            </div>
          </div>
          <label className="flex min-h-11 cursor-pointer items-center gap-2 border-t border-card-border pt-2">
            <input
              type="checkbox"
              checked={showShelters}
              onChange={(e) => onToggleShelters(e.target.checked)}
              className="h-4 w-4 shrink-0"
            />
            Show shelters
          </label>
        </div>
      )}
    </div>
  )
}
