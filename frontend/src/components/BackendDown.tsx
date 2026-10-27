export default function BackendDown({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper p-6 text-center">
      <h1 className="font-heading text-xl text-dark">Backend not reachable at {import.meta.env.VITE_API_URL}</h1>
      <p className="max-w-md text-sm text-text-soft">Start the backend, then retry:</p>
      <pre className="max-w-md overflow-x-auto rounded-lg bg-mist p-3 text-left text-xs text-dark">
        cd backend{'\n'}
        source .venv/bin/activate{'\n'}
        uvicorn app.main:app --reload --port 8000
      </pre>
      <button
        type="button"
        onClick={onRetry}
        className="min-h-12 rounded-lg bg-teal px-4 text-white"
      >
        Retry
      </button>
    </div>
  )
}
