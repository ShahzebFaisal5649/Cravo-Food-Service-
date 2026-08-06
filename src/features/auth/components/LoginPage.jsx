import { useState } from 'react'

import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { login } from '../services/authApi'
import { useAuthStore } from '../store/authStore'
import { useCartStore } from '../../cart/store/cartStore'
import CartMergeModal from './CartMergeModal'
import { toast } from '../../../store/toastStore'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [pendingUser, setPendingUser] = useState(null)
  const [pendingSnapshot, setPendingSnapshot] = useState(null)

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const nextPath = searchParams.get('next')
  const redirectTo = nextPath || '/'

  function finishLogin(user) {
    useAuthStore.getState().login(user)
    navigate(redirectTo, { replace: true })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please fill in both fields.')
      return
    }

    setIsSubmitting(true)
    try {
      const user = await login({ email, password })

      const cart = useCartStore.getState()
      const savedSnapshot = cart.getSnapshotForUser(user.id)

      if (savedSnapshot && cart.items.length > 0) {
        setPendingUser(user)
        setPendingSnapshot(savedSnapshot)
      } else if (savedSnapshot && cart.items.length === 0) {
        cart.replaceCart(savedSnapshot)
        finishLogin(user)
      } else {
        finishLogin(user)
      }
    } catch (err) {
      setError(err.message)
      toast.error(err.message) 
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleMergeBoth() {
    const merged = useCartStore.getState().mergeCart(pendingSnapshot)
    if (merged === false) {
      toast.error("Your saved cart was from a different restaurant, so it couldn't be merged. Keeping your current cart.")
    }
    useCartStore.getState().clearSnapshotForUser(pendingUser.id)
    finishLogin(pendingUser)
  }

  function handleKeepCurrent() {
    useCartStore.getState().clearSnapshotForUser(pendingUser.id)
    finishLogin(pendingUser)
  }

  function handleRestoreSaved() {
    useCartStore.getState().replaceCart(pendingSnapshot)
    useCartStore.getState().clearSnapshotForUser(pendingUser.id)
    finishLogin(pendingUser)
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="font-display text-gold text-3xl mb-6 text-center">Log In</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-warmGray mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate border border-borderDark rounded-lg px-4 py-2 text-offwhite focus:outline-none focus:border-gold"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm text-warmGray mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate border border-borderDark rounded-lg px-4 py-2 text-offwhite focus:outline-none focus:border-gold"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-error text-sm">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-gold text-charcoal font-semibold rounded-lg py-2 mt-2 hover:bg-champagne transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <p className="text-warmGray text-sm text-center mt-6">
        Don't have an account?{' '}
        <Link
          to={nextPath ? `/signup?next=${encodeURIComponent(nextPath)}` : '/signup'}
          className="text-gold hover:underline"
        >
          Sign up
        </Link>
      </p>

      <p className="text-warmGray text-xs text-center mt-4">
        Demo admin login: admin@cravo.com / admin123
      </p>

      {pendingUser && pendingSnapshot && (
        <CartMergeModal
          onKeepCurrent={handleKeepCurrent}
          onRestoreSaved={handleRestoreSaved}
          onMergeBoth={handleMergeBoth}
        />
      )}
    </div>
  )
}