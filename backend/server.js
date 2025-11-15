// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const { db, initialize } = require('./database'); // ✅ destructure pool and init

const app = express();
const PORT = process.env.PORT || 24245;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Wait for DB initialization before starting server
async function start() {
  try {
    await initialize();
  } catch (err) {
    console.error('Failed to initialize DB. Exiting.', err);
    process.exit(1);
  }

  // ================= HEALTH CHECK =================
  app.get("/api/health", async (req, res) => {
    try {
      await db.query("SELECT 1"); // pool query works now
      res.json({ status: "ok", database: "connected" });
    } catch (err) {
      console.error("HEALTH CHECK DB ERROR:", err);
      res.json({ status: "error", database: "disconnected", message: err.message });
    }
  });

  // ================= TABLES =================
  app.get('/api/tables', async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM tables ORDER BY table_number');
      res.json({ tables: rows });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/tables/:id', async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM tables WHERE id = ? LIMIT 1', [req.params.id]);
      if (!rows || rows.length === 0) return res.status(404).json({ error: 'Table not found' });
      res.json({ table: rows[0] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/tables', async (req, res) => {
    try {
      const { table_number } = req.body;
      const [result] = await db.query('INSERT INTO tables (table_number, status) VALUES (?, ?)', [table_number, 'available']);
      res.json({ id: result.insertId, table_number, status: 'available' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/tables/:id', async (req, res) => {
    try {
      const { status } = req.body;
      await db.query('UPDATE tables SET status = ? WHERE id = ?', [status, req.params.id]);
      res.json({ message: 'Table updated successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ================= MENU =================
  app.get('/api/menu', async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM menu_items WHERE available = 1 ORDER BY category, name');
      res.json({ items: rows });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/menu', async (req, res) => {
    try {
      const { name, description, price, category } = req.body;
      const [result] = await db.query(
        'INSERT INTO menu_items (name, description, price, category, available) VALUES (?, ?, ?, ?, 1)',
        [name, description, price, category]
      );
      res.json({ id: result.insertId, name, description, price, category, available: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ================= ORDERS =================
  app.get('/api/orders', async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT o.*, t.table_number
        FROM orders o
        LEFT JOIN tables t ON o.table_id = t.id
        ORDER BY o.created_at DESC
      `);
      const orders = rows.map(r => ({ ...r, items: JSON.parse(r.items) }));
      res.json({ orders });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/orders/table/:tableId', async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM orders WHERE table_id = ? ORDER BY created_at DESC', [req.params.tableId]);
      const orders = rows.map(r => ({ ...r, items: JSON.parse(r.items) }));
      res.json({ orders });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/orders', async (req, res) => {
    try {
      const { table_id, items, total } = req.body;
      const itemsStr = JSON.stringify(items);
      const [result] = await db.query('INSERT INTO orders (table_id, items, total, status) VALUES (?, ?, ?, ?)', [table_id, itemsStr, total, 'pending']);
      await db.query('UPDATE tables SET status = ? WHERE id = ?', ['occupied', table_id]);
      res.json({ id: result.insertId, table_id, items, total, status: 'pending' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/orders/:id', async (req, res) => {
    try {
      const { status } = req.body;
      await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
      res.json({ message: 'Order updated successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ================= QR CODE =================
  app.get('/api/qr/:tableId', async (req, res) => {
    try {
      const tableId = req.params.tableId;
      const frontendUrl = process.env.FRONTEND_URL || `http://localhost:3000/table.html`;
      const url = `${frontendUrl}?table=${tableId}`;
      const qrDataUrl = await QRCode.toDataURL(url);
      res.json({ qrCode: qrDataUrl, url });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ================= STATS =================
  app.get('/api/stats', async (req, res) => {
    try {
      const [[totalTablesRow]] = await db.query('SELECT COUNT(*) AS count FROM tables');
      const [[occupiedTablesRow]] = await db.query(`SELECT COUNT(*) AS count FROM tables WHERE status = 'occupied'`);
      const [[pendingOrdersRow]] = await db.query(`SELECT COUNT(*) AS count FROM orders WHERE status = 'pending'`);
      const [[todayRevenueRow]] = await db.query(`SELECT COALESCE(SUM(total),0) AS revenue FROM orders WHERE DATE(created_at) = CURRENT_DATE()`);

      res.json({
        totalTables: totalTablesRow.count,
        occupiedTables: occupiedTablesRow.count,
        pendingOrders: pendingOrdersRow.count,
        todayRevenue: todayRevenueRow.revenue
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ================= START SERVER =================
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Cafe Management System connected to MySQL!');
  });
}

start();