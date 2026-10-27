import { useEffect, useRef, useState } from 'react'
import { api, ApiError } from '../api/client'
import type { AlertPreview, Hazard, Risk } from '../api/types'
import LevelBadge from './LevelBadge'

const HAZARDS: { value: Hazard; label: string }[] = [
  { value: 'flood', label: 'Flood' },
  { value: 'glof', label: 'Glacial lake outburst' },
  { value: 'landslide', label: 'Landslide' },
]

const LANG_TABS: { key: 'en' | 'hi' | 'ne'; label: string }[] = [
  { key: 'en', label: 'English' },
  { key: 'hi', label: 'हिन्दी' },
  { key: 'ne', label: 'नेपाली' },
]

interface AlertComposerProps {
  risk: Risk[]
  initialVillageIds: string[]
  onClose: () => void
  onSent: (recipients: number) => void
  onError: (message: string) => void
}

export default function AlertComposer({ risk, initialVillageIds, onClose, onSent, onError }: AlertComposerProps) {
  const sorted = [...risk].sort((a, b) => b.score - a.score)
  const [selected, setSelected] = useState<Set<string>>(new Set(initialVillageIds))
  const [hazard, setHazard] = useState<Hazard>('flood')
  const [langTab, setLangTab] = useState<'en' | 'hi' | 'ne'>('en')
  const [preview, setPreview] = useState<AlertPreview | null>(null)
  const [sending, setSending] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ids = [...selected]
    if (ids.length === 0) {
      setPreview(null)
      return
    }
    const timer = setTimeout(() => {
      api.alertPreview(ids, hazard).then(setPreview).catch(() => setPreview(null))
    }, 300)
    return () => clearTimeout(timer)
  }, [selected, hazard])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>('button, input, select, [tabindex]:not([tabindex="-1"])')
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    dialogRef.current?.querySelector<HTMLElement>('button, input')?.focus()
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function toggleVillage(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSend() {
    setSending(true)
    try {
      const alert = await api.sendAlert([...selected], hazard)
      onSent(alert.recipients_est)
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Failed to send alert')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="New alert"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-4 shadow-xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg text-dark">New alert</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-text-soft hover:text-dark">
            ✕
          </button>
        </div>

        <label htmlFor="hazard-select" className="mb-1 block text-sm font-medium text-dark">Hazard</label>
        <select
          id="hazard-select"
          value={hazard}
          onChange={(e) => setHazard(e.target.value as Hazard)}
          className="mb-3 w-full rounded-lg border border-card-border p-2 text-sm"
        >
          {HAZARDS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
        </select>

        <p className="mb-1 text-sm font-medium text-dark">Villages</p>
        <div className="mb-3 max-h-40 overflow-y-auto rounded-lg border border-card-border p-2">
          {sorted.map((r) => (
            <label key={r.village_id} className="flex items-center justify-between gap-2 py-1 text-sm">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected.has(r.village_id)}
                  onChange={() => toggleVillage(r.village_id)}
                />
                {r.name}
              </span>
              <LevelBadge level={r.level} />
            </label>
          ))}
        </div>

        <div className="mb-2 flex gap-1 border-b border-card-border text-sm">
          {LANG_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setLangTab(t.key)}
              className={`px-2 py-1 ${langTab === t.key ? 'border-b-2 border-teal font-semibold text-dark' : 'text-text-soft'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="mb-3 min-h-16 rounded-lg bg-mist p-2 text-sm" lang={langTab}>
          {preview ? preview[langTab] : 'Select at least one village to preview the message.'}
        </p>
        {preview && <p className="mb-3 text-xs text-text-soft">Reaches approx. {preview.recipients_est.toLocaleString('en-IN')} people</p>}

        <button
          type="button"
          onClick={handleSend}
          disabled={sending || selected.size === 0}
          className="w-full rounded-lg bg-orange px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {sending ? 'Sending…' : 'Send alert'}
        </button>
      </div>
    </div>
  )
}
