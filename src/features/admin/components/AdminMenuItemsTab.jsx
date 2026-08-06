import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAdminRestaurants, useAdminMenuItems, useDeleteMenuItem } from '../hooks/useAdmin'
import MenuItemFormModal from './MenuItemFormModal'
import ConfirmDialog from '../../../shared/components/ConfirmDialog'
import { toast } from '../../../store/toastStore'
import { SkeletonRows, EmptyState, ErrorState } from './AdminUI'
import { IconMenuItems } from './AdminIcons'

export default function AdminMenuItemsTab() {
  const queryClient = useQueryClient()

  const [selectedRestaurantId, setSelectedRestaurantId] = useState('')
  const [editingItem, setEditingItem] = useState(null) 
  const [pendingDeleteId, setPendingDeleteId] = useState(null)

  // useAdminRestaurants() resolves to the paginated envelope { items, page, totalPages, totalCount }
  // returned by GET /api/admin/restaurants — not a bare array. Unwrap .items here, the same way
  // AdminRestaurantsTab.jsx and AdminOrdersTab.jsx already do, instead of treating the envelope
  // itself as the restaurant list.
  const { data, isLoading: loadingRestaurants } = useAdminRestaurants(1, 100)
  const restaurants = data?.items || []

  // Default to the first restaurant once the list has loaded.
  const activeRestaurantId = String(selectedRestaurantId || restaurants[0]?.id || '')

  const { data: menuItems, isLoading: loadingItems, isError } = useAdminMenuItems(activeRestaurantId)
  const deleteMenuItemMutation = useDeleteMenuItem(activeRestaurantId)

  function handleSaved() {
    queryClient.invalidateQueries({ queryKey: ['admin-menu-items', activeRestaurantId] })
    queryClient.invalidateQueries({ queryKey: ['menuItems', activeRestaurantId] }) // keep public detail page in sync
    setEditingItem(null)
  }

  async function handleConfirmDelete() {
    try {
      await deleteMenuItemMutation.mutateAsync(pendingDeleteId)
      toast.success('Menu item deleted.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setPendingDeleteId(null)
    }
  }

  if (loadingRestaurants) return <SkeletonRows count={3} />

  if (restaurants.length === 0) {
    return (
      <EmptyState
        icon={<IconMenuItems className="w-10 h-10" />}
        title="No restaurants to add items to"
        message="Add a restaurant first, then come back here to build its menu."
      />
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <label className="text-sm text-warmGray">Restaurant</label>
          <select
            value={activeRestaurantId}
            onChange={(e) => setSelectedRestaurantId(e.target.value)}
            className="bg-charcoal border border-borderDark rounded-lg px-3 py-2 text-offwhite text-sm focus:outline-none focus:border-gold"
          >
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setEditingItem({})}
          className="bg-gold text-charcoal font-semibold rounded-lg px-4 py-2 text-sm hover:bg-champagne transition-colors"
        >
          + Add Menu Item
        </button>
      </div>

      {loadingItems && <SkeletonRows count={3} />}
      {isError && <ErrorState message="Couldn't load menu items." />}

      {!loadingItems && !isError && menuItems && menuItems.length === 0 && (
        <EmptyState
          icon={<IconMenuItems className="w-10 h-10" />}
          title="No menu items yet"
          message="Add this restaurant's first dish to get its menu started."
        />
      )}

      {!loadingItems && !isError && menuItems && menuItems.length > 0 && (
        <div className="flex flex-col gap-2">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className="bg-slate border border-borderDark rounded-lg px-4 py-3 flex items-center justify-between"
            >
              <div>
                <p className="text-offwhite font-medium">{item.name}</p>
                <p className="text-warmGray text-xs">
                  {item.category} · Rs. {item.price}
                  {item.variants && item.variants.length > 0 && ` · ${item.variants.length} variant(s)`}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingItem(item)}
                  className="text-sm border border-borderDark hover:border-gold rounded-lg px-3 py-1.5 text-offwhite transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => setPendingDeleteId(item.id)}
                  className="text-sm border border-error text-error rounded-lg px-3 py-1.5 hover:bg-error hover:text-offwhite transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingItem !== null && (
        <MenuItemFormModal
          menuItem={editingItem}
          restaurants={restaurants}
          defaultRestaurantId={activeRestaurantId}
          onClose={() => setEditingItem(null)}
          onSaved={handleSaved}
        />
      )}

      {pendingDeleteId !== null && (
        <ConfirmDialog
          title="Delete menu item?"
          message="This cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleConfirmDelete}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}
    </div>
  )
}