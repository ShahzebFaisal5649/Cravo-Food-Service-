import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function getOrCreateGuestId() {
  let guestId = localStorage.getItem('cravo-guest-id')
  if (!guestId) {
    guestId = 'guest-' + Date.now() + '-' + Math.random().toString(36).slice(2)
    localStorage.setItem('cravo-guest-id', guestId)
  }
  return guestId
}

export const useCartStore = create(
  persist(
    (set, get) => ({
      restaurantId: null,
      restaurantName: null,
      items: [], 
      guestId: getOrCreateGuestId(),

      addItem: (restaurantId, restaurantName, item) => {
        const state = get()
        
        if (state.restaurantId && state.restaurantId !== restaurantId) {
          set({ restaurantId, restaurantName, items: [item] })
          return
        }
        const existing = state.items.find(
          (i) => i.itemId === item.itemId && i.variant === item.variant
        )
        if (existing) {
          set({
            items: state.items.map((i) =>
              i.itemId === item.itemId && i.variant === item.variant
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          })
        } else {
          set({ restaurantId, restaurantName, items: [...state.items, item] })
        }
      },

      removeItem: (itemId, variant) => {
        set({ items: get().items.filter((i) => !(i.itemId === itemId && i.variant === variant)) })
      },

      updateQuantity: (itemId, variant, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId, variant)
          return
        }
        set({
          items: get().items.map((i) =>
            i.itemId === itemId && i.variant === variant ? { ...i, quantity } : i
          ),
        })
      },

      clearCart: () => set({ restaurantId: null, restaurantName: null, items: [] }),

      
      saveSnapshotForUser: (userId) => {
        const { items, restaurantId, restaurantName } = get()
        if (items.length === 0) {
          localStorage.removeItem(`cravo-user-cart-${userId}`)
          return
        }
        localStorage.setItem(
          `cravo-user-cart-${userId}`,
          JSON.stringify({ items, restaurantId, restaurantName })
        )
      },

      getSnapshotForUser: (userId) => {
        const raw = localStorage.getItem(`cravo-user-cart-${userId}`)
        if (!raw) return null
        try {
          return JSON.parse(raw)
        } catch {
          return null
        }
      },

      clearSnapshotForUser: (userId) => {
        localStorage.removeItem(`cravo-user-cart-${userId}`)
      },

      replaceCart: (snapshot) => {
        set({
          restaurantId: snapshot.restaurantId,
          restaurantName: snapshot.restaurantName,
          items: snapshot.items,
        })
      },

      mergeCart: (snapshot) => {
        const state = get()

        if (state.items.length === 0) {
          set({
            restaurantId: snapshot.restaurantId,
            restaurantName: snapshot.restaurantName,
            items: snapshot.items,
          })
          return
        }

        if (state.restaurantId !== snapshot.restaurantId) {
          return false
        }

        const merged = [...state.items]
        snapshot.items.forEach((savedItem) => {
          const match = merged.find(
            (i) => i.itemId === savedItem.itemId && i.variant === savedItem.variant
          )
          if (match) {
            match.quantity += savedItem.quantity
          } else {
            merged.push(savedItem)
          }
        })
        set({ items: merged })
      },
    }),
    { name: 'cravo-cart' }
  )
)