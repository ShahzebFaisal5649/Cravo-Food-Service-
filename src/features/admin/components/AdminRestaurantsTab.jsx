import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAdminRestaurants, useDeleteRestaurant, useToggleRestaurantOpen } from '../hooks/useAdmin'
import RestaurantFormModal from './RestaurantFormModal'
import ConfirmDialog from '../../../shared/components/ConfirmDialog'
import { toast } from '../../../store/toastStore'
import { SkeletonRows, EmptyState, ErrorState } from './AdminUI'
import { IconRestaurant } from './AdminIcons'

export default function AdminRestaurantsTab() {
  const queryClient = useQueryClient()
  
  const [editingRestaurant, setEditingRestaurant] = useState(null)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [page, setPage] = useState(1)

  const { data, isLoading, isError } = useAdminRestaurants(page, 10)
  const restaurants = data?.items || []
  const totalPages = data?.totalPages || 1
  const deleteRestaurantMutation = useDeleteRestaurant()
  const toggleOpenMutation = useToggleRestaurantOpen()
  const existingCuisines = [...new Set(restaurants.map((r) => r.cuisine))].sort()

  async function handleToggleOpen(restaurant) {
    try {
      await toggleOpenMutation.mutateAsync({ id: restaurant.id, isOpen: !restaurant.isOpen })
      toast.success(`${restaurant.name} is now ${!restaurant.isOpen ? 'open' : 'closed'}.`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleConfirmDelete() {
    try {
      await deleteRestaurantMutation.mutateAsync(pendingDeleteId)
      toast.success('Restaurant deleted.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setPendingDeleteId(null)
    }
  }

  function handleSaved() {
    queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] })
    queryClient.invalidateQueries({ queryKey: ['restaurants'] })
    setEditingRestaurant(null)
  }

  function goToPage(newPage) {
    setPage(Math.min(Math.max(1, newPage), totalPages))
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-offwhite font-semibold">All Restaurants</h2>
        <button
          onClick={() => setEditingRestaurant({})}
          className="bg-gold text-charcoal font-semibold rounded-lg px-4 py-2 text-sm hover:bg-champagne transition-colors"
        >
          + Add Restaurant
        </button>
      </div>

      {isLoading && <SkeletonRows count={4} />}
      {isError && <ErrorState message="Couldn't load restaurants." />}

      {!isLoading && !isError && restaurants.length === 0 && (
        <EmptyState
          icon={<IconRestaurant className="w-10 h-10" />}
          title="No restaurants yet"
          message="Add your first restaurant to start building out the menu."
        />
      )}

      {!isLoading && !isError && restaurants.length > 0 && (
        <div className="flex flex-col gap-2">
          {restaurants.map((r) => (
            <div
              key={r.id}
              className="bg-slate border border-borderDark rounded-lg px-4 py-3 flex items-center justify-between"
            >
              <div>
                <p className="text-offwhite font-medium">{r.name}</p>
                <p className="text-warmGray text-xs">{r.cuisine}</p>
              </div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => handleToggleOpen(r)}
                  disabled={toggleOpenMutation.isPending}
                  className={
                    'text-sm font-semibold rounded-lg px-3 py-1.5 border transition-colors disabled:opacity-50 ' +
                    (r.isOpen
                      ? 'border-success/40 text-success hover:bg-success/10'
                      : 'border-error/40 text-error hover:bg-error/10')
                  }
                >
                  {r.isOpen ? 'Open' : 'Closed'}
                </button>
                <button
                  onClick={() => setEditingRestaurant(r)}
                  className="text-sm border border-borderDark hover:border-gold rounded-lg px-3 py-1.5 text-offwhite transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => setPendingDeleteId(r.id)}
                  className="text-sm border border-error text-error rounded-lg px-3 py-1.5 hover:bg-error hover:text-offwhite transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !isError && restaurants.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
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

      {editingRestaurant !== null && (
        <RestaurantFormModal
          restaurant={editingRestaurant}
          existingCuisines={existingCuisines}
          onClose={() => setEditingRestaurant(null)}
          onSaved={handleSaved}
        />
      )}

      {pendingDeleteId !== null && (
        <ConfirmDialog
          title="Delete restaurant?"
          message="This will also delete all its menu items and reviews. Past orders will still show this restaurant's name. This cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleConfirmDelete}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}
    </div>
  )
}