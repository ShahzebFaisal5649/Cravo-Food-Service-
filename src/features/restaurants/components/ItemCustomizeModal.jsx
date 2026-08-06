import { useState } from 'react'

export default function ItemCustomizeModal({ item, onClose, onConfirm }) {
  const hasVariants = item.variants && item.variants.length > 0

  const [selectedVariant, setSelectedVariant] = useState(
    hasVariants ? item.variants[0].name : null
  )
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')

  const variantModifier = hasVariants
    ? item.variants.find((v) => v.name === selectedVariant)?.priceModifier || 0
    : 0
  const unitPrice = item.price + variantModifier
  const totalPrice = unitPrice * quantity

  function handleConfirm() {
    onConfirm({
      itemId: item.id,
      name: item.name,
      price: unitPrice,
      quantity,
      variant: selectedVariant,
      notes: notes.trim(),
    })
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-slate w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-borderDark p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="font-display text-gold text-xl">{item.name}</h2>
            {item.description && (
              <p className="text-warmGray text-sm mt-1">{item.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-warmGray hover:text-offwhite text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {hasVariants && (
          <div className="mb-4">
            <p className="text-offwhite text-sm font-semibold mb-2">Choose an option</p>
            <div className="space-y-2">
              {item.variants.map((v) => (
                <label
                  key={v.name}
                  className="flex items-center justify-between border border-borderDark rounded-lg px-3 py-2 cursor-pointer hover:border-gold"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="variant"
                      checked={selectedVariant === v.name}
                      onChange={() => setSelectedVariant(v.name)}
                    />
                    <span className="text-offwhite">{v.name}</span>
                  </span>
                  <span className="text-warmGray text-sm">
                    {v.priceModifier > 0 && `+Rs. ${v.priceModifier}`}
                    {v.priceModifier < 0 && `-Rs. ${Math.abs(v.priceModifier)}`}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <p className="text-offwhite text-sm font-semibold mb-2">Special instructions</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. no onions, extra spicy..."
            rows={2}
            className="w-full bg-charcoal border border-borderDark rounded-lg px-3 py-2 text-offwhite placeholder-warmGray focus:outline-none focus:border-gold resize-none"
          />
        </div>

        <div className="flex items-center justify-between mb-6">
          <p className="text-offwhite text-sm font-semibold">Quantity</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-full border border-borderDark text-offwhite hover:border-gold"
            >
              -
            </button>
            <span className="text-offwhite w-6 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-full border border-borderDark text-offwhite hover:border-gold"
            >
              +
            </button>
          </div>
        </div>

        <button
          onClick={handleConfirm}
          className="w-full bg-gold hover:bg-goldDeep text-charcoal font-semibold rounded-lg py-3 transition-colors"
        >
          Add to Cart · Rs. {totalPrice}
        </button>
      </div>
    </div>
  )
}
