import { useState } from 'react'
import './index.css'
import './admin.js'
function App() {
  const [count, setCount] = useState(0)
  return (
    <>
      <div class="admin-container">
        <header>
            <h1>☕ Cafe Management System</h1>
            <div class="stats">
                <div class="stat-card">
                    <h3 id="totalTables">0</h3>
                    <p>Total Tables</p>
                </div>
                <div class="stat-card">
                    <h3 id="occupiedTables">0</h3>
                    <p>Occupied</p>
                </div>
                <div class="stat-card">
                    <h3 id="pendingOrders">0</h3>
                    <p>Pending Orders</p>
                </div>
                <div class="stat-card">
                    <h3 id="todayRevenue">$0</h3>
                    <p>Today's Revenue</p>
                </div>
            </div>
        </header>
        <div class="tabs">
            <button class="tab-btn active" onclick="showTab('tables')">Tables</button>
            <button class="tab-btn" onclick="showTab('orders')">Orders</button>
            <button class="tab-btn" onclick="showTab('menu')">Menu</button>
        </div>
        <div id="tables-tab" class="tab-content active">
            <h2>Table Management</h2>
            <div id="tables-grid" class="tables-grid"></div>
        </div>
        <div id="orders-tab" class="tab-content">
            <h2>Order Management</h2>
            <div class="orders-filter">
                <button onclick="filterOrders('all')" class="filter-btn active">All</button>
                <button onclick="filterOrders('pending')" class="filter-btn">Pending</button>
                <button onclick="filterOrders('preparing')" class="filter-btn">Preparing</button>
                <button onclick="filterOrders('ready')" class="filter-btn">Ready</button>
                <button onclick="filterOrders('completed')" class="filter-btn">Completed</button>
            </div>
            <div id="orders-list" class="orders-list"></div>
        </div>
        <div id="menu-tab" class="tab-content">
            <h2>Menu Items</h2>
            <button onclick="showAddMenuItem()" class="btn-primary">Add New Item</button>
            <div id="menu-list" class="menu-list"></div>
        </div>
      </div>
      <div id="qr-modal" class="modal">
          <div class="modal-content">
              <span class="close" onclick="closeModal()">&times;</span>
              <h2>Table QR Code</h2>
              <div id="qr-container"></div>
              <p id="qr-table-info"></p>
              <button onclick="downloadQR()" class="btn-primary">Download QR Code</button>
          </div>
      </div>
      <script src="admin.js"></script>
    </>
  )
}
export default App