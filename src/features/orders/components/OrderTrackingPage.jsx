import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useOrderTracking, useCancelOrder } from '../hooks/useOrders'
import ConfirmDialog from '../../../shared/components/ConfirmDialog'
import { toast } from '../../../store/toastStore'
import { ORDER_STATUSES } from '../../../shared/utils/orderStatuses'

const STATUS_STEPS = ORDER_STATUSES

export default function OrderTrackingPage() {
  const { orderId } = useParams()

  const { data: order, isLoading, isError } = useOrderTracking(orderId)
  const cancelOrderMutation = useCancelOrder()
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function handleCancel() {
    try {
      await cancelOrderMutation.mutateAsync(orderId)
      toast.success('Order cancelled.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setConfirmOpen(false)
    }
  }

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
        <Link to="/" className="text-gold underline">Back to home</Link>
      </div>
    )
  }

  const currentIndex = STATUS_STEPS.indexOf(order.status)

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="font-display text-gold text-2xl mb-2 text-center">
        Track Your Order
      </h1>
      <p className="text-warmGray text-center mb-8">
        Order #{order.id} from {order.restaurantName}
      </p>

      {order.status === 'cancelled' ? (
        <div className="bg-slate border border-error/40 rounded-xl p-6 mb-6 text-center">
          <p className="text-error font-semibold">This order was cancelled.</p>
        </div>
      ) : (
        <div className="bg-slate border border-borderDark rounded-xl p-6 mb-6">
          {STATUS_STEPS.map((step, index) => {
            const isDone = index <= currentIndex
            const isCurrent = index === currentIndex

            return (
              <div key={step} className="flex items-start gap-3 pb-6 last:pb-0">
                <div className="flex flex-col items-center">
                  <div
                    className={
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ' +
                      (isDone ? 'bg-gold text-charcoal' : 'bg-charcoal border border-borderDark text-warmGray')
                    }
                  >
                    {isDone ? '✓' : index + 1}
                  </div>
                  {index < STATUS_STEPS.length - 1 && (
                    <div
                      className={
                        'w-0.5 flex-1 min-h-6 mt-1 ' +
                        (index < currentIndex ? 'bg-gold' : 'bg-borderDark')
                      }
                    />
                  )}
                </div>

                <div className="pt-0.5">
                  <p className={isCurrent ? 'text-gold font-semibold capitalize' : 'text-offwhite capitalize'}>
                    {step}
                  </p>
                  {isCurrent && (
                    <p className="text-warmGray text-xs mt-0.5">Current status</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {order.status === 'placed' && (
        <div className="text-center mb-6">
          <button
            onClick={() => setConfirmOpen(true)}
            className="text-error underline text-sm hover:text-error/80"
          >
            Cancel this order
          </button>
        </div>
      )}

      {confirmOpen && (
        <ConfirmDialog
          title="Cancel this order?"
          message="This can't be undone. Your order will be cancelled and you won't be charged again for it."
          confirmLabel={cancelOrderMutation.isPending ? 'Cancelling...' : 'Yes, cancel'}
          onConfirm={handleCancel}
          onCancel={() => setConfirmOpen(false)}
        />
      )}

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

      <div className="text-center">
        <Link to="/orders" className="text-gold underline">Back to order history</Link>
      </div>
    </div>
  )
}