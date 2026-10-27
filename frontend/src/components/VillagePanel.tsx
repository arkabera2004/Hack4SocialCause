import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts'
import { api, ApiError } from '../api/client'
import type { RiskDetail } from '../api/types'
import { formatKm } from '../lib/format'
import ErrorBanner from './ErrorBanner'
import LevelBadge from './LevelBadge'

function ComponentBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-1">
      <div className="flex justify-between text-xs text-text-soft">
        <span>{label}</span>
        <span>{Math.round(value)}</span>
      </div>
      <div className="h-2 rounded-full bg-mist">
        <div className="h-2 rounded-full bg-teal transition-[width] duration-300" style={{ width: `${Math.min(100, value)}%` }} />
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
  const [error, setError] = useState<string | null>(null)
  const [loadToken, setLoadToken] = useState(0)

  useEffect(() => {
    if (!villageId) {
      setDetail(null)
      setError(null)
      return
    }
    let cancelled = false
    setDetail(null)
    setError(null)
    api.riskDetail(villageId)
      .then((d) => {
        if (!cancelled) setDetail(d)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load village details')
      })
    return () => {
      cancelled = true
    }
  }, [villageId, loadToken])

  if (!villageId) {
    return <p className="p-4 text-sm text-text-soft">Select a village on the map.</p>
  }
  if (error) {
    return (
      <div className="p-2">
        <ErrorBanner message={error} onRetry={() => setLoadToken((t) => t + 1)} />
      </div>
    )
  }
  if (!detail) {
    return (
      <div className="space-y-2 p-2">
        <div className="h-8 w-2/3 animate-pulse rounded-lg bg-card-border/40" />
        <div className="h-16 animate-pulse rounded-xl bg-card-border/40" />
        <div className="h-24 animate-pulse rounded-xl bg-card-border/40" />
        <div className="h-40 animate-pulse rounded-xl bg-card-border/40" />
      </div>
    )
  }

  const chartData = detail.rainfall_series.map((b) => ({ label: `+${b.hour_offset}h`, mm: b.mm }))

  return (
    <div className="p-2">
      <h2 className="font-heading text-lg text-dark">{detail.name}</h2>
      <p className="text-sm text-text-soft">{detail.district}</p>
      <div className="my-2 flex flex-wrap items-center gap-3">
        <span className="font-heading text-4xl text-dark sm:text-5xl">{detail.score}</span>
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
      <div className="h-40 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10 }} width={32} label={{ value: 'mm', angle: -90, position: 'insideLeft', fontSize: 10 }} />
            <RTooltip />
            <Bar dataKey="mm" fill="#1F7A78" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h3 className="mt-3 text-sm font-semibold text-dark">Nearest shelters</h3>
      {detail.nearest_shelters.length === 0 ? (
        <p className="text-sm text-text-soft">No shelters found nearby.</p>
      ) : (
        <ul className="text-sm text-text-soft">
          {detail.nearest_shelters.map((s) => (
            <li key={s.id}>{s.name} — {formatKm(s.distance_km)}</li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => onSendAlert(detail.village_id)}
        className="mt-4 min-h-11 w-full rounded-lg bg-orange px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
      >
        Send alert for this village
      </button>
    </div>
  )
}
