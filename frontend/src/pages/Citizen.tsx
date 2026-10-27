import { useEffect, useState } from 'react'
import { api, ApiError } from '../api/client'
import type { ActiveAlert, IncidentKind, RiskAt, Village } from '../api/types'
import { useLanguage } from '../hooks/useLanguage'
import { strings } from '../i18n/strings'
import { formatKm } from '../lib/format'
import { haversineKm } from '../lib/geo'
import LevelBadge from '../components/LevelBadge'

const VILLAGE_KEY = 'teestaguard-village'
const INCIDENT_KINDS: IncidentKind[] = ['flooding', 'landslide', 'road_blocked', 'other']

type LocationMode = { kind: 'gps'; lat: number; lng: number } | { kind: 'village'; villageId: string } | null

export default function Citizen() {
  const [lang, setLang] = useLanguage()
  const t = strings[lang]

  const [villages, setVillages] = useState<Village[]>([])
  const [location, setLocation] = useState<LocationMode>(null)
  const [risk, setRisk] = useState<RiskAt | null>(null)
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([])
  const [checkInDone, setCheckInDone] = useState<'safe' | 'need_help' | null>(null)
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false)

  const [incidentKind, setIncidentKind] = useState<IncidentKind>('flooding')
  const [incidentDesc, setIncidentDesc] = useState('')
  const [incidentPhoto, setIncidentPhoto] = useState<File | null>(null)
  const [incidentStatus, setIncidentStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => {
    api.villages().then(setVillages)
  }, [])

  useEffect(() => {
    let stored: string | null = null
    try {
      stored = localStorage.getItem(VILLAGE_KEY)
    } catch {
      // ignore
    }

    if (!navigator.geolocation) {
      if (stored) setLocation({ kind: 'village', villageId: stored })
      return
    }

    const timeoutId = setTimeout(() => {
      if (stored) setLocation({ kind: 'village', villageId: stored })
    }, 8000)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeoutId)
        const { latitude, longitude } = pos.coords
        if (villages.length > 0) {
          const nearest = villages.reduce((best, v) =>
            haversineKm(latitude, longitude, v.lat, v.lng) < haversineKm(latitude, longitude, best.lat, best.lng) ? v : best,
          )
          const distance = haversineKm(latitude, longitude, nearest.lat, nearest.lng)
          if (distance > 50) {
            if (stored) setLocation({ kind: 'village', villageId: stored })
            return
          }
        }
        setLocation({ kind: 'gps', lat: latitude, lng: longitude })
      },
      () => {
        clearTimeout(timeoutId)
        if (stored) setLocation({ kind: 'village', villageId: stored })
      },
      { timeout: 8000 },
    )

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [villages.length])

  useEffect(() => {
    if (!location) return
    if (location.kind === 'gps') {
      api.riskAt(location.lat, location.lng).then(setRisk)
    } else {
      const village = villages.find((v) => v.id === location.villageId)
      if (village) {
        api.riskAt(village.lat, village.lng).then(setRisk)
      }
    }
  }, [location, villages])

  useEffect(() => {
    if (risk) {
      api.activeAlerts(risk.village_id).then(setActiveAlerts).catch(() => setActiveAlerts([]))
    }
  }, [risk])

  function chooseVillage(villageId: string) {
    setLocation({ kind: 'village', villageId })
    try {
      localStorage.setItem(VILLAGE_KEY, villageId)
    } catch {
      // ignore
    }
  }

  async function submitCheckIn(status: 'safe' | 'need_help') {
    if (!risk || submittingCheckIn) return
    setSubmittingCheckIn(true)
    try {
      await api.createCheckIn(status, risk.lat, risk.lng)
      setCheckInDone(status)
    } catch {
      // keep the buttons available to retry
    } finally {
      setSubmittingCheckIn(false)
    }
  }

  async function submitIncident(e: React.FormEvent) {
    e.preventDefault()
    if (!risk) return
    setIncidentStatus('sending')
    try {
      const form = new FormData()
      form.append('kind', incidentKind)
      form.append('description', incidentDesc)
      form.append('lat', String(risk.lat))
      form.append('lng', String(risk.lng))
      if (incidentPhoto) form.append('photo', incidentPhoto)
      await api.createIncident(form)
      setIncidentStatus('success')
      setIncidentDesc('')
      setIncidentPhoto(null)
    } catch (err) {
      setIncidentStatus('error')
      if (err instanceof ApiError) {
        // keep user's input on error
      }
    }
  }

  const villageName = risk?.name ?? ''

  return (
    <div className="mx-auto min-h-screen max-w-md bg-paper px-4 pb-10 text-[18px] text-dark">
      <div className="flex items-center justify-between py-3">
        <h1 className="font-heading text-xl">{t.title}</h1>
        <label className="sr-only" htmlFor="lang-select">{t.langLabel}</label>
        <select
          id="lang-select"
          value={lang}
          onChange={(e) => setLang(e.target.value as typeof lang)}
          className="min-h-12 rounded-lg border border-card-border px-2"
        >
          <option value="en">EN</option>
          <option value="hi">हिन्दी</option>
          <option value="ne">नेपाली</option>
        </select>
      </div>

      {activeAlerts.length > 0 && (
        <div className="mb-3 rounded-xl bg-level-severe p-3 text-white">
          <p className="font-semibold">{t.alertBannerHeading}</p>
          <p>{activeAlerts[0].message[lang]}</p>
          <p className="text-xs opacity-80">{new Date(activeAlerts[0].created_at).toLocaleTimeString()}</p>
        </div>
      )}

      <div className="mb-3 flex items-center justify-between rounded-xl border border-card-border bg-white p-3">
        <span>{location?.kind === 'gps' ? t.usingLocation : t.showingVillage(villageName)}</span>
        <button
          type="button"
          onClick={() => setLocation(null)}
          className="min-h-12 text-sm font-medium text-teal underline"
        >
          {t.change}
        </button>
      </div>

      {!location && (
        <div className="mb-3 rounded-xl border border-card-border bg-white p-3">
          <label htmlFor="village-select" className="mb-1 block text-sm font-medium">{t.chooseVillage}</label>
          <select
            id="village-select"
            className="min-h-12 w-full rounded-lg border border-card-border p-2"
            defaultValue=""
            onChange={(e) => e.target.value && chooseVillage(e.target.value)}
          >
            <option value="" disabled>{t.chooseVillage}</option>
            {villages.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
      )}

      {risk && (
        <div className="mb-3 rounded-xl border border-card-border bg-white p-4">
          <h2 className="font-heading text-lg">{risk.name}</h2>
          <p className="mb-1 text-sm text-text-soft">{t.yourRiskNow}</p>
          <div className="mb-2 flex items-center gap-2">
            <LevelBadge level={risk.level} score={risk.score} text={risk.level_text[lang]} />
          </div>
          <p className="mb-1 text-sm font-semibold">{t.why}</p>
          <ul className="list-disc pl-5 text-sm text-text-soft">
            {risk.reasons.map((r) => <li key={r.code}>{r.text[lang]}</li>)}
          </ul>
        </div>
      )}

      {checkInDone ? (
        <div className="mb-3 rounded-xl border border-card-border bg-white p-4 text-center">
          <p>{checkInDone === 'safe' ? t.confirmationSafe : t.confirmationHelp}</p>
          <button
            type="button"
            onClick={() => setCheckInDone(null)}
            className="mt-2 min-h-12 rounded-lg bg-teal px-4 text-white"
          >
            {t.done}
          </button>
        </div>
      ) : (
        <div className="mb-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={!risk || submittingCheckIn}
            onClick={() => submitCheckIn('safe')}
            className="min-h-12 rounded-xl bg-level-low px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {t.imSafe}
          </button>
          <button
            type="button"
            disabled={!risk || submittingCheckIn}
            onClick={() => submitCheckIn('need_help')}
            className="min-h-12 rounded-xl bg-level-severe px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {t.needHelp}
          </button>
        </div>
      )}

      {risk && (
        <div className="mb-3">
          <h3 className="mb-2 text-sm font-semibold">{t.nearestShelters}</h3>
          <div className="space-y-2">
            {risk && <ShelterList lat={risk.lat} lng={risk.lng} t={t} />}
          </div>
        </div>
      )}

      <div className="mb-3 rounded-xl border border-card-border bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold">{t.reportIncident}</h3>
        <form onSubmit={submitIncident}>
          <label htmlFor="incident-kind" className="mb-1 block text-sm">{t.reportIncident}</label>
          <select
            id="incident-kind"
            value={incidentKind}
            onChange={(e) => setIncidentKind(e.target.value as IncidentKind)}
            className="mb-2 min-h-12 w-full rounded-lg border border-card-border p-2"
          >
            {INCIDENT_KINDS.map((k) => (
              <option key={k} value={k}>
                {k === 'flooding' ? t.kindFlooding : k === 'landslide' ? t.kindLandslide : k === 'road_blocked' ? t.kindRoadBlocked : t.kindOther}
              </option>
            ))}
          </select>

          <label htmlFor="incident-desc" className="mb-1 block text-sm">{t.description} ({incidentDesc.length}/500)</label>
          <textarea
            id="incident-desc"
            value={incidentDesc}
            maxLength={500}
            onChange={(e) => setIncidentDesc(e.target.value)}
            className="mb-2 w-full rounded-lg border border-card-border p-2"
            rows={3}
          />

          <label htmlFor="incident-photo" className="mb-1 block text-sm">{t.addPhoto}</label>
          <input
            id="incident-photo"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null
              if (file && file.size > 5 * 1024 * 1024) {
                setIncidentStatus('error')
                return
              }
              setIncidentPhoto(file)
            }}
            className="mb-2 w-full"
          />

          <button
            type="submit"
            disabled={incidentStatus === 'sending' || !risk}
            className="min-h-12 w-full rounded-lg bg-orange px-4 text-white disabled:opacity-50"
          >
            {t.submit}
          </button>
          {incidentStatus === 'success' && <p className="mt-2 text-sm text-level-low">{t.submitSuccess}</p>}
          {incidentStatus === 'error' && <p className="mt-2 text-sm text-level-severe">{t.submitError}</p>}
        </form>
      </div>

      <footer className="py-4 text-center text-sm text-text-soft">
        <a href="tel:112" className="font-semibold text-level-severe">{t.emergency}</a>
        <p className="mt-1">{t.prototypeNotice}</p>
      </footer>
    </div>
  )
}

function ShelterList({ lat, lng, t }: { lat: number; lng: number; t: typeof strings['en'] }) {
  const [shelters, setShelters] = useState<Awaited<ReturnType<typeof api.nearestShelters>>>([])
  useEffect(() => {
    api.nearestShelters(lat, lng, 3).then(setShelters)
  }, [lat, lng])

  return (
    <>
      {shelters.map((s) => (
        <div key={s.id} className="rounded-xl border border-card-border bg-white p-3">
          <p className="font-medium">{s.name}</p>
          <p className="text-sm text-text-soft">{formatKm(s.distance_km)} · {t.capacity} {s.capacity}</p>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block min-h-12 text-sm font-medium text-teal underline"
          >
            {t.directions}
          </a>
        </div>
      ))}
    </>
  )
}
