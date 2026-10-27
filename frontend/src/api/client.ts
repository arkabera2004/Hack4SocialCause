// Fetch wrapper: base URL, JSON parsing, typed errors, admin header helper.
import type {
  ActiveAlert, Alert, AlertPreview, CheckIn, CheckInStatus, Hazard, Health,
  Incident, Risk, RiskAt, RiskDetail, RiskPoint, Shelter,
  ShelterWithDistance, Stats, Village,
} from './types'

const BASE_URL = import.meta.env.VITE_API_URL

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function adminHeaders(): HeadersInit {
  return { 'X-Admin-Token': import.meta.env.VITE_ADMIN_TOKEN }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(`${BASE_URL}${path}`, init)
  if (!resp.ok) {
    let message = resp.statusText
    try {
      const body = await resp.json()
      message = body.detail ?? message
    } catch {
      // response had no JSON body
    }
    throw new ApiError(resp.status, message)
  }
  if (resp.status === 204) return undefined as T
  return resp.json() as Promise<T>
}

export const api = {
  health: () => request<Health>('/api/health'),
  villages: () => request<Village[]>('/api/villages'),
  riskPoints: () => request<RiskPoint[]>('/api/riskpoints'),
  shelters: () => request<Shelter[]>('/api/shelters'),
  nearestShelters: (lat: number, lng: number, limit = 3) =>
    request<ShelterWithDistance[]>(`/api/shelters/nearest?lat=${lat}&lng=${lng}&limit=${limit}`),

  risk: () => request<Risk[]>('/api/risk'),
  riskDetail: (villageId: string) => request<RiskDetail>(`/api/risk/${villageId}`),
  riskAt: (lat: number, lng: number) => request<RiskAt>(`/api/risk/at?lat=${lat}&lng=${lng}`),

  alertPreview: (villageIds: string[], hazard: Hazard) =>
    request<AlertPreview>(`/api/alerts/preview?village_ids=${villageIds.join(',')}&hazard=${hazard}`),
  sendAlert: (villageIds: string[], hazard: Hazard) =>
    request<Alert>('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...adminHeaders() },
      body: JSON.stringify({ village_ids: villageIds, hazard }),
    }),
  alerts: () => request<Alert[]>('/api/alerts'),
  activeAlerts: (villageId: string) => request<ActiveAlert[]>(`/api/alerts/active?village_id=${villageId}`),

  createCheckIn: (status: CheckInStatus, lat: number, lng: number, note?: string) =>
    request<CheckIn>('/api/checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, lat, lng, note }),
    }),
  checkIns: () => request<CheckIn[]>('/api/checkins?limit=50'),

  createIncident: (form: FormData) =>
    request<Incident>('/api/incidents', { method: 'POST', body: form }),
  incidents: () => request<Incident[]>('/api/incidents?limit=50'),

  simulateSurge: (gaugeId: string, levelM: number) =>
    request<Risk[]>('/api/admin/simulate-surge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...adminHeaders() },
      body: JSON.stringify({ gauge_id: gaugeId, level_m: levelM }),
    }),
  resetDemo: (clearActivity: boolean) =>
    request<{ status: string }>('/api/admin/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...adminHeaders() },
      body: JSON.stringify({ clear_activity: clearActivity }),
    }),

  stats: () => request<Stats>('/api/stats'),
}
