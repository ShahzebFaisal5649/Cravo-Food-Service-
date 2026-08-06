import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCartStore } from '../../cart/store/cartStore'
import { useAuthStore } from '../../auth/store/authStore'
import { useLocationStore } from '../../../store/locationStore'
import { useRestaurant } from '../../restaurants/hooks/useRestaurants'
import { processPayment } from '../services/paymentApi'
import { placeOrder } from '../../orders/services/orderApi'
import { toast } from '../../../store/toastStore'

function formatCardNumber(value) {
  const digitsOnly = value.replace(/\D/g, '').slice(0, 16)
  return digitsOnly.replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(value) {
  const digitsOnly = value.replace(/\D/g, '').slice(0, 4)
  if (digitsOnly.length <= 2) return digitsOnly
  return digitsOnly.slice(0, 2) + '/' + digitsOnly.slice(2)
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const savedAddress = useLocationStore((state) => state.address)
  const { restaurantId, restaurantName, items, clearCart } = useCartStore()

  const [deliveryAddress, setDeliveryAddress] = useState(savedAddress || '')
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [errors, setErrors] = useState({})
  const [paymentError, setPaymentError] = useState('')
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)

  const { data: restaurant } = useRestaurant(restaurantId)

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const deliveryFee = restaurant?.deliveryFee || 0
  const total = subtotal + deliveryFee

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-warmGray mb-4">Your cart is empty.</p>
        <Link to="/" className="text-gold underline">Browse restaurants</Link>
      </div>
    )
  }

  function validate() {
    const newErrors = {}

    if (!deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'Delivery address is required.'
    }
    if (!cardName.trim()) {
      newErrors.cardName = 'Name on card is required.'
    }

    const digitsOnly = cardNumber.replace(/\s/g, '')
    if (digitsOnly.length !== 16) {
      newErrors.cardNumber = 'Card number must be 16 digits.'
    }

    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      newErrors.expiry = 'Use MM/YY format.'
    } else {
      const month = Number(expiry.slice(0, 2))
      if (month < 1 || month > 12) newErrors.expiry = 'Enter a valid month.'
    }

    if (!/^\d{3,4}$/.test(cvv)) {
      newErrors.cvv = 'CVV must be 3-4 digits.'
    }

    if (restaurant && subtotal < restaurant.minOrder) {
      newErrors.minOrder = `Minimum order for ${restaurant.name} is Rs. ${restaurant.minOrder}.`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setPaymentError('')

    if (!validate()) return

    setIsPlacingOrder(true)
    try {
      await processPayment({ cardNumber: cardNumber.replace(/\s/g, ''), expiry, cvv })

      const order = await placeOrder({
        userId: user.id,
        restaurantId,
        restaurantName,
        items,
        subtotal,
        deliveryFee,
        total,
        deliveryAddress: deliveryAddress.trim(),
      })

      clearCart()
      toast.success('Order placed successfully!')
      navigate(`/order-confirmation/${order.id}`, { replace: true })
    } catch (err) {
      setPaymentError(err.message)
toast.error(err.message)
    } finally {
      setIsPlacingOrder(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-16">
      <h1 className="font-display text-gold text-3xl mb-6">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-display text-champagne text-lg mb-3">Order Summary</h2>
          <p className="text-warmGray text-sm mb-4">From {restaurantName}</p>

          <div className="space-y-2 mb-4">
            {items.map((item) => (
              <div key={item.itemId + '-' + item.variant} className="flex justify-between text-sm">
                <span className="text-offwhite">
                  {item.quantity}x {item.name}
                  {item.variant && <span className="text-warmGray"> ({item.variant})</span>}
                </span>
                <span className="text-gold">Rs. {item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-borderDark pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-warmGray">
              <span>Subtotal</span>
              <span>Rs. {subtotal}</span>
            </div>
            <div className="flex justify-between text-warmGray">
              <span>Delivery Fee</span>
              <span>Rs. {deliveryFee}</span>
            </div>
            <div className="flex justify-between text-offwhite font-semibold text-base pt-1">
              <span>Total</span>
              <span>Rs. {total}</span>
            </div>
          </div>

          {errors.minOrder && <p className="text-error text-sm mt-3">{errors.minOrder}</p>}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-warmGray mb-1">Delivery Address</label>
            <input
              type="text"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="House #, Street, Area"
              className="w-full bg-slate border border-borderDark rounded-lg px-4 py-2 text-offwhite placeholder-warmGray focus:outline-none focus:border-gold"
            />
            {errors.deliveryAddress && <p className="text-error text-xs mt-1">{errors.deliveryAddress}</p>}
          </div>

          <div>
            <label className="block text-sm text-warmGray mb-1">Name on Card</label>
            <input
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="Full name"
              className="w-full bg-slate border border-borderDark rounded-lg px-4 py-2 text-offwhite placeholder-warmGray focus:outline-none focus:border-gold"
            />
            {errors.cardName && <p className="text-error text-xs mt-1">{errors.cardName}</p>}
          </div>

          <div>
            <label className="block text-sm text-warmGray mb-1">Card Number</label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="4242 4242 4242 4242"
              className="w-full bg-slate border border-borderDark rounded-lg px-4 py-2 text-offwhite placeholder-warmGray focus:outline-none focus:border-gold"
            />
            {errors.cardNumber && <p className="text-error text-xs mt-1">{errors.cardNumber}</p>}
            <p className="text-warmGray text-xs mt-1">
              Demo: 4242 4242 4242 4242 succeeds. 4000 0000 0000 0002 is always declined.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-warmGray mb-1">Expiry</label>
              <input
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                className="w-full bg-slate border border-borderDark rounded-lg px-4 py-2 text-offwhite placeholder-warmGray focus:outline-none focus:border-gold"
              />
              {errors.expiry && <p className="text-error text-xs mt-1">{errors.expiry}</p>}
            </div>
            <div className="flex-1">
              <label className="block text-sm text-warmGray mb-1">CVV</label>
              <input
                type="text"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="123"
                className="w-full bg-slate border border-borderDark rounded-lg px-4 py-2 text-offwhite placeholder-warmGray focus:outline-none focus:border-gold"
              />
              {errors.cvv && <p className="text-error text-xs mt-1">{errors.cvv}</p>}
            </div>
          </div>

          {paymentError && <p className="text-error text-sm">{paymentError}</p>}

          <button
            type="submit"
            disabled={isPlacingOrder}
            className="bg-gold hover:bg-goldDeep text-charcoal font-semibold rounded-lg py-3 mt-2 disabled:opacity-50 transition-colors"
          >
            {isPlacingOrder ? 'Placing order...' : `Pay Rs. ${total} & Place Order`}
          </button>
        </form>
      </div>
    </div>
  )
}