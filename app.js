// app.js - Customer Interface
const API_URL = 'http://localhost:3000/api';
let tableId = null;
let cart = [];
let menuItems = [];
let currentCategory = 'all';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Get table ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    tableId = urlParams.get('table');
    
    if (!tableId) {
        alert('Please scan a valid QR code');
        return;
    }
    
    loadTable();
    loadMenu();
    loadMyOrders();
    
    // Refresh orders every 10 seconds
    setInterval(loadMyOrders, 10000);
});

// Load Table Info
async function loadTable() {
    try {
        const response = await fetch(`${API_URL}/tables/${tableId}`);
        const data = await response.json();
        
        if (data.table) {
            document.getElementById('table-number').textContent = data.table.table_number;
        }
    } catch (error) {
        console.error('Error loading table:', error);
    }
}

// Tab Management
function showCustomerTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');
    
    if (tabName === 'myorders') {
        loadMyOrders();
    }
}

// Load Menu
async function loadMenu() {
    try {
        const response = await fetch(`${API_URL}/menu`);
        const data = await response.json();
        
        menuItems = data.items;
        displayMenu();
    } catch (error) {
        console.error('Error loading menu:', error);
    }
}

// Display Menu
function displayMenu() {
    const menuContainer = document.getElementById('menu-items');
    menuContainer.innerHTML = '';
    
    const filteredItems = currentCategory === 'all' 
        ? menuItems 
        : menuItems.filter(item => item.category === currentCategory);
    
    filteredItems.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'menu-item';
        
        const cartItem = cart.find(c => c.id === item.id);
        const quantity = cartItem ? cartItem.quantity : 0;
        
        itemCard.innerHTML = `
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <div class="price">$${item.price.toFixed(2)}</div>
            <div class="quantity-control">
                <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
                <span class="quantity-display" id="qty-${item.id}">${quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
            </div>
        `;
        menuContainer.appendChild(itemCard);
    });
}

// Filter Category
function filterCategory(category) {
    currentCategory = category;
    
    document.querySelectorAll('.category-filter .filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    displayMenu();
}

// Update Quantity
function updateQuantity(itemId, change) {
    const item = menuItems.find(m => m.id === itemId);
    if (!item) return;
    
    const cartItemIndex = cart.findIndex(c => c.id === itemId);
    
    if (cartItemIndex >= 0) {
        cart[cartItemIndex].quantity += change;
        if (cart[cartItemIndex].quantity <= 0) {
            cart.splice(cartItemIndex, 1);
        }
    } else if (change > 0) {
        cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1
        });
    }
    
    updateCartDisplay();
    displayMenu();
}

// Update Cart Display
function updateCartDisplay() {
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    document.getElementById('cart-count').textContent = cartCount;
    document.getElementById('cart-total').textContent = cartTotal.toFixed(2);
    
    const cartItemsContainer = document.getElementById('cart-items');
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align: center; color: #666;">Your cart is empty</p>';
        document.getElementById('place-order-btn').disabled = true;
        return;
    }
    
    document.getElementById('place-order-btn').disabled = false;
    cartItemsContainer.innerHTML = '';
    
    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>$${item.price.toFixed(2)} each</p>
            </div>
            <div class="cart-item-actions">
                <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
                <span class="quantity-display">${item.quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                <span style="margin-left: 15px; font-weight: bold;">
                    $${(item.price * item.quantity).toFixed(2)}
                </span>
            </div>
        `;
        cartItemsContainer.appendChild(cartItem);
    });
}

// Place Order
async function placeOrder() {
    if (cart.length === 0) {
        alert('Your cart is empty');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                table_id: tableId,
                items: cart,
                total: total
            })
        });
        
        if (response.ok) {
            alert('Order placed successfully! 🎉');
            cart = [];
            updateCartDisplay();
            displayMenu();
            loadMyOrders();
            
            // Switch to my orders tab
            showCustomerTab('myorders');
        } else {
            throw new Error('Failed to place order');
        }
    } catch (error) {
        console.error('Error placing order:', error);
        alert('Failed to place order. Please try again.');
    }
}

// Load My Orders
async function loadMyOrders() {
    if (!tableId) return;
    
    try {
        const response = await fetch(`${API_URL}/orders/table/${tableId}`);
        const data = await response.json();
        
        const ordersList = document.getElementById('my-orders-list');
        ordersList.innerHTML = '';
        
        if (data.orders.length === 0) {
            ordersList.innerHTML = '<p style="text-align: center; color: #666;">No orders yet</p>';
            return;
        }
        
        data.orders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = 'order-card';
            
            const itemsHTML = order.items.map(item => `
                <div class="order-item">
                    <span>${item.name} x${item.quantity}</span>
                    <span>$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `).join('');
            
            const statusEmoji = {
                'pending': '⏳',
                'preparing': '👨‍🍳',
                'ready': '✅',
                'completed': '🎉'
            };
            
            orderCard.innerHTML = `
                <div class="order-header">
                    <div>
                        <strong>Order #${order.id}</strong>
                        <br><small>${new Date(order.created_at).toLocaleString()}</small>
                    </div>
                    <span class="status-badge ${order.status}">
                        ${statusEmoji[order.status]} ${order.status.toUpperCase()}
                    </span>
                </div>
                <div class="order-items">
                    ${itemsHTML}
                </div>
                <div class="order-total">Total: $${order.total.toFixed(2)}</div>
            `;
            ordersList.appendChild(orderCard);
        });
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Call Waiter
function callWaiter() {
    // In a real application, this would send a notification to the admin panel
    alert('Waiter called! 🔔\nSomeone will be with you shortly.');
    
    // You could implement WebSocket or Server-Sent Events for real-time notifications
    console.log('Waiter called for table:', tableId);
}