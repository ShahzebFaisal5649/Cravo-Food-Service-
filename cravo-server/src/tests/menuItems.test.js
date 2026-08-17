import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../app.js'
import User from '../models/User.js'
import Restaurant from '../models/Restaurant.js'
import MenuItem from '../models/MenuItem.js'
import { connectTestDB, closeTestDB, clearTestDB } from './setup.js'

let adminToken
let restaurantId

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_secret_key'
  process.env.REFRESH_TOKEN_SECRET = 'test_refresh_secret_key'

  await connectTestDB()
})

afterAll(async () => {
  await closeTestDB()
})

beforeEach(async () => {
  await clearTestDB()

  const restaurant = await Restaurant.create({
    name: 'Test Diner',
    cuisine: 'Test',
  })

  restaurantId = restaurant._id.toString()

  const adminSignup = await request(app)
    .post('/api/auth/signup')
    .send({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'password123',
    })

  console.log('ADMIN SIGNUP:', adminSignup.status, adminSignup.body)

  expect(adminSignup.status).toBe(201)

  await User.findOneAndUpdate(
    { email: 'admin@example.com' },
    { isAdmin: true },
  )

  adminToken = adminSignup.body.token
})

describe('Admin — menu items', () => {
  it('creates a menu item', async () => {
    const res = await request(app)
      .post('/api/admin/menu-items')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        restaurantId,
        name: 'Zinger Burger',
        category: 'Burgers',
        price: 650,
      })

    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Zinger Burger')
  })

  it('rejects a menu item with a negative price', async () => {
    const res = await request(app)
      .post('/api/admin/menu-items')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        restaurantId,
        name: 'Broken Item',
        category: 'Burgers',
        price: -50,
      })

    expect(res.status).toBe(400)
  })

  it('updates a menu item', async () => {
    const item = await MenuItem.create({
      restaurantId,
      name: 'Chicken Broast',
      category: 'Fast Food',
      price: 500,
    })

    const res = await request(app)
      .put(`/api/admin/menu-items/${item._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        price: 550,
      })

    expect(res.status).toBe(200)
    expect(res.body.price).toBe(550)
  })

  it('deletes a menu item', async () => {
    const item = await MenuItem.create({
      restaurantId,
      name: 'Fries',
      category: 'Sides',
      price: 200,
    })

    const res = await request(app)
      .delete(`/api/admin/menu-items/${item._id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)

    const stillThere = await MenuItem.findById(item._id)

    expect(stillThere).toBeNull()
  })
})