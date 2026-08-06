import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useRestaurants } from '../hooks/useRestaurants'
import { useFavorites, useToggleFavorite } from '../../favorites/hooks/useFavorites'
import { useAuthStore } from '../../auth/store/authStore'
import { toast } from '../../../store/toastStore'

export function RestaurantCard({ restaurant }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const { data: favoriteIds } = useFavorites()
  const isFavorite = (favoriteIds || []).includes(restaurant.id)
  const toggleFavorite = useToggleFavorite()

  function handleHeartClick(e) {
    e.preventDefault()
    e.stopPropagation()

    if (!isLoggedIn) {
      navigate(`/login?next=${encodeURIComponent(location.pathname)}`)
      return
    }
    toggleFavorite.mutate({ restaurantId: restaurant.id, isFavorite })
    toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites')
  }

  return (
    <Link
      to={`/restaurant/${restaurant.id}`}
      className="block bg-slate rounded-xl overflow-hidden border border-borderDark hover:border-gold transition-colors"
    >
      <div className="relative">
        {restaurant.image ? (
          <img src={restaurant.image} alt={restaurant.name} className="w-full h-40 object-cover" />
        ) : (
          <div className="w-full h-40 bg-slate flex items-center justify-center text-warmGray text-sm">
            No image
          </div>
        )}
        {!restaurant.isOpen && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-offwhite font-semibold">Closed</span>
          </div>
        )}
        <button
          onClick={handleHeartClick}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-charcoal/80 flex items-center justify-center text-lg"
        >
          {isFavorite ? '❤️' : '🤍'}
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-display text-gold text-lg">{restaurant.name}</h3>
        <p className="text-warmGray text-sm">{restaurant.cuisine}</p>
        <div className="flex justify-between items-center mt-2 text-sm">
          <span className="text-champagne">⭐ {restaurant.rating}</span>
          <span className="text-warmGray">{restaurant.deliveryTime}</span>
        </div>
      </div>
    </Link>
  )
}

function RestaurantSkeleton() {
  return (
    <div className="bg-slate rounded-xl overflow-hidden border border-borderDark animate-pulse">
      <div className="w-full h-40 bg-borderDark" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-borderDark rounded w-3/4" />
        <div className="h-3 bg-borderDark rounded w-1/2" />
      </div>
    </div>
  )
}

export default function RestaurantListPage() {
  const [search, setSearch] = useState('')
  const [cuisineFilter, setCuisineFilter] = useState('All')
  const [sortBy, setSortBy] = useState('rating')

  const { data: restaurants, isLoading, isError } = useRestaurants()

  const cuisines = restaurants
    ? ['All', ...new Set(restaurants.map((r) => r.cuisine))]
    : ['All']

  let filtered = restaurants || []
  if (search) {
    filtered = filtered.filter((r) =>
      r.name.toLowerCase().includes(search.toLowerCase())
    )
  }
  if (cuisineFilter !== 'All') {
    filtered = filtered.filter((r) => r.cuisine === cuisineFilter)
  }
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    return 0
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-display text-gold text-3xl mb-6">Cravo</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search restaurants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-slate border border-borderDark rounded-lg px-4 py-2 text-offwhite placeholder-warmGray focus:outline-none focus:border-gold"
        />
        <select
          value={cuisineFilter}
          onChange={(e) => setCuisineFilter(e.target.value)}
          className="bg-slate border border-borderDark rounded-lg px-4 py-2 text-offwhite focus:outline-none focus:border-gold"
        >
          {cuisines.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-slate border border-borderDark rounded-lg px-4 py-2 text-offwhite focus:outline-none focus:border-gold"
        >
          <option value="rating">Sort by Rating</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      {isError && (
        <p className="text-error text-center py-8">Something went wrong loading restaurants.</p>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <RestaurantSkeleton key={i} />)}
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <p className="text-warmGray text-center py-8">No restaurants match your search.</p>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      )}
    </div>
  )
}