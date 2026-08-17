import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../app.js'
import User from '../models/User.js'
import Restaurant from '../models/Restaurant.js'
import Favorite from '../models/Favorite.js'
import { connectTestDB, closeTestDB, clearTestDB } from './setup.js'

async function signupAndLogin(overrides = {}) {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ name: 'Test User', email: 'fav-test@example.com', password: 'password123', ...overrides })
  return res.body.token
}

describe('Favorites API', () => {
  beforeAll(async () => {
  process.env.JWT_SECRET = 'test_secret_key'
  process.env.REFRESH_TOKEN_SECRET = 'test_refresh_secret_key'
  await connectTestDB()
})
  afterAll(closeTestDB)
  beforeEach(clearTestDB)

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/favorites')
    expect(res.status).toBe(401)
  })

  it('adds and lists a favorite', async () => {
    const token = await signupAndLogin()
    const restaurant = await Restaurant.create({
      name: 'Test Diner', cuisine: 'American', address: '123 St',
      deliveryFee: 100, minOrder: 500, deliveryTime: '30 min', isOpen: true,
    })

    const addRes = await request(app)
      .post(`/api/favorites/${restaurant._id}`)
      .set('Authorization', `Bearer ${token}`)
    expect(addRes.status).toBe(201)

    const listRes = await request(app)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${token}`)
    expect(listRes.body).toEqual([restaurant._id.toString()])
  })

  it('is idempotent when favoriting the same restaurant twice', async () => {
    const token = await signupAndLogin()
    const restaurant = await Restaurant.create({
      name: 'Test Diner', cuisine: 'American', address: '123 St',
      deliveryFee: 100, minOrder: 500, deliveryTime: '30 min', isOpen: true,
    })
    await request(app).post(`/api/favorites/${restaurant._id}`).set('Authorization', `Bearer ${token}`)
    const secondRes = await request(app).post(`/api/favorites/${restaurant._id}`).set('Authorization', `Bearer ${token}`)
    expect(secondRes.status).toBe(201)
    const count = await Favorite.countDocuments({})
    expect(count).toBe(1)
  })

  it('removes a favorite', async () => {
    const token = await signupAndLogin()
    const restaurant = await Restaurant.create({
      name: 'Test Diner', cuisine: 'American', address: '123 St',
      deliveryFee: 100, minOrder: 500, deliveryTime: '30 min', isOpen: true,
    })
    await request(app).post(`/api/favorites/${restaurant._id}`).set('Authorization', `Bearer ${token}`)
    const delRes = await request(app)
      .delete(`/api/favorites/${restaurant._id}`)
      .set('Authorization', `Bearer ${token}`)
    expect(delRes.status).toBe(200)

    const listRes = await request(app).get('/api/favorites').set('Authorization', `Bearer ${token}`)
    expect(listRes.body).toEqual([])
  })
})