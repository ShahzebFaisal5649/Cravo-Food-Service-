import { Link } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/store/authStore'
import logo from '../../assets/images/logo.png'

export default function Footer() {
  const { isLoggedIn, user } = useAuthStore()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-borderDark mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8">
        <div className="col-span-2 sm:col-span-1">
          <img src={logo} alt="Cravo" className="h-10 w-auto mb-3" />
          <p className="text-warmGray text-sm">King of Cravings.</p>
        </div>

        <div>
          <h3 className="text-offwhite font-semibold text-sm mb-3">Explore</h3>
          <ul className="flex flex-col gap-2 text-sm">
            <li>
              <Link to="/" className="text-warmGray hover:text-gold transition-colors">
                Restaurants
              </Link>
            </li>
            <li>
              <Link to="/favorites" className="text-warmGray hover:text-gold transition-colors">
                Favorites
              </Link>
            </li>
            <li>
              <Link to="/orders" className="text-warmGray hover:text-gold transition-colors">
                My Orders
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-offwhite font-semibold text-sm mb-3">Account</h3>
          <ul className="flex flex-col gap-2 text-sm">
            {isLoggedIn ? (
              <>
                <li className="text-warmGray">Signed in as {user.name}</li>
                {user.isAdmin && (
                  <li>
                    <Link to="/admin" className="text-warmGray hover:text-gold transition-colors">
                      Admin Panel
                    </Link>
                  </li>
                )}
              </>
            ) : (
              <>
                <li>
                  <Link to="/login" className="text-warmGray hover:text-gold transition-colors">
                    Log In
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="text-warmGray hover:text-gold transition-colors">
                    Sign Up
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>

        <div>
          <h3 className="text-offwhite font-semibold text-sm mb-3">Contact</h3>
          <ul className="flex flex-col gap-2 text-sm">
            <li>
              {/* FIXED: Restored the complete <a> open tag layout below */}
              <a
                href="mailto:support@cravo.demo"
                className="text-warmGray hover:text-gold transition-colors"
              >
                support@cravo.demo
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-borderDark px-4 py-4 text-center text-warmGray text-xs">
        © {year} Cravo. This is a demo project — not a real ordering platform.
      </div>
    </footer>
  )
}