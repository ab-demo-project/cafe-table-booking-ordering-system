import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './style.css'
function Table() {
  const [count, setCount] = useState(0)
  return (
    <>
      <div class="customer-container">
        <header class="customer-header">
            <h1>☕ Welcome to Our Cafe</h1>
            <p id="table-info">Table: <span id="table-number">-</span></p>
        </header>

        <div class="tabs">
            <button class="tab-btn active" onclick="showCustomerTab('menu')">Menu</button>
            <button class="tab-btn" onclick="showCustomerTab('cart')">Cart <span id="cart-count" class="badge">0</span></button>
            <button class="tab-btn" onclick="showCustomerTab('myorders')">My Orders</button>
        </div>
        <div id="menu-tab" class="tab-content active">
            <div class="category-filter">
                <button onclick="filterCategory('all')" class="filter-btn active">All</button>
                <button onclick="filterCategory('Beverages')" class="filter-btn">Beverages</button>
                <button onclick="filterCategory('Food')" class="filter-btn">Food</button>
                <button onclick="filterCategory('Pastries')" class="filter-btn">Pastries</button>
                <button onclick="filterCategory('Desserts')" class="filter-btn">Desserts</button>
            </div>
            <div id="menu-items" class="menu-grid"></div>
        </div>
        <div id="cart-tab" class="tab-content">
            <h2>Your Order</h2>
            <div id="cart-items" class="cart-items"></div>
            <div class="cart-summary">
                <h3>Total: $<span id="cart-total">0.00</span></h3>
                <button onclick="placeOrder()" class="btn-primary btn-large" id="place-order-btn">Place Order</button>
            </div>
        </div>
        <div id="myorders-tab" class="tab-content">
            <h2>Your Orders</h2>
            <div id="my-orders-list" class="orders-list"></div>
        </div>

        <div class="floating-actions">
            <button onclick="callWaiter()" class="btn-waiter">🔔 Call Waiter</button>
        </div>
      </div>
     <script src="app.js"></script>
    </>
  )
}
export default Table