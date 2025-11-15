import { useEffect } from 'react';
import './index.css';
import {
  loadStats,
  loadTables,
  loadOrders,
  loadMenu,
  loadReservations,
  showTab,
  filterOrders,
  closeModal,
  downloadQR,
  openAddMenuModal,
  closeAddMenuModal,
  addMenuItem
} from './admin.js';

function App() {
  useEffect(() => {
    loadStats();
    loadTables();
    loadOrders();
    loadMenu();
    loadReservations();

    const interval = setInterval(() => {
      loadStats();
      loadTables();
      loadOrders();
      loadMenu();
      loadReservations();
    }, 10000);

    return () => clearInterval(interval); // cleanup
  }, []);

  return (
    <div className="admin-container">
      <header>
        <h1>☕ Cafe Management System</h1>
        <div className="stats">
          <div className="stat-card">
            <h3 id="totalTables">0</h3>
            <p>Total Tables</p>
          </div>
          <div className="stat-card">
            <h3 id="occupiedTables">0</h3>
            <p>Occupied</p>
          </div>
          <div className="stat-card">
            <h3 id="pendingOrders">0</h3>
            <p>Pending Orders</p>
          </div>
          <div className="stat-card">
            <h3 id="todayRevenue">₹0.00</h3> {/* Changed to ₹ */}
            <p>Today's Revenue</p>
          </div>
        </div>
      </header>

      <div className="tabs">
        <button className="tab-btn active" onClick={() => showTab('tables')}>Tables</button>
        <button className="tab-btn" onClick={() => showTab('orders')}>Orders</button>
        <button className="tab-btn" onClick={() => showTab('menu')}>Menu</button>
        <button className="tab-btn" onClick={() => showTab('reservations')}>Reservations</button>
      </div>

      <div id="tables-tab" className="tab-content active">
        <h2>Table Management</h2>
        <div id="tables-grid" className="tables-grid"></div>
      </div>

      <div id="orders-tab" className="tab-content">
        <h2>Order Management</h2>
        <div className="orders-filter">
          <button onClick={(e) => filterOrders('all', e)} className="filter-btn active">All</button>
          <button onClick={(e) => filterOrders('pending', e)} className="filter-btn">Pending</button>
          <button onClick={(e) => filterOrders('preparing', e)} className="filter-btn">Preparing</button>
          <button onClick={(e) => filterOrders('ready', e)} className="filter-btn">Ready</button>
          <button onClick={(e) => filterOrders('completed', e)} className="filter-btn">Completed</button>
        </div>
        <div id="orders-list" className="orders-list"></div>
      </div>

      <div id="menu-tab" className="tab-content">
        <h2>Menu Items</h2>
        <button onClick={openAddMenuModal} className="btn-primary">Add New Item</button>
        <div id="menu-list" className="menu-list"></div>
        <div id="add-menu-modal" className="modal">
          <div className="modal-content menu-modal">
            <span className="close" onClick={closeAddMenuModal}>&times;</span>
            <h2 className="modal-title">Add New Menu Item</h2>
            <form id="add-menu-form" className="menu-form" onSubmit={addMenuItem}>
              <div className="form-group">
                <label htmlFor="item-name">Item Name *</label>
                <input type="text" id="item-name" name="item-name" placeholder="Enter item name" required />
              </div>
              <div className="form-group">
                <label htmlFor="item-description">Description</label>
                <textarea id="item-description" name="item-description" rows="3" placeholder="Enter description"></textarea>
              </div>
              <div className="form-group">
                <label htmlFor="item-price">Amount (₹) *</label>
                <input type="number" id="item-price" name="item-price" step="0.01" min="0" placeholder="0.00" required />
              </div>
              <div className="form-group">
                <label htmlFor="item-category">Category *</label>
                <select id="item-category" name="item-category" required>
                  <option value="">Select Category</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Food">Food</option>
                  <option value="Pastries">Pastries</option>
                  <option value="Desserts">Desserts</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">Add Item</button>
                <button type="button" onClick={closeAddMenuModal} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div id="reservations-tab" className="tab-content">
        <h2>Table Reservations</h2>
        <div id="reservations-list" className="reservations-list"></div>
      </div>

      <div id="qr-modal" className="modal">
        <div className="modal-content">
          <span className="close" onClick={closeModal}>&times;</span>
          <h2>Table QR Code</h2>
          <div id="qr-container"></div>
          <p id="qr-table-info"></p>
          <button onClick={downloadQR} className="btn-primary">Download QR Code</button>
        </div>
      </div>
    </div>
  );
}

export default App;