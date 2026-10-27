import L from 'leaflet'
import { useEffect, useMemo } from 'react'
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import type { Risk, RiskPoint, Shelter, Village } from '../api/types'
import { LEVEL_COLOR } from '../lib/risk'
import Legend from './Legend'

// Vite doesn't resolve Leaflet's default marker image paths; use inline divIcons instead.
function dotIcon(color: string, shape: 'circle' | 'triangle' = 'circle') {
  const clip = shape === 'triangle' ? 'clip-path:polygon(50% 0,0 100%,100% 100%);' : 'border-radius:50%;'
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;background:${color};${clip}border:1px solid white"></div>`,
    iconSize: [14, 14],
  })
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length > 0) {
      map.fitBounds(points, { padding: [40, 40] })
    }
  }, [map, points])
  return null
}

function radiusForPopulation(population: number): number {
  const scaled = 8 + Math.log10(Math.max(population, 1)) * 3.5
  return Math.max(8, Math.min(22, scaled))
}

interface RiskMapProps {
  villages: Village[]
  riskPoints: RiskPoint[]
  shelters: Shelter[]
  risk: Risk[]
  selectedVillageId: string | null
  onSelectVillage: (villageId: string) => void
  showShelters: boolean
  onToggleShelters: (value: boolean) => void
}

export default function RiskMap({
  villages, riskPoints, shelters, risk, selectedVillageId, onSelectVillage, showShelters, onToggleShelters,
}: RiskMapProps) {
  const riskByVillage = useMemo(() => new Map(risk.map((r) => [r.village_id, r])), [risk])

  const riverVillages = useMemo(
    () => villages.filter((v) => v.river_km !== null).sort((a, b) => (a.river_km! - b.river_km!)),
    [villages],
  )
  const lake = riskPoints.find((rp) => rp.kind === 'glacial_lake')
  const riverLine: [number, number][] = useMemo(() => {
    const points: [number, number][] = []
    if (lake) points.push([lake.lat, lake.lng])
    riverVillages.forEach((v) => points.push([v.lat, v.lng]))
    return points
  }, [lake, riverVillages])

  const allPoints: [number, number][] = useMemo(
    () => [...villages.map((v) => [v.lat, v.lng] as [number, number]), ...(lake ? [[lake.lat, lake.lng] as [number, number]] : [])],
    [villages, lake],
  )

  return (
    <div className="relative h-full w-full">
      <MapContainer center={[27.3, 88.5]} zoom={9} className="h-full w-full" zoomControl>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={allPoints} />

        {riverLine.length > 1 && (
          <Polyline positions={riverLine} pathOptions={{ color: '#1F7A78', weight: 3, opacity: 0.6 }}>
            <Tooltip sticky>Teesta (approximate)</Tooltip>
          </Polyline>
        )}

        {villages.map((v) => {
          const r = riskByVillage.get(v.id)
          const level = r?.level ?? 'Low'
          const isSevere = level === 'Severe'
          return (
            <CircleMarker
              key={v.id}
              center={[v.lat, v.lng]}
              radius={radiusForPopulation(v.population_est)}
              pathOptions={{
                color: '#fff',
                weight: 2,
                fillColor: LEVEL_COLOR[level],
                fillOpacity: 0.9,
                className: isSevere ? 'severe-pulse-ring' : undefined,
              }}
              eventHandlers={{ click: () => onSelectVillage(v.id) }}
            >
              <Tooltip>{v.name} — {level} {r ? `(${r.score})` : ''}</Tooltip>
              {selectedVillageId === v.id && <Popup>{v.name}</Popup>}
            </CircleMarker>
          )
        })}

        {riskPoints.map((rp) => {
          if (rp.kind === 'glacial_lake') {
            return (
              <Marker key={rp.id} position={[rp.lat, rp.lng]} icon={dotIcon('#2563eb')}>
                <Tooltip>{rp.name}</Tooltip>
              </Marker>
            )
          }
          if (rp.kind === 'river_gauge') {
            const danger = rp.current_level_m !== null && rp.danger_level_m !== null && rp.current_level_m >= rp.danger_level_m
            return (
              <Marker key={rp.id} position={[rp.lat, rp.lng]} icon={dotIcon(danger ? '#B3261E' : '#64748b')}>
                <Tooltip>{rp.name}: {rp.current_level_m?.toFixed(1)} m · danger {rp.danger_level_m?.toFixed(1)} m</Tooltip>
              </Marker>
            )
          }
          return (
            <Marker key={rp.id} position={[rp.lat, rp.lng]} icon={dotIcon('#B8860B', 'triangle')}>
              <Tooltip>{rp.name}</Tooltip>
            </Marker>
          )
        })}

        {showShelters && shelters.map((s) => (
          <Marker key={s.id} position={[s.lat, s.lng]} icon={dotIcon('#15803d')}>
            <Tooltip>{s.name} · capacity {s.capacity}</Tooltip>
          </Marker>
        ))}
      </MapContainer>
      <Legend showShelters={showShelters} onToggleShelters={onToggleShelters} />
    </div>
  )
}
