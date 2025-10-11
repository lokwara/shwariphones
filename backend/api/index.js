import { ApolloServer } from "@apollo/server"
import { expressMiddleware } from "@apollo/server/express4"
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer"

import http from "http"
import express from "express"
import cors from "cors"

import resolvers from "../resolvers.js"
import typeDefs from "../typeDefs.js"
import dotenv from "dotenv"

dotenv.config()

const app = express()

const httpServer = http.createServer(app)

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== "production",
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
})

console.log("Supabase backend ready")

await server.start()

process.stdin.resume()

app.use(
  cors({
    origin: ["https://www.shwariphones.africa", "http://localhost:3000"],
    credentials: true,
  })
)
app.use(express.json())
app.use(expressMiddleware(server))

export default httpServer
