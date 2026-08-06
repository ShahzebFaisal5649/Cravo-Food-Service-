import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../app.js'
import Restaurant from '../models/Restaurant.js'
import MenuItem from '../models/MenuItem.js'
import { connectTestDB, closeTestDB, clearTestDB } from './setup.js'

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_secret_key'
  await connectTestDB()
})

afterAll(async () => {
  await closeTestDB()
})

beforeEach(async () => {
  await clearTestDB()
})

describe('Restaurants (public)', () => {
  it('lists all restaurants', async () => {
    await Restaurant.create({ name: 'Karachi Broasts', cuisine: 'Fast Food' })
    await Restaurant.create({ name: 'Sweet Affair', cuisine: 'Desserts' })

    const res = await request(app).get('/api/restaurants')
    expect(res.status).toBe(200)
    expect(res.body.length).toBe(2)
  })

  it('gets a single restaurant by id', async () => {
    const r = await Restaurant.create({ name: 'Bundu Khan', cuisine: 'BBQ & Desi' })

    const res = await request(app).get(`/api/restaurants/${r._id}`)
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Bundu Khan')
  })

  it('returns 404 for a restaurant that does not exist', async () => {
    const fakeId = '507f1f77bcf86cd799439011'
    const res = await request(app).get(`/api/restaurants/${fakeId}`)
    expect(res.status).toBe(404)
  })

  it('returns 400 for a malformed restaurant id', async () => {
    const res = await request(app).get('/api/restaurants/not-a-valid-id')
    expect(res.status).toBe(400)
  })

  it("lists a restaurant's menu items", async () => {
    const r = await Restaurant.create({ name: 'Pizza Pointt', cuisine: 'Pizza' })
    await MenuItem.create({
      restaurantId: r._id, name: 'Margherita', category: 'Pizza', price: 800,
    })
    await MenuItem.create({
      restaurantId: r._id, name: 'Pepperoni', category: 'Pizza', price: 950,
    })

    const res = await request(app).get(`/api/restaurants/${r._id}/menu`)
    expect(res.status).toBe(200)
    expect(res.body.length).toBe(2)
  })
})