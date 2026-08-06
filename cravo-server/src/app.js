import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import pinoHttp from 'pino-http'
import routes from './routes/index.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'
import helmet from 'helmet'

const app = express()
app.use(helmet())

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())

app.use(
  cors({
    origin: (origin, callback) => {
      // No origin header = server-to-server / curl / Postman — allow it.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
  })
)
app.use(express.json())
app.use(cookieParser())

// Structured JSON logs in production (parseable by log tools), pretty logs in dev.
if (process.env.NODE_ENV === 'production') {
  app.use(
    pinoHttp({
      redact: ['req.headers.authorization', 'req.headers.cookie'],
      customSuccessMessage: (req, res) => `${req.method} ${req.url} completed`,
      customErrorMessage: (req, res, err) => `${req.method} ${req.url} errored: ${err.message}`,
    })
  )
} else {
  app.use(morgan('dev'))
}

app.use('/api', routes)

app.get('/', (req, res) => res.send('Cravo API is running'))
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }))

app.use(notFound)
app.use(errorHandler)

export default app