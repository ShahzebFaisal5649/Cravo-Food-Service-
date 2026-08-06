import { Link } from 'react-router-dom'
import { useUserOrders } from '../hooks/useOrders'
import { useAuthStore } from '../../auth/store/authStore'


function statusColor(status) {
  if (status === 'placed') return 'text-gold border-gold'
  if (status === 'preparing') return 'text-warning border-warning'
  if (status === 'on the way') return 'text-champagne border-champagne'
  if (status === 'delivered') return 'text-success border-success'
  if (status === 'cancelled') return 'text-error border-error'
  return 'text-warmGray border-borderDark'
}

export default function OrderHistoryPage() {
  const user = useAuthStore((state) => state.user)

  const { data: orders, isLoading, isError } = useUserOrders(user.id)

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-warmGray">
        Loading your orders...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-error">
        Something went wrong loading your orders.
      </div>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-warmGray mb-4">You haven't placed any orders yet.</p>
        <Link to="/" className="text-gold underline">Browse restaurants</Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="font-display text-gold text-2xl mb-6">Order History</h1>

      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <Link
            key={order.id}
            to={`/order-tracking/${order.id}`}
            className="bg-slate border border-borderDark rounded-xl p-5 hover:border-gold transition-colors block"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-offwhite font-semibold">{order.restaurantName}</p>
                <p className="text-warmGray text-xs mt-0.5">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
              <span
                className={
                  'text-xs font-semibold capitalize border rounded-full px-2.5 py-1 ' +
                  statusColor(order.status)
                }
              >
                {order.status}
              </span>
            </div>

            <div className="flex justify-between text-sm text-warmGray mt-3">
              <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
              <span className="text-gold font-semibold">Rs. {order.total}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}