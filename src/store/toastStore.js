import { create } from 'zustand'

let nextId = 1

export const useToastStore = create((set, get) => ({
  toasts: [], 

  showToast: (message, type = 'info') => {
    const id = nextId++
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))

    setTimeout(() => {
      get().removeToast(id)
    }, 4000)
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },
}))

// Convenience helpers so call sites read naturally, e.g. toast.error('...')
export const toast = {
  success: (message) => useToastStore.getState().showToast(message, 'success'),
  error: (message) => useToastStore.getState().showToast(message, 'error'),
  info: (message) => useToastStore.getState().showToast(message, 'info'),
}