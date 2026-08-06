import { Link } from 'react-router-dom'
import { useRestaurants } from '../../restaurants/hooks/useRestaurants'
import { useFavorites } from '../hooks/useFavorites'
import { RestaurantCard } from '../../restaurants/components/RestaurantListPage'

export default function FavoritesPage() {
  const { data: favoriteIds } = useFavorites()

  const { data: restaurants, isLoading, isError } = useRestaurants()

  const favoriteRestaurants = (restaurants || []).filter((r) => (favoriteIds || []).includes(r.id))

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-display text-gold text-3xl mb-6">My Favorites</h1>

      {isLoading && (
        <p className="text-warmGray text-center py-8">Loading your favorites...</p>
      )}

      {isError && (
        <p className="text-error text-center py-8">Something went wrong loading favorites.</p>
      )}

      {!isLoading && !isError && favoriteRestaurants.length === 0 && (
        <div className="text-center py-16">
          <p className="text-warmGray mb-4">You haven't favorited any restaurants yet.</p>
          <Link to="/" className="text-gold underline">
            Browse restaurants
          </Link>
        </div>
      )}

      {!isLoading && !isError && favoriteRestaurants.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {favoriteRestaurants.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      )}
    </div>
  )
}