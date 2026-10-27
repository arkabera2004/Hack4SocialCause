import type { Level } from '../api/types'

export const LEVEL_ORDER: Level[] = ['Low', 'Moderate', 'High', 'Severe']

export const LEVEL_COLOR: Record<Level, string> = {
  Low: '#2E7D32',
  Moderate: '#B8860B',
  High: '#E06A1B',
  Severe: '#B3261E',
}

export function levelRank(level: Level): number {
  return LEVEL_ORDER.indexOf(level)
}
