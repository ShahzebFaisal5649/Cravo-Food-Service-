import { useToastStore } from '../../store/toastStore'

const TYPE_STYLES = {
  success: 'border-success text-success',
  error: 'border-error text-error',
  info: 'border-gold text-gold',
}

const TYPE_ICONS = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
}

export default function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts)
  const removeToast = useToastStore((state) => state.removeToast)

  if (toasts.length === 0) return null

  return (
    <div
  className="fixed bottom-4 right-4 z-100 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0"
  aria-live="polite"
  aria-atomic="true"
>
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`bg-slate border ${TYPE_STYLES[t.type]} rounded-lg px-4 py-3 shadow-lg flex items-start gap-3 animate-[fadeIn_0.15s_ease-out]`}
        >
          <span className="font-semibold shrink-0">{TYPE_ICONS[t.type]}</span>
          <p className="text-offwhite text-sm flex-1">{t.message}</p>
          <button
            onClick={() => removeToast(t.id)}
            aria-label="Dismiss notification"
            className="text-warmGray hover:text-offwhite shrink-0"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}