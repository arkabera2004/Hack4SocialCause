import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts'
import { api } from '../api/client'
import type { RiskDetail } from '../api/types'
import { formatKm } from '../lib/format'
import LevelBadge from './LevelBadge'

function ComponentBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-1">
      <div className="flex justify-between text-xs text-text-soft">
        <span>{label}</span>
        <span>{Math.round(value)}</span>
      </div>
      <div className="h-2 rounded-full bg-mist">
        <div className="h-2 rounded-full bg-teal" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  )
}

interface VillagePanelProps {
  villageId: string | null
  onSendAlert: (villageId: string) => void
}

export default function VillagePanel({ villageId, onSendAlert }: VillagePanelProps) {
  const [detail, setDetail] = useState<RiskDetail | null>(null)

  useEffect(() => {
    if (!villageId) {
      setDetail(null)
      return
    }
    let cancelled = false
    api.riskDetail(villageId).then((d) => {
      if (!cancelled) setDetail(d)
    })
    return () => {
      cancelled = true
    }
  }, [villageId])

  if (!villageId) {
    return <p className="p-4 text-sm text-text-soft">Select a village on the map.</p>
  }
  if (!detail) {
    return <div className="h-40 animate-pulse rounded-xl bg-card-border/40" />
  }

  const chartData = detail.rainfall_series.map((b) => ({ label: `+${b.hour_offset}h`, mm: b.mm }))

  return (
    <div className="p-2">
      <h2 className="font-heading text-lg text-dark">{detail.name}</h2>
      <p className="text-sm text-text-soft">{detail.district}</p>
      <div className="my-2 flex items-center gap-3">
        <span className="font-heading text-5xl text-dark">{detail.score}</span>
        <LevelBadge level={detail.level} />
      </div>

      <h3 className="mt-3 text-sm font-semibold text-dark">Why this score</h3>
      <ul className="list-disc pl-5 text-sm text-text-soft">
        {detail.reasons.map((r) => <li key={r.code}>{r.text.en}</li>)}
      </ul>

      <h3 className="mt-3 text-sm font-semibold text-dark">Components</h3>
      <ComponentBar label="Rain" value={detail.components.rain} />
      <ComponentBar label="River" value={detail.components.river} />
      <ComponentBar label="Glacial lake" value={detail.components.glof} />
      <ComponentBar label="Landslide" value={detail.components.landslide} />

      <h3 className="mt-3 text-sm font-semibold text-dark">Rainfall forecast</h3>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} label={{ value: 'mm', angle: -90, position: 'insideLeft', fontSize: 10 }} />
            <RTooltip />
            <Bar dataKey="mm" fill="#1F7A78" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h3 className="mt-3 text-sm font-semibold text-dark">Nearest shelters</h3>
      <ul className="text-sm text-text-soft">
        {detail.nearest_shelters.map((s) => (
          <li key={s.id}>{s.name} — {formatKm(s.distance_km)}</li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onSendAlert(detail.village_id)}
        className="mt-4 w-full rounded-lg bg-orange px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Send alert for this village
      </button>
    </div>
  )
}
