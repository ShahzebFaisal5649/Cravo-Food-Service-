import { useState } from 'react'
import { createRestaurant, updateRestaurant } from '../services/adminApi'
import { toast } from '../../../store/toastStore'

const ADD_NEW_CUISINE = '__add_new__'

export default function RestaurantFormModal({ restaurant, existingCuisines = [], onClose, onSaved }) {
  const editing = Boolean(restaurant && restaurant.id)

  const initialCuisine = restaurant?.cuisine || ''
  const [cuisine, setCuisine] = useState(initialCuisine)
  const [cuisineMode, setCuisineMode] = useState(
    initialCuisine && !existingCuisines.includes(initialCuisine) ? ADD_NEW_CUISINE : 'select'
  )
  const [name, setName] = useState(restaurant?.name || '')
  const [rating, setRating] = useState(restaurant?.rating ?? 4.0)
  const [deliveryTime, setDeliveryTime] = useState(restaurant?.deliveryTime || '')
  const [isOpen, setIsOpen] = useState(restaurant?.isOpen ?? true)
  const [minOrder, setMinOrder] = useState(restaurant?.minOrder ?? 300)
  const [deliveryFee, setDeliveryFee] = useState(restaurant?.deliveryFee ?? 60)
  const [address, setAddress] = useState(restaurant?.address || '')

  const [imageFile, setImageFile] = useState('')
  const [imageUrl, setImageUrl] = useState(
    restaurant?.image && !restaurant.image.startsWith('data:') ? restaurant.image : ''
  )
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) {
      setImageFile('')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setImageFile(reader.result)
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!name.trim() || !cuisine.trim() || !address.trim()) {
      setError('Name, cuisine, and address are required.')
      return
    }

    if (imageFile && imageUrl) {
      setError('Please provide either an uploaded image or an image URL, not both.')
      return
    }

    const finalImage = imageFile || imageUrl || restaurant?.image || undefined

    const data = {
      name: name.trim(),
      cuisine: cuisine.trim(),
      rating: Number(rating),
      deliveryTime: deliveryTime.trim(),
      isOpen,
      minOrder: Number(minOrder),
      deliveryFee: Number(deliveryFee),
      address: address.trim(),
      image: finalImage,
    }

    setIsSubmitting(true)
    try {
      if (editing) {
        await updateRestaurant(restaurant.id, data)
        toast.success('Restaurant updated.')
      } else {
        await createRestaurant(data)
        toast.success('Restaurant added.')
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-60 p-4" onClick={onClose}>
      <div
        className="bg-slate w-full max-w-lg rounded-2xl border border-borderDark p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-gold text-xl mb-4">
          {editing ? 'Edit Restaurant' : 'Add Restaurant'}
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-warmGray mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-charcoal border border-borderDark rounded-lg px-4 py-2 text-offwhite focus:outline-none focus:border-gold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-warmGray mb-1">Cuisine</label>
              {cuisineMode === ADD_NEW_CUISINE ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="New cuisine name"
                    value={cuisine}
                    onChange={(e) => setCuisine(e.target.value)}
                    className="w-full bg-charcoal border border-borderDark rounded-lg px-4 py-2 text-offwhite focus:outline-none focus:border-gold"
                  />
                  {existingCuisines.length > 0 && (
                    <button
                      type="button"
                      onClick={() => { setCuisineMode('select'); setCuisine(existingCuisines[0] || '') }}
                      className="text-xs text-warmGray hover:text-gold whitespace-nowrap"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ) : (
                <select
                  value={cuisine}
                  onChange={(e) => {
                    if (e.target.value === ADD_NEW_CUISINE) {
                      setCuisineMode(ADD_NEW_CUISINE)
                      setCuisine('')
                    } else {
                      setCuisine(e.target.value)
                    }
                  }}
                  className="w-full bg-charcoal border border-borderDark rounded-lg px-4 py-2 text-offwhite focus:outline-none focus:border-gold"
                >
                  <option value="" disabled>Select cuisine...</option>
                  {existingCuisines.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value={ADD_NEW_CUISINE}>+ Add new cuisine...</option>
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm text-warmGray mb-1">Rating (0-5)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full bg-charcoal border border-borderDark rounded-lg px-4 py-2 text-offwhite focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-warmGray mb-1">Delivery Time</label>
              <input
                type="text"
                placeholder="e.g. 30-40 min"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="w-full bg-charcoal border border-borderDark rounded-lg px-4 py-2 text-offwhite focus:outline-none focus:border-gold"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-offwhite">
                <input type="checkbox" checked={isOpen} onChange={(e) => setIsOpen(e.target.checked)} />
                Currently open
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-warmGray mb-1">Minimum Order (Rs.)</label>
              <input
                type="number"
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
                className="w-full bg-charcoal border border-borderDark rounded-lg px-4 py-2 text-offwhite focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-sm text-warmGray mb-1">Delivery Fee (Rs.)</label>
              <input
                type="number"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                className="w-full bg-charcoal border border-borderDark rounded-lg px-4 py-2 text-offwhite focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-warmGray mb-1">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-charcoal border border-borderDark rounded-lg px-4 py-2 text-offwhite focus:outline-none focus:border-gold"
            />
          </div>

          <div className="border-t border-borderDark pt-4">
            <label className="block text-sm text-warmGray mb-1">Image — upload OR paste a URL, not both</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-offwhite text-sm mb-2"
            />
            <input
              type="text"
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              disabled={Boolean(imageFile)}
              className="w-full bg-charcoal border border-borderDark rounded-lg px-4 py-2 text-offwhite focus:outline-none focus:border-gold disabled:opacity-50"
            />
          </div>

          {error && <p className="text-error text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-borderDark text-offwhite rounded-lg py-2 hover:border-gold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gold text-charcoal font-semibold rounded-lg py-2 hover:bg-champagne transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editing ? 'Save Changes' : 'Add Restaurant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}