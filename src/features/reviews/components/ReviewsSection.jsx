import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useReviews, useAddReview, useDeleteReview } from '../hooks/useReviews'
import { useAuthStore } from '../../auth/store/authStore'
import ConfirmDialog from '../../../shared/components/ConfirmDialog'
import { toast } from '../../../store/toastStore'

function StarPicker({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          className={'text-2xl leading-none ' + (star <= value ? 'text-gold' : 'text-borderDark')}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function ReviewsSection({ restaurantId }) {
  const navigate = useNavigate()
  const location = useLocation()

  const { user, isLoggedIn } = useAuthStore()

  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  const { data: reviews, isLoading, isError } = useReviews(restaurantId)
  const addReviewMutation = useAddReview(restaurantId)
  const deleteReviewMutation = useDeleteReview(restaurantId)
  const isSubmitting = addReviewMutation.isPending
  const [pendingDeleteId, setPendingDeleteId] = useState(null)

  async function handleConfirmDelete() {
    try {
      await deleteReviewMutation.mutateAsync(pendingDeleteId)
      toast.success('Review deleted.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setPendingDeleteId(null)
    }
  }

  const averageRating =
    reviews && reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null

  function handleWriteReviewClick() {
    if (!isLoggedIn) {
      navigate(`/login?next=${encodeURIComponent(location.pathname)}`)
      return
    }
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    try {
      await addReviewMutation.mutateAsync({
        restaurantId,
        userId: user.id,
        userName: user.name,
        rating,
        comment,
      })
      setComment('')
      setRating(5)
      setShowForm(false)
      toast.success('Review submitted!')
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
    }
  }

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-champagne text-xl">
          Reviews {averageRating && <span className="text-gold text-base">({averageRating} ★)</span>}
        </h2>
        {!showForm && (
          <button
            onClick={handleWriteReviewClick}
            className="text-sm bg-slate border border-borderDark hover:border-gold rounded-lg px-3 py-1.5 text-offwhite transition-colors"
          >
            Write a Review
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-slate border border-borderDark rounded-xl p-5 mb-6 flex flex-col gap-3"
        >
          <div>
            <label className="block text-sm text-warmGray mb-1">Your Rating</label>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="block text-sm text-warmGray mb-1">Your Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="How was the food and delivery?"
              className="w-full bg-charcoal border border-borderDark rounded-lg px-4 py-2 text-offwhite focus:outline-none focus:border-gold resize-none"
            />
          </div>

          {error && <p className="text-error text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gold text-charcoal font-semibold rounded-lg px-4 py-2 text-sm hover:bg-champagne transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false) }
              
              className="text-warmGray text-sm hover:text-offwhite"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading && <p className="text-warmGray text-sm">Loading reviews...</p>}
      {isError && <p className="text-error text-sm">Couldn't load reviews.</p>}

      {!isLoading && !isError && reviews && reviews.length === 0 && (
        <p className="text-warmGray text-sm">No reviews yet. Be the first to write one!</p>
      )}

      {!isLoading && !isError && reviews && reviews.length > 0 && (
        <div className="flex flex-col gap-4">
          {reviews.map((r) => {
            const canDelete = isLoggedIn && (r.userId === user?.id || user?.isAdmin)
            return (
              <div key={r.id} className="border-b border-borderDark pb-4 last:border-b-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-offwhite font-medium">{r.userName}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-gold text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    {canDelete && (
                      <button
                        onClick={() => setPendingDeleteId(r.id)}
                        className="text-xs text-error hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-warmGray text-sm">{r.comment}</p>
                <p className="text-warmGray text-xs mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
            )
          })}
        </div>
      )}

      {pendingDeleteId !== null && (
        <ConfirmDialog
          title="Delete review?"
          message="This cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleConfirmDelete}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}
    </div>
  )
}