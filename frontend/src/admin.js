export const API_URL = 'http://localhost:24245/api';
let currentFilter = 'all';
let currentQRCode = null;

// ================== TAB MANAGEMENT ==================
export function showTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

  document.getElementById(`${tabName}-tab`).classList.add('active');
  document.querySelector(`.tab-btn[onclick*="${tabName}"]`)?.classList.add('active');

  if (tabName === 'tables') loadTables();
  if (tabName === 'orders') loadOrders();
  if (tabName === 'menu') loadMenu();
  if (tabName === 'reservations') loadReservations();
}

// ================== STATS ==================
export async function loadStats() {
  try {
    const response = await fetch(`${API_URL}/stats`);
    const data = await response.json();
    document.getElementById('totalTables').textContent = data.totalTables || 0;
    document.getElementById('occupiedTables').textContent = data.occupiedTables || 0;
    document.getElementById('pendingOrders').textContent = data.pendingOrders || 0;
    document.getElementById('todayRevenue').textContent = `₹${(data.todayRevenue || 0).toFixed(2)}`;
  } catch (err) {
    console.error('Error loading stats:', err);
  }
}

// ================== TABLES ==================
export async function loadTables() {
  try {
    const response = await fetch(`${API_URL}/tables`);
    const data = await response.json();
    const tablesGrid = document.getElementById('tables-grid');
    tablesGrid.innerHTML = '';

    data.tables.forEach(table => {
      const tableCard = document.createElement('div');
      tableCard.className = `table-card ${table.status}`;
      tableCard.innerHTML = `
        <h3>🪑 ${table.table_number}</h3>
        <span class="status-badge ${table.status}">${table.status.toUpperCase()}</span>
        <div style="margin-top:15px;">
          <button class="btn-primary" id="qr-btn-${table.id}">Generate QR</button>
          <button class="btn-secondary" id="toggle-btn-${table.id}">
            ${table.status === 'available' ? 'Mark Occupied' : 'Mark Available'}
          </button>
        </div>
      `;
      tablesGrid.appendChild(tableCard);
      document.getElementById(`qr-btn-${table.id}`).onclick = () => showQRCode(table.id, table.table_number);
      document.getElementById(`toggle-btn-${table.id}`).onclick = () => toggleTableStatus(table.id, table.status);
    });
  } catch (err) {
    console.error('Error loading tables:', err);
  }
}

export async function toggleTableStatus(tableId, currentStatus) {
  const newStatus = currentStatus === 'available' ? 'occupied' : 'available';
  try {
    await fetch(`${API_URL}/tables/${tableId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    loadTables();
    loadStats();
  } catch (err) {
    console.error('Error updating table:', err);
  }
}

// ================== QR CODE ==================
export async function showQRCode(tableId, tableNumber) {
  try {
    const response = await fetch(`${API_URL}/qr/${tableId}`);
    const data = await response.json();
    currentQRCode = data.qrCode;
    document.getElementById('qr-container').innerHTML = `<img src="${data.qrCode}" alt="QR Code"/>`;
    document.getElementById('qr-table-info').textContent = `Table: ${tableNumber}`;
    document.getElementById('qr-modal').style.display = 'block';
  } catch (err) {
    console.error('Error generating QR code:', err);
  }
}

export function closeModal() {
  document.getElementById('qr-modal').style.display = 'none';
}

export function downloadQR() {
  if (currentQRCode) {
    const link = document.createElement('a');
    link.href = currentQRCode;
    link.download = `table-qr-${Date.now()}.png`;
    link.click();
  }
}

// ================== ORDERS ==================
export async function loadOrders() {
  try {
    const response = await fetch(`${API_URL}/orders`);
    const data = await response.json();
    const ordersList = document.getElementById('orders-list');
    ordersList.innerHTML = '';

    const filteredOrders = currentFilter === 'all' ? data.orders : data.orders.filter(o => o.status === currentFilter);

    if (!filteredOrders.length) {
      ordersList.innerHTML = '<p style="text-align:center;color:#666;">No orders found</p>';
      return;
    }

    filteredOrders.forEach(order => {
      const orderCard = document.createElement('div');
      orderCard.className = 'order-card';

      const itemsHTML = order.items.map(item => `
        <div class="order-item">
          <span>${item.name} x${item.quantity}</span>
          <span>₹${(item.price*item.quantity).toFixed(2)}</span>
        </div>
      `).join('');

      orderCard.innerHTML = `
        <div class="order-header">
          <div><strong>Order #${order.id}</strong> - Table ${order.table_number}<br>
          <small>${new Date(order.created_at).toLocaleString()}</small></div>
          <span class="status-badge ${order.status}">${order.status.toUpperCase()}</span>
        </div>
        <div class="order-items">${itemsHTML}</div>
        <div class="order-total">Total: ₹${order.total.toFixed(2)}</div>
        <div style="margin-top:15px;">
          ${order.status !== 'completed' ? `
            <button class="btn-success" id="preparing-${order.id}">Preparing</button>
            <button class="btn-primary" id="ready-${order.id}">Ready</button>
            <button class="btn-secondary" id="completed-${order.id}">Complete</button>
          ` : '<span style="color:#28a745;">✓ Completed</span>'}
        </div>
      `;
      ordersList.appendChild(orderCard);

      if (order.status !== 'completed') {
        document.getElementById(`preparing-${order.id}`).onclick = () => updateOrderStatus(order.id, 'preparing');
        document.getElementById(`ready-${order.id}`).onclick = () => updateOrderStatus(order.id, 'ready');
        document.getElementById(`completed-${order.id}`).onclick = () => updateOrderStatus(order.id, 'completed');
      }
    });
  } catch (err) {
    console.error('Error loading orders:', err);
  }
}

export function filterOrders(status, event) {
  currentFilter = status;
  document.querySelectorAll('.orders-filter .filter-btn').forEach(btn => btn.classList.remove('active'));
  if (event) event.target.classList.add('active');
  loadOrders();
}

export async function updateOrderStatus(orderId, status) {
  try {
    await fetch(`${API_URL}/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    loadOrders();
    loadStats();
  } catch (err) {
    console.error('Error updating order:', err);
  }
}

// ================== MENU ==================
export async function loadMenu() {
  try {
    const response = await fetch(`${API_URL}/menu`);
    console.log('Response:', response);

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    const items = data.items || [];
    console.log('Menu items:', items);

    const menuList = document.getElementById('menu-list');
    menuList.innerHTML = '';

    if (!items.length) {
      menuList.innerHTML = '<p style="text-align:center;color:#666;">No menu items found</p>';
      return;
    }

    const categories = {};
    items.forEach(item => {
      if (!categories[item.category]) categories[item.category] = [];
      categories[item.category].push(item);
    });

    Object.keys(categories).forEach(cat => {
      const section = document.createElement('div');
      section.innerHTML = `<h3 style="margin:20px 0 10px 0;">${cat}</h3>`;
      const grid = document.createElement('div');
      grid.className = 'menu-grid';

      categories[cat].forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'menu-item';
        itemCard.innerHTML = `
          <h3>${item.name}</h3>
          <p>${item.description || ''}</p>
          <div class="price">₹${item.price.toFixed(2)}</div>
          <span class="status-badge ${item.available ? 'available' : 'occupied'}">
            ${item.available ? 'Available' : 'Unavailable'}
          </span>
        `;
        grid.appendChild(itemCard);
      });

      section.appendChild(grid);
      menuList.appendChild(section);
    });
  } catch (err) {
    console.error('Error loading menu:', err);
    const menuList = document.getElementById('menu-list');
    if(menuList) menuList.innerHTML = '<p style="text-align:center;color:red;">Failed to load menu items</p>';
  }
}

