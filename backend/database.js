// backend/database.js
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config();

// Load Aiven SSL certificate
const caCertPath = path.join(process.cwd(), "certs", "ca.pem");

// Aiven MySQL pool config
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 24245,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    ca: fs.readFileSync(caCertPath)
  }
});

// Initialize database + sample tables/menu
async function initialize() {
  try {
    // Test connection
    await db.query("SELECT 1");
    console.log("✅ Connected to Aiven MySQL");

    // Create tables
    await db.query(`
      CREATE TABLE IF NOT EXISTS tables (
        id INT AUTO_INCREMENT PRIMARY KEY,
        table_number VARCHAR(50) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        table_id INT NOT NULL,
        items TEXT NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (table_id) REFERENCES tables(id)
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category VARCHAR(50) NOT NULL,
        available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        table_id INT NOT NULL,
        reserved_time DATETIME NOT NULL,
        status VARCHAR(20) DEFAULT 'reserved',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (table_id) REFERENCES tables(id)
      )
    `);

    // Insert T1–T10
    for (let i = 1; i <= 10; i++) {
      await db.query(
        `INSERT IGNORE INTO tables (table_number, status) VALUES (?, ?)`,
        [`T${i}`, "available"]
      );
    }

    console.log("🎉 DB initialized!");
  } catch (err) {
    console.error("❌ DB init error:", err);
  }
}

// Helper functions using pool
async function run(query, params = []) {
  const [result] = await db.query(query, params);
  return result;
}

async function get(query, params = []) {
  const [rows] = await db.query(query, params);
  return rows[0] || null;
}

async function all(query, params = []) {
  const [rows] = await db.query(query, params);
  return rows;
}

module.exports = {
  db,          // export pool directly for server.js
  initialize,
  run,
  get,
  all
};