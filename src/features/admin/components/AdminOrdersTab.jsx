import { useState } from 'react'
import { useCancelOrder } from '../../orders/hooks/useOrders'
import ConfirmDialog from '../../../shared/components/ConfirmDialog'
import { useAdminOrders, useUpdateOrderStatus } from '../hooks/useAdmin'
import { ORDER_STATUSES } from '../../../shared/utils/orderStatuses'
import { toast } from '../../../store/toastStore'
import { SkeletonRows, EmptyState, ErrorState } from './AdminUI'
import { IconOrders } from './AdminIcons'

function getNextStatus(currentStatus) {
  return ORDER_STATUSES[ORDER_STATUSES.indexOf(currentStatus) + 1]
}

export default function AdminOrdersTab() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useAdminOrders(page, 10)
  const orders = data?.items || []
  const totalPages = data?.totalPages || 1
  const updateOrderStatusMutation = useUpdateOrderStatus()
  const cancelOrderMutation = useCancelOrder()
  const [cancelTargetId, setCancelTargetId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  function goToPage(newPage) {
    setPage(Math.min(Math.max(1, newPage), totalPages))
  }

  async function handleStatusChange(orderId, newStatus) {
    try {
      await updateOrderStatusMutation.mutateAsync({ orderId, status: newStatus })
      toast.success(`Order #${orderId} marked as "${newStatus}".`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleCancel() {
    try {
      await cancelOrderMutation.mutateAsync(cancelTargetId)
      toast.success(`Order #${cancelTargetId} cancelled.`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCancelTargetId(null)
    }
  }

  if (isLoading) return <SkeletonRows count={4} />
  if (isError) return <ErrorState message="Couldn't load orders." />

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<IconOrders className="w-10 h-10" />}
        title="No orders yet"
        message="Orders will show up here as soon as customers start checking out."
      />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {orders.map((order) => {
        const isExpanded = expandedId === order.id
        return (
          <div
            key={order.id}
            className="bg-slate border border-borderDark rounded-lg px-4 py-3"
          >
            <div
              className="flex items-center justify-between flex-wrap gap-3 cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : order.id)}
            >
              <div>
                <p className="text-offwhite font-medium">
                  Order #{order.id} — {order.restaurantName}
                </p>
                <p className="text-warmGray text-xs">
                  Rs. {order.total} · {new Date(order.createdAt).toLocaleString()} · {order.deliveryAddress}
                </p>
              </div>

              {order.status === 'delivered' || order.status === 'cancelled' ? (
                <span
                  className={
                    'text-sm font-semibold capitalize rounded-lg px-3 py-1.5 border ' +
                    (order.status === 'delivered'
                      ? 'bg-success/20 text-success border-success/40'
                      : 'bg-error/20 text-error border-error/40')
                  }
                >
                  {order.status === 'delivered' ? '✓ Delivered' : '✕ Cancelled'}
                </span>
              ) : (
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    disabled={updateOrderStatusMutation.isPending || cancelOrderMutation.isPending}
                    className="bg-charcoal border border-borderDark rounded-lg px-3 py-1.5 text-offwhite text-sm capitalize focus:outline-none focus:border-gold disabled:opacity-40"
                  >
                    <option value={order.status}>{order.status}</option>
                    <option value={getNextStatus(order.status)}>{getNextStatus(order.status)}</option>
                  </select>
                  <button
                    onClick={() => setCancelTargetId(order.id)}
                    disabled={cancelOrderMutation.isPending}
                    className="text-error text-sm border border-error/40 rounded-lg px-3 py-1.5 hover:bg-error/10 transition-colors disabled:opacity-40"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-borderDark flex flex-col gap-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="text-sm">
                    <div className="flex justify-between text-offwhite">
                      <span>
                        {item.quantity}× {item.name}
                        {item.variant && (
                          <span className="text-warmGray"> ({item.variant})</span>
                        )}
                      </span>
                      <span className="text-warmGray">Rs. {item.price * item.quantity}</span>
                    </div>
                    {item.notes && (
                      <p className="text-gold text-xs italic mt-0.5">Note: {item.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-2">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="text-sm border border-borderDark rounded-lg px-3 py-1.5 text-offwhite disabled:opacity-40 hover:border-gold transition-colors"
          >
            Prev
          </button>
          <span className="text-warmGray text-sm">Page {page} of {totalPages}</span>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="text-sm border border-borderDark rounded-lg px-3 py-1.5 text-offwhite disabled:opacity-40 hover:border-gold transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {cancelTargetId && (
        <ConfirmDialog
          title="Cancel this order?"
          message="This can't be undone. The customer will be notified immediately."
          confirmLabel={cancelOrderMutation.isPending ? 'Cancelling...' : 'Yes, cancel'}
          onConfirm={handleCancel}
          onCancel={() => setCancelTargetId(null)}
        />
      )}
    </div>
  )
}