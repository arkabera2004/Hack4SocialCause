import { AlertCircle, CheckCircle2 } from 'lucide-react'
import type { CheckIn, Incident } from '../api/types'
import { relativeTime } from '../lib/format'

interface ActivityFeedProps {
  checkIns: CheckIn[]
  incidents: Incident[]
}

type Item =
  | { kind: 'checkin'; at: string; data: CheckIn }
  | { kind: 'incident'; at: string; data: Incident }

export default function ActivityFeed({ checkIns, incidents }: ActivityFeedProps) {
  const items: Item[] = [
    ...checkIns.map((c) => ({ kind: 'checkin' as const, at: c.created_at, data: c })),
    ...incidents.map((i) => ({ kind: 'incident' as const, at: i.created_at, data: i })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())

  if (items.length === 0) {
    return <p className="p-4 text-sm text-text-soft">No activity yet.</p>
  }

  return (
    <ul className="space-y-2 p-2 text-sm">
      {items.map((item) => (
        <li key={`${item.kind}-${item.data.id}`} className="rounded-lg border border-card-border bg-white p-2">
          {item.kind === 'checkin' ? (
            <div className="flex items-center gap-2">
              {item.data.status === 'safe' ? (
                <CheckCircle2 size={16} className="text-level-low" />
              ) : (
                <AlertCircle size={16} className="text-level-severe" />
              )}
              <span className={item.data.status === 'safe' ? 'text-level-low' : 'text-level-severe'}>
                {item.data.status === 'safe' ? 'Safe' : 'Needs help'}
              </span>
              <span className="text-text-soft">· {item.data.village_name}</span>
              <span className="ml-auto text-xs text-text-soft">{relativeTime(item.at)}</span>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium capitalize">{item.data.kind.replace('_', ' ')}</span>
                <span className="ml-auto text-xs text-text-soft">{relativeTime(item.at)}</span>
              </div>
              <p className="text-text-soft">{item.data.description}</p>
              {item.data.photo_url && (
                <img
                  src={`${import.meta.env.VITE_API_URL}${item.data.photo_url}`}
                  alt="Incident report"
                  className="mt-1 h-20 w-20 rounded-lg object-cover"
                />
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
