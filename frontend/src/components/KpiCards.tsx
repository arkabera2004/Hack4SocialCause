import { ShieldAlert, ShieldX, Users, Megaphone, CheckCircle2, AlertCircle } from 'lucide-react'
import type { Stats } from '../api/types'
import { formatNumber } from '../lib/format'

function Card({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-card-border bg-white p-2.5 shadow-sm sm:p-3">
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-lg font-semibold tabular-nums text-dark">{value}</div>
        <div className="text-xs leading-tight text-text-soft">{label}</div>
      </div>
    </div>
  )
}

export default function KpiCards({ stats }: { stats: Stats | null }) {
  if (!stats) {
    return <div className="grid grid-cols-2 gap-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-card-border/40" />)}</div>
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <Card icon={<ShieldAlert className="text-level-high" size={20} />} label="Villages at High" value={String(stats.villages_high)} />
        <Card icon={<ShieldX className="text-level-severe" size={20} />} label="Villages at Severe" value={String(stats.villages_severe)} />
        <Card icon={<Users className="text-teal" size={20} />} label="People in High/Severe (approx.)" value={formatNumber(stats.people_at_high_or_severe)} />
        <Card icon={<Megaphone className="text-orange" size={20} />} label="Alerts sent" value={String(stats.alerts_sent)} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-card-border bg-white p-2 text-sm text-text-soft">
        <span className="flex items-center gap-1"><CheckCircle2 size={16} className="text-level-low" /> Safe: {stats.checkins_safe}</span>
        <span className="flex items-center gap-1"><AlertCircle size={16} className="text-level-severe" /> Needs help: {stats.checkins_need_help}</span>
      </div>
    </div>
  )
}
