const express = require("express")
const { Pool } = require("pg")
const WebSocket = require("ws")
const path = require("path")
const dotenv = require("dotenv")

const app = express()
const server = require("http").createServer(app)

dotenv.config()
// PostgreSQL setup
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: "postgres",
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
// Middleware to parse JSON
app.use(express.json())

// Serve files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")))

// Serve the dashboard
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

app.get("/api/carbon-index", async (req, res) => {
  try {
    console.log("Fetching data from carbon_index table...")
    const result = await pool.query("SELECT * FROM public.carbon_index")
    console.log("Data fetched from database:", result.rows)
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
    console.log("Fetching data from carbon_index table...")
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

// Auto add data to database
function simulateDataUpdate() {
  setInterval(async () => {
    const timestamp = new Date()
    const londonValue = 90 + Math.random() * 20
    const saigonValue = 100 + Math.random() * 30

    try {
      await pool.query(
        "INSERT INTO public.carbon_index (timestamp, location, carbon_index) VALUES ($1, $2, $3), ($1, $4, $5)",
        [timestamp, "London", londonValue, "Saigon", saigonValue]
      )

      const result = await pool.query(
        "SELECT timestamp, location, carbon_index FROM public.carbon_index ORDER BY timestamp DESC LIMIT 50"
      )

      dashboardClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(result.rows.reverse()))
        }
      })
    } catch (error) {
      console.error("Error updating data:", error)
    }
  }, 5000) // every 5 seconds
}

simulateDataUpdate()

const PORT = 3000
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
