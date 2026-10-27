import { Link } from 'react-router-dom'
import type { Stats } from '../api/types'

export default function Header({ stats }: { stats: Stats | null }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-card-border bg-dark px-3 py-2 text-paper sm:px-4">
      <div className="min-w-0">
        <h1 className="font-heading text-lg leading-tight">TeestaGuard</h1>
        <p className="hidden text-xs text-paper/70 sm:block">Teesta valley early warning · Sikkim</p>
      </div>
      <nav className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-sm sm:gap-x-4">
        <Link to="/" className="min-h-11 py-1 hover:underline">Dashboard</Link>
        <Link to="/citizen" className="min-h-11 py-1 hover:underline">Citizen app</Link>
        <span
          className="rounded-full bg-amber-500/90 px-2 py-0.5 text-xs font-medium text-dark"
          title="Village data is approximate; gauge readings are simulated"
        >
          Sample data
        </span>
        {stats && (
          <span className="rounded-full bg-teal/30 px-2 py-0.5 text-xs whitespace-nowrap">
            {stats.weather_source === 'live' ? 'Live forecast · Open-Meteo' : 'Offline sample forecast'}
          </span>
        )}
      </nav>
    </header>
  )
}
