import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../app.js'
import Restaurant from '../models/Restaurant.js'
import { connectTestDB, closeTestDB, clearTestDB } from './setup.js'

let authorToken, otherToken, restaurantId

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_secret_key'
  await connectTestDB()
})

afterAll(async () => {
  await closeTestDB()
})

beforeEach(async () => {
  await clearTestDB()

  const restaurant = await Restaurant.create({ name: 'Review Spot', cuisine: 'Test' })
  restaurantId = restaurant._id.toString()

  const authorSignup = await request(app).post('/api/auth/signup').send({
    name: 'Author', email: 'author@example.com', password: 'password123',
  })
  authorToken = authorSignup.body.token

  const otherSignup = await request(app).post('/api/auth/signup').send({
    name: 'Other', email: 'other2@example.com', password: 'password123',
  })
  otherToken = otherSignup.body.token
})

describe('Reviews', () => {
  it('lets a logged-in user add a review', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ restaurantId, rating: 5, comment: 'Great food' })
    expect(res.status).toBe(201)
  })

  it('lets the review author delete their own review (regression test for the ObjectId-vs-string bug)', async () => {
    const added = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ restaurantId, rating: 4, comment: 'Pretty good' })

    const res = await request(app)
      .delete(`/api/reviews/${added.body.id}`)
      .set('Authorization', `Bearer ${authorToken}`)
    expect(res.status).toBe(200)
  })

  it('blocks a different user from deleting someone else\'s review', async () => {
    const added = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ restaurantId, rating: 4, comment: 'Pretty good' })

    const res = await request(app)
      .delete(`/api/reviews/${added.body.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
    expect(res.status).toBe(403)
  })
})