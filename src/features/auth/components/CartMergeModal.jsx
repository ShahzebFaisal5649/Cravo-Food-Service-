
export default function CartMergeModal({ onKeepCurrent, onRestoreSaved, onMergeBoth }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-slate border border-borderDark rounded-xl max-w-md w-full p-6">
        <h2 className="font-display text-gold text-xl mb-2">You have two carts</h2>
        <p className="text-warmGray text-sm mb-6">
          You added items as a guest, and you also have items saved from your last
          time logged in. What would you like to do?
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onMergeBoth}
            className="bg-gold text-charcoal font-semibold rounded-lg py-2 hover:bg-champagne transition-colors"
          >
            Merge both carts
          </button>
          <button
            onClick={onKeepCurrent}
            className="border border-borderDark text-offwhite rounded-lg py-2 hover:border-gold transition-colors"
          >
            Keep my current cart
          </button>
          <button
            onClick={onRestoreSaved}
            className="border border-borderDark text-offwhite rounded-lg py-2 hover:border-gold transition-colors"
          >
            Use my saved cart instead
          </button>
        </div>
      </div>
    </div>
  )
}