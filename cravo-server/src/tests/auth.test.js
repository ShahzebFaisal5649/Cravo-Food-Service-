import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../app.js'
import { connectTestDB, closeTestDB, clearTestDB } from './setup.js'

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
})

describe('Auth', () => {
  it('signs up a new user and returns a token', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    })
    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
  })

  it('rejects signup with a duplicate email', async () => {
    await request(app).post('/api/auth/signup').send({
      name: 'First', email: 'dupe@example.com', password: 'password123',
    })
    const res = await request(app).post('/api/auth/signup').send({
      name: 'Second', email: 'dupe@example.com', password: 'password123',
    })
    expect(res.status).toBe(409)
  })

  it('logs in with correct credentials', async () => {
    await request(app).post('/api/auth/signup').send({
      name: 'Login User', email: 'login@example.com', password: 'password123',
    })
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com', password: 'password123',
    })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
  })

  it('rejects login with wrong password', async () => {
    await request(app).post('/api/auth/signup').send({
      name: 'Wrong Pass', email: 'wrongpass@example.com', password: 'password123',
    })
    const res = await request(app).post('/api/auth/login').send({
      email: 'wrongpass@example.com', password: 'nope',
    })
    expect(res.status).toBe(401)
  })

  it('rejects a protected route with no token', async () => {
    const res = await request(app).get('/api/orders/user/someid')
    expect(res.status).toBe(401)
  })
})
