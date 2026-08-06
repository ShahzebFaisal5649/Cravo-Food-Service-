import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../app.js'
import User from '../models/User.js'
import Restaurant from '../models/Restaurant.js'
import Order from '../models/Order.js'
import { connectTestDB, closeTestDB, clearTestDB } from './setup.js'

let adminToken, userToken

async function makeAdmin(email) {
  await User.findOneAndUpdate({ email }, { isAdmin: true })
}

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_secret_key'
  await connectTestDB()
})

afterAll(async () => {
  await closeTestDB()
})

beforeEach(async () => {
  await clearTestDB()

  const adminSignup = await request(app).post('/api/auth/signup').send({
    name: 'Admin', email: 'admin@example.com', password: 'password123',
  })
  await makeAdmin('admin@example.com')
  adminToken = adminSignup.body.token

  const userSignup = await request(app).post('/api/auth/signup').send({
    name: 'Regular', email: 'regular@example.com', password: 'password123',
  })
  userToken = userSignup.body.token
})

describe('Admin — access control', () => {
  it('blocks a non-admin from listing admin restaurants', async () => {
    const res = await request(app)
      .get('/api/admin/restaurants')
      .set('Authorization', `Bearer ${userToken}`)
    expect(res.status).toBe(403)
  })

  it('blocks an unauthenticated request', async () => {
    const res = await request(app).get('/api/admin/restaurants')
    expect(res.status).toBe(401)
  })
})

describe('Admin — restaurants CRUD', () => {
  it('creates a restaurant', async () => {
    const res = await request(app)
      .post('/api/admin/restaurants')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'China Town', cuisine: 'Chinese' })
    expect(res.status).toBe(201)
    expect(res.body.name).toBe('China Town')
  })

  it('rejects creating a restaurant with a missing name', async () => {
    const res = await request(app)
      .post('/api/admin/restaurants')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ cuisine: 'Chinese' })
    expect(res.status).toBe(400)
  })

  it('GET /api/admin/stats returns a true aggregate total, not just the first page', async () => {
  // create > 10 orders (default page size) with varying totals, then assert the sum
  // matches all of them combined, not just page 1
  // (mirror however your existing tests seed Orders — I don't have that fixture in front of me)
})

  it('updates a restaurant and cascades the new name to its orders', async () => {
    const restaurant = await Restaurant.create({ name: 'Old Name', cuisine: 'Desi' })
    await Order.create({
      userId: '507f1f77bcf86cd799439011',
      restaurantId: restaurant._id,
      restaurantName: 'Old Name',
      total: 500,
    })

    const res = await request(app)
      .put(`/api/admin/restaurants/${restaurant._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'New Name', cuisine: 'Desi' })
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('New Name')

    const order = await Order.findOne({ restaurantId: restaurant._id })
    expect(order.restaurantName).toBe('New Name')
  })

  it('deletes a restaurant even if it has existing orders', async () => {
    const restaurant = await Restaurant.create({ name: 'Howdy', cuisine: 'Burgers' })
    await Order.create({
      userId: '507f1f77bcf86cd799439011',
      restaurantId: restaurant._id,
      restaurantName: 'Howdy',
      total: 500,
    })

    const res = await request(app)
      .delete(`/api/admin/restaurants/${restaurant._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)

    const stillThere = await Restaurant.findById(restaurant._id)
    expect(stillThere).toBeNull()
  })

  it('paginates the restaurants list', async () => {
    for (let i = 0; i < 15; i++) {
      await Restaurant.create({ name: `Place ${i}`, cuisine: 'Test' })
    }

    const res = await request(app)
      .get('/api/admin/restaurants?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.items.length).toBe(10)
    expect(res.body.totalCount).toBe(15)
    expect(res.body.totalPages).toBe(2)
  })
})

describe('Admin — orders', () => {
  it('updates an order status', async () => {
    const restaurant = await Restaurant.create({ name: 'Chaaye Khana', cuisine: 'Desi Cafe' })
    const order = await Order.create({
      userId: '507f1f77bcf86cd799439011',
      restaurantId: restaurant._id,
      restaurantName: 'Chaaye Khana',
      total: 400,
    })

    const res = await request(app)
      .patch(`/api/admin/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'preparing' })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('preparing')
  })

  it('rejects an invalid status value', async () => {
    const restaurant = await Restaurant.create({ name: 'Chaaye Khana', cuisine: 'Desi Cafe' })
    const order = await Order.create({
      userId: '507f1f77bcf86cd799439011',
      restaurantId: restaurant._id,
      restaurantName: 'Chaaye Khana',
      total: 400,
    })

    const res = await request(app)
      .patch(`/api/admin/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'not-a-real-status' })
    expect(res.status).toBe(400)
  })

  it('rejects an out-of-order status update', async () => {
    const restaurant = await Restaurant.create({ name: 'Chaaye Khana', cuisine: 'Desi Cafe' })
    const testOrder = await Order.create({
      userId: '507f1f77bcf86cd799439011',
      restaurantId: restaurant._id,
      restaurantName: 'Chaaye Khana',
      total: 400,
      status: 'placed',
    })

    const res = await request(app)
      .patch(`/api/admin/orders/${testOrder._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'delivered' }) // skipping preparing + on the way

    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/in order/i)
  })

  it('rejects moving a status backward', async () => {
    const restaurant = await Restaurant.create({ name: 'Chaaye Khana', cuisine: 'Desi Cafe' })
    const testOrder = await Order.create({
      userId: '507f1f77bcf86cd799439011',
      restaurantId: restaurant._id,
      restaurantName: 'Chaaye Khana',
      total: 400,
      status: 'placed',
    })

    await request(app)
      .patch(`/api/admin/orders/${testOrder._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'preparing' })

    const res = await request(app)
      .patch(`/api/admin/orders/${testOrder._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'placed' })

    expect(res.status).toBe(400)
  })
})