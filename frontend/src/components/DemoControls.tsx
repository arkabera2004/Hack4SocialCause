import { useState } from 'react'
import { api } from '../api/client'
import type { Risk, Village } from '../api/types'

const GAUGES = [
  { id: 'gauge-chungthang', label: 'Chungthang gauge', normal: 2.0, danger: 6.0 },
  { id: 'gauge-dikchu', label: 'Dikchu gauge', normal: 2.5, danger: 7.0 },
  { id: 'gauge-singtam', label: 'Singtam gauge', normal: 3.0, danger: 8.0 },
  { id: 'gauge-rangpo', label: 'Rangpo gauge', normal: 3.0, danger: 8.5 },
]

interface DemoControlsProps {
  villages: Village[]
  currentRisk: Risk[]
  onDisplayRiskChange: (risk: Risk[]) => void
  onSurgeComplete: (message: string, mostSevereVillageId: string | null) => void
  onReset: () => void
  onError: (message: string) => void
}

export default function DemoControls({
  villages, currentRisk, onDisplayRiskChange, onSurgeComplete, onReset, onError,
}: DemoControlsProps) {
  const [open, setOpen] = useState(false)
  const [gaugeId, setGaugeId] = useState(GAUGES[0].id)
  const gauge = GAUGES.find((g) => g.id === gaugeId) ?? GAUGES[0]
  const [levelM, setLevelM] = useState(gauge.danger + 1.5)
  const [busy, setBusy] = useState(false)

  function handleGaugeChange(id: string) {
    setGaugeId(id)
    const g = GAUGES.find((x) => x.id === id) ?? GAUGES[0]
    setLevelM(g.danger + 1.5)
  }

  async function simulateSurge() {
    setBusy(true)
    try {
      const newRisk = await api.simulateSurge(gaugeId, levelM)
      const newById = new Map(newRisk.map((r) => [r.village_id, r]))

      const order = [...villages].sort((a, b) => {
        const ra = a.river_km ?? Infinity
        const rb = b.river_km ?? Infinity
        return ra - rb
      })

      let display = [...currentRisk]
      for (const v of order) {
        const updated = newById.get(v.id)
        if (!updated) continue
        display = display.map((r) => (r.village_id === v.id ? updated : r))
        onDisplayRiskChange(display)
        await new Promise((resolve) => setTimeout(resolve, 250))
      }
      onDisplayRiskChange(newRisk)

      const affected = newRisk.filter((r) => r.level === 'High' || r.level === 'Severe').length
      const mostSevere = [...newRisk].sort((a, b) => b.score - a.score)[0]?.village_id ?? null
      onSurgeComplete(`Surge at ${gauge.label}: ${affected} villages now High or Severe`, mostSevere)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to simulate surge')
    } finally {
      setBusy(false)
    }
  }

  async function resetDemo() {
    if (!window.confirm('Reset the demo? This clears alerts, check-ins and incidents.')) return
    setBusy(true)
    try {
      await api.resetDemo(true)
      onReset()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to reset demo')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-card-border bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="min-h-11 w-full px-3 py-2 text-left text-sm font-semibold text-dark"
      >
        Demo controls {open ? '▾' : '▸'}
      </button>
      {open && (
        <div className="space-y-2 border-t border-card-border p-3 text-sm">
          <label htmlFor="gauge-select" className="block text-xs font-medium text-dark">Gauge</label>
          <select
            id="gauge-select"
            value={gaugeId}
            onChange={(e) => handleGaugeChange(e.target.value)}
            disabled={busy}
            className="min-h-11 w-full rounded-lg border border-card-border p-1.5 disabled:opacity-50"
          >
            {GAUGES.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>

          <label htmlFor="level-slider" className="block text-xs font-medium text-dark">
            Level: {levelM.toFixed(1)} m
          </label>
          <input
            id="level-slider"
            type="range"
            min={gauge.normal}
            max={gauge.danger + 3}
            step={0.1}
            value={levelM}
            onChange={(e) => setLevelM(Number(e.target.value))}
            disabled={busy}
            className="h-11 w-full disabled:opacity-50"
          />

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={simulateSurge}
              disabled={busy || villages.length === 0}
              className="min-h-11 flex-1 rounded-lg bg-orange px-3 py-1.5 text-white transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
            >
              {busy ? 'Working…' : 'Simulate surge'}
            </button>
            <button
              type="button"
              onClick={resetDemo}
              disabled={busy}
              className="min-h-11 flex-1 rounded-lg border border-card-border px-3 py-1.5 text-dark hover:bg-mist disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
            >
              Reset demo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
