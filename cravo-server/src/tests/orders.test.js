import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../app.js'
import Restaurant from '../models/Restaurant.js'
import { connectTestDB, closeTestDB, clearTestDB } from './setup.js'

let ownerToken, ownerId, otherToken, restaurantId

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_secret_key'
  await connectTestDB()
})

afterAll(async () => {
  await closeTestDB()
})

beforeEach(async () => {
  await clearTestDB()

  const restaurant = await Restaurant.create({ name: 'Test Diner', cuisine: 'Test' })
  restaurantId = restaurant._id.toString()

  const ownerSignup = await request(app).post('/api/auth/signup').send({
    name: 'Owner', email: 'owner@example.com', password: 'password123',
  })
  ownerToken = ownerSignup.body.token
  ownerId = ownerSignup.body.id

  const otherSignup = await request(app).post('/api/auth/signup').send({
    name: 'Other', email: 'other@example.com', password: 'password123',
  })
  otherToken = otherSignup.body.token
})

describe('Orders', () => {
  it('lets a logged-in user place an order', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ userId: ownerId, restaurantId, total: 25 })
    expect(res.status).toBe(201)
    expect(res.body.status).toBe('placed')
  })

  it('lets the order owner fetch their own order', async () => {
    const placed = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ userId: ownerId, restaurantId, total: 25 })

    const res = await request(app)
      .get(`/api/orders/${placed.body.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
    expect(res.status).toBe(200)
  })

  it('blocks a different user from fetching someone else\'s order (ObjectId ownership check)', async () => {
    const placed = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ userId: ownerId, restaurantId, total: 25 })

    const res = await request(app)
      .get(`/api/orders/${placed.body.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
    expect(res.status).toBe(403)
  })

  it('returns 400 (not 500) for a malformed order id', async () => {
    const res = await request(app)
      .get('/api/orders/not-a-valid-objectid')
      .set('Authorization', `Bearer ${ownerToken}`)
    expect(res.status).toBe(400)
  })
})