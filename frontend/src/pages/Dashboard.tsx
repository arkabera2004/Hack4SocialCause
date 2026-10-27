import { useState } from 'react'
import { api } from '../api/client'
import Header from '../components/Header'
import KpiCards from '../components/KpiCards'
import RiskMap from '../components/RiskMap'
import VillagePanel from '../components/VillagePanel'
import { usePolling } from '../hooks/usePolling'

type Tab = 'village' | 'alerts' | 'activity'

export default function Dashboard() {
  const villages = usePolling(api.villages, 15000)
  const riskPoints = usePolling(api.riskPoints, 15000)
  const shelters = usePolling(api.shelters, 15000)
  const risk = usePolling(api.risk, 15000)
  const stats = usePolling(api.stats, 15000)

  const [selectedVillageId, setSelectedVillageId] = useState<string | null>(null)
  const [showShelters, setShowShelters] = useState(false)
  const [tab, setTab] = useState<Tab>('village')

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
            <VillagePanel villageId={selectedVillageId} onSendAlert={() => setTab('alerts')} />
          )}
          {tab === 'alerts' && <p className="p-4 text-sm text-text-soft">Alerts tab — coming next.</p>}
          {tab === 'activity' && <p className="p-4 text-sm text-text-soft">Activity tab — coming next.</p>}
        </div>
      </div>
    </div>
  )
}
