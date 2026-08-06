import dotenv from 'dotenv'
dotenv.config()

import http from 'http'
import { connectDB } from './config/db.js'
import app from './app.js'
import { initSocket } from './socket/index.js'

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET in .env — server cannot start safely.')
  process.exit(1)
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason)
})

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err)
  process.exit(1)
})

connectDB()

const server = http.createServer(app)
initSocket(server)

const PORT = process.env.PORT || 5000
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))