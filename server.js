const express = require("express")
const { Pool } = require("pg")
const WebSocket = require("ws")
const path = require("path")
const dotenv = require("dotenv")

const app = express()
const server = require("http").createServer(app)

dotenv.config()
// PostgreSQL client setup
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: "localhost",
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
})

pool.query("SELECT 1", (err, res) => {
  if (err) {
    console.error("Database connection error:", err)
  } else {
    console.log("Database connection successful")
  }
})
// Middleware to parse JSON bodies
app.use(express.json())

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")))

// Serve the dashboard
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

app.get("/api/carbon-index", async (req, res) => {
  try {
    console.log("Fetching data from carbon_index table...")
    const result = await pool.query("SELECT * FROM public.carbon_index")
    console.log("Data fetched from database:", result.rows) // Debugging statement
    res.json(result.rows)
  } catch (err) {
    console.error("Error fetching data:", err)
    res.status(500).send("Server error")
  }
})

// WebSocket server setup
const wss = new WebSocket.Server({ server })
const dashboardClients = new Set()

wss.on("connection", async (ws) => {
  console.log("Dashboard client connected")
  dashboardClients.add(ws)

  try {
    const result = await pool.query(
      "SELECT timestamp, location, carbon_index FROM carbon_index ORDER BY timestamp DESC LIMIT 50"
    )
    ws.send(JSON.stringify(result.rows.reverse())) // Send in chronological order
  } catch (error) {
    console.error("Error fetching initial data:", error)
  }

  ws.on("close", () => {
    console.log("Dashboard client disconnected")
    dashboardClients.delete(ws)
  })
})

const PORT = 3000
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
