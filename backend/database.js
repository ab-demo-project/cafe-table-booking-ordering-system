// backend/database.js
require("dotenv").config();
const mysql = require("mysql2/promise");
const fs = require("fs");

// Aiven MySQL connection
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DATABASE,
  ssl: {
    ca: fs.readFileSync("./certs/ca.pem")  // Aiven CA certificate
  }
};

let connection;

// Initialize database + tables
async function initialize() {
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log("Connected to Aiven MySQL");

    // Create tables table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tables (
        id INT AUTO_INCREMENT PRIMARY KEY,
        table_number VARCHAR(50) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create orders table
    await connection.execute(`
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

    // Create menu_items table
    await connection.execute(`
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

    // Insert tables T1–T10
    for (let i = 1; i <= 10; i++) {
      await connection.execute(
        `INSERT IGNORE INTO tables (table_number, status) VALUES (?, ?)`,
        [`T${i}`, "available"]
      );
    }

    // Menu items
    const items = [
      { name: 'Espresso', desc: 'Strong black coffee', price: 2.50, cat: 'Beverages' },
      { name: 'Cappuccino', desc: 'Espresso with steamed milk foam', price: 3.50, cat: 'Beverages' },
      { name: 'Latte', desc: 'Espresso with steamed milk', price: 3.75, cat: 'Beverages' },
      { name: 'Americano', desc: 'Espresso with hot water', price: 2.75, cat: 'Beverages' },
      { name: 'Iced Coffee', desc: 'Cold brew coffee over ice', price: 3.25, cat: 'Beverages' },
      { name: 'Hot Chocolate', desc: 'Rich chocolate drink', price: 3.50, cat: 'Beverages' },
      { name: 'Green Tea', desc: 'Fresh brewed green tea', price: 2.25, cat: 'Beverages' },

      { name: 'Croissant', desc: 'Buttery French pastry', price: 2.50, cat: 'Pastries' },
      { name: 'Blueberry Muffin', desc: 'Fresh baked muffin', price: 3.00, cat: 'Pastries' },
      { name: 'Chocolate Cake', desc: 'Rich chocolate layer cake', price: 4.50, cat: 'Desserts' },
      { name: 'Cheesecake', desc: 'Classic New York style', price: 4.75, cat: 'Desserts' },
      { name: 'Club Sandwich', desc: 'Triple decker with chicken', price: 7.50, cat: 'Food' },
      { name: 'Caesar Salad', desc: 'Crispy romaine with dressing', price: 6.50, cat: 'Food' },
      { name: 'Margherita Pizza', desc: 'Fresh tomato and mozzarella', price: 9.50, cat: 'Food' },
      { name: 'Pasta Carbonara', desc: 'Creamy bacon pasta', price: 8.50, cat: 'Food' },
      { name: 'Breakfast Bagel', desc: 'Egg, cheese, and bacon', price: 5.50, cat: 'Food' },
    ];

    for (const item of items) {
      await connection.execute(
        `INSERT IGNORE INTO menu_items (name, description, price, category)
         VALUES (?, ?, ?, ?)`,
        [item.name, item.desc, item.price, item.cat]
      );
    }

    console.log("Aiven MySQL Database initialized successfully");
  } catch (err) {
    console.error("Aiven DB init error:", err);
  }
}

// Helper query functions
async function run(query, params = []) {
  const [result] = await connection.execute(query, params);
  return result;
}

async function get(query, params = []) {
  const [rows] = await connection.execute(query, params);
  return rows[0] || null;
}

async function all(query, params = []) {
  const [rows] = await connection.execute(query, params);
  return rows;
}

module.exports = {
  initialize,
  run,
  get,
  all
};