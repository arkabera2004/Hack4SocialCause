import { Link } from 'react-router-dom'
import type { Stats } from '../api/types'

export default function Header({ stats }: { stats: Stats | null }) {
  return (
    <header className="flex items-center justify-between border-b border-card-border bg-dark px-4 py-2 text-paper">
      <div>
        <h1 className="font-heading text-lg leading-tight">TeestaGuard</h1>
        <p className="text-xs text-paper/70">Teesta valley early warning · Sikkim</p>
      </div>
      <nav className="flex items-center gap-4 text-sm">
        <Link to="/" className="hover:underline">Dashboard</Link>
        <Link to="/citizen" className="hover:underline">Citizen app</Link>
        <span
          className="rounded-full bg-amber-500/90 px-2 py-0.5 text-xs font-medium text-dark"
          title="Village data is approximate; gauge readings are simulated"
        >
          Sample data
        </span>
        {stats && (
          <span className="rounded-full bg-teal/30 px-2 py-0.5 text-xs">
            {stats.weather_source === 'live' ? 'Live forecast · Open-Meteo' : 'Offline sample forecast'}
          </span>
        )}
      </nav>
    </header>
  )
}
