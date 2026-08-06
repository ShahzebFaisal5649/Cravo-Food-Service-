import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from './cartStore'

describe('cartStore', () => {
  beforeEach(() => {
    useCartStore.setState({ restaurantId: null, restaurantName: null, items: [] })
  })

  it('adds a new item to an empty cart', () => {
    useCartStore.getState().addItem('r1', 'Pizza Place', { itemId: 'i1', variant: null, quantity: 1 })
    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().restaurantId).toBe('r1')
  })

  it('increments quantity when the same item+variant is added again', () => {
    const item = { itemId: 'i1', variant: 'Large', quantity: 1 }
    useCartStore.getState().addItem('r1', 'Pizza Place', item)
    useCartStore.getState().addItem('r1', 'Pizza Place', item)
    expect(useCartStore.getState().items[0].quantity).toBe(2)
  })

  it('replaces the cart when adding an item from a different restaurant', () => {
    useCartStore.getState().addItem('r1', 'Pizza Place', { itemId: 'i1', variant: null, quantity: 1 })
    useCartStore.getState().addItem('r2', 'Burger Joint', { itemId: 'i2', variant: null, quantity: 1 })
    const state = useCartStore.getState()
    expect(state.restaurantId).toBe('r2')
    expect(state.items).toHaveLength(1)
    expect(state.items[0].itemId).toBe('i2')
  })

  it('mergeCart merges quantities when restaurant matches', () => {
    useCartStore.getState().addItem('r1', 'Pizza Place', { itemId: 'i1', variant: null, quantity: 1 })
    useCartStore.getState().mergeCart({
      restaurantId: 'r1',
      restaurantName: 'Pizza Place',
      items: [{ itemId: 'i1', variant: null, quantity: 2 }],
    })
    expect(useCartStore.getState().items[0].quantity).toBe(3)
  })

  it('mergeCart returns false when restaurants conflict and does not touch the cart', () => {
    useCartStore.getState().addItem('r1', 'Pizza Place', { itemId: 'i1', variant: null, quantity: 1 })
    const result = useCartStore.getState().mergeCart({
      restaurantId: 'r2',
      restaurantName: 'Burger Joint',
      items: [{ itemId: 'i2', variant: null, quantity: 1 }],
    })
    expect(result).toBe(false)
    expect(useCartStore.getState().items).toHaveLength(1)
  })
})