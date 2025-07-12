const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const helmet = require("helmet")
const compression = require("compression")
const morgan = require("morgan")
const rateLimit = require("express-rate-limit")
const { createServer } = require("http")
const { Server } = require("socket.io")
require("dotenv").config()

// Import routes
const authRoutes = require("./routes/auth")
const userRoutes = require("./routes/users")
const skillRoutes = require("./routes/skills")
const swapRoutes = require("./routes/swaps")
const adminRoutes = require("./routes/admin")
const uploadRoutes = require("./routes/upload")

// Import middleware
const { errorHandler } = require("./middleware/errorHandler")
// const { notFound } = require("./middleware/notFound")

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
})

// Security middleware
app.use(helmet())
app.use(compression())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
})
app.use("/api/", limiter)

// CORS configuration
app.use(
  cors(),
)

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Logging
app.use(morgan("combined"))

// Database connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb+srv://anshsardhara24:0nZFZvKhfmf4w1hU@cluster0.ykv2cg0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err))

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  socket.on("join-user-room", (userId) => {
    socket.join(`user-${userId}`)
  })

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)
  })
})

// Make io accessible to routes
app.set("io", io)

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/skills", skillRoutes)
app.use("/api/swaps", swapRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/upload", uploadRoutes)

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// Error handling middleware
// app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

module.exports = app
