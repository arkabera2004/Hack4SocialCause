interface ToastProps {
  message: string
  kind?: 'success' | 'error'
  onClose: () => void
}

export default function Toast({ message, kind = 'success', onClose }: ToastProps) {
  return (
    <div
      role="status"
      className={`fixed bottom-4 left-1/2 z-[1000] -translate-x-1/2 rounded-lg px-4 py-2 text-sm text-white shadow-lg ${
        kind === 'error' ? 'bg-level-severe' : 'bg-teal'
      }`}
    >
      {message}
      <button type="button" onClick={onClose} className="ml-3 underline" aria-label="Dismiss">
        Dismiss
      </button>
    </div>
  )
}
