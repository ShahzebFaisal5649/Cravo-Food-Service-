import { describe, it, expect } from 'vitest'
import { ORDER_STATUSES } from './orderStatuses'

describe('orderStatuses', () => {
  it('exports statuses in the correct progression order', () => {
    expect(ORDER_STATUSES).toEqual(
      expect.arrayContaining(['placed', 'preparing', 'on the way', 'delivered'])
    )
  })
})