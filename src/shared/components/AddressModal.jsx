import { useState } from 'react'

const POPULAR_AREAS = [
  'Gulberg, Lahore',
  'DHA, Lahore',
  'Model Town, Lahore',
  'Johar Town, Lahore',
  'Bahria Town, Lahore',
  'Wapda Town, Lahore',
  'Garden Town, Lahore',
  'Liberty Market, Lahore',
]

export default function AddressModal({ currentAddress, onClose, onConfirm }) {
  const [customAddress, setCustomAddress] = useState(currentAddress || '')

  function handleConfirm() {
    if (!customAddress.trim()) return
    onConfirm(customAddress.trim())
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={currentAddress ? onClose : undefined}>
      <div
        className="bg-slate w-full max-w-md rounded-2xl border border-borderDark p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-gold text-xl mb-1">Set Delivery Location</h2>
        <p className="text-warmGray text-sm mb-4">Choose a popular area or type your own address.</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {POPULAR_AREAS.map((area) => (
            <button
              key={area}
              onClick={() => setCustomAddress(area)}
              className={
                'text-sm rounded-full px-3 py-1.5 border transition-colors ' +
                (customAddress === area
                  ? 'bg-gold text-charcoal border-gold'
                  : 'border-borderDark text-offwhite hover:border-gold')
              }
            >
              {area}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Or type your full address..."
          value={customAddress}
          onChange={(e) => setCustomAddress(e.target.value)}
          className="w-full bg-charcoal border border-borderDark rounded-lg px-4 py-2 text-offwhite placeholder-warmGray focus:outline-none focus:border-gold mb-4"
        />

        <div className="flex gap-3">
          {currentAddress && (
            <button
              onClick={onClose}
              className="flex-1 border border-borderDark text-offwhite rounded-lg py-2 hover:border-gold transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleConfirm}
            disabled={!customAddress.trim()}
            className="flex-1 bg-gold text-charcoal font-semibold rounded-lg py-2 hover:bg-champagne transition-colors disabled:opacity-50"
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  )
}