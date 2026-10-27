import { useState } from 'react'
import { api } from '../api/client'
import AlertComposer from '../components/AlertComposer'
import Header from '../components/Header'
import KpiCards from '../components/KpiCards'
import RiskMap from '../components/RiskMap'
import Toast from '../components/Toast'
import VillagePanel from '../components/VillagePanel'
import { usePolling } from '../hooks/usePolling'

type Tab = 'village' | 'alerts' | 'activity'

export default function Dashboard() {
  const villages = usePolling(api.villages, 15000)
  const riskPoints = usePolling(api.riskPoints, 15000)
  const shelters = usePolling(api.shelters, 15000)
  const risk = usePolling(api.risk, 15000)
  const stats = usePolling(api.stats, 15000)
  const alerts = usePolling(api.alerts, 5000)

  const [selectedVillageId, setSelectedVillageId] = useState<string | null>(null)
  const [showShelters, setShowShelters] = useState(false)
  const [tab, setTab] = useState<Tab>('village')
  const [composerVillageIds, setComposerVillageIds] = useState<string[] | null>(null)
  const [toast, setToast] = useState<{ message: string; kind: 'success' | 'error' } | null>(null)

  function openComposerForVillage(villageId: string) {
    setComposerVillageIds([villageId])
  }

  function openComposerForHighSevere() {
    const ids = (risk.data ?? []).filter((r) => r.level === 'High' || r.level === 'Severe').map((r) => r.village_id)
    setComposerVillageIds(ids)
  }

  function handleSent(recipients: number) {
    setComposerVillageIds(null)
    setToast({ message: `Alert sent to villages in 3 languages — reaches approx. ${recipients.toLocaleString('en-IN')} people`, kind: 'success' })
    alerts.refresh()
    stats.refresh()
  }

  return (
    <div className="flex h-screen flex-col bg-paper">
      <Header stats={stats.data} />
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="h-[60vh] w-full lg:h-full lg:w-[65%]">
          <RiskMap
            villages={villages.data ?? []}
            riskPoints={riskPoints.data ?? []}
            shelters={shelters.data ?? []}
            risk={risk.data ?? []}
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
          <KpiCards stats={stats.data} />

          <div className="mt-3 flex gap-2 border-b border-card-border text-sm">
            {(['village', 'alerts', 'activity'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 capitalize ${tab === t ? 'border-b-2 border-teal font-semibold text-dark' : 'text-text-soft'}`}
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
                className="mb-3 w-full rounded-lg bg-orange px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                New alert
              </button>
              <ul className="space-y-2 text-sm">
                {(alerts.data ?? []).map((a) => (
                  <li key={a.id} className="rounded-lg border border-card-border bg-white p-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">{a.hazard}</span>
                      <span className="text-xs text-text-soft">{new Date(a.created_at).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-xs text-text-soft">
                      {a.village_ids.length} village(s) · approx. {a.recipients_est.toLocaleString('en-IN')} people
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {tab === 'activity' && <p className="p-4 text-sm text-text-soft">Activity tab — coming next.</p>}
        </div>
      </div>

      {composerVillageIds && (
        <AlertComposer
          risk={risk.data ?? []}
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
