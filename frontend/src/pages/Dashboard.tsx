import { useEffect, useState } from 'react'
import { api } from '../api/client'
import ActivityFeed from '../components/ActivityFeed'
import AlertComposer from '../components/AlertComposer'
import DemoControls from '../components/DemoControls'
import ErrorBanner from '../components/ErrorBanner'
import Header from '../components/Header'
import KpiCards from '../components/KpiCards'
import RiskMap from '../components/RiskMap'
import Toast from '../components/Toast'
import VillagePanel from '../components/VillagePanel'
import { usePolling } from '../hooks/usePolling'
import type { Risk } from '../api/types'

type Tab = 'village' | 'alerts' | 'activity'

export default function Dashboard() {
  const villages = usePolling(api.villages, 15000)
  const riskPoints = usePolling(api.riskPoints, 15000)
  const shelters = usePolling(api.shelters, 15000)
  const risk = usePolling(api.risk, 15000)
  const stats = usePolling(api.stats, 15000)
  const alerts = usePolling(api.alerts, 5000)
  const checkIns = usePolling(api.checkIns, 5000)
  const incidents = usePolling(api.incidents, 5000)

  const [selectedVillageId, setSelectedVillageId] = useState<string | null>(null)
  const [showShelters, setShowShelters] = useState(false)
  const [tab, setTab] = useState<Tab>('village')
  const [composerVillageIds, setComposerVillageIds] = useState<string[] | null>(null)
  const [toast, setToast] = useState<{ message: string; kind: 'success' | 'error' } | null>(null)
  const [displayRisk, setDisplayRisk] = useState<Risk[] | null>(null)

  useEffect(() => {
    if (risk.data) setDisplayRisk(risk.data)
  }, [risk.data])

  useEffect(() => {
    document.documentElement.lang = 'en'
  }, [])

  function openComposerForVillage(villageId: string) {
    setComposerVillageIds([villageId])
  }

  function openComposerForHighSevere() {
    const ids = (displayRisk ?? []).filter((r) => r.level === 'High' || r.level === 'Severe').map((r) => r.village_id)
    setComposerVillageIds(ids)
  }

  function handleSent(recipients: number) {
    setComposerVillageIds(null)
    setToast({ message: `Alert sent to villages in 3 languages — reaches approx. ${recipients.toLocaleString('en-IN')} people`, kind: 'success' })
    alerts.refresh()
    stats.refresh()
  }

  function handleSurgeComplete(message: string, mostSevereVillageId: string | null) {
    setToast({ message, kind: 'success' })
    if (mostSevereVillageId) {
      setSelectedVillageId(mostSevereVillageId)
      setTab('village')
    }
    risk.refresh()
    stats.refresh()
  }

  function handleReset() {
    risk.refresh()
    stats.refresh()
    alerts.refresh()
    checkIns.refresh()
    incidents.refresh()
    setSelectedVillageId(null)
    setToast({ message: 'Demo reset', kind: 'success' })
  }

  const criticalError = villages.error ?? riskPoints.error ?? risk.error ?? stats.error

  return (
    <div className="flex h-screen flex-col bg-paper">
      <Header stats={stats.data} />
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="h-[45vh] w-full shrink-0 sm:h-[55vh] lg:h-full lg:w-[65%]">
          <RiskMap
            villages={villages.data ?? []}
            riskPoints={riskPoints.data ?? []}
            shelters={shelters.data ?? []}
            risk={displayRisk ?? risk.data ?? []}
            selectedVillageId={selectedVillageId}
            onSelectVillage={(id) => {
              setSelectedVillageId(id)
              setTab('village')
            }}
            showShelters={showShelters}
            onToggleShelters={setShowShelters}
          />
        </div>
        <div className="flex-1 overflow-y-auto border-l border-card-border bg-mist p-3 lg:w-[35%]">
          {criticalError && (
            <ErrorBanner
              message={`Couldn't reach the backend: ${criticalError.message}`}
              onRetry={() => {
                villages.refresh()
                riskPoints.refresh()
                shelters.refresh()
                risk.refresh()
                stats.refresh()
              }}
            />
          )}
          <KpiCards stats={stats.data} />

          <div role="tablist" className="mt-3 flex gap-1 border-b border-card-border text-sm">
            {(['village', 'alerts', 'activity'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`min-h-11 px-3 py-1.5 capitalize ${tab === t ? 'border-b-2 border-teal font-semibold text-dark' : 'text-text-soft hover:text-dark'}`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === 'village' && (
            <VillagePanel villageId={selectedVillageId} onSendAlert={openComposerForVillage} />
          )}
          {tab === 'alerts' && (
            <div className="p-2">
              <button
                type="button"
                onClick={openComposerForHighSevere}
                className="mb-3 min-h-11 w-full rounded-lg bg-orange px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
              >
                New alert
              </button>
              {(alerts.data ?? []).length === 0 ? (
                <p className="text-sm text-text-soft">No alerts sent yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {(alerts.data ?? []).map((a) => (
                    <li key={a.id} className="rounded-lg border border-card-border bg-white p-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium capitalize">{a.hazard}</span>
                        <span className="shrink-0 text-xs text-text-soft">{new Date(a.created_at).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-xs text-text-soft">
                        {a.village_ids.length} village(s) · approx. {a.recipients_est.toLocaleString('en-IN')} people
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {tab === 'activity' && <ActivityFeed checkIns={checkIns.data ?? []} incidents={incidents.data ?? []} />}

          <DemoControls
            villages={villages.data ?? []}
            currentRisk={risk.data ?? []}
            onDisplayRiskChange={setDisplayRisk}
            onSurgeComplete={handleSurgeComplete}
            onReset={handleReset}
            onError={(message) => setToast({ message, kind: 'error' })}
          />
        </div>
      </div>

      {composerVillageIds && (
        <AlertComposer
          risk={displayRisk ?? risk.data ?? []}
          initialVillageIds={composerVillageIds}
          onClose={() => setComposerVillageIds(null)}
          onSent={handleSent}
          onError={(message) => setToast({ message, kind: 'error' })}
        />
      )}
      {toast && <Toast message={toast.message} kind={toast.kind} onClose={() => setToast(null)} />}
    </div>
  )
}
