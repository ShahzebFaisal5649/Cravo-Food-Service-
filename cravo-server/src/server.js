import 'dotenv/config'
import http from 'http'

import { connectDB } from './config/db.js'
import { loadKeyVaultSecrets } from './config/keyVault.js'
import app from './app.js'
import { initSocket } from './socket/index.js'

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason)
})

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err)
  process.exit(1)
})

async function startServer() {
  try {
    console.log('Starting Cravo backend...')

    // Load sensitive configuration from Azure Key Vault
    await loadKeyVaultSecrets()

    // Validate required secrets after Key Vault loading
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is missing')
    }

    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing')
    }

    if (!process.env.REFRESH_TOKEN_SECRET) {
      throw new Error('REFRESH_TOKEN_SECRET is missing')
    }

    // Connect to MongoDB
    await connectDB()

    // Create HTTP server
    const server = http.createServer(app)

    // Initialize Socket.IO
    initSocket(server)

    const PORT = process.env.PORT || 5000

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Server startup failed:', error.message)
    process.exit(1)
  }
}

startServer()