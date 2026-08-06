import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useLocationStore = create(
  persist(
    (set) => ({
      address: null,
      setAddress: (address) => set({ address }),
    }),
    { name: 'cravo-location' }
  )
)