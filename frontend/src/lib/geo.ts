export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const r = 6371.0088
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dphi = toRad(lat2 - lat1)
  const dlambda = toRad(lng2 - lng1)
  const a =
    Math.sin(dphi / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dlambda / 2) ** 2
  return 2 * r * Math.asin(Math.sqrt(a))
}
