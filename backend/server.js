// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Initialize database
db.initialize();

// ============ TABLES ============

// Get all tables
app.get('/api/tables', (req, res) => {
  const sql = 'SELECT * FROM tables ORDER BY table_number';
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ tables: rows });
  });
});

// Get specific table
app.get('/api/tables/:id', (req, res) => {
  const sql = 'SELECT * FROM tables WHERE id = ?';
  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Table not found' });
    }
    res.json({ table: row });
  });
});

// Create new table
app.post('/api/tables', (req, res) => {
  const { table_number } = req.body;
  const sql = 'INSERT INTO tables (table_number, status) VALUES (?, ?)';
  
  db.run(sql, [table_number, 'available'], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ 
      id: this.lastID,
      table_number,
      status: 'available'
    });
  });
});

// Update table status
app.put('/api/tables/:id', (req, res) => {
  const { status } = req.body;
  const sql = 'UPDATE tables SET status = ? WHERE id = ?';
  
  db.run(sql, [status, req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Table updated successfully' });
  });
});

// ============ ORDERS ============

// Get all orders
app.get('/api/orders', (req, res) => {
  const sql = `
    SELECT o.*, t.table_number 
    FROM orders o
    LEFT JOIN tables t ON o.table_id = t.id
    ORDER BY o.created_at DESC
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const orders = rows.map(row => ({
      ...row,
      items: JSON.parse(row.items)
    }));
    res.json({ orders });
  });
});

// Get orders for specific table
app.get('/api/orders/table/:tableId', (req, res) => {
  const sql = `
    SELECT * FROM orders 
    WHERE table_id = ? 
    ORDER BY created_at DESC
  `;
  
  db.all(sql, [req.params.tableId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const orders = rows.map(row => ({
      ...row,
      items: JSON.parse(row.items)
    }));
    res.json({ orders });
  });
});

// Create new order
app.post('/api/orders', (req, res) => {
  const { table_id, items, total } = req.body;
  const sql = `
    INSERT INTO orders (table_id, items, total, status)
    VALUES (?, ?, ?, ?)
  `;
  
  db.run(sql, [table_id, JSON.stringify(items), total, 'pending'], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Update table status to occupied
    db.run('UPDATE tables SET status = ? WHERE id = ?', ['occupied', table_id]);
    
    res.json({ 
      id: this.lastID,
      table_id,
      items,
      total,
      status: 'pending'
    });
  });
});

// Update order status
app.put('/api/orders/:id', (req, res) => {
  const { status } = req.body;
  const sql = 'UPDATE orders SET status = ? WHERE id = ?';
  
  db.run(sql, [status, req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Order updated successfully' });
  });
});

// ============ MENU ============

// Get menu items
app.get('/api/menu', (req, res) => {
  const sql = 'SELECT * FROM menu_items WHERE available = 1 ORDER BY category, name';
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ items: rows });
  });
});

// Add menu item
app.post('/api/menu', (req, res) => {
  const { name, description, price, category } = req.body;
  const sql = `
    INSERT INTO menu_items (name, description, price, category, available)
    VALUES (?, ?, ?, ?, 1)
  `;
  
  db.run(sql, [name, description, price, category], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ 
      id: this.lastID,
      name,
      description,
      price,
      category,
      available: true
    });
  });
});

// ============ QR CODE ============

// Generate QR code for table
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

// Get dashboard stats
app.get('/api/stats', (req, res) => {
  const queries = {
    totalTables: 'SELECT COUNT(*) as count FROM tables',
    occupiedTables: "SELECT COUNT(*) as count FROM tables WHERE status = 'occupied'",
    pendingOrders: "SELECT COUNT(*) as count FROM orders WHERE status = 'pending'",
    todayRevenue: `
      SELECT COALESCE(SUM(total), 0) as revenue 
      FROM orders 
      WHERE DATE(created_at) = DATE('now')
    `
  };
  
  const stats = {};
  let completed = 0;
  
  Object.keys(queries).forEach(key => {
    db.get(queries[key], [], (err, row) => {
      if (!err) {
        stats[key] = row.count !== undefined ? row.count : row.revenue;
      }
      completed++;
      if (completed === Object.keys(queries).length) {
        res.json(stats);
      }
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Cafe Management System is ready!');
});