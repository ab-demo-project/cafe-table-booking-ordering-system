// backend/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, 'data', 'cafe.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Initialize database tables
function initialize() {
  db.serialize(() => {
    // Create tables table
    db.run(`
      CREATE TABLE IF NOT EXISTS tables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_number TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'available',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create orders table
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_id INTEGER NOT NULL,
        items TEXT NOT NULL,
        total REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (table_id) REFERENCES tables(id)
      )
    `);

    // Create menu_items table
    db.run(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        category TEXT NOT NULL,
        available BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert sample tables
    const insertTable = db.prepare('INSERT OR IGNORE INTO tables (table_number, status) VALUES (?, ?)');
    for (let i = 1; i <= 10; i++) {
      insertTable.run([`T${i}`, 'available']);
    }
    insertTable.finalize();

    // Insert sample menu items
    const menuItems = [
      // Beverages
      { name: 'Espresso', desc: 'Strong black coffee', price: 2.50, cat: 'Beverages' },
      { name: 'Cappuccino', desc: 'Espresso with steamed milk foam', price: 3.50, cat: 'Beverages' },
      { name: 'Latte', desc: 'Espresso with steamed milk', price: 3.75, cat: 'Beverages' },
      { name: 'Americano', desc: 'Espresso with hot water', price: 2.75, cat: 'Beverages' },
      { name: 'Iced Coffee', desc: 'Cold brew coffee over ice', price: 3.25, cat: 'Beverages' },
      { name: 'Hot Chocolate', desc: 'Rich chocolate drink', price: 3.50, cat: 'Beverages' },
      { name: 'Green Tea', desc: 'Fresh brewed green tea', price: 2.25, cat: 'Beverages' },
      
      // Food
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

    const insertMenu = db.prepare(`
      INSERT OR IGNORE INTO menu_items (name, description, price, category)
      VALUES (?, ?, ?, ?)
    `);
    
    menuItems.forEach(item => {
      insertMenu.run([item.name, item.desc, item.price, item.cat]);
    });
    insertMenu.finalize();

    console.log('Database initialized successfully');
  });
}

// Export database and helper functions
module.exports = {
  db,
  initialize,
  run: (...args) => db.run(...args),
  get: (...args) => db.get(...args),
  all: (...args) => db.all(...args),
};