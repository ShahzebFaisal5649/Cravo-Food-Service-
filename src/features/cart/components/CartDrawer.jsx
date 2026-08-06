import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'

export default function CartDrawer({ open, onClose }) {
  const navigate = useNavigate()
  const { restaurantName, items, updateQuantity, removeItem, clearCart } = useCartStore()

  if (!open) return null

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  function handleCheckout() {
    onClose()
    navigate('/checkout')
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="relative bg-slate w-full sm:w-96 h-full border-l border-borderDark p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-gold text-xl">Your Cart</h2>
          <button onClick={onClose} className="text-warmGray hover:text-offwhite text-2xl leading-none">
            &times;
          </button>
        </div>

        {items.length === 0 && (
          <p className="text-warmGray text-center py-10">Your cart is empty.</p>
        )}

        {items.length > 0 && (
          <>
            <p className="text-warmGray text-sm mb-4">Ordering from {restaurantName}</p>

            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={item.itemId + '-' + item.variant} className="border-b border-borderDark pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-offwhite font-medium">{item.name}</p>
                      {item.variant && (
                        <p className="text-warmGray text-xs">{item.variant}</p>
                      )}
                      {item.notes && (
                        <p className="text-warmGray text-xs italic">"{item.notes}"</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.itemId, item.variant)}
                      className="text-error text-sm hover:underline"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.itemId, item.variant, item.quantity - 1)}
                        className="w-7 h-7 rounded-full border border-borderDark text-offwhite hover:border-gold"
                      >
                        -
                      </button>
                      <span className="text-offwhite w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.itemId, item.variant, item.quantity + 1)}
                        className="w-7 h-7 rounded-full border border-borderDark text-offwhite hover:border-gold"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-gold">Rs. {item.price * item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between text-offwhite font-semibold mb-4">
              <span>Subtotal</span>
              <span>Rs. {subtotal}</span>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full bg-gold hover:bg-goldDeep text-charcoal font-semibold rounded-lg py-3 mb-2"
            >
              Proceed to Checkout
            </button>
            <button
              onClick={clearCart}
              className="w-full text-warmGray hover:text-error text-sm py-2"
            >
              Clear cart
            </button>
          </>
        )}
      </div>
    </div>
  )
}