// Open/Close Add Menu Modal
export function openAddMenuModal() {
  const modal = document.getElementById('add-menu-modal');
  if(modal) modal.style.display = 'block';
}
export function closeAddMenuModal() {
  const modal = document.getElementById('add-menu-modal');
  if(modal) modal.style.display = 'none';
}

// Add New Menu Item
export async function addMenuItem(event) {
  event.preventDefault();
  const form = event.target;
  const name = form['item-name'].value.trim();
  const description = form['item-description'].value.trim();
  const price = parseFloat(form['item-price'].value);
  const category = form['item-category'].value;

  if (!name || !category || isNaN(price)) {
    alert('Please fill all required fields correctly.');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/menu`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({name, description, price, category})
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.message || 'Failed to add menu item');
    }

    form.reset();          // Clear the form
    closeAddMenuModal();   // Close modal

    await loadMenu();      // Reload menu immediately
  } catch(err) {
    console.error('Error adding menu item:', err);
    alert(err.message || 'Failed to add menu item');
  }
}

// ================== RESERVATIONS ==================
export async function loadReservations() {
  try {
    const response = await fetch(`${API_URL}/reservations`);
    const data = await response.json();
    const list = document.getElementById('reservations-list');
    list.innerHTML = '';

    if(!data.reservations.length) {
      list.innerHTML = '<p style="text-align:center;color:#666;">No reservations found</p>';
      return;
    }

    data.reservations.forEach(res => {
      const card = document.createElement('div');
      card.className = 'order-card';
      card.innerHTML = `
        <div class="order-header">
          <div>
            <strong>Reservation #${res.id}</strong> - Table ${res.table_number}<br>
            <small>${new Date(res.reserved_time).toLocaleString()}</small>
          </div>
          <span class="status-badge ${res.status}">${res.status.toUpperCase()}</span>
        </div>
        <div style="margin-top:10px;">
          ${res.status === 'reserved' ? `
            <button class="btn-secondary" onclick="updateReservationStatus(${res.id}, 'cancelled')">Cancel</button>
            <button class="btn-primary" onclick="updateReservationStatus(${res.id}, 'completed')">Complete</button>
          `: ''}
        </div>
      `;
      list.appendChild(card);
    });
  } catch(err) {
    console.error('Error loading reservations:', err);
  }
}

export async function updateReservationStatus(id, status) {
  try {
    await fetch(`${API_URL}/reservations/${id}`, {
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({status})
    });
    loadReservations();
    loadTables();
    loadStats();
  } catch(err) {
    console.error('Error updating reservation:', err);
  }
}

// ================== CLOSE MODAL ON CLICK OUTSIDE ==================
window.onclick = function(event) {
  const modal = document.getElementById('qr-modal');
  if(event.target === modal) closeModal();

  const addMenuModal = document.getElementById('add-menu-modal');
  if(event.target === addMenuModal) closeAddMenuModal();
};