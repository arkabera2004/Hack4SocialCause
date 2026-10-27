// TypeScript types mirroring backend/app/schemas.py exactly.

export type Lang = 'en' | 'hi' | 'ne'
export type Hazard = 'flood' | 'glof' | 'landslide'
export type Level = 'Low' | 'Moderate' | 'High' | 'Severe'
export type CheckInStatus = 'safe' | 'need_help'
export type IncidentKind = 'flooding' | 'landslide' | 'road_blocked' | 'other'

export interface LangText {
  en: string
  hi: string
  ne: string
}

export interface Village {
  id: string
  name: string
  district: string
  lat: number
  lng: number
  population_est: number
  river_km: number | null
  slope_class: 'low' | 'medium' | 'high'
}

export interface RiskPoint {
  id: string
  name: string
  kind: 'glacial_lake' | 'river_gauge' | 'landslide_zone'
  lat: number
  lng: number
  river_km: number | null
  hazard: number | null
  normal_level_m: number | null
  danger_level_m: number | null
  current_level_m: number | null
}

export interface Shelter {
  id: string
  name: string
  kind: 'school' | 'community_hall' | 'monastery' | 'govt_building'
  lat: number
  lng: number
  capacity: number
}

export interface ShelterWithDistance extends Shelter {
  distance_km: number
}

export interface Reason {
  code: string
  params: Record<string, unknown>
  text: LangText
}

export interface RiskComponents {
  rain: number
  river: number
  glof: number
  landslide: number
}

export interface Risk {
  village_id: string
  name: string
  district: string
  lat: number
  lng: number
  population_est: number
  river_km: number | null
  score: number
  level: Level
  level_text: LangText
  components: RiskComponents
  reasons: Reason[]
  rain_24h_mm: number
  rain_72h_mm: number
}

export interface RainfallBucket {
  hour_offset: number
  mm: number
}

export interface RiskDetail extends Risk {
  rainfall_series: RainfallBucket[]
  nearest_shelters: ShelterWithDistance[]
}

export interface RiskAt extends Risk {
  distance_to_village_km: number
}

export interface AlertPreview {
  en: string
  hi: string
  ne: string
  recipients_est: number
  level: Level
}

export interface Alert {
  id: number
  created_at: string
  hazard: Hazard
  level: Level
  village_ids: string[]
  message_en: string
  message_hi: string
  message_ne: string
  recipients_est: number
  status: string
}

export interface ActiveAlert {
  id: number
  created_at: string
  hazard: Hazard
  level: Level
  message: LangText
}

export interface CheckIn {
  id: number
  created_at: string
  status: CheckInStatus
  lat: number
  lng: number
  village_id: string
  village_name: string
  note: string | null
}

export interface Incident {
  id: number
  created_at: string
  kind: IncidentKind
  description: string
  lat: number
  lng: number
  village_id: string
  photo_url: string | null
}

export interface Health {
  status: string
  weather_source: 'live' | 'sample'
  weather_fetched_at: string | null
  version: string
}

export interface Stats {
  villages_total: number
  villages_high: number
  villages_severe: number
  people_at_high_or_severe: number
  alerts_sent: number
  checkins_safe: number
  checkins_need_help: number
  incidents_total: number
  weather_source: 'live' | 'sample'
}
