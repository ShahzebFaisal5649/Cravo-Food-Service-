import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/store/authStore'
import { useCartStore } from '../../features/cart/store/cartStore'
import { useTheme } from '../contexts/ThemeContext'
import { useLocationStore } from '../../store/locationStore'
import CartDrawer from '../../features/cart/components/CartDrawer'
import AddressModal from './AddressModal'
import logo from '../../assets/images/logo.png'
import axiosInstance from '../services/axiosInstance'
import { useQueryClient } from '@tanstack/react-query'

export default function Navbar() {
  const { user, isLoggedIn } = useAuthStore()
  const navigate = useNavigate()
  const [cartOpen, setCartOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const queryClient = useQueryClient()

  const { address, setAddress } = useLocationStore()
  const [addressModalOpen, setAddressModalOpen] = useState(() => !address)
  const itemCount = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  )

  function handleLogout() {
    const cart = useCartStore.getState()
    if (user) {
      cart.saveSnapshotForUser(user.id)
    }
    cart.clearCart()
    axiosInstance.post('/auth/logout').catch(() => {}) // clear the httpOnly refresh cookie server-side; ignore failure, we're logging out anyway
    useAuthStore.getState().logout()
    queryClient.removeQueries({ queryKey: ['favorites'] })
    navigate('/')
  }

  return (
    <>
      <nav className="border-b border-borderDark bg-charcoal">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center">
              <img src={logo} alt="Cravo" className="h-10 w-auto" />
            </Link>

            <button
              onClick={() => setAddressModalOpen(true)}
              className="hidden sm:block text-warmGray hover:text-gold text-sm truncate max-w-50"
            >
              📍 {address || 'Set delivery location'}
            </button>
          </div>

          <div className="flex items-center gap-4 text-sm">
            {isLoggedIn && (
              <Link to="/favorites" className="text-offwhite hover:text-gold transition-colors">
                Favorites
              </Link>
            )}
            {isLoggedIn && (
              <Link to="/orders" className="text-offwhite hover:text-gold transition-colors">
                My Orders
              </Link>
            )}
            {isLoggedIn && user?.isAdmin && (
              <Link to="/admin" className="text-gold hover:text-champagne transition-colors">
                Admin
              </Link>
            )}

            <button  
              onClick={toggleTheme}  
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}  
              className="bg-slate border border-borderDark hover:border-gold rounded-lg px-3 py-1.5 text-offwhite transition-colors"
            >  
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            <button
              onClick={() => setCartOpen(true)}
              className="relative bg-slate border border-borderDark hover:border-gold rounded-lg px-3 py-1.5 text-offwhite transition-colors"
            >
              Cart
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gold text-charcoal text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            {isLoggedIn ? (
              <>
                <span className="text-warmGray">Hi, {user?.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-offwhite border border-borderDark rounded-lg px-3 py-1.5 hover:border-gold transition-colors"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-offwhite border border-borderDark rounded-lg px-3 py-1.5 hover:border-gold transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="bg-gold text-charcoal font-semibold rounded-lg px-3 py-1.5 hover:bg-champagne transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {addressModalOpen && (
        <AddressModal
          currentAddress={address}
          onClose={() => setAddressModalOpen(false)}
          onConfirm={(newAddress) => {
            setAddress(newAddress)
            setAddressModalOpen(false)
          }}
        />
      )}
    </>
  )
}