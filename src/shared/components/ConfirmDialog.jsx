
export default function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-60"
      onClick={onCancel}
    >
      <div
        className="bg-slate w-full max-w-sm rounded-2xl border border-borderDark p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-gold text-lg mb-2">{title}</h3>
        <p className="text-warmGray text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-borderDark text-offwhite rounded-lg py-2 hover:border-gold"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-gold hover:bg-goldDeep text-charcoal font-semibold rounded-lg py-2"
          >
            {confirmLabel || 'Yes'}
          </button>
        </div>
      </div>
    </div>
  )
}
