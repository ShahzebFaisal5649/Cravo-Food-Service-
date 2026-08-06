import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { signup } from '../services/authApi'
import { useAuthStore } from '../store/authStore'
import { toast } from '../../../store/toastStore'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const nextPath = searchParams.get('next')
  const redirectTo = nextPath || '/'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      const user = await signup({ name, email, password })
     
      useAuthStore.getState().login(user)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="font-display text-gold text-3xl mb-6 text-center">Sign Up</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-warmGray mb-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate border border-borderDark rounded-lg px-4 py-2 text-offwhite focus:outline-none focus:border-gold"
            placeholder="Your name"
          />
        </div>

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
            placeholder="At least 6 characters"
          />
        </div>

        <div>
          <label className="block text-sm text-warmGray mb-1">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-slate border border-borderDark rounded-lg px-4 py-2 text-offwhite focus:outline-none focus:border-gold"
            placeholder="Re-enter password"
          />
        </div>

        {error && <p className="text-error text-sm">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-gold text-charcoal font-semibold rounded-lg py-2 mt-2 hover:bg-champagne transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <p className="text-warmGray text-sm text-center mt-6">
        Already have an account?{' '}
        <Link
          to={nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : '/login'}
          className="text-gold hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  )
}