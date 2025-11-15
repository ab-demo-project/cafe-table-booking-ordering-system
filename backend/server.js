require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');   // mysql2 connection + pool
const app = express();
const DB_PORT = process.env.DB_PORT || 24245;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Initialize DB tables (MySQL version)
db.initialize();

// ============ TABLES ============

// Get all tables
app.get('/api/tables', async (req, res) => {
  try {
    const [rows] = await db.pool.query(
      "SELECT * FROM tables ORDER BY table_number"
    );
    res.json({ tables: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get specific table
app.get('/api/tables/:id', async (req, res) => {
  try {
    const [rows] = await db.pool.query(
      "SELECT * FROM tables WHERE id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Table not found" });
    }

    res.json({ table: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new table
app.post('/api/tables', async (req, res) => {
  try {
    const { table_number } = req.body;

    const [result] = await db.pool.query(
      "INSERT INTO tables (table_number, status) VALUES (?, ?)",
      [table_number, "available"]
    );

    res.json({
      id: result.insertId,
      table_number,
      status: "available",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update table status
app.put('/api/tables/:id', async (req, res) => {
  try {
    const { status } = req.body;

    await db.pool.query(
      "UPDATE tables SET status = ? WHERE id = ?",
      [status, req.params.id]
    );

    res.json({ message: "Table updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ ORDERS ============

// Get all orders
app.get('/api/orders', async (req, res) => {
  try {
    const [rows] = await db.pool.query(`
      SELECT o.*, t.table_number 
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      ORDER BY o.created_at DESC
    `);

    rows.forEach(r => {
      r.items = JSON.parse(r.items);
    });

    res.json({ orders: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get orders for specific table
app.get('/api/orders/table/:tableId', async (req, res) => {
  try {
    const [rows] = await db.pool.query(
      "SELECT * FROM orders WHERE table_id = ? ORDER BY created_at DESC",
      [req.params.tableId]
    );

    rows.forEach(r => {
      r.items = JSON.parse(r.items);
    });

    res.json({ orders: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new order
app.post('/api/orders', async (req, res) => {
  try {
    const { table_id, items, total } = req.body;

    const [result] = await db.pool.query(
      "INSERT INTO orders (table_id, items, total, status) VALUES (?, ?, ?, ?)",
      [table_id, JSON.stringify(items), total, "pending"]
    );

    // Update table status to occupied
    await db.pool.query(
      "UPDATE tables SET status = 'occupied' WHERE id = ?",
      [table_id]
    );

    res.json({
      id: result.insertId,
      table_id,
      items,
      total,
      status: "pending",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update order status
app.put('/api/orders/:id', async (req, res) => {
  try {
    const { status } = req.body;

    await db.pool.query(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, req.params.id]
    );

    res.json({ message: "Order updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ MENU ============

// Get menu items
app.get('/api/menu', async (req, res) => {
  try {
    const [rows] = await db.pool.query(
      "SELECT * FROM menu_items WHERE available = 1 ORDER BY category, name"
    );
    res.json({ items: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add menu item
app.post('/api/menu', async (req, res) => {
  try {
    const { name, description, price, category } = req.body;

    const [result] = await db.pool.query(
      "INSERT INTO menu_items (name, description, price, category, available) VALUES (?, ?, ?, ?, 1)",
      [name, description, price, category]
    );

    res.json({
      id: result.insertId,
      name,
      description,
      price,
      category,
      available: true,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ QR CODE ============

app.get('/api/qr/:tableId', async (req, res) => {
  try {
    const tableId = req.params.tableId;
    const url = `http://localhost:3000/table.html?table=${tableId}`;
    const qrCode = await QRCode.toDataURL(url);

    res.json({ qrCode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ STATS ============

app.get("/api/stats", async (req, res) => {
  try {
    const [[{ count: totalTables }]] = await db.pool.query("SELECT COUNT(*) AS count FROM tables");
    const [[{ count: occupiedTables }]] = await db.pool.query("SELECT COUNT(*) AS count FROM tables WHERE status = 'occupied'");
    const [[{ count: pendingOrders }]] = await db.pool.query("SELECT COUNT(*) AS count FROM orders WHERE status = 'pending'");
    const [[{ revenue: todayRevenue }]] = await db.pool.query(`
      SELECT COALESCE(SUM(total), 0) AS revenue
      FROM orders
      WHERE DATE(created_at) = CURRENT_DATE()
    `);

    res.json({ totalTables, occupiedTables, pendingOrders, todayRevenue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(DB_PORT, () => {
  console.log(`Server running on https://${process.env.DB_HOST}:${DB_PORT}`);
  console.log("Cafe Management System connected to Aiven MySQL!");
});