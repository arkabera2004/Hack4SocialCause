import type { Level } from '../api/types'
import { LEVEL_COLOR } from '../lib/risk'

export default function LevelBadge({ level, score, text }: { level: Level; score?: number; text?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium text-white"
      style={{ backgroundColor: LEVEL_COLOR[level] }}
    >
      {text ?? level}
      {score !== undefined && <span className="opacity-80">({score})</span>}
    </span>
  )
}
