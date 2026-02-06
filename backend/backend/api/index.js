import { ApolloServer } from "@apollo/server"
import { expressMiddleware } from "@apollo/server/express4"
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer"

import http from "http"
import express from "express"
import cors from "cors"
import * as Sentry from "@sentry/node"

import resolvers from "../resolvers.js"
import typeDefs from "../typeDefs.js"
import dotenv from "dotenv"
import { apiLimiter } from "../middleware/rateLimiter.js"

dotenv.config()

const app = express()
const httpServer = http.createServer(app)
const PORT = process.env.PORT || 4003

const tracesSampleRate = Number(
  process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1
)

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0.1,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
  ],
})

app.use(Sentry.Handlers.requestHandler())
app.use(Sentry.Handlers.tracingHandler())

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== "production",
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
})

console.log("Supabase backend ready")

try {
  await server.start()
  console.log("✅ Apollo Server started successfully")
} catch (error) {
  console.error("❌ Failed to start Apollo Server:", error)
  process.exit(1)
}

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || "https://www.shwariphones.africa",
  "http://localhost:3000",
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : [])
]

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true)
      
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === "development") {
        callback(null, true)
      } else {
        callback(new Error("Not allowed by CORS"))
      }
    },
    credentials: true,
  })
)

app.use(express.json())

// Health check endpoint (no rate limiting)
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  })
})

// Apply rate limiting to GraphQL endpoint
// 60 requests per minute per IP - prevents abuse while allowing normal usage
app.use("/graphql", apiLimiter)

// GraphQL endpoint
app.use("/graphql", expressMiddleware(server))

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "Shwari Phones GraphQL API",
    graphql: "/graphql",
    health: "/health"
  })
})

app.use(Sentry.Handlers.errorHandler())

// Start server - Always start in production/Railway environment
// In development, dev.js will handle starting the server
// Railway sets PORT automatically, so if PORT is set, we're in production
const startServer = () => {
  try {
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 GraphQL server ready at http://localhost:${PORT}/graphql`)
      console.log(`📊 Health check: http://localhost:${PORT}/health`)
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`)
      console.log(`🔌 Listening on 0.0.0.0:${PORT}`)
    })
    
    httpServer.on('error', (error) => {
      console.error('❌ Server error:', error)
      process.exit(1)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Railway always sets PORT, so check for that
if (process.env.PORT || process.env.NODE_ENV === 'production' || process.env.AUTO_START === 'true' || process.env.RAILWAY_ENVIRONMENT) {
  startServer()
} else {
  console.log('⚠️ Server not started - running in development mode. Use dev.js to start.')
  console.log('⚠️ PORT:', process.env.PORT || 'not set')
  console.log('⚠️ NODE_ENV:', process.env.NODE_ENV || 'not set')
}

export default httpServer
