export function formatNumber(n: number): string {
  return n.toLocaleString('en-IN')
}

export function formatKm(km: number): string {
  return `${km.toFixed(1)} km`
}

export function relativeTime(isoDate: string): string {
  const seconds = Math.round((Date.now() - new Date(isoDate).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}
