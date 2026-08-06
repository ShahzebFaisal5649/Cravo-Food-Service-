import { useState } from 'react'
import { createMenuItem, updateMenuItem } from '../services/adminApi'
import { toast } from '../../../store/toastStore'

export default function MenuItemFormModal({ menuItem, restaurants, defaultRestaurantId, onClose, onSaved }) {
  const editing = Boolean(menuItem && menuItem.id)

  const [restaurantId, setRestaurantId] = useState(
    String(menuItem?.restaurantId || defaultRestaurantId || '')
  )
  const [name, setName] = useState(menuItem?.name || '')
  const [category, setCategory] = useState(menuItem?.category || '')
  const [price, setPrice] = useState(menuItem?.price ?? 0)
  const [description, setDescription] = useState(menuItem?.description || '')
  const [variants, setVariants] = useState(menuItem?.variants || [])

  // Image: uploaded file (base64) OR pasted URL, never both — same rule as restaurants.
  const [imageFile, setImageFile] = useState('')
  const [imageUrl, setImageUrl] = useState(
    menuItem?.image && !menuItem.image.startsWith('data:') ? menuItem.image : ''
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

  function addVariantRow() {
    setVariants([...variants, { name: '', priceModifier: 0 }])
  }

  function updateVariantRow(index, field, value) {
    setVariants(
      variants.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    )
  }

  function removeVariantRow(index) {
    setVariants(variants.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!restaurantId || !name.trim() || !category.trim()) {
      setError('Restaurant, name, and category are required.')
      return
    }

    if (imageFile && imageUrl) {
      setError('Please provide either an uploaded image or an image URL, not both.')
      return
    }

    // Drop any variant rows the admin left with no name typed in
    const cleanVariants = variants
      .filter((v) => v.name.trim())
      .map((v) => ({ name: v.name.trim(), priceModifier: Number(v.priceModifier) || 0 }))

    const finalImage = imageFile || imageUrl || menuItem?.image || ''

    const data = {
      restaurantId,
      name: name.trim(),
      category: category.trim(),
      price: Number(price),
      description: description.trim(),
      variants: cleanVariants,
      image: finalImage,
    }

    setIsSubmitting(true)
    try {
      if (editing) {
        await updateMenuItem(menuItem.id, data)
        toast.success('Menu item updated.')
      } else {
        await createMenuItem(data)
        toast.success('Menu item added.')
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
          {editing ? 'Edit Menu Item' : 'Add Menu Item'}
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-warmGray mb-1">Restaurant</label>
            <select
              value={restaurantId}
              onChange={(e) => setRestaurantId(e.target.value)}
              className="w-full bg-charcoal border border-borderDark rounded-lg px-4 py-2 text-offwhite focus:outline-none focus:border-gold"
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-warmGray mb-1">Item Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-charcoal border border-borderDark rounded-lg px-4 py-2 text-offwhite focus:outline-none focus:border-gold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-warmGray mb-1">Category</label>
              <input
                type="text"
                placeholder="e.g. Burgers"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-charcoal border border-borderDark rounded-lg px-4 py-2 text-offwhite focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-sm text-warmGray mb-1">Base Price (Rs.)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-charcoal border border-borderDark rounded-lg px-4 py-2 text-offwhite focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-warmGray mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-charcoal border border-borderDark rounded-lg px-4 py-2 text-offwhite focus:outline-none focus:border-gold"
            />
          </div>

          <div className="border-t border-borderDark pt-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm text-warmGray">Variants (optional)</label>
              <button
                type="button"
                onClick={addVariantRow}
                className="text-xs text-gold hover:text-champagne"
              >
                + Add Variant
              </button>
            </div>

            {variants.length === 0 && (
              <p className="text-warmGray text-xs">No variants — this item will be a single fixed price.</p>
            )}

            <div className="flex flex-col gap-2">
              {variants.map((v, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Name, e.g. Large"
                    value={v.name}
                    onChange={(e) => updateVariantRow(index, 'name', e.target.value)}
                    className="flex-1 bg-charcoal border border-borderDark rounded-lg px-3 py-1.5 text-offwhite text-sm focus:outline-none focus:border-gold"
                  />
                  <input
                    type="number"
                    placeholder="+/- Rs."
                    value={v.priceModifier}
                    onChange={(e) => updateVariantRow(index, 'priceModifier', e.target.value)}
                    className="w-28 bg-charcoal border border-borderDark rounded-lg px-3 py-1.5 text-offwhite text-sm focus:outline-none focus:border-gold"
                  />
                  <button
                    type="button"
                    onClick={() => removeVariantRow(index)}
                    className="text-error text-sm px-2"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
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
              {isSubmitting ? 'Saving...' : editing ? 'Save Changes' : 'Add Menu Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}