import { AlertTriangle } from 'lucide-react'

export default function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-level-severe/30 bg-level-severe/10 px-3 py-2 text-sm text-level-severe"
    >
      <span className="flex items-center gap-2">
        <AlertTriangle size={16} className="shrink-0" />
        {message}
      </span>
      <button
        type="button"
        onClick={onRetry}
        className="min-h-8 shrink-0 rounded-md border border-level-severe/40 px-2 py-1 text-xs font-medium hover:bg-level-severe/10"
      >
        Retry
      </button>
    </div>
  )
}
