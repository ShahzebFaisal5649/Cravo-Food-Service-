import { useState } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { useRestaurant, useMenuItems } from '../hooks/useRestaurants'
import { useCartStore } from '../../cart/store/cartStore'
import { useFavorites, useToggleFavorite } from '../../favorites/hooks/useFavorites'
import { useAuthStore } from '../../auth/store/authStore'
import ItemCustomizeModal from './ItemCustomizeModal'
import ConfirmDialog from '../../../shared/components/ConfirmDialog'
import ReviewsSection from '../../reviews/components/ReviewsSection'
import { toast } from '../../../store/toastStore'

function groupByCategory(items) {
  const groups = {}
  for (const item of items) {
    if (!groups[item.category]) groups[item.category] = []
    groups[item.category].push(item)
  }
  return groups
}

export default function RestaurantDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const addItem = useCartStore((state) => state.addItem)
  const cartRestaurantId = useCartStore((state) => state.restaurantId)
  const clearCart = useCartStore((state) => state.clearCart)

  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const { data: favoriteIds } = useFavorites()
  const isFavorite = (favoriteIds || []).includes(id)
  const toggleFavorite = useToggleFavorite()

  const [activeItem, setActiveItem] = useState(null)
  const [pendingAdd, setPendingAdd] = useState(null)

  const {
    data: restaurant,
    isLoading: loadingRestaurant,
    isError: restaurantError,
  } = useRestaurant(id)

  const { data: menuItems, isLoading: loadingMenu } = useMenuItems(id)

  const isLoading = loadingRestaurant || loadingMenu

  function handleFavoriteClick() {
    if (!isLoggedIn) {
      navigate(`/login?next=${encodeURIComponent(location.pathname)}`)
      return
    }
    toggleFavorite.mutate({ restaurantId: id, isFavorite })
    toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites')
  }

  function handleAddClick(item) {
    setActiveItem(item)
  }

  function handleConfirmAdd(cartLineItem) {
    setActiveItem(null)
    if (cartRestaurantId && cartRestaurantId !== id) {
      setPendingAdd(cartLineItem)
      return
    }
    addItem(id, restaurant.name, cartLineItem)
  }

  function handleConfirmSwitch() {
    clearCart()
    addItem(id, restaurant.name, pendingAdd)
    setPendingAdd(null)
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center text-warmGray">
        Loading restaurant...
      </div>
    )
  }

  if (restaurantError || !restaurant) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center">
        <p className="text-error mb-4">We couldn't find that restaurant.</p>
        <Link to="/" className="text-gold underline">
          Back to all restaurants
        </Link>
      </div>
    )
  }

  const grouped = groupByCategory(menuItems || [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-28">
      <Link to="/" className="text-warmGray hover:text-gold text-sm">
        &larr; Back
      </Link>

      <div className="relative rounded-xl overflow-hidden mt-4 mb-6">
        {restaurant.image ? (
          <img src={restaurant.image} alt={restaurant.name} className="w-full h-56 object-cover" />
        ) : (
          <div className="w-full h-56 bg-slate flex items-center justify-center text-warmGray text-sm">
            No image
          </div>
        )}
        {!restaurant.isOpen && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-offwhite font-semibold text-lg">Currently Closed</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-gold text-3xl">{restaurant.name}</h1>
        <button
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className="text-3xl leading-none"
        >
          {isFavorite ? '❤️' : '🤍'}
        </button>
      </div>
      <p className="text-warmGray mb-1">{restaurant.cuisine} &middot; {restaurant.address}</p>
      <div className="flex items-center gap-4 text-sm mb-8">
        <span className="text-champagne">⭐ {restaurant.rating}</span>
        <span className="text-warmGray">{restaurant.deliveryTime}</span>
        <span className="text-warmGray">Min order Rs. {restaurant.minOrder}</span>
        <span className="text-warmGray">Delivery Rs. {restaurant.deliveryFee}</span>
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="mb-8">
          <h2 className="font-display text-champagne text-xl mb-3">{category}</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center bg-slate border border-borderDark rounded-lg p-4"
              >
                <div className="pr-4">
                  <p className="text-offwhite font-medium">{item.name}</p>
                  {item.description && (
                    <p className="text-warmGray text-sm mt-1">{item.description}</p>
                  )}
                  <p className="text-gold text-sm mt-1">Rs. {item.price}</p>
                </div>
                <button
                  disabled={!restaurant.isOpen}
                  onClick={() => handleAddClick(item)}
                  className="bg-gold hover:bg-goldDeep disabled:bg-borderDark disabled:cursor-not-allowed text-charcoal font-semibold rounded-lg px-4 py-2 text-sm whitespace-nowrap"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <ReviewsSection restaurantId={id} />

      {activeItem && (
        <ItemCustomizeModal
          item={activeItem}
          onClose={() => setActiveItem(null)}
          onConfirm={handleConfirmAdd}
        />
      )}

      {pendingAdd && (
        <ConfirmDialog
          title="Start a new order?"
          message={`Your cart has items from another restaurant. Adding this item will clear your current cart and start a new order at ${restaurant.name}.`}
          confirmLabel="Clear cart & add"
          onConfirm={handleConfirmSwitch}
          onCancel={() => setPendingAdd(null)}
        />
      )}
    </div>
  )
}