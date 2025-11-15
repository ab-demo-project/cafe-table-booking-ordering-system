// admin.js
const API_URL = 'http://localhost:3000/api';
let currentFilter = 'all';
let currentQRCode = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadTables();
    loadOrders();
    
    // Refresh data every 10 seconds
    setInterval(() => {
        loadStats();
        loadTables();
        loadOrders();
    }, 10000);
});

// Tab Management
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');
    
    // Load data for the tab
    if (tabName === 'tables') loadTables();
    if (tabName === 'orders') loadOrders();
    if (tabName === 'menu') loadMenu();
}

// Load Statistics
async function loadStats() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        const data = await response.json();
        
        document.getElementById('totalTables').textContent = data.totalTables || 0;
        document.getElementById('occupiedTables').textContent = data.occupiedTables || 0;
        document.getElementById('pendingOrders').textContent = data.pendingOrders || 0;
        document.getElementById('todayRevenue').textContent = `$${(data.todayRevenue || 0).toFixed(2)}`;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load Tables
async function loadTables() {
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
                <div style="margin-top: 15px;">
                    <button class="btn-primary" onclick="showQRCode('${table.id}', '${table.table_number}')">
                        Generate QR
                    </button>
                    <button class="btn-secondary" onclick="toggleTableStatus('${table.id}', '${table.status}')">
                        ${table.status === 'available' ? 'Mark Occupied' : 'Mark Available'}
                    </button>
                </div>
            `;
            tablesGrid.appendChild(tableCard);
        });
    } catch (error) {
        console.error('Error loading tables:', error);
    }
}

// Show QR Code
async function showQRCode(tableId, tableNumber) {
    try {
        const response = await fetch(`${API_URL}/qr/${tableId}`);
        const data = await response.json();
        
        currentQRCode = data.qrCode;
        document.getElementById('qr-container').innerHTML = `<img src="${data.qrCode}" alt="QR Code">`;
        document.getElementById('qr-table-info').textContent = `Table: ${tableNumber}`;
        document.getElementById('qr-modal').style.display = 'block';
    } catch (error) {
        console.error('Error generating QR code:', error);
        alert('Failed to generate QR code');
    }
}

// Close Modal
function closeModal() {
    document.getElementById('qr-modal').style.display = 'none';
}

// Download QR Code
function downloadQR() {
    if (currentQRCode) {
        const link = document.createElement('a');
        link.href = currentQRCode;
        link.download = `table-qr-${Date.now()}.png`;
        link.click();
    }
}

// Toggle Table Status
async function toggleTableStatus(tableId, currentStatus) {
    const newStatus = currentStatus === 'available' ? 'occupied' : 'available';
    
    try {
        await fetch(`${API_URL}/tables/${tableId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        
        loadTables();
        loadStats();
    } catch (error) {
        console.error('Error updating table:', error);
        alert('Failed to update table status');
    }
}

// Load Orders
async function loadOrders() {
    try {
        const response = await fetch(`${API_URL}/orders`);
        const data = await response.json();
        
        const ordersList = document.getElementById('orders-list');
        ordersList.innerHTML = '';
        
        const filteredOrders = currentFilter === 'all' 
            ? data.orders 
            : data.orders.filter(order => order.status === currentFilter);
        
        if (filteredOrders.length === 0) {
            ordersList.innerHTML = '<p style="text-align: center; color: #666;">No orders found</p>';
            return;
        }
        
        filteredOrders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = 'order-card';
            
            const itemsHTML = order.items.map(item => `
                <div class="order-item">
                    <span>${item.name} x${item.quantity}</span>
                    <span>$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `).join('');
            
            orderCard.innerHTML = `
                <div class="order-header">
                    <div>
                        <strong>Order #${order.id}</strong> - Table ${order.table_number}
                        <br><small>${new Date(order.created_at).toLocaleString()}</small>
                    </div>
                    <span class="status-badge ${order.status}">${order.status.toUpperCase()}</span>
                </div>
                <div class="order-items">
                    ${itemsHTML}
                </div>
                <div class="order-total">Total: $${order.total.toFixed(2)}</div>
                <div style="margin-top: 15px;">
                    ${order.status !== 'completed' ? `
                        <button class="btn-success" onclick="updateOrderStatus('${order.id}', 'preparing')">
                            Preparing
                        </button>
                        <button class="btn-primary" onclick="updateOrderStatus('${order.id}', 'ready')">
                            Ready
                        </button>
                        <button class="btn-secondary" onclick="updateOrderStatus('${order.id}', 'completed')">
                            Complete
                        </button>
                    ` : '<span style="color: #28a745;">✓ Completed</span>'}
                </div>
            `;
            ordersList.appendChild(orderCard);
        });
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Filter Orders
function filterOrders(status) {
    currentFilter = status;
    
    document.querySelectorAll('.orders-filter .filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    loadOrders();
}

// Update Order Status
async function updateOrderStatus(orderId, status) {
    try {
        await fetch(`${API_URL}/orders/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        
        loadOrders();
        loadStats();
    } catch (error) {
        console.error('Error updating order:', error);
        alert('Failed to update order status');
    }
}

// Load Menu
async function loadMenu() {
    try {
        const response = await fetch(`${API_URL}/menu`);
        const data = await response.json();
        
        const menuList = document.getElementById('menu-list');
        menuList.innerHTML = '';
        
        const categories = {};
        data.items.forEach(item => {
            if (!categories[item.category]) {
                categories[item.category] = [];
            }
            categories[item.category].push(item);
        });
        
        Object.keys(categories).forEach(category => {
            const categorySection = document.createElement('div');
            categorySection.innerHTML = `<h3 style="margin: 20px 0 10px 0;">${category}</h3>`;
            
            const itemsGrid = document.createElement('div');
            itemsGrid.className = 'menu-grid';
            
            categories[category].forEach(item => {
                const itemCard = document.createElement('div');
                itemCard.className = 'menu-item';
                itemCard.innerHTML = `
                    <h3>${item.name}</h3>
                    <p>${item.description}</p>
                    <div class="price">$${item.price.toFixed(2)}</div>
                    <span class="status-badge ${item.available ? 'available' : 'occupied'}">
                        ${item.available ? 'Available' : 'Unavailable'}
                    </span>
                `;
                itemsGrid.appendChild(itemCard);
            });
            
            categorySection.appendChild(itemsGrid);
            menuList.appendChild(categorySection);
        });
    } catch (error) {
        console.error('Error loading menu:', error);
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('qr-modal');
    if (event.target === modal) {
        closeModal();
    }
}