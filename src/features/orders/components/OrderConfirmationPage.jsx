import { useParams, Link } from 'react-router-dom'
import { useOrder } from '../hooks/useOrders'

export default function OrderConfirmationPage() {
  const { orderId } = useParams()

  const { data: order, isLoading, isError } = useOrder(orderId)

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center text-warmGray">
        Loading order...
      </div>
    )
  }

  if (isError || !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-error mb-4">We couldn't find that order.</p>
        <Link to="/" className="text-warmGray underline">Back to home</Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-4"></div>
      <h1 className="font-display text-gold text-2xl mb-2">Order Placed!</h1>
      <p className="text-warmGray mb-6">
        Your order from {order.restaurantName} has been confirmed. Order #{order.id}.
      </p>

      <div className="bg-slate border border-borderDark rounded-xl p-5 text-left mb-6">
        {order.items.map((item) => (
          <div key={item.itemId + '-' + item.variant} className="flex justify-between text-sm mb-1">
            <span className="text-offwhite">{item.quantity}x {item.name}</span>
            <span className="text-gold">Rs. {item.price * item.quantity}</span>
          </div>
        ))}
        <div className="border-t border-borderDark mt-3 pt-3 flex justify-between text-offwhite font-semibold">
          <span>Total</span>
          <span>Rs. {order.total}</span>
        </div>
        <p className="text-warmGray text-xs mt-3">Delivering to: {order.deliveryAddress}</p>
      </div>

      <Link to="/" className="text-gold underline">Back to home</Link>
    </div>
  )
}