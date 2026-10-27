import { useState } from 'react'
import { api } from '../api/client'
import RiskMap from '../components/RiskMap'
import { usePolling } from '../hooks/usePolling'

export default function Dashboard() {
  const villages = usePolling(api.villages, 15000)
  const riskPoints = usePolling(api.riskPoints, 15000)
  const shelters = usePolling(api.shelters, 15000)
  const risk = usePolling(api.risk, 15000)

  const [selectedVillageId, setSelectedVillageId] = useState<string | null>(null)
  const [showShelters, setShowShelters] = useState(false)

  return (
    <div className="flex h-screen flex-col bg-paper lg:flex-row">
      <div className="h-[60vh] w-full lg:h-full lg:w-[65%]">
        <RiskMap
          villages={villages.data ?? []}
          riskPoints={riskPoints.data ?? []}
          shelters={shelters.data ?? []}
          risk={risk.data ?? []}
          selectedVillageId={selectedVillageId}
          onSelectVillage={setSelectedVillageId}
          showShelters={showShelters}
          onToggleShelters={setShowShelters}
        />
      </div>
      <div className="flex-1 overflow-y-auto border-l border-card-border bg-mist p-4 lg:w-[35%]">
        <h1 className="font-heading text-xl text-dark">TeestaGuard</h1>
        <p className="text-sm text-text-soft">Teesta valley early warning · Sikkim</p>
      </div>
    </div>
  )
}
